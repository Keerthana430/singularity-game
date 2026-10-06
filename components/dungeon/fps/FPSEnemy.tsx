// components/dungeon/fps/FPSEnemy.tsx
// Recognizable 3D Monster Meshes: Slime (Gelatinous Bouncing Jelly), Skeleton (Ribcage & Skull Sniper),
// Rune Stone Golem (Cracked Boulder Mech), and Void Lich (Hovering Hooded Necromancer)

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { FPSEnemyEntity } from './types';

interface FPSEnemyProps {
  enemy: FPSEnemyEntity;
  isTargeted?: boolean;
}

export function FPSEnemy({ enemy, isTargeted = false }: FPSEnemyProps) {
  const rootRef = useRef<THREE.Group>(null);
  const flashActive = enemy.hitFlashTimer > 0;
  const isTelegraphing = enemy.aiState === 'telegraph';

  useFrame((_, delta) => {
    if (!rootRef.current) return;
    rootRef.current.position.set(enemy.position[0], enemy.position[1], enemy.position[2]);
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      enemy.rotationY,
      delta * 12
    );
  });

  const percentHp = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const percentShield = enemy.maxShield > 0 ? (enemy.shield / enemy.maxShield) * 100 : 0;

  const isSlime = enemy.archetype === 'slime' || enemy.archetype === 'scout';
  const isSkeleton = enemy.archetype === 'skeleton' || enemy.archetype === 'guardian';
  const isGolem = enemy.archetype === 'golem' || enemy.archetype === 'brute';
  const isLich = enemy.archetype === 'elite' || enemy.archetype === 'boss';

  return (
    <group ref={rootRef} userData={{ enemyId: enemy.id }}>
      {/* 1. SLIME (Gelatinous Bouncing Jelly with Inner Core & Eyes) */}
      {isSlime && (
        <SlimeMesh color={enemy.color} flashActive={flashActive} isTelegraphing={isTelegraphing} />
      )}

      {/* 2. SKELETON (Skull, Ribcage, Bone Limbs & Sniper Bow) */}
      {isSkeleton && (
        <SkeletonMesh color={enemy.color} flashActive={flashActive} isTelegraphing={isTelegraphing} />
      )}

      {/* 3. GOLEM (Heavy Cracked Rune Stone Mech) */}
      {isGolem && (
        <GolemMesh color={enemy.color} flashActive={flashActive} isTelegraphing={isTelegraphing} />
      )}

      {/* 4. VOID LICH / ELITE (Hovering Hooded Necromancer & Orbiting Skulls) */}
      {isLich && (
        <LichMesh color={enemy.color} flashActive={flashActive} isTelegraphing={isTelegraphing} />
      )}

      {/* Telegraph Attack Warning Aura */}
      {isTelegraphing && (
        <pointLight
          position={[0, 1.2, 0]}
          color="#EF4444"
          intensity={6 * (enemy.telegraphProgress || 0.6)}
          distance={4.5}
        />
      )}

      {/* Overhead Monster Nameplate & Vitality Bar */}
      <Html
        position={[0, isLich ? 2.6 : isGolem ? 2.8 : 2.0, 0]}
        center
        distanceFactor={9}
        occlude={false}
      >
        <div className="pointer-events-none flex flex-col items-center select-none font-mono">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/85 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xl backdrop-blur-md">
            <span style={{ color: enemy.color }}>{enemy.name}</span>
            {enemy.isRanged && (
              <span className="rounded bg-cyan-500/20 px-1 text-[7px] text-cyan-300 border border-cyan-500/40">
                RANGED
              </span>
            )}
          </div>

          <div className="mt-1 h-1.5 w-22 rounded-full bg-black/80 p-[1px] border border-white/20 overflow-hidden shadow">
            {percentShield > 0 && (
              <div
                className="h-full bg-cyan-400 mb-[1px] transition-all"
                style={{ width: `${percentShield}%` }}
              />
            )}
            <div
              className={`h-full transition-all ${
                percentHp < 30 ? 'bg-amber-400' : 'bg-[#00FF66]'
              }`}
              style={{ width: `${percentHp}%` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── 1. RECOGNIZABLE SLIME (GELATINOUS BOUNCING JELLY CUBE) ──────────────────
function SlimeMesh({
  color,
  flashActive,
  isTelegraphing,
}: {
  color: string;
  flashActive: boolean;
  isTelegraphing: boolean;
}) {
  const slimeGroupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 7;
    if (slimeGroupRef.current) {
      // Bouncy jelly squish and stretch animation
      const squish = Math.sin(t);
      slimeGroupRef.current.scale.y = 1 + squish * 0.18;
      slimeGroupRef.current.scale.x = 1 - squish * 0.09;
      slimeGroupRef.current.scale.z = 1 - squish * 0.09;
      slimeGroupRef.current.position.y = 0.45 + Math.abs(Math.sin(t)) * 0.22;
    }
    if (nucleusRef.current) {
      nucleusRef.current.rotation.x = t * 0.5;
      nucleusRef.current.rotation.y = t * 0.8;
    }
  });

  const jellyColor = flashActive ? '#FFFFFF' : isTelegraphing ? '#EF4444' : color;

  return (
    <group ref={slimeGroupRef} position={[0, 0.45, 0]}>
      {/* Outer Translucent Jelly Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.85, 0.9]} />
        <meshStandardMaterial
          color={jellyColor}
          roughness={0.15}
          metalness={0.2}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Inner Floating Glowing Nucleus Core */}
      <mesh ref={nucleusRef}>
        <octahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color="#86EFAC"
          emissive="#86EFAC"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* Left Slime Eye */}
      <group position={[-0.2, 0.15, 0.46]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* Right Slime Eye */}
      <group position={[0.2, 0.15, 0.46]}>
        <mesh>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* Floor Slime Splat Decal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <circleGeometry args={[0.65, 12]} />
        <meshBasicMaterial color={jellyColor} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ─── 2. RECOGNIZABLE SKELETON (SKULL, RIBCAGE & SNIPER BOW) ───────────────────
function SkeletonMesh({
  color,
  flashActive,
  isTelegraphing,
}: {
  color: string;
  flashActive: boolean;
  isTelegraphing: boolean;
}) {
  const boneColor = flashActive ? '#FFFFFF' : '#E2E8F0';
  const eyeGlow = isTelegraphing ? '#EF4444' : '#38BDF8';

  return (
    <group position={[0, 0, 0]}>
      {/* ─── SKULL ─── */}
      <group position={[0, 1.55, 0]}>
        {/* Cranium */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.4, 0.4]} />
          <meshStandardMaterial color={boneColor} roughness={0.65} metalness={0.15} />
        </mesh>
        {/* Jaw */}
        <mesh position={[0, -0.22, 0.06]}>
          <boxGeometry args={[0.3, 0.12, 0.28]} />
          <meshStandardMaterial color={boneColor} roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Left Eye Socket with Glowing Eye */}
        <mesh position={[-0.1, 0.04, 0.21]}>
          <boxGeometry args={[0.09, 0.09, 0.04]} />
          <meshBasicMaterial color="#090E17" />
        </mesh>
        <mesh position={[-0.1, 0.04, 0.23]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={eyeGlow} />
        </mesh>
        {/* Right Eye Socket with Glowing Eye */}
        <mesh position={[0.1, 0.04, 0.21]}>
          <boxGeometry args={[0.09, 0.09, 0.04]} />
          <meshBasicMaterial color="#090E17" />
        </mesh>
        <mesh position={[0.1, 0.04, 0.23]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={eyeGlow} />
        </mesh>
      </group>

      {/* ─── SPINE & RIBCAGE ─── */}
      <group position={[0, 1.05, 0]}>
        {/* Central Spine */}
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.65, 8]} />
          <meshStandardMaterial color={boneColor} roughness={0.6} />
        </mesh>
        {/* 3 Rib Loops */}
        {[-0.18, 0, 0.18].map((ry, idx) => (
          <mesh key={idx} position={[0, ry, 0]}>
            <torusGeometry args={[0.22, 0.035, 6, 12]} />
            <meshStandardMaterial color={boneColor} roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* ─── BONE ARMS & CYBER SNIPER BOW ─── */}
      <group position={[0, 1.15, 0]}>
        {/* Left Arm Bone */}
        <mesh position={[-0.32, -0.15, 0.15]} rotation={[0.4, 0, -0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.45, 6]} />
          <meshStandardMaterial color={boneColor} />
        </mesh>
        {/* Right Arm Bone (holding bow string) */}
        <mesh position={[0.32, -0.15, 0.15]} rotation={[0.4, 0, 0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.45, 6]} />
          <meshStandardMaterial color={boneColor} />
        </mesh>

        {/* Cyber Bone Bow / Plasma Blaster */}
        <group position={[0, -0.05, 0.45]}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.4, 0.03, 6, 16, Math.PI * 1.1]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Glowing Plasma Bowstring / Arrow */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
        </group>
      </group>

      {/* ─── PELVIS & BONE LEGS ─── */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.32, 0.1, 0.2]} />
        <meshStandardMaterial color={boneColor} />
      </mesh>
      {/* Left Leg */}
      <mesh position={[-0.14, 0.35, 0]}>
        <cylinderGeometry args={[0.045, 0.04, 0.65, 6]} />
        <meshStandardMaterial color={boneColor} />
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.14, 0.35, 0]}>
        <cylinderGeometry args={[0.045, 0.04, 0.65, 6]} />
        <meshStandardMaterial color={boneColor} />
      </mesh>
    </group>
  );
}

