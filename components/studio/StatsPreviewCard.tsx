'use client';
// components/studio/StatsPreviewCard.tsx
// Compact, non-cluttered RPG Stat Monitor with collapsible details

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Shield,
  Wind,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { AvatarConfig } from '@/types/avatar';
import { calculateAvatarStats } from '@/lib/statsCalculator';

interface StatsPreviewCardProps {
  config: AvatarConfig;
  defaultExpanded?: boolean;
}

export function StatsPreviewCard({ config, defaultExpanded = false }: StatsPreviewCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const stats = calculateAvatarStats(config);

  const statBars = [
    {
      label: 'HP',
      value: stats.maxHp,
      max: 2200,
      color: 'from-emerald-500 to-green-400',
      icon: <Heart size={12} className="text-emerald-400" />,
    },
    {
      label: 'ATK',
      value: stats.power,
      max: 180,
      color: 'from-rose-500 to-orange-400',
      icon: <Flame size={12} className="text-rose-400" />,
    },
    {
      label: 'DEF',
      value: stats.defense,
      max: 150,
      color: 'from-blue-500 to-cyan-400',
      icon: <Shield size={12} className="text-cyan-400" />,
    },
    {
      label: 'AGI',
      value: stats.agility,
      max: 160,
      color: 'from-amber-500 to-yellow-300',
      icon: <Wind size={12} className="text-amber-400" />,
    },
    {
      label: 'MAG',
      value: stats.magic,
      max: 180,
      color: 'from-violet-500 to-fuchsia-400',
      icon: <Sparkles size={12} className="text-violet-400" />,
    },
  ];

  return (
    <div className="bg-black/50 border border-white/10 rounded-xl p-3 backdrop-blur-md transition-all">
      {/* Compact Header Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: stats.species.accentColor }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {stats.species.name}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {stats.className}
          </span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#00FF66] hover:text-white bg-[#00FF66]/10 hover:bg-[#00FF66]/20 px-2 py-1 rounded-lg border border-[#00FF66]/25 transition-all"
        >
          <span>{expanded ? 'Hide Stats' : 'View Stats'}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Mini Stat Chips (Always visible) */}
      <div className="grid grid-cols-5 gap-1.5 mt-2 pt-2 border-t border-white/5 text-center font-mono text-[10px]">
        <div className="bg-white/5 py-1 px-0.5 rounded">
          <span className="text-white/40 block text-[8px]">HP</span>
          <span className="text-emerald-400 font-bold">{stats.maxHp}</span>
        </div>
        <div className="bg-white/5 py-1 px-0.5 rounded">
          <span className="text-white/40 block text-[8px]">ATK</span>
          <span className="text-rose-400 font-bold">{stats.power}</span>
        </div>
        <div className="bg-white/5 py-1 px-0.5 rounded">
          <span className="text-white/40 block text-[8px]">DEF</span>
          <span className="text-cyan-400 font-bold">{stats.defense}</span>
        </div>
        <div className="bg-white/5 py-1 px-0.5 rounded">
          <span className="text-white/40 block text-[8px]">AGI</span>
          <span className="text-amber-400 font-bold">{stats.agility}</span>
        </div>
        <div className="bg-white/5 py-1 px-0.5 rounded">
          <span className="text-white/40 block text-[8px]">MAG</span>
          <span className="text-purple-400 font-bold">{stats.magic}</span>
        </div>
      </div>

      {/* Collapsible Detailed Stats & Passive Buff */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2.5 flex flex-col gap-2.5"
          >
            {/* Passive Buff */}
            <div
              className="px-2.5 py-1.5 rounded-lg border text-[10px] font-medium flex items-center gap-1.5 leading-snug"
              style={{
                borderColor: `${stats.species.accentColor}30`,
                backgroundColor: `${stats.species.accentColor}10`,
              }}
            >
              <Zap size={12} style={{ color: stats.species.accentColor }} className="flex-shrink-0" />
              <span className="text-white/80">
                <strong className="text-white">Innate: </strong>
                {stats.speciesBuff}
              </span>
            </div>

            {/* Stat Bars */}
            <div className="flex flex-col gap-1.5">
              {statBars.map((bar) => {
                const pct = Math.min(100, Math.round((bar.value / bar.max) * 100));
                return (
                  <div key={bar.label} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="flex items-center gap-1 text-white/60">
                        {bar.icon}
                        {bar.label}
                      </span>
                      <span className="font-bold text-white">{bar.value}</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secondary: Crit / Evasion */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-[10px]">
              <div className="bg-white/5 py-1 rounded border border-white/5">
                <span className="text-white/40 block text-[8px] uppercase">Crit Rate</span>
                <span className="text-amber-300 font-bold">{stats.criticalRate}%</span>
              </div>
              <div className="bg-white/5 py-1 rounded border border-white/5">
                <span className="text-white/40 block text-[8px] uppercase">Evasion</span>
                <span className="text-cyan-300 font-bold">{stats.evasionRate}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
