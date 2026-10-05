'use client';
// components/snakes/Snakes3DCanvas.tsx
// Singularity 3D Cyber Mountain Snakes & Ladders Canvas
// Green & Black Singularity Theme with 60 FPS smooth useFrame waypoint movement,
// dynamic cinematic action camera following climbers in real time,
// neon cyber ladders, bioluminescent serpents, and flowing emerald data waterfall.

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Crown } from 'lucide-react';
import { AvatarModel, getBodyProps } from '@/components/avatar/AvatarModel';
import { AvatarConfig } from '@/types/avatar';
import { sound } from '@/lib/audio';

// ─── AMBIENT MOUNTAIN CYBER PARTICLES ──────────────────────────────────────
function MountainCyberParticles() {
  const points = useMemo(() => {
    const p = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = Math.random() * 14;
      p[i * 3 + 2] = (Math.random() - 0.5) * 16 - 2;
    }
    return p;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38BDF8"
        transparent
        opacity={0.45}
        sizeAttenuation
      />
    </points>
  );
}
// ─── TILE COORDINATES DEFINITION (TILES 1 TO 40) ────────────────────────────
export interface TileCoord {
  id: number; // 1 to 40
  pos: [number, number, number];
}

export const MOUNTAIN_TILES: TileCoord[] = [
  // Tier 1: Ground / Entrance (Y ~ 0.5)
  { id: 1, pos: [0.0, 0.4, 3.8] }, // Gate
  { id: 2, pos: [-1.2, 0.55, 3.4] },
  { id: 3, pos: [-2.4, 0.7, 3.0] },
  { id: 4, pos: [-3.5, 0.85, 2.4] },
  { id: 5, pos: [-2.4, 1.1, 1.8] },
  { id: 6, pos: [-1.2, 1.35, 1.5] }, // Snake 1 tail

  // Tier 2: Lower Ledge (Y ~ 1.8 to 3.0)
  { id: 7, pos: [0.2, 1.6, 1.6] },
  { id: 8, pos: [1.4, 1.85, 1.8] },
  { id: 9, pos: [2.6, 2.1, 2.2] }, // Ladder 1 start -> 17
  { id: 10, pos: [3.4, 2.35, 1.2] },
  { id: 11, pos: [2.4, 2.6, 0.4] },
  { id: 12, pos: [1.2, 2.85, 0.2] },
  { id: 13, pos: [0.0, 3.1, 0.4] },

  // Tier 3: Mid-Cliff Overlook (Y ~ 3.4 to 4.8)
  { id: 14, pos: [-1.4, 3.35, 0.6] },
  { id: 15, pos: [-2.6, 3.6, 0.8] }, // Snake 2 tail
  { id: 16, pos: [-2.0, 3.9, -0.4] },
  { id: 17, pos: [-0.8, 4.2, -0.6] }, // Ladder 1 top
  { id: 18, pos: [0.5, 4.45, -0.4] }, // Snake 1 head -> 6
  { id: 19, pos: [1.8, 4.7, -0.2] },
  { id: 20, pos: [2.8, 5.0, -0.6] }, // Snake 4 tail

  // Tier 4: Waterfall Ridge (Y ~ 5.3 to 6.8)
  { id: 21, pos: [1.8, 5.3, -1.6] }, // Ladder 2 start -> 29
  { id: 22, pos: [0.6, 5.6, -1.8] },
  { id: 23, pos: [-0.6, 5.9, -1.6] },
  { id: 24, pos: [-1.8, 6.2, -1.4] },
  { id: 25, pos: [-2.6, 6.5, -2.2] }, // Snake 3 tail
  { id: 26, pos: [-1.5, 6.8, -2.8] }, // Snake 2 head -> 15
  { id: 27, pos: [-0.2, 7.1, -2.6] }, // Ladder 3 start -> 31

  // Tier 5: High Canopy Crag (Y ~ 7.4 to 8.8)
  { id: 28, pos: [1.1, 7.4, -2.4] },
  { id: 29, pos: [2.2, 7.7, -2.8] }, // Ladder 2 top
  { id: 30, pos: [1.2, 8.0, -3.6] },
  { id: 31, pos: [0.0, 8.3, -3.8] }, // Ladder 3 top
  { id: 32, pos: [-1.2, 8.6, -3.6] },
  { id: 33, pos: [-2.2, 8.9, -4.2] }, // Snake 3 head -> 25
  { id: 34, pos: [-1.0, 9.2, -4.8] },

  // Tier 6: Summit Apex Trail (Y ~ 9.5 to 11.2)
  { id: 35, pos: [0.2, 9.5, -4.8] }, // Ladder 4 start -> 39
  { id: 36, pos: [1.4, 9.8, -4.6] },
  { id: 37, pos: [2.4, 10.1, -5.2] },
  { id: 38, pos: [1.2, 10.4, -5.8] }, // Snake 4 head -> 20
  { id: 39, pos: [0.0, 10.7, -5.8] }, // Ladder 4 top
  { id: 40, pos: [0.0, 11.1, -6.8] }, // SUMMIT TREASURE SHINE!
];

