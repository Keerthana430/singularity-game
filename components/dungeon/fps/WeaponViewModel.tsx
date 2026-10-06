// components/dungeon/fps/WeaponViewModel.tsx
// Procedural First-Person 3D Sci-Fi Weapon Viewmodels with Sway, Recoil & Animations

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WeaponId, WEAPON_CONFIGS } from './types';

interface WeaponViewModelProps {
  currentWeapon: WeaponId;
  isFiring: boolean;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  isSprinting: boolean;
  isMoving: boolean;
  muzzleFlashTime: number; // timestamp when last fired
  mouseDelta: { x: number; y: number };
  isScoped?: boolean;
}

export function WeaponViewModel({
  currentWeapon,
  isReloading,
  reloadProgress,
  isSprinting,
  isMoving,
  muzzleFlashTime,
  mouseDelta,
  isScoped = false,
}: WeaponViewModelProps) {
  const { camera } = useThree();
  const rootRef = useRef<THREE.Group>(null);
  const recoilRef = useRef({ kickZ: 0, pitchX: 0, yawY: 0 });
  const swayRef = useRef({ x: 0, y: 0 });
  const lastFlash = useRef(0);

  const weaponDef = WEAPON_CONFIGS[currentWeapon];
  const isFlashActive = performance.now() - muzzleFlashTime < 65;

  useFrame(({ clock }, delta) => {
    if (!rootRef.current) return;

    // Check if new shot fired
    if (muzzleFlashTime > lastFlash.current) {
      recoilRef.current.kickZ = weaponDef.recoilKickZ;
      recoilRef.current.pitchX = weaponDef.recoilPitchX;
      recoilRef.current.yawY = (Math.random() - 0.5) * 0.02;
      lastFlash.current = muzzleFlashTime;
    }

    // Recover recoil smoothly
    const recoilRecovery = Math.min(1, delta * 16);
    recoilRef.current.kickZ = THREE.MathUtils.lerp(recoilRef.current.kickZ, 0, recoilRecovery);
    recoilRef.current.pitchX = THREE.MathUtils.lerp(recoilRef.current.pitchX, 0, recoilRecovery);
    recoilRef.current.yawY = THREE.MathUtils.lerp(recoilRef.current.yawY, 0, recoilRecovery);

    // Mouse look inertia / weapon sway
    const targetSwayX = -mouseDelta.x * 0.00035;
    const targetSwayY = -mouseDelta.y * 0.00035;
    swayRef.current.x = THREE.MathUtils.lerp(swayRef.current.x, targetSwayX, delta * 10);
    swayRef.current.y = THREE.MathUtils.lerp(swayRef.current.y, targetSwayY, delta * 10);

    // Idle & walk bobbing
    const time = clock.getElapsedTime();
    const bobSpeed = isSprinting ? 12 : isMoving ? 8 : 2;
    const bobAmpX = isSprinting ? 0.035 : isMoving ? 0.018 : 0.005;
    const bobAmpY = isSprinting ? 0.045 : isMoving ? 0.024 : 0.007;

    const bobX = Math.sin(time * bobSpeed) * bobAmpX;
    const bobY = Math.abs(Math.cos(time * bobSpeed)) * bobAmpY;

    // Reload animation dip and tilt
    let reloadOffsetZ = 0;
    let reloadOffsetY = 0;
    let reloadRotX = 0;
    let reloadRotZ = 0;
    if (isReloading) {
      const p = reloadProgress;
      if (p < 0.3) {
        // Dip down & tilt
        const sub = p / 0.3;
        reloadOffsetY = -sub * 0.22;
        reloadRotX = sub * 0.35;
        reloadRotZ = sub * 0.25;
      } else if (p < 0.7) {
        // Eject / click mag
        reloadOffsetY = -0.22;
        reloadRotX = 0.35;
        reloadRotZ = 0.25;
      } else {
        // Raise back into position
        const sub = (p - 0.7) / 0.3;
        reloadOffsetY = -(1 - sub) * 0.22;
        reloadRotX = (1 - sub) * 0.35;
        reloadRotZ = (1 - sub) * 0.25;
      }
    }

    // Sprint lowering
    const sprintLowerY = isSprinting ? -0.16 : 0;
    const sprintRotX = isSprinting ? 0.45 : 0;
    const sprintRotY = isSprinting ? -0.3 : 0;

    // Weapon resting position (lower right of camera viewport, or center ADS when scoped)
    const swayFactor = isScoped ? 0.15 : 1.0;
    const bobFactor = isScoped ? 0.15 : 1.0;
    const baseOffsetX = isScoped ? 0.0 : 0.22 + swayRef.current.x * swayFactor + bobX * bobFactor;
    const baseOffsetY = isScoped
      ? -0.15 + reloadOffsetY
      : -0.22 + swayRef.current.y * swayFactor - bobY * bobFactor + sprintLowerY + reloadOffsetY;
    const baseOffsetZ = isScoped
      ? -0.32 + recoilRef.current.kickZ * 0.4 + reloadOffsetZ
      : -0.42 + recoilRef.current.kickZ + reloadOffsetZ;

    // Position relative to camera orientation
    const localPos = new THREE.Vector3(baseOffsetX, baseOffsetY, baseOffsetZ);
    localPos.applyQuaternion(camera.quaternion);
    rootRef.current.position.copy(camera.position).add(localPos);

    // Apply rotation matching camera plus recoil and animations
    rootRef.current.quaternion.copy(camera.quaternion);
    rootRef.current.rotateX(recoilRef.current.pitchX * (isScoped ? 0.5 : 1.0) + sprintRotX + reloadRotX);
    rootRef.current.rotateY(recoilRef.current.yawY * (isScoped ? 0.5 : 1.0) + sprintRotY + swayRef.current.x * 0.8 * swayFactor);
    rootRef.current.rotateZ(reloadRotZ + bobX * 1.5 * bobFactor);
  });

  return (
    <group ref={rootRef}>
      {/* 3D Model based on current weapon */}
      {currentWeapon === 'pulse_rifle' && <PulseRifleModel isFlashActive={isFlashActive} />}
      {currentWeapon === 'energy_pistol' && <EnergyPistolModel isFlashActive={isFlashActive} />}
      {currentWeapon === 'plasma_shotgun' && <PlasmaShotgunModel isFlashActive={isFlashActive} />}

      {/* Dynamic Muzzle Flash PointLight */}
      {isFlashActive && (
        <pointLight
          position={[0, 0.04, -0.45]}
          color={weaponDef.emissive}
          intensity={8}
          distance={8}
          decay={2}
        />
      )}
    </group>
  );
}

