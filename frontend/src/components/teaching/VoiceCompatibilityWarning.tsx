

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import type { BrowserCompatibility } from '@/lib/voice/browserCompatibility';

interface VoiceCompatibilityWarningProps {
    isOpen: boolean;
    compatibility: BrowserCompatibility;
    onContinue: () => void;
    onCancel: () => void;
    onSpeak: (text: string) => void;
}

export function VoiceCompatibilityWarning({
    isOpen,
    compatibility,
    onContinue,
    onCancel,
    onSpeak,
}: VoiceCompatibilityWarningProps) {

    useEffect(() => {
        if (isOpen && compatibility.warningMessage) {

            setTimeout(() => {
                onSpeak(compatibility.warningMessage || '');
            }, 500);
        }
    }, [isOpen, compatibility.warningMessage, onSpeak]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="compatibility-warning-title"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md mx-4 p-6 bg-background rounded-2xl shadow-2xl border border-border"
                >

                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>


                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/20 mb-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>


                    <h2
                        id="compatibility-warning-title"
                        className="text-xl font-semibold text-foreground mb-2"
                    >
                        Browser Compatibility Notice
                    </h2>


                    <p className="text-sm text-muted-foreground mb-4">
                        Current browser: <strong>{compatibility.browserName}</strong>
                    </p>


                    <div
                        className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mb-6"
                        role="alert"
                        aria-live="polite"
                    >
                        <p className="text-sm text-foreground leading-relaxed">
                            {compatibility.warningMessage}
                        </p>
                    </div>


                    <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                            <div
                                className={`w-2 h-2 rounded-full ${compatibility.ttsSupported ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                            />
                            <span>Speech Output (TTS): {compatibility.ttsSupported ? 'Supported' : 'Not Supported'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div
                                className={`w-2 h-2 rounded-full ${compatibility.sttSupported ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}
                            />
                            <span>Voice Commands (STT): {compatibility.sttSupported ? 'Supported' : 'Limited Support'}</span>
                        </div>
                    </div>


                    {!compatibility.isFullySupported && (
                        <div className="p-3 rounded-lg bg-muted/50 mb-6">
                            <p className="text-xs text-muted-foreground">
                                <strong>Recommendation:</strong> For the best experience, use Google Chrome or Microsoft Edge.
                            </p>
                        </div>
                    )}


                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                            aria-label="Cancel voice mode"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onContinue}
                            className="flex-1 px-4 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            aria-label="Continue with voice mode"
                        >
                            Continue Anyway
                        </button>
                    </div>


                    <p className="text-xs text-center text-muted-foreground mt-4">
                        Say "continue" to proceed or "cancel" to exit
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