export const LADDERS: Record<number, number> = {
  9: 17,
  21: 29,
  27: 31,
  35: 39,
};

export const SNAKES: Record<number, number> = {
  18: 6,
  26: 15,
  33: 25,
  38: 20,
};

export interface ActiveSnakesMovement {
  climber: 'player' | 'computer';
  waypoints: [number, number, number][];
  speed: number;
  type: 'hop' | 'ladder' | 'snake';
  onComplete: () => void;
}

// ─── 3D CYBER HARDLIGHT ENERGY BRIDGE (LADDER REPLACER) ─────────────────────
function EnergyBridge3D({ startTile, endTile }: { startTile: number; endTile: number }) {
  const p0 = MOUNTAIN_TILES[startTile - 1].pos;
  const p1 = MOUNTAIN_TILES[endTile - 1].pos;

  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const dz = p1[2] - p0[2];
  const length = Math.hypot(dx, dy, dz);

  const midX = (p0[0] + p1[0]) / 2;
  const midY = (p0[1] + p1[1]) / 2;
  const midZ = (p0[2] + p1[2]) / 2;

  const rotZ = Math.atan2(dx, dy);
  const rotX = -Math.atan2(dz, Math.hypot(dx, dy));

  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (pulseRef.current) {
      // Energy wave surging upward along the bridge
      pulseRef.current.position.y = ((Date.now() * 0.002) % 1.0 - 0.5) * (length * 0.9);
    }
  });

  const stepCount = Math.max(5, Math.floor(length * 3.8));

  return (
    <group position={[midX, midY, midZ]} rotation={[rotX, 0, -rotZ]}>
      {/* 1. Left Cyber Magnetic Rail */}
      <mesh position={[-0.26, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, length, 8]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={1.8}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* 2. Right Cyber Magnetic Rail */}
      <mesh position={[0.26, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, length, 8]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={1.8}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* 3. Central Translucent Hardlight Plasma Runway */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.44, length * 0.96, 0.02]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0284C7"
          emissiveIntensity={1.5}
          transparent
          opacity={0.45}
          roughness={0.1}
        />
      </mesh>

      {/* 4. Discrete Holographic Energy Steps */}
      {Array.from({ length: stepCount }).map((_, i) => {
        const yOff = (i / (stepCount - 1) - 0.5) * (length * 0.92);
        return (
          <group key={i} position={[0, yOff, 0.02]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.025, 0.46, 0.02]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#38BDF8"
                emissiveIntensity={2.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* 5. Animated Energy Surge Node */}
      <mesh ref={pulseRef} position={[0, 0, 0.04]}>
        <boxGeometry args={[0.5, 0.12, 0.03]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#00FF66"
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* Energy glow point light */}
      <pointLight color="#38BDF8" intensity={2.0} distance={2.5} />
    </group>
  );
}

// ─── 3D GIANT MECHANICAL SERPENT (SNAKE REPLACER) ───────────────────────────
function MechaSerpent3D({ headTile, tailTile }: { headTile: number; tailTile: number }) {
  const pHead = MOUNTAIN_TILES[headTile - 1].pos;
  const pTail = MOUNTAIN_TILES[tailTile - 1].pos;

  const headRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (headRef.current) {
      // Menacing scanning yaw and pitch
      headRef.current.rotation.y = Math.sin(time * 1.5) * 0.35;
      headRef.current.rotation.x = Math.sin(time * 2.2) * 0.15;
    }
    if (jawRef.current) {
      // Hydraulic mandible opening and closing
      jawRef.current.rotation.x = 0.2 + Math.abs(Math.sin(time * 2)) * 0.35;
    }
    if (bodyGroupRef.current) {
      // Sinuous mechanical undulation along spine
      bodyGroupRef.current.children.forEach((child, i) => {
        child.position.x += Math.sin(time * 3 + i * 0.45) * 0.003;
      });
    }
  });

  const points = useMemo(() => {
    const mid1: [number, number, number] = [
      pHead[0] * 0.65 + pTail[0] * 0.35 + (headTile % 2 === 0 ? 0.75 : -0.75),
      pHead[1] * 0.65 + pTail[1] * 0.35 + 0.35,
      pHead[2] * 0.65 + pTail[2] * 0.35,
    ];
    const mid2: [number, number, number] = [
      pHead[0] * 0.35 + pTail[0] * 0.65 - (headTile % 2 === 0 ? 0.65 : -0.65),
      pHead[1] * 0.35 + pTail[1] * 0.65 + 0.2,
      pHead[2] * 0.35 + pTail[2] * 0.65,
    ];

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pHead[0], pHead[1] + 0.28, pHead[2]),
      new THREE.Vector3(...mid1),
      new THREE.Vector3(...mid2),
      new THREE.Vector3(pTail[0], pTail[1] + 0.16, pTail[2]),
    ]);

    return curve.getPoints(26);
  }, [pHead, pTail, headTile]);

  return (
    <group>
      {/* Sinuous Cyber Plasma Spine */}
      <group ref={bodyGroupRef}>
        {points.map((pt, i) => {
          if (i === 0) return null;
          const scale = Math.max(0.04, 0.12 * (1 - (i / points.length) * 0.5));
          const isSpineRib = i % 2 === 0;

          return (
            <group key={i} position={[pt.x, pt.y, pt.z]}>
              {/* Sleek Armored Shell */}
              <mesh castShadow>
                <boxGeometry args={[scale * 0.9, scale * 0.6, scale * 0.9]} />
                <meshStandardMaterial
                  color="#0F1713"
                  metalness={0.9}
                  roughness={0.25}
                  emissive={isSpineRib ? '#DC2626' : '#7F1D1D'}
                  emissiveIntensity={isSpineRib ? 0.7 : 0.2}
                />
              </mesh>

              {/* Glowing Red Plasma Node */}
              {isSpineRib && (
                <mesh position={[0, scale * 0.35, 0]}>
                  <sphereGeometry args={[scale * 0.25, 6, 6]} />
                  <meshStandardMaterial
                    color="#EF4444"
                    emissive="#EF4444"
                    emissiveIntensity={2.0}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* Sleek Cyber Serpent Head */}
      <group
        ref={headRef}
        position={[pHead[0], pHead[1] + 0.22, pHead[2]]}
        scale={0.20}
      >
        {/* Armored Cranium */}
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.5, 0.9]} />
          <meshStandardMaterial
            color="#080F0A"
            metalness={0.95}
            roughness={0.2}
            emissive="#EF4444"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Angular Mecha Visor Optics (Glowing Red) */}
        <mesh position={[0, 0.15, 0.48]}>
          <boxGeometry args={[0.55, 0.12, 0.06]} />
          <meshStandardMaterial
            color="#FF2222"
            emissive="#FF2222"
            emissiveIntensity={3.5}
          />
        </mesh>

        {/* Lower Mandible */}
        <mesh ref={jawRef} position={[0, -0.22, 0.25]}>
          <boxGeometry args={[0.5, 0.16, 0.6]} />
          <meshStandardMaterial
            color="#050906"
            metalness={0.9}
            roughness={0.3}
            emissive="#EF4444"
            emissiveIntensity={0.5}
          />
        </mesh>

        <pointLight color="#EF4444" intensity={2.0} distance={1.8} />
      </group>
    </group>
  );
}

// ─── 3D OBSIDIAN MOUNTAIN ENVIRONMENT ──────────────────────────────────────
function MountainEnvironment() {
  const waterfallRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (waterfallRef.current) {
      (waterfallRef.current.material as THREE.MeshStandardMaterial).opacity =
        0.75 + Math.sin(Date.now() * 0.008) * 0.12;
    }
  });

  return (
    <group>
      {/* ── 1. OBSIDIAN CLIFF WALLS (DARK CARBON FINISH) ── */}
      <mesh position={[0, 5.5, -4.5]} receiveShadow>
        <boxGeometry args={[11, 14, 6]} />
        <meshStandardMaterial color="#050B07" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[-3.2, 4.0, -1.8]} rotation={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[4.5, 12, 4]} />
        <meshStandardMaterial color="#030704" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[3.2, 4.0, -1.8]} rotation={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[4.5, 12, 4]} />
        <meshStandardMaterial color="#030704" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* ── 2. CASCADING EMERALD / CYAN DATA WATERFALL ── */}
      <mesh
        ref={waterfallRef}
        position={[-3.8, 6.2, 0.2]}
        rotation={[0.06, 0, 0]}
      >
        <planeGeometry args={[1.5, 12.5]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={1.2}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[-3.8, 0.2, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 24]} />
        <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={0.8} transparent opacity={0.6} />
      </mesh>

      {/* ── 3. CYBER MOUNTAIN BASE CAMP (PLATFORM #1) ── */}
      <group position={[0.0, 0.45, 4.4]}>
        <mesh position={[-0.65, 0.65, 0]} castShadow>
          <boxGeometry args={[0.25, 1.3, 0.25]} />
          <meshStandardMaterial color="#0A1C10" emissive="#00FF66" emissiveIntensity={0.6} metalness={0.9} />
        </mesh>
        <mesh position={[0.65, 0.65, 0]} castShadow>
          <boxGeometry args={[0.25, 1.3, 0.25]} />
          <meshStandardMaterial color="#0A1C10" emissive="#00FF66" emissiveIntensity={0.6} metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[1.55, 0.15, 0.2]} />
          <meshStandardMaterial color="#051208" emissive="#00FF66" emissiveIntensity={1.0} />
        </mesh>
        <group position={[0, 1.6, 0]}>
          <Html center distanceFactor={11}>
            <div className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-[#00FF66]/50 text-[#00FF66] font-black font-mono text-[10px] uppercase shadow-[0_0_15px_rgba(0,255,102,0.3)] select-none whitespace-nowrap flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
              <span>BASE CAMP // ELEVATION 100M</span>
            </div>
          </Html>
        </group>
      </group>

      {/* ── 4. GIANT CYBERPUNK SUMMIT (PLATFORM #40 // 5,000M APEX) ── */}
      <group position={[0.0, 11.2, -6.8]}>
        {/* Massive Cyber Dais */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[1.5, 1.8, 0.6, 24]} />
          <meshStandardMaterial color="#0A180E" emissive="#00FF66" emissiveIntensity={1.8} roughness={0.1} metalness={0.95} />
        </mesh>

        {/* Rotating Cyber Plasma Rings */}
        <group position={[0, 1.2, 0]}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[1.3, 0.04, 16, 48]} />
            <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3.0} />
          </mesh>
          <mesh rotation={[-Math.PI / 4, 0, 0]}>
            <torusGeometry args={[1.1, 0.04, 16, 48]} />
            <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={3.0} />
          </mesh>
        </group>

        {/* Floating Golden Victory Monolith */}
        <Float speed={2.5} rotationIntensity={1.4} floatIntensity={0.8}>
          <mesh position={[0, 1.2, 0]} scale={0.65}>
            <octahedronGeometry args={[1.0, 0]} />
            <meshStandardMaterial
              color="#FBBF24"
              emissive="#F59E0B"
              emissiveIntensity={3.0}
              roughness={0.05}
              metalness={0.98}
            />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color="#FBBF24" intensity={6} distance={6} />
        </Float>

        {/* Summit Skyward Energy Beam */}
        <mesh position={[0, 4.0, 0]}>
          <cylinderGeometry args={[0.08, 0.18, 6.0, 16]} />
          <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={4.0} transparent opacity={0.6} />
        </mesh>

        {/* Floating Summit Crown Badge */}
        <group position={[0, 2.4, 0]}>
          <Html center distanceFactor={12}>
            <div className="px-4 py-1.5 rounded-full bg-amber-400 text-black font-black font-mono text-xs uppercase shadow-[0_0_30px_#F59E0B] border-2 border-white select-none whitespace-nowrap animate-bounce flex items-center gap-1.5">
              <Crown size={14} className="inline text-black fill-current" />
              <span>CYBER SUMMIT APEX // 5,000M</span>
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

