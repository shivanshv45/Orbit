import type { VoicePreferences, VoiceEngineConfig } from '@/types/voice';
import { loadVoicePreferences, validatePreferences } from './VoicePreferences';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AudioCacheEntry {
    url: string;
    timestamp: number;
}

export class PiperVoiceEngine {
    private preferences: VoicePreferences;
    private config: VoiceEngineConfig;
    private isSpeaking = false;
    private isListening = false;
    private isInitializing = false;
    private shouldBeListening = false; // Intention tracker
    private speechQueue: { text: string; delay: number }[] = [];
    private currentAudio: HTMLAudioElement | null = null;
    private recognition: any = null;
    private audioCache: Map<string, AudioCacheEntry> = new Map();
    private maxCacheSize = 100;

    private commonPhrases: string[] = [
        'Visual impairment mode on. Say help for available commands.',
        'Visual impairment mode off.',
        'Listening',
        'Command not recognized. Say help for available commands.',
        'Going to next section',
        'Going to previous section',
        'Going to next lesson',
        'Going to previous lesson',
        'Speech speed increased',
        'Speech speed decreased',
        'Here are the available commands.',
        'Correct! Great job.',
        'Incorrect. Try again.',
        'Submitting answer',
        'Yes', 'No', 'Next', 'Back', 'Stop', 'Help', 'Repeat'
    ];

    constructor(config: VoiceEngineConfig = {}) {
        this.config = config;
        this.preferences = validatePreferences(loadVoicePreferences());
    }

    // Call this explicitly if you want to preload, e.g. on idle or boot
    public async preloadCommonPhrases(): Promise<void> {
        this.commonPhrases.forEach(text => this.fetchAudio(text).catch(() => { }));
    }

    private async initializeRecognition(): Promise<boolean> {
        if (this.recognition) return true;
        if (this.isInitializing) return false;

        this.isInitializing = true;

        const SpeechRecognitionAPI = (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) {
            console.error('Speech Recognition not supported');
            this.isInitializing = false;
            return false;
        }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });

            this.recognition = new SpeechRecognitionAPI();
            this.recognition.continuous = false; // PTT usually works best with false
            this.recognition.interimResults = true; // Enable interim to catch fast speech
            this.recognition.lang = this.preferences.language || 'en-US';
            this.recognition.maxAlternatives = 1;
            this.setupRecognitionHandlers();

            this.isInitializing = false;
            return true;
        } catch (error) {
            console.error('Microphone init failed:', error);
            if (this.config.onError) {
                this.config.onError(new Error('Microphone permission denied.'));
            }
            this.isInitializing = false;
            return false;
        }
    }

    private setupRecognitionHandlers(): void {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.config.onListeningChange) {
                this.config.onListeningChange(true);
            }
            // Check if we should have stopped while initializing
            if (!this.shouldBeListening) {
                this.stopListening();
            }
        };

        this.recognition.onresult = (event: any) => {
            const results = event.results[event.resultIndex];
            const transcript = results[0].transcript.trim();
            const confidence = results[0].confidence;
            const isFinal = results.isFinal;

            if (isFinal) {
                if (transcript && this.config.onRecognitionResult) {
                    this.config.onRecognitionResult(transcript, confidence);
                }
            }
        };

        this.recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
                // Ignore transient errors
            } else {
                console.warn('Recognition error:', event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;

            if (this.shouldBeListening) {
                // Restart immediately if intention is to keep listening
                setTimeout(() => {
                    if (this.shouldBeListening && !this.isListening) {
                        try {
                            this.recognition.start();
                        } catch (e) { }
                    }
                }, 100);
            } else {
                if (this.config.onListeningChange) {
                    this.config.onListeningChange(false);
                }
            }
        };
    }

    public async startListening(): Promise<void> {
        this.shouldBeListening = true;

        if (!this.recognition) {
            const success = await this.initializeRecognition();
            if (!success) {
                this.shouldBeListening = false;
                return;
            }
            // Start preloading after mic is granted (optional optimization)
            this.preloadCommonPhrases();
        }

        if (!this.shouldBeListening) return;
        if (this.isListening) return;

        try {
            this.recognition.start();
        } catch (error) {
            console.log('Start ignored:', error);
        }
    }

    public stopListening(): void {
        this.shouldBeListening = false;

        if (!this.recognition) return;

        try {
            this.recognition.stop();
        } catch (error) {
            console.log('Stop ignored:', error);
        }
    }

    private getCacheKey(text: string): string {
        return `${text}:${this.preferences.rate}:${this.preferences.pitch}`;
    }

    private cleanCache(): void {
        if (this.audioCache.size > this.maxCacheSize) {
            const keys = Array.from(this.audioCache.keys());
            for (let i = 0; i < Math.floor(keys.length * 0.2); i++) {
                URL.revokeObjectURL(this.audioCache.get(keys[i])!.url);
                this.audioCache.delete(keys[i]);
            }
        }
    }

    private async fetchAudio(text: string): Promise<string | null> {
        if (!text) return null;

        const cacheKey = this.getCacheKey(text);
        if (this.audioCache.has(cacheKey)) {
            const entry = this.audioCache.get(cacheKey)!;
            entry.timestamp = Date.now();
            return entry.url;
        }

        try {
            const response = await fetch(`${API_BASE}/api/voice/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    rate: this.preferences.rate,
                    pitch: this.preferences.pitch
                })
            });

            if (!response.ok) throw new Error('TTS Failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            this.audioCache.set(cacheKey, { url, timestamp: Date.now() });
            this.cleanCache();
            return url;
        } catch (e) {
            console.error('TTS Error', e);
            return null;
        }
    }

    public prefetch(texts: string[]): void {
        texts.forEach(text => {
            if (!this.audioCache.has(this.getCacheKey(text))) {
                this.fetchAudio(text).catch(() => { });
            }
        });
    }

    public async speak(text: string, interrupt: boolean = false): Promise<void> {
        if (!text) return;

        if (interrupt) {
            this.stop();
        } else if (this.isSpeaking) {
            this.speechQueue.push({ text, delay: 0 });
            return;
        }

        this.isSpeaking = true;
        if (this.config.onSpeechStart) this.config.onSpeechStart();

        const url = await this.fetchAudio(text);

        if (!this.isSpeaking) return;

        if (url) {
            this.currentAudio = new Audio(url);
            this.currentAudio.onended = () => {
                this.isSpeaking = false;
                if (this.config.onSpeechEnd) this.config.onSpeechEnd();
                this.processQueue();
            };
            this.currentAudio.onerror = () => {
                this.isSpeaking = false;
                this.processQueue();
            };
            await this.currentAudio.play();
        } else {
            this.isSpeaking = false;
            this.processQueue();
        }
    }

    private processQueue(): void {
        if (this.speechQueue.length > 0) {
            const next = this.speechQueue.shift()!;
            this.speak(next.text, true);
        }
    }

    public stop(): void {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.speechQueue = [];
        this.isSpeaking = false;
        if (this.config.onSpeechEnd) this.config.onSpeechEnd();
    }

    public pause(): void {
        if (this.currentAudio) this.currentAudio.pause();
    }

    public resume(): void {
        if (this.currentAudio && this.currentAudio.paused) this.currentAudio.play();
    }

    public updatePreferences(prefs: Partial<VoicePreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        if (this.recognition && prefs.language) this.recognition.lang = prefs.language;
    }

    public getPreferences() { return this.preferences; }

    public destroy(): void {
        this.stop();
        this.stopListening();
        this.audioCache.forEach(v => URL.revokeObjectURL(v.url));
        this.audioCache.clear();
    }
}
