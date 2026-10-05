'use client';
// components/studio/EquipmentFlankOverlay.tsx
// Classic RPG Equipment Screen overlay (Ref: Dark Souls / Diablo / MMORPG).
// Flanks the centered 3D avatar with high-precision holographic equipment slots,
// active item previews, species roster strip, and combat action triggers.

import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Shirt,
  Scissors,
  Footprints,
  Sword,
  Feather,
  Eye,
  Shield,
  Sparkles,
  Zap,
  Flame,
  Wind,
  Coins,
  Smile,
  Palette,
} from 'lucide-react';
import { AvatarConfig, StudioCategory } from '@/types/avatar';
import { SPECIES_LIST } from '@/data/species';
import { hairStyles } from '@/data/hairStyles';
import { tops } from '@/data/tops';
import { bottoms } from '@/data/bottoms';
import { shoes } from '@/data/shoes';
import { weapons } from '@/data/weapons';
import { accessories } from '@/data/accessories';
import { useAvatarStore } from '@/store/avatarStore';

interface EquipmentFlankOverlayProps {
  currentAvatar: AvatarConfig;
  activeCategory: StudioCategory;
  onSelectCategory: (cat: StudioCategory) => void;
  activeAction: 'idle' | 'attack' | 'hit' | 'defend' | 'victory';
  onSelectAction: (act: 'idle' | 'attack' | 'hit' | 'defend' | 'victory') => void;
  onSelectSpecies?: (species: string) => void;
}

