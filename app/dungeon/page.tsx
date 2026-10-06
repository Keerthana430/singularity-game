'use client';

// app/dungeon/page.tsx
// Fundamental Redesign: First-Person Endless Survival Dungeon FPS
// Single Continuous Round, Continuous Threat Director, Physical 3D Loot, 5-Slot Hotbar & Extraction

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Coins,
  Crosshair,
  Flame,
  Heart,
  HelpCircle,
  Keyboard,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { sound, music } from '@/lib/audio';
import { EndlessDungeonCanvas } from '@/components/dungeon/fps/EndlessDungeonCanvas';
import { EndlessDungeonHUD } from '@/components/dungeon/fps/EndlessDungeonHUD';
import { DungeonTitleScreen } from '@/components/dungeon/fps/DungeonTitleScreen';
import { RunSummaryModal } from '@/components/dungeon/fps/RunSummaryModal';
import { FPSPauseModal } from '@/components/dungeon/fps/FPSPauseModal';
import { FPSControlsSettingsModal } from '@/components/dungeon/fps/FPSControlsSettingsModal';
import {
  WeaponId,
  WEAPON_CONFIGS,
  FPSEnemyEntity,
  FPSSettings,
  InventorySlot,
  PhysicalLootDrop,
  ExtractionState,
  RunStats,
  THREAT_TIERS,
} from '@/components/dungeon/fps/types';
import { evaluateDirector } from '@/components/dungeon/fps/DifficultyDirector';
import { createInitialInventory } from '@/components/dungeon/fps/LootCatalog';

type PageMode = 'title' | 'survival' | 'summary';

interface PersistentStorage {
  bestSurvivalSeconds: number;
  bestScore: number;
  totalKills: number;
  totalRuns: number;
}

const STORAGE_KEY = 'singularity_endless_dungeon_records';

function loadRecords(): PersistentStorage {
  if (typeof window === 'undefined') {
    return { bestSurvivalSeconds: 0, bestScore: 0, totalKills: 0, totalRuns: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load dungeon records', e);
  }
  return { bestSurvivalSeconds: 0, bestScore: 0, totalKills: 0, totalRuns: 0 };
}

function saveRecords(data: PersistentStorage) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save dungeon records', e);
  }
}

