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
import { InteractiveAmbientBackground } from '@/components/home/InteractiveAmbientBackground';
import { InteractiveHeroStage } from '@/components/home/InteractiveHeroStage';
import { sound } from '@/lib/audio';

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

const TICKER_ITEMS: {
  iconType: 'colosseum' | 'dungeon' | 'ludo' | 'snakes' | 'runway' | 'studio';
  tag: string;
  text: string;
  color: string;
  link: string;
}[] = [
  { iconType: 'colosseum', tag: 'COLOSSEUM', text: 'Operative KAGE-07 advanced to Grand Finals (+650 COINS bounty)', color: '#F59E0B', link: '/lobby' },
  { iconType: 'dungeon', tag: 'DUNGEON', text: 'Explorer VEX-TITAN breached Floor 4 // Bio-Sanctuary', color: '#00FF66', link: '/dungeon' },
  { iconType: 'ludo', tag: 'LUDO', text: 'Cerulean Vanguard rolled double 6 for an instant sanctuary sprint', color: '#38BDF8', link: '/ludo' },
  { iconType: 'snakes', tag: 'SNAKES', text: 'Pilot QUANTUM-9 warped via Anti-Grav Ladder to Sector 88', color: '#A855F7', link: '/snakes' },
  { iconType: 'runway', tag: 'RUNWAY', text: 'Celestial AURA-V achieved 2,400+ style likes in Hall of Fashion', color: '#F472B6', link: '/contest' },
  { iconType: 'studio', tag: 'STUDIO', text: 'New Relic "Photon Katana" tuned in Outfitting Bay', color: '#34D399', link: '/studio' },
];

