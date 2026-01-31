import { motion, useTransform, MotionValue } from 'framer-motion';
import { useMemo } from 'react';

interface OrbitalPlanetProps {
    scrollProgress: MotionValue<number>;
}

interface Asteroid {
    id: number;
    startX: number;
    startY: number;
    delay: number;
    duration: number;
    scale: number;
}

export function OrbitalPlanet({ scrollProgress }: OrbitalPlanetProps) {
    // Create orbital path - a smooth curved path from top to bottom
    const pathD = 'M 100 50 Q 50 200, 100 350 T 100 650';

    // Generate asteroid particles
    const asteroids: Asteroid[] = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            startX: Math.random() * 150 + 20,
            startY: Math.random() * 600 + 50,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 4,
            scale: 0.3 + Math.random() * 0.7,
        }));
    }, []);

    return (
        <div className="absolute left-0 top-0 w-[200px] h-full pointer-events-none">
            <svg
                width="200"
                height="700"
                viewBox="0 0 200 700"
                className="absolute top-0 left-0"
                style={{ opacity: 0.3 }}
            >
                {/* Orbital path */}
                <motion.path
                    d={pathD}
                    stroke="url(#pathGradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="8 8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />

                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Animated planet following the path */}
            <motion.div
                className="absolute w-16 h-16"
                style={{
                    left: useTransform(scrollProgress, [0, 1], [100, 100]),
                    top: useTransform(scrollProgress, [0, 1], [50, 650]),
                    x: useTransform(scrollProgress, [0, 1], [0, 10]),
                    y: useTransform(scrollProgress, [0, 1], [0, -20]),
                }}
            >
                {/* Planet with glow effect */}
                <div className="relative w-16 h-16">
                    {/* Outer glow */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />

                    {/* Planet body */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/80 to-primary overflow-hidden">
                        {/* Surface details */}
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-2 right-3 w-4 h-4 rounded-full bg-primary-foreground/20" />
                            <div className="absolute bottom-3 left-2 w-3 h-3 rounded-full bg-primary-foreground/15" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary-foreground/10" />
                        </div>

                        {/* Shine effect */}
                        <div className="absolute top-2 left-3 w-6 h-6 rounded-full bg-white/40 blur-md" />
                    </div>

                    {/* Orbital rings (fake 3D) */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 border-2 border-primary/40 rounded-full"
                        style={{
                            transform: 'translateX(-50%) translateY(-50%) rotateX(75deg)',
                            transformStyle: 'preserve-3d',
                        }}
                        animate={{
                            rotateZ: 360,
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                </div>
            </motion.div>

            {/* Floating asteroids */}
            {asteroids.map((asteroid) => (
                <motion.div
                    key={asteroid.id}
                    className="absolute w-2 h-2 rounded-full bg-muted-foreground/40"
                    initial={{
                        x: asteroid.startX,
                        y: asteroid.startY,
                        scale: asteroid.scale,
                        opacity: 0,
                    }}
                    animate={{
                        x: [asteroid.startX, asteroid.startX + 30, asteroid.startX],
                        y: [asteroid.startY, asteroid.startY + 100, asteroid.startY + 200],
                        opacity: [0, 0.6, 0],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: asteroid.duration,
                        delay: asteroid.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{
                        filter: 'blur(1px)',
                    }}
                />
            ))}
        </div>
    );
}
