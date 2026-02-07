import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';

interface SessionMetrics {
    focus_score: number;
    confusion_level: number;
    fatigue_score: number;
    engagement: number;
    frustration: number;
    blink_rate: number;
    head_stability: number;
}

interface FaceTrackingResult {
    isActive: boolean;
    isLoading: boolean;
    currentMetrics: SessionMetrics | null;
    error: string | null;
}

interface FaceLandmark {
    x: number;
    y: number;
    z?: number;
}

const ZERO_METRICS: SessionMetrics = {
    focus_score: 0,
    confusion_level: 0,
    fatigue_score: 0,
    engagement: 0,
    frustration: 0,
    blink_rate: 0,
    head_stability: 0,
};

const DISTRACTED_METRICS: SessionMetrics = {
    focus_score: 5,
    confusion_level: 10,
    fatigue_score: 20,
    engagement: 5,
    frustration: 30,
    blink_rate: 0,
    head_stability: 0.5,
};

export function useFaceTracking(
    subtopicId: string,
    enabled: boolean
): FaceTrackingResult {
    const { uid } = createOrGetUser();
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMetrics, setCurrentMetrics] = useState<SessionMetrics | null>(null);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef({
        startTime: Date.now(),
        metrics: [] as SessionMetrics[],
        videoRef: null as HTMLVideoElement | null,
        stream: null as MediaStream | null,
        faceLandmarker: null as any,
        animationFrameId: null as number | null,
        blinkHistory: new Uint8Array(100),
        blinkIndex: 0,
        blinkCount: 0,
        consecutiveClosedFrames: 0,
        headPoseHistory: new Float32Array(60),
        poseIndex: 0,
        poseCount: 0,
        isActive: false,
        prevMetrics: null as SessionMetrics | null,
        lastRecordTime: 0,
        lastDetectionTime: 0,
        lastUiUpdateTime: 0,
        isTabVisible: true,
        tabHiddenTime: 0,
        baseline: null as { browDistance: number; eyeOpenness: number } | null,
        reusableMetrics: { ...ZERO_METRICS },
    });

    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';
            sessionRef.current.isTabVisible = isVisible;

            if (!isVisible) {
                sessionRef.current.tabHiddenTime = Date.now();
                setCurrentMetrics(DISTRACTED_METRICS);
                sessionRef.current.metrics.push({ ...DISTRACTED_METRICS });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    useEffect(() => {
        if (!enabled || !subtopicId) return;

        let isMounted = true;

        const startTracking = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user', frameRate: { ideal: 15, max: 20 } }
                });

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                sessionRef.current.stream = stream;

                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                video.muted = true;
                sessionRef.current.videoRef = video;

                await video.play();

                await new Promise<void>((resolve) => {
                    if (video.readyState >= 2) resolve();
                    else video.onloadeddata = () => resolve();
                });

                const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );

                const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: false
                });

                sessionRef.current.faceLandmarker = faceLandmarker;

                if (!isMounted) {
                    faceLandmarker.close();
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                setIsActive(true);
                setIsLoading(false);
                sessionRef.current.isActive = true;

                let noFaceCount = 0;

                const detectLoop = () => {
                    if (!sessionRef.current.isActive || !isMounted) return;

                    const now = Date.now();

                    if (!sessionRef.current.isTabVisible) {
                        if (now - sessionRef.current.lastRecordTime > 2000) {
                            sessionRef.current.metrics.push({ ...DISTRACTED_METRICS });
                            sessionRef.current.lastRecordTime = now;
                        }
                        sessionRef.current.animationFrameId = requestAnimationFrame(detectLoop);
                        return;
                    }

                    if (now - sessionRef.current.lastDetectionTime < 66) {
                        sessionRef.current.animationFrameId = requestAnimationFrame(detectLoop);
                        return;
                    }
                    sessionRef.current.lastDetectionTime = now;

                    if (!sessionRef.current.faceLandmarker || !sessionRef.current.videoRef) {
                        sessionRef.current.animationFrameId = requestAnimationFrame(detectLoop);
                        return;
                    }

                    try {
                        const results = sessionRef.current.faceLandmarker.detectForVideo(
                            sessionRef.current.videoRef,
                            now
                        );

                        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                            noFaceCount = 0;
                            const landmarks = results.faceLandmarks[0];
                            calculateMetricsFromLandmarks(landmarks, sessionRef.current.reusableMetrics);

                            smoothMetricsInPlace(sessionRef.current.reusableMetrics, sessionRef.current.prevMetrics, 0.8);

                            if (!sessionRef.current.prevMetrics) {
                                sessionRef.current.prevMetrics = { ...sessionRef.current.reusableMetrics };
                            } else {
                                Object.assign(sessionRef.current.prevMetrics, sessionRef.current.reusableMetrics);
                            }

                            if (now - sessionRef.current.lastRecordTime > 2000) {
                                sessionRef.current.metrics.push({ ...sessionRef.current.reusableMetrics });
                                sessionRef.current.lastRecordTime = now;
                            }

                            if (now - sessionRef.current.lastUiUpdateTime > 200) {
                                setCurrentMetrics({ ...sessionRef.current.reusableMetrics });
                                sessionRef.current.lastUiUpdateTime = now;
                            }
                        } else {
                            noFaceCount++;
                            if (noFaceCount > 15 && now - sessionRef.current.lastUiUpdateTime > 200) {
                                setCurrentMetrics(ZERO_METRICS);
                                sessionRef.current.lastUiUpdateTime = now;
                            }
                        }
                    } catch {
                    }

                    sessionRef.current.animationFrameId = requestAnimationFrame(detectLoop);
                };

                requestAnimationFrame(detectLoop);

            } catch (err: any) {
                if (!isMounted) return;

                setIsActive(false);
                setIsLoading(false);
                sessionRef.current.isActive = false;

                if (err.name === 'NotReadableError') {
                    setError('Camera is in use by another app.');
                } else if (err.name === 'NotAllowedError') {
                    setError('Camera access denied.');
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found.');
                } else {
                    setError('Failed to start camera.');
                }
            }
        };

        setTimeout(startTracking, 100);

        return () => {
            isMounted = false;
            sessionRef.current.isActive = false;

            if (sessionRef.current.animationFrameId) {
                cancelAnimationFrame(sessionRef.current.animationFrameId);
            }

            if (sessionRef.current.stream) {
                sessionRef.current.stream.getTracks().forEach(track => track.stop());
            }

            if (sessionRef.current.faceLandmarker) {
                sessionRef.current.faceLandmarker.close();
                sessionRef.current.faceLandmarker = null;
            }

            if (sessionRef.current.metrics.length > 0) {
                sendSessionData();
            }

            setIsActive(false);
            setCurrentMetrics(null);
        };
    }, [subtopicId, enabled]);

    function smoothMetricsInPlace(metrics: SessionMetrics, prev: SessionMetrics | null, alpha: number) {
        if (!prev) return;
        const invAlpha = 1 - alpha;
        metrics.focus_score = prev.focus_score * invAlpha + metrics.focus_score * alpha;
        metrics.confusion_level = prev.confusion_level * invAlpha + metrics.confusion_level * alpha;
        metrics.fatigue_score = prev.fatigue_score * invAlpha + metrics.fatigue_score * alpha;
        metrics.engagement = prev.engagement * invAlpha + metrics.engagement * alpha;
        metrics.frustration = prev.frustration * invAlpha + metrics.frustration * alpha;
        metrics.blink_rate = prev.blink_rate * invAlpha + metrics.blink_rate * alpha;
        metrics.head_stability = prev.head_stability * invAlpha + metrics.head_stability * alpha;
    }

    function calculateMetricsFromLandmarks(landmarks: FaceLandmark[], out: SessionMetrics) {
        const leftEAR = calculateEAR(landmarks, 33, 160, 158, 133, 153, 144);
        const rightEAR = calculateEAR(landmarks, 362, 385, 387, 263, 373, 380);
        const avgEAR = (leftEAR + rightEAR) * 0.5;

        if (!sessionRef.current.baseline && avgEAR > 0.2) {
            sessionRef.current.baseline = {
                browDistance: calculateDistance(landmarks[70], landmarks[300]),
                eyeOpenness: avgEAR
            };
        }

        const baseline = sessionRef.current.baseline || { browDistance: 0.1, eyeOpenness: 0.25 };
        const isEyeClosed = avgEAR < baseline.eyeOpenness * 0.6;

        if (isEyeClosed) {
            sessionRef.current.consecutiveClosedFrames++;
        } else {
            sessionRef.current.consecutiveClosedFrames = 0;
        }

        const isSustainedClosure = sessionRef.current.consecutiveClosedFrames >= 5;

        const blinkArr = sessionRef.current.blinkHistory;
        const prevIndex = (sessionRef.current.blinkIndex + 99) % 100;
        const prevBlink = blinkArr[prevIndex];
        const currentBlink = isEyeClosed ? 1 : 0;
        blinkArr[sessionRef.current.blinkIndex] = currentBlink;

        if (prevBlink === 0 && currentBlink === 1) {
            sessionRef.current.blinkCount++;
        }

        sessionRef.current.blinkIndex = (sessionRef.current.blinkIndex + 1) % 100;

        let closedCount = 0;
        for (let i = 0; i < 100; i++) {
            closedCount += blinkArr[i];
        }
        const eyeClosedPercent = closedCount / 100;

        const estimatedBlinkRate = sessionRef.current.blinkCount * 6;

        const headPose = estimateHeadPose(landmarks);

        const poseArr = sessionRef.current.headPoseHistory;
        const pIdx = sessionRef.current.poseIndex * 3;
        poseArr[pIdx] = headPose.pitch;
        poseArr[pIdx + 1] = headPose.yaw;
        poseArr[pIdx + 2] = headPose.roll;
        sessionRef.current.poseIndex = (sessionRef.current.poseIndex + 1) % 20;
        if (sessionRef.current.poseCount < 20) sessionRef.current.poseCount++;

        const isLookingAtScreen = Math.abs(headPose.yaw) < 25 && Math.abs(headPose.pitch) < 25;

        if (isSustainedClosure) {
            out.focus_score = Math.max(10, 40 - eyeClosedPercent * 30);
        } else if (isLookingAtScreen) {
            out.focus_score = 75 + Math.random() * 10;
        } else {
            out.focus_score = Math.max(20, 90 - Math.abs(headPose.yaw) * 1.5);
        }

        const currentBrowDist = calculateDistance(landmarks[70], landmarks[300]);
        const browCompression = Math.max(0, baseline.browDistance - currentBrowDist);

        out.confusion_level = Math.min(50, browCompression * 200) * 0.7 + Math.min(50, Math.abs(headPose.roll) * 1.2) * 0.3;

        if (isSustainedClosure) {
            out.fatigue_score = Math.min(100, 60 + eyeClosedPercent * 40);
        } else {
            out.fatigue_score = Math.min(100, eyeClosedPercent * 60 + (estimatedBlinkRate < 4 ? 10 : 0));
        }

        const headStability = calculateHeadStabilityFast();
        const headMovement = 100 - headStability;
        out.frustration = Math.min(100, headMovement > 70 ? headMovement * 0.5 : 0);

        if (isSustainedClosure) {
            out.engagement = Math.max(15, 40 - eyeClosedPercent * 25);
        } else if (isLookingAtScreen) {
            out.engagement = Math.min(100, 60 + headStability * 0.3 + Math.random() * 8);
        } else {
            out.engagement = Math.max(25, 55 - Math.abs(headPose.yaw) * 0.8);
        }

        out.blink_rate = estimatedBlinkRate;
        out.head_stability = headStability / 100;
    }

    function calculateEAR(landmarks: FaceLandmark[], i0: number, i1: number, i2: number, i3: number, i4: number, i5: number): number {
        const p0 = landmarks[i0], p1 = landmarks[i1], p2 = landmarks[i2];
        const p3 = landmarks[i3], p4 = landmarks[i4], p5 = landmarks[i5];
        if (!p0 || !p1 || !p2 || !p3 || !p4 || !p5) return 0.3;

        const v1 = Math.sqrt((p1.x - p5.x) ** 2 + (p1.y - p5.y) ** 2);
        const v2 = Math.sqrt((p2.x - p4.x) ** 2 + (p2.y - p4.y) ** 2);
        const h = Math.sqrt((p0.x - p3.x) ** 2 + (p0.y - p3.y) ** 2);

        return h === 0 ? 0.3 : (v1 + v2) / (2 * h);
    }

    function estimateHeadPose(landmarks: FaceLandmark[]) {
        const nose = landmarks[1], leftEye = landmarks[33], rightEye = landmarks[263];
        const leftMouth = landmarks[61], rightMouth = landmarks[291];

        if (!nose || !leftEye || !rightEye || !leftMouth || !rightMouth) {
            return { pitch: 0, yaw: 0, roll: 0 };
        }

        const eyeDist = Math.sqrt((leftEye.x - rightEye.x) ** 2 + (leftEye.y - rightEye.y) ** 2);
        if (eyeDist === 0) return { pitch: 0, yaw: 0, roll: 0 };

        const noseToLeft = Math.sqrt((nose.x - leftEye.x) ** 2 + (nose.y - leftEye.y) ** 2);
        const noseToRight = Math.sqrt((nose.x - rightEye.x) ** 2 + (nose.y - rightEye.y) ** 2);
        const yaw = ((noseToLeft - noseToRight) / eyeDist) * 60;

        const eyeCenterY = (leftEye.y + rightEye.y) * 0.5;
        const mouthCenterY = (leftMouth.y + rightMouth.y) * 0.5;
        const mouthEyeDist = mouthCenterY - eyeCenterY;
        const pitch = mouthEyeDist !== 0 ? ((nose.y - eyeCenterY) / mouthEyeDist) * 35 - 15 : 0;

        const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 57.2958;

        return {
            pitch: isNaN(pitch) ? 0 : pitch,
            yaw: isNaN(yaw) ? 0 : yaw,
            roll: isNaN(roll) ? 0 : roll
        };
    }

    function calculateDistance(p1: FaceLandmark, p2: FaceLandmark): number {
        if (!p1 || !p2) return 0;
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    function calculateHeadStabilityFast(): number {
        const count = sessionRef.current.poseCount;
        if (count < 3) return 85;

        const poseArr = sessionRef.current.headPoseHistory;
        let yawSum = 0, pitchSum = 0;

        for (let i = 0; i < count; i++) {
            yawSum += poseArr[i * 3 + 1];
            pitchSum += poseArr[i * 3];
        }

        const yawMean = yawSum / count;
        const pitchMean = pitchSum / count;

        let yawVar = 0, pitchVar = 0;
        for (let i = 0; i < count; i++) {
            yawVar += (poseArr[i * 3 + 1] - yawMean) ** 2;
            pitchVar += (poseArr[i * 3] - pitchMean) ** 2;
        }

        const avgVariance = (yawVar + pitchVar) / (2 * count);
        return Math.max(50, 100 - avgVariance * 0.8);
    }

    async function sendSessionData() {
        const metrics = sessionRef.current.metrics;
        if (metrics.length === 0) return;

        const len = metrics.length;
        let focus = 0, confusion = 0, fatigue = 0, engagement = 0, frustration = 0, blink = 0, stability = 0;

        for (let i = 0; i < len; i++) {
            const m = metrics[i];
            focus += m.focus_score;
            confusion += m.confusion_level;
            fatigue += m.fatigue_score;
            engagement += m.engagement;
            frustration += m.frustration;
            blink += m.blink_rate;
            stability += m.head_stability;
        }

        const avgMetrics = {
            focus_score: focus / len,
            confusion_level: confusion / len,
            fatigue_score: fatigue / len,
            engagement: engagement / len,
            frustration: frustration / len,
            blink_rate: blink / len,
            head_stability: stability / len,
        };

        const engagement_score =
            avgMetrics.focus_score * 0.3 +
            (100 - avgMetrics.confusion_level) * 0.2 +
            (100 - avgMetrics.fatigue_score) * 0.2 +
            avgMetrics.engagement * 0.2 +
            (100 - avgMetrics.frustration) * 0.1;

        const sessionDuration = Math.floor((Date.now() - sessionRef.current.startTime) / 1000);

        try {
            await api.submitCameraMetrics({
                user_id: uid,
                subtopic_id: subtopicId,
                session_duration: sessionDuration,
                ...avgMetrics,
                engagement_score: Math.round(engagement_score),
            });
        } catch {
        }
    }

    return { isActive, isLoading, currentMetrics, error };
}
