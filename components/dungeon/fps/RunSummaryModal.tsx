// components/dungeon/fps/RunSummaryModal.tsx
// Post-Game Run Breakdown, Score Calculation, and Rewards

import React from 'react';
import {
  Trophy,
  RotateCcw,
  DoorOpen,
  Skull,
  Coins,
  Sparkles,
  Zap,
  Target,
  Flame,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { RunStats } from './types';

interface RunSummaryModalProps {
  stats: RunStats;
  onRestart: () => void;
  onReturnToHub: () => void;
}

export function RunSummaryModal({ stats, onRestart, onReturnToHub }: RunSummaryModalProps) {
  const minutes = Math.floor(stats.survivalSeconds / 60);
  const seconds = Math.floor(stats.survivalSeconds % 60);
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-8 backdrop-blur-xl font-mono text-white animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#00FF66]/30 bg-[#07120C] p-7 shadow-[0_0_80px_rgba(0,255,102,0.2)]">
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border shadow-xl ${
              stats.extracted
                ? 'border-cyan-400/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                : 'border-rose-500/50 bg-rose-950/40 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
            }`}
          >
            {stats.extracted ? <DoorOpen size={32} /> : <Skull size={32} />}
          </div>

          <p
            className={`mt-4 text-[10px] font-black uppercase tracking-[0.3em] ${
              stats.extracted ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            {stats.extracted ? 'EXTRACTION SUCCESSFUL' : 'OPERATIVE TERMINATED'}
          </p>
          <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">
            {stats.extracted ? 'Sector Evac Complete' : 'Chassis Critical'}
          </h1>
        </div>

        {/* Big Score Display */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest block">
            TOTAL RUN SCORE
          </span>
          <span className="text-4xl font-black text-[#00FF66] tracking-tight block mt-0.5">
            {stats.score.toLocaleString()} PTS
          </span>
        </div>

        {/* Detailed Stats Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[9px] text-white/40 uppercase block">SURVIVAL TIME</span>
            <span className="font-bold text-white text-base mt-0.5 block">{timeFormatted}</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[9px] text-white/40 uppercase block">MAX THREAT REACHED</span>
            <span className="font-bold text-amber-400 text-base mt-0.5 block">
              TIER {stats.threatTier}
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[9px] text-white/40 uppercase block">HOSTILES PURGED</span>
            <span className="font-bold text-white text-base mt-0.5 block">{stats.kills}</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <span className="text-[9px] text-white/40 uppercase block">PEAK KILL STREAK</span>
            <span className="font-bold text-cyan-400 text-base mt-0.5 block">
              {stats.highestStreak}x
            </span>
          </div>
        </div>

        {/* Currency Rewards Banked */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Coins size={14} className="text-amber-400" /> BOUNTY COINS BANKED
          </span>
          <span className="font-black text-amber-300 text-sm">+{stats.coinsEarned} COINS</span>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={onRestart}
            className="w-full neon-green-button py-3 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Deploy Again (Clean Run)
          </button>
          <button
            onClick={onReturnToHub}
            className="w-full py-3 rounded-xl border border-white/15 hover:border-white/40 bg-black/40 font-bold uppercase text-xs flex items-center justify-center gap-2 text-white/70 hover:text-white"
          >
            Return to Hub
          </button>
        </div>
      </div>
    </div>
  );
}
