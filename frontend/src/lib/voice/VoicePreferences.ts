export type VerbosityLevel = 'short' | 'normal' | 'detailed';
export type VoiceGender = 'male' | 'female' | 'neutral';

export interface VoicePreferences {
    rate: number;
    pitch: number;
    volume: number;
    language: string;
    voiceName?: string;
    voiceGender?: VoiceGender;
    verbosity: VerbosityLevel;
    visualImpairmentMode?: boolean;
}

const STORAGE_KEY = 'orbit_voice_preferences';

export const DEFAULT_PREFERENCES: VoicePreferences = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'en-US',
    voiceGender: 'neutral',
    verbosity: 'normal',
    visualImpairmentMode: false,
};

export function loadVoicePreferences(): VoicePreferences {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { ...DEFAULT_PREFERENCES };
        }

        const parsed = JSON.parse(stored);

        return {
            ...DEFAULT_PREFERENCES,
            ...parsed,
        };
    } catch {
        return { ...DEFAULT_PREFERENCES };
    }
}

export function saveVoicePreferences(preferences: VoicePreferences): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
    }
}

export function updateVoicePreferences(
    updates: Partial<VoicePreferences>
): VoicePreferences {
    const current = loadVoicePreferences();
    const updated = { ...current, ...updates };
    saveVoicePreferences(updated);
    return updated;
}

export function resetVoicePreferences(): VoicePreferences {
    const defaults = { ...DEFAULT_PREFERENCES };
    saveVoicePreferences(defaults);
    return defaults;
}

export function validatePreferences(preferences: VoicePreferences): VoicePreferences {
    return {
        ...preferences,
        rate: Math.max(0.5, Math.min(2.0, preferences.rate)),
        pitch: Math.max(0.5, Math.min(2.0, preferences.pitch)),
        volume: Math.max(0.0, Math.min(1.0, preferences.volume)),
    };
}