// ─── 3. RECOGNIZABLE GOLEM (CRACKED RUNE STONE MECH) ─────────────────────────
function GolemMesh({
  color,
  flashActive,
  isTelegraphing,
}: {
  color: string;
  flashActive: boolean;
  isTelegraphing: boolean;
}) {
  const stoneColor = flashActive ? '#FFFFFF' : '#475569';
  const runeGlow = isTelegraphing ? '#EF4444' : '#F59E0B';

  return (
    <group position={[0, 0, 0]}>
      {/* Heavy Stone Torso */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[1.3, 1.1, 0.9]} />
        <meshStandardMaterial color={stoneColor} roughness={0.85} metalness={0.3} />
      </mesh>

      {/* Glowing Rune Fissure Chest Core */}
      <mesh position={[0, 1.4, 0.46]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshBasicMaterial color={runeGlow} />
      </mesh>

      {/* Stone Head / Visor */}
      <mesh position={[0, 2.15, 0.1]} castShadow>
        <boxGeometry args={[0.65, 0.45, 0.65]} />
        <meshStandardMaterial color={stoneColor} roughness={0.8} />
      </mesh>
      {/* Glowing Slit Eye */}
      <mesh position={[0, 2.15, 0.44]}>
        <planeGeometry args={[0.4, 0.08]} />
        <meshBasicMaterial color={runeGlow} />
      </mesh>

      {/* Left Boulder Shoulder & Heavy Fist */}
      <group position={[-0.95, 1.5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.38, 8, 8]} />
          <meshStandardMaterial color={stoneColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.65, 0.2]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.55]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.5} />
        </mesh>
      </group>

      {/* Right Boulder Shoulder & Heavy Fist */}
      <group position={[0.95, 1.5, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.38, 8, 8]} />
          <meshStandardMaterial color={stoneColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.65, 0.2]} castShadow>
          <boxGeometry args={[0.5, 0.6, 0.55]} />
          <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.5} />
        </mesh>
      </group>

      {/* Sturdy Stone Legs */}
      <mesh position={[-0.38, 0.45, 0]} castShadow>
        <boxGeometry args={[0.45, 0.9, 0.5]} />
        <meshStandardMaterial color={stoneColor} roughness={0.85} />
      </mesh>
      <mesh position={[0.38, 0.45, 0]} castShadow>
        <boxGeometry args={[0.45, 0.9, 0.5]} />
        <meshStandardMaterial color={stoneColor} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─── 4. RECOGNIZABLE LICH (HOVERING HOODED NECROMANCER & SKULL ORBS) ──────────