// ─── 3D STEPPED PLATFORMS (TILES 1 TO 40) ───────────────────────────────────
function SteppedPlatforms3D() {
  return (
    <group>
      {MOUNTAIN_TILES.map((t) => {
        const isLadderStart = !!LADDERS[t.id];
        const isSnakeHead = !!SNAKES[t.id];

        const tileColor =
          t.id === 1
            ? '#00FF66'
            : t.id === 40
            ? '#FBBF24'
            : isLadderStart
            ? '#38BDF8'
            : isSnakeHead
            ? '#EF4444'
            : '#051A0C';

        const emissiveColor =
          t.id === 1
            ? '#00FF66'
            : t.id === 40
            ? '#FBBF24'
            : isLadderStart
            ? '#38BDF8'
            : isSnakeHead
            ? '#EF4444'
            : '#00FF66';

        return (
          <group key={`tile-${t.id}`} position={t.pos}>
            {/* Obsidian Base Block */}
            <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.15, 0.38, 1.15]} />
              <meshStandardMaterial color="#0A110D" roughness={0.4} metalness={0.8} />
            </mesh>

            {/* Stepped Neon Edge Plate */}
            <mesh position={[0, 0.02, 0]} receiveShadow>
              <boxGeometry args={[1.08, 0.12, 1.08]} />
              <meshStandardMaterial
                color={tileColor}
                emissive={emissiveColor}
                emissiveIntensity={isLadderStart || isSnakeHead || t.id === 1 || t.id === 40 ? 0.8 : 0.25}
                roughness={0.3}
              />
            </mesh>

            {/* Number on platform */}
            <group position={[0, 0.12, 0]}>
              <Html center distanceFactor={14}>
                <div
                  className={`font-black font-mono text-[11px] select-none pointer-events-none drop-shadow ${
                    t.id === 1 || t.id === 40 || isLadderStart || isSnakeHead
                      ? 'text-white'
                      : 'text-[#00FF66]'
                  }`}
                >
                  {t.id}
                </div>
              </Html>
            </group>

            {/* Flush Holographic Rune on Platform Surface (Zero Screen Occlusion) */}
            {isLadderStart && (
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.38, 0.46, 24]} />
                <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={3} />
              </mesh>
            )}

            {isSnakeHead && (
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.38, 0.46, 24]} />
                <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={3} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Render 3D Energy Bridges */}
      {Object.entries(LADDERS).map(([start, end]) => (
        <EnergyBridge3D key={`bridge-${start}`} startTile={Number(start)} endTile={Number(end)} />
      ))}

      {/* Render 3D Mecha Serpents */}
      {Object.entries(SNAKES).map(([head, tail]) => (
        <MechaSerpent3D key={`serpent-${head}`} headTile={Number(head)} tailTile={Number(tail)} />
      ))}
    </group>
  );
}

