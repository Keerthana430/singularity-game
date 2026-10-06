'use client';
// components/ludo/Ludo3DColosseum.tsx
// High-Octane Green & Black Singularity Ludo Colosseum
// Butter-smooth 60+ FPS waypoint hopping animation (inside useFrame, 0 React re-renders),
// sleek obsidian and emerald neon matrix theme, dynamic combat clashes,
// high-visibility stepping tiles, and interactive 3D dice.

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AvatarModel, getBodyProps } from '@/components/avatar/AvatarModel';
import {
  CriticalHitImpactScene,
  HumanIronBastion,
  ElfWindBarrier,
  FairyPetalShield,
  DwarfStoneFortress,
} from '@/components/arena/Attack3DEffects';
import { sound } from '@/lib/audio';
import {
  PlayerColor,
  LudoPiece,
  LudoPlayer,
  TRACK_COORDS,
  START_TRACK_INDEX,
  HOME_COLUMNS,
  GOAL_COORD,
  YARD_PODS,
  SAFE_TRACK_INDICES,
  CYBER_POWERUPS,
} from '@/app/ludo/page';

// ─── 3D MATH & CONSTANTS ───────────────────────────────────────────────────
export const GRID_SCALE = 1.08;
export const PLATFORM_Y = 0.28;

export function gridToWorld(row: number, col: number, elevation = PLATFORM_Y): [number, number, number] {
  const x = (col - 7) * GRID_SCALE;
  const z = (row - 7) * GRID_SCALE;
  return [x, elevation, z];
}

// ─── COMBAT & ENCOUNTER TYPES ──────────────────────────────────────────────
export interface CombatClash {
  id: string;
  attackerColor: PlayerColor;
  attackerPieceId: number;
  defenderColor: PlayerColor;
  defenderPieceId: number;
  position: [number, number, number];
  outcome: 'capture' | 'shield_defend' | 'counter';
  stage: 'charge' | 'clash' | 'resolve';
}

export interface FloatingText3D {
  id: number;
  text: string;
  position: [number, number, number];
  color: string;
}

export type CameraPreset = 'isometric' | 'topdown' | 'action';

export interface ActiveMovement {
  color: PlayerColor;
  pieceId: number;
  waypoints: [number, number, number][];
  speed: number;
  onComplete: () => void;
}

// ─── LOCAL COMBAT VFX ───────────────────────────────────────────────────────
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

function HitSparks({ position, color = '#00FF66' }: { position: [number, number, number]; color?: string }) {
  const meshGroupRef = useRef<THREE.Group>(null);
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
    if (meshGroupRef.current) {
      meshGroupRef.current.children.forEach((child, i) => {
        const s = sparks[i];
        if (s) {
          child.position.addScaledVector(s.dir, s.speed * delta);
          (child as THREE.Mesh).scale.multiplyScalar(0.92);
        }
      });
    }
  });

  return (
    <group position={position}>
      <pointLight color={color} intensity={6} distance={4} />
      <group ref={meshGroupRef}>
        {sparks.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── 3D POWER-UP ICONS ─────────────────────────────────────────────────────
function PowerUp3D({
  type,
  position,
  label,
}: {
  type: 'boost' | 'shield' | 'warp';
  position: [number, number, number];
  label: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 2.2;
      groupRef.current.position.y = position[1] + 0.38 + Math.sin(Date.now() * 0.005) * 0.06;
    }
  });

  const color = type === 'boost' ? '#00FF66' : type === 'shield' ? '#38BDF8' : '#C084FC';

  return (
    <group ref={groupRef} position={[position[0], position[1] + 0.38, position[2]]}>
      {type === 'boost' && (
        <group scale={0.28}>
          <mesh rotation={[0, 0, 0.3]}>
            <octahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} roughness={0.1} />
          </mesh>
        </group>
      )}

      {type === 'shield' && (
        <group scale={0.28}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.7, 0.4, 0.2, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} wireframe />
          </mesh>
        </group>
      )}

      {type === 'warp' && (
        <group scale={0.26}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.7, 0.18, 16, 32]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
          </mesh>
        </group>
      )}

      <pointLight color={color} intensity={2.0} distance={2.0} />
      <group position={[0, 0.42, 0]}>
        <Html center distanceFactor={14}>
          <div className="text-[9px] font-mono font-black text-black bg-[#00FF66] px-1.5 py-0.5 rounded shadow-[0_0_10px_#00FF66] select-none whitespace-nowrap pointer-events-none">
            {label}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── 3D DIE (GREEN & BLACK CYBER DIE) ──────────────────────────────────────
