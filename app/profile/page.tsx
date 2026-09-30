'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Swords,
  Shield,
  Layers,
  Award,
  Zap,
  Activity,
  Flame,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';

const BADGES = [
  { name: 'Singularity Founder', desc: 'Participated in Season 0 beta.', icon: Star, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { name: 'Chroma Alchemist', desc: 'Customized over 50 color variants.', icon: Sparkles, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { name: 'Apex Shinobi', desc: 'Achieved 10 consecutive arena wins.', icon: Swords, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { name: 'Cyber Architect', desc: 'Crafted 5 procedural avatar rigs.', icon: Layers, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
];

const MATCH_HISTORY = [
  { mode: 'Cyber Colosseum', result: 'VICTORY', score: '12 - 4', date: '10m ago', exp: '+450 XP' },
  { mode: 'Neon Zone', result: 'VICTORY', score: '350 - 210', date: '2h ago', exp: '+320 XP' },
  { mode: 'Void Anomaly', result: 'DEFEAT', score: 'Phase 3', date: '1d ago', exp: '+110 XP' },
  { mode: 'Cyber Colosseum', result: 'VICTORY', score: '10 - 8', date: '2d ago', exp: '+400 XP' },
];

export default function ProfilePage() {
  const { currentAvatar, savedAvatars } = useAvatarStore();

  return (
    <div className="min-h-screen bg-[#070912] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Profile Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar thumbnail badge */}
            <div
              className="w-20 h-20 rounded-2xl border-2 border-violet-500/50 p-1 flex-shrink-0 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #7C5CFF30, #22D3EE30)' }}
            >
              <div
                className="w-full h-full rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${currentAvatar.topColor}, ${currentAvatar.hairColor})`,
                }}
              />
              <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded">
                LV.12
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  CYBER_PILOT_99
                </h1>
                <span className="bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  DIAMOND III
                </span>
              </div>
              <p className="text-sm text-white/50 mt-1">
                Active Rig: <span className="text-white font-medium">{currentAvatar.name}</span> &bull; Region: US-EAST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #7C5CFF, #22D3EE)' }}
            >
              <Layers size={16} />
              <span>Modify Active Avatar</span>
            </Link>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">Season 1 Battle Pass: Level 12 / 50</span>
            <span className="text-violet-400 font-bold">4,820 / 6,000 XP</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: '74%',
                background: 'linear-gradient(90deg, #7C5CFF, #22D3EE)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Stats & Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 3D Hologram Rig Showcase */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/15 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Current Rig Showcase</h3>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">3D Interactive</span>
            </div>

            <div className="w-full h-96 rounded-xl overflow-hidden bg-black/60 border border-white/10 relative">
              <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
            </div>

            <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/10">
              <span>Saved in Vault: {savedAvatars.length} Avatars</span>
              <Link href="/avatars" className="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1">
                <span>Open Vault</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Combat Telemetry & Match History */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase font-mono">Win Rate</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-1">78.4%</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase font-mono">K/D Ratio</p>
              <p className="text-2xl font-black font-mono text-cyan-400 mt-1">3.12</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase font-mono">Matches</p>
              <p className="text-2xl font-black font-mono text-white mt-1">142</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase font-mono">Cosmetics</p>
              <p className="text-2xl font-black font-mono text-violet-400 mt-1">28</p>
            </div>
          </div>

          {/* Badges / Accolades */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Earned Accolades</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.name}
                    className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${badge.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{badge.name}</h4>
                      <p className="text-[11px] text-white/50">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Arena Battles */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Recent Arena Battles</h3>
              <Link href="/lobby" className="text-xs text-violet-400 hover:text-violet-300 font-bold">
                Deploy Again &rarr;
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {MATCH_HISTORY.map((match, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black font-mono px-2 py-0.5 rounded text-[10px] ${
                        match.result === 'VICTORY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {match.result}
                    </span>
                    <div>
                      <p className="font-bold text-white">{match.mode}</p>
                      <p className="text-[10px] text-white/40">{match.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-white/70">{match.score}</span>
                    <span className="text-emerald-400 font-bold">{match.exp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
