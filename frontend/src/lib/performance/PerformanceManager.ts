export type PerformanceTier = 'high' | 'medium' | 'low' | 'minimal';

export interface PerformanceSettings {
    tier: PerformanceTier;
    enableAnimations: boolean;
    animationDuration: number;
    enableSpringAnimations: boolean;
    enableParallax: boolean;
    enableBlur: boolean;
    enableShadows: boolean;
    enableGradients: boolean;
    enableGlowEffects: boolean;
    enableParticles: boolean;
    enable3D: boolean;
    enableVideoBackgrounds: boolean;
    imageQuality: 'high' | 'medium' | 'low';
    maxConcurrentAnimations: number;
}

const PERFORMANCE_TIERS: Record<PerformanceTier, PerformanceSettings> = {
    high: {
        tier: 'high',
        enableAnimations: true,
        animationDuration: 1,
        enableSpringAnimations: true,
        enableParallax: true,
        enableBlur: true,
        enableShadows: true,
        enableGradients: true,
        enableGlowEffects: true,
        enableParticles: true,
        enable3D: true,
        enableVideoBackgrounds: true,
        imageQuality: 'high',
        maxConcurrentAnimations: 20,
    },
    medium: {
        tier: 'medium',
        enableAnimations: true,
        animationDuration: 1, // Full speed
        enableSpringAnimations: true, // premium feel
        enableParallax: false, // Disabling parallax helps scroll perf significantly without visual degradation
        enableBlur: true,
        enableShadows: true,
        enableGradients: true,
        enableGlowEffects: true, // Keep glow
        enableParticles: true, // Keep particles (components should reduce count)
        enable3D: true,
        enableVideoBackgrounds: true, // Keep video
        imageQuality: 'high', // Keep high quality images
        maxConcurrentAnimations: 15,
    },
    low: {
        tier: 'low',
        enableAnimations: true,
        animationDuration: 0.5,
        enableSpringAnimations: false,
        enableParallax: false,
        enableBlur: false,
        enableShadows: false,
        enableGradients: true,
        enableGlowEffects: false,
        enableParticles: false,
        enable3D: false,
        enableVideoBackgrounds: false,
        imageQuality: 'low',
        maxConcurrentAnimations: 5,
    },
    minimal: {
        tier: 'minimal',
        enableAnimations: false,
        animationDuration: 0,
        enableSpringAnimations: false,
        enableParallax: false,
        enableBlur: false,
        enableShadows: false,
        enableGradients: false,
        enableGlowEffects: false,
        enableParticles: false,
        enable3D: false,
        enableVideoBackgrounds: false,
        imageQuality: 'low',
        maxConcurrentAnimations: 0,
    },
};

type PerformanceListener = (settings: PerformanceSettings) => void;

class PerformanceManager {
    private currentTier: PerformanceTier = 'high';
    private manualOverride: PerformanceTier | null = null;
    private frameTimestamps: number[] = [];
    private isMonitoring = false;
    private rafId: number | null = null;
    private listeners: Set<PerformanceListener> = new Set();
    private lastTierChange = 0;
    private consecutiveLowFps = 0;
    private consecutiveHighFps = 0;

    private readonly TARGET_FPS = 55;
    private readonly LOW_FPS_THRESHOLD = 20;
    private readonly SAMPLE_SIZE = 60;
    private readonly TIER_CHANGE_COOLDOWN = 3000;
    private readonly UPGRADE_THRESHOLD = 120;

    constructor() {
        this.detectInitialTier();
    }

    private detectInitialTier(): void {
        const nav = navigator as any;
        if (nav.deviceMemory) {
            if (nav.deviceMemory < 2) { this.currentTier = 'low'; return; }
            if (nav.deviceMemory < 4) { this.currentTier = 'medium'; return; }
        }

        if (navigator.hardwareConcurrency) {
            if (navigator.hardwareConcurrency <= 2) { this.currentTier = 'low'; return; }
            if (navigator.hardwareConcurrency <= 4) { this.currentTier = 'medium'; return; }
        }

        const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
        if (connection) {
            const effectiveType = connection.effectiveType;
            if (effectiveType === 'slow-2g' || effectiveType === '2g') { this.currentTier = 'low'; return; }
            if (effectiveType === '3g') { this.currentTier = 'medium'; return; }
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) { this.currentTier = 'medium'; return; }

        this.currentTier = 'high';
    }

    public startMonitoring(): void {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.frameTimestamps = [];
        this.measureFrame();
    }

