'use client';
// components/arena/Arena3DCanvas.tsx
// High-Octane 3D Arena with Dynamic Realistic Multi-Biomes (Grassland, Volcano, Mystic Grove),
// Stage Entrance Announcements & Shockwaves, Dynamic Lunging, Slashing Arcs, and Recoil Feedback.

import React, { useRef, Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from '@/types/avatar';
import { AvatarModel } from '@/components/avatar/AvatarModel';
import {
  PhantomDodgeEffect,
  CriticalHitImpactScene,
  PhotonBladeEffect,
  PlasmaBurstEffect,
  SingularityOverdriveEffect,
  SylphArrowEffect,
  NatureSurgeEffect,
  CelestialTempestEffect,
  StardustStrikeEffect,
  CosmicBloomEffect,
  AstralAscensionEffect,
  RuneHammerEffect,
  MagmaBoltEffect,
  ForgeEruptionEffect,
  TitanSmashEffect,
  EarthTremorEffect,
  CataclysmEffect,
  HumanIronBastion,
  ElfWindBarrier,
  FairyPetalShield,
  DwarfStoneFortress,
  OgreBoulderGuard,
} from './Attack3DEffects';

export type CombatAction = 'idle' | 'attack' | 'hit' | 'defend' | 'dodge' | 'crit-hit' | 'victory' | 'healing';
export type BiomeType = 'grassland' | 'volcano' | 'mystic';

interface Arena3DCanvasProps {
  playerConfig: AvatarConfig;
  opponentConfig: AvatarConfig;
  playerAction: CombatAction;
  opponentAction: CombatAction;
  biome?: BiomeType;
  roundKey?: number | string;
  activeFx?: 'slash' | 'magic' | 'shield' | 'ultimate' | 'healing' | null;
  fxSource?: 'player' | 'opponent';
  attackId?: string;
  vfxColor?: string;
  vfxAccent?: string;
  vfxSpark?: string;
  isCrit?: boolean;
  isDodge?: boolean;
  floatingCombatText?: {
    id: number;
    text: string;
    target: 'player' | 'opponent';
    isCrit?: boolean;
    color?: string;
  }[];
}

// ─── 3D Visual Combat Effects ──────────────────────────────────────────────

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
      ringRef.current.rotation.z += delta * 3.0;
      ringRef.current.position.y = (t % 1.5) * 1.2;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 6) * 0.1);
    }
  });

  return (
    <group position={position}>
      {/* Ascending Green Nanite Ring - FLAT on the ground plane */}
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

// ─── Stage Entrance Shockwave ───────────────────────────────────────────────

function EntranceShockwave({ roundKey }: { roundKey?: number | string }) {
  const waveRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setVisible(true);
    startTimeRef.current = performance.now();
  }, [roundKey]);

  useFrame(() => {
    if (!visible || !waveRef.current) return;
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    if (elapsed > 1.8) {
      setVisible(false);
      return;
    }
    const progress = elapsed / 1.8;
    const scale = 0.2 + progress * 7.5;
    waveRef.current.scale.set(scale, scale, scale);
    const mat = waveRef.current.material as THREE.MeshBasicMaterial;
    if (mat) {
      mat.opacity = Math.max(0, (1 - progress) * 0.85);
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={waveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]}>
      <ringGeometry args={[0.8, 1.25, 48]} />
      <meshBasicMaterial color="#00FF66" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Stage Announcement Banner ──────────────────────────────────────────────

function StageEntranceBanner({ biome, roundKey }: { biome: BiomeType; roundKey?: number | string }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 2800);
    return () => clearTimeout(timer);
  }, [roundKey, biome]);

  if (!show) return null;

  const info = {
    grassland: {
      badge: '⚔️ BATTLEGROUND DEPLOYED ⚔️',
      name: 'SUNLIT ANCIENT HIGHLANDS',
      hazard: 'TERRAIN: VERDANT PLAINS • STABILITY: 100%',
      border: 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      text: 'text-emerald-400',
    },
    volcano: {
      badge: '🌋 HAZARD CRITICAL 🌋',
      name: 'SCORCHED VOLCANIC CALDERA',
      hazard: 'TERRAIN: MOLTEN BASALT • HAZARD: INFERNAL HEAT',
      border: 'border-orange-500/70 shadow-[0_0_25px_rgba(249,115,22,0.45)]',
      text: 'text-orange-400',
    },
    mystic: {
      badge: '✨ CELESTIAL ANOMALY ✨',
      name: 'LUMINESCENT TWILIGHT GROVE',
      hazard: 'TERRAIN: RUNIC MOSS • ENERGY: ASTRAL SURGE',
      border: 'border-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.45)]',
      text: 'text-purple-400',
    },
  }[biome];

  return (
    <group position={[0, 2.2, 0]}>
      <Html center distanceFactor={7}>
        <div
          className={`flex flex-col items-center justify-center px-6 py-3 rounded-2xl bg-black/85 backdrop-blur-md border ${info.border} animate-in fade-in zoom-in-95 duration-500 select-none pointer-events-none text-center min-w-[280px] sm:min-w-[340px]`}
        >
          <span className="text-[10px] tracking-widest font-black uppercase text-white/60 mb-0.5">
            {info.badge}
          </span>
          <span className={`text-lg sm:text-xl font-black font-mono tracking-wider ${info.text} drop-shadow-md`}>
            {info.name}
          </span>
          <span className="text-[9px] font-mono text-white/50 tracking-wider mt-1">
            {info.hazard}
          </span>
        </div>
      </Html>
    </group>
  );
}