// ─── 3D CLIMBER AVATAR (BUTTER-SMOOTH 60 FPS MOTION) ────────────────────────
interface ClimberPiece3DProps {
  id: 'player' | 'computer';
  name: string;
  avatar: AvatarConfig;
  currentTile: number;
  colorHex: string;
  isCurrentTurn: boolean;
  action: 'idle' | 'attack' | 'hit' | 'defend' | 'victory';
  activeMovement: ActiveSnakesMovement | null;
  climberPosRef: React.MutableRefObject<THREE.Vector3>;
  offsetPos?: [number, number];
}

function ClimberPiece3D({
  id,
  name,
  avatar,
  currentTile,
  colorHex,
  isCurrentTurn,
  action,
  activeMovement,
  climberPosRef,
  offsetPos = [0, 0],
}: ClimberPiece3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const curPos = useRef(new THREE.Vector3(0, 0, 0));

  const isMoving = activeMovement && activeMovement.climber === id;
  const animTimeRef = useRef(0);
  const lastStepIdxRef = useRef(-1);

  const targetTileCoord = MOUNTAIN_TILES[Math.min(39, Math.max(0, currentTile - 1))];
  const staticTargetPos: [number, number, number] = [
    targetTileCoord.pos[0] + offsetPos[0],
    targetTileCoord.pos[1] + 0.12,
    targetTileCoord.pos[2] + offsetPos[1],
  ];

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isMoving && activeMovement.waypoints.length > 1) {
      const waypoints = activeMovement.waypoints;
      const isLadderOrSnake = activeMovement.type !== 'hop';
      const stepDuration = isLadderOrSnake
        ? Math.max(0.28, 0.75 / activeMovement.speed)
        : Math.max(0.14, 0.32 / activeMovement.speed);

      animTimeRef.current += delta;
      const totalSegments = waypoints.length - 1;
      const currentSegment = Math.min(
        totalSegments - 1,
        Math.floor(animTimeRef.current / stepDuration)
      );
      const segmentProgress = Math.min(
        1.0,
        (animTimeRef.current % stepDuration) / stepDuration
      );

      if (currentSegment !== lastStepIdxRef.current) {
        lastStepIdxRef.current = currentSegment;
        if (!isLadderOrSnake) {
          sound.playTokenStep(currentSegment);
        }
      }

      const p0 = waypoints[currentSegment];
      const p1 = waypoints[currentSegment + 1];

      const t = segmentProgress;
      const smoothT = t * t * (3 - 2 * t);

      const curX = THREE.MathUtils.lerp(p0[0], p1[0], smoothT);
      const curZ = THREE.MathUtils.lerp(p0[2], p1[2], smoothT);

      // Arc height: hops have parabolic arc, ladders/snakes slide smoothly
      const hop = isLadderOrSnake ? 0.05 : Math.sin(t * Math.PI) * 0.45;
      const curY = THREE.MathUtils.lerp(p0[1], p1[1], smoothT) + hop;

      curPos.current.set(curX, curY, curZ);

      // Face direction of climb
      const dx = p1[0] - p0[0];
      const dz = p1[2] - p0[2];
      if (Math.hypot(dx, dz) > 0.05) {
        const targetRotY = Math.atan2(dx, dz);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotY,
          delta * 12
        );
      }

      // Real-time tracking of active climber position with ZERO React re-renders!
      if (isCurrentTurn) {
        climberPosRef.current.copy(curPos.current);
      }

      if (animTimeRef.current >= totalSegments * stepDuration) {
        animTimeRef.current = 0;
        lastStepIdxRef.current = -1;
        activeMovement.onComplete();
      }
    } else {
      curPos.current.x = THREE.MathUtils.lerp(curPos.current.x, staticTargetPos[0], delta * 12);
      curPos.current.y = THREE.MathUtils.lerp(curPos.current.y, staticTargetPos[1], delta * 12);
      curPos.current.z = THREE.MathUtils.lerp(curPos.current.z, staticTargetPos[2], delta * 12);

      if (isCurrentTurn) {
        climberPosRef.current.copy(curPos.current);
      }
    }

    groupRef.current.position.copy(curPos.current);
  });

  return (
    <group ref={groupRef} position={staticTargetPos}>
      {/* High-visibility Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, 20]} />
        <meshStandardMaterial
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={isCurrentTurn ? 2.5 : 0.5}
        />
      </mesh>

      {/* Floating Name Badge */}
      <group position={[0, 1.35, 0]}>
        <Html center distanceFactor={12}>
          <div
            className="px-2.5 py-0.5 rounded-full text-black font-black font-mono text-[10px] uppercase shadow-lg border border-white whitespace-nowrap select-none"
            style={{ backgroundColor: colorHex }}
          >
            {name}
          </div>
        </Html>
      </group>

      {/* Procedural 3D Avatar Model positioned accurately on mountain platform */}
      {(() => {
        const bp = getBodyProps(avatar);
        const standingOffsetY = (0.36 * bp.torsoHScale + 0.58 * bp.legScale) * bp.totalScale * 0.52;
        return (
          <group position={[0, standingOffsetY, 0]} scale={0.52}>
            <AvatarModel config={avatar} action={action} animate={true} />
          </group>
        );
      })()}
    </group>
  );
}

