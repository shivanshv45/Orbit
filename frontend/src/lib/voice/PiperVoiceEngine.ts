import type { VoicePreferences } from '@/types/voice';
import { loadVoicePreferences, validatePreferences, updateVoicePreferences } from './VoicePreferences';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const VOICE_CACHE_BASE = '/voice_cache';

let manifest: Record<string, string> = {};
let manifestLoaded = false;

async function loadManifest(): Promise<void> {
    if (manifestLoaded) return;
    try {
        const res = await fetch(`${VOICE_CACHE_BASE}/manifest.json`);
        if (res.ok) manifest = await res.json();
    } catch { }
    manifestLoaded = true;
}

export class PiperVoiceEngine {
    private preferences: VoicePreferences;
    private audioCache: Map<string, string> = new Map();
    private pendingFetches: Map<string, Promise<string | null>> = new Map();
    private currentAudio: HTMLAudioElement | null = null;
    private speechQueue: string[] = [];
    private isProcessingQueue = false;
    private isSpeaking = false;
    private isListening = false;

    private recognition: any = null;

    private onResult: ((text: string) => void) | null = null;
    private onListeningChange: ((listening: boolean) => void) | null = null;
    private onSpeakingChange: ((speaking: boolean) => void) | null = null;

    constructor() {
        this.preferences = validatePreferences(loadVoicePreferences());
        loadManifest();
        this.initRecognition();
    }

    private initRecognition(): void {
        const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechAPI) {
            console.warn('Speech recognition not supported - use Chrome or Edge');
            return;
        }

        try {
            this.recognition = new SpeechAPI();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onstart = () => {
                if (!this.isListening) {
                    this.isListening = true;
                    this.onListeningChange?.(true);
                    console.log('Listening...');
                }
            };

            this.recognition.onresult = (e: any) => {
                const text = e.results[0][0].transcript.trim();
                console.log('Heard:', text);
                if (text && this.onResult) {
                    this.onResult(text);
                }
            };

            this.recognition.onerror = (e: any) => {
                if (e.error !== 'aborted' && e.error !== 'no-speech') {
                    console.log('Recognition error:', e.error);
                    if (e.error === 'network') {
                        this.speak('Voice commands require Chrome or Edge browser');
                    }
                }
                this.isListening = false;
                this.onListeningChange?.(false);
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    this.isListening = false;
                    this.onListeningChange?.(false);
                }
            };

        } catch (e) {
            console.error('Failed to init recognition:', e);
        }
    }

    public setCallbacks(
        onResult: (text: string) => void,
        onListeningChange: (listening: boolean) => void,
        onSpeakingChange: (speaking: boolean) => void
    ): void {
        this.onResult = onResult;
        this.onListeningChange = onListeningChange;
        this.onSpeakingChange = onSpeakingChange;
    }

    public async requestMic(): Promise<boolean> {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
        } catch (e) {
            console.error('Mic access denied:', e);
            return false;
        }
    }

    public startListening(): void {
        if (!this.recognition) {
            this.speak('Voice commands not supported. Use Chrome or Edge.');
            return;
        }

        if (this.isListening) return;

        this.stopSpeaking();

        try {
            this.recognition.start();
        } catch (e: any) {
            if (e.message && e.message.includes('already started')) {
                console.log('Recognition already running');
            } else {
                console.log('Recognition start failed:', e);
            }
        }
    }

    public stopListening(): void {
        if (!this.recognition || !this.isListening) return;

        try {
            this.recognition.stop();
        } catch { }

        this.isListening = false;
        this.onListeningChange?.(false);
    }

    public stopSpeaking(): void {
        this.isProcessingQueue = false;
        this.speechQueue = [];

        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.currentAudio.src = '';
                this.currentAudio.load();
            } catch (e) {
            }
            try {
                this.currentAudio.remove?.();
            } catch (e) {
            }
            this.currentAudio = null;
        }

        this.isSpeaking = false;
        this.onSpeakingChange?.(false);
    }

    public speak(text: string, interrupt = true): void {
        if (!text?.trim()) return;

        if (interrupt) {
            this.stopSpeaking();
        }

        this.speechQueue.push(text);

        if (!this.isProcessingQueue) {
            this.processQueue();
        }
    }

    public speakMultiple(texts: string[]): void {
        const filtered = texts.filter(t => t?.trim());
        if (filtered.length === 0) return;

        this.stopSpeaking();
        this.speechQueue = [...filtered];
        this.processQueue();
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue) return;

        if (this.speechQueue.length === 0) {
            this.isSpeaking = false;
            this.onSpeakingChange?.(false);
            return;
        }

        this.isProcessingQueue = true;
        this.isSpeaking = true;
        this.onSpeakingChange?.(true);

        while (this.speechQueue.length > 0 && this.isProcessingQueue) {
            if (!this.isProcessingQueue) break;

            const text = this.speechQueue.shift()!;
            await this.playText(text);
        }

        this.isProcessingQueue = false;
        this.isSpeaking = false;
        this.onSpeakingChange?.(false);
    }

    private async playText(text: string): Promise<void> {
        if (!this.isProcessingQueue) return;

        const audioUrl = await this.getAudioUrl(text);
        if (!audioUrl || !this.isProcessingQueue) return;

        return new Promise<void>((resolve) => {
            if (!this.isProcessingQueue) {
                resolve();
                return;
            }

            const audio = new Audio(audioUrl);
            this.currentAudio = audio;

            const cleanup = () => {
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                }
                resolve();
            };

            audio.onended = cleanup;
            audio.onerror = cleanup;

            audio.play().catch(cleanup);
        });
    }

    private async getAudioUrl(text: string): Promise<string | null> {
        const key = text.toLowerCase().trim();

        if (this.audioCache.has(key)) {
            return this.audioCache.get(key)!;
        }

        if (this.pendingFetches.has(key)) {
            return this.pendingFetches.get(key)!;
        }

        const staticFile = manifest[key];
        if (staticFile) {
            const url = `${VOICE_CACHE_BASE}/${staticFile}`;
            this.audioCache.set(key, url);
            return url;
        }

        const fetchPromise = this.fetchAudio(text, key);
        this.pendingFetches.set(key, fetchPromise);

        const url = await fetchPromise;
        this.pendingFetches.delete(key);

        return url;
    }

    private async fetchAudio(text: string, key: string): Promise<string | null> {
        try {
            const res = await fetch(`${API_BASE}/api/voice/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, rate: this.preferences.rate || 1.0 })
            });

            if (res.ok) {
                const blob = await res.blob();
                if (blob.size > 100) {
                    const url = URL.createObjectURL(blob);
                    this.audioCache.set(key, url);
                    return url;
                }
            }
        } catch { }

        return null;
    }

    public prefetch(texts: string[]): void {
        texts.forEach(text => {
            const key = text.toLowerCase().trim();
            if (!this.audioCache.has(key) && !this.pendingFetches.has(key)) {
                this.getAudioUrl(text);
            }
        });
    }

    public updatePreferences(prefs: Partial<VoicePreferences>): void {
        this.preferences = { ...this.preferences, ...prefs };
        updateVoicePreferences(prefs);
    }

    public getPreferences(): VoicePreferences {
        return this.preferences;
    }

    public destroy(): void {
        this.stopSpeaking();
        this.stopListening();

        this.audioCache.forEach(url => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
        this.audioCache.clear();
        this.pendingFetches.clear();
    }
}
