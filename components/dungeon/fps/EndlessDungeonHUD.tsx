// components/dungeon/fps/EndlessDungeonHUD.tsx
// First-Person Endless Survival Dungeon HUD with Hotbar (reference image layout), Threat Director, and Vitality

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Shield,
  Zap,
  Timer,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  DoorOpen,
} from 'lucide-react';
import {
  InventorySlot,
  SurvivalItem,
  ThreatTierDef,
  PhysicalLootDrop,
  ExtractionState,
} from './types';
import { HotbarInventoryHUD } from './HotbarInventoryHUD';

interface EndlessDungeonHUDProps {
  playerHp: number;
  maxHp: number;
  playerShield: number;
  maxShield: number;
  playerStamina: number;
  maxStamina: number;
  survivalSeconds: number;
  currentTier: ThreatTierDef;
  tierProgress: number; // 0 to 1
  score: number;
  scoreMultiplier: number;
  kills: number;
  streak: number;
  inventorySlots: InventorySlot[];
  activeSlotIndex: number;
  ammo: { clip: number; reserve: number };
  isReloading: boolean;
  reloadProgress: number;
  hitmarkerPulse: { count: number; isCrit: boolean };
  damageVignette: boolean;
  nearbyLoot: PhysicalLootDrop | null;
  extractionState: ExtractionState;
  isScoped?: boolean;
  waveCountdown?: number;
  isHordeEnraged?: boolean;
  isRegeneratingHp?: boolean;
  isRegeneratingShield?: boolean;
  onSelectSlot: (index: number) => void;
  onUseItem: (index: number) => void;
}