// ─── Solid 3D Battle Dais (Zero 2D Ring Lines) ──────────────────────────────

function ArenaBattleDais({
  position,
  biome,
  side,
}: {
  position: [number, number, number];
  biome: BiomeType;
  side: 'player' | 'opponent';
}) {
  const isPlayer = side === 'player';

  // Biome-specific materials and colors
  const daisConfig = useMemo(() => {
    switch (biome) {
      case 'grassland':
        return {
          baseColor: '#1e293b',
          topColor: '#0f172a',
          rimColor: isPlayer ? '#00FF66' : '#f59e0b',
          lightColor: isPlayer ? '#00FF66' : '#f59e0b',
          lightIntensity: 2.5,
        };
      case 'volcano':
        return {
          baseColor: '#261313',
          topColor: '#190a0a',
          rimColor: isPlayer ? '#ea580c' : '#dc2626',
          lightColor: isPlayer ? '#f97316' : '#ef4444',
          lightIntensity: 2.8,
        };
      case 'mystic':
      default:
        return {
          baseColor: '#1e1b4b',
          topColor: '#150f2e',
          rimColor: isPlayer ? '#06b6d4' : '#c084fc',
          lightColor: isPlayer ? '#22d3ee' : '#a855f7',
          lightIntensity: 2.6,
        };
    }
  }, [biome, isPlayer]);

  return (
    <group position={position}>
      {/* Lower solid stone tier */}
      <mesh position={[0, -0.16, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.05, 1.2, 0.22, 32]} />
        <meshStandardMaterial color={daisConfig.baseColor} roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Upper chamfered stone tier */}
      <mesh position={[0, 0.01, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.96, 1.05, 0.12, 32]} />
        <meshStandardMaterial color={daisConfig.topColor} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Solid engraved neon rim bevel */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.96, 0.028, 8, 36]} />
        <meshStandardMaterial
          color={daisConfig.rimColor}
          emissive={daisConfig.rimColor}
          emissiveIntensity={2.2}
          roughness={0.2}
        />
      </mesh>

      {/* Atmospheric under-glow light */}
      <pointLight
        color={daisConfig.lightColor}
        intensity={daisConfig.lightIntensity}
        distance={3.5}
        position={[0, 0.4, 0]}
      />
    </group>
  );
}

// ─── Cyber Colosseum Holographic Infrastructure ────────────────────────────

