import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Zap, Cpu, ChevronDown, Check } from 'lucide-react';
import { usePerformance } from '@/lib/performance';
import type { PerformanceTier } from '@/lib/performance';
import { cn } from '@/lib/utils';

interface PerformanceSettingsProps {
    showDebugInfo?: boolean;
}

const TIER_INFO: Record<PerformanceTier, { label: string; description: string; icon: typeof Zap }> = {
    high: { label: 'High Quality', description: 'All animations and effects enabled', icon: Zap },
    medium: { label: 'Balanced', description: 'Some effects reduced for smoother performance', icon: Gauge },
    low: { label: 'Performance', description: 'Minimal effects for best performance', icon: Cpu },
    minimal: { label: 'Accessibility', description: 'No animations (reduces motion)', icon: Cpu },
};

export function PerformanceSettings({ showDebugInfo = false }: PerformanceSettingsProps) {
    const { settings, tier, setManualTier, isManualOverride, getFPS } = usePerformance();
    const [isOpen, setIsOpen] = useState(false);
    const [fps, setFps] = useState(60);

    useEffect(() => {
        if (!showDebugInfo) return;
        const interval = setInterval(() => setFps(getFPS()), 1000);
        return () => clearInterval(interval);
    }, [showDebugInfo, getFPS]);

    const handleTierChange = (newTier: PerformanceTier | 'auto') => {
        setManualTier(newTier === 'auto' ? null : newTier);
        setIsOpen(false);
    };

    const CurrentIcon = TIER_INFO[tier].icon;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground",
                    "border border-border/50"
                )}
            >
                <CurrentIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{TIER_INFO[tier].label}</span>
                {!isManualOverride && <span className="text-xs text-muted-foreground">(Auto)</span>}
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 w-72 rounded-xl z-20 bg-background border border-border shadow-xl overflow-hidden"
                    >
                        <button
                            onClick={() => handleTierChange('auto')}
                            className={cn(
                                "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors hover:bg-muted/50",
                                !isManualOverride && "bg-primary/10"
                            )}
                        >
                            <Gauge className="w-5 h-5 text-primary mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">Automatic</span>
                                    {!isManualOverride && <Check className="w-4 h-4 text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">Adjusts based on your device performance</p>
                            </div>
                        </button>

                        <div className="border-t border-border" />

                        {(Object.keys(TIER_INFO) as PerformanceTier[]).map((tierOption) => {
                            const info = TIER_INFO[tierOption];
                            const Icon = info.icon;
                            const isSelected = isManualOverride && tier === tierOption;

                            return (
                                <button
                                    key={tierOption}
                                    onClick={() => handleTierChange(tierOption)}
                                    className={cn(
                                        "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors hover:bg-muted/50",
                                        isSelected && "bg-primary/10"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-5 h-5 mt-0.5",
                                        tierOption === 'high' && "text-green-500",
                                        tierOption === 'medium' && "text-yellow-500",
                                        tierOption === 'low' && "text-orange-500",
                                        tierOption === 'minimal' && "text-red-500",
                                    )} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{info.label}</span>
                                            {isSelected && <Check className="w-4 h-4 text-primary" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
                                    </div>
                                </button>
                            );
                        })}

                        {showDebugInfo && (
                            <>
                                <div className="border-t border-border" />
                                <div className="px-4 py-3 bg-muted/30">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Current FPS</span>
                                        <span className={cn(
                                            "font-mono font-medium",
                                            fps >= 55 && "text-green-500",
                                            fps >= 20 && fps < 55 && "text-yellow-500",
                                            fps < 20 && "text-red-500",
                                        )}>{fps} FPS</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">Animations</span>
                                        <span className="font-medium text-foreground">{settings.enableAnimations ? 'ON' : 'OFF'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">Blur Effects</span>
                                        <span className="font-medium text-foreground">{settings.enableBlur ? 'ON' : 'OFF'}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}

export function PerformanceDebugIndicator() {
    const { tier, getFPS } = usePerformance();
    const [fps, setFps] = useState(60);

    useEffect(() => {
        const interval = setInterval(() => setFps(getFPS()), 500);
        return () => clearInterval(interval);
    }, [getFPS]);

    if (import.meta.env.PROD) return null;

    return (
        <div className={cn(
            "fixed bottom-3 left-3 px-2 py-1 rounded text-xs font-mono z-50 pointer-events-none opacity-80",
            tier === 'high' && "bg-green-500 text-white",
            tier === 'medium' && "bg-yellow-500 text-black",
            tier === 'low' && "bg-orange-500 text-white",
            tier === 'minimal' && "bg-red-500 text-white",
        )}>
            {tier.toUpperCase()} | {fps}fps
        </div>
    );
}
