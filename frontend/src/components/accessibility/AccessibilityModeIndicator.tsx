import { Mic, Volume2 } from 'lucide-react';
import { useAccessibilityModeOptional } from '@/context/AccessibilityModeContext';
import './AccessibilityModeIndicator.css';

export function AccessibilityModeIndicator() {
    const ctx = useAccessibilityModeOptional();
    if (!ctx || !ctx.isOn) return null;

    return (
        <div className="accessibility-indicator">
            {ctx.isListening ? (
                <>
                    <Mic className="indicator-icon listening" />
                    <span className="indicator-text">Listening</span>
                </>
            ) : ctx.isSpeaking ? (
                <>
                    <Volume2 className="indicator-icon speaking" />
                    <span className="indicator-text">Speaking</span>
                </>
            ) : (
                <>
                    <div className="indicator-dot idle" />
                    <span className="indicator-text-muted">Ctrl</span>
                </>
            )}
        </div>
    );
}
