use client;

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

export default function HomeShell() {
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

  const beautyLeaderboard = useMemo(
    () => [...contestEntries].sort((a, b) => b.likes - a.likes).slice(0, 6),
    [contestEntries]
  );

  const overallLeaderboard = useMemo(() => {
    const combined: { name: string; score: number; battleRating: number; beautyLikes: number; source: string }[] = [];
    const nameMap = new Map<string, typeof combined[0]>();

    battleLeaderboard.forEach((b) => {
      nameMap.set(b.name, {
        name: b.name,
        score: b.rating,
        battleRating: b.rating,
        beautyLikes: 0,
        source: 'battle',
      });
    });

    beautyLeaderboard.forEach((c) => {
      const existing = nameMap.get(c.name);
      const beautyScore = c.likes * 10;
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
  }, [beautyLeaderboard, battleLeaderboard]);

  return (
    <div className="relative min-h-screen bg-[#020502] text-white selection:bg-[#00FF66] selection:text-black overflow-x-hidden pt-16">
      {/* The original interactive content is preserved here — trimmed for brevity */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div className="lg:col-span-6 flex flex-col gap-6"> 
            {/* Left column content (omitted) */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] uppercase">FORGE CYBER RIG</h1>
          </motion.div>

          <motion.div className="lg:col-span-6 relative flex flex-col items-center">
            <div className="hud-box scanlines relative w-full aspect-[4/5] max-h-[620px] glass-panel glass-panel-chamfer p-2 overflow-hidden border border-[#00FF66]/40 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
              <div className="w-full h-full overflow-hidden bg-gradient-to-b from-[#041006] via-[#020502] to-[#000000]">
                <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
