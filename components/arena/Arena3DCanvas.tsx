'use client';
// components/arena/Arena3DCanvas.tsx
// High-Octane 3D Colosseum Arena with real-time lunging, weapon slashing arcs,
// hit recoil sparks, healing auras, and floating 3D combat numbers.

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from '@/types/avatar';
import { AvatarModel } from '@/components/avatar/AvatarModel';

export type CombatAction = 'idle' | 'attack' | 'hit' | 'defend' | 'victory' | 'healing';

interface Arena3DCanvasProps {
  playerConfig: AvatarConfig;
  opponentConfig: AvatarConfig;
  playerAction: CombatAction;
  opponentAction: CombatAction;
  activeFx?: 'slash' | 'magic' | 'shield' | 'ultimate' | 'healing' | null;
  fxSource?: 'player' | 'opponent';
  floatingCombatText?: {
    id: number;
    text: string;
    target: 'player' | 'opponent';
    isCrit?: boolean;
    color?: string;
  }[];
}

// ─── 3D Visual Effects Components ──────────────────────────────────────────

function SlashArcEffect({ position, color, facing }: { position: [number, number, number]; color: string; facing: 'right' | 'left' }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * (facing === 'right' ? -14 : 14);
      meshRef.current.scale.multiplyScalar(1.04);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} rotation={[0, facing === 'right' ? 0 : Math.PI, 0]}>
        <ringGeometry args={[0.5, 1.4, 32, 1, 0, Math.PI * 0.9]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <pointLight color={color} intensity={5} distance={3.5} />
    </group>
  );
}

function HitSparks({ position, color = '#EF4444' }: { position: [number, number, number]; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const sparkCount = 8;
  const sparks = useMemo(() => {
    return Array.from({ length: sparkCount }).map(() => ({
      dir: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      ).normalize(),
      speed: Math.random() * 4 + 2,
    }));
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const s = sparks[i];
        child.position.addScaledVector(s.dir, s.speed * delta);
        (child as THREE.Mesh).scale.multiplyScalar(0.92);
      });
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <pointLight color={color} intensity={6} distance={4} />
      {sparks.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function HealingAuraEffect({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 3.0;
      ringRef.current.position.y = (t % 1.5) * 1.2;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 6) * 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Ascending Green Nanite Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.95, 32]} />
        <meshBasicMaterial color="#10B981" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Pulsing Luminous Core */}
      <mesh ref={glowRef} position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshBasicMaterial color="#34D399" wireframe transparent opacity={0.3} />
      </mesh>

      <pointLight color="#10B981" intensity={4} distance={4} position={[0, 0.8, 0]} />
    </group>
  );
}

function ShieldDome({ position }: { position: [number, number, number] }) {
  const shieldRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y += delta * 2.2;
      shieldRef.current.rotation.z += delta * 1.4;
    }
  });

  return (
    <group position={position}>
      <mesh ref={shieldRef}>
        <sphereGeometry args={[1.15, 24, 24]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0284C7"
          emissiveIntensity={1.8}
          wireframe
          transparent
          opacity={0.65}
        />
      </mesh>
      <pointLight color="#38BDF8" intensity={3} distance={4} />
    </group>
  );
}

function MagicEnergyProjectile({ source, target, type }: { source: [number, number, number]; target: [number, number, number]; type: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = type === 'ultimate' ? '#F59E0B' : '#A855F7';

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 14) + 1) / 2;
    meshRef.current.position.x = THREE.MathUtils.lerp(source[0], target[0], t);
    meshRef.current.position.y = THREE.MathUtils.lerp(source[1], target[1], t);
    meshRef.current.position.z = THREE.MathUtils.lerp(source[2], target[2], t);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.38, 16, 16]} />
      <meshBasicMaterial color={color} />
      <pointLight color={color} intensity={5} distance={5} />
    </mesh>
  );
}

// ─── Interactive Fighter Mesh with Dynamic Lunging & Hit Recoil ────────────

interface DynamicFighterProps {
  config: AvatarConfig;
  action: CombatAction;
  side: 'player' | 'opponent';
  homeX: number;
}

function DynamicFighter({ config, action, side, homeX }: DynamicFighterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isPlayer = side === 'player';
  const targetXRef = useRef(homeX);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Determine dynamic target X position based on combat action
    if (action === 'attack') {
      // Lunge forward into the opposing fighter's face!
      targetXRef.current = isPlayer ? 0.7 : -0.7;
    } else if (action === 'hit') {
      // Stagger and fly backwards from the hit
      targetXRef.current = isPlayer ? -2.7 : 2.7;
    } else {
      // Idle / defend / healing: stand firm on home pedestal
      targetXRef.current = homeX;
    }

    // Smooth physics lerp
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetXRef.current,
      delta * 14
    );

    // Hit recoil tilt
    if (action === 'hit') {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        isPlayer ? -0.35 : 0.35,
        delta * 16
      );
    } else if (action === 'attack') {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        isPlayer ? 0.15 : -0.15,
        delta * 12
      );
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        0,
        delta * 10
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={[homeX, -0.6, 0]}
      rotation={[0, isPlayer ? Math.PI / 2.2 : -Math.PI / 2.2, 0]}
    >
      <AvatarModel
        config={config}
        action={action === 'healing' ? 'idle' : action}
        animate={true}
      />
    </group>
  );
}

// ─── Arena Environment Components ──────────────────────────────────────────