function QuantumDice3D({
  diceRoll,
  isRolling,
  canRoll,
  colorHex,
  onRoll,
}: {
  diceRoll: number | null;
  isRolling: boolean;
  canRoll: boolean;
  colorHex: string;
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
      diceRef.current.position.y = 1.8 + Math.abs(Math.sin(Date.now() * 0.015)) * 0.8;
    } else {
      const targetFace = diceRoll || 6;
      const targetRot = faceRotations[targetFace] || [0, 0, 0];

      diceRef.current.rotation.x = THREE.MathUtils.lerp(diceRef.current.rotation.x, targetRot[0], delta * 10);
      diceRef.current.rotation.y = THREE.MathUtils.lerp(diceRef.current.rotation.y, targetRot[1], delta * 10);
      diceRef.current.rotation.z = THREE.MathUtils.lerp(diceRef.current.rotation.z, targetRot[2], delta * 10);

      const targetY = 1.3 + Math.sin(Date.now() * 0.003) * 0.06;
      diceRef.current.position.y = THREE.MathUtils.lerp(diceRef.current.position.y, targetY, delta * 6);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <group
        ref={diceRef}
        position={[0, 1.3, 0]}
        scale={hovered && canRoll && !isRolling ? 1.2 : 1.05}
        onClick={(e) => {
          e.stopPropagation();
          if (canRoll && !isRolling) onRoll();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Sleek Cyber Obsidian Cube Core */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.92, 0.92, 0.92]} />
          <meshStandardMaterial
            color="#080E1C"
            roughness={0.2}
            metalness={0.85}
            emissive={colorHex}
            emissiveIntensity={isRolling ? 0.9 : 0.15}
          />
        </mesh>

        {/* Outer Radiant Holographic Wireframe Cage */}
        <mesh scale={1.03}>
          <boxGeometry args={[0.92, 0.92, 0.92]} />
          <meshStandardMaterial
            color={colorHex}
            wireframe
            transparent
            opacity={0.65}
            emissive={colorHex}
            emissiveIntensity={isRolling ? 2.5 : 1.0}
          />
        </mesh>

        {/* Inner Glowing Quantum Energy Singularity Core */}
        <mesh scale={0.32}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshBasicMaterial color={colorHex} wireframe />
        </mesh>

        {/* Tactile Holographic Pips on faces (Brilliant Emissive Glow) */}
        {/* Top (1) */}
        <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 16]} />
          <meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.5} />
        </mesh>
        {/* Bottom (2) */}
        <group position={[0, -0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[-0.2, -0.2, 0]}><circleGeometry args={[0.11, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
          <mesh position={[0.2, 0.2, 0]}><circleGeometry args={[0.11, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
        </group>
        {/* Right (3) */}
        <group position={[0.47, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[-0.22, -0.22, 0]}><circleGeometry args={[0.1, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
          <mesh position={[0, 0, 0]}><circleGeometry args={[0.1, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
          <mesh position={[0.22, 0.22, 0]}><circleGeometry args={[0.1, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
        </group>
        {/* Left (4) */}
        <group position={[-0.47, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {[-0.22, 0.22].map((x) =>
            [-0.22, 0.22].map((y) => (
              <mesh key={`l-${x}-${y}`} position={[x, y, 0]}><circleGeometry args={[0.09, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
            ))
          )}
        </group>
        {/* Front (5) */}
        <group position={[0, 0, 0.47]}>
          {[-0.22, 0.22].map((x) =>
            [-0.22, 0.22].map((y) => (
              <mesh key={`f-${x}-${y}`} position={[x, y, 0]}><circleGeometry args={[0.09, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
            ))
          )}
          <mesh position={[0, 0, 0]}><circleGeometry args={[0.09, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
        </group>
        {/* Back (6) */}
        <group position={[0, 0, -0.47]} rotation={[0, Math.PI, 0]}>
          {[-0.22, 0.22].map((x) =>
            [-0.25, 0, 0.25].map((y) => (
              <mesh key={`b-${x}-${y}`} position={[x, y, 0]}><circleGeometry args={[0.08, 16]} /><meshStandardMaterial color="#FFFFFF" emissive={colorHex} emissiveIntensity={3.0} /></mesh>
            ))
          )}
        </group>

        {canRoll && !isRolling && (
          <group position={[0, 0.88, 0]}>
            <Html center distanceFactor={14}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onRoll();
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#00FF66] text-[#101426] font-bold font-mono text-xs uppercase shadow-[0_4px_16px_rgba(0,255,102,0.4)] cursor-pointer hover:scale-110 active:scale-95 transition-all select-none whitespace-nowrap animate-bounce border border-white/60 tracking-wider"
              >
                ROLL QUANTUM DIE
              </div>
            </Html>
          </group>
        )}
      </group>

      <pointLight position={[0, 1.3, 0]} color="#FFC700" intensity={2.5} distance={4} />
    </group>
  );
}

// ─── BUTTER-SMOOTH 60 FPS AVATAR MOVER (ANIMATES IN USEFRAME) ──────────────
interface AvatarPiece3DProps {
  piece: LudoPiece;
  player: LudoPlayer;
  isCurrentPlayer: boolean;
  isSelectable: boolean;
  onSelect: (pieceId: number) => void;
  activeClash: CombatClash | null;
  winner: LudoPlayer | null;
  activeMovement: ActiveMovement | null;
}

function AvatarPiece3D({
  piece,
  player,
  isCurrentPlayer,
  isSelectable,
  onSelect,
  activeClash,
  winner,
  activeMovement,
}: AvatarPiece3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const curPos = useRef(new THREE.Vector3(0, 0, 0));
  const [hovered, setHovered] = useState(false);

  // Is this piece currently the one executing the active movement?
  const isMoving =
    activeMovement &&
    activeMovement.color === player.id &&
    activeMovement.pieceId === piece.id;

  // Waypoint animation timer stored in ref for pure 60fps execution with 0 React renders
  const animTimeRef = useRef(0);
  const lastHopIdxRef = useRef(-1);

  // Compute stationary target world coordinate
  const staticTargetPos = useMemo<[number, number, number]>(() => {
    if (piece.step === -1) {
      const pod = YARD_PODS[player.id][piece.id] || [2, 2];
      return gridToWorld(pod[0], pod[1], PLATFORM_Y + 0.1);
    }
    if (piece.step >= 57) {
      const offsets: Record<PlayerColor, [number, number]> = {
        red: [-0.65, -0.65],
        green: [0.65, -0.65],
        yellow: [0.65, 0.65],
        blue: [-0.65, 0.65],
      };
      const off = offsets[player.id];
      const slotOff = (piece.id - 1.5) * 0.32;
      return [off[0] + slotOff, PLATFORM_Y + 0.45, off[1] + slotOff];
    }
    if (piece.step >= 52) {
      const colIdx = piece.step - 52;
      const [r, c] = HOME_COLUMNS[player.id][colIdx] || GOAL_COORD;
      return gridToWorld(r, c, PLATFORM_Y + 0.08);
    }
    const trackIdx = (START_TRACK_INDEX[player.id] + piece.step) % 52;
    const [r, c] = TRACK_COORDS[trackIdx];
    return gridToWorld(r, c, PLATFORM_Y + 0.08);
  }, [piece.step, piece.id, player.id]);

  // Determine active action
  const isAttackerInClash =
    activeClash &&
    activeClash.attackerColor === player.id &&
    activeClash.attackerPieceId === piece.id;

  const isDefenderInClash =
    activeClash &&
    activeClash.defenderColor === player.id &&
    activeClash.defenderPieceId === piece.id;

  let currentAction: 'idle' | 'attack' | 'hit' | 'defend' | 'victory' = 'idle';

  if (winner) {
    currentAction = winner.id === player.id ? 'victory' : 'hit';
  } else if (isAttackerInClash) {
    currentAction = activeClash.stage === 'clash' ? 'attack' : 'victory';
  } else if (isDefenderInClash) {
    currentAction = activeClash.outcome === 'shield_defend' ? 'defend' : 'hit';
  } else if (piece.step === 57) {
    currentAction = 'victory';
  }

  // Pure 60/120 FPS Animation Loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isMoving && activeMovement.waypoints.length > 1) {
      const waypoints = activeMovement.waypoints;
      const hopDuration = Math.max(0.12, 0.32 / activeMovement.speed); // 320ms per hop on 1x, faster on 2x
      animTimeRef.current += delta;

      const totalSegments = waypoints.length - 1;
      const currentSegment = Math.min(
        totalSegments - 1,
        Math.floor(animTimeRef.current / hopDuration)
      );
      const segmentProgress = Math.min(
        1.0,
        (animTimeRef.current % hopDuration) / hopDuration
      );

      // Play melodic hop sound once per step
      if (currentSegment !== lastHopIdxRef.current) {
        lastHopIdxRef.current = currentSegment;
        sound.playTokenStep(currentSegment);
      }

      const p0 = waypoints[currentSegment];
      const p1 = waypoints[currentSegment + 1];

      // Smoothstep interpolation
      const t = segmentProgress;
      const smoothT = t * t * (3 - 2 * t);

      const curX = THREE.MathUtils.lerp(p0[0], p1[0], smoothT);
      const curZ = THREE.MathUtils.lerp(p0[2], p1[2], smoothT);

      // Parabolic jump arc
      const hopHeight = 0.5;
      const arc = Math.sin(t * Math.PI) * hopHeight;
      const curY = THREE.MathUtils.lerp(p0[1], p1[1], smoothT) + arc;

      curPos.current.set(curX, curY, curZ);

      // Rotate to face travel direction
      const dx = p1[0] - p0[0];
      const dz = p1[2] - p0[2];
      if (Math.hypot(dx, dz) > 0.05) {
        const targetRotY = Math.atan2(dx, dz);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotY,
          delta * 14
        );
      }

      // Check if finished entire waypoint trajectory
      if (animTimeRef.current >= totalSegments * hopDuration) {
        animTimeRef.current = 0;
        lastHopIdxRef.current = -1;
        activeMovement.onComplete();
      }
    } else {
      // Stationary smoothly damped interpolation
      curPos.current.x = THREE.MathUtils.lerp(curPos.current.x, staticTargetPos[0], delta * 12);
      curPos.current.y = THREE.MathUtils.lerp(curPos.current.y, staticTargetPos[1], delta * 12);
      curPos.current.z = THREE.MathUtils.lerp(curPos.current.z, staticTargetPos[2], delta * 12);

      if (!isAttackerInClash && !isDefenderInClash) {
        const targetRotY = Math.atan2(-curPos.current.x, -curPos.current.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotY,
          delta * 4
        );
      }
    }

    groupRef.current.position.copy(curPos.current);
  });

  const avatarScale = 0.78;

  return (
    <group
      ref={groupRef}
      position={staticTargetPos}
      onPointerOver={(e) => {
        if (isSelectable) {
          e.stopPropagation();
          setHovered(true);
        }
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        if (isSelectable) {
          e.stopPropagation();
          onSelect(piece.id);
        }
      }}
    >
      {/* High-visibility Double Cyber Base Pedestal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.38, 0.44, 0.05, 32]} />
        <meshStandardMaterial
          color="#060913"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.32, 0.44, 32]} />
        <meshStandardMaterial
          color={isSelectable ? '#00FF66' : player.colorHex}
          emissive={isSelectable ? '#00FF66' : player.colorHex}
          emissiveIntensity={isSelectable ? (hovered ? 4.0 : 2.5) : 1.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Selectable Vertical Energy Column / Beacon */}
      {isSelectable && !isMoving && (
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.35, 0.45, 1.4, 24, 1, true]} />
          <meshBasicMaterial
            color="#00FF66"
            transparent
            opacity={hovered ? 0.35 : 0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* High-visibility "TAP TO MOVE" indicator */}
      {isSelectable && !isMoving && (
        <group position={[0, 1.85, 0]}>
          <Html center distanceFactor={14}>
            <div
              onClick={() => onSelect(piece.id)}
              className="px-2.5 py-0.5 rounded-full bg-[#00FF66] text-black font-black font-mono text-[10px] uppercase shadow-[0_0_15px_#00FF66] border border-white animate-bounce cursor-pointer whitespace-nowrap hover:scale-125 transition-all select-none"
            >
              ▲ MOVE #{piece.id + 1}
            </div>
          </Html>
        </group>
      )}

      {/* Translucent Quantum Shield */}
      {piece.hasShield && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.62, 20, 20]} />
          <meshStandardMaterial color="#38BDF8" transparent opacity={0.4} wireframe />
        </mesh>
      )}

      {/* Team active turn spotlight */}
      {isCurrentPlayer && piece.step >= 0 && piece.step < 57 && (
        <pointLight color={player.colorHex} intensity={1.5} distance={1.4} />
      )}

      {/* 3D Procedural Avatar Model positioned accurately on the board tile */}
      {(() => {
        const bp = getBodyProps(player.avatar);
        const standingOffsetY = (0.36 * bp.torsoHScale + 0.58 * bp.legScale) * bp.totalScale * avatarScale;
        return (
          <group
            position={[0, standingOffsetY, 0]}
            scale={isSelectable && hovered ? avatarScale * 1.12 : avatarScale}
          >
            <AvatarModel config={player.avatar} action={currentAction} animate={true} />
          </group>
        );
      })()}
    </group>
  );
}

// ─── 3D CYBERNETIC CENTRAL SINGULARITY NEXUS GOAL ─────────────────────────
function CentralNexusCore3D() {
  const gyroRing1Ref = useRef<THREE.Mesh>(null);
  const gyroRing2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.x += delta * 1.2;
      gyroRing1Ref.current.rotation.z += delta * 0.8;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.y += delta * 1.5;
      gyroRing2Ref.current.rotation.x -= delta * 0.9;
    }
  });

  return (
    <group position={[0, PLATFORM_Y + 0.04, 0]}>
      {/* Tier 1 Stepped Obsidian Dais */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.18, 32]} />
        <meshStandardMaterial color="#0A0F1D" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Outer Neon Conduit Ring */}
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.1, 2.25, 32]} />
        <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={2.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Tier 2 Polished Metallic Dais */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.14, 32]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.9} emissive="#00FF66" emissiveIntensity={0.2} />
      </mesh>

      {/* Counter-Rotating Gyroscopic Quantum Rings */}
      <mesh ref={gyroRing1Ref} position={[0, 0.85, 0]}>
        <torusGeometry args={[1.4, 0.045, 16, 48]} />
        <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={gyroRing2Ref} position={[0, 0.85, 0]}>
        <torusGeometry args={[1.15, 0.04, 16, 48]} />
        <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={2.5} />
      </mesh>

      {/* Ascending Vertical Singularity Ion Beam */}
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.22, 0.45, 5.5, 24, 1, true]} />
        <meshBasicMaterial color="#00FF66" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Apex Floating Golden Singularity Crystal */}
      <Float speed={3.0} rotationIntensity={1.8} floatIntensity={0.8}>
        <mesh position={[0, 0.85, 0]} scale={0.52}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={3.0}
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
        <pointLight position={[0, 0.85, 0]} color="#FFD700" intensity={4} distance={6} />
      </Float>
    </group>
  );
}