// ─── 3D DIE FOR MOUNTAIN ASCENT ────────────────────────────────────────────
function MountainDice3D({
  diceRoll,
  isRolling,
  canRoll,
  onRoll,
}: {
  diceRoll: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
}) {
  const diceRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const faceRotations: Record<number, [number, number, number]> = {
    1: [0, 0, 0],
    2: [Math.PI, 0, 0],
    3: [0, 0, -Math.PI / 2],
    4: [0, 0, Math.PI / 2],
    5: [-Math.PI / 2, 0, 0],
    6: [Math.PI / 2, 0, 0],
  };

  useFrame((_, delta) => {
    if (!diceRef.current) return;

    if (isRolling) {
      diceRef.current.rotation.x += delta * 18;
      diceRef.current.rotation.y += delta * 24;
      diceRef.current.rotation.z += delta * 16;
      diceRef.current.position.y = 1.6 + Math.abs(Math.sin(Date.now() * 0.015)) * 0.8;
    } else {
      const targetFace = diceRoll || 6;
      const targetRot = faceRotations[targetFace] || [0, 0, 0];

      diceRef.current.rotation.x = THREE.MathUtils.lerp(diceRef.current.rotation.x, targetRot[0], delta * 8);
      diceRef.current.rotation.y = THREE.MathUtils.lerp(diceRef.current.rotation.y, targetRot[1], delta * 8);
      diceRef.current.rotation.z = THREE.MathUtils.lerp(diceRef.current.rotation.z, targetRot[2], delta * 8);

      const targetY = 1.1 + Math.sin(Date.now() * 0.003) * 0.06;
      diceRef.current.position.y = THREE.MathUtils.lerp(diceRef.current.position.y, targetY, delta * 6);
    }
  });

  return (
    <group position={[3.2, 0.4, 3.2]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.5, 16]} />
        <meshStandardMaterial color="#0A110D" roughness={0.4} metalness={0.8} />
      </mesh>

      <group
        ref={diceRef}
        position={[0, 1.1, 0]}
        scale={hovered && canRoll && !isRolling ? 1.2 : 1.0}
        onClick={(e) => {
          e.stopPropagation();
          if (canRoll && !isRolling) onRoll();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.82, 0.82]} />
          <meshStandardMaterial color="#050C07" roughness={0.2} metalness={0.9} emissive="#00FF66" emissiveIntensity={0.3} />
        </mesh>

        <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 16]} />
          <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3} />
        </mesh>

        {canRoll && !isRolling && (
          <group position={[0, 0.85, 0]}>
            <Html center distanceFactor={12}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onRoll();
                }}
                className="px-3 py-1 rounded-full bg-[#00FF66] text-black font-black font-mono text-[11px] uppercase shadow-[0_0_12px_#00FF66] border border-white cursor-pointer hover:scale-110 active:scale-95 transition-all select-none whitespace-nowrap animate-bounce tracking-wider"
              >
                ROLL QUANTUM DIE
              </div>
            </Html>
          </group>
        )}
      </group>
    </group>
  );
}

