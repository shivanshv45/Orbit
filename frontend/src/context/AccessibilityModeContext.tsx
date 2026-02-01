import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadVoicePreferences, updateVoicePreferences } from '@/lib/voice/VoicePreferences';
import { PiperVoiceEngine } from '@/lib/voice/PiperVoiceEngine';

interface AccessibilityModeContextValue {
    isAccessibilityModeOn: boolean;
    toggleAccessibilityMode: () => void;
    speak: (text: string, interrupt?: boolean) => void;
    speakMultiple: (texts: string[]) => void;
    stopSpeaking: () => void;
    isSpeaking: boolean;
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    prefetch: (texts: string[]) => void;
    setTeachingCommandHandler: (handler: ((transcript: string) => boolean) | null) => void;
    updateSpeed: (rate: number) => void;
    updatePitch: (pitch: number) => void;
    getPreferences: () => { rate: number; pitch: number };
}

const AccessibilityModeContext = createContext<AccessibilityModeContextValue | null>(null);

export function useAccessibilityMode() {
    const context = useContext(AccessibilityModeContext);
    if (!context) {
        throw new Error('useAccessibilityMode must be used within AccessibilityModeProvider');
    }
    return context;
}

export function useAccessibilityModeOptional() {
    const context = useContext(AccessibilityModeContext);
    return context || {
        isAccessibilityModeOn: false,
        toggleAccessibilityMode: () => { },
        speak: () => { },
        speakMultiple: () => { },
        stopSpeaking: () => { },
        isSpeaking: false,
        isListening: false,
        startListening: () => { },
        stopListening: () => { },
        prefetch: () => { },
        setTeachingCommandHandler: () => { },
        updateSpeed: () => { },
        updatePitch: () => { },
        getPreferences: () => ({ rate: 1, pitch: 1 }),
    };
}

interface AccessibilityModeProviderProps {
    children: React.ReactNode;
}

