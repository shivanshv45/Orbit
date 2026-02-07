import type { VoicePreferences } from '@/types/voice';
import { loadVoicePreferences, validatePreferences, updateVoicePreferences } from './VoicePreferences';
import { audioCacheDB } from './AudioCache';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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
    private stopGeneration = 0;
    private lastSpeakTime = 0;
    private activeGeneration = 0;
    private audioContext: AudioContext | null = null;
    private audioUnlocked = false;
    private backendFailures = 0;
    private useBrowserFallback = false;
    private currentUtterance: SpeechSynthesisUtterance | null = null;

    private recognition: any = null;
    private hasProcessedResult = false;

    private onResult: ((text: string) => void) | null = null;
    private onListeningChange: ((listening: boolean) => void) | null = null;
    private onSpeakingChange: ((speaking: boolean) => void) | null = null;

    constructor() {
        this.preferences = validatePreferences(loadVoicePreferences());
        loadManifest();
        this.initRecognition();
        this.initAudioContext();
    }

    private initAudioContext(): void {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            const unlockAudio = () => {
                if (this.audioUnlocked || !this.audioContext) return;

                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {

                        this.audioUnlocked = true;
                    });
                } else {
                    this.audioUnlocked = true;
                }

                const buffer = this.audioContext.createBuffer(1, 1, 22050);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);


            };

            document.addEventListener('click', unlockAudio, { once: false });
            document.addEventListener('keydown', unlockAudio, { once: false });
            document.addEventListener('touchstart', unlockAudio, { once: false });
        } catch (e) {
            console.warn('AudioContext not available:', e);
        }
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
                this.isListening = true;
                this.hasProcessedResult = false;
                this.onListeningChange?.(true);

            };

            this.recognition.onresult = (e: any) => {
                if (this.hasProcessedResult) return;

                const result = e.results[0];
                if (result) {
                    const transcript = result[0].transcript.trim();


                    if (transcript && this.onResult) {
                        this.hasProcessedResult = true;
                        this.onResult(transcript);
                    }
                }
            };

            this.recognition.onerror = (e: any) => {

                if (e.error === 'network') {
                    this.speak('Check internet connection');
                } else if (e.error === 'not-allowed') {
                    this.speak('Please allow microphone access');
                } else if (e.error === 'audio-capture') {
                    this.speak('No microphone found');
                }
                this.isListening = false;
                this.onListeningChange?.(false);
            };

            this.recognition.onend = () => {

                this.isListening = false;
                this.onListeningChange?.(false);
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

            } else {

            }
        }
    }

    public stopListening(): void {
        if (!this.recognition || !this.isListening) return;

        this.isListening = false;
        this.onListeningChange?.(false);

        try {
            this.recognition.stop();
        } catch { }
    }

    public stopSpeaking(): void {
        this.isProcessingQueue = false;
        this.speechQueue = [];

        if (this.currentAudio) {
            const audioToStop = this.currentAudio;
            this.currentAudio = null;
            try {
                audioToStop.pause();
                audioToStop.onended = null;
                audioToStop.onerror = null;
                audioToStop.currentTime = 0;
                audioToStop.src = '';
            } catch (e) {
            }
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.currentUtterance = null;

        this.isSpeaking = false;
        this.onSpeakingChange?.(false);
    }

    public speak(text: string, interrupt = true): void {
        if (!text?.trim()) return;

        const now = Date.now();
        const timeSinceLastSpeak = now - this.lastSpeakTime;
        this.lastSpeakTime = now;



        const gen = interrupt ? ++this.stopGeneration : this.stopGeneration;

        if (interrupt) {
            if (this.currentAudio) {
                try {
                    this.currentAudio.pause();
                    this.currentAudio.onended = null;
                    this.currentAudio.onerror = null;
                } catch (e) { }
                this.currentAudio = null;
            }
            this.speechQueue = [];
        }

        this.speechQueue.push(text);

        const delay = timeSinceLastSpeak < 100 ? 150 : 10;

        setTimeout(() => {
            if (this.stopGeneration === gen) {
                this.activeGeneration = gen;
                this.isProcessingQueue = false;
                this.processQueue();
            } else {
                // console.log('🔊 queue skipped: gen mismatch', gen, this.stopGeneration);
            }
        }, delay);
    }

    public speakMultiple(texts: string[]): void {
        const filtered = texts.filter(t => t?.trim());
        if (filtered.length === 0) return;

        const now = Date.now();
        const timeSinceLastSpeak = now - this.lastSpeakTime;
        this.lastSpeakTime = now;



        const gen = ++this.stopGeneration;

        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.onended = null;
                this.currentAudio.onerror = null;
            } catch (e) { }
            this.currentAudio = null;
        }

        this.speechQueue = [...filtered];

        const delay = timeSinceLastSpeak < 100 ? 150 : 10;

        setTimeout(() => {
            if (this.stopGeneration === gen) {
                this.activeGeneration = gen;
                this.isProcessingQueue = false;
                this.processQueue();
            } else {
                // console.log('🔊 queue skipped: gen mismatch', gen, this.stopGeneration);
            }
        }, delay);
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue) return;

        const itemsToPlay = [...this.speechQueue];
        this.speechQueue = [];

        if (itemsToPlay.length === 0) {
            this.isSpeaking = false;
            this.onSpeakingChange?.(false);
            return;
        }

        this.isProcessingQueue = true;
        this.isSpeaking = true;
        this.onSpeakingChange?.(true);

        const gen = this.activeGeneration;

        try {
            for (const text of itemsToPlay) {
                if (this.stopGeneration !== gen) {
                    break;
                }

                await this.playText(text);
            }

        } catch (e) {
            console.error('Error processing speech queue:', e);
        } finally {
            this.isProcessingQueue = false;
            this.isSpeaking = false;
            this.onSpeakingChange?.(false);
        }
    }

    private async playText(text: string): Promise<void> {
        const gen = this.activeGeneration;

        if (this.stopGeneration !== gen) {
            return;
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) { }
        }

        try {
            if (this.useBrowserFallback) {
                await this.playWithBrowserTTS(text, gen);
                return;
            }

            const audioUrl = await this.getAudioUrl(text);
            if (!audioUrl) {
                this.backendFailures++;
                if (this.backendFailures >= 3) {
                    this.useBrowserFallback = true;
                }
                await this.playWithBrowserTTS(text, gen);
                return;
            }

            this.backendFailures = 0;

            if (this.stopGeneration !== gen) {

                return;
            }

            const audio = new Audio(audioUrl);
            const rate = this.preferences?.rate || 1;
            audio.playbackRate = Math.max(0.1, Math.min(rate, 4.0));

            try {

                await audio.play();

                if (this.stopGeneration !== gen) {

                    audio.pause();
                    return;
                }

                this.currentAudio = audio;

            } catch (e: any) {
                // console.log('🔊 play() error, falling back to browser TTS:', e.name, e.message);
                await this.playWithBrowserTTS(text, gen);
                return;
            }

            await new Promise<void>((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.stopGeneration !== gen) {

                        clearInterval(checkInterval);
                        audio.pause();
                        if (this.currentAudio === audio) {
                            this.currentAudio = null;
                        }
                        resolve();
                        return;
                    }

                    if (audio.ended) {

                        clearInterval(checkInterval);
                        if (this.currentAudio === audio) {
                            this.currentAudio = null;
                        }
                        resolve();
                    }
                }, 100);

                audio.onended = () => {

                    clearInterval(checkInterval);
                    if (this.currentAudio === audio) {
                        this.currentAudio = null;
                    }
                    resolve();
                };
            });


        } catch (e) {
            console.error('Error in playText, using browser fallback:', e);
            await this.playWithBrowserTTS(text, gen);
        }
    }

    private async playWithBrowserTTS(text: string, gen: number): Promise<void> {
        if (!('speechSynthesis' in window)) {
            console.warn('🔊 Browser TTS not supported');
            return;
        }

        if (this.stopGeneration !== gen) {
            return;
        }

        return new Promise<void>((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = this.preferences?.rate || 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'en-US';

            this.currentUtterance = utterance;
            let resolved = false;

            const cleanup = () => {
                if (resolved) return;
                resolved = true;
                clearInterval(checkCancel);
                this.currentUtterance = null;
                resolve();
            };

            utterance.onend = () => {

                cleanup();
            };

            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                // Only log non-expected errors (interrupted/canceled are expected during cancellation)
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    console.error('🔊 Browser TTS error:', e.error);
                }
                cleanup();
            };

            const checkCancel = setInterval(() => {
                if (this.stopGeneration !== gen) {

                    window.speechSynthesis.cancel();
                    cleanup();
                }
            }, 100);


            window.speechSynthesis.speak(utterance);
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

        try {
            const cachedBlob = await audioCacheDB.get(key);
            if (cachedBlob) {
                const url = URL.createObjectURL(cachedBlob);
                this.audioCache.set(key, url);
                return url;
            }
        } catch (e) {
            console.warn('Failed to read from audio DB', e);
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
                    audioCacheDB.set(key, blob).catch(e => console.warn('Cache write failed', e));

                    const url = URL.createObjectURL(blob);
                    this.audioCache.set(key, url);
                    return url;
                }
            }
        } catch { }

        return null;
    }

    public async prefetch(texts: string[]): Promise<void> {
        const uniqueTexts = [...new Set(texts.filter(t => t?.trim()))];
        const CONCURRENT_LIMIT = 5;

        for (let i = 0; i < uniqueTexts.length; i += CONCURRENT_LIMIT) {
            const batch = uniqueTexts.slice(i, i + CONCURRENT_LIMIT);
            await Promise.all(batch.map(text => {
                const key = text.toLowerCase().trim();
                if (!this.audioCache.has(key) && !this.pendingFetches.has(key)) {
                    return this.getAudioUrl(text);
                }
                return Promise.resolve();
            }));
            if (i + CONCURRENT_LIMIT < uniqueTexts.length) {
                await new Promise(r => setTimeout(r, 20));
            }
        }
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
