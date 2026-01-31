
import type { VoicePreferences, VoiceAnalyticsEvent, VoiceEngineConfig } from '@/types/voice';
import { loadVoicePreferences, validatePreferences } from './VoicePreferences';
import { getBrowserCompatibility } from './browserCompatibility';

type RecognitionType = typeof SpeechRecognition | typeof webkitSpeechRecognition;

export class VoiceEngine {
    private synthesis: SpeechSynthesis;
    private recognition: SpeechRecognition | null = null;
    private preferences: VoicePreferences;
    private config: VoiceEngineConfig;
    private isSpeaking = false;
    private isListening = false;
    private speechQueue: string[] = [];
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private useServerSTT = false;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private continuousMode = false;

    constructor(config: VoiceEngineConfig = {}) {
        this.synthesis = window.speechSynthesis;
        this.config = config;
        this.preferences = validatePreferences(loadVoicePreferences());

        this.initializeRecognition();
    }

    private initializeRecognition(): void {
        const compatibility = getBrowserCompatibility();

        if (compatibility.sttSupported) {
            const SpeechRecognitionAPI = (window as any).SpeechRecognition ||
                (window as any).webkitSpeechRecognition;

            this.recognition = new SpeechRecognitionAPI();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.preferences.language;
            this.recognition.maxAlternatives = 1;

            this.setupRecognitionHandlers();
        } else {
            this.useServerSTT = true;
        }
    }

    private setupRecognitionHandlers(): void {
        if (!this.recognition) return;

        this.recognition.onresult = (event) => {
            const result = event.results[0];
            const transcript = result[0].transcript.trim();
            const confidence = result[0].confidence;

            this.isListening = false;

            if (this.config.onRecognitionResult) {
                this.config.onRecognitionResult(transcript, confidence);
            }

            if (this.config.onAnalyticsEvent) {
                this.config.onAnalyticsEvent({
                    type: 'command_recognized',
                    utterance: transcript,
                    confidence,
                    timestamp: Date.now(),
                });
            }
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;

            const error = new Error(`Speech recognition error: ${event.error}`);
            if (this.config.onError) {
                this.config.onError(error);
            }

            if (this.config.onAnalyticsEvent) {
                this.config.onAnalyticsEvent({
                    type: 'command_failed',
                    utterance: '',
                    timestamp: Date.now(),
                });
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            // In continuous mode, auto-restart listening after a brief pause
            if (this.continuousMode && !this.isSpeaking) {
                setTimeout(() => {
                    if (this.continuousMode && !this.isSpeaking) {
                        this.startListening();
                    }
                }, 500);
            }
        };
    }

    private selectVoice(): SpeechSynthesisVoice | null {
        const voices = this.synthesis.getVoices();

        if (voices.length === 0) return null;

        let selectedVoice = voices.find(voice => {
            const matchesName = this.preferences.voiceName &&
                voice.name === this.preferences.voiceName;
            const matchesLang = voice.lang.startsWith(this.preferences.language.split('-')[0]);
            const matchesGender = this.preferences.voiceGender ?
                this.matchesGender(voice, this.preferences.voiceGender) : true;

            return matchesName || (matchesLang && matchesGender);
        });

        if (!selectedVoice) {
            selectedVoice = voices.find(voice =>
                voice.lang.startsWith(this.preferences.language.split('-')[0])
            );
        }

        return selectedVoice || voices[0];
    }

    private matchesGender(voice: SpeechSynthesisVoice, gender: string): boolean {
        const name = voice.name.toLowerCase();

        if (gender === 'female') {
            return name.includes('female') || name.includes('woman') ||
                name.includes('samantha') || name.includes('victoria') ||
                name.includes('karen') || name.includes('susan');
        }

        if (gender === 'male') {
            return name.includes('male') || name.includes('man') ||
                name.includes('daniel') || name.includes('alex') ||
                name.includes('fred') || name.includes('tom');
        }

        return true;
    }

    public speak(text: string, interrupt: boolean = false): void {
        if (interrupt) {
            this.stop();
        }

        if (this.isSpeaking && !interrupt) {
            this.speechQueue.push(text);
            return;
        }

        this.speakImmediate(text);
    }

    private speakImmediate(text: string): void {
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = this.preferences.rate;
        utterance.pitch = this.preferences.pitch;
        utterance.volume = this.preferences.volume;
        utterance.lang = this.preferences.language;

        const voice = this.selectVoice();
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.currentUtterance = utterance;
            if (this.config.onSpeechStart) {
                this.config.onSpeechStart();
            }
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;

            if (this.config.onSpeechEnd) {
                this.config.onSpeechEnd();
            }

            if (this.speechQueue.length > 0) {
                const next = this.speechQueue.shift()!;
                this.speakImmediate(next);
            }
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            this.currentUtterance = null;

            if (event.error === 'interrupted') return;

            if (this.config.onError) {
                this.config.onError(new Error(`Speech synthesis error: ${event.error}`));
            }
        };

        this.synthesis.speak(utterance);
    }

