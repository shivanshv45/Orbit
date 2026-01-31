/**
 * Accessibility Mode Context
 * Provides global Ctrl+Space toggle for visual impairment mode
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadVoicePreferences, updateVoicePreferences } from '@/lib/voice/VoicePreferences';

interface AccessibilityModeContextValue {
    isAccessibilityModeOn: boolean;
    toggleAccessibilityMode: () => void;
}

const AccessibilityModeContext = createContext<AccessibilityModeContextValue | null>(null);

export function useAccessibilityMode() {
    const context = useContext(AccessibilityModeContext);
    if (!context) {
        throw new Error('useAccessibilityMode must be used within AccessibilityModeProvider');
    }
    return context;
}

// Safe hook that returns default values when used outside provider
export function useAccessibilityModeOptional() {
    const context = useContext(AccessibilityModeContext);
    return context || { isAccessibilityModeOn: false, toggleAccessibilityMode: () => { } };
}

interface AccessibilityModeProviderProps {
    children: React.ReactNode;
}

export function AccessibilityModeProvider({ children }: AccessibilityModeProviderProps) {
    const [isAccessibilityModeOn, setIsAccessibilityModeOn] = useState(false);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize from stored preferences
    useEffect(() => {
        const prefs = loadVoicePreferences();
        setIsAccessibilityModeOn(prefs.visualImpairmentMode === true);
        synthRef.current = window.speechSynthesis;
    }, []);

    // Speak announcement
    const speak = useCallback((text: string) => {
        if (!synthRef.current) return;

        // Cancel any ongoing speech
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        synthRef.current.speak(utterance);
    }, []);

    // Toggle accessibility mode
    const toggleAccessibilityMode = useCallback(() => {
        setIsAccessibilityModeOn(prev => {
            const newValue = !prev;

            // Persist to storage
            updateVoicePreferences({ visualImpairmentMode: newValue });

            // Announce the change
            if (newValue) {
                speak('Visual impairment mode on');
            } else {
                speak('Visual impairment mode off');
            }

            return newValue;
        });
    }, [speak]);

    // Global Ctrl+Space keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Space (or Cmd+Space on Mac)
            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                toggleAccessibilityMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }, [toggleAccessibilityMode]);

    return (
        <AccessibilityModeContext.Provider value={{ isAccessibilityModeOn, toggleAccessibilityMode }}>
            {children}
        </AccessibilityModeContext.Provider>
    );
}