// ─── DYNAMIC ACTION CAMERA CONTROLLER (REAL-TIME CLIMBER TRACKING) ──────────
function MountainCameraController({
  climberPosRef,
  cameraMode,
}: {
  climberPosRef: React.MutableRefObject<THREE.Vector3>;
  cameraMode: 'action' | 'summit' | 'overview';
}) {
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    let targetX = 0;
    let targetY = 12.0;
    let targetZ = 13.5;
    let lookX = 0;
    let lookY = 5.5;
    let lookZ = -1.5;

    if (cameraMode === 'action') {
      const climber = climberPosRef.current;
      // High-angle clear tactical follow: never occluded by platforms or terrain
      targetX = climber.x * 0.5 + 2.2;
      targetY = climber.y + 4.5; // Elevated high angle looking down at platforms
      targetZ = climber.z + 6.8; // Safe distance with zero tile clipping
      lookX = climber.x;
      lookY = climber.y + 0.4;
      lookZ = climber.z;
    } else if (cameraMode === 'summit') {
      targetX = 0;
      targetY = 15.0;
      targetZ = -1.0;
      lookX = 0;
      lookY = 11.0;
      lookZ = -6.8;
    } else {
      // Full Mountain Overview (Elevated isometric view)
      targetX = 3.5;
      targetY = 15.5;
      targetZ = 16.5;
      lookX = 0;
      lookY = 5.5;
      lookZ = -1.5;
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 3.8);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 3.8);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 3.8);

    if (controlsRef.current) {
      controlsRef.current.target.x = THREE.MathUtils.lerp(controlsRef.current.target.x, lookX, delta * 4.5);
      controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, lookY, delta * 4.5);
      controlsRef.current.target.z = THREE.MathUtils.lerp(controlsRef.current.target.z, lookZ, delta * 4.5);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={3}
      maxDistance={35}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}

