
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Settings as SettingsIcon } from 'lucide-react';
import type { TeachingBlock } from '@/types/teaching';
import type { VoiceState, VoicePreferences, VerbosityLevel, VoiceProgress } from '@/types/voice';
import { VoiceEngine } from '@/lib/voice/VoiceEngine';
import { VoiceTeachingStateMachine } from '@/lib/voice/VoiceTeachingStateMachine';
import { VoiceCommandRouter } from '@/lib/voice/VoiceCommandRouter';
import { VoiceContentConverter } from '@/lib/voice/VoiceContentConverter';
import { VoiceAnalytics } from '@/lib/voice/VoiceAnalytics';
import { loadVoiceProgress, saveVoiceProgress, hasResumableProgress, initializeVoiceProgress } from '@/lib/voice/VoiceProgressManager';
import { VoiceSettings } from './VoiceSettings';
import { createOrGetUser } from '@/logic/userSession';
import { useAccessibilityModeOptional } from '@/context/AccessibilityModeContext';
import { cn } from '@/lib/utils';

interface VoiceTeachingCanvasProps {
    blocks: TeachingBlock[];
    subtopicId: string;
    onNext: () => void;
    onPrevious: () => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

export function VoiceTeachingCanvas({
    blocks,
    subtopicId,
    onNext,
    onPrevious,
    hasNext,
    hasPrevious,
}: VoiceTeachingCanvasProps) {
    const [currentState, setCurrentState] = useState<VoiceState>('IDLE');
    const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
    const [questionAnswered, setQuestionAnswered] = useState<Record<number, boolean>>({});
    const [questionScores, setQuestionScores] = useState<Record<number, number>>({});
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState<string>('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [verbosity, setVerbosity] = useState<VerbosityLevel>('normal');
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    const voiceEngineRef = useRef<VoiceEngine | null>(null);
    const stateMachineRef = useRef<VoiceTeachingStateMachine | null>(null);
    const commandRouterRef = useRef<VoiceCommandRouter>(new VoiceCommandRouter());
    const contentConverterRef = useRef<VoiceContentConverter>(new VoiceContentConverter());
    const analyticsRef = useRef<VoiceAnalytics>(new VoiceAnalytics());
    const { uid } = createOrGetUser();
    const { isAccessibilityModeOn } = useAccessibilityModeOptional();

    // Initialize voice engine and state machine
    useEffect(() => {
        voiceEngineRef.current = new VoiceEngine({
            onSpeechEnd: () => {
                // After speaking completes, ready to listen if in teaching/question state
                if (currentState === 'TEACHING' || currentState === 'QUESTION') {
                    startListeningWithDelay();
                }
            },
            onRecognitionResult: (transcript, confidence) => {
                setLastTranscript(transcript);
                handleVoiceCommand(transcript, confidence);
                setIsListening(false);
            },
            onAnalyticsEvent: (event) => {
                analyticsRef.current.trackEvent(event);
            },
        });

        stateMachineRef.current = new VoiceTeachingStateMachine({
            onStateChange: (oldState: VoiceState, newState: VoiceState) => {
                console.log('[Voice Debug] StateMachine state changed:', oldState, '→', newState);
                setCurrentState(newState);
                saveProgress();
            },
            onAction: handleStateMachineAction,
        });

        // Start analytics session
        analyticsRef.current.startSession(uid, subtopicId);

        // Check for resumable progress
        if (hasResumableProgress(subtopicId)) {
            setShowResumePrompt(true);
        } else {
            initializeVoiceProgress(subtopicId);
        }

        return () => {
            voiceEngineRef.current?.destroy();
            analyticsRef.current?.endSession();
        };
    }, [subtopicId, uid]);

    // Enable continuous listening mode when accessibility mode is on
    useEffect(() => {
        if (voiceEngineRef.current) {
            voiceEngineRef.current.setContinuousMode(isAccessibilityModeOn);
            if (isAccessibilityModeOn) {
                setIsListening(true);
            }
        }
    }, [isAccessibilityModeOn]);

    // Save progress whenever key state changes
    const saveProgress = useCallback(() => {
        const progress: VoiceProgress = {
            subtopicId,
            currentBlockIndex,
            state: currentState,
            questionAnswered,
            questionScores,
            lastUpdated: Date.now(),
        };
        saveVoiceProgress(progress);
    }, [subtopicId, currentBlockIndex, currentState, questionAnswered, questionScores]);

    // Handle resume from saved progress
    const handleResume = () => {
        const progress = loadVoiceProgress(subtopicId);
        if (progress) {
            setCurrentBlockIndex(progress.currentBlockIndex);
            setQuestionAnswered(progress.questionAnswered);
            setQuestionScores(progress.questionScores);
            setCurrentState(progress.state);
        }
        setShowResumePrompt(false);
        startLesson();
    };

    // Handle starting fresh
    const handleStartFresh = () => {
        initializeVoiceProgress(subtopicId);
        setShowResumePrompt(false);
        startLesson();
    };

    // Start the lesson
    const startLesson = () => {
        console.log('[Voice Debug] Starting lesson, transitioning to TEACHING');
        stateMachineRef.current?.transitionTo('TEACHING');
        console.log('[Voice Debug] State machine state after transition:', stateMachineRef.current?.getState());
        speakCurrentBlock();
    };

    // Speak the current block
    const speakCurrentBlock = useCallback(() => {
        if (!voiceEngineRef.current || currentBlockIndex >= blocks.length) return;

        const block = blocks[currentBlockIndex];
        const scripts = contentConverterRef.current.convertBlock(block, currentBlockIndex, blocks.length);

        // Speak each script sequentially
        scripts.forEach((script, index) => {
            setTimeout(() => {
                voiceEngineRef.current?.speak(script.text);
                if (script.pauseAfter && index < scripts.length - 1) {
                    setTimeout(() => { }, script.pauseAfter);
                }
            }, index * 100);
        });

        // If it's a question, transition to QUESTION state
        if (block.type === 'question') {
            setTimeout(() => {
                stateMachineRef.current?.transitionTo('QUESTION');
            }, scripts.length * 200);
        }
    }, [blocks, currentBlockIndex]);

    // Start listening with a small delay
    const startListeningWithDelay = () => {
        setTimeout(() => {
            voiceEngineRef.current?.startListening();
            setIsListening(true);
        }, 500);
    };

    // Handle voice commands
    const handleVoiceCommand = (transcript: string, confidence: number) => {
        console.log('[Voice Debug] Transcript received:', transcript);
        console.log('[Voice Debug] Current state:', currentState);

        const currentBlock = blocks[currentBlockIndex];
        const context = {
            state: currentState,
            questionType: currentBlock?.type === 'question' ? currentBlock.questionType : undefined,
        };

        const command = commandRouterRef.current.route(transcript, context);
        console.log('[Voice Debug] Routed command:', command);

        if (command) {
            analyticsRef.current.trackCommandRecognized(command.action, transcript, confidence);
            const handled = stateMachineRef.current?.processCommand(command);
            console.log('[Voice Debug] Command handled:', handled);

            if (!handled) {
                speakFeedback('Command not recognized. Say "help" for available commands.');
                analyticsRef.current.trackCommandFailed(transcript);
            }
        } else {
            speakFeedback('I didn\'t understand that. Say "help" for available commands.');
            analyticsRef.current.trackMisrecognition(transcript, confidence);
        }
    };

    // Handle state machine actions
    const handleStateMachineAction = (action: string, parameters?: Record<string, any>) => {
        switch (action) {
            case 'start_lesson':
                speakCurrentBlock();
                break;

            case 'next_block':
                if (currentBlockIndex < blocks.length - 1) {
                    setCurrentBlockIndex(prev => prev + 1);
                    setTimeout(speakCurrentBlock, 100);
                } else {
                    completeLesson();
                }
                break;

            case 'repeat_block':
                speakCurrentBlock();
                break;

            case 'previous_block':
                if (currentBlockIndex > 0) {
                    setCurrentBlockIndex(prev => prev - 1);
                    setTimeout(speakCurrentBlock, 100);
                }
                break;

            case 'pause_speech':
                voiceEngineRef.current?.pause();
                break;

            case 'resume_speech':
                voiceEngineRef.current?.resume();
                speakCurrentBlock();
                break;

            case 'adjust_speed':
                if (parameters?.delta) {
                    const currentPrefs = voiceEngineRef.current ? {} : {};
                    voiceEngineRef.current?.updatePreferences({
                        rate: Math.max(0.5, Math.min(2.0, (currentPrefs as any).rate + parameters.delta)),
                    });
                }
                break;

            case 'set_verbosity':
                if (parameters?.level) {
                    setVerbosity(parameters.level);
                    contentConverterRef.current.setVerbosity(parameters.level);
                    speakFeedback(`Verbosity set to ${parameters.level}`);
                }
                break;

            case 'next_lesson':
                if (hasNext) {
                    voiceEngineRef.current?.stop();
                    speakFeedback('Moving to next lesson');
                    setTimeout(() => onNext(), 1000);
                } else {
                    speakFeedback('This is the last lesson');
                }
                break;

            case 'previous_lesson':
                if (hasPrevious) {
                    voiceEngineRef.current?.stop();
                    speakFeedback('Moving to previous lesson');
                    setTimeout(() => onPrevious(), 1000);
                } else {
                    speakFeedback('This is the first lesson');
                }
                break;

            case 'show_help':
                const helpText = commandRouterRef.current.getHelpText(currentState);
                speakFeedback(helpText);
                break;

            case 'open_settings':
                setSettingsOpen(true);
                break;

            case 'submit_answer':
                handleAnswer(parameters);
                break;

            case 'repeat_question':
                speakCurrentBlock();
                break;

            case 'next_lesson':
                onNext();
                break;
        }
    };

    // Handle question answers
    const handleAnswer = (parameters?: Record<string, any>) => {
        const currentBlock = blocks[currentBlockIndex];
        if (currentBlock.type !== 'question') return;

        let isCorrect = false;

        if (currentBlock.questionType === 'mcq' && parameters?.option) {
            const optionIndex = parameters.option.charCodeAt(0) - 65; // A=0, B=1, etc.
            isCorrect = optionIndex === currentBlock.correctIndex;
        } else if (currentBlock.questionType === 'fill_in_blank' && parameters?.answer) {
            const answer = parameters.answer.toLowerCase().trim();
            isCorrect = currentBlock.acceptedAnswers?.some(
                accepted => accepted.toLowerCase() === answer
            ) || false;
        }

        // Mark question as answered
        setQuestionAnswered(prev => ({ ...prev, [currentBlockIndex]: true }));

        // Calculate score (simplified, always 1.0 for now)
        setQuestionScores(prev => ({ ...prev, [currentBlockIndex]: isCorrect ? 1.0 : 0.25 }));

        // Speak feedback
        const explanation = isCorrect
            ? currentBlock.explanations.correct
            : currentBlock.explanations.incorrect?.[0] || 'Try again next time.';

        const feedbackScripts = contentConverterRef.current.convertFeedback(isCorrect, explanation);
        feedbackScripts.forEach(script => {
            voiceEngineRef.current?.speak(script.text);
        });

        // Move to next block after feedback
        setTimeout(() => {
            handleStateMachineAction('next_block');
        }, 2000);
    };

    // Complete the lesson
    const completeLesson = () => {
        stateMachineRef.current?.transitionTo('COMPLETED');
        speakFeedback('Lesson completed! Great work.');
        saveProgress();
    };

    // Speak feedback message
    const speakFeedback = (text: string) => {
        voiceEngineRef.current?.speak(text, true);
    };

    // Handle preferences change
    const handlePreferencesChange = (prefs: VoicePreferences) => {
        voiceEngineRef.current?.updatePreferences(prefs);
        setVerbosity(prefs.verbosity);
        contentConverterRef.current.setVerbosity(prefs.verbosity);
    };

    // Handle manual listening toggle
    const toggleListening = () => {
        if (isListening) {
            voiceEngineRef.current?.stopListening();
            setIsListening(false);
        } else {
            voiceEngineRef.current?.startListening();
            setIsListening(true);
        }
    };

    const currentBlock = blocks[currentBlockIndex];
    const progress = ((currentBlockIndex + 1) / blocks.length) * 100;

    return (
        <div
            className="space-y-6"
            role="main"
            aria-label="Voice Learning Mode"
        >
            {/* Resume Prompt */}
            <AnimatePresence>
                {showResumePrompt && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 rounded-2xl bg-primary/10 border border-primary/30"
                    >
                        <p className="text-sm font-medium mb-3">Resume from where you left off?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleResume}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                            >
                                Resume
                            </button>
                            <button
                                onClick={handleStartFresh}
                                className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80"
                            >
                                Start Fresh
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Bar */}
            <div
                className="flex items-center justify-between p-4 rounded-2xl bg-muted/50"
                role="status"
                aria-live="polite"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-3 h-3 rounded-full",
                        currentState === 'TEACHING' && "bg-green-500 animate-pulse",
                        currentState === 'QUESTION' && "bg-yellow-500 animate-pulse",
                        currentState === 'PAUSED' && "bg-red-500",
                        currentState === 'IDLE' && "bg-muted-foreground"
                    )} />
                    <span className="text-sm font-medium">
                        {currentState === 'TEACHING' && 'Teaching'}
                        {currentState === 'QUESTION' && 'Question'}
                        {currentState === 'PAUSED' && 'Paused'}
                        {currentState === 'IDLE' && 'Ready'}
                        {currentState === 'COMPLETED' && 'Completed'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Open voice settings"
                    >
                        <SettingsIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span
                        aria-label={`Section ${currentBlockIndex + 1} of ${blocks.length}`}
                    >
                        Section {currentBlockIndex + 1} of {blocks.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div
                    className="h-2 rounded-full bg-muted overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Listening Indicator */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-center p-6 rounded-2xl bg-primary/10 border border-primary/30"
                        role="status"
                        aria-live="assertive"
                        aria-label="Listening for your command"
                    >
                        <Mic className="w-6 h-6 text-primary animate-pulse" />
                        <span className="ml-3 text-sm font-medium">Listening...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Last Command */}
            {lastTranscript && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <span className="text-muted-foreground">Last command: </span>
                    <span className="font-medium">{lastTranscript}</span>
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-3">
                {currentState === 'IDLE' && (
                    <button
                        onClick={startLesson}
                        className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        aria-label="Start lesson"
                    >
                        <Play className="w-5 h-5" />
                        Start Lesson
                    </button>
                )}

                {(currentState === 'TEACHING' || currentState === 'QUESTION') && !isAccessibilityModeOn && (
                    <button
                        onClick={toggleListening}
                        className={cn(
                            "flex-1 h-14 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2",
                            isListening
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        aria-label={isListening ? "Stop listening" : "Start listening"}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        {isListening ? 'Stop' : 'Listen'}
                    </button>
                )}

                {(currentState === 'TEACHING' || currentState === 'QUESTION') && isAccessibilityModeOn && (
                    <div
                        className="flex-1 h-14 rounded-2xl bg-green-600 text-white font-medium flex items-center justify-center gap-2"
                        role="status"
                        aria-live="polite"
                    >
                        <Mic className="w-5 h-5 animate-pulse" />
                        Voice Mode Active
                    </div>
                )}
            </div>

            {/* Voice Settings */}
            <VoiceSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onPreferencesChange={handlePreferencesChange}
                onTestVoice={(text) => voiceEngineRef.current?.speak(text)}
            />
        </div>
    );
}
