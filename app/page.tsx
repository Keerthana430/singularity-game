'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  Dices,
  Layers,
  Swords,
  Shield,
  Zap,
  Cpu,
  Palette,
  Eye,
  ArrowRight,
  CheckCircle2,
  Share2,
  Heart,
  Crown,
  Trophy,
  Star,
  Award,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { useContestStore } from '@/store/contestStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { PRESET_AVATARS } from '@/data/presets';
import { useToast } from '@/components/Toast';

interface BattleLeaderboardEntry {
  id?: string;
  name: string;
  rating: number;
  victories?: number;
  wins?: number;
  losses: number;
  winRate?: number;
  classRole?: string;
}

const DEFAULT_BATTLE_LEADERBOARD: BattleLeaderboardEntry[] = [
  { name: 'KAGE-07', rating: 2850, victories: 48, losses: 4, winRate: 92, classRole: 'Cyber Shinobi' },
  { name: 'VEX-TITAN', rating: 2680, victories: 42, losses: 6, winRate: 87, classRole: 'Heavy Juggernaut' },
  { name: 'AURA-V', rating: 2540, victories: 39, losses: 8, winRate: 83, classRole: 'Valkyrie Vanguard' },
  { name: 'PIXEL-BYTE', rating: 2310, victories: 31, losses: 11, winRate: 74, classRole: 'Rogue Hacker' },
];

