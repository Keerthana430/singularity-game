// components/dungeon/fps/FPSHUD.tsx
// Cyber-Anime Sci-Fi FPS HUD with Dynamic Reticle, Hitmarkers, Ammo Telemetry, Radar, and Boss Bar

import React, { useState, useEffect } from 'react';
import { Shield, Heart, Zap, Crosshair, AlertCircle, RefreshCw } from 'lucide-react';
import { WeaponId, WEAPON_CONFIGS, FPSEnemyEntity } from './types';

interface FPSHUDProps {
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
  isMoving: boolean;
  isSprinting: boolean;
  hitmarkerPulse: { count: number; isCrit: boolean };
  damageVignette: boolean;
  enemies: FPSEnemyEntity[];
  bossEnemy?: FPSEnemyEntity;
  floor: number;
  roomName: string;
  onSelectWeapon: (weapon: WeaponId) => void;
  onUsePotion: () => void;
  potionCount: number;
  interactPrompt?: string | null;
  onInteract?: () => void;
}

export function FPSHUD({
  playerHp,
  maxHp,
  playerShield,
  maxShield,
  playerStamina,
  maxStamina,
  currentWeapon,
  ammo,
  isReloading,
  reloadProgress,
  isMoving,
  isSprinting,
  hitmarkerPulse,
  damageVignette,
  enemies,
  bossEnemy,
  floor,
  roomName,
  onSelectWeapon,
  onUsePotion,
  potionCount,
  interactPrompt,
}: FPSHUDProps) {
  const [hitmarkerVisible, setHitmarkerVisible] = useState(false);

  useEffect(() => {
    if (hitmarkerPulse.count > 0) {
      setHitmarkerVisible(true);
      const timer = setTimeout(() => {
        setHitmarkerVisible(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setHitmarkerVisible(false);
    }
  }, [hitmarkerPulse.count]);

  const weaponDef = WEAPON_CONFIGS[currentWeapon];
  const hpPercent = Math.max(0, Math.min(100, (playerHp / maxHp) * 100));
  const shieldPercent = maxShield > 0 ? Math.max(0, Math.min(100, (playerShield / maxShield) * 100)) : 0;
  const staminaPercent = Math.max(0, Math.min(100, (playerStamina / maxStamina) * 100));

  // Dynamic crosshair spread distance
  const baseSpread = isSprinting ? 24 : isMoving ? 16 : 8;

  // Active enemies alive count
  const aliveEnemies = enemies.filter((e) => e.hp > 0);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden font-mono">
      {/* ─── 1. DAMAGE VIGNETTE ────────────────────────────────────────── */}
      {damageVignette && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(239,68,68,0.45)_100%)] animate-pulse pointer-events-none" />
      )}

      {/* ─── 2. DYNAMIC CROSSHAIR & HITMARKER ─────────────────────────── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Center dot */}
        <div className="h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />

        {/* 4 Brackets with dynamic spread */}
        <div
          className="absolute h-3 w-0.5 -translate-x-1/2 bg-[#00FF66]/80 transition-all duration-75"
          style={{ top: `-${baseSpread + 12}px` }}
        />
        <div
          className="absolute h-3 w-0.5 -translate-x-1/2 bg-[#00FF66]/80 transition-all duration-75"
          style={{ top: `${baseSpread}px` }}
        />
        <div
          className="absolute h-0.5 w-3 -translate-y-1/2 bg-[#00FF66]/80 transition-all duration-75"
          style={{ left: `-${baseSpread + 12}px` }}
        />
        <div
          className="absolute h-0.5 w-3 -translate-y-1/2 bg-[#00FF66]/80 transition-all duration-75"
          style={{ left: `${baseSpread}px` }}
        />

        {/* Dynamic Hitmarker Tickmarks (auto-dismisses after 150ms, no looping) */}
        {hitmarkerVisible && (
          <div className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform scale-110">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6L9 9M18 6L15 9M6 18L9 15M18 18L15 15"
                stroke={hitmarkerPulse.isCrit ? '#FBBF24' : '#FFFFFF'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            {hitmarkerPulse.isCrit && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-300 tracking-wider">
                CRIT
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── 3. TOP MISSION & OBJECTIVE BANNER ─────────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="flex items-center gap-2 rounded-full border border-[#00FF66]/30 bg-black/80 px-4 py-1 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,102,0.15)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#00FF66]">
            FLOOR {floor + 1} // {roomName}
          </span>
          <span className="text-white/30 text-xs">|</span>
          <span className="text-[10px] text-white/70">
            HOSTILES: <span className="font-bold text-white">{aliveEnemies.length}</span>
          </span>
        </div>

        {/* Boss Health Bar (if active) */}
        {bossEnemy && bossEnemy.hp > 0 && (
          <div className="mt-3 w-[min(540px,85vw)] rounded-xl border border-rose-500/40 bg-black/85 p-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(244,63,94,0.25)]">
            <div className="flex items-center justify-between text-[10px] uppercase mb-1">
              <span className="font-black text-rose-400 tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} /> {bossEnemy.name}
              </span>
              <span className="text-amber-400 font-bold">
                PHASE {bossEnemy.bossPhase || 1} / 3
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-black/80 border border-white/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-150"
                style={{ width: `${Math.max(0, (bossEnemy.hp / bossEnemy.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. INTERACTION PROMPT (Center Screen) ─────────────────────── */}
      {interactPrompt && (
        <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-xl border border-[#00FF66]/60 bg-black/90 px-4 py-2 shadow-[0_0_20px_rgba(0,255,102,0.3)]">
          <span className="rounded bg-[#00FF66] px-1.5 py-0.5 text-xs font-black text-black">E</span>
          <span className="text-xs font-bold text-white tracking-wide">{interactPrompt}</span>
        </div>
      )}

      {/* ─── 5. BOTTOM-LEFT: PLAYER VITALITY ───────────────────────────── */}
      <div className="absolute bottom-6 left-6 w-64 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] pointer-events-auto">
        {/* Health */}
        <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
          <span className="flex items-center gap-1 text-rose-400">
            <Heart size={13} /> HP
          </span>
          <span>
            {Math.round(playerHp)} <span className="text-white/40">/ {maxHp}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-200"
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Shield */}
        <div className="flex items-center justify-between text-[10px] text-white/70 mb-1">
          <span className="flex items-center gap-1 text-cyan-400">
            <Shield size={12} /> SHIELD
          </span>
          <span>
            {Math.round(playerShield)} <span className="text-white/40">/ {maxShield}</span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-3">
          <div
            className="h-full bg-cyan-400 transition-all duration-200"
            style={{ width: `${shieldPercent}%` }}
          />
        </div>

        {/* Stamina */}
        <div className="flex items-center justify-between text-[10px] text-white/70 mb-1">
          <span className="flex items-center gap-1 text-amber-300">
            <Zap size={12} /> STAMINA
          </span>
          <span>{Math.round(playerStamina)}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-3">
          <div
            className="h-full bg-amber-400 transition-all duration-100"
            style={{ width: `${staminaPercent}%` }}
          />
        </div>

        {/* Potion / Medkit Hotkey */}
        <button
          onClick={onUsePotion}
          className="w-full flex items-center justify-between rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-bold text-white hover:border-[#00FF66]/60 transition-colors"
        >
          <span className="flex items-center gap-1">
            <span className="rounded bg-white/20 px-1 py-0.5 text-[9px] font-mono">Q</span> HEAL
          </span>
          <span className="text-[#00FF66] font-bold">{potionCount} REMAINING</span>
        </button>
      </div>

      {/* ─── 6. BOTTOM-RIGHT: WEAPON ARSENAL & AMMO ────────────────────── */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end pointer-events-auto">
        {/* Weapon Quick Switcher */}
        <div className="flex gap-2 mb-3">
          {(['pulse_rifle', 'energy_pistol', 'plasma_shotgun'] as WeaponId[]).map((wId, i) => {
            const active = currentWeapon === wId;
            const w = WEAPON_CONFIGS[wId];
            return (
              <button
                key={wId}
                onClick={() => onSelectWeapon(wId)}
                className={`rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                  active
                    ? 'border-[#00FF66] bg-[#00FF66]/20 text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                    : 'border-white/15 bg-black/60 text-white/60 hover:border-white/40'
                }`}
              >
                <span className="font-mono text-white/40">{i + 1}</span>
                {w.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Ammo Display Box */}
        <div className="w-64 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/45">
              {weaponDef.category} // {weaponDef.name}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-4xl font-black text-white tracking-tight">
              {ammo.clip}
            </span>
            <span className="text-sm font-bold text-white/45">
              / {ammo.reserve}
            </span>
          </div>

          {/* Reload indicator */}
          {isReloading ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1 animate-spin">
                  <RefreshCw size={11} />
                </span>
                <span>RELOADING...</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, reloadProgress * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-2 flex justify-between text-[9px] text-white/40">
              <span>[L-CLICK] FIRE</span>
              <span>[R] RELOAD</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
