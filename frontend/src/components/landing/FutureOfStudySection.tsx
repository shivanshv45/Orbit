import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Sparkles, BookOpen, Brain, Zap } from 'lucide-react';

const features = [
    {
        icon: Sparkles,
        title: 'Instant Structure',
        description: 'Raw documents become organized, bite-sized learning modules instantly',
        position: 0.15,
        side: 'left' as const,
        asteroidShape: 'M 10,50 Q 5,20 30,10 Q 60,5 80,25 Q 95,45 90,70 Q 85,90 55,95 Q 25,98 10,75 Q 2,60 10,50',
    },
    {
        icon: BookOpen,
        title: 'Adaptive Pacing',
        description: 'Content that evolves with your understanding, moving at your speed',
        position: 0.38,
        side: 'right' as const,
        asteroidShape: 'M 15,40 Q 8,15 40,8 Q 70,3 88,30 Q 98,55 85,80 Q 70,95 40,92 Q 12,88 8,60 Q 5,45 15,40',
    },
    {
        icon: Brain,
        title: 'Smart Retention',
        description: 'Practice exactly what you need to review, right when it matters',
        position: 0.6,
        side: 'left' as const,
        asteroidShape: 'M 12,45 Q 3,18 35,5 Q 65,0 85,22 Q 100,50 88,78 Q 75,98 42,95 Q 10,92 5,65 Q 0,50 12,45',
    },
    {
        icon: Zap,
        title: 'Interactive Visuals',
        description: 'Grasp complex concepts through dynamic, hands-on simulations',
        position: 0.82,
        side: 'right' as const,
        asteroidShape: 'M 8,48 Q 2,20 32,8 Q 62,0 85,20 Q 100,45 92,72 Q 80,95 48,98 Q 15,95 5,70 Q 0,55 8,48',
    },
];

function Planet({ className }: { className?: string }) {
    return (
        <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            className={className}
            style={{
                filter: 'drop-shadow(0 0 35px rgba(139, 92, 246, 0.65)) drop-shadow(0 0 70px rgba(99, 102, 241, 0.4))',
            }}
        >
            <defs>
                <radialGradient id="planetSurface" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#c084fc" />
                    <stop offset="30%" stopColor="#a855f7" />
                    <stop offset="60%" stopColor="#8b5cf6" />
                    <stop offset="85%" stopColor="#6d28d9" />
                    <stop offset="100%" stopColor="#4c1d95" />
                </radialGradient>
                <radialGradient id="atmosphereInner" cx="50%" cy="50%" r="50%">
                    <stop offset="70%" stopColor="#a855f7" stopOpacity="0" />
                    <stop offset="85%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
                </radialGradient>
                <radialGradient id="outerHalo" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="surfaceBands" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="20%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="25%" stopColor="transparent" />
                    <stop offset="45%" stopColor="rgba(139,92,246,0.15)" />
                    <stop offset="55%" stopColor="transparent" />
                    <stop offset="70%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="75%" stopColor="transparent" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
                <linearGradient id="planetShadow" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="transparent" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
                </linearGradient>
                <clipPath id="planetClip">
                    <circle cx="50" cy="50" r="28" />
                </clipPath>
            </defs>

            <circle cx="50" cy="50" r="48" fill="url(#outerHalo)" />
            <circle cx="50" cy="50" r="36" fill="url(#atmosphereInner)" />
            <circle cx="50" cy="50" r="28" fill="url(#planetSurface)" />
            <circle cx="50" cy="50" r="28" fill="url(#surfaceBands)" clipPath="url(#planetClip)" />

            <g clipPath="url(#planetClip)" opacity="0.4">
                <ellipse cx="42" cy="45" rx="4" ry="2" fill="rgba(192, 132, 252, 0.5)" transform="rotate(-15 42 45)" />
                <ellipse cx="58" cy="55" rx="3" ry="1.5" fill="rgba(139, 92, 246, 0.4)" transform="rotate(10 58 55)" />
                <ellipse cx="45" cy="62" rx="5" ry="2" fill="rgba(99, 102, 241, 0.3)" transform="rotate(-5 45 62)" />
            </g>

            <circle cx="50" cy="50" r="28" fill="url(#planetShadow)" />
            <ellipse cx="40" cy="38" rx="8" ry="5" fill="white" opacity="0.2" transform="rotate(-25 40 38)" />
            <ellipse cx="38" cy="36" rx="4" ry="2.5" fill="white" opacity="0.35" transform="rotate(-25 38 36)" />

            <circle
                cx="50"
                cy="50"
                r="28"
                fill="none"
                stroke="url(#atmosphereInner)"
                strokeWidth="2"
                opacity="0.6"
            />

            <path
                d="M 35 26 Q 50 22, 65 26"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.3"
            />
            <path
                d="M 38 74 Q 50 78, 62 74"
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.2"
            />
        </svg>
    );
}