export function EndlessDungeonHUD({
  playerHp,
  maxHp,
  playerShield,
  maxShield,
  playerStamina,
  maxStamina,
  survivalSeconds,
  currentTier,
  tierProgress,
  score,
  scoreMultiplier,
  kills,
  streak,
  inventorySlots,
  activeSlotIndex,
  ammo,
  isReloading,
  reloadProgress,
  hitmarkerPulse,
  damageVignette,
  nearbyLoot,
  extractionState,
  isScoped,
  waveCountdown,
  isHordeEnraged,
  isRegeneratingHp,
  isRegeneratingShield,
  onSelectSlot,
  onUseItem,
}: EndlessDungeonHUDProps) {
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

  const hpPercent = Math.max(0, Math.min(100, (playerHp / maxHp) * 100));
  const shieldPercent = maxShield > 0 ? Math.max(0, Math.min(100, (playerShield / maxShield) * 100)) : 0;
  const staminaPercent = Math.max(0, Math.min(100, (playerStamina / maxStamina) * 100));

  const minutes = Math.floor(survivalSeconds / 60);
  const seconds = Math.floor(survivalSeconds % 60);
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const activeItem = inventorySlots[activeSlotIndex]?.item;
  const isWeapon = activeItem?.kind === 'weapon';

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden font-mono">
      {/* ─── 1. DAMAGE VIGNETTE FLASH ─────────────────────────────────── */}
      {damageVignette && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(239,68,68,0.5)_100%)] animate-pulse pointer-events-none" />
      )}

      {/* ─── 2. TOP HUD: SURVIVAL TIMER & THREAT DIRECTOR ─────────────── */}
      <div className="absolute top-20 inset-x-6 flex items-start justify-between">
        {/* Left: Survival Time & Kills */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-3 py-1.5 backdrop-blur-md shadow-lg">
            <Timer size={14} className="text-[#00FF66] animate-pulse" />
            <span className="text-[10px] text-white/50 uppercase tracking-widest">SURVIVED</span>
            <span className="text-base font-black text-white tracking-wider">{timeFormatted}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-white/60 px-1">
            <span>
              HOSTILES: <strong className="text-white font-bold">{kills}</strong>
            </span>
            {streak > 2 && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300 font-black">
                {streak} STREAK!
              </span>
            )}
          </div>
        </div>

        {/* Center: Threat Director Banner & Next Wave Countdown */}
        <div className="flex flex-col items-center">
          <div
            className="flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            style={{
              borderColor: `${currentTier.color}66`,
              backgroundColor: 'rgba(5,11,10,0.85)',
              boxShadow: `0 0 25px ${currentTier.color}25`,
            }}
          >
            <span
              className="h-2 w-2 rounded-full animate-ping"
              style={{ backgroundColor: currentTier.color }}
            />
            <span
              className="text-[11px] font-black uppercase tracking-widest"
              style={{ color: currentTier.color }}
            >
              TIER {currentTier.tier} // {currentTier.name}
            </span>
          </div>

          {/* Next Wave Countdown Warning */}
          {waveCountdown !== undefined && (
            <div
              className={`mt-1.5 flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${
                isHordeEnraged
                  ? 'border-rose-500 bg-rose-950/80 text-rose-300 animate-bounce'
                  : 'border-white/10 bg-black/60 text-amber-300'
              }`}
            >
              <AlertTriangle size={11} className={isHordeEnraged ? 'text-rose-400' : 'text-amber-400'} />
              <span>
                {isHordeEnraged
                  ? 'HORDE ENRAGED! CLEAR HOSTILES!'
                  : `NEXT HORDE WAVE IN: ${String(Math.floor(waveCountdown)).padStart(2, '0')}s`}
              </span>
            </div>
          )}

          {/* Progress bar to next threat escalation */}
          <div className="mt-1 h-1 w-48 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${tierProgress * 100}%`, backgroundColor: currentTier.color }}
            />
          </div>
        </div>


        {/* Right: Score & Extraction Banner */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-3 py-1.5 backdrop-blur-md shadow-lg">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-base font-black text-white">{score.toLocaleString()}</span>
            <span className="text-[10px] font-bold text-amber-400 font-mono">
              x{scoreMultiplier.toFixed(1)}
            </span>
          </div>

          {extractionState.isActive && (
            <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-950/80 px-2.5 py-1 text-[10px] text-cyan-300 font-black tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-bounce">
              <DoorOpen size={12} />
              EXTRACTION PORTAL ACTIVE
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. CENTER: CLEAN RETICLE & HITMARKER ──────────────────────── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Minimalist Minecraft / FPS style crosshair + */}
        <div className="relative flex items-center justify-center">
          <div className="h-4 w-0.5 bg-white/90 shadow-[0_0_4px_black]" />
          <div className="absolute h-0.5 w-4 bg-white/90 shadow-[0_0_4px_black]" />
          <div className="absolute h-1 w-1 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
        </div>

        {/* Hitmarker Flash (auto-dismisses after 150ms, no looping) */}
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
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-amber-300">
                CRIT
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── OPTICAL SCOPE OVERLAY (TOGGLED VIA [Q]) ──────────────────── */}
      {isScoped && (
        <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center animate-fadeIn">
          {/* Peripheral Darkened Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.85)_60%,rgba(0,0,0,0.98)_100%)]" />

          {/* Scope Outer Circular Frame */}
          <div className="relative flex items-center justify-center h-84 w-84 rounded-full border-2 border-cyan-400/50 shadow-[0_0_60px_rgba(34,211,238,0.35)]">
            {/* Inner Precision Ring */}
            <div className="h-64 w-64 rounded-full border border-cyan-400/25" />

            {/* Crosshair Hairlines */}
            <div className="absolute h-[1px] w-full bg-cyan-400/70" />
            <div className="absolute w-[1px] h-full bg-cyan-400/70" />

            {/* Center Laser Dot */}
            <div className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#22D3EE]" />

            {/* Rangefinder Mil-Ticks */}
            {[-60, -35, -15, 15, 35, 60].map((offset) => (
              <React.Fragment key={offset}>
                <div
                  className="absolute w-3 h-[1px] bg-cyan-400/80"
                  style={{ transform: `translateY(${offset}px)` }}
                />
                <div
                  className="absolute h-3 w-[1px] bg-cyan-400/80"
                  style={{ transform: `translateX(${offset}px)` }}
                />
              </React.Fragment>
            ))}

            {/* Scope Zoom Status Badge */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/40 bg-black/80 px-3 py-0.5 text-[10px] font-mono font-bold text-cyan-300 tracking-widest shadow-lg">
              [ OPTIC ZOOM 3.5X ACTIVE · PRESS Q TO EXIT ]
            </div>
          </div>
        </div>
      )}


      {/* ─── 4. CONTEXTUAL INTERACTION PROMPT (Center-Lower) ───────────── */}
      {nearbyLoot && (
        <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-xl border border-white/20 bg-black/90 px-4 py-2 shadow-2xl backdrop-blur-md">
          <span className="rounded bg-[#00FF66] px-1.5 py-0.5 text-xs font-black text-black">E</span>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase text-white tracking-wide">
              PICK UP: {nearbyLoot.item.name}
            </span>
            <span className="text-[10px] text-white/50">{nearbyLoot.item.description}</span>
          </div>
        </div>
      )}

      {/* Extraction Channeling Bar */}
      {extractionState.isChanneling && (
        <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 rounded-2xl border border-cyan-400 bg-black/95 p-4 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
          <span className="text-xs font-black text-cyan-300 uppercase tracking-widest animate-pulse">
            EXTRACTING OPERATIVE...
          </span>
          <div className="h-2 w-48 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-75"
              style={{ width: `${extractionState.channelProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── 5. BOTTOM-LEFT: PLAYER VITALITY ───────────────────────────── */}
      <div className="absolute bottom-6 left-6 w-60 rounded-2xl border border-white/10 bg-black/80 p-3.5 backdrop-blur-xl shadow-2xl pointer-events-auto">
        {/* Health */}
        <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
          <span className="flex items-center gap-1 text-rose-400">
            <Heart size={13} /> HP
          </span>
          <span>
            {Math.round(playerHp)} <span className="text-white/40">/ {maxHp}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2.5">
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
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2.5">
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
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-100"
            style={{ width: `${staminaPercent}%` }}
          />
        </div>

        {/* Out-of-Combat Auto-Regeneration Status */}
        {isRegeneratingHp && (
          <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-emerald-400 animate-pulse border-t border-emerald-500/20 pt-1.5">
            <Sparkles size={11} /> REFILLING HP (+60/s)...
          </div>
        )}
        {isRegeneratingShield && (
          <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-cyan-400 animate-pulse border-t border-cyan-500/20 pt-1.5">
            <Sparkles size={11} /> RECHARGING SHIELD (+30/s)...
          </div>
        )}
      </div>


      {/* ─── 6. BOTTOM-CENTER: THE REFERENCE IMAGE HOTBAR SLOTS ───────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <HotbarInventoryHUD
          slots={inventorySlots}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={onSelectSlot}
          onUseItem={onUseItem}
        />
      </div>

      {/* ─── 7. BOTTOM-RIGHT: WEAPON AMMO TELEMETRY ────────────────────── */}
      {isWeapon && (
        <div className="absolute bottom-6 right-6 w-56 rounded-2xl border border-white/10 bg-black/80 p-3.5 backdrop-blur-xl shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-white/50 tracking-wider">
              {activeItem.name}
            </span>
          </div>

          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white tracking-tight">{ammo.clip}</span>
            <span className="text-sm font-bold text-white/40">/ {ammo.reserve}</span>
          </div>

          {/* Reload Status */}
          {isReloading ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[9px] text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1 animate-spin">
                  <RefreshCw size={10} />
                </span>
                <span>RELOADING...</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${reloadProgress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-1 flex justify-between text-[8px] text-white/35">
              <span>[L-CLICK] FIRE</span>
              <span>[R] RELOAD</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