function CyberColosseumInfrastructure({ biome = 'grassland' }: { biome: BiomeType }) {
  const pylonColor = biome === 'volcano' ? '#f97316' : biome === 'mystic' ? '#00e5ff' : '#00FF66';
  const ringColor = biome === 'volcano' ? '#ef4444' : biome === 'mystic' ? '#a855f7' : '#00FF66';

  const pylons = useMemo(() => [
    { x: -2.8, z: -1.6 },
    { x: 0, z: -2.4 },
    { x: 2.8, z: -1.6 },
    { x: 2.8, z: 1.6 },
    { x: 0, z: 2.2 },
    { x: -2.8, z: 1.6 },
  ], []);

  return (
    <group position={[0, -0.71, 0]}>
      {/* Central Holographic Ring Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.9, 1.96, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.9, 2.95, 48]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Central Crosshair */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.25, 0.28, 24]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Perimeter Pylons with Vertical Laser Beams */}
      {pylons.map((p, idx) => (
        <group key={idx} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.22, 0.3, 6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={pylonColor} emissive={pylonColor} emissiveIntensity={3.2} />
          </mesh>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 2.8, 8]} />
            <meshBasicMaterial color={pylonColor} transparent opacity={0.5} />
          </mesh>
          <pointLight color={pylonColor} intensity={0.8} distance={2.5} position={[0, 0.4, 0]} />
        </group>
      ))}

      {/* Floating Holo-Spectator Drones */}
      <FloatingDrone position={[-2.0, 2.0, -1.4]} color={pylonColor} />
      <FloatingDrone position={[2.0, 2.2, -1.1]} color={pylonColor} />
    </group>
  );
}

function FloatingDrone({ position, color }: { position: [number, number, number]; color: string }) {
  const droneRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!droneRef.current) return;
    const t = clock.getElapsedTime();
    droneRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.12;
    droneRef.current.rotation.y = t * 0.7;
  });

  return (
    <group ref={droneRef} position={position}>
      <mesh>
        <boxGeometry args={[0.22, 0.08, 0.22]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.5, 0.15]} rotation={[0.25, 0, 0]}>
        <coneGeometry args={[0.26, 1.0, 8, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={2.8} />
    </group>
  );
}

// ─── Biome 1: Ancient Sunlit Grassland ──────────────────────────────────────

