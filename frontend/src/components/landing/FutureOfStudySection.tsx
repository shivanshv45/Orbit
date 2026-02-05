import { useRef, useEffect, useState, memo, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const IconStructure = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <path d="M6 7h0M6 10h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <rect x="14" y="3" width="6" height="5" rx="1" fill="currentColor" opacity="0.9" />
        <rect x="14" y="10" width="6" height="5" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="14" y="17" width="6" height="5" rx="1" fill="currentColor" opacity="0.3" />
        <path d="M10 8 L14 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M10 8 L14 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M10 10 L14 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
);

const IconPacing = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.3" transform="rotate(-20 12 12)" />
        <ellipse cx="12" cy="12" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" transform="rotate(-20 12 12)" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <circle cx="18" cy="10" r="1.5" fill="currentColor" opacity="0.8" />
        <circle cx="20" cy="11" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="21.5" cy="11.5" r="0.6" fill="currentColor" opacity="0.3" />
        <path d="M6 6 L4 4M18 18 L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
);

const IconRetention = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="2" fill="currentColor" />
        <circle cx="7" cy="14" r="1.5" fill="currentColor" opacity="0.7" />
        <circle cx="17" cy="14" r="1.5" fill="currentColor" opacity="0.7" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" opacity="0.5" />
        <circle cx="5" cy="9" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="19" cy="9" r="1" fill="currentColor" opacity="0.4" />
        <path d="M12 10 L7 13 M12 10 L17 13 M7 15.5 L12 17 M17 15.5 L12 17" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <path d="M10 8 Q5 7 5 9 M14 8 Q19 7 19 9" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.2" />
    </svg>
);

const IconVisuals = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M8 8 L16 8 L18 12 L16 16 L8 16 L6 12 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        <path d="M8 8 L10 5 L18 5 L16 8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <path d="M18 5 L20 9 L18 12" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" strokeDasharray="1 2" opacity="0.25" />
        <path d="M3 12 L5 12 M19 12 L21 12 M12 3 L12 5 M12 19 L12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.8" />
    </svg>
);

const features = [
    {
        icon: IconStructure,
        title: 'Instant Structure',
        description: 'Raw documents become organized, bite-sized learning modules instantly',
        position: 0.15,
        side: 'left' as const,
    },
    {
        icon: IconPacing,
        title: 'Adaptive Pacing',
        description: 'Content that evolves with your understanding, moving at your speed',
        position: 0.38,
        side: 'right' as const,
    },
    {
        icon: IconRetention,
        title: 'Smart Retention',
        description: 'Practice exactly what you need to review, right when it matters',
        position: 0.6,
        side: 'left' as const,
    },
    {
        icon: IconVisuals,
        title: 'Interactive Visuals',
        description: 'Grasp complex concepts through dynamic, hands-on simulations',
        position: 0.82,
        side: 'right' as const,
    },
];


const Planet = memo(function Planet() {
    return (
        <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
                <radialGradient id="pBase" cx="30%" cy="25%" r="70%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#4c1d95" />
                </radialGradient>
                <linearGradient id="pRing" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                    <stop offset="20%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9" />
                    <stop offset="80%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
                <clipPath id="pClip"><circle cx="80" cy="80" r="42" /></clipPath>
            </defs>
            <circle cx="80" cy="80" r="55" fill="#8b5cf6" opacity="0.08" />
            <circle cx="80" cy="80" r="42" fill="url(#pBase)" />
            <g clipPath="url(#pClip)" stroke="#e9d5ff" strokeWidth="0.5" fill="none" opacity="0.3">
                <path d="M 50 50 L 65 45 L 80 52 L 95 45 L 110 50" />
                <path d="M 45 65 L 60 60 L 80 68 L 100 60 L 115 65" />
                <path d="M 40 80 L 55 78 L 80 85 L 105 78 L 120 80" />
                <path d="M 45 95 L 60 100 L 80 95 L 100 100 L 115 95" />
                <path d="M 50 110 L 65 115 L 80 108 L 95 115 L 110 110" />
                <line x1="65" y1="45" x2="60" y2="60" />
                <line x1="80" y1="52" x2="80" y2="68" />
                <line x1="95" y1="45" x2="100" y2="60" />
                <line x1="60" y1="60" x2="55" y2="78" />
                <line x1="80" y1="68" x2="80" y2="85" />
                <line x1="100" y1="60" x2="105" y2="78" />
                <line x1="55" y1="78" x2="60" y2="100" />
                <line x1="80" y1="85" x2="80" y2="95" />
                <line x1="105" y1="78" x2="100" y2="100" />
            </g>
            <g clipPath="url(#pClip)" fill="#f0abfc" opacity="0.7">
                <circle cx="65" cy="45" r="2" /><circle cx="80" cy="52" r="2.5" /><circle cx="95" cy="45" r="2" />
                <circle cx="60" cy="60" r="1.5" /><circle cx="80" cy="68" r="2" /><circle cx="100" cy="60" r="1.5" />
                <circle cx="55" cy="78" r="1.5" /><circle cx="80" cy="85" r="2.5" /><circle cx="105" cy="78" r="1.5" />
                <circle cx="60" cy="100" r="2" /><circle cx="80" cy="95" r="1.5" /><circle cx="100" cy="100" r="2" />
            </g>
            <circle cx="80" cy="80" r="42" fill="url(#pBase)" opacity="0.3" style={{ mixBlendMode: 'overlay' }} />
            <ellipse cx="68" cy="60" rx="12" ry="7" fill="white" opacity="0.15" transform="rotate(-25 68 60)" />
            <ellipse cx="65" cy="58" rx="6" ry="3" fill="white" opacity="0.3" transform="rotate(-25 65 58)" />
            <ellipse cx="80" cy="80" rx="58" ry="16" fill="none" stroke="url(#pRing)" strokeWidth="3" transform="rotate(-20 80 80)" />
            <circle cx="36" cy="72" r="3" fill="#22d3ee" opacity="0.9" />
            <circle cx="124" cy="88" r="2.5" fill="#f0abfc" opacity="0.8" />
        </svg>
    );
});

