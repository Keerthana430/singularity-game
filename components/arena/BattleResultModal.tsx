'use client';
// components/arena/BattleResultModal.tsx
// Cinematic Victory, Championship Ceremony, and Defeat debrief modals
// with interactive victory emotes and coin reward breakdowns.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Coins,
  FastForward,
  RotateCcw,
  Sparkles,
  Heart,
  Swords,
  Shield,
  Zap,
  Check,
  Flame,
  ArrowRight,
  Home,
} from 'lucide-react';
import { sound } from '@/lib/audio';

export interface VictoryEmote {
  id: string;
  label: string;
  icon: string;
  desc: string;
  fxColor: string;
}

export const VICTORY_EMOTES: VictoryEmote[] = [
  { id: 'dance', label: 'Victory Rave', icon: 'RAVE', desc: 'Futuristic rave bounce', fxColor: '#00FF66' },
  { id: 'flex', label: 'Titan Flex', icon: 'POWER', desc: 'Overdrive power surge', fxColor: '#F59E0B' },
  { id: 'salute', label: 'Cyber Salute', icon: 'SALUTE', desc: 'Vanguard tactical respect', fxColor: '#38BDF8' },
  { id: 'crown', label: 'Crown Ascend', icon: 'CROWN', desc: 'Summon golden holo-crown', fxColor: '#FBBF24' },
  { id: 'starlight', label: 'Astral Spin', icon: 'STARLIGHT', desc: 'Glittering cosmic pirouette', fxColor: '#EC4899' },
  { id: 'gg', label: 'Holo GG', icon: 'SURGE', desc: 'Project neon GG badge', fxColor: '#A855F7' },
];

interface BattleResultModalProps {
  outcome: 'stage-victory' | 'tournament-champion' | 'defeat' | null;
  stageTitle: string;
  nextStageTitle?: string;
  coinsEarned: number;
  playerName: string;
  opponentName: string;
  turnsTaken: number;
  damageDealt: number;
  healTimeLeft?: number;
  onNextStage?: () => void;
  onInstantHeal?: () => void;
  onReturnToBase: () => void;
  onNewTournament: () => void;
  onTriggerEmote?: (emote: VictoryEmote) => void;
}

