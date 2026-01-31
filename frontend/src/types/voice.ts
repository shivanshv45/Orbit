/**
 * Voice Learning System Type Definitions
 */

export type VoiceState = 'IDLE' | 'TEACHING' | 'QUESTION' | 'PAUSED' | 'COMPLETED' | 'ERROR';

export type VerbosityLevel = 'short' | 'normal' | 'detailed';

export type VoiceGender = 'male' | 'female' | 'neutral';

export interface VoiceCommand {
    type: 'navigation' | 'answer' | 'accessibility';
    action: string;
    parameters?: Record<string, any>;
}

export interface VoicePreferences {
    rate: number;
    pitch: number;
    volume: number;
    language: string;
    voiceName?: string;
    voiceGender?: VoiceGender;
    verbosity: VerbosityLevel;
}

export interface VoiceAnalyticsEvent {
    type: 'command_recognized' | 'command_failed' | 'misrecognition';
    command?: string;
    utterance: string;
    confidence?: number;
    timestamp: number;
}

export interface VoiceProgress {
    subtopicId: string;
    currentBlockIndex: number;
    state: VoiceState;
    questionAnswered: Record<number, boolean>;
    questionScores: Record<number, number>;
    lastUpdated: number;
}

export interface VoiceEngineConfig {
    onStateChange?: (state: VoiceState) => void;
    onError?: (error: Error) => void;
    onSpeechEnd?: () => void;
    onSpeechStart?: () => void;
    onRecognitionResult?: (transcript: string, confidence: number) => void;
    onAnalyticsEvent?: (event: VoiceAnalyticsEvent) => void;
}