export default function DungeonPage() {
  const { currentAvatar } = useAvatarStore();
  const baseStats = useMemo(() => calculateAvatarStats(currentAvatar), [currentAvatar]);

  // Game Flow State
  const [mode, setMode] = useState<PageMode>('title');
  const [isPaused, setIsPaused] = useState(false);
  const [records, setRecords] = useState<PersistentStorage>({
    bestSurvivalSeconds: 0,
    bestScore: 0,
    totalKills: 0,
    totalRuns: 0,
  });
  const [showControlsModal, setShowControlsModal] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  // Survival Run State
  const [survivalSeconds, setSurvivalSeconds] = useState(0);
  const [kills, setKills] = useState(0);
  const [eliteKills, setEliteKills] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [score, setScore] = useState(0);

  // Player Vitality
  const [playerHp, setPlayerHp] = useState(1000);
  const maxHp = baseStats?.maxHp ? Math.max(1000, baseStats.maxHp) : 1000;
  const [playerShield, setPlayerShield] = useState(150);
  const maxShield = 150;
  const [playerStamina, setPlayerStamina] = useState(100);
  const maxStamina = 100;

  // 5-Slot Hotbar Inventory (Minecraft / FPS style)
  const [inventorySlots, setInventorySlots] = useState<InventorySlot[]>(() => createInitialInventory());
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);

  // Weapon Ammo State for carried firearms
  const [weaponAmmo, setWeaponAmmo] = useState<Record<WeaponId, { clip: number; reserve: number }>>({
    pulse_rifle: { clip: 30, reserve: 150 },
    energy_pistol: { clip: 12, reserve: 72 },
    plasma_shotgun: { clip: 6, reserve: 30 },
    void_railgun: { clip: 4, reserve: 16 },
  });
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);

  // Combat Visual Telemetry
  const [hitmarkerPulse, setHitmarkerPulse] = useState({ count: 0, isCrit: false });
  const [damageVignette, setDamageVignette] = useState(false);

  // Temporary Buffs (Overdrive Stim)
  const [damageBuffUntil, setDamageBuffUntil] = useState(0);

  // Physical 3D Loot in World
  const [lootDrops, setLootDrops] = useState<PhysicalLootDrop[]>([]);
  const [nearbyLoot, setNearbyLoot] = useState<PhysicalLootDrop | null>(null);

  // Extraction System (activates at intervals)
  const [extractionState, setExtractionState] = useState<ExtractionState>({
    isActive: false,
    position: [0, 0, -9.5],
    channelProgress: 0,
    isChanneling: false,
    nextActivationSeconds: 120, // first portal opens at 2:00
  });

  // Post-Game Run Summary Stats
  const [finalRunStats, setFinalRunStats] = useState<RunStats | null>(null);

  // FPS Settings
  const [fpsSettings, setFpsSettings] = useState<FPSSettings>({
    mouseSensitivity: 0.0022,
    invertY: false,
    screenShake: true,
    fov: 75,
  });

  // Optical Scope State (Toggled via Q or Right-Click with firearm)
  const [isScoped, setIsScoped] = useState(false);
  const handleToggleScope = useCallback(() => setIsScoped((s) => !s), []);

  // Next Wave Countdown & Anti-Stall Horde Enrage
  const [waveCountdown, setWaveCountdown] = useState(16);
  const [isHordeEnraged, setIsHordeEnraged] = useState(false);

  // Out-of-Combat Auto-Regeneration (5s without damage -> Refill HP -> Refill Shield)
  const lastDamagedTimeRef = useRef(0);
  const [isRegeneratingHp, setIsRegeneratingHp] = useState(false);
  const [isRegeneratingShield, setIsRegeneratingShield] = useState(false);

  // Reset scope when switching hotbar slot or reloading
  useEffect(() => {
    setIsScoped(false);
  }, [activeSlotIndex, isReloading]);

  // Difficulty Director Evaluation
  const director = useMemo(() => evaluateDirector(survivalSeconds, kills), [survivalSeconds, kills]);

  const activeItem = inventorySlots[activeSlotIndex]?.item || null;
  const currentWeaponId: WeaponId =
    activeItem?.kind === 'weapon' && activeItem.weaponId ? activeItem.weaponId : 'pulse_rifle';
  const currentAmmo = weaponAmmo[currentWeaponId] || { clip: 30, reserve: 150 };

  const damageBuffActive = performance.now() < damageBuffUntil;
  const damageBuffMultiplier = damageBuffActive ? 1.5 : 1.0;

  // ─── 5-SECOND OUT-OF-COMBAT HP & SHIELD AUTO-REGENERATION ───────────────────
  useEffect(() => {
    if (mode !== 'survival' || isPaused) return;

    const regenInterval = window.setInterval(() => {
      const now = performance.now();
      const timeSinceDamage = now - lastDamagedTimeRef.current;

      // When not attacked for 5 seconds:
      if (timeSinceDamage >= 5000) {
        setPlayerHp((curHp) => {
          if (curHp < maxHp) {
            setIsRegeneratingHp(true);
            setIsRegeneratingShield(false);
            return Math.min(maxHp, curHp + 6); // Smooth +60 HP/sec
          } else {
            setIsRegeneratingHp(false);
            // Once HP reaches 100%, shield regenerates!
            setPlayerShield((curShield) => {
              if (curShield < maxShield) {
                setIsRegeneratingShield(true);
                return Math.min(maxShield, curShield + 3); // Smooth +30 Shield/sec
              } else {
                setIsRegeneratingShield(false);
                return curShield;
              }
            });
            return curHp;
          }
        });
      } else {
        setIsRegeneratingHp(false);
        setIsRegeneratingShield(false);
      }
    }, 100);

    return () => window.clearInterval(regenInterval);
  }, [isPaused, maxHp, maxShield, mode]);

  // ─── RUN CLOCK, WAVE DIRECTOR, AND LOOT DESPAWN ────────────────────────────
  useEffect(() => {
    if (mode !== 'survival' || isPaused) return;

    const interval = window.setInterval(() => {
      setSurvivalSeconds((prev) => {
        const next = prev + 1;

        // Wave countdown timer & anti-stall enrage warning
        setWaveCountdown((curr) => {
          if (curr <= 1) {
            // Player delayed / avoided horde -> Enrage enemies!
            setIsHordeEnraged(true);
            sound.playBossCharge();
            return 16; // Reset for next assault wave
          }
          return curr - 1;
        });

        // 30-Second Loot Despawn: Clean up old clutter to maintain high performance
        const now = performance.now();
        setLootDrops((drops) => drops.filter((d) => now - (d.dropTime || now) < 30000));

        // Periodic Extraction Portal Activation logic
        const cycle = next % 150;
        const shouldBeActive = cycle >= 105 && cycle < 150;

        setExtractionState((curr) => {
          if (shouldBeActive && !curr.isActive) {
            sound.playOverdrive();
          }
          return {
            ...curr,
            isActive: shouldBeActive,
          };
        });

        // Passive stamina recovery
        setPlayerStamina((st) => Math.min(100, st + 2));

        // Score tick for surviving
        setScore((sc) => sc + Math.round(15 * (1 + director.tierIndex * 0.25)));

        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [director.tierIndex, isPaused, mode]);

  // ─── START / RESTART RUN (CLEAN SLATE RESET) ───────────────────────────────
  const startRun = useCallback(() => {
    // 1. Reset Time & Directors
    setSurvivalSeconds(0);
    setKills(0);
    setEliteKills(0);
    setStreak(0);
    setHighestStreak(0);
    setScore(0);

    // 2. Reset Player Vitals
    setPlayerHp(maxHp);
    setPlayerShield(maxShield);
    setPlayerStamina(maxStamina);

    // 3. Reset 5-Slot Hotbar Inventory
    setInventorySlots(createInitialInventory());
    setActiveSlotIndex(0);

    // 4. Reset Carried Ammo
    setWeaponAmmo({
      pulse_rifle: { clip: 30, reserve: 150 },
      energy_pistol: { clip: 12, reserve: 72 },
      plasma_shotgun: { clip: 6, reserve: 30 },
      void_railgun: { clip: 4, reserve: 16 },
    });
    setIsReloading(false);
    setReloadProgress(0);

    // 5. Clear Drops & Extraction State
    setLootDrops([]);
    setNearbyLoot(null);
    setExtractionState({
      isActive: false,
      position: [0, 0, -9.5],
      channelProgress: 0,
      isChanneling: false,
      nextActivationSeconds: 120,
    });

    // 6. Reset Buffs & UI
    setDamageBuffUntil(0);
    setDamageVignette(false);
    setIsPaused(false);
    setFinalRunStats(null);
    setIsScoped(false);
    setWaveCountdown(16);
    setIsHordeEnraged(false);
    lastDamagedTimeRef.current = 0;
    setIsRegeneratingHp(false);
    setIsRegeneratingShield(false);

    // 7. Transition Mode
    setMode('survival');
    sound.playWhoosh();
  }, [maxHp, maxShield, maxStamina]);

  // ─── END RUN (DEATH OR EXTRACTION) ─────────────────────────────────────────
  const endRun = useCallback(
    (extracted: boolean) => {
      // Calculate final weighted score
      const base = survivalSeconds * 40 + kills * 150 + eliteKills * 500 + highestStreak * 60;
      const multiplier = (1 + director.tierIndex * 0.35) * (extracted ? 1.6 : 1.0);
      const finalScore = Math.round(base * multiplier);
      const coinsEarned = Math.round(finalScore / 12);

      const runStats: RunStats = {
        survivalSeconds,
        threatTier: director.currentTier.tier,
        kills,
        eliteKills,
        bossKills: 0,
        highestStreak,
        currentStreak: streak,
        damageDealt: 0,
        lootCollected: 0,
        score: finalScore,
        extracted,
        coinsEarned,
        soulShardsEarned: extracted ? Math.floor(finalScore / 250) : 0,
      };

      setFinalRunStats(runStats);
      setMode('summary');

      // Update persistent records
      setRecords((prev) => {
        const nextRecords: PersistentStorage = {
          bestSurvivalSeconds: Math.max(prev.bestSurvivalSeconds, survivalSeconds),
          bestScore: Math.max(prev.bestScore, finalScore),
          totalKills: prev.totalKills + kills,
          totalRuns: prev.totalRuns + 1,
        };
        saveRecords(nextRecords);
        return nextRecords;
      });

      if (extracted) {
        sound.playWin();
      } else {
        sound.playHurt();
      }
    },
    [director.currentTier.tier, director.tierIndex, eliteKills, highestStreak, kills, streak, survivalSeconds]
  );

  // ─── PLAYER DAMAGE HANDLER ────────────────────────────────────────────────
  const handlePlayerDamage = useCallback(
    (amount: number) => {
      if (mode !== 'survival') return;

      // Reset kill streak
      setStreak(0);

      // Reset out-of-combat damage timer (delays auto-regen by 5 seconds)
      lastDamagedTimeRef.current = performance.now();
      setIsRegeneratingHp(false);
      setIsRegeneratingShield(false);

      // Flash damage vignette
      setDamageVignette(true);
      window.setTimeout(() => setDamageVignette(false), 350);

      let died = false;
      // Shields absorb damage first
      setPlayerShield((curShield) => {
        let remaining = amount;
        let nextShield = curShield;

        if (curShield > 0) {
          if (curShield >= remaining) {
            nextShield -= remaining;
            remaining = 0;
          } else {
            remaining -= curShield;
            nextShield = 0;
            sound.playShieldBreak();
          }
        }

        if (remaining > 0) {
          setPlayerHp((curHp) => {
            const nextHp = Math.max(0, curHp - remaining);
            if (nextHp <= 0) {
              died = true;
            }
            return nextHp;
          });
        }

        return nextShield;
      });

      if (died) {
        endRun(false);
      }
    },
    [endRun, mode]
  );

  // ─── ENEMY KILLED HANDLER ──────────────────────────────────────────────────
  const handleEnemyKilled = useCallback(
    (enemy: FPSEnemyEntity, droppedLoot: PhysicalLootDrop | null) => {
      setKills((k) => k + 1);
      const isElite = enemy.archetype === 'elite' || enemy.archetype === 'boss';
      if (isElite) setEliteKills((ek) => ek + 1);

      setStreak((s) => s + 1);
      setHighestStreak((hs) => Math.max(hs, streak + 1));

      // Spawn physical loot drop in 3D world (if dropped at max 30% rate)
      if (droppedLoot) {
        setLootDrops((drops) => [...drops, droppedLoot]);
      }

      // Actively killing hostiles calms down the horde enrage
      setIsHordeEnraged(false);

      // Add combat score
      setScore((sc) => sc + (isElite ? 450 : 120));
    },
    []
  );

  // ─── PHYSICAL LOOT PICKUP & INVENTORY MANAGEMENT ───────────────────────────
  const handlePickupLoot = useCallback(
    (dropId: string) => {
      const drop = lootDrops.find((d) => d.id === dropId);
      if (!drop) return;

      // Remove drop from 3D world
      setLootDrops((prev) => prev.filter((d) => d.id !== dropId));
      setNearbyLoot(null);

      const item = drop.item;

      // If ammo box item, directly replenish reserves
      if (item.kind === 'ammo' && item.stats?.ammoRestore) {
        const amt = item.stats.ammoRestore;
        setWeaponAmmo((prev) => {
          const next = { ...prev };
          (Object.keys(next) as WeaponId[]).forEach((wId) => {
            next[wId] = {
              clip: next[wId].clip,
              reserve: Math.min(WEAPON_CONFIGS[wId].reserveMax, next[wId].reserve + amt),
            };
          });
          return next;
        });
        sound.playCoin();
        return;
      }

      setInventorySlots((slots) => {
        const nextSlots = [...slots];

        // Case 1: Stackable consumable already in hotbar
        if (item.kind === 'consumable') {
          const matchingSlotIdx = nextSlots.findIndex(
            (s) => s.item && s.item.name === item.name && (s.item.quantity || 1) < (s.item.maxQuantity || 3)
          );
          if (matchingSlotIdx !== -1) {
            const existing = nextSlots[matchingSlotIdx].item!;
            nextSlots[matchingSlotIdx] = {
              ...nextSlots[matchingSlotIdx],
              item: { ...existing, quantity: (existing.quantity || 1) + 1 },
            };
            sound.playEquip();
            return nextSlots;
          }
        }

        // Case 2: Active slot is empty -> place here
        if (!nextSlots[activeSlotIndex]?.item) {
          nextSlots[activeSlotIndex] = { index: activeSlotIndex, item };
          sound.playEquip();
          return nextSlots;
        }

        // Case 3: Empty slot somewhere else in the 5 slots
        const emptyIdx = nextSlots.findIndex((s) => !s.item);
        if (emptyIdx !== -1) {
          nextSlots[emptyIdx] = { index: emptyIdx, item };
          sound.playEquip();
          return nextSlots;
        }

        // Case 4: INVENTORY FULL -> MEANINGFUL SWAP DECISION
        // Drop the current active item onto the ground as physical loot
        const activeItemToDrop = nextSlots[activeSlotIndex].item;
        if (activeItemToDrop) {
          const newDrop: PhysicalLootDrop = {
            id: `swapped-${Date.now()}-${Math.random()}`,
            item: activeItemToDrop,
            position: [drop.position[0], 0.2, drop.position[2]],
            dropTime: performance.now(),
          };
          setLootDrops((prev) => [...prev, newDrop]);
        }

        // Replace active slot with new item
        nextSlots[activeSlotIndex] = { index: activeSlotIndex, item };
        sound.playEquip();
        return nextSlots;
      });
    },
    [activeSlotIndex, lootDrops]
  );

  // ─── CONSUMABLE / ACTIVE ITEM USE HANDLER ──────────────────────────────────
  const handleUseItem = useCallback(
    (slotIdx: number) => {
      const slot = inventorySlots[slotIdx];
      const item = slot?.item;
      if (!item || item.kind !== 'consumable') return;

      // Apply item effects
      if (item.stats?.healthRestore) {
        setPlayerHp((hp) => Math.min(maxHp, hp + item.stats!.healthRestore!));
        sound.playPotion();
      }

      if (item.stats?.shieldRestore) {
        setPlayerShield((sh) => Math.min(maxShield, sh + item.stats!.shieldRestore!));
        sound.playPotion();
      }

      if (item.stats?.damageBonus && item.stats?.buffDuration) {
        setDamageBuffUntil(performance.now() + item.stats.buffDuration * 1000);
        sound.playOverdrive();
      }

      // Decrement quantity stack
      setInventorySlots((slots) => {
        const next = [...slots];
        const cur = next[slotIdx].item;
        if (!cur) return next;

        const curQty = cur.quantity || 1;
        if (curQty > 1) {
          next[slotIdx] = { ...next[slotIdx], item: { ...cur, quantity: curQty - 1 } };
        } else {
          next[slotIdx] = { index: slotIdx, item: null };
        }
        return next;
      });
    },
    [inventorySlots, maxHp, maxShield]
  );

  // ─── MOUSE WHEEL HOTBAR CYCLING ────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'survival' || isPaused) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        setActiveSlotIndex((prev) => (prev + 1) % 5);
      } else if (e.deltaY < 0) {
        setActiveSlotIndex((prev) => (prev - 1 + 5) % 5);
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isPaused, mode]);

  // ─── KEYBOARD SHORTCUTS (ESC TO PAUSE) ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && mode === 'survival') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black font-mono text-white select-none">
      {/* ══════════════════════════════════════════════════════════════════════
          MODE 1: TACTICAL BRIEFING / TITLE SCREEN
      ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'title' && (
        <DungeonTitleScreen
          onDeploy={startRun}
          onOpenControls={() => setShowControlsModal(true)}
          bestSurvivalSeconds={records.bestSurvivalSeconds}
          bestScore={records.bestScore}
          totalKills={records.totalKills}
          maxHp={maxHp}
          maxShield={maxShield}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 2: LIVE FIRST-PERSON ENDLESS SURVIVAL FPS
      ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'survival' && (
        <div className="relative h-full w-full">
          {/* 3D R3F Canvas */}
          <EndlessDungeonCanvas
            survivalSeconds={survivalSeconds}
            kills={kills}
            playerHp={playerHp}
            maxHp={maxHp}
            playerShield={playerShield}
            maxShield={maxShield}
            activeItem={activeItem}
            ammo={currentAmmo}
            isReloading={isReloading}
            reloadProgress={reloadProgress}
            settings={fpsSettings}
            isPaused={isPaused}
            damageBuffMultiplier={damageBuffMultiplier}
            lootDrops={lootDrops}
            extractionState={extractionState}
            nearbyLoot={nearbyLoot}
            isScoped={isScoped}
            waveCountdown={waveCountdown}
            isHordeEnraged={isHordeEnraged}
            onToggleScope={handleToggleScope}
            onPlayerDamage={handlePlayerDamage}
            onEnemyKilled={handleEnemyKilled}
            onAmmoChange={(newAmmo) => {
              setWeaponAmmo((prev) => ({ ...prev, [currentWeaponId]: newAmmo }));
            }}
            onReloadStateChange={(reloading, progress) => {
              setIsReloading(reloading);
              setReloadProgress(progress);
            }}
            onHitmarker={(isCrit) => {
              setHitmarkerPulse({ count: Date.now(), isCrit });
              window.setTimeout(() => {
                setHitmarkerPulse((prev) => (Date.now() - prev.count >= 140 ? { count: 0, isCrit: false } : prev));
              }, 160);
            }}
            onNearbyLootChange={setNearbyLoot}
            onPickupLoot={handlePickupLoot}
            onExtractionChannel={(progress, channeling) => {
              setExtractionState((prev) => ({
                ...prev,
                channelProgress: progress,
                isChanneling: channeling,
              }));
            }}
            onExtract={() => endRun(true)}
            onSelectSlotIndex={setActiveSlotIndex}
            onUseActiveItem={() => handleUseItem(activeSlotIndex)}
          />

          {/* Full HUD Overlay */}
          <EndlessDungeonHUD
            playerHp={playerHp}
            maxHp={maxHp}
            playerShield={playerShield}
            maxShield={maxShield}
            playerStamina={playerStamina}
            maxStamina={maxStamina}
            survivalSeconds={survivalSeconds}
            currentTier={director.currentTier}
            tierProgress={director.threatProgress}
            score={score}
            scoreMultiplier={1 + director.tierIndex * 0.25}
            kills={kills}
            streak={streak}
            inventorySlots={inventorySlots}
            activeSlotIndex={activeSlotIndex}
            ammo={currentAmmo}
            isReloading={isReloading}
            reloadProgress={reloadProgress}
            hitmarkerPulse={hitmarkerPulse}
            damageVignette={damageVignette}
            nearbyLoot={nearbyLoot}
            extractionState={extractionState}
            isScoped={isScoped}
            waveCountdown={waveCountdown}
            isHordeEnraged={isHordeEnraged}
            isRegeneratingHp={isRegeneratingHp}
            isRegeneratingShield={isRegeneratingShield}
            onSelectSlot={setActiveSlotIndex}
            onUseItem={handleUseItem}
          />

          {/* Tactical Pause Button (Top-Right Micro) */}
          <button
            onClick={() => setIsPaused(true)}
            className="absolute top-20 right-6 z-40 rounded-xl border border-white/15 bg-black/75 p-2 text-white/70 hover:border-white/40 hover:text-white backdrop-blur-md"
            title="Tactical Pause [ESC]"
          >
            <Pause size={14} />
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODE 3: POST-GAME RUN SUMMARY MODAL (DEATH OR EXTRACTION)
      ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'summary' && finalRunStats && (
        <RunSummaryModal
          stats={finalRunStats}
          onRestart={startRun}
          onReturnToHub={() => setMode('title')}
        />
      )}

      {/* ─── IN-GAME PAUSE MODAL ────────────────────────────────────────────── */}
      <FPSPauseModal
        isOpen={isPaused}
        onClose={() => setIsPaused(false)}
        settings={fpsSettings}
        onUpdateSettings={(newSettings) => setFpsSettings((s) => ({ ...s, ...newSettings }))}
        onRestart={startRun}
        onAbandon={() => {
          setIsPaused(false);
          setMode('title');
        }}
      />

      {/* ─── FPS CONTROLS INTEL MODAL ───────────────────────────────────────── */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#07120C] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black uppercase text-[#00FF66] flex items-center gap-2">
                <Keyboard size={16} /> OPERATIVE CONTROLS CHEATSHEET
              </h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {[
                { key: 'W / A / S / D', desc: 'Operative Movement & Strafing' },
                { key: 'MOUSE LOOK', desc: 'First-Person Aiming & Reticle' },
                { key: 'LEFT CLICK', desc: 'Fire Active Weapon' },
                { key: 'Q / RIGHT CLICK', desc: 'Toggle Weapon Optical Scope (3.5x Zoom) / Use Consumable' },
                { key: 'R', desc: 'Reload Active Weapon' },
                { key: 'SHIFT', desc: 'Sprint / Tactical Dash' },
                { key: 'SPACE', desc: 'Jump / Evade' },
                { key: '1 – 5 / WHEEL', desc: 'Select Hotbar Inventory Slot' },
                { key: 'E', desc: 'Pick Up Loot / Hold to Channel Extraction' },
                { key: 'PASSIVE', desc: 'HP Auto-Refills after 5s not attacked, then Shields refill' },
                { key: 'ESC', desc: 'Tactical Pause & Settings' },
              ].map((c) => (
                <div
                  key={c.key}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2"
                >
                  <span className="font-mono font-bold text-[#00FF66]">{c.key}</span>
                  <span className="text-white/70">{c.desc}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowControlsModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl border border-white/20 bg-white/[0.05] font-bold text-xs hover:bg-white/10"
            >
              Close Intel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