export function BattleResultModal({
  outcome,
  stageTitle,
  nextStageTitle,
  coinsEarned,
  playerName,
  opponentName,
  turnsTaken,
  damageDealt,
  healTimeLeft = 0,
  onNextStage,
  onInstantHeal,
  onReturnToBase,
  onNewTournament,
  onTriggerEmote,
}: BattleResultModalProps) {
  const [selectedEmote, setSelectedEmote] = useState<string | null>(null);

  if (!outcome) return null;

  const handleEmoteClick = (emote: VictoryEmote) => {
    setSelectedEmote(emote.id);
    sound.playEquip();
    if (onTriggerEmote) onTriggerEmote(emote);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#080d0a] border border-white/15 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div
            className={`absolute -top-32 -left-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${
              outcome === 'defeat'
                ? 'bg-red-600/25'
                : outcome === 'tournament-champion'
                ? 'bg-amber-500/30'
                : 'bg-[#00FF66]/20'
            }`}
          />
          <div
            className={`absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-[100px] pointer-events-none ${
              outcome === 'defeat'
                ? 'bg-rose-900/30'
                : outcome === 'tournament-champion'
                ? 'bg-yellow-500/25'
                : 'bg-emerald-600/20'
            }`}
          />

          {/* ───────────────────────────────────────────────────────────── */}
          {/* HEADER BADGE                                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center text-center mb-6">
            {outcome === 'tournament-champion' && (
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-3"
              >
                <Crown size={44} className="text-amber-300 drop-shadow-[0_0_15px_#F59E0B]" />
              </motion.div>
            )}

            {outcome === 'stage-victory' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-[#00FF66]/20 border-2 border-[#00FF66] flex items-center justify-center shadow-[0_0_25px_rgba(0,255,102,0.4)] mb-3"
              >
                <Trophy size={36} className="text-[#00FF66]" />
              </motion.div>
            )}

            {outcome === 'defeat' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.4)] mb-3"
              >
                <Flame size={36} className="text-red-400" />
              </motion.div>
            )}

            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white/50">
              {stageTitle}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white mt-1">
              {outcome === 'tournament-champion' && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow">
                  TOURNAMENT CHAMPION
                </span>
              )}
              {outcome === 'stage-victory' && (
                <span className="text-[#00FF66] drop-shadow-[0_0_15px_rgba(0,255,102,0.4)]">
                  VICTORY ACHIEVED!
                </span>
              )}
              {outcome === 'defeat' && (
                <span className="text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  SYSTEM OVERRIDE // ELIMINATED
                </span>
              )}
            </h2>

            <p className="text-xs text-white/60 mt-1 max-w-sm">
              {outcome === 'tournament-champion' &&
                `Unstoppable prowess! ${playerName} conquered all contenders and claimed the apex crown.`}
              {outcome === 'stage-victory' &&
                `${playerName} decisively overpowered ${opponentName} and advanced to the next tier.`}
              {outcome === 'defeat' &&
                `${playerName} sustained critical damage against ${opponentName}. Avatar requires nanite regeneration.`}
            </p>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* STATS & REWARDS METRICS                                       */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-white/40 uppercase">Coins Earned</span>
              <div className="flex items-center gap-1 mt-1 text-amber-300 font-black font-mono text-base sm:text-lg">
                <Coins size={14} />
                <span>+{coinsEarned}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-white/40 uppercase">Damage Dealt</span>
              <span className="mt-1 text-rose-400 font-black font-mono text-base sm:text-lg">
                {damageDealt}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-white/40 uppercase">Turns Taken</span>
              <span className="mt-1 text-cyan-300 font-black font-mono text-base sm:text-lg">
                {turnsTaken}
              </span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VICTORY EMOTES SELECTOR (On Victory)                          */}
          {/* ───────────────────────────────────────────────────────────── */}
          {outcome !== 'defeat' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/60 font-bold flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Choose Victory Emote</span>
                </span>
                <span className="text-[9px] font-mono text-white/40">Plays on your avatar</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {VICTORY_EMOTES.map((em) => {
                  const isSelected = selectedEmote === em.id;
                  return (
                    <button
                      key={em.id}
                      onClick={() => handleEmoteClick(em)}
                      className={`min-h-[76px] min-w-0 rounded-xl border px-2 py-2 text-center flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#00FF66] bg-[#00FF66]/20 shadow-[0_0_12px_rgba(0,255,102,0.4)] scale-105'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[15px] leading-none mb-1 font-black tracking-[0.16em] text-white/90">{em.icon}</span>
                      <span className="text-[9px] leading-tight font-mono font-bold text-white uppercase break-words">
                        {em.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* HEALING NOTICE ON DEFEAT                                      */}
          {/* ───────────────────────────────────────────────────────────── */}
          {outcome === 'defeat' && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Heart size={20} className="text-red-400 shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white">Nanite Medbay Regeneration</p>
                  <p className="text-[10px] font-mono text-white/50">
                    {healTimeLeft > 0
                      ? `${healTimeLeft}s remaining before next deployment`
                      : 'Regeneration complete! Ready for battle.'}
                  </p>
                </div>
              </div>

              {healTimeLeft > 0 && onInstantHeal && (
                <button
                  onClick={onInstantHeal}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold transition-all shrink-0"
                >
                  Heal (50 Coins)
                </button>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ACTION BUTTONS                                                */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3">
            {outcome === 'stage-victory' && onNextStage && (
              <button
                onClick={() => {
                  sound.playClick();
                  onNextStage();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#00FF66] to-emerald-400 hover:from-emerald-300 hover:to-[#00FF66] text-black font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(0,255,102,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Advance to {nextStageTitle || 'Next Round'}</span>
                <ArrowRight size={14} className="stroke-[3]" />
              </button>
            )}

            {outcome === 'tournament-champion' && (
              <button
                onClick={() => {
                  sound.playClick();
                  onNewTournament();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-yellow-300 hover:to-amber-400 text-black font-black uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Crown size={15} />
                <span>Defend Title (New Tournament)</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onReturnToBase();
              }}
              className="flex items-center justify-center gap-1.5 py-3 px-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs transition-all hover:border-white/30"
            >
              <Home size={14} />
              <span>Return to Base</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