// ─── 3D FACTION BASTION (ELEVATED DOCKING PLATFORM & LAUNCHPADS) ───────────
function FactionBastion3D({
  faction,
  position,
  colorHex,
  emissiveHex,
  pods,
}: {
  faction: PlayerColor;
  position: [number, number, number];
  colorHex: string;
  emissiveHex: string;
  pods: [number, number][];
}) {
  const coreHoloRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreHoloRef.current) {
      coreHoloRef.current.rotation.y += delta * 1.4;
      coreHoloRef.current.position.y = 0.65 + Math.sin(Date.now() * 0.003) * 0.08;
    }
  });

  return (
    <group position={position}>
      {/* Main Elevated Bastion Deck */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[5.2, 0.24, 5.2]} />
        <meshStandardMaterial color="#0A0F1E" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Top Deck Surface with Faction Energy Hue */}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.9, 4.9]} />
        <meshStandardMaterial
          color="#040812"
          emissive={emissiveHex}
          emissiveIntensity={0.32}
          roughness={0.5}
        />
      </mesh>

      {/* Outer Border Glowing Trim */}
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.35, 2.45, 4]} />
        <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={1.8} side={THREE.DoubleSide} />
      </mesh>

      {/* 4 Corner Pylon Beacons */}
      {[
        [-2.4, -2.4],
        [2.4, -2.4],
        [2.4, 2.4],
        [-2.4, 2.4],
      ].map(([px, pz], i) => (
        <group key={`pylon-${faction}-${i}`} position={[px, 0.35, pz]}>
          <mesh>
            <boxGeometry args={[0.22, 0.6, 0.22]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.5} />
          </mesh>
          <pointLight color={colorHex} intensity={0.8} distance={2.5} />
        </group>
      ))}

      {/* Perimeter Holographic Laser Rails */}
      <mesh position={[0, 0.45, -2.4]}>
        <boxGeometry args={[4.5, 0.04, 0.04]} />
        <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.0} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.45, 2.4]}>
        <boxGeometry args={[4.5, 0.04, 0.04]} />
        <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.0} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-2.4, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[4.5, 0.04, 0.04]} />
        <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.0} transparent opacity={0.7} />
      </mesh>
      <mesh position={[2.4, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[4.5, 0.04, 0.04]} />
        <meshStandardMaterial color={colorHex} emissive={colorHex} emissiveIntensity={2.0} transparent opacity={0.7} />
      </mesh>

      {/* Center Floating Faction Holographic Crystal Core */}
      <mesh ref={coreHoloRef} position={[0, 0.65, 0]} scale={0.38}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color={colorHex}
          emissive={colorHex}
          emissiveIntensity={2.8}
          roughness={0.15}
          metalness={0.8}
          wireframe
        />
      </mesh>

      {/* 4 Dedicated Circular Quantum Docking Launchpads */}
      {pods.map(([r, c], i) => {
        const [wx, wy, wz] = gridToWorld(r, c, PLATFORM_Y);
        const relX = wx - position[0];
        const relZ = wz - position[2];

        return (
          <group key={`dock-${faction}-${i}`} position={[relX, 0.26, relZ]}>
            {/* Recessed Docking Plate */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.55, 24]} />
              <meshStandardMaterial color="#0A0F1D" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Concentric Neon Faction Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[0.42, 0.52, 24]} />
              <meshStandardMaterial
                color={colorHex}
                emissive={colorHex}
                emissiveIntensity={1.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Subtle Vertical Docking Ambient Beacon */}
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.38, 0.48, 0.7, 16, 1, true]} />
              <meshBasicMaterial color={colorHex} transparent opacity={0.12} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── 3D CYBERNETIC OBSIDIAN COLOSSEUM ARENA ────────────────────────────────
function ObsidianColosseum3D({
  activePlayer,
}: {
  activePlayer: LudoPlayer;
}) {
  return (
    <group position={[0, 0, 0]}>
      {/* ── 1. MAIN OBSIDIAN CYBER ARENA PLATFORM ── */}
      {/* Heavy Sub-Structure Nanocarbon Chassis */}
      <mesh position={[0, -0.7, 0]} receiveShadow>
        <cylinderGeometry args={[12.6, 13.4, 1.5, 64]} />
        <meshStandardMaterial color="#060A14" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Glowing Outer Neon Circuit Rim Bevel */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12.2, 12.6, 64]} />
        <meshStandardMaterial
          color="#00FF66"
          roughness={0.2}
          metalness={0.9}
          emissive="#00FF66"
          emissiveIntensity={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cyber Carbon Nanotech Tabletop Surface */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12.2, 64]} />
        <meshStandardMaterial color="#080E1A" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* 4 Diagonal Heavy Cantilever Outrigger Pylons */}
      {[
        [-9.2, -9.2],
        [9.2, -9.2],
        [9.2, 9.2],
        [-9.2, 9.2],
      ].map(([ox, oz], i) => (
        <group key={`outrigger-${i}`} position={[ox, -0.5, oz]}>
          <mesh>
            <boxGeometry args={[1.2, 0.6, 1.2]} />
            <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.15, 0.25, 0.4, 12]} />
            <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      {/* Underside Emerald Antigrav Core Glow */}
      <mesh position={[0, -1.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5, 11, 32]} />
        <meshBasicMaterial color="#00FF66" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, -2, 0]} color="#00FF66" intensity={4} distance={15} />

      {/* ── 2. 4 ELEVATED FACTION BASTIONS (WITH DOCKING LAUNCHPADS) ── */}
      {/* Astraea Vanguard Yard (Top-Left: Cerulean / Cyan #0099FF) */}
      <FactionBastion3D
        faction="red"
        position={[-4.7, 0, -4.7]}
        colorHex="#0099FF"
        emissiveHex="#00F0FF"
        pods={YARD_PODS.red}
      />

      {/* Hyperion Corsair Yard (Top-Right: Tangerine / Crimson #FF6633) */}
      <FactionBastion3D
        faction="green"
        position={[4.7, 0, -4.7]}
        colorHex="#FF6633"
        emissiveHex="#FF3300"
        pods={YARD_PODS.green}
      />

      {/* Solar Nova Yard (Bottom-Right: Solar Crown #FFC700) */}
      <FactionBastion3D
        faction="yellow"
        position={[4.7, 0, 4.7]}
        colorHex="#FFC700"
        emissiveHex="#FFB300"
        pods={YARD_PODS.yellow}
      />

      {/* Void Syndicate Yard (Bottom-Left: Violet Diamond #9D4EDD) */}
      <FactionBastion3D
        faction="blue"
        position={[-4.7, 0, 4.7]}
        colorHex="#9D4EDD"
        emissiveHex="#8B5CF6"
        pods={YARD_PODS.blue}
      />

      {/* ── 3. 52 CRISP HIGH-CONTRAST STEPPING TILES ── */}
      {TRACK_COORDS.map(([r, c], idx) => {
        const [x, y, z] = gridToWorld(r, c, PLATFORM_Y);
        const isSafeStar = SAFE_TRACK_INDICES.has(idx);
        const isRedStart = idx === 0;
        const isGreenStart = idx === 13;
        const isYellowStart = idx === 26;
        const isBlueStart = idx === 39;

        const tileColor = isRedStart
          ? '#0099FF'
          : isGreenStart
          ? '#FF6633'
          : isYellowStart
          ? '#FFC700'
          : isBlueStart
          ? '#9D4EDD'
          : '#131B2E';

        const emissiveColor = isRedStart
          ? '#0099FF'
          : isGreenStart
          ? '#FF6633'
          : isYellowStart
          ? '#FFC700'
          : isBlueStart
          ? '#9D4EDD'
          : '#1E293B';

        const powerup = CYBER_POWERUPS.find((pu) => pu.index === idx);

        return (
          <group key={`track-${idx}`} position={[x, y, z]}>
            {/* Elevated Obsidian Stepping Tile Base */}
            <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
              <boxGeometry args={[0.96, 0.12, 0.96]} />
              <meshStandardMaterial
                color={tileColor}
                roughness={0.3}
                metalness={0.6}
                emissive={emissiveColor}
                emissiveIntensity={isRedStart || isGreenStart || isYellowStart || isBlueStart ? 1.0 : 0.12}
              />
            </mesh>

            {/* Inlaid Nanotech Face */}
            <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.82, 0.82]} />
              <meshStandardMaterial
                color="#0A101D"
                emissive={emissiveColor}
                emissiveIntensity={0.25}
                roughness={0.4}
              />
            </mesh>

            {/* Starting Portal Ring on Spawn Tiles */}
            {(isRedStart || isGreenStart || isYellowStart || isBlueStart) && (
              <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.22, 0.36, 24]} />
                <meshStandardMaterial color={tileColor} emissive={tileColor} emissiveIntensity={3.0} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Safe Star Haven Marker (Spinning Golden Crystal Shrine) */}
            {isSafeStar && (
              <group position={[0, 0.28, 0]}>
                <Float speed={2.5} rotationIntensity={1.5} floatIntensity={0.5}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} scale={0.28}>
                    <octahedronGeometry args={[0.7, 0]} />
                    <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={3.0} />
                  </mesh>
                </Float>
                <pointLight color="#FFD700" intensity={1.8} distance={1.8} />
              </group>
            )}

            {/* Power-up Floating Hologram */}
            {powerup && (
              <PowerUp3D type={powerup.type} position={[0, 0.15, 0]} label={powerup.label} />
            )}
          </group>
        );
      })}

      {/* ── 4. 4 COLOR-CODED HOME RUNWAY PATHS (5 TILES EACH) ── */}
      {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((col) => {
        const tiles = HOME_COLUMNS[col];
        const hex =
          col === 'red'
            ? '#0099FF'
            : col === 'green'
            ? '#FF6633'
            : col === 'yellow'
            ? '#FFC700'
            : '#9D4EDD';

        return tiles.map(([r, c], i) => {
          const [x, y, z] = gridToWorld(r, c, PLATFORM_Y + 0.02 + i * 0.015);
          return (
            <group key={`home-${col}-${i}`} position={[x, y + 0.05, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.96, 0.14, 0.96]} />
                <meshStandardMaterial
                  color={hex}
                  roughness={0.25}
                  metalness={0.7}
                  emissive={hex}
                  emissiveIntensity={0.5 + i * 0.15}
                />
              </mesh>
              {/* Runway Guidance Chevron */}
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.12, 0.24, 3]} />
                <meshStandardMaterial color="#FFFFFF" emissive={hex} emissiveIntensity={2.5} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        });
      })}

      {/* ── 5. CENTER SINGULARITY NEXUS GOAL ── */}
      <CentralNexusCore3D />
    </group>
  );
}

