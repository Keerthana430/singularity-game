'use client';
// components/studio/StatsPreviewCard.tsx
// Live RPG Combat Stat Monitor and Formula Breakdown Card

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Zap,
  Shield,
  Wind,
  Sparkles,
  Swords,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  Activity,
} from 'lucide-react';
import { AvatarConfig } from '@/types/avatar';
import { calculateAvatarStats } from '@/lib/statsCalculator';

interface StatsPreviewCardProps {
  config: AvatarConfig;
  compact?: boolean;
}

export function StatsPreviewCard({ config, compact = false }: StatsPreviewCardProps) {
  const [showFormula, setShowFormula] = useState(false);
  const stats = calculateAvatarStats(config);

  const statBars = [
    {
      label: 'HP (Health)',
      value: stats.maxHp,
      max: 2200,
      color: 'from-emerald-500 to-green-400',
      icon: <Heart size={14} className="text-emerald-400" />,
      unit: '',
    },
    {
      label: 'Base Power',
      value: stats.power,
      max: 180,
      color: 'from-rose-500 to-orange-400',
      icon: <Flame size={14} className="text-rose-400" />,
      unit: ' ATK',
    },
    {
      label: 'Defense',
      value: stats.defense,
      max: 150,
      color: 'from-blue-500 to-cyan-400',
      icon: <Shield size={14} className="text-cyan-400" />,
      unit: ' DEF',
    },
    {
      label: 'Agility',
      value: stats.agility,
      max: 160,
      color: 'from-amber-500 to-yellow-300',
      icon: <Wind size={14} className="text-amber-400" />,
      unit: ' AGI',
    },
    {
      label: 'Magic Power',
      value: stats.magic,
      max: 180,
      color: 'from-violet-500 to-fuchsia-400',
      icon: <Sparkles size={14} className="text-violet-400" />,
      unit: ' MAG',
    },
  ];

  return (
    <div className="bg-black/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl flex flex-col gap-3">
      {/* Header with Species & Class Role */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full animate-pulse shadow-sm"
            style={{ backgroundColor: stats.species.accentColor }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {stats.species.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/15">
                {stats.className}
              </span>
            </div>
            <p className="text-[10px] text-white/50">{stats.species.domain}</p>
          </div>
        </div>

        <button
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-1 text-[10px] font-mono uppercase text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-2 py-1 rounded-lg border border-violet-500/30 transition-all"
        >
          <Info size={12} />
          <span>Formula</span>
          {showFormula ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Innate Species Passive Buff Badge */}
      <div
        className="px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-2 leading-tight"
        style={{
          borderColor: `${stats.species.accentColor}40`,
          backgroundColor: `${stats.species.accentColor}15`,
          color: '#ffffff',
        }}
      >
        <Zap size={13} style={{ color: stats.species.accentColor }} className="flex-shrink-0" />
        <span className="text-white/90">
          <strong className="text-white font-bold">Innate Buff: </strong>
          {stats.speciesBuff}
        </span>
      </div>

      {/* Stat Meters */}
      <div className="flex flex-col gap-2 pt-1">
        {statBars.map((bar) => {
          const pct = Math.min(100, Math.round((bar.value / bar.max) * 100));
          return (
            <div key={bar.label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-white/70">
                  {bar.icon}
                  {bar.label}
                </span>
                <span className="font-bold text-white">
                  {bar.value}
                  <span className="text-[10px] text-white/40">{bar.unit}</span>
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Secondary Metrics: Crit & Evasion */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-center font-mono">
        <div className="bg-white/5 rounded-xl p-2 border border-white/5">
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Critical Rate</p>
          <p className="text-sm font-black text-amber-300 mt-0.5">{stats.criticalRate}%</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 border border-white/5">
          <p className="text-[10px] text-white/50 uppercase tracking-wider">Evasion Rate</p>
          <p className="text-sm font-black text-cyan-300 mt-0.5">{stats.evasionRate}%</p>
        </div>
      </div>

      {/* Equipped Weapon Badge */}
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px]">
        <span className="flex items-center gap-1.5 text-white/60">
          <Swords size={12} className="text-[#00FF66]" />
          Weapon:
        </span>
        <span className="font-bold text-white tracking-wide">{stats.weaponItem.name}</span>
      </div>

      {/* Expandable Formula & Mathematical Breakdown */}
      <AnimatePresence>
        {showFormula && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 pt-2 text-[10px] font-mono flex flex-col gap-2 text-white/80"
          >
            <p className="text-violet-300 font-bold uppercase tracking-wider">Exact Stat Breakdown Math:</p>

            {/* HP Breakdown */}
            <div className="p-2 rounded bg-black/50 border border-white/5">
              <span className="text-emerald-400 font-bold">Max HP = </span>
              <span>Species Base ({stats.breakdown.species.hp}) + </span>
              <span>Class ({stats.breakdown.role.hp >= 0 ? `+${stats.breakdown.role.hp}` : stats.breakdown.role.hp}) + </span>
              <span>Gear ({stats.breakdown.gear.hp >= 0 ? `+${stats.breakdown.gear.hp}` : stats.breakdown.gear.hp})</span>
              <span className="text-white font-bold"> = {stats.maxHp} HP</span>
            </div>

            {/* Power Breakdown */}
            <div className="p-2 rounded bg-black/50 border border-white/5">
              <span className="text-rose-400 font-bold">Power = </span>
              <span>Species Base ({stats.breakdown.species.power}) + </span>
              <span>Role (+{stats.breakdown.role.power}) + </span>
              <span>Weapon (+{stats.breakdown.weapon.power}) + </span>
              <span>Gear (+{stats.breakdown.gear.power})</span>
              <span className="text-white font-bold"> = {stats.power} ATK</span>
            </div>

            {/* Agility Breakdown */}
            <div className="p-2 rounded bg-black/50 border border-white/5">
              <span className="text-amber-400 font-bold">Agility = </span>
              <span>Species Base ({stats.breakdown.species.agility}) + </span>
              <span>Role ({stats.breakdown.role.agility >= 0 ? `+${stats.breakdown.role.agility}` : stats.breakdown.role.agility}) + </span>
              <span>Weapon (+{stats.breakdown.weapon.agility}) + </span>
              <span>Gear (+{stats.breakdown.gear.agility})</span>
              <span className="text-white font-bold"> = {stats.agility} AGI</span>
            </div>

            {/* Defense & Magic */}
            <div className="p-2 rounded bg-black/50 border border-white/5">
              <span className="text-cyan-400 font-bold">Defense: </span>{stats.defense} DEF |{' '}
              <span className="text-violet-400 font-bold">Magic: </span>{stats.magic} MAG
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
