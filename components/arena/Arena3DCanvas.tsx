'use client';
// components/arena/Arena3DCanvas.tsx
// 3D Colosseum Arena rendering both player and rival combatants in real-time.

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from '@/types/avatar';
import { AvatarModel } from '@/components/avatar/AvatarModel';

export type CombatAction = 'idle' | 'attack' | 'hit' | 'defend' | 'victory';

interface Arena3DCanvasProps {
  playerConfig: AvatarConfig;
  opponentConfig: AvatarConfig;
  playerAction: CombatAction;
  opponentAction: CombatAction;
  activeFx?: 'slash' | 'magic' | 'shield' | 'ultimate' | null;
  fxSource?: 'player' | 'opponent';
}

function ArenaPedestal({ position, color }: { position: [number, number, number]; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Base platform */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[1.3, 1.45, 0.2, 32]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Glowing neon edge */}
      <mesh ref={ringRef} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.1, 1.28, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Under-glow point light */}
      <pointLight color={color} intensity={1.8} distance={3.5} position={[0, 0.2, 0]} />
    </group>
  );
}

function ArenaEnvironment() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={[0, -0.72, 0]}>
      {/* Main Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#040608" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Holographic grid ring */}
      <group ref={gridRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[2.8, 3.2, 48]} />
          <meshBasicMaterial color="#7C5CFF" side={THREE.DoubleSide} transparent opacity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[4.2, 4.4, 48]} />
          <meshBasicMaterial color="#00FF66" side={THREE.DoubleSide} transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

function ShieldBarrier({ position }: { position: [number, number, number] }) {
  const shieldRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y += delta * 2.0;
      shieldRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={shieldRef}>
        <sphereGeometry args={[1.1, 24, 24]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0284C7"
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>
      <pointLight color="#38BDF8" intensity={2.5} distance={3} />
    </group>
  );
}

function ProjectileBeam({ source, target, type }: { source: [number, number, number]; target: [number, number, number]; type: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = type === 'magic' ? '#A855F7' : type === 'ultimate' ? '#F59E0B' : '#00FF66';

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 12) + 1) / 2;
    meshRef.current.position.x = THREE.MathUtils.lerp(source[0], target[0], t);
    meshRef.current.position.y = THREE.MathUtils.lerp(source[1], target[1], t);
    meshRef.current.position.z = THREE.MathUtils.lerp(source[2], target[2], t);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshBasicMaterial color={color} />
      <pointLight color={color} intensity={4} distance={4} />
    </mesh>
  );
}

export function Arena3DCanvas({
  playerConfig,
  opponentConfig,
  playerAction,
  opponentAction,
  activeFx,
  fxSource = 'player',
}: Arena3DCanvasProps) {
  const playerPos: [number, number, number] = [-2.1, -0.6, 0];
  const opponentPos: [number, number, number] = [2.1, -0.6, 0];

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.4, 6.2], fov: 42 }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        {/* Arena Ambience */}
        <color attach="background" args={['#040608']} />
        <fog attach="fog" args={['#040608', 7, 16]} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[0, 6, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Spotlights targeting each combatant */}
        <spotLight
          position={[-3, 4, 2]}
          target-position={playerPos}
          angle={0.6}
          penumbra={0.8}
          intensity={2.8}
          color="#00FF66"
        />
        <spotLight
          position={[3, 4, 2]}
          target-position={opponentPos}
          angle={0.6}
          penumbra={0.8}
          intensity={2.8}
          color="#EF4444"
        />

        {/* Arena Floor & Pedestals */}
        <ArenaEnvironment />
        <ArenaPedestal position={[-2.1, -0.68, 0]} color="#00FF66" />
        <ArenaPedestal position={[2.1, -0.68, 0]} color="#EF4444" />

        {/* Contact Shadows */}
        <ContactShadows
          position={[0, -0.71, 0]}
          opacity={0.7}
          scale={10}
          blur={1.5}
          far={3}
        />

        {/* Player Avatar */}
        <group position={playerPos} rotation={[0, Math.PI / 2.2, 0]}>
          <AvatarModel config={playerConfig} action={playerAction} animate={true} />
        </group>

        {/* Opponent Avatar */}
        <group position={opponentPos} rotation={[0, -Math.PI / 2.2, 0]}>
          <AvatarModel config={opponentConfig} action={opponentAction} animate={true} />
        </group>

        {/* Shield Barriers */}
        {playerAction === 'defend' && <ShieldBarrier position={[-2.1, 0.4, 0]} />}
        {opponentAction === 'defend' && <ShieldBarrier position={[2.1, 0.4, 0]} />}

        {/* Projectile Attack Beams */}
        {activeFx && fxSource === 'player' && (
          <ProjectileBeam
            source={[-1.5, 0.4, 0]}
            target={[1.8, 0.4, 0]}
            type={activeFx}
          />
        )}
        {activeFx && fxSource === 'opponent' && (
          <ProjectileBeam
            source={[1.5, 0.4, 0]}
            target={[-1.8, 0.4, 0]}
            type={activeFx}
          />
        )}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 3.5}
          maxAzimuthAngle={Math.PI / 4}
          minAzimuthAngle={-Math.PI / 4}
        />
      </Suspense>
    </Canvas>
  );
}