// ─── COMBAT CLASH VFX ───────────────────────────────────────────────────────
function CombatClashVfx({
  clash,
  attackerPlayer,
  defenderPlayer,
}: {
  clash: CombatClash;
  attackerPlayer: LudoPlayer;
  defenderPlayer: LudoPlayer;
}) {
  const defSpecies = (defenderPlayer.avatar.species || 'human').toLowerCase();

  return (
    <group position={clash.position}>
      {clash.stage === 'clash' && (
        <>
          <SlashArcEffect position={[0, 0.6, 0]} color={attackerPlayer.colorHex} facing="right" />
          <HitSparks position={[0, 0.6, 0]} color={attackerPlayer.colorHex} />
        </>
      )}

      {clash.outcome === 'shield_defend' && (
        <group position={[0, 0.5, 0]}>
          {defSpecies === 'elf' ? (
            <ElfWindBarrier position={[0, 0, 0]} />
          ) : defSpecies === 'fairy' || defSpecies === 'fairie' ? (
            <FairyPetalShield position={[0, 0, 0]} />
          ) : defSpecies === 'dwarf' || defSpecies === 'dwarves' ? (
            <DwarfStoneFortress position={[0, 0, 0]} />
          ) : (
            <HumanIronBastion position={[0, 0, 0]} />
          )}
        </group>
      )}

      {clash.outcome === 'capture' && clash.stage === 'resolve' && (
        <>
          <CriticalHitImpactScene position={[0, 0.6, 0]} color={defenderPlayer.colorHex} />
          {/* Neon beam on knockout */}
          <mesh position={[0, 3.0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 6.0, 16]} />
            <meshBasicMaterial color={defenderPlayer.colorHex} transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      <group position={[0, 1.6, 0]}>
        <Html center distanceFactor={10}>
          <div
            className={`px-3 py-1 rounded-xl font-mono font-black text-xs uppercase tracking-wider shadow-2xl border backdrop-blur-md animate-in zoom-in-75 duration-200 select-none whitespace-nowrap ${
              clash.outcome === 'shield_defend'
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_20px_#06B6D4]'
                : 'bg-red-950/90 border-red-500 text-white shadow-[0_0_25px_#EF4444]'
            }`}
          >
            {clash.outcome === 'shield_defend' ? '[DEFENDED] SHIELD BLOCKED!' : '[KNOCKOUT] CAPTURED!'}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── AMBIENT STADIUM CYBER MOTES & ORBITAL ARCHITECTURE ────────────────────
function StadiumArenaSurroundings3D() {
  const points = useMemo(() => {
    const p = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      p[i * 3] = (Math.random() - 0.5) * 45;
      p[i * 3 + 1] = Math.random() * 18 - 2;
      p[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    return p;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.025;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y -= delta * 0.04;
    }
  });

  return (
    <group>
      {/* 300 Ambient Floating Cyber Dust Motes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00FF66"
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>

      {/* Distant Orbiting Superstructure Ring */}
      <group ref={ringRef} position={[0, -2, 0]} rotation={[0.3, 0, 0.2]}>
        <mesh>
          <torusGeometry args={[22, 0.15, 16, 64]} />
          <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={1.2} wireframe transparent opacity={0.35} />
        </mesh>
        <mesh>
          <torusGeometry args={[26, 0.08, 16, 64]} />
          <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={1.0} wireframe transparent opacity={0.25} />
        </mesh>
      </group>

      {/* 4 Diagonal High-Intensity Cyber Stadium Floodlight Towers */}
      {[
        [-17, 0, -17],
        [17, 0, -17],
        [17, 0, 17],
        [-17, 0, 17],
      ].map(([fx, fy, fz], i) => (
        <group key={`floodlight-${i}`} position={[fx, fy, fz]}>
          {/* Truss Tower Pylon */}
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[0.3, 0.6, 12, 6]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.3} wireframe />
          </mesh>
          {/* Floodlight Head Box */}
          <mesh position={[0, 12, 0]} rotation={[0.4, (i * Math.PI) / 2 + Math.PI / 4, 0]}>
            <boxGeometry args={[2.2, 0.8, 1.2]} />
            <meshStandardMaterial color="#020617" metalness={0.8} />
          </mesh>
          {/* Glowing Floodlight Emitter Panel */}
          <mesh position={[0, 12, 0]} rotation={[0.4, (i * Math.PI) / 2 + Math.PI / 4, 0]}>
            <planeGeometry args={[2.0, 0.6]} />
            <meshBasicMaterial color="#00FF66" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── CELEBRATORY SUPERNOVA BURST ON ROLLING A 6 ────────────────────────────
function SixSupernovaBurst({ active }: { active: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (active) setScale(1);
    else setScale(0);
  }, [active]);

  useFrame((_, delta) => {
    if (ringRef.current && scale > 0) {
      ringRef.current.scale.addScalar(delta * 4.5);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, mat.opacity - delta * 1.8);
        if (mat.opacity <= 0) {
          setScale(0);
          mat.opacity = 0.9;
          ringRef.current.scale.set(0.2, 0.2, 0.2);
        }
      }
    }
  });

  if (!active && scale === 0) return null;

  return (
    <group position={[0, 1.2, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.6, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#FFD700" intensity={8} distance={6} />
    </group>
  );
}

// ─── CAMERA CONTROLLER ──────────────────────────────────────────────────────
function LudoCameraController({
  preset,
  activeTargetPos,
}: {
  preset: CameraPreset;
  activeTargetPos: [number, number, number] | null;
}) {
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    // Crisp, immersive tactical isometric camera: board and avatars are large & vibrant
    let targetX = 8.6;
    let targetY = 12.8;
    let targetZ = 8.6;
    let lookX = 0;
    let lookY = 0.35;
    let lookZ = 0;

    if (preset === 'topdown') {
      targetX = 0;
      targetY = 18.5;
      targetZ = 0.05;
      lookX = 0;
      lookY = 0;
      lookZ = 0;
    } else if (preset === 'action' && activeTargetPos) {
      targetX = activeTargetPos[0] * 0.45;
      targetY = 7.5;
      targetZ = activeTargetPos[2] * 0.45 + 7.8;
      lookX = activeTargetPos[0];
      lookY = activeTargetPos[1] + 0.6;
      lookZ = activeTargetPos[2];
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, delta * 3.5);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 3.5);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 3.5);

    if (controlsRef.current) {
      controlsRef.current.target.x = THREE.MathUtils.lerp(controlsRef.current.target.x, lookX, delta * 4);
      controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, lookY, delta * 4);
      controlsRef.current.target.z = THREE.MathUtils.lerp(controlsRef.current.target.z, lookZ, delta * 4);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={5}
      maxDistance={28}
      maxPolarAngle={Math.PI / 2 - 0.06}
    />
  );
}

export interface Ludo3DColosseumProps {
  players: LudoPlayer[];
  currentTurn: PlayerColor;
  diceRoll: number | null;
  isRolling: boolean;
  canRoll: boolean;
  selectablePieces: number[];
  winner: LudoPlayer | null;
  cameraPreset: CameraPreset;
  activeClash: CombatClash | null;
  floatingTexts: FloatingText3D[];
  activeMovement: ActiveMovement | null;
  bloomEnabled?: boolean;
  onRollDice: () => void;
  onSelectPiece: (pieceId: number) => void;
}

export function Ludo3DColosseum({
  players,
  currentTurn,
  diceRoll,
  isRolling,
  canRoll,
  selectablePieces,
  winner,
  cameraPreset,
  activeClash,
  floatingTexts,
  activeMovement,
  bloomEnabled = true,
  onRollDice,
  onSelectPiece,
}: Ludo3DColosseumProps) {
  const activePlayer = useMemo(() => players.find((p) => p.id === currentTurn)!, [players, currentTurn]);

  const actionTargetPos = useMemo<[number, number, number] | null>(() => {
    if (activeClash) return activeClash.position;
    const activePiece = activePlayer.pieces.find((p) => p.step >= 0 && p.step < 57);
    if (activePiece) {
      const trackIdx = (START_TRACK_INDEX[activePlayer.id] + activePiece.step) % 52;
      const [r, c] = TRACK_COORDS[trackIdx];
      return gridToWorld(r, c, PLATFORM_Y);
    }
    return [0, 0, 0];
  }, [activeClash, activePlayer]);

  return (
    <div className="w-full h-full overflow-hidden bg-[#040711]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 14.5, 14.5], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Deep Obsidian Cyber Cosmos Background & Fog */}
        <color attach="background" args={['#040711']} />
        <fog attach="fog" args={['#040711', 22, 60]} />

        {/* Ambient & Dramatic Cyber Colosseum Lighting */}
        <ambientLight intensity={1.6} color="#0E1726" />
        <directionalLight
          position={[8, 22, 12]}
          intensity={2.8}
          color="#FFFFFF"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <pointLight position={[0, 7, 0]} intensity={3.5} color="#00FF66" distance={20} />

        {/* 4 Faction Bastion Colored Key Lights */}
        <pointLight position={[-7, 5, -7]} color="#00F0FF" intensity={3.2} distance={14} />
        <pointLight position={[7, 5, -7]} color="#FF5500" intensity={3.2} distance={14} />
        <pointLight position={[7, 5, 7]} color="#FFD700" intensity={3.2} distance={14} />
        <pointLight position={[-7, 5, 7]} color="#A855F7" intensity={3.2} distance={14} />

        {/* Camera Controller */}
        <LudoCameraController preset={cameraPreset} activeTargetPos={actionTargetPos} />

        {/* Obsidian & Emerald Colosseum Platform */}
        <ObsidianColosseum3D activePlayer={activePlayer} />

        {/* 16 Avatars on Board with 60 FPS useFrame movement */}
        {players.map((player) =>
          player.pieces.map((piece) => {
            const isSelectable =
              currentTurn === player.id &&
              selectablePieces.includes(piece.id) &&
              !player.isAi;

            return (
              <AvatarPiece3D
                key={`${player.id}-${piece.id}`}
                piece={piece}
                player={player}
                isCurrentPlayer={currentTurn === player.id}
                isSelectable={isSelectable}
                onSelect={onSelectPiece}
                activeClash={activeClash}
                winner={winner}
                activeMovement={activeMovement}
              />
            );
          })
        )}

        {/* 3D Quantum Die */}
        <QuantumDice3D
          diceRoll={diceRoll}
          isRolling={isRolling}
          canRoll={canRoll && !activePlayer.isAi && !winner}
          colorHex={activePlayer.colorHex}
          onRoll={onRollDice}
        />

        {/* Active Combat Clash VFX */}
        {activeClash && (
          <CombatClashVfx
            clash={activeClash}
            attackerPlayer={players.find((p) => p.id === activeClash.attackerColor)!}
            defenderPlayer={players.find((p) => p.id === activeClash.defenderColor)!}
          />
        )}

        {/* Floating 3D Text Badges */}
        {floatingTexts.map((ft) => (
          <group key={ft.id} position={ft.position}>
            <Html center distanceFactor={10}>
              <div
                className="px-3 py-1 rounded-full font-mono font-black text-xs uppercase tracking-wider shadow-lg backdrop-blur-md animate-in zoom-in-75 duration-200 select-none whitespace-nowrap"
                style={{
                  backgroundColor: 'rgba(2, 5, 2, 0.9)',
                  borderColor: ft.color,
                  borderWidth: 1.5,
                  color: ft.color,
                  boxShadow: `0 0 15px ${ft.color}`,
                }}
              >
                {ft.text}
              </div>
            </Html>
          </group>
        ))}

        {/* Ambient Stadium Cyber Motes & Orbital Surroundings */}
        <StadiumArenaSurroundings3D />

        {/* Celebratory Supernova Burst on Rolling a 6 */}
        <SixSupernovaBurst active={diceRoll === 6} />

        {/* Deep Contact Shadows on arena floor (Ambient Occlusion Grounding) */}
        <ContactShadows
          position={[0, PLATFORM_Y, 0]}
          opacity={0.82}
          scale={24}
          blur={1.8}
          far={3.5}
        />

        {/* ─── POST-PROCESSING: BLOOM FOR GLOWING COLOSSEUM TILES & YARDS ─── */}
        {bloomEnabled && (
          <EffectComposer>
            <Bloom
              intensity={0.55}
              luminanceThreshold={0.48}
              luminanceSmoothing={0.8}
              radius={0.7}
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
