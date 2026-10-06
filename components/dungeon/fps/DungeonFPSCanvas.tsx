// components/dungeon/fps/DungeonFPSCanvas.tsx
// Core 3D First-Person Sci-Fi Shooter Arena Canvas with Raycasting, Enemy AI, and Combat Loop

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { sound } from '@/lib/audio';
import {
  WeaponId,
  WEAPON_CONFIGS,
  FPSEnemyEntity,
  FPSProjectile,
  FPSPickupItem,
  FloatingDamage,
  FPSSettings,
} from './types';
import { FirstPersonController, fpsPlayerCamera } from './FirstPersonController';
import { WeaponViewModel } from './WeaponViewModel';
import { FPSEnemy } from './FPSEnemy';
import { FPSArena3D } from './FPSArena3D';

const FLOOR_PALETTES = [
  { fog: '#050D0A', floor: '#08140F', trim: '#00FF66', danger: '#EF4444' },
  { fog: '#100806', floor: '#1A0C0A', trim: '#F97316', danger: '#EF4444' },
  { fog: '#0F0714', floor: '#160B1E', trim: '#C084FC', danger: '#F43F5E' },
  { fog: '#040F14', floor: '#07161E', trim: '#22D3EE', danger: '#A855F7' },
  { fog: '#120C06', floor: '#1A1209', trim: '#F59E0B', danger: '#FB7185' },
  { fog: '#12060D', floor: '#1A0813', trim: '#FB7185', danger: '#F59E0B' },
];

interface DungeonFPSCanvasProps {
  floor: number;
  initialEnemies: FPSEnemyEntity[];
  playerHp: number;
  maxHp: number;
  playerShield: number;
  maxShield: number;
  playerStamina: number;
  maxStamina: number;
  currentWeapon: WeaponId;
  ammo: { clip: number; reserve: number };
  isReloading: boolean;
  reloadProgress: number;
  settings: FPSSettings;
  isPaused: boolean;
  onPlayerDamage: (amount: number) => void;
  onEnemyKilled: (enemy: FPSEnemyEntity) => void;
  onRoomClear: () => void;
  onAmmoChange: (ammo: { clip: number; reserve: number }) => void;
  onReloadStateChange: (reloading: boolean, progress: number) => void;
  onSelectWeapon: (weapon: WeaponId) => void;
  onHitmarker: (isCrit: boolean) => void;
  onInteractPromptChange: (prompt: string | null) => void;
  onPickupCollect: (type: 'health' | 'shield' | 'ammo', amount: number) => void;
}

