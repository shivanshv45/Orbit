import { useEffect, useRef, useState } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs';
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
    currentMetrics: SessionMetrics | null;
}


export function useFaceTracking(
    subtopicId: string,
    enabled: boolean
): FaceTrackingResult {
    const { uid } = createOrGetUser();
    const [isActive, setIsActive] = useState(false);
    const [currentMetrics, setCurrentMetrics] = useState<SessionMetrics | null>(null);

    const sessionRef = useRef({
        startTime: Date.now(),
        metrics: [] as SessionMetrics[],
        videoRef: null as HTMLVideoElement | null,
        detector: null as faceLandmarksDetection.FaceLandmarksDetector | null,
        detectorInterval: null as ReturnType<typeof setInterval> | null,
        blinkHistory: [] as number[],
        headPoseHistory: [] as Array<{ pitch: number; yaw: number; roll: number }>,


        isActive: false,
        prevMetrics: null as SessionMetrics | null,
        lastRecordTime: 0,
        lastUiUpdate: 0,


        baseline: null as {
            browDistance: number;
            eyeOpenness: number;
        } | null,
    });

    useEffect(() => {
        if (!enabled || !subtopicId) return;

        let isMounted = true;

        async function startTracking() {
            try {

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' }
                });

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }


                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                sessionRef.current.videoRef = video;

                await video.play();


                const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                    maxFaces: 1,
                    refineLandmarks: false,
                };

                const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
                sessionRef.current.detector = detector;

                setIsActive(true);
                sessionRef.current.isActive = true;
                console.log('[Camera] Face tracking started');


                const detectLoop = async () => {
                    if (!sessionRef.current.detector || !sessionRef.current.videoRef || !isMounted) return;

                    try {
                        const faces = await sessionRef.current.detector.estimateFaces(
                            sessionRef.current.videoRef,
                            { flipHorizontal: false }
                        );

                        if (faces.length > 0) {
                            const rawMetrics = calculateMetricsFromFace(faces[0]);


                            const smoothedMetrics = smoothMetrics(rawMetrics, sessionRef.current.prevMetrics, 0.15);
                            sessionRef.current.prevMetrics = smoothedMetrics;


                            const now = Date.now();
                            if (now - sessionRef.current.lastRecordTime > 1000) {
                                sessionRef.current.metrics.push(smoothedMetrics);
                                sessionRef.current.lastRecordTime = now;
                            }


                            if (now - sessionRef.current.lastUiUpdate > 100) {
                                setCurrentMetrics(smoothedMetrics);
                                sessionRef.current.lastUiUpdate = now;
                            }
                        }
                    } catch (error) {
                        console.error('[Camera] Detection error:', error);
                    }


                    if (sessionRef.current.isActive && isMounted) {
                        requestAnimationFrame(detectLoop);
                    }
                };

                detectLoop();

            } catch (error) {
                console.error('[Camera] Failed to start tracking:', error);
                setIsActive(false);
                sessionRef.current.isActive = false;
            }
        }

        startTracking();


        return () => {
            isMounted = false;
            sessionRef.current.isActive = false;


            if (sessionRef.current.videoRef) {
                const stream = sessionRef.current.videoRef.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
            }


            if (sessionRef.current.detector) {


                sessionRef.current.detector = null;
            }


            if (sessionRef.current.metrics.length > 0) {
                sendSessionData();
            }

            setIsActive(false);
            setCurrentMetrics(null);
            console.log('[Camera] Face tracking stopped');
        };
    }, [subtopicId, enabled]);

    function smoothMetrics(newMetrics: SessionMetrics, prev: SessionMetrics | null, alpha: number): SessionMetrics {
        if (!prev) return newMetrics;

        return {
            focus_score: prev.focus_score * (1 - alpha) + newMetrics.focus_score * alpha,
            confusion_level: prev.confusion_level * (1 - alpha) + newMetrics.confusion_level * alpha,
            fatigue_score: prev.fatigue_score * (1 - alpha) + newMetrics.fatigue_score * alpha,
            engagement: prev.engagement * (1 - alpha) + newMetrics.engagement * alpha,
            frustration: prev.frustration * (1 - alpha) + newMetrics.frustration * alpha,
            blink_rate: prev.blink_rate * (1 - alpha) + newMetrics.blink_rate * alpha, // Blinks needs special handling usually, but for rate it's fine
            head_stability: prev.head_stability * (1 - alpha) + newMetrics.head_stability * alpha,
        };
    }

    function calculateMetricsFromFace(face: faceLandmarksDetection.Face): SessionMetrics {
        const keypoints = face.keypoints;


        const leftEAR = calculateEAR(keypoints, [33, 160, 158, 133, 153, 144]);
        const rightEAR = calculateEAR(keypoints, [362, 385, 387, 263, 373, 380]);
        const avgEAR = (leftEAR + rightEAR) / 2;


        if (!sessionRef.current.baseline) {
            const browDist = calculateDistance(keypoints[70], keypoints[300]); // Brow width
            if (avgEAR > 0.25) { // Only set baseline if eyes are open
                sessionRef.current.baseline = {
                    browDistance: browDist,
                    eyeOpenness: avgEAR
                };
            }
        }

        const baseline = sessionRef.current.baseline || { browDistance: 100, eyeOpenness: 0.3 };


        const isEyeClosed = avgEAR < (baseline.eyeOpenness * 0.6); // < 60% of open

        sessionRef.current.blinkHistory.push(isEyeClosed ? 1 : 0);
        if (sessionRef.current.blinkHistory.length > 150) { // 5 seconds history (at 30fps)
            sessionRef.current.blinkHistory.shift();
        }


        let blinks = 0;
        for (let i = 1; i < sessionRef.current.blinkHistory.length; i++) {
            if (sessionRef.current.blinkHistory[i - 1] === 0 && sessionRef.current.blinkHistory[i] === 1) {
                blinks++;
            }
        }

        const estimatedBlinkRate = blinks * 12;


        const headPose = estimateHeadPose(keypoints);
        sessionRef.current.headPoseHistory.push(headPose);
        if (sessionRef.current.headPoseHistory.length > 30) {
            sessionRef.current.headPoseHistory.shift();
        }


        const isLookingAtScreen = Math.abs(headPose.yaw) < 20 && Math.abs(headPose.pitch) < 20;
        const focus_score = isLookingAtScreen ? 90 + (Math.random() * 5) : Math.max(0, 100 - (Math.abs(headPose.yaw) * 2.5));


        const currentBrowDist = calculateDistance(keypoints[70], keypoints[300]);
        const browCompression = baseline.browDistance - currentBrowDist; // Positive if frowning


        const confusionFromBrows = Math.min(100, Math.max(0, browCompression * 8));
        const confusionFromTilt = Math.min(100, Math.abs(headPose.roll) * 3);
        const confusion_level = (confusionFromBrows * 0.7) + (confusionFromTilt * 0.3);


        const eyesClosedPercent = sessionRef.current.blinkHistory.reduce((a, b) => a + b, 0) / sessionRef.current.blinkHistory.length;
        const fatigue_score = Math.min(100, (eyesClosedPercent * 300) + (estimatedBlinkRate < 5 ? 15 : 0));


        const headVelocity = calculateHeadStability(); // 0-100 (100 is stable)
        const headMovement = 100 - headVelocity;
        const frustration = Math.min(100, (headMovement > 60 ? headMovement : 0) + (estimatedBlinkRate > 35 ? 40 : 0));


        const blinkScore = (estimatedBlinkRate >= 8 && estimatedBlinkRate <= 30) ? 100 : 50;
        const engagement = (focus_score * 0.5) + (blinkScore * 0.25) + (headVelocity * 0.25);

        return {
            focus_score,
            confusion_level,
            fatigue_score,
            engagement,
            frustration,
            blink_rate: estimatedBlinkRate,
            head_stability: headVelocity / 100,
        };
    }

    function calculateEAR(keypoints: any[], indices: number[]): number {
        // Eye Aspect Ratio formula
        const p1 = keypoints[indices[1]];
        const p2 = keypoints[indices[2]];
        const p3 = keypoints[indices[4]];
        const p4 = keypoints[indices[5]];
        const p5 = keypoints[indices[0]];
        const p6 = keypoints[indices[3]];

        const vertical1 = calculateDistance(p1, p4);
        const vertical2 = calculateDistance(p2, p3);
        const horizontal = calculateDistance(p5, p6);

        return (vertical1 + vertical2) / (2.0 * horizontal);
    }

    function estimateHeadPose(keypoints: any[]) {
        // Simplified head pose estimation using key facial points
        const noseTip = keypoints[1];
        const leftEye = keypoints[33];
        const rightEye = keypoints[263];
        const leftMouth = keypoints[61];
        const rightMouth = keypoints[291];

        // Yaw (left-right rotation)
        const eyeDistance = calculateDistance(leftEye, rightEye);
        const noseToLeftEye = calculateDistance(noseTip, leftEye);
        const noseToRightEye = calculateDistance(noseTip, rightEye);
        const yaw = ((noseToLeftEye - noseToRightEye) / eyeDistance) * 50;

        // Pitch (up-down rotation)
        const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
        const mouthCenter = { x: (leftMouth.x + rightMouth.x) / 2, y: (leftMouth.y + rightMouth.y) / 2 };
        const pitch = ((noseTip.y - eyeCenter.y) / (mouthCenter.y - eyeCenter.y)) * 30 - 15;

        // Roll (tilt)
        const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

        return { pitch, yaw, roll };
    }

    function calculateDistance(p1: any, p2: any): number {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }



    function calculateHeadStability(): number {
        if (sessionRef.current.headPoseHistory.length < 5) return 80;

        const poses = sessionRef.current.headPoseHistory;
        const yawVariance = calculateVariance(poses.map(p => p.yaw));
        const pitchVariance = calculateVariance(poses.map(p => p.pitch));

        const avgVariance = (yawVariance + pitchVariance) / 2;
        return Math.max(0, 100 - avgVariance * 2);
    }

    function calculateVariance(values: number[]): number {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    async function sendSessionData() {
        const metrics = sessionRef.current.metrics;
        if (metrics.length === 0) return;

        // Calculate averages over entire session
        const avgMetrics = {
            focus_score: average(metrics.map(m => m.focus_score)),
            confusion_level: average(metrics.map(m => m.confusion_level)),
            fatigue_score: average(metrics.map(m => m.fatigue_score)),
            engagement: average(metrics.map(m => m.engagement)),
            frustration: average(metrics.map(m => m.frustration)),
            blink_rate: average(metrics.map(m => m.blink_rate)),
            head_stability: average(metrics.map(m => m.head_stability)),
        };

        // Calculate weighted engagement score
        const engagement_score =
            (avgMetrics.focus_score * 0.3) +
            ((100 - avgMetrics.confusion_level) * 0.2) +
            ((100 - avgMetrics.fatigue_score) * 0.2) +
            (avgMetrics.engagement * 0.2) +
            ((100 - avgMetrics.frustration) * 0.1);

        const sessionDuration = Math.floor((Date.now() - sessionRef.current.startTime) / 1000);

        try {
            await api.submitCameraMetrics({
                user_id: uid,
                subtopic_id: subtopicId,
                session_duration: sessionDuration,
                ...avgMetrics,
                engagement_score: Math.round(engagement_score),
            });

            console.log('[Camera] Session data sent:', {
                duration: sessionDuration,
                samples: metrics.length,
                engagement_score: Math.round(engagement_score)
            });
        } catch (error) {
            console.error('[Camera] Failed to send session data:', error);
        }
    }

    return { isActive, currentMetrics };
}

function average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}