function LichMesh({
  color,
  flashActive,
  isTelegraphing,
}: {
  color: string;
  flashActive: boolean;
  isTelegraphing: boolean;
}) {
  const orbsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (orbsRef.current) {
      orbsRef.current.rotation.y = clock.getElapsedTime() * 1.8;
    }
  });

  const robeColor = flashActive ? '#FFFFFF' : '#1E1B4B';
  const glow = isTelegraphing ? '#EF4444' : '#C084FC';

  return (
    <group position={[0, 0.3, 0]}>
      {/* Floating Dark Robe Cloak */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.75, 1.8, 16]} />
        <meshStandardMaterial color={robeColor} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Hood & Glowing Red/Purple Skull Face */}
      <group position={[0, 2.05, 0]}>
        <mesh>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#0F172A" roughness={0.8} />
        </mesh>
        {/* Inner Glowing Skull Eyes */}
        <mesh position={[-0.1, 0.02, 0.28]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={glow} />
        </mesh>
        <mesh position={[0.1, 0.02, 0.28]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={glow} />
        </mesh>
      </group>

      {/* Orbiting Soul Skull Orbs */}
      <group ref={orbsRef} position={[0, 1.4, 0]}>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
          <group
            key={idx}
            position={[Math.cos(angle) * 1.1, Math.sin(angle * 2) * 0.2, Math.sin(angle) * 1.1]}
          >
            <mesh>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={3.0} />
            </mesh>
            <pointLight color={glow} intensity={2} distance={3} />
          </group>
        ))}
      </group>
    </group>
  );
}
