import { useState, useEffect, useCallback, useMemo } from 'react';
import { performanceManager } from './PerformanceManager';
import type { PerformanceSettings, PerformanceTier } from './PerformanceManager';
import type { Transition } from 'framer-motion';

export function usePerformance() {
    const [settings, setSettings] = useState<PerformanceSettings>(() =>
        performanceManager.getSettings()
    );

    useEffect(() => {
        const unsubscribe = performanceManager.subscribe(setSettings);
        return unsubscribe;
    }, []);

    const setManualTier = useCallback((tier: PerformanceTier | null) => {
        performanceManager.setManualTier(tier);
    }, []);

    return {
        settings,
        tier: settings.tier,
        setManualTier,
        isManualOverride: performanceManager.hasManualOverride(),
        getFPS: () => performanceManager.getFPS(),
    };
}

export function useOptimizedTransition(
    baseTransition?: Transition,
    options?: { skipOnLow?: boolean }
): Transition {
    const { settings } = usePerformance();

    return useMemo(() => {
        if (!settings.enableAnimations || options?.skipOnLow && settings.tier === 'low') {
            return { duration: 0 };
        }

        const duration = (baseTransition as any)?.duration ?? 0.3;
        const adjustedDuration = duration * settings.animationDuration;

        if (!settings.enableSpringAnimations && (baseTransition as any)?.type === 'spring') {
            return { duration: adjustedDuration, ease: 'easeOut' };
        }

        if (baseTransition) {
            return { ...baseTransition, duration: adjustedDuration };
        }

        return { duration: adjustedDuration, ease: 'easeOut' };
    }, [settings, baseTransition, options?.skipOnLow]);
}

export function useEffectEnabled(effect: keyof PerformanceSettings): boolean {
    const { settings } = usePerformance();
    return settings[effect] as boolean;
}

export function useShouldRender(
    feature: 'particles' | 'parallax' | 'blur' | 'glow' | '3d' | 'video'
): boolean {
    const { settings } = usePerformance();

    switch (feature) {
        case 'particles': return settings.enableParticles;
        case 'parallax': return settings.enableParallax;
        case 'blur': return settings.enableBlur;
        case 'glow': return settings.enableGlowEffects;
        case '3d': return settings.enable3D;
        case 'video': return settings.enableVideoBackgrounds;
        default: return true;
    }
}

export function useOptimizedClasses(classes: {
    base: string;
    withBlur?: string;
    withShadow?: string;
    withGlow?: string;
    noBlur?: string;
    noShadow?: string;
    noGlow?: string;
}): string {
    const { settings } = usePerformance();

    return useMemo(() => {
        const classList = [classes.base];

        if (classes.withBlur && settings.enableBlur) classList.push(classes.withBlur);
        else if (classes.noBlur) classList.push(classes.noBlur);

        if (classes.withShadow && settings.enableShadows) classList.push(classes.withShadow);
        else if (classes.noShadow) classList.push(classes.noShadow);

        if (classes.withGlow && settings.enableGlowEffects) classList.push(classes.withGlow);
        else if (classes.noGlow) classList.push(classes.noGlow);

        return classList.filter(Boolean).join(' ');
    }, [classes, settings]);
}

export function useOptimizedVariants<T extends Record<string, any>>(variants: T): T {
    const { settings } = usePerformance();

    return useMemo(() => {
        if (!settings.enableAnimations) {
            const simplified: any = {};
            for (const key of Object.keys(variants)) {
                simplified[key] = { ...variants[key], transition: { duration: 0 } };
            }
            return simplified as T;
        }

        if (settings.animationDuration !== 1) {
            const adjusted: any = {};
            for (const key of Object.keys(variants)) {
                const variant = variants[key];
                if (variant.transition) {
                    adjusted[key] = {
                        ...variant,
                        transition: {
                            ...variant.transition,
                            duration: (variant.transition.duration || 0.3) * settings.animationDuration,
                        },
                    };
                } else {
                    adjusted[key] = variant;
                }
            }
            return adjusted as T;
        }

        return variants;
    }, [variants, settings]);
}
