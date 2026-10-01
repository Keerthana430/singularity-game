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
  CheckCircle2,
  Crown,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { useAuthStore } from '@/store/authStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';

const BADGES = [
  { name: 'Singularity Founder', desc: 'Season 0 early cyber-combat pioneer.', icon: Star, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { name: 'Apex Shinobi', desc: 'Achieved 10 consecutive arena victories.', icon: Swords, color: 'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30' },
  { name: 'Chroma Alchemist', desc: 'Mastered 50+ procedural cyber dyes.', icon: Sparkles, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { name: 'Colosseum Champion', desc: 'Conquered Grand Finals tournament.', icon: Crown, color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
];

const MATCH_HISTORY = [
  { mode: 'Cyber Colosseum', result: 'VICTORY', score: '12 - 4', date: '10m ago', exp: '+450 XP' },
  { mode: 'Cyber Ludo 3D', result: 'VICTORY', score: '4 / 4 Home', date: '45m ago', exp: '+380 XP' },
  { mode: 'Mountain Ascent', result: 'VICTORY', score: 'Summit #40', date: '2h ago', exp: '+500 XP' },
  { mode: 'Tournament Finals', result: 'DEFEAT', score: 'Phase 3', date: '1d ago', exp: '+150 XP' },
];

export default function ProfilePage() {
  const { currentAvatar, savedAvatars } = useAvatarStore();
  const { team } = useAuthStore();

  const playerName = team?.displayName || currentAvatar.name.toUpperCase() || 'KAGE-07';
  const playerRole = ((currentAvatar.classRole || 'MAGE') as string).toUpperCase();

  return (
    <div className="min-h-screen bg-[#020604] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#00FF66]/6 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 left-10 w-[500px] h-[500px] bg-[#00FF66]/4 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff6605_1px,transparent_1px),linear-gradient(to_bottom,#00ff6605_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FUTURISTIC PLAYER IDENTITY PANEL
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative glass-panel p-6 sm:p-8 rounded-3xl border border-[#00FF66]/25 overflow-hidden mb-8 shadow-[0_0_40px_rgba(0,255,102,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Holographic Avatar Badge */}
            <div
              className="w-20 h-20 rounded-2xl border-2 border-[#00FF66]/60 p-1 flex-shrink-0 relative overflow-hidden shadow-[0_0_20px_rgba(0,255,102,0.25)]"
              style={{ background: 'linear-gradient(135deg, rgba(0,255,102,0.15), rgba(0,0,0,0.8))' }}
            >
              <div
                className="w-full h-full rounded-xl flex items-center justify-center font-mono font-black text-xs text-[#00FF66]"
                style={{
                  background: `linear-gradient(135deg, ${currentAvatar.topColor}, ${currentAvatar.hairColor})`,
                }}
              />
              <span className="absolute bottom-1 right-1 bg-black/90 text-[10px] font-mono text-[#00FF66] font-bold px-1.5 py-0.5 rounded border border-[#00FF66]/40">
                LV.24
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1
                  className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {playerName}
                </h1>
                <span className="bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  {playerRole}
                </span>
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded">
                  DIAMOND III
                </span>
              </div>
              <p className="text-xs font-mono text-white/50 mt-1.5 flex items-center gap-2">
                <span>ACTIVE RIG: <span className="text-white font-bold">{currentAvatar.name}</span></span>
                <span>&bull;</span>
                <span>REGION: <span className="text-[#00FF66]">APEX-GLOBAL</span></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="hud-action-btn flex items-center gap-2 px-5 py-3 text-xs uppercase"
            >
              <Layers size={15} />
              <span>Modify Rig In Studio</span>
            </Link>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">Season 1 Protocol Pass: Level 24 / 50</span>
            <span className="text-[#00FF66] font-bold">7,850 / 10,000 XP</span>
          </div>
          <div className="hud-progress-bar">
            <div
              className="hud-progress-fill bg-gradient-to-r from-[#00FF66] to-[#00CC52]"
              style={{ width: '78%' }}
            />
          </div>
        </div>
      </div>

      {/* Grid: 3D Hologram Rig & Telemetry Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 3D Hologram Rig Showcase */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-3xl border border-[#00FF66]/25 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00FF66]">
                  Hologram Rig Showcase
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase">3D Interactive</span>
            </div>

            <div className="w-full h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#030c05] via-[#020502] to-black border border-white/10 relative">
              <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={true} animate={true} />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-2 border-t border-white/10">
              <span>Saved in Vault: {savedAvatars.length} Avatars</span>
              <Link href="/avatars" className="text-[#00FF66] hover:text-white font-bold flex items-center gap-1 transition-colors">
                <span>Open Vault</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Combat Telemetry & Match History */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Win Rate</p>
              <p className="text-2xl font-black text-[#00FF66] mt-1">72%</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Matches</p>
              <p className="text-2xl font-black text-white mt-1">128</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Wins</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">92</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-white/10 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Losses</p>
              <p className="text-2xl font-black text-red-400 mt-1">36</p>
            </div>
          </div>

          {/* Badges / Achievements */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Earned Achievements &amp; Accolades
              </h3>
              <span className="text-[10px] font-mono text-[#00FF66]">4 UNLOCKED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.name}
                    className="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${badge.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-mono">{badge.name}</h4>
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
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Recent Match History
              </h3>
              <Link href="/lobby" className="text-xs font-mono text-[#00FF66] hover:underline flex items-center gap-1">
                <span>Deploy Arena</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {MATCH_HISTORY.map((match, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-black px-2 py-0.5 rounded text-[10px] ${
                        match.result === 'VICTORY'
                          ? 'bg-emerald-500/20 text-[#00FF66] border border-[#00FF66]/30'
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

                  <div className="flex items-center gap-4">
                    <span className="text-white/70">{match.score}</span>
                    <span className="text-[#00FF66] font-bold">{match.exp}</span>
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
