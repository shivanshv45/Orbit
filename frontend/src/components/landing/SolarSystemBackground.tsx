import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function Planet({ position, size, color, ringColor, hasRings = false, rotationSpeed = 0.01 }: { position: [number, number, number], size: number, color: string, ringColor?: string, hasRings?: boolean, rotationSpeed?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * rotationSpeed;
        }
    });

    return (
        <group position={position}>
            {/* */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 64, 64]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.3}
                    metalness={0.2}
                    emissive={color}
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Atmospheric Glow */}
            <mesh scale={[1.2, 1.2, 1.2]}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Optional Rings */}
            {hasRings && ringColor && (
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                    <ringGeometry args={[size * 1.4, size * 2.2, 64]} />
                    <meshBasicMaterial
                        color={ringColor}
                        side={THREE.DoubleSide}
                        transparent
                        opacity={0.4}
                    />
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
            // Add some noise to radius
            const r = radius + (Math.random() - 0.5) * 2;
            p[i * 3] = r * Math.cos(theta);
            p[i * 3 + 1] = (Math.random() - 0.5) * 2; // slight vertical height
            p[i * 3 + 2] = r * Math.sin(theta);
        }
        return p;
    }, [count, radius]);

    const ref = useRef<THREE.Points>(null);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += speed * 0.001;
            // Gentle wobble
            ref.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length / 3}
                    array={points}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={size}
                color={color}
                sizeAttenuation={true}
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

function GlowingSun() {
    return (
        <group>
            {/* Core Sun */}
            <mesh>
                <sphereGeometry args={[2.5, 64, 64]} />
                <meshStandardMaterial
                    color="#4f46e5"
                    emissive="#4338ca"
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>

            {/* Inner Corona (Pulsing Layer 1) */}
            <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial
                    color="#6366f1"
                    transparent
                    opacity={0.4}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Outer Corona Halo (Soft Glow) */}
            <mesh scale={[1.6, 1.6, 1.6]}>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial
                    color="#818cf8"
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Far reaching light */}
            <pointLight distance={100} intensity={5} color="#818cf8" decay={1.5} />
        </group>
    )
}

function Scene() {
    const mouse = useRef([0, 0]);

    // Parallax effect on mouse move
    useFrame((state) => {
        const { pointer } = state;
        mouse.current = [pointer.x, pointer.y];

        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouse.current[0] * 2, 0.05);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, mouse.current[1] * 2, 0.05);
        state.camera.lookAt(0, 0, 0);
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, -2, 20]} fov={60} />
            <ambientLight intensity={0.1} />

            {/* Original Star Config for Depth */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <group rotation={[Math.PI / 6, 0, 0]}>
                <GlowingSun />
                {/* RESTORED fast, distinct rings */}
                <ParticleRing count={200} radius={8} color="#a78bfa" size={0.1} speed={2} />
                <ParticleRing count={300} radius={12} color="#818cf8" size={0.15} speed={1.5} />
                <ParticleRing count={500} radius={18} color="#2dd4bf" size={0.1} speed={1} />

                {/* UPGRADED Planets replacing simple spheres */}
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
                    <Planet
                        position={[10, 0, 5]}
                        size={1.2}
                        color="#c084fc"
                        hasRings
                        ringColor="#e879f9"
                    />
                </Float>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                    <Planet
                        position={[-12, 2, -4]}
                        size={1.0}
                        color="#2dd4bf"
                    />
                </Float>
                {/* Added third planet for balance */}
                <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Planet
                        position={[12, -8, -10]}
                        size={0.6}
                        color="#38bdf8"
                    />
                </Float>
            </group>

            <fog attach="fog" args={['#030712', 10, 60]} />
        </>
    );
}

export function SolarSystemBackground() {
    return (
        <div className="fixed inset-0 -z-10 bg-background">
            <Canvas dpr={[1, 2]}>
                <Scene />
            </Canvas>
            {/* Gradient Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-background/30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/50 to-background pointer-events-none" />
        </div>
    );
}