// ─── 1. PULSE RIFLE MK-IV ───────────────────────────────────────────────────
function PulseRifleModel({ isFlashActive }: { isFlashActive: boolean }) {
  return (
    <group scale={0.88} position={[0, 0, 0]}>
      {/* Main Receiver / Chassis */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.075, 0.12, 0.44]} />
        <meshStandardMaterial color="#0F172A" metalness={0.92} roughness={0.25} />
      </mesh>

      {/* Top Rail */}
      <mesh position={[0, 0.065, -0.04]}>
        <boxGeometry args={[0.045, 0.02, 0.38]} />
        <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.4} />
      </mesh>

      {/* Glowing Neon Plasma Conduit Tube */}
      <mesh position={[0, 0.035, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.28, 12]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={2.5}
          roughness={0.2}
        />
      </mesh>

      {/* Extended Barrel Shroud */}
      <mesh position={[0, 0.015, -0.28]}>
        <boxGeometry args={[0.055, 0.065, 0.22]} />
        <meshStandardMaterial color="#0A0F1D" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Muzzle Brake */}
      <mesh position={[0, 0.015, -0.41]}>
        <cylinderGeometry args={[0.024, 0.028, 0.06, 8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.95} roughness={0.3} />
      </mesh>

      {/* Holographic Sight Frame */}
      <group position={[0, 0.095, -0.08]}>
        <mesh>
          <boxGeometry args={[0.04, 0.045, 0.01]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[0.012, 0.016, 16]} />
          <meshBasicMaterial color="#00FF66" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.003, 8]} />
          <meshBasicMaterial color="#00FF66" />
        </mesh>
      </group>

      {/* Bullpup Magazine Socket */}
      <mesh position={[0, -0.08, 0.12]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.05, 0.14, 0.075]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={0.8}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Ergonomic Pistol Grip */}
      <mesh position={[0, -0.09, -0.04]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.045, 0.12, 0.065]} />
        <meshStandardMaterial color="#050B14" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* Muzzle Flash VFX */}
      {isFlashActive && (
        <group position={[0, 0.015, -0.46]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.06, 0]} />
            <meshBasicMaterial color="#7DFFB2" transparent opacity={0.95} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── 2. ARC MAGNUM ENERGY PISTOL ────────────────────────────────────────────
function EnergyPistolModel({ isFlashActive }: { isFlashActive: boolean }) {
  return (
    <group scale={0.92} position={[0.02, 0, 0]}>
      {/* Heavy Cyber Slide */}
      <mesh castShadow position={[0, 0.03, -0.06]}>
        <boxGeometry args={[0.065, 0.075, 0.28]} />
        <meshStandardMaterial color="#0B132B" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Top Cooling Core */}
      <mesh position={[0, 0.072, -0.06]}>
        <boxGeometry args={[0.035, 0.015, 0.22]} />
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#22D3EE"
          emissiveIntensity={3.0}
        />
      </mesh>

      {/* Barrel Emitter */}
      <mesh position={[0, 0.03, -0.22]}>
        <cylinderGeometry args={[0.02, 0.024, 0.06, 8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Underbarrel Laser Diode */}
      <mesh position={[0, -0.015, -0.15]}>
        <boxGeometry args={[0.03, 0.025, 0.12]} />
        <meshStandardMaterial color="#0369A1" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Angled Grip */}
      <mesh position={[0, -0.08, 0.04]} rotation={[0.42, 0, 0]}>
        <boxGeometry args={[0.048, 0.14, 0.068]} />
        <meshStandardMaterial color="#020617" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Muzzle Flash */}
      {isFlashActive && (
        <group position={[0, 0.03, -0.27]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.055, 0]} />
            <meshBasicMaterial color="#A5F3FC" transparent opacity={0.95} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── 3. SCATTER CORE 8 PLASMA SHOTGUN ───────────────────────────────────────
function PlasmaShotgunModel({ isFlashActive }: { isFlashActive: boolean }) {
  return (
    <group scale={0.9} position={[0, 0, 0]}>
      {/* Heavy Heavy Receiver */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.14, 0.42]} />
        <meshStandardMaterial color="#1E1035" metalness={0.88} roughness={0.3} />
      </mesh>

      {/* Dual Over-Under Plasma Barrels */}
      <mesh position={[0, 0.045, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.28, 12]} />
        <meshStandardMaterial color="#2E1065" metalness={0.95} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.015, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.28, 12]} />
        <meshStandardMaterial color="#2E1065" metalness={0.95} roughness={0.25} />
      </mesh>

      {/* Plasma Containment Chamber (Glowing Purple/Magenta) */}
      <mesh position={[0, 0.02, -0.06]}>
        <boxGeometry args={[0.075, 0.075, 0.16]} />
        <meshStandardMaterial
          color="#D946EF"
          emissive="#D946EF"
          emissiveIntensity={3.2}
          roughness={0.2}
        />
      </mesh>

      {/* Ribbed Pump Handle */}
      <mesh position={[0, -0.05, -0.22]}>
        <boxGeometry args={[0.09, 0.05, 0.14]} />
        <meshStandardMaterial color="#090514" roughness={0.85} metalness={0.4} />
      </mesh>

      {/* Heavy Stock */}
      <mesh position={[0, -0.04, 0.26]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.07, 0.14, 0.2]} />
        <meshStandardMaterial color="#0A0612" roughness={0.8} metalness={0.5} />
      </mesh>

      {/* Heavy Muzzle Blast */}
      {isFlashActive && (
        <group position={[0, 0.015, -0.46]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <dodecahedronGeometry args={[0.09, 0]} />
            <meshBasicMaterial color="#F5D0FE" transparent opacity={0.95} />
          </mesh>
        </group>
      )}
    </group>
  );
}
