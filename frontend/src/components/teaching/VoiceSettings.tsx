/**
 * Voice Settings Panel
 * Accessible UI and voice-controlled settings for voice mode
 */

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

    // Load preferences on mount
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
                    {/* Header */}
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

                    {/* Settings Grid */}
                    <div className="space-y-6">
                        {/* Speech Rate */}
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

                        {/* Pitch */}
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

                        {/* Volume */}
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

                        {/* Voice Gender */}
                        <div className="space-y-2">
                            <label htmlFor="voice-gender" className="flex items-center gap-2 text-sm font-medium">
                                <User className="w-4 h-4" />
                                Voice Gender
                            </label>
                            <select
                                id="voice-gender"
                                value={preferences.voiceGender || 'neutral'}
                                onChange={(e) => handleChange({ voiceGender: e.target.value as VoiceGender })}
                                className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                aria-label="Select voice gender preference"
                                aria-describedby="voice-gender-desc"
                            >
                                <option value="neutral">Neutral (Auto)</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                            </select>
                            <p id="voice-gender-desc" className="text-xs text-muted-foreground">
                                Preferred voice gender (availability depends on browser)
                            </p>
                        </div>

                        {/* Verbosity Level */}
                        <div className="space-y-2">
                            <label htmlFor="verbosity" className="flex items-center gap-2 text-sm font-medium">
                                <Languages className="w-4 h-4" />
                                Detail Level
                            </label>
                            <select
                                id="verbosity"
                                value={preferences.verbosity}
                                onChange={(e) => handleChange({ verbosity: e.target.value as VerbosityLevel })}
                                className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                aria-label="Select verbosity level"
                                aria-describedby="verbosity-desc"
                            >
                                <option value="short">Short (Brief summaries)</option>
                                <option value="normal">Normal (Balanced)</option>
                                <option value="detailed">Detailed (Full explanations)</option>
                            </select>
                            <p id="verbosity-desc" className="text-xs text-muted-foreground">
                                How much detail to include in explanations
                            </p>
                        </div>
                    </div>

                    {/* Test Voice Button */}
                    <button
                        onClick={handleTestVoice}
                        className="w-full mt-6 px-4 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        aria-label="Test voice with current settings"
                    >
                        Test Voice
                    </button>

                    {/* Voice command hint */}
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
