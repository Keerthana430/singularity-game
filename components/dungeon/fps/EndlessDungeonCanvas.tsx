// components/dungeon/fps/EndlessDungeonCanvas.tsx
// Core 3D First-Person Endless Survival FPS Canvas with Continuous Spawner, Physical Loot, and Extraction
// Optimized: Zero per-frame React state thrashing, Wall & Pillar Projectile Occlusion, and Vibrant Lighting

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
  FloatingDamage,
  FPSSettings,
  SurvivalItem,
  PhysicalLootDrop,
  ExtractionState,
} from './types';
import {
  FirstPersonController,
  fpsPlayerCamera,
  fpsMouseDelta,
  fpsMovementState,
} from './FirstPersonController';
import { WeaponViewModel } from './WeaponViewModel';
import { FPSEnemy } from './FPSEnemy';
import { FPSArena3D } from './FPSArena3D';
import { PhysicalLoot } from './PhysicalLoot';
import { evaluateDirector, generateSurvivalEnemy, SPAWN_PORTALS } from './DifficultyDirector';
import { rollLootDrop } from './LootCatalog';

// Vibrant, atmospheric palettes with rich colors and textures (no pitch-black voids!)
const TIER_PALETTES = [
  { fog: '#0D261C', sky: '#123828', floor: '#1E332B', wall: '#274438', trim: '#00FF66', danger: '#EF4444', accent: '#38BDF8' }, // Tier 1: Emerald Cyber Ruins
  { fog: '#0D2338', sky: '#123352', floor: '#1E3247', wall: '#2A4560', trim: '#38BDF8', danger: '#F43F5E', accent: '#00FF66' }, // Tier 2: Cobalt Azure Incursion
  { fog: '#201035', sky: '#2F174D', floor: '#2C1D42', wall: '#3E2A5C', trim: '#C084FC', danger: '#FB7185', accent: '#38BDF8' }, // Tier 3: Royal Neon Spire
  { fog: '#33200D', sky: '#4D2F14', floor: '#422B19', wall: '#593B22', trim: '#F59E0B', danger: '#EF4444', accent: '#F43F5E' }, // Tier 4: Solar Core Overload
  { fog: '#350D14', sky: '#4D141E', floor: '#451B22', wall: '#5E252F', trim: '#FB7185', danger: '#FF0033', accent: '#F59E0B' }, // Tier 5: Crimson Nightmare Protocol
];

// Tactical Cover Colliders in the Expanded 42x42 Arena for Projectiles & Line of Sight
export const ARENA_COVER_OBSTACLES = [
  // 4 Inner Cover Pillars: [centerX, centerZ, radius, height]
  { x: -5.5, z: -4.5, r: 1.15, h: 5.2 },
  { x: 5.5, z: -4.5, r: 1.15, h: 5.2 },
  { x: -5.5, z: 4.5, r: 1.15, h: 5.2 },
  { x: 5.5, z: 4.5, r: 1.15, h: 5.2 },
  // 4 Outer Flank Pillars
  { x: -12.5, z: -10.5, r: 1.15, h: 5.2 },
  { x: 12.5, z: -10.5, r: 1.15, h: 5.2 },
  { x: -12.5, z: 10.5, r: 1.15, h: 5.2 },
  { x: 12.5, z: 10.5, r: 1.15, h: 5.2 },
  // Central Terminal Dais (height ~1.0m)
  { x: 0, z: 0, r: 1.6, h: 1.2 },
];

// Helper: Check if line segment between two 2D points intersects any cover pillar
function isLineBlockedByCover(p1: [number, number], p2: [number, number]): boolean {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return false;

  for (const obs of ARENA_COVER_OBSTACLES) {
    const t = Math.max(0, Math.min(1, ((obs.x - p1[0]) * dx + (obs.z - p1[1]) * dz) / lenSq));
    const projX = p1[0] + t * dx;
    const projZ = p1[1] + t * dz;
    const dist = Math.hypot(obs.x - projX, obs.z - projZ);
    if (dist < obs.r) {
      return true; // Ray is blocked by solid cover!
    }
  }
  return false;
}