export function AccessibilityModeProvider({ children }: AccessibilityModeProviderProps) {
    const [isAccessibilityModeOn, setIsAccessibilityModeOn] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const voiceEngineRef = useRef<PiperVoiceEngine | null>(null);
    const teachingHandlerRef = useRef<((transcript: string) => boolean) | null>(null);
    const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const prefs = loadVoicePreferences();
        if (prefs.visualImpairmentMode === true) {
            setIsAccessibilityModeOn(true);
        }
    }, []);

    const resumeWithDelay = useCallback(() => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);

        resumeTimeoutRef.current = setTimeout(() => {
            voiceEngineRef.current?.resume();
        }, 800); // 800ms delay for natural pause
    }, []);

    useEffect(() => {
        if (isAccessibilityModeOn && !voiceEngineRef.current) {
            voiceEngineRef.current = new PiperVoiceEngine({
                onSpeechStart: () => setIsSpeaking(true),
                onSpeechEnd: () => setIsSpeaking(false),
                onListeningChange: (listening) => setIsListening(listening),
                onRecognitionResult: (transcript, confidence) => {
                    handleVoiceCommand(transcript, confidence);
                },
                onNoSpeechDetected: () => {
                    // Resume if no speech was detected after PTT release
                    resumeWithDelay();
                },
                onError: (error) => {
                    console.error('Voice engine error:', error);
                },
            });

            setTimeout(() => {
                voiceEngineRef.current?.speak('Visual impairment mode on. Say help for available commands.');
            }, 500);
        }

        if (!isAccessibilityModeOn && voiceEngineRef.current) {
            voiceEngineRef.current.destroy();
            voiceEngineRef.current = null;
            setIsSpeaking(false);
            setIsListening(false);
        }

        return () => {
            if (voiceEngineRef.current) {
                voiceEngineRef.current.destroy();
                voiceEngineRef.current = null;
            }
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        };
    }, [isAccessibilityModeOn]);

    const handleVoiceCommand = useCallback((transcript: string, _confidence: number) => {
        if (teachingHandlerRef.current) {
            const handled = teachingHandlerRef.current(transcript);
            if (handled) return;
        }

        const normalized = transcript.toLowerCase().trim();

        if (normalized.includes('turn off') || normalized.includes('disable') || normalized.includes('exit accessibility')) {
            voiceEngineRef.current?.speak('Visual impairment mode off.');
            setTimeout(() => {
                setIsAccessibilityModeOn(false);
                updateVoicePreferences({ visualImpairmentMode: false });
            }, 1500);
            return;
        }

        if (normalized.includes('help') || normalized.includes('commands')) {
            voiceEngineRef.current?.speak('Available commands: Next, Repeat, Faster, Slower, Go to curriculum.');
            return;
        }

        if (normalized.includes('go home') || normalized.includes('go to home')) {
            voiceEngineRef.current?.speak('Going to home page');
            setTimeout(() => { window.location.href = '/'; }, 1500);
            return;
        }

        if (normalized.includes('go to curriculum') || normalized.includes('exit lesson')) {
            voiceEngineRef.current?.speak('Going to curriculum');
            setTimeout(() => { window.location.href = '/curriculum'; }, 1500);
            return;
        }

        // If no matches, just resume previous speech after delay
        resumeWithDelay();
    }, [resumeWithDelay]);

    const toggleAccessibilityMode = useCallback(() => {
        setIsAccessibilityModeOn(prev => {
            const newValue = !prev;
            updateVoicePreferences({ visualImpairmentMode: newValue });
            return newValue;
        });
    }, []);

    const speak = useCallback((text: string, interrupt: boolean = false) => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        if (voiceEngineRef.current && isAccessibilityModeOn) {
            voiceEngineRef.current.speak(text, interrupt);
        }
    }, [isAccessibilityModeOn]);

    const speakMultiple = useCallback((texts: string[]) => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        if (voiceEngineRef.current && isAccessibilityModeOn) {
            texts.forEach((text, index) => {
                voiceEngineRef.current?.speak(text, index === 0);
            });
        }
    }, [isAccessibilityModeOn]);

    const stopSpeaking = useCallback(() => {
        voiceEngineRef.current?.stop();
    }, []);

    const startListening = useCallback(() => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        if (voiceEngineRef.current && isAccessibilityModeOn) {
            voiceEngineRef.current.pause();
            voiceEngineRef.current.startListening();
        }
    }, [isAccessibilityModeOn]);

    const stopListening = useCallback(() => {
        if (voiceEngineRef.current) {
            voiceEngineRef.current.stopListening();
            // Do NOT automatically resume here. 
            // We rely on onRecognitionResult or onNoSpeechDetected to trigger action or resume.
        }
    }, []);

    const prefetch = useCallback((texts: string[]) => {
        voiceEngineRef.current?.prefetch(texts);
    }, []);

    const setTeachingCommandHandler = useCallback((handler: ((transcript: string) => boolean) | null) => {
        teachingHandlerRef.current = handler;
    }, []);

    const updateSpeed = useCallback((rate: number) => {
        voiceEngineRef.current?.updatePreferences({ rate });
    }, []);

    const updatePitch = useCallback((pitch: number) => {
        voiceEngineRef.current?.updatePreferences({ pitch });
    }, []);

    const getPreferences = useCallback(() => {
        const prefs = voiceEngineRef.current?.getPreferences();
        return { rate: prefs?.rate || 1, pitch: prefs?.pitch || 1 };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;

            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                toggleAccessibilityMode();
                return;
            }

            if (e.key === 'Control' && isAccessibilityModeOn) {
                e.preventDefault();
                startListening();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control' && isAccessibilityModeOn) {
                stopListening();
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });
        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
        };
    }, [toggleAccessibilityMode, isAccessibilityModeOn, startListening, stopListening]);

    return (
        <AccessibilityModeContext.Provider value={{
            isAccessibilityModeOn,
            toggleAccessibilityMode,
            speak,
            speakMultiple,
            stopSpeaking,
            isSpeaking,
            isListening,
            startListening,
            stopListening,
            prefetch,
            setTeachingCommandHandler,
            updateSpeed,
            updatePitch,
            getPreferences,
        }}>
            {children}
        </AccessibilityModeContext.Provider>
    );
}