export default function HomePage() {
  const { currentAvatar, randomizeAvatar, updateAvatar } = useAvatarStore();
  const { entries: contestEntries } = useContestStore();
  const { add: addToast } = useToast();
  const [leaderboardTab, setLeaderboardTab] = useState<'overall' | 'battle' | 'beauty'>('overall');
  const [battleLeaderboard, setBattleLeaderboard] = useState<BattleLeaderboardEntry[]>(DEFAULT_BATTLE_LEADERBOARD);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);


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
    <div className="relative min-h-screen bg-[#020502] text-white selection:bg-[#00FF66] selection:text-black overflow-x-hidden pt-16">
      {/* Dynamic Interactive Moving Background with Canvas Spores, Mouse Spotlight, and Nebulae */}
      <InteractiveAmbientBackground />

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 flex flex-col gap-6"
          >
            {/* Main Headline with Glitch Effect */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.0] uppercase"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="glitch-text text-white drop-shadow-[0_2px_24px_rgba(255,255,255,0.12)]" data-text="BREAK THE GRID.">
                BREAK THE GRID.
              </span>{' '}<br />
              <span
                className="bg-clip-text text-transparent neon-green-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #00FF66 60%, #39FF14 100%)',
                  filter: 'drop-shadow(0 0 35px rgba(0,255,102,0.35))',
                }}
              >
                FORGE CYBER RIG
              </span>
            </motion.h1>

            {/* Glowing divider accent */}
            <div className="w-28 h-0.5 bg-gradient-to-r from-[#00FF66] via-[#39FF14] to-transparent rounded-full shadow-[0_0_12px_rgba(0,255,102,0.6)]" />
          </motion.div>

          {/* Right Column: Interactive 3D Avatar Hero Stage with Mouse Tilt & Action Triggers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative flex flex-col items-center"
          >
            <InteractiveHeroStage />
          </motion.div>
        </div>
      </section>

      {/* Interactive Live Adventurer Activity Stream Ticker */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 z-10">
        <Link
          href={TICKER_ITEMS[tickerIndex].link}
          onClick={() => sound.playClick()}
          className="group block rounded-2xl border border-[#00FF66]/25 bg-[#08150D]/85 backdrop-blur-xl p-3 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:border-[#00FF66]/60 transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                <span className="text-[#00FF66] font-bold">LIVE SIGNAL</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                <div
                  className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-sm"
                  style={{
                    color: TICKER_ITEMS[tickerIndex].color,
                    borderColor: `${TICKER_ITEMS[tickerIndex].color}50`,
                    background: `${TICKER_ITEMS[tickerIndex].color}18`,
                  }}
                >
                  {TICKER_ITEMS[tickerIndex].iconType === 'colosseum' && <Swords size={13} />}
                  {TICKER_ITEMS[tickerIndex].iconType === 'dungeon' && <Compass size={13} />}
                  {TICKER_ITEMS[tickerIndex].iconType === 'ludo' && <Dices size={13} />}
                  {TICKER_ITEMS[tickerIndex].iconType === 'snakes' && <Zap size={13} />}
                  {TICKER_ITEMS[tickerIndex].iconType === 'runway' && <Sparkles size={13} />}
                  {TICKER_ITEMS[tickerIndex].iconType === 'studio' && <Layers size={13} />}
                </div>
                <span
                  className="font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: TICKER_ITEMS[tickerIndex].color,
                    borderColor: `${TICKER_ITEMS[tickerIndex].color}40`,
                    background: `${TICKER_ITEMS[tickerIndex].color}15`,
                  }}
                >
                  [{TICKER_ITEMS[tickerIndex].tag}]
                </span>
                <span className="text-white/85 group-hover:text-white transition-colors">
                  {TICKER_ITEMS[tickerIndex].text}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00FF66] group-hover:translate-x-1 transition-transform self-end sm:self-center">
              <span>EXPLORE</span>
              <ChevronRight size={13} />
            </div>
          </div>
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: THE SIX OFFICIAL GAME EXPEDITIONS & SUITES        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#5C3D27]/40 z-10">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2C180E] border border-[#8C6239] text-xs sm:text-sm font-bold text-[#F59E0B] mb-3 shadow-md">
            <Swords size={15} aria-hidden="true" />
            <span>ACTIVE EXPEDITION QUESTS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-[#FFF8EE]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            SELECT YOUR ADVENTURE
          </h2>
          <p className="text-[#D4C3B3] mt-4 text-sm sm:text-base leading-relaxed">
            Deploy your custom hand-drawn avatar into tactical 3D colosseums, procedural ruin descents, 4-faction board warfare, zero-gravity cosmic grids, and global runway showcases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {/* Game 1: Battle Royale */}
          <div className="rpg-leather-panel p-6 border-2 border-[#5C3D27] flex flex-col justify-between group hover:border-[#F59E0B] hover:-translate-y-1.5 transition-all shadow-xl rounded-2xl bg-gradient-to-b from-[#180E08] to-[#0A0503]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#D97706]/20 border border-[#F59E0B]/50 flex items-center justify-center text-[#F59E0B] group-hover:scale-110 transition-transform shadow-md">
                  <Swords size={24} />
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#D97706]/20 border border-[#F59E0B]/40 text-[#FDE68A]">
                  8-Hero Arena
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#F59E0B] transition-colors mb-2.5 tracking-wide">
                COLOSSEUM ARENA
              </h3>
              <p className="text-sm text-[#CBB49C] leading-relaxed mb-5">
                Step onto the ancient mossy ruin grounds. Battle through Quarter-Finals, Semi-Finals, and Grand Finals with species combat arts, tactical counter-parries, and devastating Overdrives.
              </p>
              <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-md bg-[#1A1009] border border-[#442817] font-medium">3D VFX</span>
                <span className="px-2.5 py-1 rounded-md bg-[#1A1009] border border-[#442817] font-medium">Species Arts</span>
                <span className="px-2.5 py-1 rounded-md bg-[#1A1009] border border-[#442817] text-[#FCD34D] font-bold">+650 COINS</span>
              </div>
            </div>

            <Link
              href="/lobby"
              onClick={() => sound.playClick()}
              className="rpg-auto-equip-btn w-full py-3 px-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-102 transition-all shadow-md rounded-xl"
            >
              <span>Deploy to Arena</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Game 2: Dungeon Roguelike */}
          <div className="rpg-leather-panel p-6 border-2 border-[#1E4D34] flex flex-col justify-between group hover:border-[#00FF66] hover:-translate-y-1.5 transition-all shadow-xl rounded-2xl bg-gradient-to-b from-[#08150E] to-[#040B07]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#00FF66]/20 border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66] group-hover:scale-110 transition-transform shadow-md">
                  <Compass size={24} />
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66]">
                  6-Floor 3D Ruin
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#00FF66] transition-colors mb-2.5 tracking-wide">
                DUNGEON // DESCENT
              </h3>
              <p className="text-sm text-[#CBB49C] leading-relaxed mb-5">
                Descend into procedural ruin chambers. Battle adaptive hostiles with real-time WASD combat, assemble powerful relic synergies, and conquer multi-phase boss guardians.
              </p>
              <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-md bg-[#0A170F] border border-[#163624] font-medium">Active WASD</span>
                <span className="px-2.5 py-1 rounded-md bg-[#0A170F] border border-[#163624] font-medium">Relic Synergies</span>
                <span className="px-2.5 py-1 rounded-md bg-[#0A170F] border border-[#163624] text-[#00FF66] font-bold">+850 COINS</span>
              </div>
            </div>

            <Link
              href="/dungeon"
              onClick={() => sound.playClick()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-b from-[#00FF66] to-[#00993D] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Descend Ruin</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Game 3: Colosseum Ludo */}
          <div className="rpg-leather-panel p-6 border-2 border-[#1E3A5F] flex flex-col justify-between group hover:border-[#38BDF8] hover:-translate-y-1.5 transition-all shadow-xl rounded-2xl bg-gradient-to-b from-[#081524] to-[#040810]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/50 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform shadow-md">
                  <Dices size={24} />
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#BAE6FD]">
                  4-Player 3D Board
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#38BDF8] transition-colors mb-2.5 tracking-wide">
                COLOSSEUM LUDO
              </h3>
              <p className="text-sm text-[#CBB49C] leading-relaxed mb-5">
                Gather at the grand colosseum table. Choose between 4 distinct factions, roll physical 3D quantum dice, capture opposing tokens, and trigger quantum power-up tiles.
              </p>
              <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-md bg-[#0B1726] border border-[#1A334E] font-medium">Physics Dice</span>
                <span className="px-2.5 py-1 rounded-md bg-[#0B1726] border border-[#1A334E] font-medium">Combat Clashes</span>
                <span className="px-2.5 py-1 rounded-md bg-[#0B1726] border border-[#1A334E] text-[#BAE6FD] font-bold">+500 COINS</span>
              </div>
            </div>

            <Link
              href="/ludo"
              onClick={() => sound.playClick()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Enter Ludo Table</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Game 4: Cosmic Snakes & Ladders */}
          <div className="rpg-leather-panel p-6 border-2 border-[#3B1C54] flex flex-col justify-between group hover:border-[#A855F7] hover:-translate-y-1.5 transition-all shadow-xl rounded-2xl bg-gradient-to-b from-[#180A26] to-[#0B0414]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#A855F7]/20 border border-[#A855F7]/50 flex items-center justify-center text-[#A855F7] group-hover:scale-110 transition-transform shadow-md">
                  <Zap size={24} />
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#A855F7]/20 border border-[#A855F7]/40 text-[#E9D5FF]">
                  100-Tile Quantum Grid
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#A855F7] transition-colors mb-2.5 tracking-wide">
                COSMIC SNAKES
              </h3>
              <p className="text-sm text-[#CBB49C] leading-relaxed mb-5">
                Ascend the 10x10 zero-gravity cyber matrix. Ride anti-grav hyper-ladders straight to the summit, dodge wormhole black-hole drops, and trigger propulsion speed boosts.
              </p>
              <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-md bg-[#1B0C2B] border border-[#3A1856] font-medium">Hyper-Ladders</span>
                <span className="px-2.5 py-1 rounded-md bg-[#1B0C2B] border border-[#3A1856] font-medium">Wormholes</span>
                <span className="px-2.5 py-1 rounded-md bg-[#1B0C2B] border border-[#3A1856] text-[#E9D5FF] font-bold">+400 COINS</span>
              </div>
            </div>

            <Link
              href="/snakes"
              onClick={() => sound.playClick()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-b from-[#A855F7] to-[#7E22CE] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Ascend Matrix</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Game 5: Beauty Contest */}
          <div className="rpg-leather-panel p-6 border-2 border-[#5C1D38] flex flex-col justify-between group hover:border-[#FF5C93] hover:-translate-y-1.5 transition-all shadow-xl rounded-2xl bg-gradient-to-b from-[#1C0A14] to-[#0C0409]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF5C93]/20 border border-[#FF5C93]/50 flex items-center justify-center text-[#FF5C93] group-hover:scale-110 transition-transform shadow-md">
                  <Crown size={24} />
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#FF5C93]/20 border border-[#FF5C93]/40 text-[#FBCFE8]">
                  Community Stage
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#FF5C93] transition-colors mb-2.5 tracking-wide">
                BEAUTY RUNWAY
              </h3>
              <p className="text-sm text-[#CBB49C] leading-relaxed mb-5">
                Showcase your customized hero in the Hall of Fashion. Gain likes, climb the global popularity rankings, and win exclusive cosmetics and crowns.
              </p>
              <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-md bg-[#1C0913] border border-[#3D1429] font-medium">Decentralized Votes</span>
                <span className="px-2.5 py-1 rounded-md bg-[#1C0913] border border-[#3D1429] font-medium">Prestige Badges</span>
                <span className="px-2.5 py-1 rounded-md bg-[#1C0913] border border-[#3D1429] text-[#FBCFE8] font-bold">+350 COINS</span>
              </div>
            </div>

            <Link
              href="/contest"
              onClick={() => sound.playClick()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-b from-[#F472B6] to-[#DB2777] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Enter Runway</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Game 6: Avatar Studio */}
          <div className="rpg-leather-panel p-6 border-2 border-[#134E4A] flex flex-col justify-between group hover:border-[#34D399] hover:-translate-y-1.5 transition-all shadow-xl rounded-2xl bg-gradient-to-b from-[#061816] to-[#020A09]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#34D399]/20 border border-[#34D399]/50 flex items-center justify-center text-[#34D399] group-hover:scale-110 transition-transform shadow-md">
                  <Layers size={24} />
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-[#A7F3D0]">
                  Outfitting Bay
                </span>
              </div>
              <h3 className="text-xl font-black uppercase text-[#FFF8EE] group-hover:text-[#34D399] transition-colors mb-2.5 tracking-wide">
                AVATAR STUDIO
              </h3>
              <p className="text-sm text-[#CBB49C] leading-relaxed mb-5">
                Deep cybernetic customization suite. Equip legendary relic weapons, tune procedural particle auras, adjust species gear color palettes, and export 3D avatar builds.
              </p>
              <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#A8927E]">
                <span className="px-2.5 py-1 rounded-md bg-[#0A1E1B] border border-[#153F39] font-medium">Deep Customizer</span>
                <span className="px-2.5 py-1 rounded-md bg-[#0A1E1B] border border-[#153F39] font-medium">Relic Outfits</span>
                <span className="px-2.5 py-1 rounded-md bg-[#0A1E1B] border border-[#153F39] text-[#A7F3D0] font-bold">3D Stage</span>
              </div>
            </div>

            <Link
              href="/studio"
              onClick={() => sound.playClick()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-b from-[#34D399] to-[#059669] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md"
            >
              <span>Open Avatar Studio</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: OFFICIAL GAME RULES & PROTOCOLS CODEX            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-[#00FF66] mb-2">// OFFICIAL_RULEBOOK_CODEX //</p>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            GAME RULES & COMBAT PROTOCOLS
          </h2>
          <p className="text-white/80 mt-3 text-sm sm:text-base font-mono leading-relaxed">
            &gt; Master the official mechanics, combat scaling, evasion physics, and win conditions across all Singularity game protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {/* Rules: Battle Royale */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/30 flex flex-col gap-5 rounded-2xl bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#00FF66]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00FF66]/15 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66]">
                  <Swords size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase font-mono text-white tracking-wide">
                  Colosseum Battle
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30">8-HERO</span>
            </div>

            <div className="space-y-4 text-sm font-sans sm:font-mono text-white/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">01.</span>
                <p><strong className="text-white font-bold">Tournament Bracket:</strong> 8-fighter elimination bracket spanning Quarter-Finals, Semi-Finals, and Grand Finals.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">02.</span>
                <p><strong className="text-white font-bold">Species Combat Arts:</strong> Each species has 4 unique moves: Strike (Physical scaling), Magic (Arcane scaling), Shield (Damage absorption & counter-parry reflect), and Ultimate Overdrive (100% energy).</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">03.</span>
                <p><strong className="text-white font-bold">Dodge & Critical Hits:</strong> High agility grants acrobatic evasive leap (taking 0 damage). Critical strikes bypass armor with cinematic impact shockwaves.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">04.</span>
                <p><strong className="text-white font-bold">Nanite Medbay Recovery:</strong> Damage sustained requires 30s–5m recovery before re-entering arena (or instant stimpack for 50 COINS). Fairies heal 40% faster.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">05.</span>
                <p><strong className="text-white font-bold">Coin Rewards:</strong> +150 COINS Quarter, +300 COINS Semi, +650 COINS Grand Champion prize.</p>
              </div>
            </div>
          </div>

          {/* Rules: Dungeon Descent */}
          <div className="hud-box glass-panel p-6 border border-[#00FF66]/30 flex flex-col gap-5 rounded-2xl bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#00FF66]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00FF66]/15 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66]">
                  <Compass size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase font-mono text-white tracking-wide">
                  Dungeon Descent
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30">6-FLOOR</span>
            </div>

            <div className="space-y-4 text-sm font-sans sm:font-mono text-white/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">01.</span>
                <p><strong className="text-white font-bold">Procedural Route:</strong> Node chamber map with Combat, Elites, Relic Caches, and Cyber Merchants.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">02.</span>
                <p><strong className="text-white font-bold">Active Combat:</strong> Real-time WASD movement, dash evasions, arc pulses, and Overdrive abilities.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">03.</span>
                <p><strong className="text-white font-bold">Adaptive Relics:</strong> Shape your build per floor with attack mods, health restores, and soul shards.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">04.</span>
                <p><strong className="text-white font-bold">Multi-Phase Bosses:</strong> Defeat floor guardians with bullet patterns, minion spawns, and stage transitions.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#00FF66] font-bold text-sm sm:text-base shrink-0 mt-0.5">05.</span>
                <p><strong className="text-white font-bold">Core Endings:</strong> Resolve the Core at Floor 6 for up to +850 COINS and narrative epilogues.</p>
              </div>
            </div>
          </div>

          {/* Rules: Cyber Ludo */}
          <div className="hud-box glass-panel p-6 border border-cyan-500/30 flex flex-col gap-5 rounded-2xl bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Dices size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase font-mono text-white tracking-wide">
                  Cyber Ludo
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">4-FACTION</span>
            </div>

            <div className="space-y-4 text-sm font-sans sm:font-mono text-white/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">01.</span>
                <p><strong className="text-white font-bold">Base Deployment:</strong> 4 tokens per player. You must roll a <strong className="text-cyan-300">6</strong> on the quantum die to deploy a token onto the track. Rolling 6 grants an instant bonus roll.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">02.</span>
                <p><strong className="text-white font-bold">Capture & Bonus Turns:</strong> Landing on an opponent token on any regular track square captures it, sending it back to base and awarding a free bonus turn.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">03.</span>
                <p><strong className="text-white font-bold">Safe Star Havens:</strong> 8 tiles marked with Star sanctuaries are quantum-shielded zones where pieces cannot be captured.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">04.</span>
                <p><strong className="text-white font-bold">Cyber Power-Up Tiles:</strong> Special squares grant Overdrive Boost (+2 steps), Quantum Shield (safe from 1 capture), or Warp Portal (+4 leap).</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">05.</span>
                <p><strong className="text-white font-bold">Singularity Nexus (Win):</strong> Exact roll required to reach the center Home. First player to guide all 4 avatars home wins 1st Place (+500 COINS).</p>
              </div>
            </div>
          </div>

          {/* Rules: Cosmic Snakes & Ladders */}
          <div className="hud-box glass-panel p-6 border border-purple-500/30 flex flex-col gap-5 rounded-2xl bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Zap size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase font-mono text-white tracking-wide">
                  Cosmic Snakes
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">100-TILE</span>
            </div>

            <div className="space-y-4 text-sm font-sans sm:font-mono text-white/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">01.</span>
                <p><strong className="text-white font-bold">Serpentine Grid:</strong> 100 numbered tiles arranged in a boustrophedon zigzag trajectory across the zero-gravity quantum sector.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">02.</span>
                <p><strong className="text-white font-bold">Anti-Grav Hyper-Ladders:</strong> Landing at the base of a cyber ladder propels your avatar upward across sectors instantly to higher tiers.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">03.</span>
                <p><strong className="text-white font-bold">Cosmic Wormholes:</strong> Landing on an anomaly maw pulls your avatar downward to an earlier sector. Navigate with care!</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">04.</span>
                <p><strong className="text-white font-bold">Overdrive Rolls:</strong> Rolling a <strong className="text-purple-300">6</strong> triggers an instant bonus propulsion roll, accelerating your path to the summit.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-purple-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">05.</span>
                <p><strong className="text-white font-bold">Summit Escape (Win):</strong> Exact roll required on tile 100 to escape the singularity and claim 1st Place (+400 COINS).</p>
              </div>
            </div>
          </div>

          {/* Rules: Beauty Runway */}
          <div className="hud-box glass-panel p-6 border border-[#FF69B4]/30 flex flex-col gap-5 rounded-2xl bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#FF69B4]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FF69B4]/15 border border-[#FF69B4]/30 flex items-center justify-center text-[#FF69B4]">
                  <Crown size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase font-mono text-white tracking-wide">
                  Beauty Runway
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#FF69B4]/15 text-[#FF69B4] border border-[#FF69B4]/30">STYLE VOTE</span>
            </div>

            <div className="space-y-4 text-sm font-sans sm:font-mono text-white/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-[#FF69B4] font-bold text-sm sm:text-base shrink-0 mt-0.5">01.</span>
                <p><strong className="text-white font-bold">Entry Submission:</strong> Submit your customized avatar build with an expressive tagline to enter the public contest pool.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#FF69B4] font-bold text-sm sm:text-base shrink-0 mt-0.5">02.</span>
                <p><strong className="text-white font-bold">Decentralized Voting:</strong> Each player casts 1 vote per contest cycle to ensure balanced and fair community evaluation.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#FF69B4] font-bold text-sm sm:text-base shrink-0 mt-0.5">03.</span>
                <p><strong className="text-white font-bold">Style Aesthetics:</strong> Avatars evaluated across color harmony, accessories, and thematic cybernetic cohesion.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#FF69B4] font-bold text-sm sm:text-base shrink-0 mt-0.5">04.</span>
                <p><strong className="text-white font-bold">Podium Rankings:</strong> Live leaderboard tracks votes with top creators earning prestige badges and the coveted Beauty Crown.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-[#FF69B4] font-bold text-sm sm:text-base shrink-0 mt-0.5">05.</span>
                <p><strong className="text-white font-bold">Cycle Reset:</strong> Weekly cycles crown new champions, archive hall-of-fame entries, and reward bonus coin prizes (+350 COINS).</p>
              </div>
            </div>
          </div>

          {/* Rules: Avatar Studio */}
          <div className="hud-box glass-panel p-6 border border-emerald-500/30 flex flex-col gap-5 rounded-2xl bg-black/40 backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers size={20} />
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase font-mono text-white tracking-wide">
                  Avatar Studio
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">OUTFITTING</span>
            </div>

            <div className="space-y-4 text-sm font-sans sm:font-mono text-white/85 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">01.</span>
                <p><strong className="text-white font-bold">Species Archetypes:</strong> Select from 5 core archetypes (Human, Cyborg, Kitsune, Elf, Fairy) with unique physical attributes.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">02.</span>
                <p><strong className="text-white font-bold">Relic Equipment Bay:</strong> Equip legendary weapons, headgear, armor, and accessories with live cel-shaded previews.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">03.</span>
                <p><strong className="text-white font-bold">Color Matrix Tuning:</strong> Real-time hex color customization for hair, eyes, outfit accents, and particle glow emissions.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">04.</span>
                <p><strong className="text-white font-bold">Interactive 3D Stage:</strong> Inspect your avatar with full 360° camera rotation, combat animations, and lighting controls.</p>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-400 font-bold text-sm sm:text-base shrink-0 mt-0.5">05.</span>
                <p><strong className="text-white font-bold">Universal Sync:</strong> Saves instantly to local storage, immediately ready for deployment in all 5 game arenas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* COMBINED OVERALL LEADERBOARD SECTION                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="rankings" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-[#00FF66]/20 scroll-mt-20">
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
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/60">
            <Link href="/studio" className="hover:text-[#00FF66] transition-colors">[STUDIO]</Link>
            <Link href="/dungeon" className="hover:text-[#00FF66] transition-colors">[DUNGEON]</Link>
            <Link href="/lobby" className="hover:text-[#00FF66] transition-colors">[ARENA]</Link>
            <Link href="/contest" className="hover:text-[#00FF66] transition-colors">[CONTEST]</Link>
            <Link href="/style-guide" className="hover:text-[#00FF66] transition-colors">[SYS_GUIDE]</Link>
          </div>
          <div className="text-[10px] text-white/40 tracking-[0.3em] font-mono">
            |||||||||||||||||||| D3V_UNKNOWN_2026
          </div>
        </div>
      </footer>
    </div>
  );
}