function AsteroidCard({
    feature,
    index,
    isVisible,
}: {
    feature: typeof features[0];
    index: number;
    isVisible: boolean;
}) {
    const Icon = feature.icon;
    const isLeft = feature.side === 'left';
    const clipId = `asteroid-clip-${index}`;

    return (
        <motion.div
            initial={{
                opacity: 0,
                x: isLeft ? -80 : 80,
                scale: 0.7,
            }}
            animate={isVisible ? {
                opacity: 1,
                x: 0,
                scale: 1,
            } : {
                opacity: 0,
                x: isLeft ? -80 : 80,
                scale: 0.7,
            }}
            transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={`relative ${isLeft ? 'mr-auto' : 'ml-auto'}`}
            style={{ width: '280px', height: '180px' }}
        >
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <clipPath id={clipId}>
                        <path d={feature.asteroidShape} />
                    </clipPath>
                    <linearGradient id={`asteroid-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
                        <stop offset="50%" stopColor="rgba(99, 102, 241, 0.15)" />
                        <stop offset="100%" stopColor="rgba(34, 211, 238, 0.1)" />
                    </linearGradient>
                </defs>

                <path
                    d={feature.asteroidShape}
                    fill={`url(#asteroid-grad-${index})`}
                    stroke="rgba(168, 85, 247, 0.4)"
                    strokeWidth="0.8"
                />

                <g opacity="0.15" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="0.3" clipPath={`url(#${clipId})`}>
                    <line x1="20" y1="30" x2="45" y2="35" />
                    <line x1="55" y1="60" x2="75" y2="55" />
                    <line x1="30" y1="70" x2="50" y2="75" />
                </g>
            </svg>

            <div className="absolute inset-0 flex flex-col justify-center p-6 pl-8">
                <motion.div
                    className="absolute top-4 right-8 w-1.5 h-1.5 rounded-full bg-primary/50"
                    animate={isVisible ? {
                        y: [0, -6, 0],
                        opacity: [0.5, 0.9, 0.5],
                    } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-6 left-10 w-1 h-1 rounded-full bg-cyan-400/40"
                    animate={isVisible ? {
                        y: [0, -4, 0],
                        opacity: [0.4, 0.7, 0.4],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                />

                <motion.div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/25 to-cyan-500/15 flex items-center justify-center mb-3 backdrop-blur-sm border border-primary/20"
                    animate={isVisible ? {
                        boxShadow: [
                            '0 0 15px rgba(168, 85, 247, 0.25)',
                            '0 0 25px rgba(168, 85, 247, 0.4)',
                            '0 0 15px rgba(168, 85, 247, 0.25)',
                        ],
                    } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Icon className="w-6 h-6 text-primary" />
                </motion.div>

                <h3 className="text-base font-semibold text-foreground mb-1.5">{feature.title}</h3>
                <p className="text-xs text-muted-foreground/85 leading-relaxed">{feature.description}</p>
            </div>
        </motion.div>
    );
}

export function FutureOfStudySection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const [pathLength, setPathLength] = useState(0);
    const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false, false]);
    const [planetPos, setPlanetPos] = useState({ x: 300, y: 20 });

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start 0.8', 'end 0.5'],
    });

    const springProgress = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 20,
        restDelta: 0.0001,
    });

    // TOGGLE SPRING ANIMATION HERE
    const USE_SPRING = true;
    const activeProgress = USE_SPRING ? springProgress : scrollYProgress;

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, []);

    useEffect(() => {
        const updateFromProgress = (progress: number) => {
            const newVisibleCards = features.map((feature) => progress >= feature.position - 0.05);
            setVisibleCards(prev => {
                if (prev.some((v, i) => v !== newVisibleCards[i])) {
                    return newVisibleCards;
                }
                return prev;
            });

            if (pathRef.current && pathLength > 0) {
                const clampedProgress = Math.max(0, Math.min(1, progress));
                const point = pathRef.current.getPointAtLength(clampedProgress * pathLength);
                setPlanetPos({ x: point.x, y: point.y });
            }
        };

        const unsubscribe = activeProgress.on('change', updateFromProgress);
        return () => unsubscribe();
    }, [activeProgress, pathLength]);

    const pathD = "M 300 20 Q 100 120, 380 240 Q 520 340, 220 460 Q 80 560, 350 700 Q 480 800, 300 880";

    return (
        <section
            ref={containerRef}
            className="relative py-16 overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, transparent 0%, hsl(var(--muted)/0.15) 10%, hsl(var(--muted)/0.25) 50%, hsl(var(--muted)/0.15) 90%, transparent 100%)',
                minHeight: '1100px',
            }}
        >
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10"
                    style={{
                        background: 'radial-gradient(ellipse, hsl(var(--primary)) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.08, 1],
                        opacity: [0.1, 0.15, 0.1],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className="container mx-auto px-6 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6 }}
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
                            stroke="hsl(var(--primary)/0.35)"
                            strokeWidth="3"
                            strokeDasharray="4 16"
                            strokeLinecap="round"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                            }}
                        />

                        <path
                            d={pathD}
                            fill="none"
                            stroke="hsl(var(--primary)/0.15)"
                            strokeWidth="1.5"
                            strokeDasharray="2 20"
                            strokeLinecap="round"
                            strokeDashoffset="10"
                            style={{
                                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                            }}
                        />

                        <motion.path
                            d={pathD}
                            fill="none"
                            stroke="url(#trailGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            style={{
                                pathLength: activeProgress,
                            }}
                        />

                        <defs>
                            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                                <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.8" />
                                <stop offset="70%" stopColor="#6366f1" stopOpacity="0.7" />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.5" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <motion.div
                        className="absolute z-20 pointer-events-none"
                        animate={{
                            x: planetPos.x - 300,
                            y: planetPos.y,
                        }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        style={{
                            left: '50%',
                            translateX: '-50%',
                            translateY: '-50%',
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        >
                            <Planet />
                        </motion.div>
                    </motion.div>

                    <div className="absolute inset-0 flex flex-col justify-between py-6">
                        {features.map((feature, index) => (
                            <div
                                key={feature.title}
                                className={`flex ${feature.side === 'left' ? 'justify-start pl-2 md:pl-6' : 'justify-end pr-2 md:pr-6'}`}
                                style={{ width: '100%' }}
                            >
                                <AsteroidCard
                                    feature={feature}
                                    index={index}
                                    isVisible={visibleCards[index]}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div
                className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)',
                }}
            />
        </section>
    );
}