export function EquipmentFlankOverlay({
  currentAvatar,
  activeCategory,
  onSelectCategory,
  activeAction,
  onSelectAction,
  onSelectSpecies,
}: EquipmentFlankOverlayProps) {
  const { topUpCoins } = useAvatarStore();

  // Helper to find readable item names
  const getItemName = (category: string, id?: string) => {
    if (!id || id === 'none' || id === 'unarmed') return 'Empty';
    switch (category) {
      case 'hair':
        return hairStyles.find((i) => i.id === id)?.name || id;
      case 'tops':
        return tops.find((i) => i.id === id)?.name || id;
      case 'bottoms':
        return bottoms.find((i) => i.id === id)?.name || id;
      case 'shoes':
        return shoes.find((i) => i.id === id)?.name || id;
      case 'weapons':
        return weapons.find((i) => i.id === id)?.name || id;
      case 'accessories':
        return accessories.find((i) => i.id === id)?.name || id;
      default:
        return id;
    }
  };

  const LEFT_SLOTS = [
    {
      id: 'hair' as StudioCategory,
      label: 'HEAD / HAIR',
      icon: <Crown size={15} />,
      equippedName: getItemName('hair', currentAvatar.hair),
      color: '#38BDF8',
    },
    {
      id: 'tops' as StudioCategory,
      label: 'CHEST / ARMOR',
      icon: <Shirt size={15} />,
      equippedName: getItemName('tops', currentAvatar.top),
      color: '#10B981',
    },
    {
      id: 'bottoms' as StudioCategory,
      label: 'LEGS / GREAVES',
      icon: <Scissors size={15} />,
      equippedName: getItemName('bottoms', currentAvatar.bottom),
      color: '#A855F7',
    },
    {
      id: 'weapons' as StudioCategory,
      label: 'MAIN WEAPON',
      icon: <Sword size={15} />,
      equippedName: getItemName('weapons', currentAvatar.weapon),
      color: '#F59E0B',
    },
  ];

  const RIGHT_SLOTS = [
    {
      id: 'accessories' as StudioCategory,
      label: 'BACK / WINGS',
      icon: <Feather size={15} />,
      equippedName: getItemName('accessories', currentAvatar.accessories?.back),
      color: '#EC4899',
    },
    {
      id: 'face' as StudioCategory,
      label: 'FACE / EYES',
      icon: <Eye size={15} />,
      equippedName: `${currentAvatar.face.expression} • ${currentAvatar.face.eyes}`,
      color: '#06B6D4',
    },
    {
      id: 'accessories' as StudioCategory,
      label: 'SHOULDERS',
      icon: <Shield size={15} />,
      equippedName: getItemName('accessories', currentAvatar.accessories?.shoulder),
      color: '#EAB308',
    },
    {
      id: 'shoes' as StudioCategory,
      label: 'SABATONS / FEET',
      icon: <Footprints size={15} />,
      equippedName: getItemName('shoes', currentAvatar.shoes),
      color: '#00FF66',
    },
  ];

  // Base species stats calculation
  const rawSpecies = (currentAvatar.species || 'human').toLowerCase();
  const stats = {
    human: { hp: 1000, atk: 60, agi: 50, def: 45, mag: 45, badge: 'BALANCED MASTER' },
    elf: { hp: 880, atk: 50, agi: 75, def: 35, mag: 80, badge: 'ARCANE AGILE' },
    dwarf: { hp: 1250, atk: 70, agi: 25, def: 75, mag: 30, badge: 'UNBREAKABLE' },
    fairy: { hp: 820, atk: 45, agi: 85, def: 30, mag: 85, badge: 'CELESTIAL REGEN' },
    robot: { hp: 1100, atk: 65, agi: 40, def: 60, mag: 55, badge: 'CYBER ENHANCED' },
    ogre: { hp: 1400, atk: 80, agi: 20, def: 70, mag: 20, badge: 'BRUTE FORCE' },
    alien: { hp: 950, atk: 55, agi: 60, def: 40, mag: 90, badge: 'PSIONIC SURGE' },
  }[rawSpecies] || { hp: 1000, atk: 60, agi: 50, def: 45, mag: 45, badge: 'ADVENTURER' };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden">
      {/* ─── TOP BAR: Quick Species & Archetype Roster (Reference 2) ────────────────── */}
      <div className="pointer-events-auto flex items-center justify-between w-full max-w-5xl mx-auto gap-2">
        {/* Species Horizontal Strip */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/80 backdrop-blur-md border border-[#00FF66]/25 shadow-lg overflow-x-auto max-w-[70vw]">
          <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider pl-2 pr-1 font-bold">
            SPECIES:
          </span>
          {SPECIES_LIST.map((sp) => {
            const isSelected = rawSpecies === sp.id.toLowerCase();
            return (
              <button
                key={sp.id}
                onClick={() => onSelectSpecies && onSelectSpecies(sp.id)}
                title={sp.description}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.6)] scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{sp.name}</span>
              </button>
            );
          })}
        </div>

        {/* Live Wallet & Unlimited Funds */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-2xl bg-black/85 border border-[#F59E0B]/30 shadow-md backdrop-blur-md">
          <Coins size={13} className="text-[#F59E0B] animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-mono font-black text-[#F59E0B] tracking-wider">
            9,999,999
          </span>
          <span className="text-[9px] font-mono text-[#00FF66] bg-[#00FF66]/15 px-1.5 py-0.5 rounded font-bold">
            UNLIMITED
          </span>
        </div>
      </div>

      {/* ─── MIDDLE: FLANKING EQUIPMENT SLOTS (Reference 1) ────────────────────── */}
      <div className="flex-1 min-h-0 flex items-center justify-between w-full">
        {/* LEFT COLUMN: Head, Chest, Legs, Weapon */}
        <div className="pointer-events-auto flex flex-col gap-2.5 sm:gap-3">
          {LEFT_SLOTS.map((slot) => {
            const isActive = activeCategory === slot.id;
            return (
              <motion.button
                key={slot.label}
                whileHover={{ scale: 1.04, x: 4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectCategory(slot.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl backdrop-blur-md border text-left transition-all w-36 sm:w-44 ${
                  isActive
                    ? 'bg-black/90 border-[#00FF66] shadow-[0_0_18px_rgba(0,255,102,0.4)]'
                    : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-black/80'
                }`}
              >
                {/* Slot Icon Box */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: isActive ? `${slot.color}25` : '#ffffff08',
                    borderColor: isActive ? slot.color : '#ffffff15',
                    color: slot.color,
                  }}
                >
                  {slot.icon}
                </div>
                {/* Label and Equipped name */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-white/40 uppercase truncate">
                    {slot.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold truncate ${
                      isActive ? 'text-[#00FF66]' : 'text-white/90'
                    }`}
                  >
                    {slot.equippedName}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Back/Wings, Face, Shoulders, Shoes */}
        <div className="pointer-events-auto flex flex-col gap-2.5 sm:gap-3 items-end">
          {RIGHT_SLOTS.map((slot) => {
            const isActive = activeCategory === slot.id;
            return (
              <motion.button
                key={slot.label}
                whileHover={{ scale: 1.04, x: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectCategory(slot.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl backdrop-blur-md border text-right flex-row-reverse transition-all w-36 sm:w-44 ${
                  isActive
                    ? 'bg-black/90 border-[#00FF66] shadow-[0_0_18px_rgba(0,255,102,0.4)]'
                    : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-black/80'
                }`}
              >
                {/* Slot Icon Box */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: isActive ? `${slot.color}25` : '#ffffff08',
                    borderColor: isActive ? slot.color : '#ffffff15',
                    color: slot.color,
                  }}
                >
                  {slot.icon}
                </div>
                {/* Label and Equipped name */}
                <div className="flex flex-col min-w-0 flex-1 text-right">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-white/40 uppercase truncate">
                    {slot.label}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold truncate ${
                      isActive ? 'text-[#00FF66]' : 'text-white/90'
                    }`}
                  >
                    {slot.equippedName}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM: STATS BAR & COMBAT ACTION CONTROLS (References 1 & 2) ───────── */}
      <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mx-auto gap-3 pt-2">
        {/* Left: Species Attributes Bar (Reference 1 Stats) */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-[#00FF66]/25 shadow-lg">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono font-bold uppercase text-white/40 tracking-widest">
              ROLE: {stats.badge}
            </span>
            <div className="flex items-center gap-2 text-[11px] font-mono font-black">
              <span className="text-emerald-400">HP {stats.hp}</span>
              <span className="text-white/20">•</span>
              <span className="text-amber-400">ATK {stats.atk}</span>
              <span className="text-white/20">•</span>
              <span className="text-sky-400">DEF {stats.def}</span>
              <span className="text-white/20">•</span>
              <span className="text-purple-400">MAG {stats.mag}</span>
              <span className="text-white/20">•</span>
              <span className="text-cyan-400">AGI {stats.agi}</span>
            </div>
          </div>
        </div>

        {/* Right: Smooth Action / Emote Trigger Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/85 backdrop-blur-md border border-white/15 shadow-lg">
          <span className="text-[10px] font-mono uppercase text-white/40 font-bold px-2">
            POSE:
          </span>
          {[
            { id: 'idle' as const, label: 'Idle' },
            { id: 'attack' as const, label: 'Slash' },
            { id: 'defend' as const, label: 'Guard' },
            { id: 'victory' as const, label: 'Cheer' },
          ].map((act) => {
            const isCurrent = activeAction === act.id;
            return (
              <button
                key={act.id}
                onClick={() => onSelectAction(act.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold tracking-wider transition-all ${
                  isCurrent
                    ? 'bg-[#00FF66] text-black shadow-[0_0_12px_rgba(0,255,102,0.6)] font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {act.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
