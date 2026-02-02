

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, Gauge, Languages, User, X } from 'lucide-react';
import { loadVoicePreferences, saveVoicePreferences, type VoicePreferences, type VerbosityLevel, type VoiceGender } from '@/lib/voice/VoicePreferences';

interface VoiceSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onPreferencesChange: (preferences: VoicePreferences) => void;
    onTestVoice: (text: string) => void;
}

export function VoiceSettings({
    isOpen,
    onClose,
    onPreferencesChange,
    onTestVoice,
}: VoiceSettingsProps) {
    const [preferences, setPreferences] = useState<VoicePreferences>(loadVoicePreferences());


    useEffect(() => {
        setPreferences(loadVoicePreferences());
    }, [isOpen]);

    const handleChange = (updates: Partial<VoicePreferences>) => {
        const updated = { ...preferences, ...updates };
        setPreferences(updated);
        saveVoicePreferences(updated);
        onPreferencesChange(updated);
    };

    const handleTestVoice = () => {
        onTestVoice('This is a test of the voice settings. How does this sound?');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="voice-settings-title"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg mx-4 p-6 bg-background rounded-2xl shadow-2xl border border-border"
                >

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-primary" />
                            </div>
                            <h2 id="voice-settings-title" className="text-xl font-semibold">
                                Voice Settings
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Close settings"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>


                    <div className="space-y-6">

                        <div className="space-y-2">
                            <label
                                htmlFor="speech-rate"
                                className="flex items-center gap-2 text-sm font-medium"
                            >
                                <Gauge className="w-4 h-4" />
                                Speech Rate: {preferences.rate.toFixed(1)}x
                            </label>
                            <input
                                id="speech-rate"
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={preferences.rate}
                                onChange={(e) => handleChange({ rate: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                aria-label="Adjust speech rate"
                                aria-valuemin={0.5}
                                aria-valuemax={2.0}
                                aria-valuenow={preferences.rate}
                                aria-describedby="speech-rate-desc"
                            />
                            <p id="speech-rate-desc" className="text-xs text-muted-foreground">
                                Controls how fast or slow the voice speaks
                            </p>
                        </div>


                        <div className="space-y-2">
                            <label
                                htmlFor="pitch"
                                className="flex items-center gap-2 text-sm font-medium"
                            >
                                <Volume2 className="w-4 h-4" />
                                Pitch: {preferences.pitch.toFixed(1)}
                            </label>
                            <input
                                id="pitch"
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={preferences.pitch}
                                onChange={(e) => handleChange({ pitch: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                aria-label="Adjust voice pitch"
                                aria-valuemin={0.5}
                                aria-valuemax={2.0}
                                aria-valuenow={preferences.pitch}
                                aria-describedby="pitch-desc"
                            />
                            <p id="pitch-desc" className="text-xs text-muted-foreground">
                                Adjusts the voice pitch (higher or lower)
                            </p>
                        </div>


                        <div className="space-y-2">
                            <label
                                htmlFor="volume"
                                className="flex items-center gap-2 text-sm font-medium"
                            >
                                <Volume2 className="w-4 h-4" />
                                Volume: {Math.round(preferences.volume * 100)}%
                            </label>
                            <input
                                id="volume"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={preferences.volume}
                                onChange={(e) => handleChange({ volume: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                aria-label="Adjust volume"
                                aria-valuemin={0}
                                aria-valuemax={1}
                                aria-valuenow={preferences.volume}
                                aria-describedby="volume-desc"
                            />
                            <p id="volume-desc" className="text-xs text-muted-foreground">
                                Controls the voice volume level
                            </p>
                        </div>

                        {/* Voice Gender and Verbosity settings removed as requested */}
                    </div>


                    <button
                        onClick={handleTestVoice}
                        className="w-full mt-6 px-4 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        aria-label="Test voice with current settings"
                    >
                        Test Voice
                    </button>


                    <p
                        className="text-xs text-center text-muted-foreground mt-4"
                        role="status"
                        aria-live="polite"
                    >
                        Say "close settings" to exit
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
