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
  Coins,
  Flame,
  Compass,
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



  return (
    <div className="relative min-h-screen rpg-wood-container text-[#FFF5E6] selection:bg-[#F59E0B] selection:text-black overflow-x-hidden pt-16">
      {/* Rich Layered Atmosphere — deep forest meets neon myth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Primary glow orbs */}
        <div className="absolute -top-48 -left-48 w-[800px] h-[800px] bg-[#00FF66]/12 rounded-full blur-[200px]" />
        <div className="absolute top-1/4 -right-64 w-[700px] h-[700px] bg-[#10B981]/10 rounded-full blur-[220px]" />
        <div className="absolute bottom-0 left-1/4 w-[650px] h-[650px] bg-[#D97706]/12 rounded-full blur-[180px]" />
        {/* Secondary accent orbs */}
        <div className="absolute top-2/3 right-1/3 w-[400px] h-[400px] bg-[#F59E0B]/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00FF66]/5 rounded-full blur-[200px]" />
        {/* Scan-line grid */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,102,0.015)_50%)] [background-size:100%_4px] opacity-60" />
        {/* Diamond dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#C88A4B10_1px,transparent_1px)] [background-size:28px_28px] opacity-50" />
        {/* Top edge glow bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FF66]/40 to-transparent" />
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
          {/* Tagline Ribbon Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#1A3D27] to-[#0D1F15] border border-[#00FF66]/40 w-fit text-xs font-bold text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.2)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
              <span className="tracking-widest uppercase">Ancient Lore &bull; Indie Anime Survivor</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_8px_#00FF66]" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.0] uppercase"
            >
              <span className="text-[#FFF8EE] drop-shadow-[0_2px_24px_rgba(255,255,255,0.08)]">
                FORGE YOUR
              </span>{' '}<br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #FEF3C7 0%, #F59E0B 45%, #00FF66 100%)',
                  filter: 'drop-shadow(0 0 30px rgba(0,255,102,0.3))',
                }}
              >
                ANIME HERO
              </span>
            </motion.h1>

            {/* Glowing divider accent */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-[#00FF66] via-[#F59E0B] to-transparent rounded-full shadow-[0_0_12px_rgba(0,255,102,0.5)]" />

            {/* Paragraph Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-base text-[#A8C4B0] leading-relaxed max-w-xl font-medium"
            >
              Step into an overgrown realm of mossy ancient ruins and indie fantasy survivors. Hand-tailor your cel-shaded adventurer with organic proportions, weathered iron armor, explorer rucksacks, cloth wraps, and signature weapons.
            </motion.p>

            {/* Action Buttons (Ref: Almost a Hero / RPG Buttons) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/studio"
                className="rpg-auto-equip-btn flex items-center gap-2.5 px-8 py-4 text-sm font-black uppercase text-[#2A1608] shadow-xl hover:scale-105 transition-all"
              >
                <Layers size={18} />
                <span>OUTFITTING BAY</span>
                <ChevronRight size={16} />
              </Link>

              <Link
                href="/lobby"
                className="flex items-center gap-2 px-7 py-4 rounded-full border-2 border-[#8C6239] bg-[#2C180E]/90 hover:bg-[#3E2516] text-[#FDE68A] font-bold text-sm uppercase transition-all shadow-md"
              >
                <Swords size={18} className="text-[#F59E0B]" />
                <span>COLOSSEUM ARENA</span>
              </Link>

              <Link
                href="/ludo"
                className="flex items-center gap-2 px-5 py-4 rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] text-xs font-bold uppercase transition-all"
              >
                <Dices size={18} />
                <span className="hidden sm:inline">LUDO LOUNGE</span>
              </Link>

              <button
                onClick={handleRandomize}
                className="flex items-center gap-2 px-4 py-4 rounded-full border border-[#D97706]/40 bg-[#24160E]/80 hover:bg-[#382417] text-[#F59E0B] text-xs font-bold transition-all shadow-sm"
                title="Randomize Adventurer"
              >
                <Dices size={18} />
                <span className="hidden sm:inline">RANDOM HERO</span>
              </button>
            </div>

          </motion.div>

          {/* Right Column: Interactive 3D Avatar Hero Preview with Ancient Ruin Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative flex flex-col items-center"
          >
            {/* Ancient Ruin Stone & Brass Frame */}
            <div className="relative w-full aspect-[4/5] max-h-[620px] rounded-3xl p-3 overflow-hidden border-2 border-[#8C6239] bg-[#16211B] shadow-[0_12px_45px_rgba(0,0,0,0.7)]">
              {/* Corner status tag matching Almost a Hero badge */}
              <div className="absolute top-5 left-5 z-20 flex items-center gap-2 bg-[#2B1B12]/95 px-3.5 py-1.5 rounded-full border border-[#8C6239] text-xs font-bold text-[#FDE68A] shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                <span>EXPEDITION RIG &bull; {currentAvatar.name.toUpperCase()}</span>
              </div>

              <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5">
                <Link
                  href="/studio"
                  className="px-3.5 py-1.5 rounded-full bg-[#00FF66] text-black text-xs font-black uppercase tracking-wider hover:bg-white transition-all shadow-md"
                >
                  <span>CUSTOMIZE &gt;</span>
                </Link>
              </div>

              {/* 3D Canvas */}
              <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#14231B] via-[#0E1A14] to-[#0A120E]">
                <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: THE THREE OFFICIAL GAME EXPEDITIONS              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#5C3D27]/40">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2C180E] border border-[#8C6239] text-xs font-bold text-[#F59E0B] mb-3">
            <Swords size={13} aria-hidden="true" />
            <span>ACTIVE EXPEDITION QUESTS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#FFF8EE]">
            SELECT YOUR ADVENTURE
          </h2>
          <p className="text-[#CBB49C] mt-3 text-xs sm:text-sm">
            Deploy your custom hand-drawn avatar into tactical 3D colosseums, 4-faction real-time board warfare, and global adventurer runways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game 1: Battle Royale */}
          <div className="rpg-leather-panel p-6 border-2 border-[#5C3D27] flex flex-col justify-between group hover:border-[#F59E0B] transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D97706]/15 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                  <Swords size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#D97706]/20 border border-[#F59E0B]/40 text-[#FDE68A]">
                  8-Hero Tournament
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#F59E0B] transition-colors mb-2">
                COLOSSEUM ARENA
              </h3>
              <p className="text-xs text-[#CBB49C] leading-relaxed mb-4">
                Step onto the ancient mossy ruin grounds. Battle through Quarter-Finals, Semi-Finals, and Grand Finals with species combat arts, tactical dodges, and cinematic critical hits.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6 text-[10px] text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817]">3D Particle VFX</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817]">Species Shields</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817] text-[#FCD34D]">+650 COINS Bounty</span>
              </div>
            </div>

            <Link
              href="/lobby"
              className="rpg-auto-equip-btn w-full py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-102 transition-all shadow-md"
            >
              <span>Deploy to Arena</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Game 2: Colosseum Ludo */}
          <div className="rpg-leather-panel p-6 border-2 border-[#5C3D27] flex flex-col justify-between group hover:border-[#38BDF8] transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                  <Dices size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#BAE6FD]">
                  4-Player Lounge
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#38BDF8] transition-colors mb-2">
                COLOSSEUM LUDO
              </h3>
              <p className="text-xs text-[#CBB49C] leading-relaxed mb-4">
                Gather at the grand colosseum table. Choose between 4 distinct factions, roll physical 3D dice, capture opposing tokens, and sprint to the center sanctuary.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6 text-[10px] text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817]">Physics Dice</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817]">Token Clash</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817] text-[#BAE6FD]">Tactical Safe Zones</span>
              </div>
            </div>

            <Link
              href="/ludo"
              className="w-full py-3 px-4 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Enter Ludo Table</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Game 3: Beauty Contest */}
          <div className="rpg-leather-panel p-6 border-2 border-[#5C3D27] flex flex-col justify-between group hover:border-[#FF5C93] transition-all shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FF5C93]/15 border border-[#FF5C93]/40 flex items-center justify-center text-[#FF5C93]">
                  <Crown size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FF5C93]/20 border border-[#FF5C93]/40 text-[#FBCFE8]">
                  Community Runway
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#FF5C93] transition-colors mb-2">
                BEAUTY RUNWAY
              </h3>
              <p className="text-xs text-[#CBB49C] leading-relaxed mb-4">
                Showcase your customized hero in the Hall of Fashion. Gain likes, climb the global popularity rankings, and win exclusive cosmetics and crowns.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6 text-[10px] text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817]">Global Voting</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817]">Seasonal Crowns</span>
                <span className="px-2.5 py-1 rounded-full bg-[#1A1009] border border-[#442817] text-[#FBCFE8]">Profile Badges</span>
              </div>
            </div>

            <Link
              href="/contest"
              className="w-full py-3 px-4 rounded-full bg-gradient-to-b from-[#F472B6] to-[#DB2777] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Enter Runway</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: OFFICIAL GAME RULES & PROTOCOLS CODEX            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs font-mono font-black uppercase tracking-widest text-[#00FF66] mb-2">// OFFICIAL_RULEBOOK_CODEX //</p>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            GAME RULES & COMBAT PROTOCOLS
          </h2>
          <p className="text-white/70 mt-3 text-xs sm:text-sm font-mono">
            &gt; Master the official mechanics, combat scaling, evasion physics, and win conditions for all three game modes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules: Battle Royale */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/30 flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#00FF66]/20">
              <Swords size={20} className="text-[#00FF66]" />
              <h3 className="text-base font-black uppercase font-mono text-white">
                Battle Royale Protocol
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-mono text-white/80">
              <div className="flex items-start gap-2.5">
                <span className="text-[#00FF66] font-bold">01.</span>
                <p><strong className="text-white">Tournament Bracket:</strong> 8-fighter elimination bracket spanning Quarter-Finals, Semi-Finals, and Grand Finals.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#00FF66] font-bold">02.</span>
                <p><strong className="text-white">Species Combat Arts:</strong> Each species has 4 unique moves: Strike (Physical scaling), Magic (Arcane scaling), Shield (Damage absorption & counter-parry reflect), and Ultimate Overdrive (100% energy).</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#00FF66] font-bold">03.</span>
                <p><strong className="text-white">Dodge & Critical Hits:</strong> High agility grants acrobatic evasive leap (taking 0 damage). Critical strikes bypass armor with cinematic impact shockwaves.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#00FF66] font-bold">04.</span>
                <p><strong className="text-white">Nanite Medbay Cooldown:</strong> Damage sustained requires 30s–5m recovery before re-entering arena (or instant stimpack for 50 COINS). Fairies heal 40% faster.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#00FF66] font-bold">05.</span>
                <p><strong className="text-white">Coin Rewards:</strong> +150 COINS Quarter, +300 COINS Semi, +650 COINS Grand Champion prize.</p>
              </div>
            </div>
          </div>

          {/* Rules: Cyber Ludo */}
          <div className="hud-box glass-panel p-6 border border-cyan-500/30 flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-3 border-b border-cyan-500/20">
              <Dices size={20} className="text-cyan-400" />
              <h3 className="text-base font-black uppercase font-mono text-white">
                Cyber Ludo Protocol
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-mono text-white/80">
              <div className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold">01.</span>
                <p><strong className="text-white">Base Deployment:</strong> 4 tokens per player. You must roll a <strong className="text-cyan-300">6</strong> on the quantum die to deploy a token onto the track. Rolling 6 grants an instant bonus roll.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold">02.</span>
                <p><strong className="text-white">Capture & Bonus Turns:</strong> Landing on an opponent token on any regular track square captures it, sending it back to base and awarding a free bonus turn.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold">03.</span>
                <p><strong className="text-white">Safe Star Havens:</strong> 8 tiles marked with golden Stars ⭐ are quantum-shielded sanctuaries where pieces cannot be captured.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold">04.</span>
                <p><strong className="text-white">Cyber Power-Up Tiles:</strong> Special squares grant Overdrive (+2 steps), Quantum Shield (safe from 1 capture), or Warp Portal (+4 leap).</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold">05.</span>
                <p><strong className="text-white">Singularity Nexus (Win):</strong> Exact roll required to reach the center Home. First player to guide all 4 avatars home wins 1st Place (+500 COINS).</p>
              </div>
            </div>
          </div>

          {/* Rules: Beauty Contest */}
          <div className="hud-box glass-panel p-6 border border-[#FF69B4]/30 flex flex-col gap-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#FF69B4]/20">
              <Heart size={20} className="text-[#FF69B4]" />
              <h3 className="text-base font-black uppercase font-mono text-white">
                Beauty Runway Protocol
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-mono text-white/80">
              <div className="flex items-start gap-2.5">
                <span className="text-[#FF69B4] font-bold">01.</span>
                <p><strong className="text-white">Entry Submission:</strong> Submit your customized avatar build with an expressive, personal tagline to enter the public contest pool.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#FF69B4] font-bold">02.</span>
                <p><strong className="text-white">Decentralized Voting:</strong> Each player casts 1 vote per contest cycle to ensure balanced and fair community evaluation.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#FF69B4] font-bold">03.</span>
                <p><strong className="text-white">Style Aesthetics:</strong> Avatars evaluated across color harmony, accessories, and thematic cybernetic cohesion.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#FF69B4] font-bold">04.</span>
                <p><strong className="text-white">Podium Rankings:</strong> Live leaderboard tracks votes with top creators earning prestige badges and the coveted Beauty Crown.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#FF69B4] font-bold">05.</span>
                <p><strong className="text-white">Cycle Reset:</strong> Weekly cycles crown new champions, archive hall-of-fame entries, and reward bonus coin prizes.</p>
              </div>
            </div>
          </div>
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

        {/* TOP 3 ESPORTS PODIUM PRESENTATION */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto">
            {/* ── #2 PODIUM (SILVER / CYAN) ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="order-2 md:order-1 glass-panel rounded-2xl border border-slate-400/40 p-4 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-slate-900/40 via-[#020502] to-black shadow-[0_0_30px_rgba(148,163,184,0.1)]"
            >
              <div className="absolute top-3 left-3 bg-slate-400 text-black font-black font-mono text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Award size={12} />
                <span>#2</span>
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden bg-black/60 border border-slate-400/20 mb-3 relative">
                <AvatarViewer config={PRESET_AVATARS[1]?.avatar || currentAvatar} className="w-full h-full" showControls={false} animate={true} />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
              <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
                {battleLeaderboard[1]?.name || 'VEX-TITAN'}
              </h3>
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mt-0.5">
                {battleLeaderboard[1]?.classRole || 'Heavy Juggernaut'}
              </p>
              <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-white/10 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Rating</span>
                  <span className="font-bold text-white">{battleLeaderboard[1]?.rating || 2680}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Win %</span>
                  <span className="font-bold text-cyan-400">{battleLeaderboard[1]?.winRate || 87}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Streak</span>
                  <span className="font-bold text-amber-400">8W STREAK</span>
                </div>
              </div>
            </motion.div>

            {/* ── #1 PODIUM (CHAMPION / GOLD & NEON GREEN) ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="order-1 md:order-2 glass-panel rounded-3xl border-2 border-[#00FF66] p-5 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-[#00FF66]/15 via-[#020502] to-black shadow-[0_0_40px_rgba(0,255,102,0.25)] md:-mt-6"
            >
              <div className="absolute top-3 left-3 bg-[#00FF66] text-black font-black font-mono text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_#00FF66]">
                <Crown size={14} />
                <span>#1 APEX</span>
              </div>
              <div className="w-full h-56 rounded-2xl overflow-hidden bg-black/70 border border-[#00FF66]/40 mb-4 relative shadow-[inset_0_0_20px_rgba(0,255,102,0.2)]">
                <AvatarViewer config={PRESET_AVATARS[0]?.avatar || currentAvatar} className="w-full h-full" showControls={false} animate={true} />
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
              <h3 className="text-lg font-black uppercase text-white font-mono tracking-wider flex items-center gap-1.5">
                <span>{battleLeaderboard[0]?.name || 'KAGE-07'}</span>
                <Crown size={16} className="text-amber-400" />
              </h3>
              <p className="text-xs font-mono text-[#00FF66] uppercase tracking-widest mt-0.5 font-bold">
                {battleLeaderboard[0]?.classRole || 'Cyber Shinobi'}
              </p>
              <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-3 border-t border-[#00FF66]/30 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Rating</span>
                  <span className="font-extrabold text-[#00FF66] text-sm">{battleLeaderboard[0]?.rating || 2850}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Win %</span>
                  <span className="font-extrabold text-[#00FF66] text-sm">{battleLeaderboard[0]?.winRate || 92}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Streak</span>
                  <span className="font-extrabold text-amber-400 text-sm">12W STREAK</span>
                </div>
              </div>
            </motion.div>

            {/* ── #3 PODIUM (BRONZE / AMBER) ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="order-3 glass-panel rounded-2xl border border-amber-600/40 p-4 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-amber-950/30 via-[#020502] to-black shadow-[0_0_30px_rgba(217,119,6,0.1)]"
            >
              <div className="absolute top-3 left-3 bg-amber-600 text-white font-black font-mono text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Award size={12} />
                <span>#3</span>
              </div>
              <div className="w-full h-40 rounded-xl overflow-hidden bg-black/60 border border-amber-500/20 mb-3 relative">
                <AvatarViewer config={PRESET_AVATARS[2]?.avatar || PRESET_AVATARS[0]?.avatar} className="w-full h-full" showControls={false} animate={true} />
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black to-transparent pointer-events-none" />
              </div>
              <h3 className="text-base font-black uppercase text-white font-mono tracking-wider">
                {battleLeaderboard[2]?.name || 'AURA-V'}
              </h3>
              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mt-0.5">
                {battleLeaderboard[2]?.classRole || 'Valkyrie Vanguard'}
              </p>
              <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-white/10 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Rating</span>
                  <span className="font-bold text-white">{battleLeaderboard[2]?.rating || 2540}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Win %</span>
                  <span className="font-bold text-amber-400">{battleLeaderboard[2]?.winRate || 83}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase block">Streak</span>
                  <span className="font-bold text-amber-400">5W STREAK</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* COMPACT ESPORTS RANKINGS TABLE */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden font-mono">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-black/60 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4 sm:col-span-3">Combatant</div>
            <div className="col-span-2 hidden sm:block">Role / Source</div>
            <div className="col-span-2 text-center hidden md:block">Record</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-3 sm:col-span-2 text-right">Score / Rating</div>
          </div>

          <div className="divide-y divide-white/5">
            {(leaderboardTab === 'overall'
              ? overallLeaderboard
              : leaderboardTab === 'battle'
              ? battleLeaderboard
              : beautyLeaderboard
            ).map((rawEntry: any, idx: number) => {
              const rank = idx + 1;
              const name = rawEntry.name;
              const rating = rawEntry.rating ?? rawEntry.score ?? rawEntry.likes * 10;
              const wins = rawEntry.victories ?? rawEntry.wins ?? Math.floor(rating / 30);
              const losses = rawEntry.losses ?? 4;
              const winRate = rawEntry.winRate ?? (wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 75);
              const role = rawEntry.classRole || (rawEntry.source === 'beauty' ? 'Fashion Icon' : rawEntry.source === 'both' ? 'Hybrid Apex' : 'Cyber Operative');
              const streak = rank === 1 ? '12W' : rank === 2 ? '8W' : rank === 3 ? '5W' : `${Math.max(1, 7 - rank)}W`;

              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-white/[0.03] transition-colors text-xs ${
                    rank === 1
                      ? 'bg-[#00FF66]/5'
                      : rank === 2
                      ? 'bg-slate-400/[0.02]'
                      : rank === 3
                      ? 'bg-amber-600/[0.02]'
                      : ''
                  }`}
                >
                  <div className="col-span-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-[10px] ${
                        rank === 1
                          ? 'bg-[#00FF66] text-black font-black shadow-[0_0_8px_#00FF66]'
                          : rank === 2
                          ? 'bg-slate-400 text-black'
                          : rank === 3
                          ? 'bg-amber-600 text-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {rank}
                    </span>
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 truncate">
                    <div className="w-5 h-5 rounded-full border border-white/20 bg-gradient-to-br from-[#00FF66] to-[#020502] flex-shrink-0" />
                    <span className="font-bold text-white uppercase tracking-wide truncate">{name}</span>
                  </div>

                  <div className="col-span-2 hidden sm:block text-[11px] text-white/50 truncate">
                    {role}
                  </div>

                  <div className="col-span-2 text-center hidden md:block text-[11px] text-white/60">
                    <span className="text-emerald-400 font-bold">{wins}W</span>
                    <span className="text-white/30 mx-1">-</span>
                    <span className="text-red-400">{losses}L</span>
                  </div>

                  <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                    <span className="text-[11px] font-bold text-[#00FF66]">{winRate}%</span>
                    <div className="w-14 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#00FF66]" style={{ width: `${winRate}%` }} />
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-[#00FF66]">{rating}</span>
                      <span className="text-[9px] text-amber-400 block">{streak} STREAK</span>
                    </div>
                    <Link
                      href="/lobby"
                      className="hidden sm:inline-flex px-2.5 py-1 rounded-lg border border-[#00FF66]/30 hover:bg-[#00FF66] hover:text-black text-[10px] font-bold uppercase tracking-wider text-[#00FF66] transition-all"
                    >
                      VS
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
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