function ArenaPedestal({ position, color }: { position: [number, number, number]; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[1.35, 1.5, 0.22, 32]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.4} metalness={0.8} />
      </mesh>

      <mesh ref={ringRef} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.15, 1.34, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      <pointLight color={color} intensity={2.2} distance={3.5} position={[0, 0.3, 0]} />
    </group>
  );
}

function ArenaEnvironment() {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.rotation.y += delta * 0.04;
    }
  });

  return (
    <group position={[0, -0.72, 0]}>
      {/* Main Colosseum Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#030508" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Holographic Glowing Rings */}
      <group ref={gridRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[2.7, 3.1, 48]} />
          <meshBasicMaterial color="#7C5CFF" side={THREE.DoubleSide} transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[4.4, 4.7, 48]} />
          <meshBasicMaterial color="#00FF66" side={THREE.DoubleSide} transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Main Exported 3D Colosseum Arena ───────────────────────────────────────

export function Arena3DCanvas({
  playerConfig,
  opponentConfig,
  playerAction,
  opponentAction,
  activeFx,
  fxSource = 'player',
  floatingCombatText = [],
}: Arena3DCanvasProps) {
  const playerHomeX = -2.1;
  const opponentHomeX = 2.1;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.4, 6.2], fov: 42 }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#030508']} />
        <fog attach="fog" args={['#030508', 7, 16]} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[0, 6, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Dynamic Dual Spotlights */}
        <spotLight
          position={[-3, 4, 2]}
          target-position={[playerHomeX, -0.6, 0]}
          angle={0.65}
          penumbra={0.8}
          intensity={playerAction === 'hit' ? 5.5 : 2.8}
          color={playerAction === 'hit' ? '#EF4444' : '#00FF66'}
        />
        <spotLight
          position={[3, 4, 2]}
          target-position={[opponentHomeX, -0.6, 0]}
          angle={0.65}
          penumbra={0.8}
          intensity={opponentAction === 'hit' ? 5.5 : 2.8}
          color={opponentAction === 'hit' ? '#EF4444' : '#F59E0B'}
        />

        {/* Colosseum Environment & Pedestals */}
        <ArenaEnvironment />
        <ArenaPedestal position={[playerHomeX, -0.68, 0]} color="#00FF66" />
        <ArenaPedestal position={[opponentHomeX, -0.68, 0]} color="#EF4444" />

        <ContactShadows
          position={[0, -0.71, 0]}
          opacity={0.75}
          scale={11}
          blur={1.6}
          far={3}
        />

        {/* ─── DYNAMIC COMBATANTS ─── */}
        <DynamicFighter
          config={playerConfig}
          action={playerAction}
          side="player"
          homeX={playerHomeX}
        />

        <DynamicFighter
          config={opponentConfig}
          action={opponentAction}
          side="opponent"
          homeX={opponentHomeX}
        />

        {/* ─── 3D VISUAL COMBAT EFFECTS ─── */}

        {/* 1. Weapon Slashing Arc */}
        {activeFx === 'slash' && fxSource === 'player' && (
          <SlashArcEffect position={[0.7, 0.4, 0]} color="#00FF66" facing="right" />
        )}
        {activeFx === 'slash' && fxSource === 'opponent' && (
          <SlashArcEffect position={[-0.7, 0.4, 0]} color="#EF4444" facing="left" />
        )}

        {/* 2. Hit Sparks Impact Burst */}
        {opponentAction === 'hit' && (
          <HitSparks position={[1.8, 0.5, 0]} color="#F59E0B" />
        )}
        {playerAction === 'hit' && (
          <HitSparks position={[-1.8, 0.5, 0]} color="#EF4444" />
        )}

        {/* 3. Shield Barriers */}
        {playerAction === 'defend' && <ShieldDome position={[-2.1, 0.4, 0]} />}
        {opponentAction === 'defend' && <ShieldDome position={[2.1, 0.4, 0]} />}

        {/* 4. Healing Nanite Auras */}
        {playerAction === 'healing' && <HealingAuraEffect position={[-2.1, -0.6, 0]} />}
        {opponentAction === 'healing' && <HealingAuraEffect position={[2.1, -0.6, 0]} />}

        {/* 5. Magic Projectile Beams */}
        {(activeFx === 'magic' || activeFx === 'ultimate') && fxSource === 'player' && (
          <MagicEnergyProjectile
            source={[-1.2, 0.4, 0]}
            target={[1.6, 0.4, 0]}
            type={activeFx}
          />
        )}
        {(activeFx === 'magic' || activeFx === 'ultimate') && fxSource === 'opponent' && (
          <MagicEnergyProjectile
            source={[1.2, 0.4, 0]}
            target={[-1.6, 0.4, 0]}
            type={activeFx}
          />
        )}

        {/* 6. In-Canvas 3D Floating Combat Text */}
        {floatingCombatText.map((f) => (
          <group
            key={f.id}
            position={[f.target === 'player' ? -2.1 : 2.1, 1.8, 0]}
          >
            <Html center distanceFactor={8}>
              <div
                className={`font-black font-mono text-xl sm:text-2xl whitespace-nowrap animate-bounce select-none pointer-events-none drop-shadow-[0_0_15px_rgba(0,0,0,0.9)] ${
                  f.isCrit ? 'text-amber-300 scale-125' : f.color ? '' : 'text-red-400'
                }`}
                style={{ color: f.color }}
              >
                {f.text}
              </div>
            </Html>
          </group>
        ))}

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