const FeatureCard = memo(function FeatureCard({
    feature,
    isVisible,
}: {
    feature: typeof features[0];
    isVisible: boolean;
}) {
    const Icon = feature.icon;
    const isLeft = feature.side === 'left';

    return (
        <motion.div
            initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: isLeft ? -50 : 50 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`relative ${isLeft ? 'mr-auto' : 'ml-auto'}`}
            style={{ width: '280px' }}
        >
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-cyan-500/5 border border-primary/20 p-5">
                <div className="absolute inset-0 rounded-2xl bg-background/40" />

                <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center mb-3 border border-primary/15 shadow-lg shadow-primary/10 text-primary">
                        <Icon />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground/85 leading-relaxed">{feature.description}</p>
                </div>
            </div>
        </motion.div>
    );
});

export function FutureOfStudySection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const [pathLength, setPathLength] = useState(0);
    const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false, false]);
    const lastUpdateRef = useRef(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 0.8', 'end 0.5'],
    });

    const smoothProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

    const planetX = useTransform(smoothProgress, (p) => {
        if (!pathRef.current || pathLength === 0) return 0;
        const point = pathRef.current.getPointAtLength(Math.min(1, Math.max(0, p)) * pathLength);
        return point.x - 300;
    });

    const planetY = useTransform(smoothProgress, (p) => {
        if (!pathRef.current || pathLength === 0) return 20;
        const point = pathRef.current.getPointAtLength(Math.min(1, Math.max(0, p)) * pathLength);
        return point.y;
    });

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, []);

    const updateVisibility = useCallback((progress: number) => {
        const now = performance.now();
        if (now - lastUpdateRef.current < 30) return;
        lastUpdateRef.current = now;

        const newVisibleCards = features.map((feature) => progress >= feature.position - 0.15);
        setVisibleCards(prev => {
            if (prev.some((v, i) => v !== newVisibleCards[i])) {
                return newVisibleCards;
            }
            return prev;
        });
    }, []);

    useEffect(() => {
        const unsubscribe = smoothProgress.on('change', updateVisibility);
        return () => unsubscribe();
    }, [smoothProgress, updateVisibility]);

    const pathD = "M 300 20 C 100 80, 100 160, 380 240 S 520 400, 220 460 S 80 600, 350 700 S 480 860, 300 880";

    return (
        <section
            ref={containerRef}
            className="relative py-16 overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, transparent 0%, hsl(var(--muted)/0.15) 10%, hsl(var(--muted)/0.25) 50%, hsl(var(--muted)/0.15) 90%, transparent 100%)',
                minHeight: '1100px',
            }}
        >
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)' }} />

            <div className="container mx-auto px-6 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        The future of{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-cyan-400">
                            study
                        </span>
                    </h2>
                    <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                        Stop scrolling through static PDFs. Start interacting with ideas.
                    </p>
                </motion.div>

                <div className="relative" style={{ height: '1000px' }}>
                    <svg
                        className="absolute left-1/2 -translate-x-1/2 top-0 h-full pointer-events-none"
                        width="600"
                        height="1000"
                        viewBox="0 0 600 1000"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <path
                            ref={pathRef}
                            d={pathD}
                            fill="none"
                            stroke="hsl(var(--primary)/0.3)"
                            strokeWidth="2"
                            strokeDasharray="4 16"
                            strokeLinecap="round"
                        />

                        <motion.path
                            d={pathD}
                            fill="none"
                            stroke="url(#trailGradient)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            style={{ pathLength: smoothProgress }}
                        />

                        <defs>
                            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <motion.div
                        className="absolute z-20 pointer-events-none will-change-transform"
                        style={{
                            left: '50%',
                            x: planetX,
                            y: planetY,
                            translateX: '-50%',
                            translateY: '-50%',
                        }}
                    >
                        <Planet />
                    </motion.div>

                    <div className="absolute inset-0 flex flex-col justify-between py-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className={`flex ${feature.side === 'left' ? 'justify-start pl-2 md:pl-6' : 'justify-end pr-2 md:pr-6'}`}
                                style={{ width: '100%' }}
                            >
                                <FeatureCard feature={feature} isVisible={visibleCards[index]} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div
                className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{ background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)' }}
            />
        </section>
    );
}
