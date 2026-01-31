
export interface BrowserCompatibility {
    ttsSupported: boolean;
    sttSupported: boolean;
    browserName: string;
    isFullySupported: boolean;
    warningMessage: string | null;
}

function detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('edg/')) return 'Edge';
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
    if (userAgent.includes('opera') || userAgent.includes('opr/')) return 'Opera';

    return 'Unknown';
}


function checkTTSSupport(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function checkSTTSupport(): boolean {
    return (
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window
    );
}

export function getBrowserCompatibility(): BrowserCompatibility {
    const browserName = detectBrowser();
    const ttsSupported = checkTTSSupport();
    const sttSupported = checkSTTSupport();

    const isFullySupported = ttsSupported && sttSupported;

    let warningMessage: string | null = null;

    if (!ttsSupported && !sttSupported) {
        warningMessage =
            'Voice learning is not supported in this browser. Please use Chrome or Edge for the best experience.';
    } else if (ttsSupported && !sttSupported) {
        warningMessage =
            'Voice learning works best in Chrome or Edge. Voice commands may not work fully in this browser. ' +
            'Speech output will work, but you may need to use keyboard or mouse for some actions.';
    } else if (!ttsSupported && sttSupported) {
        warningMessage =
            'Speech output is not supported in this browser. Please use Chrome or Edge for the full voice learning experience.';
    }

    return {
        ttsSupported,
        sttSupported,
        browserName,
        isFullySupported,
        warningMessage,
    };
}

export function getSpokenWarning(compatibility: BrowserCompatibility): string | null {
    if (compatibility.isFullySupported) {
        return null;
    }

    if (!compatibility.ttsSupported) {
        return 'Voice learning is not supported in this browser. Please switch to Chrome or Edge.';
    }

    if (!compatibility.sttSupported) {
        return 'Voice learning works best in Chrome or Edge. Voice commands may not work fully in this browser. ' +
            'Say continue to proceed, or say cancel to exit voice mode.';
    }

    return null;
}
