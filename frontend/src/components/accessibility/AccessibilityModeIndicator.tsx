import { useAccessibilityModeOptional } from '@/context/AccessibilityModeContext';
import './AccessibilityModeIndicator.css';

export function AccessibilityModeIndicator() {
    const { isAccessibilityModeOn, isSpeaking, isListening } = useAccessibilityModeOptional();

    if (!isAccessibilityModeOn) return null;

    return (
        <div className="accessibility-mode-indicator">
            <div className="accessibility-indicator-content">
                <div className={`accessibility-status ${isSpeaking ? 'speaking' : ''} ${isListening ? 'listening' : ''}`}>
                    <span className="accessibility-icon">
                        {isSpeaking && !isListening && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        )}
                        {isListening && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        )}
                        {!isSpeaking && !isListening && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                        )}
                    </span>
                    <span className="accessibility-text">
                        {isListening && 'Listening...'}
                        {isSpeaking && !isListening && 'Speaking...'}
                        {!isSpeaking && !isListening && 'Hold Ctrl to speak'}
                    </span>
                </div>
            </div>
        </div>
    );
}
