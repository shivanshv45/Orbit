
import type { VoiceAnalyticsEvent } from '@/types/voice';

interface AnalyticsSession {
    userId: string;
    subtopicId: string;
    events: VoiceAnalyticsEvent[];
    startTime: number;
    endTime?: number;
}

export class VoiceAnalytics {
    private currentSession: AnalyticsSession | null = null;
    private eventBuffer: VoiceAnalyticsEvent[] = [];
    private flushInterval: number | null = null;

    public startSession(userId: string, subtopicId: string): void {
        if (this.currentSession) {
            this.endSession();
        }

        this.currentSession = {
            userId,
            subtopicId,
            events: [],
            startTime: Date.now(),
        };

        this.flushInterval = window.setInterval(() => {
            this.flush();
        }, 30000);
    }

    public trackEvent(event: Omit<VoiceAnalyticsEvent, 'timestamp'>): void {
        const fullEvent: VoiceAnalyticsEvent = {
            ...event,
            timestamp: Date.now(),
        };

        if (this.currentSession) {
            this.currentSession.events.push(fullEvent);
        }

        this.eventBuffer.push(fullEvent);
    }

    public trackCommandRecognized(command: string, utterance: string, confidence: number): void {
        this.trackEvent({
            type: 'command_recognized',
            command,
            utterance,
            confidence,
        });
    }

    public trackCommandFailed(utterance: string): void {
        this.trackEvent({
            type: 'command_failed',
            utterance,
        });
    }

    public trackMisrecognition(utterance: string, confidence?: number): void {
        this.trackEvent({
            type: 'misrecognition',
            utterance,
            confidence,
        });
    }

    public endSession(): void {
        if (!this.currentSession) return;

        this.currentSession.endTime = Date.now();

        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }

        this.currentSession = null;
        this.eventBuffer = [];
    }

    private flush(): void {
        this.eventBuffer = [];
    }

    public getSessionStats(): {
        totalCommands: number;
        successRate: number;
        misrecognitionRate: number;
        averageConfidence: number;
        sessionDuration: number;
    } | null {
        if (!this.currentSession) return null;

        const events = this.currentSession.events;
        const totalCommands = events.filter(e =>
            e.type === 'command_recognized' || e.type === 'command_failed'
        ).length;

        const successful = events.filter(e => e.type === 'command_recognized').length;
        const misrecognitions = events.filter(e => e.type === 'misrecognition').length;

        const confidenceValues = events
            .filter(e => e.confidence !== undefined)
            .map(e => e.confidence!);

        const averageConfidence = confidenceValues.length > 0
            ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
            : 0;

        const sessionDuration = Date.now() - this.currentSession.startTime;

        return {
            totalCommands,
            successRate: totalCommands > 0 ? successful / totalCommands : 0,
            misrecognitionRate: totalCommands > 0 ? misrecognitions / totalCommands : 0,
            averageConfidence,
            sessionDuration,
        };
    }

    public destroy(): void {
        this.endSession();
    }
}
