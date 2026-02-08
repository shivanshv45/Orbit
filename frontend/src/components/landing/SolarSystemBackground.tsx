import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function Planet({ position, size, color, ringColor, hasRings = false, rotationSpeed = 0.01, glowIntensity = 'low' }: { position: [number, number, number], size: number, color: string, ringColor?: string, hasRings?: boolean, rotationSpeed?: number, glowIntensity?: 'low' | 'medium' | 'high' }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * rotationSpeed;
        }
    });

    const glowConfig = {
        low: { innerOpacity: 0.15, outerOpacity: 0.05, outerScale: 1.3 },
        medium: { innerOpacity: 0.3, outerOpacity: 0.12, outerScale: 1.5 },
        high: { innerOpacity: 0.5, outerOpacity: 0.25, outerScale: 1.8 }
    };

    const glow = glowConfig[glowIntensity];

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
            </mesh>

            <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[size, 24, 24]} />
                <meshBasicMaterial color={color} transparent opacity={glow.innerOpacity} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>

            <mesh scale={[glow.outerScale, glow.outerScale, glow.outerScale]}>
                <sphereGeometry args={[size, 24, 24]} />
                <meshBasicMaterial color={color} transparent opacity={glow.outerOpacity} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>

            {hasRings && ringColor && (
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                    <ringGeometry args={[size * 1.5, size * 2.5, 48]} />
                    <meshBasicMaterial color={ringColor} side={THREE.DoubleSide} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
                </mesh>
            )}
        </group>
    );
}

function ParticleRing({ count = 100, radius = 20, color = '#6366f1', size = 0.5, speed = 0.1 }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = (i / count) * 2 * Math.PI;
            const r = radius + (Math.random() - 0.5) * 2;
            p[i * 3] = r * Math.cos(theta);
            p[i * 3 + 1] = (Math.random() - 0.5) * 2;
            p[i * 3 + 2] = r * Math.sin(theta);
        }
        return p;
    }, [count, radius]);

    const ref = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += speed * 0.001;
            ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={size} color={color} sizeAttenuation transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </points>
    );
}

function GlowingSun() {
    return (
        <group>
            <mesh>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshStandardMaterial color="#4f46e5" emissive="#4338ca" emissiveIntensity={4} toneMapped={false} />
            </mesh>

            <mesh scale={[1.15, 1.15, 1.15]}>
                <sphereGeometry args={[2.5, 24, 24]} />
                <meshBasicMaterial color="#6366f1" transparent opacity={0.5} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>

            <mesh scale={[1.4, 1.4, 1.4]}>
                <sphereGeometry args={[2.5, 24, 24]} />
                <meshBasicMaterial color="#818cf8" transparent opacity={0.3} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>

            <mesh scale={[2.0, 2.0, 2.0]}>
                <sphereGeometry args={[2.5, 24, 24]} />
                <meshBasicMaterial color="#a5b4fc" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>

            <pointLight distance={100} intensity={3} color="#ffffff" decay={0.5} />
            <ambientLight intensity={0.2} />
        </group>
    );
}

function Scene() {
    const mouse = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });

    useFrame((state) => {
        mouse.current.x = state.pointer.x;
        mouse.current.y = state.pointer.y;
        current.current.x += (mouse.current.x * 2 - current.current.x) * 0.03;
        current.current.y += (mouse.current.y * 2 - current.current.y) * 0.03;
        state.camera.position.x = current.current.x;
        state.camera.position.y = current.current.y;
        state.camera.lookAt(0, 0, 0);
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, -2, 20]} fov={60} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={100} scale={25} size={2.5} speed={0.3} opacity={0.5} color="#c7d2fe" />

            <group rotation={[Math.PI / 6, 0, 0]}>
                <GlowingSun />

                <ParticleRing count={150} radius={8} color="#a78bfa" size={0.1} speed={2} />
                <ParticleRing count={200} radius={12} color="#818cf8" size={0.15} speed={1.5} />
                <ParticleRing count={300} radius={18} color="#2dd4bf" size={0.1} speed={1} />

                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Planet position={[10, 0, 5]} size={1.3} color="#a855f7" hasRings ringColor="#f0abfc" glowIntensity="high" />
                </Float>
                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Planet position={[-12, 2, -4]} size={1.1} color="#14b8a6" glowIntensity="low" />
                </Float>
                <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
                    <Planet position={[12, -8, -10]} size={0.8} color="#0ea5e9" glowIntensity="low" />
                </Float>
            </group>

            <fog attach="fog" args={['#030712', 10, 60]} />
        </>
    );
}

export function SolarSystemBackground() {
    return (
        <div className="fixed inset-0 -z-10 bg-background">
            <Canvas dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance' }}>
                <Scene />
            </Canvas>
            <div className="absolute inset-0 bg-background/30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/50 to-background pointer-events-none" />
        </div>
    );
}
