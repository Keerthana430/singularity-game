'use client';
// components/arena/VersusScreen.tsx
// Cinematic Full-Screen VS Intro Screen before entering the 3D Colosseum Arena.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Zap,
  Shield,
  Flame,
  Wind,
  Sparkles,
  Play,
  Heart,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { AvatarConfig } from '@/types/avatar';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { sound } from '@/lib/audio';

interface VersusScreenProps {
  playerConfig: AvatarConfig;
  opponentConfig: AvatarConfig;
  playerName: string;
  opponentName: string;
  opponentRole: string;
  stageTitle: string;
  onProceed: () => void;
}

export function VersusScreen({
  playerConfig,
  opponentConfig,
  playerName,
  opponentName,
  opponentRole,
  stageTitle,
  onProceed,
}: VersusScreenProps) {
  const [countdown, setCountdown] = useState(4);
  const playerStats = calculateAvatarStats(playerConfig);
  const opponentStats = calculateAvatarStats(opponentConfig);

  useEffect(() => {
    sound.playSweep();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sound.playImpact();
          onProceed();
          return 0;
        }
        sound.playClick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onProceed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#030605] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Background High-Energy Diagonal Split */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left Player Green Glow */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-[#00FF66]/15 rounded-full blur-[140px]" />
        {/* Right Opponent Red Glow */}
        <div className="absolute -bottom-32 -right-32 w-[650px] h-[650px] bg-red-600/15 rounded-full blur-[140px]" />
        {/* Center Diagonal Slash Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,transparent_45%,#00FF66_48%,#EF4444_52%,transparent_55%)]" />
      </div>

      {/* TOP HEADER: Match Header Banner */}
      <header className="relative z-10 w-full pt-6 pb-4 px-6 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#00FF66] animate-ping" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#00FF66] font-bold">
              TOURNAMENT PROTOCOL
            </span>
            <h3 className="text-sm sm:text-base font-black uppercase text-white font-mono">
              {stageTitle}
            </h3>
          </div>
        </div>

        {/* Center Live Countdown */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono">
            <span className="text-white/60">AUTOPLAY IN</span>
            <span className="font-bold text-[#00FF66] text-sm">{countdown}s</span>
          </div>

          <button
            onClick={() => {
              sound.playImpact();
              onProceed();
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-black neon-green-button hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,102,0.4)]"
          >
            <Play size={14} className="fill-black" />
            <span>FIGHT NOW!</span>
          </button>
        </div>
      </header>

      {/* CENTER: VS FIGHTERS SHOWCASE */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-11 items-center gap-4">
        {/* ─── LEFT: PLAYER 1 FIGHTER CARD (Columns 1 to 5) ─── */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="md:col-span-5 h-[380px] sm:h-[460px] glass-panel rounded-3xl p-5 border border-[#00FF66]/40 flex flex-col justify-between shadow-[0_0_35px_rgba(0,255,102,0.15)] relative overflow-hidden"
        >
          {/* Neon Corner Ribbon */}
          <div className="absolute top-0 left-0 bg-[#00FF66] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-br-xl font-mono">
            PLAYER 1 // CHALLENGER
          </div>

          {/* 3D Avatar Stage View */}
          <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden bg-black/60 border border-[#00FF66]/20 relative mt-4">
            <AvatarViewer config={playerConfig} className="w-full h-full" showControls={false} animate={true} />
            <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#00FF66] bg-black/70 px-2 py-0.5 rounded border border-[#00FF66]/30">
              WEAPON: {playerStats.weaponItem.name.toUpperCase()}
            </div>
          </div>

          {/* Fighter Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: playerStats.species.accentColor }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                {playerStats.species.name} &bull; {playerStats.className}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide truncate" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {playerName}
            </h2>

            {/* Innate Species Buff Pill */}
            <div
              className="mt-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5"
              style={{
                borderColor: `${playerStats.species.accentColor}40`,
                backgroundColor: `${playerStats.species.accentColor}15`,
              }}
            >
              <Zap size={12} style={{ color: playerStats.species.accentColor }} />
              <span className="text-white/90 truncate">
                <strong>Buff: </strong>{playerStats.speciesBuff}
              </span>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-white/10 text-center font-mono">
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Max HP</span>
                <span className="text-xs font-bold text-emerald-400">{playerStats.maxHp}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Power</span>
                <span className="text-xs font-bold text-rose-400">{playerStats.power}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Agility</span>
                <span className="text-xs font-bold text-amber-400">{playerStats.agility}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Magic</span>
                <span className="text-xs font-bold text-violet-400">{playerStats.magic}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── CENTER: EPIC "VS" EMBLEM (Column 6) ─── */}
        <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: [1, 1.15, 1], rotate: 0 }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            className="relative flex items-center justify-center"
          >
            {/* Outer Glowing Energy Rings */}
            <div className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-[#00FF66] to-red-500 blur-xl opacity-60 animate-pulse" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/90 border-2 border-white/30 flex items-center justify-center shadow-2xl relative z-10 rotate-45">
              <span
                className="text-2xl sm:text-3xl font-black italic -rotate-45 tracking-tighter bg-gradient-to-r from-[#00FF66] via-amber-300 to-red-500 bg-clip-text text-transparent"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                VS
              </span>
            </div>
          </motion.div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-white/40 uppercase mt-2 hidden md:block">
            ENGAGE
          </span>
        </div>

        {/* ─── RIGHT: OPPONENT FIGHTER CARD (Columns 7 to 11) ─── */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="md:col-span-5 h-[380px] sm:h-[460px] glass-panel rounded-3xl p-5 border border-red-500/40 flex flex-col justify-between shadow-[0_0_35px_rgba(239,68,68,0.15)] relative overflow-hidden"
        >
          {/* Neon Corner Ribbon */}
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl font-mono">
            RIVAL // BOT CHAMPION
          </div>

          {/* 3D Avatar Stage View */}
          <div className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden bg-black/60 border border-red-500/20 relative mt-4">
            <AvatarViewer config={opponentConfig} className="w-full h-full" showControls={false} animate={true} />
            <div className="absolute bottom-2 right-3 text-[10px] font-mono text-red-400 bg-black/70 px-2 py-0.5 rounded border border-red-500/30">
              WEAPON: {opponentStats.weaponItem.name.toUpperCase()}
            </div>
          </div>

          {/* Opponent Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: opponentStats.species.accentColor }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">
                {opponentStats.species.name} &bull; {opponentRole}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide truncate" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {opponentName}
            </h2>

            {/* Innate Species Buff Pill */}
            <div
              className="mt-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5"
              style={{
                borderColor: `${opponentStats.species.accentColor}40`,
                backgroundColor: `${opponentStats.species.accentColor}15`,
              }}
            >
              <Zap size={12} style={{ color: opponentStats.species.accentColor }} />
              <span className="text-white/90 truncate">
                <strong>Buff: </strong>{opponentStats.speciesBuff}
              </span>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-white/10 text-center font-mono">
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Max HP</span>
                <span className="text-xs font-bold text-emerald-400">{opponentStats.maxHp}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Power</span>
                <span className="text-xs font-bold text-rose-400">{opponentStats.power}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Agility</span>
                <span className="text-xs font-bold text-amber-400">{opponentStats.agility}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-1.5">
                <span className="text-[9px] text-white/40 uppercase block">Magic</span>
                <span className="text-xs font-bold text-violet-400">{opponentStats.magic}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FOOTER: Battle Readiness Tip */}
      <footer className="relative z-10 py-3 px-6 text-center border-t border-white/10 bg-black/60 font-mono text-[11px] text-white/40">
        ARENA RULES: TURN-BASED COMBAT &bull; USE WEAPON STRIKES, ELEMENTAL MAGIC & AEGIS SHIELDS TO WIN
      </footer>
    </motion.div>
  );
}