    public pause(): void {
        if (this.isSpeaking && this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }

    public resume(): void {
        if (this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    public stop(): void {
        this.synthesis.cancel();
        this.speechQueue = [];
        this.isSpeaking = false;
        this.currentUtterance = null;
    }

    public async startListening(): Promise<void> {
        if (this.isListening) return;

        this.stop();

        if (this.useServerSTT) {
            await this.startServerSTT();
        } else if (this.recognition) {
            try {
                this.isListening = true;
                this.recognition.start();

                // Only set timeout in non-continuous mode
                if (!this.continuousMode) {
                    setTimeout(() => {
                        if (this.isListening && this.recognition) {
                            this.stopListening();
                        }
                    }, 5000);
                }
            } catch (error) {
                this.isListening = false;
                if (this.config.onError) {
                    this.config.onError(error as Error);
                }
            }
        }
    }

    private async startServerSTT(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioChunks = [];

            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                await this.sendAudioToServer(audioBlob);

                stream.getTracks().forEach(track => track.stop());
            };

            this.isListening = true;
            this.mediaRecorder.start();

            setTimeout(() => {
                if (this.isListening && this.mediaRecorder) {
                    this.stopListening();
                }
            }, 5000);
        } catch (error) {
            this.isListening = false;
            if (this.config.onError) {
                this.config.onError(error as Error);
            }
        }
    }

    private async sendAudioToServer(audioBlob: Blob): Promise<void> {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);
            formData.append('language', this.preferences.language);

            const response = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Server transcription failed');
            }

            const data = await response.json();

            if (this.config.onRecognitionResult) {
                this.config.onRecognitionResult(data.transcript, data.confidence);
            }

            if (this.config.onAnalyticsEvent) {
                this.config.onAnalyticsEvent({
                    type: 'command_recognized',
                    utterance: data.transcript,
                    confidence: data.confidence,
                    timestamp: Date.now(),
                });
            }
        } catch (error) {
            if (this.config.onError) {
                this.config.onError(error as Error);
            }

            if (this.config.onAnalyticsEvent) {
                this.config.onAnalyticsEvent({
                    type: 'command_failed',
                    utterance: '',
                    timestamp: Date.now(),
                });
            }
        }
    }

    public stopListening(): void {
        if (!this.isListening) return;

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        } else if (this.recognition) {
            this.recognition.stop();
        }

        this.isListening = false;
    }

    public updatePreferences(preferences: Partial<VoicePreferences>): void {
        this.preferences = validatePreferences({
            ...this.preferences,
            ...preferences,
        });

        if (this.recognition && preferences.language) {
            this.recognition.lang = preferences.language;
        }
    }

    public get speaking(): boolean {
        return this.isSpeaking;
    }

    public get listening(): boolean {
        return this.isListening;
    }

    public setContinuousMode(enabled: boolean): void {
        this.continuousMode = enabled;
        if (enabled && !this.isListening && !this.isSpeaking) {
            this.startListening();
        } else if (!enabled) {
            // Let current recognition finish naturally
        }
    }

    public get isContinuousMode(): boolean {
        return this.continuousMode;
    }

    public destroy(): void {
        this.stop();
        this.stopListening();

        if (this.recognition) {
            this.recognition.abort();
            this.recognition = null;
        }

        this.speechQueue = [];
    }
}