    public stopMonitoring(): void {
        this.isMonitoring = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private measureFrame = (): void => {
        if (!this.isMonitoring) return;

        const now = performance.now();
        this.frameTimestamps.push(now);

        if (this.frameTimestamps.length > this.SAMPLE_SIZE) {
            this.frameTimestamps.shift();
        }

        if (this.frameTimestamps.length >= 30 && this.frameTimestamps.length % 30 === 0) {
            this.evaluatePerformance();
        }

        this.rafId = requestAnimationFrame(this.measureFrame);
    };

    private calculateFPS(): number {
        if (this.frameTimestamps.length < 2) return 60;

        const first = this.frameTimestamps[0];
        const last = this.frameTimestamps[this.frameTimestamps.length - 1];
        const duration = last - first;

        if (duration === 0) return 60;
        return Math.round((this.frameTimestamps.length - 1) / (duration / 1000));
    }

    private evaluatePerformance(): void {
        if (this.manualOverride !== null) return;

        const fps = this.calculateFPS();
        const now = Date.now();

        if (now - this.lastTierChange < this.TIER_CHANGE_COOLDOWN) return;

        if (fps < this.LOW_FPS_THRESHOLD) {
            this.consecutiveLowFps++;
            this.consecutiveHighFps = 0;
        } else if (fps >= this.TARGET_FPS) {
            this.consecutiveHighFps++;
            this.consecutiveLowFps = 0;
        } else {
            this.consecutiveLowFps = Math.max(0, this.consecutiveLowFps - 1);
            this.consecutiveHighFps = Math.max(0, this.consecutiveHighFps - 1);
        }

        if (this.consecutiveLowFps >= 2) {
            this.downgradeTier();
            this.consecutiveLowFps = 0;
        } else if (this.consecutiveHighFps >= this.UPGRADE_THRESHOLD / 30) {
            this.upgradeTier();
            this.consecutiveHighFps = 0;
        }
    }

    private downgradeTier(): void {
        const tiers: PerformanceTier[] = ['high', 'medium', 'low', 'minimal'];
        const currentIndex = tiers.indexOf(this.currentTier);

        if (currentIndex < tiers.length - 1) {
            this.setTier(tiers[currentIndex + 1]);
        }
    }

    private upgradeTier(): void {
        const tiers: PerformanceTier[] = ['high', 'medium', 'low', 'minimal'];
        const currentIndex = tiers.indexOf(this.currentTier);

        if (currentIndex > 0) {
            this.setTier(tiers[currentIndex - 1]);
        }
    }

    private setTier(tier: PerformanceTier): void {
        if (this.currentTier === tier) return;

        this.currentTier = tier;
        this.lastTierChange = Date.now();
        this.notifyListeners();
        this.applyTierToDOM();
    }

    private applyTierToDOM(): void {
        const settings = this.getSettings();
        const root = document.documentElement;

        root.classList.remove('perf-high', 'perf-medium', 'perf-low', 'perf-minimal');
        root.classList.add(`perf-${this.currentTier}`);

        root.style.setProperty('--animation-duration-multiplier', String(settings.animationDuration));
        root.style.setProperty('--blur-enabled', settings.enableBlur ? '1' : '0');
        root.style.setProperty('--shadow-enabled', settings.enableShadows ? '1' : '0');
    }

    public subscribe(listener: PerformanceListener): () => void {
        this.listeners.add(listener);
        listener(this.getSettings());
        return () => { this.listeners.delete(listener); };
    }

    private notifyListeners(): void {
        const settings = this.getSettings();
        this.listeners.forEach(listener => listener(settings));
    }

    public getSettings(): PerformanceSettings {
        return { ...PERFORMANCE_TIERS[this.currentTier] };
    }

    public getTier(): PerformanceTier {
        return this.currentTier;
    }

    public getFPS(): number {
        return this.calculateFPS();
    }

    public setManualTier(tier: PerformanceTier | null): void {
        this.manualOverride = tier;
        if (tier !== null) {
            this.setTier(tier);
        }
    }

    public hasManualOverride(): boolean {
        return this.manualOverride !== null;
    }
}

export const performanceManager = new PerformanceManager();

if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
        performanceManager.startMonitoring();
        const settings = performanceManager.getSettings();
        document.documentElement.classList.add(`perf-${settings.tier}`);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            performanceManager.stopMonitoring();
        } else {
            performanceManager.startMonitoring();
        }
    });

    (window as any).perf = {
        getTier: () => performanceManager.getTier(),
        getFPS: () => performanceManager.getFPS(),
        getSettings: () => performanceManager.getSettings(),
        setTier: (tier: PerformanceTier) => performanceManager.setManualTier(tier),
        auto: () => performanceManager.setManualTier(null),
        high: () => performanceManager.setManualTier('high'),
        medium: () => performanceManager.setManualTier('medium'),
        low: () => performanceManager.setManualTier('low'),
        minimal: () => performanceManager.setManualTier('minimal'),
        help: () => console.log(`
🎮 Performance Debug Commands:
  perf.getTier()     - Get current tier
  perf.getFPS()      - Get current FPS
  perf.getSettings() - Get all settings
  perf.high()        - Force high quality
  perf.medium()      - Force balanced
  perf.low()         - Force performance mode
  perf.minimal()     - Force minimal (no animations)
  perf.auto()        - Reset to automatic
    `),
    };
    console.log('🎮 Performance manager loaded. Type perf.help() for commands.');
}