// Smooth Dynamic Optical Scope Camera FOV Controller (3.5x Zoom)
function ScopeCameraController({ isScoped, baseFov }: { isScoped?: boolean; baseFov: number }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    const targetFov = isScoped ? 32 : baseFov;
    const pCam = camera as THREE.PerspectiveCamera;
    if (pCam.isPerspectiveCamera) {
      const nextFov = THREE.MathUtils.lerp(pCam.fov, targetFov, delta * 15);
      if (Math.abs(pCam.fov - nextFov) > 0.05) {
        pCam.fov = nextFov;
        pCam.updateProjectionMatrix();
      }
    }
  });
  return null;
}

interface EndlessDungeonCanvasProps {
  survivalSeconds: number;
  kills: number;
  playerHp: number;
  maxHp: number;
  playerShield: number;
  maxShield: number;
  activeItem: SurvivalItem | null;
  ammo: { clip: number; reserve: number };
  isReloading: boolean;
  reloadProgress: number;
  settings: FPSSettings;
  isPaused: boolean;
  damageBuffMultiplier: number;
  lootDrops: PhysicalLootDrop[];
  extractionState: ExtractionState;
  nearbyLoot: PhysicalLootDrop | null;
  isScoped?: boolean;
  waveCountdown?: number;
  isHordeEnraged?: boolean;
  onToggleScope?: () => void;
  onPlayerDamage: (amount: number) => void;
  onEnemyKilled: (enemy: FPSEnemyEntity, droppedLoot: PhysicalLootDrop | null) => void;
  onAmmoChange: (ammo: { clip: number; reserve: number }) => void;
  onReloadStateChange: (reloading: boolean, progress: number) => void;
  onHitmarker: (isCrit: boolean) => void;
  onNearbyLootChange: (loot: PhysicalLootDrop | null) => void;
  onPickupLoot: (dropId: string) => void;
  onExtractionChannel: (progress: number, isChanneling: boolean) => void;
  onExtract: () => void;
  onSelectSlotIndex: (index: number) => void;
  onUseActiveItem: () => void;
}