export function DungeonFPSCanvas(props: DungeonFPSCanvasProps) {
  const {
    floor,
    initialEnemies,
    playerHp,
    currentWeapon,
    ammo,
    isReloading,
    reloadProgress,
    settings,
    isPaused,
    onPlayerDamage,
    onEnemyKilled,
    onRoomClear,
    onAmmoChange,
    onReloadStateChange,
    onHitmarker,
    onInteractPromptChange,
    onPickupCollect,
  } = props;

  const palette = FLOOR_PALETTES[Math.min(floor, FLOOR_PALETTES.length - 1)];

  // FPS State Refs & React States
  const [enemies, setEnemies] = useState<FPSEnemyEntity[]>(initialEnemies);
  const enemiesRef = useRef<FPSEnemyEntity[]>(initialEnemies);
  enemiesRef.current = enemies;

  const [projectiles, setProjectiles] = useState<FPSProjectile[]>([]);
  const projectilesRef = useRef<FPSProjectile[]>([]);
  projectilesRef.current = projectiles;

  const [pickups, setPickups] = useState<FPSPickupItem[]>([]);
  const pickupsRef = useRef<FPSPickupItem[]>([]);
  pickupsRef.current = pickups;

  const [floatingTexts, setFloatingTexts] = useState<FloatingDamage[]>([]);
  const floatIdRef = useRef(0);

  const [muzzleFlashTime, setMuzzleFlashTime] = useState(0);
  const [mouseDelta, setMouseDelta] = useState({ x: 0, y: 0 });
  const [movementState, setMovementState] = useState({ isMoving: false, isSprinting: false });
  const [damageShakePulse, setDamageShakePulse] = useState(0);

  const isFiringRef = useRef(false);
  const lastFireTimeRef = useRef(0);
  const currentWeaponRef = useRef(currentWeapon);
  currentWeaponRef.current = currentWeapon;
  const ammoRef = useRef(ammo);
  ammoRef.current = ammo;
  const isReloadingRef = useRef(isReloading);
  isReloadingRef.current = isReloading;

  const isChamberGateOpen = useRef(false);
  const isDead = playerHp <= 0;

  // Sync initial enemies
  useEffect(() => {
    setEnemies(initialEnemies);
    enemiesRef.current = initialEnemies;
  }, [initialEnemies]);

  // Floating damage number helper
  const spawnFloatingDamage = useCallback(
    (pos: [number, number, number], damage: number, isCrit: boolean, isPlayer = false) => {
      const id = ++floatIdRef.current;
      setFloatingTexts((prev) => [
        ...prev,
        { id, worldPosition: [pos[0], pos[1] + 0.6, pos[2]], damage, isCrit, isPlayerHurt: isPlayer },
      ]);
      window.setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 700);
    },
    []
  );

  // Reload action
  const startReload = useCallback(() => {
    const curDef = WEAPON_CONFIGS[currentWeaponRef.current];
    if (isReloadingRef.current || ammoRef.current.clip >= curDef.magSize || ammoRef.current.reserve <= 0) {
      return;
    }
    onReloadStateChange(true, 0);
    sound.playReload();

    const reloadDuration = curDef.reloadTime * 1000;
    const start = performance.now();

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const progress = Math.min(1, elapsed / reloadDuration);
      onReloadStateChange(true, progress);

      if (progress >= 1) {
        window.clearInterval(interval);
        const needed = curDef.magSize - ammoRef.current.clip;
        const taken = Math.min(needed, ammoRef.current.reserve);
        const nextAmmo = {
          clip: ammoRef.current.clip + taken,
          reserve: ammoRef.current.reserve - taken,
        };
        onAmmoChange(nextAmmo);
        onReloadStateChange(false, 0);
      }
    }, 50);
  }, [onAmmoChange, onReloadStateChange]);

  // Raycast Shot Execution
  const executeShot = useCallback(() => {
    if (isDead || isPaused || isReloadingRef.current) return;

    const wDef = WEAPON_CONFIGS[currentWeaponRef.current];
    const now = performance.now();

    // Check fire rate
    if (now - lastFireTimeRef.current < wDef.fireRate * 1000) return;

    // Check ammo
    if (ammoRef.current.clip <= 0) {
      sound.playEmptyClip();
      startReload();
      return;
    }

    lastFireTimeRef.current = now;
    const nextAmmo = { ...ammoRef.current, clip: ammoRef.current.clip - 1 };
    onAmmoChange(nextAmmo);
    setMuzzleFlashTime(now);

    // Play weapon sound
    if (wDef.soundMethod === 'playRifleShot') sound.playRifleShot();
    else if (wDef.soundMethod === 'playPistolShot') sound.playPistolShot();
    else if (wDef.soundMethod === 'playShotgunShot') sound.playShotgunShot();

    // Fire pellets (1 for rifle/pistol, 8 for shotgun)
    const camPos = fpsPlayerCamera.position.clone();
    const camDir = fpsPlayerCamera.direction.clone().normalize();

    let hitAny = false;
    let hitCrit = false;

    for (let p = 0; p < wDef.pellets; p++) {
      // Apply spread
      const spreadX = (Math.random() - 0.5) * wDef.spread;
      const spreadY = (Math.random() - 0.5) * wDef.spread;
      const rayDir = camDir.clone().add(new THREE.Vector3(spreadX, spreadY, spreadX * 0.5)).normalize();

      // Check intersections with all living enemies
      let closestHit: { enemyId: string; distance: number; isCrit: boolean } | null = null;

      for (const enemy of enemiesRef.current) {
        if (enemy.hp <= 0) continue;
        const ePos = new THREE.Vector3(enemy.position[0], enemy.position[1], enemy.position[2]);
        const headPos = new THREE.Vector3(
          enemy.position[0],
          enemy.position[1] + (enemy.archetype === 'boss' ? 2.4 : 1.45),
          enemy.position[2]
        );

        // Head bounding sphere check
        const headRadius = enemy.archetype === 'boss' ? 0.65 : 0.38;
        const toHead = headPos.clone().sub(camPos);
        const headProj = toHead.dot(rayDir);
        if (headProj > 0) {
          const perpHeadDist = toHead.clone().sub(rayDir.clone().multiplyScalar(headProj)).length();
          if (perpHeadDist <= headRadius) {
            if (!closestHit || headProj < closestHit.distance) {
              closestHit = { enemyId: enemy.id, distance: headProj, isCrit: true };
            }
          }
        }

        // Body bounding cylinder / sphere check
        const bodyRadius = enemy.archetype === 'boss' ? 1.4 : enemy.archetype === 'brute' ? 0.95 : 0.65;
        const bodyPos = new THREE.Vector3(enemy.position[0], enemy.position[1] + 0.8, enemy.position[2]);
        const toBody = bodyPos.clone().sub(camPos);
        const bodyProj = toBody.dot(rayDir);
        if (bodyProj > 0) {
          const perpBodyDist = toBody.clone().sub(rayDir.clone().multiplyScalar(bodyProj)).length();
          if (perpBodyDist <= bodyRadius) {
            if (!closestHit || bodyProj < closestHit.distance) {
              closestHit = { enemyId: enemy.id, distance: bodyProj, isCrit: false };
            }
          }
        }
      }

      if (closestHit) {
        hitAny = true;
        if (closestHit.isCrit) hitCrit = true;

        const isCrit = closestHit.isCrit;
        const dmg = Math.round(wDef.damage * (isCrit ? wDef.critMultiplier : 1.0));

        // Damage the targeted enemy
        const targetId = closestHit.enemyId;
        setEnemies((prev) =>
          prev.map((e) => {
            if (e.id !== targetId || e.hp <= 0) return e;

            // Damage shields first if present
            let newShield = e.shield;
            let remainingDmg = dmg;
            if (newShield > 0) {
              if (newShield >= remainingDmg) {
                newShield -= remainingDmg;
                remainingDmg = 0;
              } else {
                remainingDmg -= newShield;
                newShield = 0;
                sound.playShieldBreak();
              }
            }

            const newHp = Math.max(0, e.hp - remainingDmg);
            spawnFloatingDamage(e.position, dmg, isCrit);

            if (newHp <= 0) {
              // Enemy died! Drop pickup loot
              sound.playImpact();
              onEnemyKilled(e);

              const pickupType: 'health' | 'shield' | 'ammo' =
                Math.random() < 0.35 ? 'health' : Math.random() < 0.6 ? 'shield' : 'ammo';
              setPickups((p) => [
                ...p,
                {
                  id: `loot-${Date.now()}-${Math.random()}`,
                  type: pickupType,
                  position: [e.position[0], 0.4, e.position[2]],
                  amount: pickupType === 'health' ? 150 : pickupType === 'shield' ? 50 : 36,
                  label: pickupType.toUpperCase(),
                },
              ]);
            }

            return {
              ...e,
              hp: newHp,
              shield: newShield,
              hitFlashTimer: 0.12,
            };
          })
        );
      }
    }

    if (hitAny) {
      sound.playHitmarker(hitCrit);
      onHitmarker(hitCrit);
    }
  }, [
    isDead,
    isPaused,
    onAmmoChange,
    onEnemyKilled,
    onHitmarker,
    spawnFloatingDamage,
    startReload,
  ]);

  // Click & Key bindings
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement) {
        isFiringRef.current = true;
        executeShot();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isFiringRef.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        startReload();
      }
      if (e.code === 'Digit1') props.onSelectWeapon('pulse_rifle');
      if (e.code === 'Digit2') props.onSelectWeapon('energy_pistol');
      if (e.code === 'Digit3') props.onSelectWeapon('plasma_shotgun');
      if (e.code === 'KeyE') {
        // Check if gate is open and player is near
        if (isChamberGateOpen.current) {
          const p = fpsPlayerCamera.position;
          const distToGate = Math.hypot(p.x - 0, p.z - (-11));
          if (distToGate < 3.2) {
            sound.playSweep();
            onRoomClear();
          }
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [executeShot, onRoomClear, props, startReload]);

  // Automatic pulse rifle firing while holding mouse button
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isFiringRef.current && currentWeaponRef.current === 'pulse_rifle') {
        executeShot();
      }
    }, 110);
    return () => window.clearInterval(interval);
  }, [executeShot]);

  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.35, 6.5], fov: settings.fov || 75 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[palette.fog]} />
        <fog attach="fog" args={[palette.fog, 4, 18]} />
        <PerspectiveCamera makeDefault position={[0, 1.35, 6.5]} fov={settings.fov || 75} />

        {/* Dynamic Lighting */}
        <ambientLight color="#94A3B8" intensity={0.4} />
        <directionalLight
          position={[6, 12, 6]}
          intensity={1.5}
          color="#F8FAFC"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[0, 4.5, 0]} color={palette.trim} intensity={3.5} distance={14} />

        {/* 3D Sci-Fi Arena Architecture */}
        <FPSArena3D floor={floor} palette={palette} />

        {/* First Person Controller & Camera Physics */}
        <FirstPersonController
          settings={settings}
          isPaused={isPaused}
          onMouseDelta={setMouseDelta}
          onMovementStateChange={(moving, sprinting) =>
            setMovementState({ isMoving: moving, isSprinting: sprinting })
          }
          damageShakePulse={damageShakePulse}
          isDead={isDead}
        />

        {/* First Person 3D Weapon Viewmodel */}
        {!isDead && (
          <WeaponViewModel
            currentWeapon={currentWeapon}
            isFiring={isFiringRef.current}
            isReloading={isReloading}
            reloadProgress={reloadProgress}
            isSprinting={movementState.isSprinting}
            isMoving={movementState.isMoving}
            muzzleFlashTime={muzzleFlashTime}
            mouseDelta={mouseDelta}
          />
        )}

        {/* 3D Enemies */}
        {enemies
          .filter((e) => e.hp > 0)
          .map((enemy) => (
            <FPSEnemy key={enemy.id} enemy={enemy} />
          ))}

        {/* Projectiles */}
        {projectiles.map((proj) => (
          <group key={proj.id} position={proj.position}>
            <mesh>
              <sphereGeometry args={[proj.radius, 8, 8]} />
              <meshBasicMaterial color={proj.color} />
            </mesh>
            <pointLight color={proj.color} intensity={2} distance={2.5} />
          </group>
        ))}

        {/* 3D Floating Pickups */}
        {pickups.map((item) => (
          <PickupMesh key={item.id} item={item} />
        ))}

        {/* Floating Damage Text */}
        {floatingTexts.map((f) => (
          <Html key={f.id} position={f.worldPosition} center distanceFactor={9}>
            <div
              className={`font-mono text-sm font-black select-none pointer-events-none animate-bounce ${
                f.isCrit
                  ? 'text-amber-300 text-lg shadow-[0_0_12px_#F59E0B]'
                  : f.isPlayerHurt
                  ? 'text-rose-400'
                  : 'text-[#00FF66]'
              }`}
            >
              {f.isCrit ? 'CRIT ' : ''}
              {f.damage}
            </div>
          </Html>
        ))}

        {/* Contact Shadows */}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={24} blur={2.2} far={6} />

        {/* Scene Logic Hook (Enemy AI, Projectiles, Pickups) */}
        <CombatSceneManager
          enemies={enemies}
          setEnemies={setEnemies}
          projectiles={projectiles}
          setProjectiles={setProjectiles}
          pickups={pickups}
          setPickups={setPickups}
          isPaused={isPaused}
          isDead={isDead}
          onPlayerDamage={(amount) => {
            onPlayerDamage(amount);
            setDamageShakePulse((p) => p + 1);
            spawnFloatingDamage(
              [fpsPlayerCamera.position.x, fpsPlayerCamera.position.y - 0.2, fpsPlayerCamera.position.z],
              amount,
              false,
              true
            );
          }}
          onPickupCollect={onPickupCollect}
          onInteractPromptChange={onInteractPromptChange}
          isChamberGateOpen={isChamberGateOpen}
        />
      </Canvas>
    </div>
  );
}

