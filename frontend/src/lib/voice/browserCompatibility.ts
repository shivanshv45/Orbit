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

function checkSTTSupport(): boolean {
    return (
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window
    );
}

export function getBrowserCompatibility(): BrowserCompatibility {
    const browserName = detectBrowser();
    const ttsSupported = true;
    const sttSupported = checkSTTSupport();

    const isFullySupported = sttSupported;

    let warningMessage: string | null = null;

    if (!sttSupported) {
        warningMessage =
            'Voice commands may not work fully in this browser. ' +
            'Speech output will work, but you may need to use keyboard or mouse for some actions. ' +
            'For the best experience, use Chrome or Edge.';
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

    if (!compatibility.sttSupported) {
        return 'Voice commands may not work fully in this browser. ' +
            'Say continue to proceed, or use keyboard navigation.';
    }

    return null;
}