export function EndlessDungeonCanvas(props: EndlessDungeonCanvasProps) {
  const {
    survivalSeconds,
    kills,
    playerHp,
    activeItem,
    ammo,
    isReloading,
    reloadProgress,
    settings,
    isPaused,
    damageBuffMultiplier,
    lootDrops,
    extractionState,
    nearbyLoot,
    isScoped = false,
    waveCountdown,
    isHordeEnraged = false,
    onToggleScope,
    onPlayerDamage,
    onEnemyKilled,
    onAmmoChange,
    onReloadStateChange,
    onHitmarker,
    onNearbyLootChange,
    onPickupLoot,
    onExtractionChannel,
    onExtract,
    onSelectSlotIndex,
    onUseActiveItem,
  } = props;

  const evalState = useMemo(() => evaluateDirector(survivalSeconds, kills), [survivalSeconds, kills]);
  const palette = TIER_PALETTES[Math.min(evalState.tierIndex, TIER_PALETTES.length - 1)];

  // FPS State: Living enemies list (only updated on spawn, death, or damage)
  const [enemies, setEnemies] = useState<FPSEnemyEntity[]>([]);
  const enemiesRef = useRef<FPSEnemyEntity[]>([]);
  enemiesRef.current = enemies;

  // Projectiles stored in Ref: 0 React re-renders while bullets fly
  const projectilesRef = useRef<FPSProjectile[]>([]);

  // 2D Screen-Space Floating Damage Numbers (100% stable, 0 Drei removeChild crashes)
  const [floatingTexts, setFloatingTexts] = useState<
    { id: number; offsetX: number; offsetY: number; damage: number; isCrit: boolean; isPlayerHurt: boolean }[]
  >([]);
  const floatIdRef = useRef(0);

  const [muzzleFlashTime, setMuzzleFlashTime] = useState(0);
  const [damageShakePulse, setDamageShakePulse] = useState(0);

  const isFiringRef = useRef(false);
  const lastFireTimeRef = useRef(0);
  const activeItemRef = useRef(activeItem);
  activeItemRef.current = activeItem;
  const ammoRef = useRef(ammo);
  ammoRef.current = ammo;
  const isReloadingRef = useRef(isReloading);
  isReloadingRef.current = isReloading;

  const isDead = playerHp <= 0;
  const isHoldingKeyERef = useRef(false);

  // Active weapon definition
  const currentWeaponId: WeaponId =
    activeItem?.kind === 'weapon' && activeItem.weaponId ? activeItem.weaponId : 'pulse_rifle';

  // Spawn initial 2 scouts cleanly on mount
  const initialSpawnDone = useRef(false);
  useEffect(() => {
    if (!initialSpawnDone.current) {
      initialSpawnDone.current = true;
      const initial: FPSEnemyEntity[] = [
        generateSurvivalEnemy('init-1', 0, 0, [0, 0, 0]),
        generateSurvivalEnemy('init-2', 0, 0, [0, 0, 0]),
      ];
      setEnemies(initial);
      enemiesRef.current = initial;
    }
  }, []);

  // Floating damage numbers (Screen Space)
  const spawnFloatingDamage = useCallback(
    (_pos: [number, number, number], damage: number, isCrit: boolean, isPlayer = false) => {
      const id = ++floatIdRef.current;
      const offsetX = (Math.random() - 0.5) * 80;
      const offsetY = -25 - Math.random() * 35;
      setFloatingTexts((prev) => [
        ...(prev.length > 5 ? prev.slice(-5) : prev),
        { id, offsetX, offsetY, damage, isCrit, isPlayerHurt: isPlayer },
      ]);
      window.setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 650);
    },
    []
  );

  // Reload action
  const startReload = useCallback(() => {
    const curDef = WEAPON_CONFIGS[currentWeaponId];
    if (
      isReloadingRef.current ||
      ammoRef.current.clip >= curDef.magSize ||
      ammoRef.current.reserve <= 0 ||
      activeItemRef.current?.kind !== 'weapon'
    ) {
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
  }, [currentWeaponId, onAmmoChange, onReloadStateChange]);

  // Raycast Shot Execution
  const executeShot = useCallback(() => {
    if (isDead || isPaused || isReloadingRef.current) return;
    if (activeItemRef.current?.kind !== 'weapon') return;

    const wDef = WEAPON_CONFIGS[currentWeaponId];
    const now = performance.now();

    if (now - lastFireTimeRef.current < wDef.fireRate * 1000) return;

    if (ammoRef.current.clip <= 0) {
      sound.playEmptyClip();
      startReload();
      return;
    }

    lastFireTimeRef.current = now;
    const nextAmmo = { ...ammoRef.current, clip: ammoRef.current.clip - 1 };
    onAmmoChange(nextAmmo);
    setMuzzleFlashTime(now);

    if (wDef.soundMethod === 'playRifleShot') sound.playRifleShot();
    else if (wDef.soundMethod === 'playPistolShot') sound.playPistolShot();
    else if (wDef.soundMethod === 'playShotgunShot') sound.playShotgunShot();

    const camPos = fpsPlayerCamera.position.clone();
    const camDir = fpsPlayerCamera.direction.clone().normalize();

    let hitAny = false;
    let hitCrit = false;

    const spreadMult = isScoped ? 0.22 : 1.0;
    for (let p = 0; p < wDef.pellets; p++) {
      const spreadX = (Math.random() - 0.5) * wDef.spread * spreadMult;
      const spreadY = (Math.random() - 0.5) * wDef.spread * spreadMult;
      const rayDir = camDir.clone().add(new THREE.Vector3(spreadX, spreadY, spreadX * 0.5)).normalize();

      // Check intersections with all living enemies
      let closestHit: { enemyId: string; distance: number; isCrit: boolean } | null = null;

      for (const enemy of enemiesRef.current) {
        if (enemy.hp <= 0) continue;

        // Cover occlusion check between player and enemy
        if (isLineBlockedByCover([camPos.x, camPos.z], [enemy.position[0], enemy.position[2]])) {
          continue; // Ray is occluded by pillar!
        }

        const headPos = new THREE.Vector3(
          enemy.position[0],
          enemy.position[1] + (enemy.archetype === 'boss' ? 2.4 : 1.45),
          enemy.position[2]
        );

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
        const baseDmg = wDef.damage * (isCrit ? wDef.critMultiplier : 1.0);
        const dmg = Math.round(baseDmg * damageBuffMultiplier);

        const targetId = closestHit.enemyId;
        let slainEnemy: FPSEnemyEntity | null = null;
        let slainDrop: PhysicalLootDrop | null = null;

        setEnemies((prev) =>
          prev.map((e) => {
            if (e.id !== targetId || e.hp <= 0) return e;

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
              sound.playImpact();
              const isElite = e.archetype === 'elite' || e.archetype === 'boss';
              const shouldDrop = Math.random() < 0.30;
              let drop: PhysicalLootDrop | null = null;
              if (shouldDrop) {
                const droppedItem = rollLootDrop(evalState.tierIndex + 1, isElite);
                drop = {
                  id: `loot-${Date.now()}-${Math.random()}`,
                  item: droppedItem,
                  position: [e.position[0], 0.2, e.position[2]],
                  dropTime: performance.now(),
                };
              }
              slainEnemy = e;
              slainDrop = drop;
            }

            return {
              ...e,
              hp: newHp,
              shield: newShield,
              hitFlashTimer: 0.12,
            };
          })
        );

        // Dispatch parent event outside of the React state updater
        if (slainEnemy) {
          onEnemyKilled(slainEnemy, slainDrop);
        }
      }
    }

    if (hitAny) {
      sound.playHitmarker(hitCrit);
      onHitmarker(hitCrit);
    }
  }, [
    isDead,
    isPaused,
    isScoped,
    currentWeaponId,
    onAmmoChange,
    damageBuffMultiplier,
    evalState.tierIndex,
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
      } else if (e.button === 2 && document.pointerLockElement) {
        if (activeItemRef.current?.kind === 'weapon') {
          onToggleScope?.();
          sound.playEquip();
        } else if (activeItemRef.current?.kind === 'consumable') {
          onUseActiveItem();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isFiringRef.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') startReload();
      if (e.code === 'KeyQ') {
        if (activeItemRef.current?.kind === 'weapon') {
          onToggleScope?.();
          sound.playEquip();
        } else if (activeItemRef.current?.kind === 'consumable') {
          onUseActiveItem();
        }
      }
      if (e.code === 'Digit1') onSelectSlotIndex(0);
      if (e.code === 'Digit2') onSelectSlotIndex(1);
      if (e.code === 'Digit3') onSelectSlotIndex(2);
      if (e.code === 'Digit4') onSelectSlotIndex(3);
      if (e.code === 'Digit5') onSelectSlotIndex(4);

      if (e.code === 'KeyE') {
        isHoldingKeyERef.current = true;
        if (nearbyLoot) onPickupLoot(nearbyLoot.id);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        isHoldingKeyERef.current = false;
        onExtractionChannel(0, false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [executeShot, nearbyLoot, onExtractionChannel, onPickupLoot, onSelectSlotIndex, onToggleScope, onUseActiveItem, startReload]);

  // Automatic rifle firing
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        isFiringRef.current &&
        activeItemRef.current?.kind === 'weapon' &&
        activeItemRef.current.weaponId === 'pulse_rifle'
      ) {
        executeShot();
      }
    }, 110);
    return () => window.clearInterval(interval);
  }, [executeShot]);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      <Canvas
        dpr={1}
        camera={{ position: [0, 1.35, 6.5], fov: settings.fov || 75 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[palette.fog]} />
        <fog attach="fog" args={[palette.fog, 6, 26]} />
        <PerspectiveCamera makeDefault position={[0, 1.35, 6.5]} fov={settings.fov || 75} />
        <ScopeCameraController isScoped={isScoped} baseFov={settings.fov || 75} />

        {/* ─── VIBRANT CINEMATIC LIGHTING (BUTTERY SMOOTH 60FPS) ─────────── */}
        <ambientLight color="#E2E8F0" intensity={1.15} />
        <hemisphereLight args={[palette.accent || '#38BDF8', '#1E293B', 0.65]} />
        <directionalLight position={[12, 22, 10]} intensity={2.6} color="#F8FAFC" />
        {/* Soft Arena Central Point Light (1 Single Light in Whole Scene) */}
        <pointLight position={[0, 5.5, 0]} color="#FFFFFF" intensity={3.5} distance={18} decay={1.8} />

        {/* Rich Textured Sci-Fi Arena Architecture */}
        <FPSArena3D floor={evalState.tierIndex} palette={palette} />

        {/* Extraction Teleporter Pad at [0, 0, -9.5] */}
        <ExtractionPad3D
          isActive={extractionState.isActive}
          isChanneling={extractionState.isChanneling}
          channelProgress={extractionState.channelProgress}
          position={extractionState.position}
        />

        {/* 3D Physical Loot Drops */}
        <PhysicalLoot lootDrops={lootDrops} />

        {/* First Person Controller & Camera Physics (Zero React State Thrashing) */}
        <FirstPersonController
          settings={settings}
          isPaused={isPaused}
          damageShakePulse={damageShakePulse}
          isDead={isDead}
        />

        {/* First Person 3D Weapon Viewmodel */}
        {!isDead && activeItem?.kind === 'weapon' && (
          <WeaponViewModel
            currentWeapon={currentWeaponId}
            isFiring={isFiringRef.current}
            isReloading={isReloading}
            reloadProgress={reloadProgress}
            isSprinting={fpsMovementState.isSprinting}
            isMoving={fpsMovementState.isMoving}
            muzzleFlashTime={muzzleFlashTime}
            mouseDelta={fpsMouseDelta}
            isScoped={isScoped}
          />
        )}

        {/* 3D Living Enemies */}
        {enemies
          .filter((e) => e.hp > 0)
          .map((enemy) => (
            <FPSEnemy key={enemy.id} enemy={enemy} />
          ))}

        {/* High Performance 3D Projectiles Pool (0 React Re-renders while flying) */}
        <ProjectilesRenderer projectilesRef={projectilesRef} />

        {/* High Performance Endless Survival Logic Manager (AI in-place, Wall Collision) */}
        <EndlessSceneLogicManager
          survivalSeconds={survivalSeconds}
          kills={kills}
          enemies={enemies}
          setEnemies={setEnemies}
          projectilesRef={projectilesRef}
          lootDrops={lootDrops}
          extractionState={extractionState}
          isHoldingKeyERef={isHoldingKeyERef}
          isPaused={isPaused}
          isDead={isDead}
          isHordeEnraged={isHordeEnraged}
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
          onNearbyLootChange={onNearbyLootChange}
          onExtractionChannel={onExtractionChannel}
          onExtract={onExtract}
        />
      </Canvas>

      {/* ─── 2D SCREEN-SPACE FLOATING DAMAGE OVERLAY (100% STABLE, 0 DREI CRASHES) ─── */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        {floatingTexts.map((f) => (
          <div
            key={f.id}
            className={`absolute font-mono select-none animate-bounce font-black tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${
              f.isCrit
                ? 'text-amber-300 text-2xl scale-110 drop-shadow-[0_0_10px_#F59E0B]'
                : f.isPlayerHurt
                ? 'text-rose-400 text-lg'
                : 'text-[#00FF66] text-xl drop-shadow-[0_0_8px_#00FF66]'
            }`}
            style={{
              transform: `translate(${f.offsetX}px, ${f.offsetY}px)`,
            }}
          >
            {f.isCrit ? 'CRIT ' : ''}
            {f.isPlayerHurt ? `-${f.damage}` : `+${f.damage}`}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3D PROJECTILES RENDERER (DIRECT MATRIX UPDATES, 0 REACT RE-RENDERS) ─────
function ProjectilesRenderer({
  projectilesRef,
}: {
  projectilesRef: React.MutableRefObject<FPSProjectile[]>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const projs = projectilesRef.current;
    const meshes = groupRef.current.children as THREE.Mesh[];
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i];
      if (i < projs.length) {
        mesh.visible = true;
        mesh.position.set(projs[i].position[0], projs[i].position[1], projs[i].position[2]);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.color.set(projs[i].color);
      } else {
        mesh.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.18, 6, 6]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
      ))}
    </group>
  );
}

// ─── 3D EXTRACTION TELEPORTER PAD ───────────────────────────────────────────
function ExtractionPad3D({
  isActive,
  isChanneling,
  channelProgress,
  position,
}: {
  isActive: boolean;
  isChanneling: boolean;
  channelProgress: number;
  position: [number, number, number];
}) {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.rotation.y = clock.getElapsedTime() * 0.8;
    if (beamRef.current && isActive) {
      beamRef.current.scale.y = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.08;
    }
  });

  const padColor = isActive ? '#22D3EE' : '#334155';

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.0, 32]} />
        <meshStandardMaterial color="#0A161E" roughness={0.6} metalness={0.7} />
      </mesh>

      <group ref={ringRef} position={[0, 0.04, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.0, 32]} />
          <meshBasicMaterial color={padColor} transparent opacity={isActive ? 0.85 : 0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.25, 24]} />
          <meshBasicMaterial color={padColor} transparent opacity={isActive ? 0.6 : 0.15} />
        </mesh>
      </group>

      {isActive && (
        <>
          <mesh ref={beamRef} position={[0, 6, 0]}>
            <cylinderGeometry args={[0.9, 1.3, 12, 16]} />
            <meshBasicMaterial color="#22D3EE" transparent opacity={isChanneling ? 0.45 : 0.25} />
          </mesh>

          <Html position={[0, 2.6, 0]} center distanceFactor={8} occlude={false}>
            <div className="pointer-events-none flex flex-col items-center select-none font-mono whitespace-nowrap">
              <div className="rounded-lg border border-cyan-400 bg-cyan-950/80 px-3 py-1 text-[10px] font-black uppercase text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                {isChanneling
                  ? `CHANNELING EXTRACTION: ${Math.round(channelProgress * 100)}%`
                  : 'HOLD [ E ] TO EXTRACT NOW'}
              </div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// ─── HIGH-PERFORMANCE SCENE LOGIC MANAGER ────────────────────────────────────
function EndlessSceneLogicManager({
  survivalSeconds,
  kills,
  enemies,
  setEnemies,
  projectilesRef,
  lootDrops,
  extractionState,
  isHoldingKeyERef,
  isPaused,
  isDead,
  isHordeEnraged = false,
  onPlayerDamage,
  onNearbyLootChange,
  onExtractionChannel,
  onExtract,
}: {
  survivalSeconds: number;
  kills: number;
  enemies: FPSEnemyEntity[];
  setEnemies: React.Dispatch<React.SetStateAction<FPSEnemyEntity[]>>;
  projectilesRef: React.MutableRefObject<FPSProjectile[]>;
  lootDrops: PhysicalLootDrop[];
  extractionState: ExtractionState;
  isHoldingKeyERef: React.MutableRefObject<boolean>;
  isPaused: boolean;
  isDead: boolean;
  isHordeEnraged?: boolean;
  onPlayerDamage: (amt: number) => void;
  onNearbyLootChange: (loot: PhysicalLootDrop | null) => void;
  onExtractionChannel: (progress: number, isChanneling: boolean) => void;
  onExtract: () => void;
}) {
  const spawnTimerRef = useRef(0);
  const channelTimerRef = useRef(0);
  const lastChannelPctRef = useRef(-1);
  const lastLootIdRef = useRef<string | null>(null);

  const evalState = useMemo(() => evaluateDirector(survivalSeconds, kills), [survivalSeconds, kills]);

  useFrame((_, delta) => {
    if (isPaused || isDead) return;

    const playerPos = fpsPlayerCamera.position;
    const livingEnemies = enemies.filter((e) => e.hp > 0);

    // ─── 1. CONTINUOUS ENEMY SPAWN DIRECTOR ───────────────────────────
    spawnTimerRef.current += delta;
    if (
      spawnTimerRef.current >= evalState.spawnInterval &&
      livingEnemies.length < Math.min(6, evalState.maxActiveEnemies) // Cap at 6 for buttery performance
    ) {
      spawnTimerRef.current = 0;
      const newEnemy = generateSurvivalEnemy(
        `surv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        survivalSeconds,
        kills,
        [playerPos.x, 0, playerPos.z]
      );
      setEnemies((prev) => [...prev.filter((e) => e.hp > 0), newEnemy]);
      sound.playLaser();
    }

    // ─── 2. THROTTLED PHYSICAL LOOT DETECTION (NO PER-FRAME SETSTATE) ─
    let closestDrop: PhysicalLootDrop | null = null;
    let closestDist = 2.4;

    for (const drop of lootDrops) {
      const d = Math.hypot(drop.position[0] - playerPos.x, drop.position[2] - playerPos.z);
      if (d < closestDist) {
        closestDist = d;
        closestDrop = drop;
      }
    }

    const closestId = closestDrop ? closestDrop.id : null;
    if (closestId !== lastLootIdRef.current) {
      lastLootIdRef.current = closestId;
      onNearbyLootChange(closestDrop);
    }

    // ─── 3. EXTRACTION CHANNELING ─────────────────────────────────────
    if (extractionState.isActive) {
      const distToPad = Math.hypot(
        extractionState.position[0] - playerPos.x,
        extractionState.position[2] - playerPos.z
      );

      if (distToPad < 2.2 && isHoldingKeyERef.current) {
        channelTimerRef.current += delta;
        const progress = Math.min(1, channelTimerRef.current / 2.5);
        const progressInt = Math.floor(progress * 25); // 4% intervals to throttle renders
        if (progressInt !== lastChannelPctRef.current) {
          lastChannelPctRef.current = progressInt;
          onExtractionChannel(progress, true);
        }

        if (progress >= 1) {
          channelTimerRef.current = 0;
          onExtract();
        }
      } else {
        if (channelTimerRef.current > 0) {
          channelTimerRef.current = 0;
          lastChannelPctRef.current = -1;
          onExtractionChannel(0, false);
        }
      }
    }

    // ─── 4. HIGH-PERFORMANCE IN-PLACE ENEMY AI TICK ───────────────────
    const speedMultiplier = isHordeEnraged ? 1.4 : 1.0;
    const dmgMultiplier = isHordeEnraged ? 1.35 : 1.0;

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;

      const nextHitFlash = Math.max(0, enemy.hitFlashTimer - delta);
      const dx = playerPos.x - enemy.position[0];
      const dz = playerPos.z - enemy.position[2];
      const distToPlayer = Math.hypot(dx, dz) || 1;
      const targetRotY = Math.atan2(dx, dz);

      let nextState = enemy.aiState;
      let nextTimer = enemy.stateTimer + delta;
      let nextTelegraph = enemy.telegraphProgress;
      let [ex, ey, ez] = enemy.position;

      // Line of Sight check: Is cover blocking the attack?
      const isBlocked = isLineBlockedByCover([ex, ez], [playerPos.x, playerPos.z]);

      if (nextState === 'idle' || nextState === 'chase') {
        if (distToPlayer > enemy.range || isBlocked) {
          // Move closer / reposition around cover to get clear line of sight
          ex += (dx / distToPlayer) * enemy.speed * speedMultiplier * delta;
          ez += (dz / distToPlayer) * enemy.speed * speedMultiplier * delta;
        } else {
          // Clear line of sight and in range -> start telegraphed attack
          nextState = 'telegraph';
          nextTimer = 0;
          nextTelegraph = 0;
          if (enemy.archetype === 'elite') sound.playBossCharge();
        }
      } else if (nextState === 'telegraph') {
        const telegraphDuration = enemy.archetype === 'elite' ? 0.85 : 0.6;
        nextTelegraph = Math.min(1, nextTimer / telegraphDuration);

        if (nextTimer >= telegraphDuration) {
          nextState = 'attack';
          nextTimer = 0;

          if (enemy.archetype === 'slime' || enemy.archetype === 'scout' || enemy.archetype === 'golem' || enemy.archetype === 'brute') {
            // Melee Strike
            if (distToPlayer < 2.6 && !isBlocked) {
              onPlayerDamage(Math.round(enemy.attack * dmgMultiplier));
              sound.playHurt();
            }
          } else {
            // Ranged Projectile Attack: Only fire if line is not already blocked
            if (!isBlocked) {
              const projDir = new THREE.Vector3(dx, 0, dz).normalize();
              const projSpeed = enemy.archetype === 'elite' ? 12 : 9.0;
              projectilesRef.current.push({
                id: `proj-${Date.now()}-${Math.random()}`,
                position: [ex, ey + 1.2, ez],
                velocity: [projDir.x * projSpeed, 0, projDir.z * projSpeed],
                damage: Math.round(enemy.attack * dmgMultiplier),
                color: enemy.color,
                radius: enemy.archetype === 'elite' ? 0.25 : 0.16,
                life: 3.5,
                isHostile: true,
              });
              sound.playLaser();
            }
          }
        }
      } else if (nextState === 'attack') {
        if (nextTimer >= 0.4) {
          nextState = 'chase';
          nextTimer = 0;
          nextTelegraph = 0;
        }
      }

      // Mutate in-place (FPSEnemy lerps directly from these positions each frame without React re-render!)
      enemy.position[0] = ex;
      enemy.position[1] = ey;
      enemy.position[2] = ez;
      enemy.rotationY = targetRotY;
      enemy.aiState = nextState;
      enemy.stateTimer = nextTimer;
      enemy.telegraphProgress = nextTelegraph;
      enemy.hitFlashTimer = nextHitFlash;
    }

    // ─── 5. PROJECTILES PHYSICS WITH SOLID COVER & WALL OCCLUSION (0 REACT RENDERS) ─────
    if (projectilesRef.current.length > 0) {
      const nextList: FPSProjectile[] = [];
      for (const proj of projectilesRef.current) {
        const nextPos: [number, number, number] = [
          proj.position[0] + proj.velocity[0] * delta,
          proj.position[1] + proj.velocity[1] * delta,
          proj.position[2] + proj.velocity[2] * delta,
        ];
        const nextLife = proj.life - delta;

        // 1. Solid Cover Collision: Check Pillars & Central Dais
        let hitSolidCover = false;

        // Outer boundaries (Expanded 42m x 42m arena)
        if (Math.abs(nextPos[0]) > 20.2 || Math.abs(nextPos[2]) > 20.2 || nextPos[1] < 0 || nextPos[1] > 7.0) {
          hitSolidCover = true;
        }

        // Cover pillars collision
        if (!hitSolidCover) {
          for (const obs of ARENA_COVER_OBSTACLES) {
            const dist = Math.hypot(nextPos[0] - obs.x, nextPos[2] - obs.z);
            if (dist < obs.r && nextPos[1] <= obs.h) {
              hitSolidCover = true;
              break;
            }
          }
        }

        if (hitSolidCover || nextLife <= 0) {
          // Projectile hit solid cover! Blocked, cannot pass through walls!
          sound.playShieldBlock();
          continue; // Consumed/destroyed
        }

        // 2. Check Player Collision
        if (proj.isHostile) {
          const distToPlayer = Math.hypot(nextPos[0] - playerPos.x, nextPos[2] - playerPos.z);
          if (distToPlayer < 0.65 && Math.abs(nextPos[1] - playerPos.y) < 1.4) {
            onPlayerDamage(proj.damage);
            sound.playHurt();
            continue;
          }
        }

        nextList.push({ ...proj, position: nextPos, life: nextLife });
      }
      projectilesRef.current = nextList;
    }
  });

  return null;
}
