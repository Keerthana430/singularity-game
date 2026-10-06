// components/dungeon/fps/DungeonBriefingHub.tsx
// AAA-Tier Cyberpunk Mission Staging & Briefing Hub for the First-Person Endless Survival Dungeon FPS
// Dynamic Tabs (Arsenal & Drops, Monster Recon Dossiers, Threat Director Curve, Extraction System, Keybindings)

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
  AlertTriangle,
  Layers,
  Sparkles,
  Trophy,
  Radio,
  Keyboard,
  DoorOpen,
  Skull,
  Eye,
  Activity,
  Flame,
} from 'lucide-react';
import { sound } from '@/lib/audio';
import { THREAT_TIERS } from './types';
import { useAvatarStore } from '@/store/avatarStore';

interface DungeonBriefingHubProps {
  onDeploy: () => void;
  onOpenControls: () => void;
  bestSurvivalSeconds: number;
  bestScore: number;
  totalKills: number;
  maxHp: number;
  maxShield: number;
}

type TabKey = 'arsenal' | 'monsters' | 'threat' | 'extraction' | 'controls';

export function DungeonBriefingHub({
  onDeploy,
  onOpenControls,
  bestSurvivalSeconds,
  bestScore,
  totalKills,
  maxHp,
  maxShield,
}: DungeonBriefingHubProps) {
  const { currentAvatar } = useAvatarStore();
  const [activeTab, setActiveTab] = useState<TabKey>('arsenal');

  const formattedBestTime = `${Math.floor(bestSurvivalSeconds / 60)}:${String(
    bestSurvivalSeconds % 60
  ).padStart(2, '0')}`;

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-[#040906] font-mono text-white select-none">
      {/* ─── AMBIENT CYBER BACKGROUND & VIBRANT LIGHTING ─────────────────── */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#00ff661a_0%,#031008_50%,#010503_100%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00ff6608_1px,transparent_1px),linear-gradient(to_bottom,#00ff6608_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
      <div className="fixed top-0 inset-x-0 h-48 bg-gradient-to-b from-[#00ff6615] via-transparent to-transparent pointer-events-none" />

      {/* ─── 1. TOP COMMAND BAR ─────────────────────────────────────────── */}
      <header className="relative z-20 flex items-center justify-between border-b border-[#00FF66]/20 bg-black/60 px-6 py-3.5 backdrop-blur-xl">
        <Link
          href="/lobby"
          onMouseEnter={() => sound.playHover()}
          onClick={() => sound.playClick()}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-white/70 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/10 hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={15} />
          <span>RETURN TO ORBITAL HUB</span>
        </Link>

        {/* Live System Telemetry Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 px-3.5 py-1 text-[10px] font-black uppercase text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)]">
            <span className="h-2 w-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span>SECTOR OMEGA // LIVING RUIN COMBAT PROTOCOL</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] text-white/50">
            <Radio size={12} className="text-[#00FF66] animate-pulse" />
            <span>TELEMETRY ONLINE</span>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO STAGING & DEPLOYMENT SECTION ──────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Main Title & Giant Action Banner */}
        <div className="relative rounded-3xl border border-[#00FF66]/30 bg-gradient-to-b from-[#081a0f]/90 to-[#040a06]/95 p-6 sm:p-10 backdrop-blur-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-hidden">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00FF66] pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00FF66] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00FF66] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00FF66] pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex flex-col max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-black tracking-[0.3em] uppercase text-[#00FF66] mb-2">
                <Crosshair size={14} className="text-[#00FF66]" />
                <span>FIRST-PERSON ENDLESS SURVIVAL PROTOCOL</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_35px_rgba(0,255,102,0.45)]">
                SINGULARITY <span className="text-[#00FF66]">LIVING RUIN</span>
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                Drop into the subterranean alien ruin in a continuous, high-octane FPS survival match.
                Aim down your 3.5x optical scope with <strong className="text-[#00FF66] font-mono">[Q]</strong>,
                scavenge heavy ordnance from monster drops at a 30% drop rate, and hold out against endless escalating swarms.
              </p>

              {/* Quick Spec Highlights */}
              <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[11px]">
                <div className="flex items-center gap-1.5 rounded-lg border border-[#00FF66]/20 bg-[#00FF66]/10 px-3 py-1 font-bold text-[#00FF66]">
                  <Crosshair size={12} />
                  <span>Q-KEY OPTIC SCOPE</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-950/40 px-3 py-1 font-bold text-cyan-300">
                  <Shield size={12} />
                  <span>OUT-OF-COMBAT REGEN</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-950/40 px-3 py-1 font-bold text-amber-300">
                  <Flame size={12} />
                  <span>ANTI-STALL HORDE ENRAGE</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-purple-400/20 bg-purple-950/40 px-3 py-1 font-bold text-purple-300">
                  <Timer size={12} />
                  <span>30S LOOT DESPAWN</span>
                </div>
              </div>
            </div>

            {/* Big Deploy CTA Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 w-full lg:w-auto min-w-[280px]">
              <button
                onClick={() => {
                  sound.playOverdrive();
                  onDeploy();
                }}
                onMouseEnter={() => sound.playHover()}
                className="group relative flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#00CC55] text-black font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(0,255,102,0.5)] hover:shadow-[0_0_55px_rgba(0,255,102,0.75)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play size={20} fill="currentColor" />
                <span>DEPLOY OPERATIVE [ ENTER FPS ]</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenControls();
                }}
                onMouseEnter={() => sound.playHover()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/60 px-6 py-3.5 text-xs font-bold text-white/80 hover:border-[#00FF66]/50 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
              >
                <Keyboard size={15} />
                <span>OPERATIVE CONTROLS CHEATSHEET</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 3. OPERATIVE TELEMETRY & RECORDS GRID ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Operative Profile */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4.5 backdrop-blur-md">
            <span className="text-[10px] text-white/40 block mb-1">OPERATIVE DESIGNATION</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">{currentAvatar.name || 'KAGE-07'}</span>
              <span className="text-[9px] font-bold text-[#00FF66] bg-[#00FF66]/15 border border-[#00FF66]/30 px-1.5 py-0.5 rounded uppercase">
                [{currentAvatar.classRole || 'TANK'}]
              </span>
            </div>
            <div className="mt-2 text-[10px] text-white/50 flex items-center gap-2">
              <span>HP: {maxHp}</span>
              <span>·</span>
              <span>SHIELD: {maxShield}</span>
            </div>
          </div>

          {/* Card 2: Best Survival Time */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4.5 backdrop-blur-md">
            <span className="text-[10px] text-white/40 block mb-1 flex items-center gap-1.5">
              <Timer size={12} className="text-[#00FF66]" /> BEST SURVIVAL RECORD
            </span>
            <span className="text-2xl font-black text-white tracking-wider">{formattedBestTime}</span>
            <span className="mt-1 block text-[9px] text-[#00FF66]">TIME UNDER CONTINUOUS THREAT</span>
          </div>

          {/* Card 3: High Score */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4.5 backdrop-blur-md">
            <span className="text-[10px] text-white/40 block mb-1 flex items-center gap-1.5">
              <Trophy size={12} className="text-amber-400" /> COMBAT HIGH SCORE
            </span>
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {bestScore.toLocaleString()} PTS
            </span>
            <span className="mt-1 block text-[9px] text-white/50">WEIGHTED THREAT ACCRUAL</span>
          </div>

          {/* Card 4: Hostiles Purged */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4.5 backdrop-blur-md">
            <span className="text-[10px] text-white/40 block mb-1 flex items-center gap-1.5">
              <Skull size={12} className="text-rose-400" /> TOTAL HOSTILES PURGED
            </span>
            <span className="text-2xl font-black text-white tracking-tight">{totalKills} KILLS</span>
            <span className="mt-1 block text-[9px] text-rose-400">EXPONENTIAL SWARM CASUALTIES</span>
          </div>
        </div>

        {/* ─── 4. INTERACTIVE TACTICAL BRIEFING TERMINAL ──────────────────── */}
        <div className="rounded-3xl border border-white/15 bg-black/75 p-6 backdrop-blur-2xl shadow-2xl">
          {/* Tab Navigation Header */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 mb-6">
            {[
              { key: 'arsenal' as TabKey, label: 'LOADOUT & DROPS', icon: Crosshair },
              { key: 'monsters' as TabKey, label: 'HOSTILE RECON DOSSIERS', icon: Skull },
              { key: 'threat' as TabKey, label: 'THREAT CURVE & ENRAGE', icon: Activity },
              { key: 'extraction' as TabKey, label: 'EXTRACTION PROTOCOL', icon: DoorOpen },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(key);
                }}
                onMouseEnter={() => sound.playHover()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === key
                    ? 'bg-[#00FF66] text-black shadow-[0_0_20px_rgba(0,255,102,0.4)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05] border border-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab 1: Arsenal & Scavenge Protocol */}
          {activeTab === 'arsenal' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-[#00FF66] flex items-center gap-2 mb-2">
                  <Layers size={16} /> STANDARD SURVIVAL HOTBAR (1 INITIAL WEAPON + 4 SCAVENGE SLOTS)
                </h3>
                <p className="text-xs text-white/60 font-sans leading-relaxed">
                  Operatives deploy with only the dependable <strong>Pulse Rifle MK-IV</strong> in Slot 1.
                  Secondary firearms, heavy ordnance, ammo crates, shield cells, and combat stims do not exist at start—they must be scavenged from fallen monsters at a <strong>30% drop rate</strong>.
                </p>
              </div>

              {/* 5-Slot Hotbar Representation */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  {
                    slot: 1,
                    name: 'Pulse Rifle MK-IV',
                    status: 'DEPLOYED PRIMARY',
                    desc: 'Balanced rapid plasma. Press [Q] for 3.5x optical scope & pinpoint spread.',
                    rarity: '#00FF66',
                    equipped: true,
                  },
                  {
                    slot: 2,
                    name: 'Arc Magnum',
                    status: '30% MONSTER DROP',
                    desc: 'Precision hand cannon with lethal headshot critical multipliers.',
                    rarity: '#38BDF8',
                    equipped: false,
                  },
                  {
                    slot: 3,
                    name: 'Scatter Core 8',
                    status: '30% MONSTER DROP',
                    desc: 'Heavy shotgun firing dense clusters of ionized plasma buckshot.',
                    rarity: '#D946EF',
                    equipped: false,
                  },
                  {
                    slot: 4,
                    name: 'Void Piercer XI',
                    status: '30% MONSTER DROP',
                    desc: 'Heavy anti-material particle railgun with massive armor penetration.',
                    rarity: '#F59E0B',
                    equipped: false,
                  },
                  {
                    slot: 5,
                    name: 'Nanite Medkit / Shield',
                    status: '30% MONSTER DROP',
                    desc: 'Consumable cells to instantly recover Health or Kinetic Shields.',
                    rarity: '#10B981',
                    equipped: false,
                  },
                ].map((item) => (
                  <div
                    key={item.slot}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      item.equipped
                        ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_20px_rgba(0,255,102,0.15)]'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-white/40 mb-2">
                        <span>SLOT [{item.slot}]</span>
                        <span style={{ color: item.rarity }}>{item.status}</span>
                      </div>
                      <span className="text-sm font-black text-white block mb-1.5">{item.name}</span>
                      <p className="text-[10px] text-white/55 font-sans leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tactical Gameplay Rules Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-xs font-black text-[#00FF66] flex items-center gap-1.5 uppercase mb-1">
                    <Crosshair size={14} /> [Q] OPTICAL SCOPE
                  </span>
                  <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                    Toggle your precision optic at any time by pressing <strong>[Q]</strong> or <strong>Right-Click</strong>.
                    Zooms FOV to 3.5x and reduces bullet spread by 78%.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5 uppercase mb-1">
                    <Shield size={14} /> 5S OUT-OF-COMBAT REGEN
                  </span>
                  <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                    Avoid taking damage for 5 seconds to trigger automatic vitality recovery.
                    Health refills smoothly (+60 HP/s); once full, shields recharge (+30/s).
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase mb-1">
                    <Timer size={14} /> 30S LOOT DESPAWN
                  </span>
                  <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                    Dropped weapons and ammo boxes physically emit beacons on the ground.
                    Items despawn after 30 seconds to prevent clutter and keep 60 FPS performance high.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Hostile Recon Dossiers */}
          {activeTab === 'monsters' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-[#00FF66] flex items-center gap-2 mb-2">
                <Skull size={16} /> RECON DOSSIERS: 4 HOSTILE ARCHETYPES
              </h3>
              <p className="text-xs text-white/60 font-sans leading-relaxed mb-4">
                Each hostile possesses unique 3D visual models, behaviors, and attack ranges.
                Cover pillars block ranged enemy projectiles—use tactical line-of-sight!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slime */}
                <div className="rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]" />
                      <span className="text-sm font-black text-white uppercase">ACID SLIME</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#22C55E]">MELEE SWARM RUSHER</span>
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Gelatinous translucent green cube with an inner glowing nucleus and bouncing eyes.
                    High movement speed; rapidly rushes operatives to deal close-quarters acid impact.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-white/40">
                    <span>HP: 95</span>
                    <span>SPEED: FAST (5.2m/s)</span>
                    <span>ATTACK: 18 MELEE</span>
                  </div>
                </div>

                {/* Skeleton */}
                <div className="rounded-2xl border border-sky-400/30 bg-sky-950/20 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8]" />
                      <span className="text-sm font-black text-white uppercase">SKELETON ARCHER</span>
                    </div>
                    <span className="text-[10px] font-bold text-sky-400">RANGED PLASMA SNIPER</span>
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Bone cranium, glowing eye sockets, ribcage, and a cyber-bone plasma bow.
                    Maintains distance and fires high-velocity ranged arrows. <strong>Cannot shoot through pillars or walls!</strong>
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-white/40">
                    <span>HP: 135</span>
                    <span>RANGE: 9.5m RANGED</span>
                    <span>ATTACK: 26 PLASMA</span>
                  </div>
                </div>

                {/* Golem */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                      <span className="text-sm font-black text-white uppercase">RUNE STONE GOLEM</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400">HEAVY ARMORED TANK</span>
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Massive cracked basalt colossus with an illuminated molten rune core visor and boulder fists.
                    Absorbs massive firepower and delivers devastating ground-shaking kinetic strikes.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-white/40">
                    <span>HP: 340</span>
                    <span>ARMOR: HEAVY</span>
                    <span>ATTACK: 38 BLUDGEON</span>
                  </div>
                </div>

                {/* Void Lich */}
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" />
                      <span className="text-sm font-black text-white uppercase">VOID LICH NECROMANCER</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-400">ELITE RANGED BOSS</span>
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Hovering hooded necromancer shroud with orbiting soul skulls.
                    Protected by kinetic shield barriers and fires necrotic soul orbs at long range.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-white/40">
                    <span>HP: 480 + 180 SHIELD</span>
                    <span>RANGE: 8.5m</span>
                    <span>ATTACK: 45 NECROTIC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Threat Curve & Anti-Stall Swarm Alarm */}
          {activeTab === 'threat' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-[#00FF66] flex items-center gap-2 mb-2">
                  <Activity size={16} /> THREAT DIRECTOR ESCALATION & ANTI-STALL SWARM ALARM
                </h3>
                <p className="text-xs text-white/60 font-sans leading-relaxed">
                  The Singularity Ruin never sleeps. Difficulty scales continuously without round breaks.
                </p>
              </div>

              {/* 5 Escalating Tiers */}
              <div className="space-y-2">
                {THREAT_TIERS.map((tier) => (
                  <div
                    key={tier.tier}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5 gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: tier.color, color: tier.color }}
                      />
                      <span className="font-black text-xs uppercase" style={{ color: tier.color }}>
                        TIER {tier.tier} // {tier.name}
                      </span>
                    </div>
                    <span className="text-xs text-white/60 font-sans max-w-md">{tier.description}</span>
                    <span className="text-xs font-mono font-bold text-white/40">
                      {Math.floor(tier.minSeconds / 60)}:{String(tier.minSeconds % 60).padStart(2, '0')}+
                    </span>
                  </div>
                ))}
              </div>

              {/* Anti-Stall Alert Warning */}
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4.5 flex items-start gap-3">
                <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black uppercase text-rose-400 block mb-1">
                    ANTI-STALL SWARM ENRAGE WARNING
                  </span>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    An on-screen countdown timer monitors every monster assault round.
                    If the operative delays, hides, or avoids killing active monsters when the timer expires,
                    the horde triggers <strong>ENRAGED STATE (+40% Speed, +35% Attack Damage)</strong>, quickly swarming
                    to overwhelm and eliminate stallers. Actively purging monsters calms down the horde.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Extraction System */}
          {activeTab === 'extraction' && (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-cyan-400 flex items-center gap-2 mb-2">
                <DoorOpen size={16} /> QUANTUM EXTRACTION TELEPORTER PAD [0, 0, -9.5]
              </h3>
              <p className="text-xs text-white/70 font-sans leading-relaxed">
                You do not have to fight until chassis destruction. The Living Ruin charges an extraction beacon at regular intervals:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4">
                  <span className="text-xs font-black text-cyan-300 block mb-1">TIMED WINDOWS</span>
                  <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                    The portal opens at <strong>2:00</strong>, and reactivates every 2.5 minutes for a 45-second extraction window.
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4">
                  <span className="text-xs font-black text-cyan-300 block mb-1">CHANNELING [E]</span>
                  <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                    Step onto the cyan glowing ring at [0, 0, -9.5] and hold <strong>[E]</strong> for 2.5 continuous seconds to evacuate.
                  </p>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4">
                  <span className="text-xs font-black text-cyan-300 block mb-1">EXTRACTION MULTIPLIER</span>
                  <p className="text-[11px] text-white/60 font-sans leading-relaxed">
                    Successful extraction rewards a <strong>+60% Score Multiplier</strong> and converts combat score directly into Soul Shards.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