function GrasslandBiome() {
  // Procedural Low-Poly Trees in the background
  const trees = useMemo(() => [
    { x: -5.5, z: -3.8, scale: 1.15, type: 'oak' },
    { x: -4.0, z: -5.0, scale: 0.95, type: 'pine' },
    { x: -7.0, z: -2.5, scale: 1.25, type: 'pine' },
    { x: 5.2, z: -4.0, scale: 1.1, type: 'oak' },
    { x: 3.8, z: -5.5, scale: 1.3, type: 'pine' },
    { x: 6.8, z: -2.8, scale: 1.0, type: 'oak' },
  ], []);

  // Natural Boulders
  const rocks = useMemo(() => [
    { x: -3.2, z: -2.2, scale: 0.45, rotY: 0.4 },
    { x: 3.4, z: -2.0, scale: 0.52, rotY: 1.1 },
    { x: 0.2, z: -4.5, scale: 0.75, rotY: 2.3 },
    { x: -6.0, z: -1.2, scale: 0.38, rotY: 0.8 },
  ], []);

  // Drifting Leaves Particles
  const leavesRef = useRef<THREE.Group>(null);
  const leafCount = 18;
  const leafData = useMemo(() => {
    return Array.from({ length: leafCount }).map(() => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 3 + 0.5,
        (Math.random() - 0.5) * 6
      ),
      speedY: Math.random() * 0.4 + 0.2,
      speedX: Math.random() * 0.3 + 0.1,
      rotSpeed: Math.random() * 2 + 1,
    }));
  }, []);

  useFrame((_, delta) => {
    if (leavesRef.current) {
      leavesRef.current.children.forEach((child, i) => {
        const d = leafData[i];
        child.position.y -= d.speedY * delta;
        child.position.x += d.speedX * delta;
        child.rotation.z += d.rotSpeed * delta;
        if (child.position.y < -0.5) {
          child.position.y = 3.5;
          child.position.x = (Math.random() - 0.5) * 10 - 2;
        }
      });
    }
  });

  return (
    <group position={[0, -0.72, 0]}>
      {/* Rolling Grassland Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color="#2d5225" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Gentle Earthy Pathway / Clearing */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <circleGeometry args={[4.8, 32]} />
        <meshStandardMaterial color="#3b5e2f" roughness={0.9} />
      </mesh>

      {/* 3D Trees */}
      {trees.map((t, idx) => (
        <group key={idx} position={[t.x, 0, t.z]} scale={[t.scale, t.scale, t.scale]}>
          {/* Wood Trunk */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.24, 1.8, 8]} />
            <meshStandardMaterial color="#452718" roughness={0.9} />
          </mesh>
          {t.type === 'oak' ? (
            /* Multi-sphere lush foliage */
            <group position={[0, 2.0, 0]}>
              <mesh position={[0, 0.4, 0]} castShadow>
                <sphereGeometry args={[0.85, 8, 8]} />
                <meshStandardMaterial color="#2e7d32" roughness={0.8} />
              </mesh>
              <mesh position={[0.4, 0.1, 0.2]} castShadow>
                <sphereGeometry args={[0.65, 8, 8]} />
                <meshStandardMaterial color="#388e3c" roughness={0.8} />
              </mesh>
              <mesh position={[-0.35, 0.2, -0.2]} castShadow>
                <sphereGeometry args={[0.6, 8, 8]} />
                <meshStandardMaterial color="#1b5e20" roughness={0.8} />
              </mesh>
            </group>
          ) : (
            /* Tiered evergreen pine foliage */
            <group position={[0, 1.3, 0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <coneGeometry args={[1.05, 1.2, 7]} />
                <meshStandardMaterial color="#1e4620" roughness={0.85} />
              </mesh>
              <mesh position={[0, 1.0, 0]} castShadow>
                <coneGeometry args={[0.8, 1.0, 7]} />
                <meshStandardMaterial color="#2d5e2e" roughness={0.85} />
              </mesh>
              <mesh position={[0, 1.6, 0]} castShadow>
                <coneGeometry args={[0.55, 0.8, 7]} />
                <meshStandardMaterial color="#3d7e3e" roughness={0.85} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* 3D Natural Slate Boulders */}
      {rocks.map((r, idx) => (
        <mesh
          key={idx}
          position={[r.x, r.scale * 0.5, r.z]}
          rotation={[0.3, r.rotY, 0.2]}
          scale={[r.scale, r.scale * 0.85, r.scale]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
      ))}

      {/* Drifting Leaf Particles */}
      <group ref={leavesRef}>
        {leafData.map((d, i) => (
          <mesh key={i} position={d.pos.toArray()}>
            <planeGeometry args={[0.1, 0.06]} />
            <meshBasicMaterial color="#84cc16" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── Biome 2: Scorched Volcanic Caldera ──────────────────────────────────────

function VolcanoBiome() {
  const embersRef = useRef<THREE.Group>(null);
  const magmaRef = useRef<THREE.Mesh>(null);

  // Basalt Spires & Rock Pillars
  const spires = useMemo(() => [
    { x: -5.8, z: -3.5, h: 3.5, r: 0.55 },
    { x: -4.2, z: -5.2, h: 4.8, r: 0.7 },
    { x: 5.6, z: -3.2, h: 4.0, r: 0.65 },
    { x: 4.0, z: -5.5, h: 5.2, r: 0.8 },
    { x: 0.0, z: -6.0, h: 6.0, r: 1.1 },
  ], []);

  // Rising fiery ember sparks
  const emberCount = 28;
  const emberData = useMemo(() => {
    return Array.from({ length: emberCount }).map(() => ({
      x: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 4 - 1,
      y: Math.random() * 4,
      speedY: Math.random() * 0.9 + 0.4,
      swaySpeed: Math.random() * 2 + 1,
      size: Math.random() * 0.04 + 0.02,
      color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
    }));
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    // Magma pulse
    if (magmaRef.current) {
      const mat = magmaRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 1.4 + Math.sin(t * 2.5) * 0.5;
      }
    }
    // Ascending embers
    if (embersRef.current) {
      embersRef.current.children.forEach((child, i) => {
        const d = emberData[i];
        child.position.y += d.speedY * delta;
        child.position.x += Math.sin(t * d.swaySpeed + i) * 0.008;
        if (child.position.y > 4.5) {
          child.position.y = 0;
          child.position.x = (Math.random() - 0.5) * 8;
        }
      });
    }
  });

  return (
    <group position={[0, -0.72, 0]}>
      {/* Fractured Basalt Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color="#141113" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Central Molten Lava Fissure Trench */}
      <mesh
        ref={magmaRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, -0.4]}
        receiveShadow
      >
        <planeGeometry args={[10, 1.8]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#f97316"
          emissiveIntensity={1.8}
          roughness={0.3}
        />
      </mesh>
      <pointLight color="#ea580c" intensity={4} distance={6} position={[0, 0.4, -0.4]} />

      {/* Jagged Obsidian Spires */}
      {spires.map((s, idx) => (
        <mesh key={idx} position={[s.x, s.h * 0.45, s.z]} castShadow receiveShadow>
          <coneGeometry args={[s.r, s.h, 5]} />
          <meshStandardMaterial color="#1c1917" roughness={0.85} metalness={0.3} />
        </mesh>
      ))}

      {/* Rising Embers */}
      <group ref={embersRef}>
        {emberData.map((d, i) => (
          <mesh key={i} position={[d.x, d.y, d.z]}>
            <sphereGeometry args={[d.size, 6, 6]} />
            <meshBasicMaterial color={d.color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── Biome 3: Luminescent Twilight Grove ───────────────────────────────────

function MysticBiome() {
  const sporesRef = useRef<THREE.Group>(null);

  // Crystal Spires
  const crystals = useMemo(() => [
    { x: -4.8, z: -3.0, h: 1.8, r: 0.28, rotZ: 0.2, color: '#8b5cf6' },
    { x: -3.8, z: -3.8, h: 2.4, r: 0.35, rotZ: -0.15, color: '#06b6d4' },
    { x: 4.5, z: -2.8, h: 2.1, r: 0.3, rotZ: -0.22, color: '#a855f7' },
    { x: 5.6, z: -3.5, h: 1.6, r: 0.25, rotZ: 0.18, color: '#38bdf8' },
    { x: 0.2, z: -5.0, h: 2.8, r: 0.4, rotZ: 0.05, color: '#c084fc' },
  ], []);

  // Giant Luminescent Fantasy Mushrooms
  const mushrooms = useMemo(() => [
    { x: -5.8, z: -1.8, stemH: 1.4, capR: 0.85, color: '#a855f7' },
    { x: -6.4, z: -2.6, stemH: 0.9, capR: 0.6, color: '#ec4899' },
    { x: 5.4, z: -1.6, stemH: 1.3, capR: 0.8, color: '#06b6d4' },
    { x: 6.2, z: -2.4, stemH: 1.0, capR: 0.65, color: '#8b5cf6' },
  ], []);

  // Floating Fireflies / Starlight Motes
  const fireflyCount = 24;
  const fireflyData = useMemo(() => {
    return Array.from({ length: fireflyCount }).map(() => ({
      x: (Math.random() - 0.5) * 10,
      y: Math.random() * 2.5 + 0.3,
      z: (Math.random() - 0.5) * 5,
      speed: Math.random() * 1.5 + 0.8,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sporesRef.current) {
      sporesRef.current.children.forEach((child, i) => {
        const d = fireflyData[i];
        child.position.y = d.y + Math.sin(t * d.speed + d.phase) * 0.25;
        child.position.x = d.x + Math.cos(t * d.speed * 0.7 + d.phase) * 0.15;
      });
    }
  });

  return (
    <group position={[0, -0.72, 0]}>
      {/* Twilight Moss Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color="#0b0817" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Bioluminescent Fantasy Mushrooms */}
      {mushrooms.map((m, idx) => (
        <group key={idx} position={[m.x, 0, m.z]}>
          {/* Pale Stem */}
          <mesh position={[0, m.stemH * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, m.stemH, 10]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
          {/* Glowing Parasol Cap */}
          <mesh position={[0, m.stemH, 0]} castShadow>
            <coneGeometry args={[m.capR, m.capR * 0.6, 14]} />
            <meshStandardMaterial
              color={m.color}
              emissive={m.color}
              emissiveIntensity={1.6}
              roughness={0.4}
            />
          </mesh>
          <pointLight color={m.color} intensity={1.8} distance={2.5} position={[0, m.stemH + 0.2, 0]} />
        </group>
      ))}

      {/* Prismatic Crystal Spire Clusters */}
      {crystals.map((c, idx) => (
        <mesh
          key={idx}
          position={[c.x, c.h * 0.45, c.z]}
          rotation={[0.1, 0, c.rotZ]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.02, c.r, c.h, 6]} />
          <meshStandardMaterial
            color={c.color}
            emissive={c.color}
            emissiveIntensity={1.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Floating Fireflies / Starlight Spores */}
      <group ref={sporesRef}>
        {fireflyData.map((d, i) => (
          <mesh key={i} position={[d.x, d.y, d.z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
        ))}
      </group>
    </group>
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
  const targetYRef = useRef(-0.6);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Determine dynamic target X and Y positions based on combat action
    if (action === 'attack') {
      // Aggressive lunge forward into the opponent
      targetXRef.current = isPlayer ? (homeX + 0.95) : (homeX - 0.95);
      targetYRef.current = -0.55;
    } else if (action === 'crit-hit') {
      // Violent critical knockback: launched upwards into the air and pushed far back!
      targetXRef.current = isPlayer ? (homeX - 0.7) : (homeX + 0.7);
      targetYRef.current = -0.22;
    } else if (action === 'hit') {
      // Stagger and fly backwards from the hit
      targetXRef.current = isPlayer ? (homeX - 0.4) : (homeX + 0.4);
      targetYRef.current = -0.6;
    } else if (action === 'dodge') {
      // Acrobatic evasive backstep / sidestep hop!
      targetXRef.current = isPlayer ? (homeX - 0.65) : (homeX + 0.65);
      targetYRef.current = -0.42;
    } else {
      // Idle / defend / healing: stand firm on home dais
      targetXRef.current = homeX;
      targetYRef.current = -0.6;
    }

    // Smooth physics lerp for position X and Y
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetXRef.current,
      delta * 14
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetYRef.current,
      delta * 12
    );

    // Dynamic rotation recoil, dodge lean, and attack surge
    if (action === 'crit-hit') {
      // Severe backward recoil tilt + violent twist
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        isPlayer ? -0.55 : 0.55,
        delta * 18
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.35, delta * 14);
    } else if (action === 'hit') {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        isPlayer ? -0.35 : 0.35,
        delta * 16
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 10);
    } else if (action === 'dodge') {
      // Agile backward evasion arch
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        isPlayer ? -0.42 : 0.42,
        delta * 18
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.25, delta * 14);
    } else if (action === 'attack') {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        isPlayer ? 0.2 : -0.2,
        delta * 12
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.15, delta * 10);
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        0,
        delta * 10
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, delta * 10);
    }
  });

  // Map extended actions to AvatarModel actions
  const modelAction =
    action === 'crit-hit'
      ? 'hit'
      : action === 'dodge' || action === 'healing'
      ? 'idle'
      : action;

  return (
    <group
      ref={groupRef}
      position={[homeX, -0.6, 0]}
      rotation={[0, isPlayer ? Math.PI / 2.2 : -Math.PI / 2.2, 0]}
    >
      <AvatarModel
        config={config}
        action={modelAction}
        animate={true}
      />
    </group>
  );
}

// ─── Main Exported 3D Colosseum Arena ───────────────────────────────────────

export function Arena3DCanvas({
  playerConfig,
  opponentConfig,
  playerAction,
  opponentAction,
  biome = 'grassland',
  roundKey,
  activeFx,
  fxSource = 'player',
  attackId,
  vfxColor,
  vfxAccent,
  vfxSpark,
  isCrit,
  isDodge,
  floatingCombatText = [],
}: Arena3DCanvasProps) {
  const playerHomeX = -1.45;
  const opponentHomeX = 1.45;

  const playerSpecies = (playerConfig.species || 'human').toLowerCase();
  const opponentSpecies = (opponentConfig.species || 'human').toLowerCase();

  const sourcePos: [number, number, number] = fxSource === 'player' ? [-0.8, 0.4, 0] : [0.8, 0.4, 0];
  const targetPos: [number, number, number] = fxSource === 'player' ? [opponentHomeX, 0.4, 0] : [playerHomeX, 0.4, 0];
  const facingDir: 'right' | 'left' = fxSource === 'player' ? 'right' : 'left';

  // Biome Lighting & Fog Atmosphere with Bright High-Tech Contrast
  const lighting = useMemo(() => {
    switch (biome) {
      case 'volcano':
        return {
          bg: '#1c0808',
          fog: '#1c0808',
          ambientColor: '#fed7aa',
          ambientInt: 1.0,
          sunColor: '#f97316',
          sunInt: 2.4,
        };
      case 'mystic':
        return {
          bg: '#0e0b1f',
          fog: '#0e0b1f',
          ambientColor: '#ddd6fe',
          ambientInt: 1.1,
          sunColor: '#38bdf8',
          sunInt: 2.2,
        };
      case 'grassland':
      default:
        return {
          bg: '#07150e',
          fog: '#07150e',
          ambientColor: '#a7f3d0',
          ambientInt: 1.1,
          sunColor: '#ecfdf5',
          sunInt: 2.2,
        };
    }
  }, [biome]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 1.25, 4.8], fov: 46 }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[lighting.bg]} />
        <fog attach="fog" args={[lighting.fog, 6, 20]} />

        <ambientLight color={lighting.ambientColor} intensity={lighting.ambientInt} />
        <directionalLight
          position={[0, 6, 4]}
          color={lighting.sunColor}
          intensity={lighting.sunInt}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Dynamic Dual Fighter Spotlights */}
        <spotLight
          position={[-2.5, 4, 2]}
          target-position={[playerHomeX, -0.6, 0]}
          angle={0.65}
          penumbra={0.7}
          intensity={playerAction === 'hit' || playerAction === 'crit-hit' ? 7.0 : 3.2}
          color={playerAction === 'crit-hit' ? '#DC2626' : playerAction === 'hit' ? '#EF4444' : '#00FF66'}
        />
        <spotLight
          position={[2.5, 4, 2]}
          target-position={[opponentHomeX, -0.6, 0]}
          angle={0.65}
          penumbra={0.7}
          intensity={opponentAction === 'hit' || opponentAction === 'crit-hit' ? 7.0 : 3.2}
          color={opponentAction === 'crit-hit' ? '#DC2626' : opponentAction === 'hit' ? '#EF4444' : '#F59E0B'}
        />

        {/* ─── REALISTIC BIOME ENVIRONMENT ─── */}
        {biome === 'grassland' && <GrasslandBiome />}
        {biome === 'volcano' && <VolcanoBiome />}
        {biome === 'mystic' && <MysticBiome />}

        {/* ─── CYBER COLOSSEUM ARENA INFRASTRUCTURE ─── */}
        <CyberColosseumInfrastructure biome={biome} />

        {/* ─── SOLID 3D COMBAT DAIS ─── */}
        <ArenaBattleDais position={[playerHomeX, -0.68, 0]} biome={biome} side="player" />
        <ArenaBattleDais position={[opponentHomeX, -0.68, 0]} biome={biome} side="opponent" />

        {/* Ground Contact Shadows */}
        <ContactShadows
          position={[0, -0.71, 0]}
          opacity={0.75}
          scale={12}
          blur={1.6}
          far={3}
        />

        {/* ─── STAGE ENTRANCE EFFECTS ─── */}
        <EntranceShockwave roundKey={roundKey} />
        <StageEntranceBanner biome={biome} roundKey={roundKey} />

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

        {/* ─── 1. PHANTOM DODGE EVASION EFFECTS ─── */}
        {playerAction === 'dodge' && (
          <PhantomDodgeEffect position={[playerHomeX, -0.4, 0]} facing="left" />
        )}
        {opponentAction === 'dodge' && (
          <PhantomDodgeEffect position={[opponentHomeX, -0.4, 0]} facing="right" />
        )}

        {/* ─── 2. DRAMATIC CRITICAL HIT IMPACT SCENE ─── */}
        {opponentAction === 'crit-hit' && (
          <CriticalHitImpactScene position={[opponentHomeX, 0.4, 0]} color={vfxSpark || '#F59E0B'} />
        )}
        {playerAction === 'crit-hit' && (
          <CriticalHitImpactScene position={[playerHomeX, 0.4, 0]} color={vfxSpark || '#EF4444'} />
        )}

        {/* ─── 3. STANDARD HIT IMPACT SPARKS ─── */}
        {opponentAction === 'hit' && (
          <HitSparks position={[opponentHomeX, 0.5, 0]} color={vfxSpark || '#F59E0B'} />
        )}
        {playerAction === 'hit' && (
          <HitSparks position={[playerHomeX, 0.5, 0]} color={vfxSpark || '#EF4444'} />
        )}

        {/* ─── 4. SPECIES-SPECIFIC 3D DEFENSIVE SHIELDS ─── */}
        {playerAction === 'defend' && (
          playerSpecies === 'elf' ? <ElfWindBarrier position={[playerHomeX, -0.4, 0]} /> :
          playerSpecies === 'fairy' ? <FairyPetalShield position={[playerHomeX, -0.4, 0]} /> :
          playerSpecies === 'dwarf' ? <DwarfStoneFortress position={[playerHomeX, -0.4, 0]} /> :
          playerSpecies === 'ogre' ? <OgreBoulderGuard position={[playerHomeX, -0.4, 0]} /> :
          <HumanIronBastion position={[playerHomeX, -0.4, 0]} />
        )}

        {opponentAction === 'defend' && (
          opponentSpecies === 'elf' ? <ElfWindBarrier position={[opponentHomeX, -0.4, 0]} /> :
          opponentSpecies === 'fairy' ? <FairyPetalShield position={[opponentHomeX, -0.4, 0]} /> :
          opponentSpecies === 'dwarf' ? <DwarfStoneFortress position={[opponentHomeX, -0.4, 0]} /> :
          opponentSpecies === 'ogre' ? <OgreBoulderGuard position={[opponentHomeX, -0.4, 0]} /> :
          <HumanIronBastion position={[opponentHomeX, -0.4, 0]} />
        )}

        {/* ─── 5. HEALING NANITE AURA ─── */}
        {playerAction === 'healing' && <HealingAuraEffect position={[playerHomeX, -0.6, 0]} />}
        {opponentAction === 'healing' && <HealingAuraEffect position={[opponentHomeX, -0.6, 0]} />}

        {/* ─── 6. SPECIES-SPECIFIC ATTACK 3D VISUAL SCENES ─── */}

        {/* HUMAN ATTACKS */}
        {attackId === 'human-photon-blade' && activeFx && (
          <PhotonBladeEffect position={targetPos} facing={facingDir} />
        )}
        {attackId === 'human-plasma-burst' && activeFx && (
          <PlasmaBurstEffect source={sourcePos} target={targetPos} />
        )}
        {attackId === 'human-singularity-overdrive' && activeFx && (
          <SingularityOverdriveEffect source={sourcePos} target={targetPos} />
        )}

        {/* ELF ATTACKS */}
        {attackId === 'elf-sylph-arrow' && activeFx && (
          <SylphArrowEffect source={sourcePos} target={targetPos} />
        )}
        {attackId === 'elf-nature-surge' && activeFx && (
          <NatureSurgeEffect position={targetPos} />
        )}
        {attackId === 'elf-celestial-tempest' && activeFx && (
          <CelestialTempestEffect position={targetPos} />
        )}

        {/* FAIRY ATTACKS */}
        {attackId === 'fairy-stardust-strike' && activeFx && (
          <StardustStrikeEffect source={sourcePos} target={targetPos} />
        )}
        {attackId === 'fairy-cosmic-bloom' && activeFx && (
          <CosmicBloomEffect position={targetPos} />
        )}
        {attackId === 'fairy-astral-ascension' && activeFx && (
          <AstralAscensionEffect position={targetPos} />
        )}

        {/* DWARF ATTACKS */}
        {attackId === 'dwarf-rune-hammer' && activeFx && (
          <RuneHammerEffect position={targetPos} />
        )}
        {attackId === 'dwarf-magma-bolt' && activeFx && (
          <MagmaBoltEffect source={sourcePos} target={targetPos} />
        )}
        {attackId === 'dwarf-forge-eruption' && activeFx && (
          <ForgeEruptionEffect position={targetPos} />
        )}

        {/* OGRE ATTACKS */}
        {attackId === 'ogre-titan-smash' && activeFx && (
          <TitanSmashEffect position={targetPos} />
        )}
        {attackId === 'ogre-earth-tremor' && activeFx && (
          <EarthTremorEffect source={sourcePos} target={targetPos} />
        )}
        {attackId === 'ogre-cataclysm' && activeFx && (
          <CataclysmEffect position={targetPos} />
        )}

        {/* FALLBACK GENERIC ATTACK FX (If attackId is not specifically matched) */}
        {!attackId && activeFx === 'slash' && (
          <SlashArcEffect position={targetPos} color={vfxColor || (fxSource === 'player' ? '#00FF66' : '#EF4444')} facing={facingDir} />
        )}
        {!attackId && (activeFx === 'magic' || activeFx === 'ultimate') && (
          <MagicEnergyProjectile source={sourcePos} target={targetPos} type={activeFx} />
        )}

        {/* 6. In-Canvas 3D Floating Combat Text */}
        {floatingCombatText.map((f) => (
          <group
            key={f.id}
            position={[f.target === 'player' ? playerHomeX : opponentHomeX, 1.8, 0]}
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
