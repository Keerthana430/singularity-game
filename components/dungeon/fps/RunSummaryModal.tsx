// components/dungeon/fps/RunSummaryModal.tsx
// Post-Game Run Breakdown, Score Calculation, and Rewards

import React from 'react';
import {
  RotateCcw,
  DoorOpen,
  Skull,
  Coins,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { RunStats } from './types';

interface RunSummaryModalProps {
  stats: RunStats;
  onRestart: () => void;
  onReturnToHub: () => void;
  onNextSector?: () => void;
  currentSector?: number;
}

export function RunSummaryModal({
  stats,
  onRestart,
  onReturnToHub,
  onNextSector,
  currentSector = 1,
}: RunSummaryModalProps) {
  const minutes = Math.floor(stats.survivalSeconds / 60);
  const seconds = Math.floor(stats.survivalSeconds % 60);
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Performance Rank Rating
  const rankGrade =
    stats.score >= 10000
      ? { grade: 'S', label: 'APEX OPERATIVE', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)', border: '#FFD700' }
      : stats.score >= 5000
      ? { grade: 'A', label: 'VANGUARD ELITE', color: '#00FF66', bg: 'rgba(0, 255, 102, 0.15)', border: '#00FF66' }
      : stats.score >= 2000
      ? { grade: 'B', label: 'SECTOR SCOUT', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38BDF8' }
      : { grade: 'C', label: 'SURVIVOR RECRUIT', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-xl font-mono text-white animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#00FF66]/30 bg-[#07120C] p-6 shadow-[0_0_80px_rgba(0,255,102,0.2)] my-auto">
        {/* Header Icon, Title & Rank Badge */}
        <div className="flex flex-col items-center text-center relative">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border shadow-xl ${
              stats.extracted
                ? 'border-cyan-400/50 bg-cyan-950/40 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                : 'border-rose-500/50 bg-rose-950/40 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
            }`}
          >
            {stats.extracted ? <DoorOpen size={32} /> : <Skull size={32} />}
          </div>

          {/* S/A/B/C Rank Badge */}
          <div
            className="absolute top-0 right-0 px-3 py-1.5 rounded-2xl border flex items-center gap-1.5 shadow-lg"
            style={{
              backgroundColor: rankGrade.bg,
              borderColor: rankGrade.border,
              color: rankGrade.color,
            }}
          >
            <Award size={16} />
            <span className="text-xl font-black">{rankGrade.grade}</span>
            <span className="text-[9px] font-bold tracking-wider hidden sm:inline">RANK</span>
          </div>

          <p
            className={`mt-4 text-[10px] font-black uppercase tracking-[0.3em] ${
              stats.extracted ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            {stats.extracted ? `SECTOR ${currentSector} EVACUATION COMPLETE` : `SECTOR ${currentSector} OPERATIVE TERMINATED`}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight">
            {stats.extracted ? 'Quantum Extraction Success' : 'Chassis Critical'}
          </h1>
          <p className="text-[11px] font-bold tracking-wider mt-0.5" style={{ color: rankGrade.color }}>
            {rankGrade.label}
          </p>
        </div>

        {/* Big Score Display */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3.5 text-center">
          <span className="text-[10px] text-white/50 uppercase tracking-widest block">
            TOTAL EXPEDITION SCORE
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#00FF66] tracking-tight block mt-0.5">
            {stats.score.toLocaleString()} PTS
          </span>
        </div>

        {/* Detailed Stats Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[9px] text-white/40 uppercase block">SURVIVAL TIME</span>
            <span className="font-bold text-white text-sm sm:text-base mt-0.5 block">{timeFormatted}</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[9px] text-white/40 uppercase block">MAX THREAT REACHED</span>
            <span className="font-bold text-amber-400 text-sm sm:text-base mt-0.5 block">
              TIER {stats.threatTier}
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[9px] text-white/40 uppercase block">HOSTILES PURGED</span>
            <span className="font-bold text-white text-sm sm:text-base mt-0.5 block">{stats.kills}</span>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
            <span className="text-[9px] text-white/40 uppercase block">PEAK KILL STREAK</span>
            <span className="font-bold text-cyan-400 text-sm sm:text-base mt-0.5 block">
              {stats.highestStreak}x
            </span>
          </div>
        </div>

        {/* Currency Rewards Banked (Credited directly into avatar store) */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-3 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Coins size={14} className="text-amber-400" /> BOUNTY CREDITS BANKED
            </span>
            <span className="text-[9px] text-amber-200/60 mt-0.5">
              {stats.extracted ? 'Permanent deposit locked into Central Vault' : 'Salvage recovery fraction banked'}
            </span>
          </div>
          <span className="font-black text-amber-300 text-base">+{stats.coinsEarned} COINS</span>
        </div>

        {/* ─── CONCISE 5-POINT DUNGEON PROTOCOL CARD ─── */}
        <div className="mt-4 rounded-xl border border-[#00FF66]/20 bg-[#00FF66]/[0.03] p-3 text-left">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#00FF66] flex items-center gap-1.5 mb-2">
            <ShieldCheck size={12} /> SECTOR PROTOCOLS (5 RULES)
          </span>
          <ol className="text-[10px] text-white/70 space-y-1 list-decimal list-inside leading-relaxed">
            <li><span className="text-white font-semibold">Wave Defense:</span> Eliminate hostiles across escalating danger tiers.</li>
            <li><span className="text-white font-semibold">Central Dais:</span> Step on [0,0] to replenish full ammo and equip heavy weapons.</li>
            <li><span className="text-white font-semibold">Emergency Drops:</span> Slain foes guarantee ammo crates when reserves are low.</li>
            <li><span className="text-white font-semibold">Extraction Pad:</span> Channel teleporter with [E] to escape before chassis critical.</li>
            <li><span className="text-white font-semibold">Vault Banking:</span> Extraction banks permanent coins and unlocks deeper sectors.</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          {stats.extracted && onNextSector && (
            <button
              onClick={onNextSector}
              className="w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-[#00FF66] to-[#22D3EE] text-[#07120C] shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Sparkles size={16} /> Descend to Sector {currentSector + 1}: Deep Abyss <ArrowRight size={16} />
            </button>
          )}

          <button
            onClick={onRestart}
            className="w-full neon-green-button py-3 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Deploy Again (Clean Sector 1)
          </button>
          <button
            onClick={onReturnToHub}
            className="w-full py-2.5 rounded-xl border border-white/15 hover:border-white/40 bg-black/40 font-bold uppercase text-xs flex items-center justify-center gap-2 text-white/70 hover:text-white"
          >
            Return to Hub
          </button>
        </div>
      </div>
    </div>
  );
}
