
import { useEffect, useRef, useCallback, useState } from 'react';
import type { TeachingBlock } from '@/types/teaching';
import type { VerbosityLevel } from '@/types/voice';
import { VoiceEngine } from './VoiceEngine';
import { VoiceCommandRouter } from './VoiceCommandRouter';
import { VoiceContentConverter } from './VoiceContentConverter';
import { VoiceAnalytics } from './VoiceAnalytics';
import { createOrGetUser } from '@/logic/userSession';

interface UseVoiceModeProps {
    enabled: boolean;
    blocks: TeachingBlock[];
    currentBlockIndex: number;
    subtopicId: string;
    onNext: () => void;
    onPrevious?: () => void;
    onRepeat: () => void;
    onNextLesson?: () => void;
    onPreviousLesson?: () => void;
}

export function useVoiceMode({
    enabled,
    blocks,
    currentBlockIndex,
    subtopicId,
    onNext,
    onPrevious,
    onRepeat,
    onNextLesson,
    onPreviousLesson,
}: UseVoiceModeProps) {
    const [isListening, setIsListening] = useState(false);
    const voiceEngineRef = useRef<VoiceEngine | null>(null);
    const commandRouterRef = useRef(new VoiceCommandRouter());
    const contentConverterRef = useRef(new VoiceContentConverter('normal' as VerbosityLevel));
    const analyticsRef = useRef<VoiceAnalytics | null>(null);
    const { uid } = createOrGetUser();

    useEffect(() => {
        if (!enabled) {
            voiceEngineRef.current?.destroy();
            voiceEngineRef.current = null;
            analyticsRef.current?.endSession();
            analyticsRef.current = null;
            setIsListening(false);
            return;
        }

        if (!voiceEngineRef.current) {
            voiceEngineRef.current = new VoiceEngine({
                onRecognitionResult: (transcript, confidence) => handleVoiceCommand(transcript, confidence),
                onError: () => {
                    setIsListening(false);
                },
            });
        }

        if (!analyticsRef.current) {
            analyticsRef.current = new VoiceAnalytics();
            analyticsRef.current.startSession(uid, subtopicId);
        }

        return () => {
            voiceEngineRef.current?.destroy();
            analyticsRef.current?.endSession();
            setIsListening(false);
        };
    }, [enabled, uid, subtopicId]);

    useEffect(() => {
        if (!enabled || currentBlockIndex < 0) return;

        const timer = setTimeout(() => {
            speakCurrentBlock();
        }, 300);

        return () => clearTimeout(timer);
    }, [enabled, currentBlockIndex]);

    const speakCurrentBlock = useCallback(() => {
        if (!enabled || !voiceEngineRef.current) return;

        const block = blocks[currentBlockIndex];
        if (!block) return;

        const scripts = contentConverterRef.current.convertBlock(block, currentBlockIndex, blocks.length);
        scripts.forEach((script, index) => {
            voiceEngineRef.current?.speak(script.text, index === 0);
        });
    }, [enabled, blocks, currentBlockIndex]);

    const handleVoiceCommand = useCallback((transcript: string, confidence: number) => {
        setIsListening(false);

        const currentBlock = blocks[currentBlockIndex];
        const state = currentBlock?.type === 'question' ? 'QUESTION' : 'TEACHING';

        const context = {
            state,
            questionType: currentBlock?.type === 'question' ? currentBlock.questionType : undefined,
        };

        const command = commandRouterRef.current.route(transcript, context);

        if (!command) {
            voiceEngineRef.current?.speak("I didn't understand that. Say 'help' for available commands.");
            if (analyticsRef.current) {
                analyticsRef.current.trackEvent({
                    type: 'misrecognition',
                    utterance: transcript,
                    confidence,
                });
            }
            return;
        }

        if (analyticsRef.current) {
            analyticsRef.current.trackEvent({
                type: 'command_recognized',
                utterance: transcript,
                confidence,
            });
        }

        switch (command.action) {
            case 'next':
                onNext();
                break;
            case 'repeat':
                onRepeat();
                break;
            case 'back':
                onPrevious?.();
                break;
            case 'next_lesson':
                if (onNextLesson) {
                    voiceEngineRef.current?.speak('Going to next lesson');
                    onNextLesson();
                } else {
                    voiceEngineRef.current?.speak('No next lesson available');
                }
                break;
            case 'previous_lesson':
                if (onPreviousLesson) {
                    voiceEngineRef.current?.speak('Going to previous lesson');
                    onPreviousLesson();
                } else {
                    voiceEngineRef.current?.speak('No previous lesson available');
                }
                break;
            case 'help':
                const helpText = commandRouterRef.current.getHelpText('TEACHING');
                voiceEngineRef.current?.speak(helpText);
                break;
            case 'open_settings':
            case 'close_settings':
                voiceEngineRef.current?.speak('Settings panel - use the gear icon');
                break;
            case 'current_position':
                const positionText = `You are on section ${currentBlockIndex + 1} of ${blocks.length}`;
                voiceEngineRef.current?.speak(positionText);
                break;
            case 'show_progress':
                const remaining = blocks.length - currentBlockIndex - 1;
                const progressText = remaining > 0
                    ? `${remaining} ${remaining === 1 ? 'section' : 'sections'} remaining`
                    : 'This is the last section';
                voiceEngineRef.current?.speak(progressText);
                break;
            case 'speed_up':
                voiceEngineRef.current?.updatePreferences({ rate: 1.3 });
                voiceEngineRef.current?.speak('Speech speed increased');
                break;
            case 'slow_down':
                voiceEngineRef.current?.updatePreferences({ rate: 0.7 });
                voiceEngineRef.current?.speak('Speech speed decreased');
                break;
            case 'pause':
                voiceEngineRef.current?.pause();
                voiceEngineRef.current?.speak('Paused');
                break;
            case 'resume':
                voiceEngineRef.current?.resume();
                voiceEngineRef.current?.speak('Resuming');
                break;
            case 'return_to_curriculum':
                voiceEngineRef.current?.speak('Returning to curriculum');
                setTimeout(() => {
                    window.location.href = '/curriculum';
                }, 500);
                break;
            case 'select_option':
                if (command.parameters?.option) {
                    const option = command.parameters.option.toUpperCase();
                    voiceEngineRef.current?.speak(`Selecting option ${option}`);

                    setTimeout(() => {
                        const optionButton = document.querySelector(`button[data-option="${option}"]`);
                        if (optionButton) {
                            (optionButton as HTMLButtonElement).click();
                        } else {
                            voiceEngineRef.current?.speak(`Could not find option ${option}`);
                        }
                    }, 100);
                }
                break;
            case 'submit_answer':
                voiceEngineRef.current?.speak('Submitting answer');
                setTimeout(() => {
                    const submitButton = document.querySelector('button[data-submit-btn="true"]');
                    if (submitButton) {
                        (submitButton as HTMLButtonElement).click();
                    } else {
                        voiceEngineRef.current?.speak('Submit button not found');
                    }
                }, 100);
                break;
            case 'fill_in':
                if (command.parameters?.answer) {
                    voiceEngineRef.current?.speak('Answer recorded: ' + command.parameters.answer);
                }
                break;
            case 'start':
                voiceEngineRef.current?.speak('Starting lesson');
                speakCurrentBlock();
                break;
            default:
                voiceEngineRef.current?.speak("Command recognized but not yet implemented.");
        }
    }, [blocks, currentBlockIndex, onNext, onPrevious, onRepeat, onNextLesson, onPreviousLesson, speakCurrentBlock]);

    const startListening = useCallback(() => {
        if (enabled && voiceEngineRef.current) {
            voiceEngineRef.current.startListening();
            setIsListening(true);
        }
    }, [enabled]);

    const stopListening = useCallback(() => {
        if (voiceEngineRef.current) {
            voiceEngineRef.current.stopListening();
            setIsListening(false);
        }
    }, []);

    const speakText = useCallback((text: string) => {
        if (voiceEngineRef.current) {
            voiceEngineRef.current.speak(text);
        }
    }, []);

    const updatePreferences = useCallback((prefs: any) => {
        if (voiceEngineRef.current) {
            voiceEngineRef.current.updatePreferences(prefs);
        }
    }, []);

    return {
        isListening,
        startListening,
        stopListening,
        speakText,
        updatePreferences,
    };
}