// ─── MAIN EXPORTED COMPONENT ────────────────────────────────────────────────
export interface Snakes3DCanvasProps {
  playerAvatar: AvatarConfig;
  computerAvatar: AvatarConfig;
  playerTile: number;
  computerTile: number;
  currentTurn: 'player' | 'computer';
  diceRoll: number | null;
  isRolling: boolean;
  canRoll: boolean;
  winner: 'player' | 'computer' | null;
  cameraMode: 'action' | 'summit' | 'overview';
  activeMovement: ActiveSnakesMovement | null;
  onRollDice: () => void;
}

export function Snakes3DCanvas({
  playerAvatar,
  computerAvatar,
  playerTile,
  computerTile,
  currentTurn,
  diceRoll,
  isRolling,
  canRoll,
  winner,
  cameraMode = 'action',
  activeMovement,
  onRollDice,
}: Snakes3DCanvasProps) {
  const activeClimberPos = useRef<THREE.Vector3>(
    new THREE.Vector3(MOUNTAIN_TILES[0].pos[0], MOUNTAIN_TILES[0].pos[1] + 0.12, MOUNTAIN_TILES[0].pos[2])
  );


  return (
    <div className="w-full h-full rounded-none overflow-hidden bg-[#020502]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020502']} />
        <fog attach="fog" args={['#020502', 20, 65]} />

        {/* Dynamic Lighting */}
        <ambientLight intensity={1.4} />
        <directionalLight
          position={[12, 22, 10]}
          intensity={2.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[0, 8, 0]} intensity={3.0} color="#00FF66" distance={20} />

        {/* ─── REAL-TIME DYNAMIC ACTION FOLLOW CAMERA ─── */}
        <MountainCameraController
          climberPosRef={activeClimberPos}
          cameraMode={cameraMode}
        />

        {/* ─── AMBIENT MOUNTAIN PARTICLES ─── */}
        <MountainCyberParticles />

        {/* ─── OBSIDIAN MOUNTAIN ENVIRONMENT ─── */}
        <MountainEnvironment />

        {/* ─── 40 STEPPED PLATFORMS, BRIDGES & SERPENTS ─── */}
        <SteppedPlatforms3D />

        {/* Player Avatar */}
        <ClimberPiece3D
          id="player"
          name="You"
          avatar={playerAvatar}
          currentTile={playerTile}
          colorHex="#00FF66"
          isCurrentTurn={currentTurn === 'player'}
          action={winner === 'player' ? 'victory' : winner === 'computer' ? 'hit' : 'idle'}
          activeMovement={activeMovement}
          climberPosRef={activeClimberPos}
          offsetPos={[-0.22, 0]}
        />

        {/* Computer Rival Avatar */}
        <ClimberPiece3D
          id="computer"
          name="Rival AI"
          avatar={computerAvatar}
          currentTile={computerTile}
          colorHex="#EF4444"
          isCurrentTurn={currentTurn === 'computer'}
          action={winner === 'computer' ? 'victory' : winner === 'player' ? 'hit' : 'idle'}
          activeMovement={activeMovement}
          climberPosRef={activeClimberPos}
          offsetPos={[0.22, 0]}
        />

        {/* 3D Dice */}
        <MountainDice3D
          diceRoll={diceRoll}
          isRolling={isRolling}
          canRoll={canRoll && currentTurn === 'player' && !winner && !activeMovement}
          onRoll={onRollDice}
        />

        {/* Base Camp Contact Shadows */}
        <ContactShadows
          position={[0, 0.42, 4.0]}
          opacity={0.8}
          scale={10}
          blur={1.6}
          far={2.5}
        />

        {/* ─── POST-PROCESSING: BLOOM FOR BRIDGES & APEX MONOLITH ─── */}
        <EffectComposer>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.8}
            radius={0.75}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