export default function HomePage() {
  const { currentAvatar, randomizeAvatar, updateAvatar } = useAvatarStore();
  const { entries: contestEntries } = useContestStore();
  const { add: addToast } = useToast();
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_AVATARS[0].id);
  const [leaderboardTab, setLeaderboardTab] = useState<'overall' | 'battle' | 'beauty'>('overall');
  const [battleLeaderboard, setBattleLeaderboard] = useState<BattleLeaderboardEntry[]>(DEFAULT_BATTLE_LEADERBOARD);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setBattleLeaderboard(json.data);
        }
      })
      .catch(() => {
        // Fallback gracefully to default data
      });
  }, []);

  const handleRandomize = () => {
    randomizeAvatar();
    addToast('Randomized hero avatar!', 'info');
  };

  // Compute beauty contest leaderboard
  const beautyLeaderboard = useMemo(
    () => [...contestEntries].sort((a, b) => b.likes - a.likes).slice(0, 6),
    [contestEntries]
  );

  // Combined overall leaderboard: merge battle + beauty scores
  const overallLeaderboard = useMemo(() => {
    const combined: { name: string; score: number; battleRating: number; beautyLikes: number; source: string }[] = [];
    const nameMap = new Map<string, typeof combined[0]>();

    // Add battle entries
    battleLeaderboard.forEach((b) => {
      nameMap.set(b.name, {
        name: b.name,
        score: b.rating,
        battleRating: b.rating,
        beautyLikes: 0,
        source: 'battle',
      });
    });

    // Add/merge beauty entries
    beautyLeaderboard.forEach((c) => {
      const existing = nameMap.get(c.name);
      const beautyScore = c.likes * 10; // Weight: 10 points per like
      if (existing) {
        existing.score += beautyScore;
        existing.beautyLikes = c.likes;
        existing.source = 'both';
      } else {
        nameMap.set(c.name, {
          name: c.name,
          score: beautyScore,
          battleRating: 0,
          beautyLikes: c.likes,
          source: 'beauty',
        });
      }
    });

    return [...nameMap.values()].sort((a, b) => b.score - a.score).slice(0, 8);
  }, [beautyLeaderboard]);

  const handleApplyPreset = (preset: typeof PRESET_AVATARS[0]) => {
    setSelectedPresetId(preset.id);
    updateAvatar({
      body: preset.avatar.body,
      skinTone: preset.avatar.skinTone,
      face: preset.avatar.face,
      hair: preset.avatar.hair,
      hairColor: preset.avatar.hairColor,
      top: preset.avatar.top,
      topColor: preset.avatar.topColor,
      bottom: preset.avatar.bottom,
      bottomColor: preset.avatar.bottomColor,
      shoes: preset.avatar.shoes,
      shoeColor: preset.avatar.shoeColor,
      accessories: preset.avatar.accessories,
      accessoryColor: preset.avatar.accessoryColor,
    });
    addToast(`Loaded ${preset.name} archetype!`, 'success');
  };

  return (
    <div className="relative min-h-screen bg-[#020502] text-white selection:bg-[#00FF66] selection:text-black overflow-x-hidden pt-16">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-[#00FF66]/10 rounded-full blur-[170px]" />
        <div className="absolute top-1/3 -right-48 w-[650px] h-[650px] bg-[#39FF14]/8 rounded-full blur-[190px]" />
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-[#00FF66]/8 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff6608_1px,transparent_1px),linear-gradient(to_bottom,#00ff6608_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 flex flex-col gap-6"
          >
            {/* Tagline Badge matching image 2 monospaced style */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00FF66]/40 bg-[#00FF66]/10 backdrop-blur-md w-fit text-xs font-mono font-black text-[#00FF66]">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span>// D3V_UNKNOWN // SYS_01 // ONLINE</span>
            </div>

            {/* Main Headline with Glitch Effect */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] uppercase" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              <span className="glitch-text text-white" data-text="BREAK THE GRID.">
                BREAK THE GRID.
              </span> <br />
              <span
                className="bg-clip-text text-transparent neon-green-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #00FF66 60%, #39FF14 100%)',
                }}
              >
                FORGE CYBER RIG
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl font-mono text-xs sm:text-sm">
              &gt; DESIGN WITHOUT RULES. BUILD WITHOUT LIMITS. <br />
              Construct blocky Roblox-styled avatars procedurally in real-time. Tune gear, head studs, printed expression decals, armor & radiant neon dyes.
            </p>

            {/* Action Buttons with Chamfered Angled Cyber Style */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/studio"
                className="cyber-button flex items-center gap-2 px-8 py-4 text-sm font-black uppercase text-black"
              >
                <Layers size={18} />
                <span>&gt; ENTER STUDIO_</span>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/lobby"
                className="cyber-button-outline flex items-center gap-2 px-7 py-4 text-sm font-bold uppercase text-[#00FF66]"
              >
                <Swords size={18} />
                <span>[ BATTLE ARENA ]</span>
              </Link>

              <Link
                href="/contest"
                className="flex items-center gap-2 px-5 py-4 border border-[#FF69B4]/40 bg-[#FF69B4]/10 hover:bg-[#FF69B4]/25 text-[#FF69B4] font-mono text-xs font-bold uppercase transition-all hover:shadow-[0_0_15px_rgba(255,105,180,0.3)]"
              >
                <Heart size={18} />
                <span className="hidden sm:inline">BEAUTY CONTEST</span>
              </Link>

              <button
                onClick={handleRandomize}
                className="flex items-center gap-2 px-4 py-4 border border-[#00FF66]/30 bg-black/60 hover:bg-[#00FF66]/20 text-[#00FF66] font-mono text-xs transition-all"
                title="Randomize Hero"
              >
                <Dices size={18} />
                <span className="hidden sm:inline">[ RANDOMIZE ]</span>
              </button>
            </div>

          </motion.div>

          {/* Right Column: Interactive 3D Avatar Hero Preview with HUD brackets */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative flex flex-col items-center"
          >
            {/* Sci-Fi Decorative Frame with L-shaped Corners */}
            <div className="hud-box scanlines relative w-full aspect-[4/5] max-h-[620px] glass-panel glass-panel-chamfer p-2 overflow-hidden border border-[#00FF66]/40 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
              {/* Corner status tag matching image 1 "Current 0.52ETH" style */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/90 px-3 py-1.5 border border-[#00FF66]/40 font-mono text-[11px] text-[#00FF66]">
                <span className="w-2 h-2 bg-[#00FF66] animate-ping" />
                <span>CURRENT RIG &bull; {currentAvatar.name.toUpperCase()}</span>
              </div>

              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                <Link
                  href="/studio"
                  className="cyber-button px-3 py-1.5 text-xs font-black uppercase text-black"
                >
                  <span>CUSTOMIZE &gt;</span>
                </Link>
              </div>

              {/* 3D Canvas */}
              <div className="w-full h-full overflow-hidden bg-gradient-to-b from-[#041006] via-[#020502] to-[#000000]">
                <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
              </div>


            </div>
          </motion.div>
        </div>
      </section>

      {/* CORE FEATURES GRID with Monospace Slash Headers */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-mono font-black uppercase tracking-widest text-[#00FF66] mb-2">// ENGINE_SPECIFICATIONS //</p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            INTERFACE IS THE MESSAGE.
          </h2>
          <p className="text-white/70 mt-3 text-xs sm:text-sm font-mono">
            &gt; Built with zero-fail Three.js procedural primitives, chromashift dyes, and real-time turn-based combat telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/20 flex flex-col gap-4 group hover:border-[#00FF66] transition-all">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#00FF66] transition-colors">
              // PROCEDURAL_RIG_MESH
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Roblox top-stud cylinder head, blocky torso, limbs, and printed facial decals sculpted in 3D runtime without asset lag.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/20 flex flex-col gap-4 group hover:border-[#00FF66] transition-all">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
              <Palette size={24} />
            </div>
            <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#00FF66] transition-colors">
              // NEON_CHROMASHIFT
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Cyberpunk neon green (`#00FF66`), obsidian black (`#020502`), and radiant emissive RGB color picker system.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/20 flex flex-col gap-4 group hover:border-[#00FF66] transition-all">
            <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66]">
              <Swords size={24} />
            </div>
            <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#00FF66] transition-colors">
              // ARENA_TOURNAMENT
            </h3>
            <p className="text-xs font-mono text-white/70 leading-relaxed">
              Deploy custom builds into 8-man arcade battle tournaments with dynamic combat logs and live health telemetry.
            </p>
          </div>

          {/* Feature 4 - Beauty Contest */}
          <div className="hud-box glass-panel p-6 border border-[#FF69B4]/20 flex flex-col gap-4 group hover:border-[#FF69B4] transition-all md:col-span-3 md:col-start-1">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-[#FF69B4]/10 border border-[#FF69B4]/40 flex items-center justify-center text-[#FF69B4]">
                <Heart size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase font-mono text-white group-hover:text-[#FF69B4] transition-colors">
                  // BEAUTY_CONTEST
                </h3>
                <p className="text-xs font-mono text-white/70 leading-relaxed mt-1">
                  Enter your avatar in the Beauty Contest! Each team submits one build and casts one vote. The most liked avatar wins the Beauty Crown and tops the leaderboard.
                </p>
              </div>
              <Link
                href="/contest"
                className="hidden md:flex items-center gap-2 px-5 py-3 border border-[#FF69B4]/40 bg-[#FF69B4]/10 hover:bg-[#FF69B4] hover:text-white text-[#FF69B4] font-mono text-xs font-bold uppercase transition-all whitespace-nowrap"
              >
                <Heart size={14} />
                <span>Enter Contest</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHETYPE SHOWCASE SECTION matching Image 2 "SELECTED WORK" layout */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#00FF66] mb-2">_SELECTED_ARCHETYPES</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              SELECT COMBAT LOADOUT
            </h2>
          </div>
          <Link
            href="/studio"
            className="flex items-center gap-2 text-[#00FF66] hover:underline text-xs font-mono font-bold uppercase tracking-wider"
          >
            <span>&gt; OPEN CUSTOMIZER STUDIO_</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRESET_AVATARS.map((preset) => (
            <div
              key={preset.id}
              className="hud-box glass-panel p-5 border border-[#00FF66]/20 flex flex-col justify-between group hover:border-[#00FF66] hover:bg-black/80 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3 font-mono">
                  <span className="text-[10px] uppercase text-black bg-[#00FF66] px-2 py-0.5 font-bold">
                    {preset.role}
                  </span>
                  <span className="text-[10px] text-white/50">[SYS_0{preset.id}]</span>
                </div>
                <h4 className="text-xl font-black uppercase font-mono tracking-wider mb-2 text-white group-hover:text-[#00FF66] transition-colors">
                  {preset.name}
                </h4>
                <p className="text-xs font-mono text-white/60 leading-relaxed mb-6">
                  {preset.tagline}
                </p>
              </div>

              <div className="flex flex-col gap-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-white/50 border-t border-[#00FF66]/20 pt-3">
                  <span>ARMOR: {preset.avatar.top.toUpperCase()}</span>
                  <span>HAIR: {preset.avatar.hair.toUpperCase()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="flex-1 py-2 px-3 text-xs font-bold uppercase bg-white/5 hover:bg-[#00FF66] text-white hover:text-black border border-[#00FF66]/30 transition-all text-center"
                  >
                    [PREVIEW]
                  </button>
                  <Link
                    href="/studio"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 bg-[#00FF66] text-black hover:bg-white transition-all"
                    title="Edit in Studio"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* COMBINED OVERALL LEADERBOARD SECTION                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="rankings" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#00FF66] mb-2">// GLOBAL_RANKINGS //</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              OVERALL LEADERBOARD
            </h2>
            <p className="text-xs font-mono text-white/50 mt-2">
              &gt; Combined rankings from Battle Arena and Beauty Contest. Dominate both to reach the top.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-[#041006] p-1 rounded-xl border border-[#00FF66]/20">
            {([
              { id: 'overall' as const, label: 'Overall', icon: Trophy },
              { id: 'battle' as const, label: 'Battle', icon: Swords },
              { id: 'beauty' as const, label: 'Beauty', icon: Heart },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setLeaderboardTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  leaderboardTab === id
                    ? id === 'beauty'
                      ? 'bg-[#FF69B4] text-black shadow-[0_0_10px_rgba(255,105,180,0.3)]'
                      : 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* OVERALL LEADERBOARD */}
        {leaderboardTab === 'overall' && (
          <div className="flex flex-col gap-3">
            {overallLeaderboard.map((entry, idx) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-panel p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  idx === 0
                    ? 'border-[#FFD700] bg-[#FFD700]/8 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                    : idx === 1
                    ? 'border-slate-400/40 bg-slate-400/5'
                    : idx === 2
                    ? 'border-amber-600/40 bg-amber-600/5'
                    : 'border-white/10 hover:border-[#00FF66]/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${
                      idx === 0
                        ? 'bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.5)]'
                        : idx === 1
                        ? 'bg-slate-400 text-black'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black uppercase text-white tracking-wider">{entry.name}</h4>
                      {idx === 0 && <Crown size={16} className="text-[#FFD700]" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                      {entry.source === 'battle' && <span className="text-[#00FF66]">⚔ Battle Fighter</span>}
                      {entry.source === 'beauty' && <span className="text-[#FF69B4]">♥ Beauty Contestant</span>}
                      {entry.source === 'both' && (
                        <>
                          <span className="text-[#00FF66]">⚔ Battle</span>
                          <span className="text-white/20">+</span>
                          <span className="text-[#FF69B4]">♥ Beauty</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-sm">
                  {entry.battleRating > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-[#00FF66] uppercase block font-bold">Battle</span>
                      <span className="text-white font-bold">{entry.battleRating}</span>
                    </div>
                  )}
                  {entry.beautyLikes > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-[#FF69B4] uppercase block font-bold">Likes</span>
                      <span className="text-white font-bold">♥ {entry.beautyLikes}</span>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-[10px] text-[#FFD700] uppercase block font-bold">Overall</span>
                    <span className="text-[#FFD700] font-black text-base">{entry.score}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* BATTLE ROYALE LEADERBOARD */}
        {leaderboardTab === 'battle' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Swords size={16} className="text-[#00FF66]" />
              <span className="text-sm font-black uppercase text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                BATTLE ROYALE RANKINGS
              </span>
            </div>
            {battleLeaderboard.map((entry, idx) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-panel p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  idx === 0
                    ? 'border-[#00FF66] bg-[#00FF66]/8 shadow-[0_0_20px_rgba(0,255,102,0.15)]'
                    : 'border-white/10 hover:border-[#00FF66]/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${
                      idx === 0
                        ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
                        : idx === 1
                        ? 'bg-slate-400 text-black'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-black uppercase text-white tracking-wider">{entry.name}</h4>
                    <p className="text-[10px] font-mono text-white/40">
                      {(entry.victories ?? entry.wins ?? 0)}W - {entry.losses}L
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-[#00FF66] uppercase block font-bold">Rating</span>
                    <span className="text-[#00FF66] font-black text-base">{entry.rating}</span>
                  </div>
                  <Link
                    href="/lobby"
                    className="px-3 py-1.5 rounded-lg border border-[#00FF66]/40 hover:bg-[#00FF66] hover:text-black text-xs font-bold uppercase tracking-wider text-[#00FF66] transition-all"
                  >
                    Challenge
                  </Link>
                </div>
              </motion.div>
            ))}
            <Link
              href="/lobby"
              className="flex items-center justify-center gap-2 mt-2 text-xs font-mono font-bold text-[#00FF66] hover:text-white transition-colors uppercase tracking-wider"
            >
              <span>&gt; VIEW FULL BATTLE LEADERBOARD_</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* BEAUTY CONTEST LEADERBOARD */}
        {leaderboardTab === 'beauty' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-[#FF69B4]" />
              <span className="text-sm font-black uppercase text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                BEAUTY CONTEST RANKINGS
              </span>
            </div>
            {beautyLeaderboard.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass-panel p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  idx === 0
                    ? 'border-[#FFD700] bg-[#FFD700]/8 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                    : idx === 1
                    ? 'border-slate-400/40 bg-slate-400/5'
                    : idx === 2
                    ? 'border-amber-600/40 bg-amber-600/5'
                    : 'border-white/10 hover:border-[#FF69B4]/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${
                      idx === 0
                        ? 'bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.5)]'
                        : idx === 1
                        ? 'bg-slate-400 text-black'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black uppercase text-white tracking-wider">{entry.name}</h4>
                      {idx === 0 && <Crown size={16} className="text-[#FFD700]" />}
                    </div>
                    <p className="text-[10px] font-mono text-[#FF69B4]">
                      By {entry.teamName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Heart size={14} className="text-[#FF69B4]" fill="#FF69B4" />
                    <span className="text-lg font-black text-white">{entry.likes}</span>
                    <span className="text-[10px] text-white/40 uppercase">likes</span>
                  </div>
                </div>
              </motion.div>
            ))}
            <Link
              href="/contest"
              className="flex items-center justify-center gap-2 mt-2 text-xs font-mono font-bold text-[#FF69B4] hover:text-white transition-colors uppercase tracking-wider"
            >
              <span>&gt; VIEW FULL BEAUTY CONTEST_</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* FOOTER CALL TO ACTION BANNER matching Image 2 "DESIGN IS REBELLION." */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="hud-box glass-panel p-8 sm:p-12 border border-[#00FF66]/40 relative overflow-hidden text-center flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,102,0.1),transparent_70%)] pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4 relative z-10 font-mono text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            DESIGN IS REBELLION.
          </h2>
          <p className="text-white/80 max-w-xl text-xs sm:text-sm mb-8 relative z-10 font-mono">
            &gt; Build your avatar, enter the beauty contest, customize blocky cosmetics, and dominate the battle arena &amp; overall leaderboard.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Link
              href="/studio"
              className="cyber-button flex items-center gap-2 px-8 py-4 text-sm font-black uppercase text-black"
            >
              <Sparkles size={18} />
              <span>&gt; LAUNCH AVATAR STUDIO_</span>
            </Link>
            <Link
              href="/contest"
              className="flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase border border-[#FF69B4]/60 bg-[#FF69B4]/10 text-[#FF69B4] hover:bg-[#FF69B4] hover:text-white transition-all"
            >
              <Heart size={18} />
              <span>[ BEAUTY CONTEST ]</span>
            </Link>
            <Link
              href="/lobby"
              className="cyber-button-outline flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase text-[#00FF66]"
            >
              <Swords size={18} />
              <span>[ ENTER BATTLE ARENA ]</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SITE FOOTER with Barcode matching Image 2 */}
      <footer className="border-t border-[#00FF66]/20 bg-[#020502] py-8 text-center text-xs font-mono text-white/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <span className="font-bold tracking-widest text-[#00FF66]">// SINGULARITY //</span>
            <span>SYS_VERSION: 2.0.26</span>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <span>[WORK]</span>
            <span>[ABOUT]</span>
            <span>[EXPERIMENTS]</span>
            <span>[CONTACT]</span>
          </div>
          <div className="text-[10px] text-white/40 tracking-[0.3em] font-mono">
            |||||||||||||||||||| D3V_UNKNOWN_2026
          </div>
        </div>
      </footer>
    </div>
  );
}
