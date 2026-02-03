import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadVoicePreferences, updateVoicePreferences } from '@/lib/voice/VoicePreferences';
import { PiperVoiceEngine } from '@/lib/voice/PiperVoiceEngine';

interface AccessibilityContextType {
    isOn: boolean;
    isSpeaking: boolean;
    isListening: boolean;
    toggle: () => void;
    speak: (text: string) => void;
    speakAll: (texts: string[]) => void;
    stop: () => void;
    prefetch: (texts: string[]) => void;
    setCommandHandler: (handler: ((text: string) => boolean) | null) => void;
    registerBlockSpeaker: (fn: () => void) => void;
    updateSpeed: (rate: number) => void;
    getSpeed: () => number;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibilityMode() {
    const ctx = useContext(AccessibilityContext);
    if (!ctx) throw new Error('useAccessibilityMode must be used within provider');
    return ctx;
}

export function useAccessibilityModeOptional() {
    return useContext(AccessibilityContext);
}

export function AccessibilityModeProvider({ children }: { children: React.ReactNode }) {
    const [isOn, setIsOn] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const engineRef = useRef<PiperVoiceEngine | null>(null);
    const commandHandlerRef = useRef<((text: string) => boolean) | null>(null);
    const blockSpeakerRef = useRef<() => void>(() => { });
    const ctrlDownRef = useRef(false);

    useEffect(() => {
        const prefs = loadVoicePreferences();
        if (prefs.visualImpairmentMode) {
            setIsOn(true);
        }
    }, []);

    const processCommand = useCallback((text: string) => {
        console.log('Processing command:', text);

        if (commandHandlerRef.current) {
            const handled = commandHandlerRef.current(text);
            if (handled) return;
        }

        const lower = text.toLowerCase();

        if (lower.includes('off') || lower.includes('disable') || lower.includes('exit')) {
            engineRef.current?.speak('Mode off');
            setTimeout(() => {
                setIsOn(false);
                updateVoicePreferences({ visualImpairmentMode: false });
            }, 1500);
            return;
        }

        if (lower.includes('help')) {
            engineRef.current?.speak('Commands: next, repeat, back, faster, slower, off');
            return;
        }

        if (lower.includes('home')) {
            engineRef.current?.speak('Going home');
            setTimeout(() => { window.location.href = '/'; }, 1500);
            return;
        }

        if (lower.includes('curriculum')) {
            engineRef.current?.speak('Going to curriculum');
            setTimeout(() => { window.location.href = '/curriculum'; }, 1500);
            return;
        }

        engineRef.current?.speak('Say help for commands');
    }, []);

    useEffect(() => {
        if (!isOn) {
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
            setIsSpeaking(false);
            setIsListening(false);
            ctrlDownRef.current = false;
            return;
        }

        if (!engineRef.current) {
            const engine = new PiperVoiceEngine();
            engine.setCallbacks(
                processCommand,
                setIsListening,
                setIsSpeaking
            );
            engineRef.current = engine;

            engine.requestMic().then(() => {
                setTimeout(() => {
                    if (engineRef.current === engine) {
                        engine.speak('Voice mode on. Hold Control to speak commands.');
                    }
                }, 300);
            });
        }
    }, [isOn, processCommand]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;

            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                const next = !isOn;
                setIsOn(next);
                updateVoicePreferences({ visualImpairmentMode: next });
                if (!next && engineRef.current) {
                    engineRef.current.stopSpeaking();
                    setTimeout(() => {
                        engineRef.current?.speak('Mode off');
                    }, 100);
                }
                return;
            }

            if (e.key === 'Control' && isOn && !ctrlDownRef.current) {
                e.preventDefault();
                e.stopPropagation();
                ctrlDownRef.current = true;
                if (engineRef.current) {
                    engineRef.current.stopSpeaking();
                    setTimeout(() => {
                        engineRef.current?.startListening();
                    }, 100);
                }
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control' && ctrlDownRef.current) {
                e.preventDefault();
                e.stopPropagation();
                ctrlDownRef.current = false;
                engineRef.current?.stopListening();
            }
        };

        window.addEventListener('keydown', onKeyDown, { capture: true });
        window.addEventListener('keyup', onKeyUp, { capture: true });
        return () => {
            window.removeEventListener('keydown', onKeyDown, { capture: true });
            window.removeEventListener('keyup', onKeyUp, { capture: true });
        };
    }, [isOn]);

    const toggle = useCallback(() => {
        const next = !isOn;

        if (!next && engineRef.current) {
            engineRef.current.stopSpeaking();
        }

        setIsOn(next);
        updateVoicePreferences({ visualImpairmentMode: next });
    }, [isOn]);

    const speak = useCallback((text: string) => {
        if (isOn && engineRef.current) {
            engineRef.current.speak(text);
        }
    }, [isOn]);

    const speakAll = useCallback((texts: string[]) => {
        if (isOn && engineRef.current) {
            engineRef.current.speakMultiple(texts);
        }
    }, [isOn]);

    const stop = useCallback(() => {
        if (engineRef.current) {
            engineRef.current.stopSpeaking();
            engineRef.current.stopListening();
        }
    }, []);

    const prefetch = useCallback((texts: string[]) => {
        if (engineRef.current) {
            engineRef.current.prefetch(texts);
        }
    }, []);

    const setCommandHandler = useCallback((handler: ((text: string) => boolean) | null) => {
        commandHandlerRef.current = handler;
    }, []);

    const registerBlockSpeaker = useCallback((fn: () => void) => {
        blockSpeakerRef.current = fn;
    }, []);

    const updateSpeed = useCallback((rate: number) => {
        engineRef.current?.updatePreferences({ rate });
    }, []);

    const getSpeed = useCallback(() => {
        return engineRef.current?.getPreferences().rate || 1;
    }, []);

    return (
        <AccessibilityContext.Provider value={{
            isOn,
            isSpeaking,
            isListening,
            toggle,
            speak,
            speakAll,
            stop,
            prefetch,
            setCommandHandler,
            registerBlockSpeaker,
            updateSpeed,
            getSpeed,
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
}
