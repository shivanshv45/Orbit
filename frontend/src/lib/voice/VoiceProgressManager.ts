
import type { VoiceProgress } from '@/types/voice';

const STORAGE_KEY_PREFIX = 'orbit_voice_progress_';

export function loadVoiceProgress(subtopicId: string): VoiceProgress | null {
    try {
        const key = STORAGE_KEY_PREFIX + subtopicId;
        const stored = localStorage.getItem(key);

        if (!stored) {
            return null;
        }

        const progress: VoiceProgress = JSON.parse(stored);

        const isStale = Date.now() - progress.lastUpdated > 24 * 60 * 60 * 1000;

        if (isStale) {
            clearVoiceProgress(subtopicId);
            return null;
        }

        return progress;
    } catch (error) {
        console.error('Failed to load voice progress:', error);
        return null;
    }
}

export function saveVoiceProgress(progress: VoiceProgress): void {
    try {
        const key = STORAGE_KEY_PREFIX + progress.subtopicId;
        const updated = {
            ...progress,
            lastUpdated: Date.now(),
        };

        localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save voice progress:', error);
    }
}

export function updateVoiceProgress(
    subtopicId: string,
    updates: Partial<Omit<VoiceProgress, 'subtopicId' | 'lastUpdated'>>
): VoiceProgress {
    const current = loadVoiceProgress(subtopicId);

    const updated: VoiceProgress = {
        subtopicId,
        currentBlockIndex: updates.currentBlockIndex ?? current?.currentBlockIndex ?? 0,
        state: updates.state ?? current?.state ?? 'IDLE',
        questionAnswered: updates.questionAnswered ?? current?.questionAnswered ?? {},
        questionScores: updates.questionScores ?? current?.questionScores ?? {},
        lastUpdated: Date.now(),
    };

    saveVoiceProgress(updated);
    return updated;
}

export function clearVoiceProgress(subtopicId: string): void {
    try {
        const key = STORAGE_KEY_PREFIX + subtopicId;
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to clear voice progress:', error);
    }
}

export function hasResumableProgress(subtopicId: string): boolean {
    const progress = loadVoiceProgress(subtopicId);
    return progress !== null && progress.currentBlockIndex > 0;
}

export function initializeVoiceProgress(subtopicId: string): VoiceProgress {
    const progress: VoiceProgress = {
        subtopicId,
        currentBlockIndex: 0,
        state: 'IDLE',
        questionAnswered: {},
        questionScores: {},
        lastUpdated: Date.now(),
    };

    saveVoiceProgress(progress);
    return progress;
}
