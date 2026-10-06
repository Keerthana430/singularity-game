// components/dungeon/fps/DungeonTitleScreen.tsx
// AAA-Tier Uncluttered Cinematic Title Screen for the First-Person Endless Survival Dungeon FPS
// Atmospheric 3D subterranean backdrop, focused typography, visceral deploy CTA, and slide-out Tactical Codex

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Crosshair,
  Shield,
  Heart,
  Zap,
  Timer,
  BookOpen,
  Keyboard,
  DoorOpen,
  Skull,
  Radio,
  Flame,
  Volume2,
  X,
  Target,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { sound } from '@/lib/audio';
import { useAvatarStore } from '@/store/avatarStore';
import { DungeonCinematicCanvas } from './DungeonCinematicCanvas';

interface DungeonTitleScreenProps {
  onDeploy: () => void;
  onOpenControls: () => void;
  bestSurvivalSeconds: number;
  bestScore: number;
  totalKills: number;
  maxHp: number;
  maxShield: number;
}

type CodexTab = 'arsenal' | 'monsters' | 'threat' | 'extraction';

export function DungeonTitleScreen({
  onDeploy,
  onOpenControls,
  bestSurvivalSeconds,
  bestScore,
  totalKills,
  maxHp,
  maxShield,
}: DungeonTitleScreenProps) {
  const { currentAvatar } = useAvatarStore();
  const [showCodex, setShowCodex] = useState(false);
  const [activeTab, setActiveTab] = useState<CodexTab>('arsenal');

  const formattedBestTime = `${Math.floor(bestSurvivalSeconds / 60)}:${String(
    bestSurvivalSeconds % 60
  ).padStart(2, '0')}`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#040906] font-mono text-white select-none">
      {/* ─── 1. REAL-TIME 3D CINEMATIC CAVERN BACKGROUND ─────────────────── */}
      <DungeonCinematicCanvas />

      {/* ─── 2. TOP PERIMETER HUD ────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-6 pointer-events-auto">
        <Link
          href="/lobby"
          onMouseEnter={() => sound.playHover()}
          onClick={() => sound.playClick()}
          className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs font-bold text-white/70 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/10 hover:text-white transition-all backdrop-blur-md shadow-lg"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          <span>RETURN TO HUB</span>
        </Link>

        {/* Operative Vitals & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span className="text-xs font-black tracking-wider text-white">
                {currentAvatar.name || 'KAGE-07'}
              </span>
              <span className="text-[10px] font-bold text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20 px-1.5 py-0.5 rounded uppercase">
                {currentAvatar.classRole || 'TANK'}
              </span>
            </div>
            <div className="h-3 w-px bg-white/20" />
            <div className="flex items-center gap-3 text-[11px] text-white/60">
              <span className="flex items-center gap-1 text-emerald-400">
                <Heart size={12} fill="currentColor" /> {maxHp}
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield size={12} fill="currentColor" /> {maxShield}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── 3. MAIN CINEMATIC TITLE & ACTION SECTION ────────────────────── */}
      <main className="relative z-20 flex h-[calc(100vh-140px)] flex-col justify-center px-6 sm:px-16 lg:px-24 max-w-4xl pointer-events-auto">
        <div className="space-y-6">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 px-3.5 py-1 text-[11px] font-black tracking-[0.25em] uppercase text-[#00FF66] backdrop-blur-md shadow-[0_0_20px_rgba(0,255,102,0.2)]">
            <Crosshair size={13} className="text-[#00FF66]" />
            <span>SECTOR ZERO // ENDLESS COMBAT PROTOCOL</span>
          </div>

          {/* Main Title Typography */}
          <div className="space-y-1">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              SINGULARITY
            </h1>
            <div className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-[#00FF66] drop-shadow-[0_0_35px_rgba(0,255,102,0.45)]">
              LIVING RUIN
            </div>
          </div>

          {/* Clean One-Liner (No Clutter!) */}
          <p className="max-w-xl text-sm sm:text-base text-white/70 font-sans font-medium leading-relaxed drop-shadow-md">
            Step inside the ancient subterranean cyber ruins in a continuous, high-octane FPS survival run.
            Scavenge weapons from fallen hostiles, manage your 5-slot hotbar, and survive the endless swarm.
          </p>

          {/* Action Button Row */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Primary Magnetic CTA */}
            <button
              onClick={() => {
                sound.playOverdrive();
                onDeploy();
              }}
              onMouseEnter={() => sound.playHover()}
              className="group relative flex items-center justify-center gap-3.5 px-8 py-5 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#00CC55] text-black font-black text-sm uppercase tracking-wider shadow-[0_0_40px_rgba(0,255,102,0.5)] hover:shadow-[0_0_65px_rgba(0,255,102,0.8)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play size={20} fill="currentColor" className="transition-transform group-hover:scale-110" />
              <span>DEPLOY OPERATIVE [ ENTER FPS ]</span>
            </button>

            {/* Secondary Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowCodex(true);
                }}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/60 px-5 py-4 text-xs font-bold text-white/90 hover:border-[#00FF66]/60 hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-md cursor-pointer"
              >
                <BookOpen size={16} className="text-[#00FF66]" />
                <span>TACTICAL CODEX</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenControls();
                }}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/60 px-5 py-4 text-xs font-bold text-white/90 hover:border-white/50 hover:bg-white/[0.08] hover:text-white transition-all backdrop-blur-md cursor-pointer"
              >
                <Keyboard size={16} />
                <span>CONTROLS</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── 4. BOTTOM TELEMETRY DOCK ────────────────────────────────────── */}
      <footer className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between border-t border-white/10 bg-black/60 px-6 sm:px-10 py-3 backdrop-blur-xl pointer-events-auto">
        <div className="flex items-center gap-6 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-[#00FF66]" />
            <span>BEST SURVIVAL:</span>
            <span className="font-bold text-white tracking-wider">{formattedBestTime}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Target size={14} className="text-amber-400" />
            <span>HIGH SCORE:</span>
            <span className="font-bold text-amber-400 tracking-wider">
              {bestScore.toLocaleString()} PTS
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Skull size={14} className="text-rose-400" />
            <span>HOSTILES PURGED:</span>
            <span className="font-bold text-white tracking-wider">{totalKills}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00FF66]" />
            V3.2 ENDLESS ENGINE ONLINE
          </span>
        </div>
      </footer>

      {/* ─── 5. HOLOGRAPHIC TACTICAL CODEX MODAL (SLIDE-OVER / DIALOG) ───── */}
      {showCodex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-xl">
          <div className="relative flex flex-col h-[85vh] max-h-[720px] w-full max-w-4xl rounded-3xl border border-[#00FF66]/30 bg-[#06120b]/95 p-6 sm:p-8 text-white shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#00FF66]">
                  OPERATIVE COMBAT INTEL // ARCHIVES
                </span>
                <h2 className="text-xl font-black uppercase text-white flex items-center gap-2 mt-0.5">
                  <BookOpen size={20} className="text-[#00FF66]" /> TACTICAL MISSION CODEX
                </h2>
              </div>
              <button
                onClick={() => setShowCodex(false)}
                className="rounded-xl border border-white/10 p-2 text-white/60 hover:border-white/30 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-4 pb-4 border-b border-white/10">
              {[
                { key: 'arsenal' as CodexTab, label: 'LOADOUT & DROPS', icon: Layers },
                { key: 'monsters' as CodexTab, label: 'HOSTILE BESTIARY', icon: Skull },
                { key: 'threat' as CodexTab, label: 'THREAT CURVE', icon: Flame },
                { key: 'extraction' as CodexTab, label: 'EXTRACTION BEACON', icon: DoorOpen },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(key);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === key
                      ? 'bg-[#00FF66] text-black shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05] border border-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              {/* TAB 1: ARSENAL & DROPS */}
              {activeTab === 'arsenal' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <h4 className="text-xs font-black uppercase text-[#00FF66] mb-1">
                      5-SLOT HOTBAR & COMBAT SCAVENGING
                    </h4>
                    <p className="text-white/70 leading-relaxed font-sans">
                      You deploy armed with only the standard <strong className="text-white">Pulse Rifle MK-IV</strong> in Slot 1.
                      Secondary weapons, heavy ordnance, medkits, shield cells, and ammo crates do not exist from the start—they must be scavenged from fallen monsters!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                      <div className="flex items-center gap-2 text-[#00FF66] font-bold text-xs uppercase mb-1">
                        <Crosshair size={14} /> 3.5x Precision Optical Scope [Q]
                      </div>
                      <p className="text-white/60 font-sans leading-relaxed">
                        Press <strong className="text-white font-mono">[Q]</strong> or Right Click at any time to toggle high-magnification optical zoom with zero weapon spread.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase mb-1">
                        <Shield size={14} /> 5-Second Vital Auto-Regen
                      </div>
                      <p className="text-white/60 font-sans leading-relaxed">
                        After taking no damage for 5 seconds, your HP automatically refills at 45 HP/s. Once HP is full, your Kinetic Shield regenerates to full capacity!
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase mb-1">
                        <Sparkles size={14} /> 30% Monster Drop Rate
                      </div>
                      <p className="text-white/60 font-sans leading-relaxed">
                        Enemies have a 30% chance to drop weapons or consumables upon death. Press <strong className="text-white font-mono">[E]</strong> to collect physical 3D drops.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase mb-1">
                        <Timer size={14} /> 30-Second Clean Despawn
                      </div>
                      <p className="text-white/60 font-sans leading-relaxed">
                        Unclaimed physical loot dissolves after 30 seconds to prevent floor clutter and guarantee pristine 60+ FPS performance.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HOSTILE BESTIARY */}
              {activeTab === 'monsters' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-emerald-500/30 bg-black/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-[#00FF66] uppercase">Acid Slime</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">SWARM MELEE</span>
                    </div>
                    <p className="text-white/70 font-sans leading-relaxed">
                      Biomorphic green ooze entities with undulating membrane rings and glowing eye clusters. Fast bouncing leap attacks in close quarters.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-500/30 bg-black/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-purple-300 uppercase">Skeleton Archer</span>
                      <span className="text-[10px] text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">RANGED PLASMA</span>
                    </div>
                    <p className="text-white/70 font-sans leading-relaxed">
                      Undead cyber skeletons armed with composite plasma bows. Fires high-velocity plasma arrows that are blocked by cover pillars and arena walls!
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-500/30 bg-black/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-amber-300 uppercase">Rune Stone Golem</span>
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">ARMORED TANK</span>
                    </div>
                    <p className="text-white/70 font-sans leading-relaxed">
                      Ancient basalt monoliths engraved with glowing runes. Extremely high armor and health. Resistant to light firearms; weak to Railgun piercing hits.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-500/30 bg-black/40 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-rose-300 uppercase">Void Lich</span>
                      <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">ELITE NECROMANCER</span>
                    </div>
                    <p className="text-white/70 font-sans leading-relaxed">
                      Levitating eldritch horrors wrapped in dark energy shrouds. Fires homing void bolts and commands mini-swarms. High value target with guaranteed rare drops.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: THREAT CURVE */}
              {activeTab === 'threat' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                    <h4 className="text-xs font-black uppercase text-amber-300 mb-1 flex items-center gap-2">
                      <Flame size={14} /> Anti-Stall Horde Warning & Enrage
                    </h4>
                    <p className="text-white/70 font-sans leading-relaxed">
                      A live countdown timer indicates when the next monster wave will spawn. If you delay killing active hostiles, the horde enters an <strong className="text-rose-400">ENRAGED</strong> state, dramatically increasing their movement speed and damage output!
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="text-[10px] text-white/40 uppercase block mb-1">ESCALATION TIMELINE</span>
                    {[
                      { tier: 'T1 // QUIET BREACH', time: '0:00 - 1:30', note: 'Acid Slimes & scouting archers' },
                      { tier: 'T2 // HOSTILE INCURSION', time: '1:30 - 3:30', note: 'Reinforcements & Stone Golems arrive' },
                      { tier: 'T3 // HIGH THREAT', time: '3:30 - 6:30', note: 'Void Liches spawn, enrage timers tighten' },
                      { tier: 'T4 // SECTOR OVERLOAD', time: '6:30 - 9:45', note: 'Heavy multi-elite waves, intense combat' },
                      { tier: 'T5 // NIGHTMARE PROTOCOL', time: '9:45+', note: 'Max aggression swarms, extract or perish' },
                    ].map((t) => (
                      <div key={t.tier} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 p-2 text-xs">
                        <span className="font-bold text-[#00FF66]">{t.tier}</span>
                        <span className="text-white/50">{t.time}</span>
                        <span className="text-white/80 font-sans text-[11px]">{t.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: EXTRACTION PROTOCOL */}
              {activeTab === 'extraction' && (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-black text-sm uppercase">
                    <DoorOpen size={18} /> Quantum Teleporter Extraction Pad
                  </div>
                  <p className="text-white/70 font-sans leading-relaxed text-xs">
                    Every 2 minutes, a Quantum Extraction beacon activates near coordinate <strong className="text-cyan-300 font-mono">[0, 0, -9.5]</strong> for 45 seconds.
                  </p>
                  <div className="rounded-xl border border-cyan-400/20 bg-black/50 p-3 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">STEP 1:</span>
                      <span className="text-white/80">Locate the glowing vertical cyan energy beacon in the arena.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">STEP 2:</span>
                      <span className="text-white/80">Step inside the perimeter circle and hold <strong className="text-cyan-300 font-mono">[E]</strong> to channel.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">STEP 3:</span>
                      <span className="text-white/80">Survive the 2.5s channel without stepping out to extract with a +60% score multiplier!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-white/10 pt-4 flex justify-end">
              <button
                onClick={() => setShowCodex(false)}
                className="px-6 py-2.5 rounded-xl border border-white/20 bg-white/[0.05] font-bold text-xs hover:bg-white/10 transition-colors cursor-pointer"
              >
                Close Codex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