// ─── 3D PICKUP MESH ─────────────────────────────────────────────────────────
function PickupMesh({ item }: { item: FPSPickupItem }) {
  const meshRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 2.2;
      meshRef.current.position.y = item.position[1] + Math.sin(clock.getElapsedTime() * 3) * 0.08;
    }
  });

  const color =
    item.type === 'health' ? '#10B981' : item.type === 'shield' ? '#22D3EE' : '#F59E0B';

  return (
    <group ref={meshRef} position={item.position}>
      <mesh>
        <octahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
      </mesh>
      <pointLight color={color} intensity={2} distance={3} />
    </group>
  );
}

// ─── SCENE LOGIC MANAGER (AI, Projectile Physics, Pickups) ───────────────────
function CombatSceneManager({
  enemies,
  setEnemies,
  projectiles,
  setProjectiles,
  pickups,
  setPickups,
  isPaused,
  isDead,
  onPlayerDamage,
  onPickupCollect,
  onInteractPromptChange,
  isChamberGateOpen,
}: {
  enemies: FPSEnemyEntity[];
  setEnemies: React.Dispatch<React.SetStateAction<FPSEnemyEntity[]>>;
  projectiles: FPSProjectile[];
  setProjectiles: React.Dispatch<React.SetStateAction<FPSProjectile[]>>;
  pickups: FPSPickupItem[];
  setPickups: React.Dispatch<React.SetStateAction<FPSPickupItem[]>>;
  isPaused: boolean;
  isDead: boolean;
  onPlayerDamage: (amt: number) => void;
  onPickupCollect: (type: 'health' | 'shield' | 'ammo', amt: number) => void;
  onInteractPromptChange: (prompt: string | null) => void;
  isChamberGateOpen: React.MutableRefObject<boolean>;
}) {
  useFrame((_, delta) => {
    if (isPaused || isDead) return;

    const playerPos = fpsPlayerCamera.position;
    const livingEnemies = enemies.filter((e) => e.hp > 0);

    // Check if chamber is cleared
    if (livingEnemies.length === 0) {
      isChamberGateOpen.current = true;
      const distToGate = Math.hypot(playerPos.x - 0, playerPos.z - (-11));
      if (distToGate < 3.5) {
        onInteractPromptChange('BREACH GATE [ E ]');
      } else {
        onInteractPromptChange('CHAMBER CLEARED // PROCEED TO NORTH GATE');
      }
    } else {
      isChamberGateOpen.current = false;
      onInteractPromptChange(null);
    }

    // ─── 1. ENEMY AI TICK ─────────────────────────────────────────────
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (enemy.hp <= 0) return enemy;

        const nextHitFlash = Math.max(0, enemy.hitFlashTimer - delta);
        const dx = playerPos.x - enemy.position[0];
        const dz = playerPos.z - enemy.position[2];
        const distToPlayer = Math.hypot(dx, dz) || 1;
        const targetRotY = Math.atan2(dx, dz);

        let nextState = enemy.aiState;
        let nextTimer = enemy.stateTimer + delta;
        let nextTelegraph = enemy.telegraphProgress;
        let [ex, ey, ez] = enemy.position;

        // Boss Phase Transition
        let bossPhase = enemy.bossPhase || 1;
        if (enemy.isBoss) {
          if (enemy.hp < enemy.maxHp * 0.33) bossPhase = 3;
          else if (enemy.hp < enemy.maxHp * 0.66) bossPhase = 2;
        }

        // State Machine
        if (nextState === 'idle' || nextState === 'chase') {
          if (distToPlayer > enemy.range) {
            // Move closer
            const moveSpeed = enemy.speed * (enemy.archetype === 'boss' && bossPhase === 3 ? 1.5 : 1);
            ex += (dx / distToPlayer) * moveSpeed * delta;
            ez += (dz / distToPlayer) * moveSpeed * delta;
          } else {
            // In range -> start telegraphed attack
            nextState = 'telegraph';
            nextTimer = 0;
            nextTelegraph = 0;
            if (enemy.isBoss) sound.playBossCharge();
          }
        } else if (nextState === 'telegraph') {
          const telegraphDuration = enemy.archetype === 'boss' ? 0.9 : 0.65;
          nextTelegraph = Math.min(1, nextTimer / telegraphDuration);

          if (nextTimer >= telegraphDuration) {
            // Trigger Attack
            nextState = 'attack';
            nextTimer = 0;

            if (enemy.archetype === 'scout' || enemy.archetype === 'brute') {
              // Melee Strike
              if (distToPlayer < 2.5) {
                onPlayerDamage(enemy.attack);
                sound.playHurt();
              }
            } else {
              // Ranged Projectile Attack
              const projDir = new THREE.Vector3(dx, 0, dz).normalize();
              const projSpeed = enemy.isBoss ? 11 : 8.5;
              setProjectiles((p) => [
                ...p,
                {
                  id: `proj-${Date.now()}-${Math.random()}`,
                  position: [ex, ey + 1.2, ez],
                  velocity: [projDir.x * projSpeed, 0, projDir.z * projSpeed],
                  damage: enemy.attack,
                  color: enemy.color,
                  radius: enemy.isBoss ? 0.28 : 0.18,
                  life: 3.5,
                  isHostile: true,
                },
              ]);
              sound.playLaser();
            }
          }
        } else if (nextState === 'attack') {
          if (nextTimer >= 0.4) {
            // Return to chase / reposition
            nextState = 'chase';
            nextTimer = 0;
            nextTelegraph = 0;
          }
        }

        return {
          ...enemy,
          position: [ex, ey, ez],
          rotationY: targetRotY,
          aiState: nextState,
          stateTimer: nextTimer,
          telegraphProgress: nextTelegraph,
          hitFlashTimer: nextHitFlash,
          bossPhase,
        };
      })
    );

    // ─── 2. PROJECTILES PHYSICS & COLLISIONS ──────────────────────────
    setProjectiles((prev) => {
      const nextList: FPSProjectile[] = [];
      for (const proj of prev) {
        const nextPos: [number, number, number] = [
          proj.position[0] + proj.velocity[0] * delta,
          proj.position[1] + proj.velocity[1] * delta,
          proj.position[2] + proj.velocity[2] * delta,
        ];
        const nextLife = proj.life - delta;

        // Check player collision
        const distToPlayer = Math.hypot(nextPos[0] - playerPos.x, nextPos[2] - playerPos.z);
        if (distToPlayer < 0.65) {
          onPlayerDamage(proj.damage);
          sound.playHurt();
          continue; // Consumed on hit
        }

        // Check arena wall boundaries [-11.5, 11.5]
        if (Math.abs(nextPos[0]) > 11.2 || Math.abs(nextPos[2]) > 11.2 || nextLife <= 0) {
          continue; // Destroyed
        }

        nextList.push({ ...proj, position: nextPos, life: nextLife });
      }
      return nextList;
    });

    // ─── 3. PICKUP COLLECTION ─────────────────────────────────────────
    setPickups((prev) => {
      const remaining: FPSPickupItem[] = [];
      for (const item of prev) {
        const dist = Math.hypot(item.position[0] - playerPos.x, item.position[2] - playerPos.z);
        if (dist < 1.3) {
          // Collected!
          onPickupCollect(item.type, item.amount);
          sound.playPotion();
        } else {
          remaining.push(item);
        }
      }
      return remaining;
    });
  });

  return null;
}
