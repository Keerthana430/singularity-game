'use client';
// components/studio/ItemCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { AvatarItem, Rarity } from '@/types/avatar';

const rarityLabel: Record<Rarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

const rarityDot: Record<Rarity, string> = {
  common: 'bg-gray-400',
  rare: 'bg-blue-400',
  epic: 'bg-violet-400',
  legendary: 'bg-amber-400',
};

import { sound } from '@/lib/audio';

interface ItemCardProps {
  item: AvatarItem;
  selected: boolean;
  onSelect: (id: string) => void;
  accentColor?: string;
}

export function ItemCard({ item, selected, onSelect, accentColor }: ItemCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!item.locked) {
      sound.playEquip();
      onSelect(item.id);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (item.locked) {
      e.preventDefault();
      return;
    }
    sound.playClick();
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, category: item.category, name: item.name }));
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={!item.locked ? { scale: 1.04, y: -2 } : undefined}
      whileTap={!item.locked ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={handleClick}
      draggable={!item.locked}
      onDragStartCapture={handleDragStart}
      aria-pressed={selected}
      aria-label={`${item.name} — ${rarityLabel[item.rarity]}${item.locked ? ' (locked)' : ''}`}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing text-left ${
        item.locked
          ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/3'
          : selected
          ? `rarity-${item.rarity}-bg border-[#00FF66]/80 shadow-[0_0_16px_rgba(0,255,102,0.45)]`
          : `rarity-${item.rarity}-bg hover:border-white/20`
      }`}
    >
      {/* Preview area — procedural colored swatch */}
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center relative overflow-hidden"
        style={{
          background: accentColor
            ? `radial-gradient(circle at 40% 40%, ${accentColor}60, ${accentColor}20)`
            : 'rgba(0,255,102,0.12)',
        }}
      >
        {/* Simple geometric icon per category to give visual identity */}
        <div
          className="w-8 h-8 rounded-full opacity-70"
          style={{
            background: accentColor
              ? `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`
              : 'linear-gradient(135deg, #00FF66, #39FF14)',
          }}
        />
        {item.locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
            <Lock size={16} className="text-white/60" />
          </div>
        )}
        {selected && !item.locked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 border-2 border-[#00FF66] rounded-lg shadow-[0_0_10px_rgba(0,255,102,0.5)]"
          />
        )}
      </div>

      {/* Name */}
      <span className="text-[10px] font-medium text-white/80 text-center leading-tight line-clamp-2">
        {item.name}
      </span>

      {/* Rarity indicator */}
      <div className="flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full ${rarityDot[item.rarity]}`} />
        <span className={`text-[9px] uppercase tracking-wide rarity-${item.rarity}`}>
          {rarityLabel[item.rarity]}
        </span>
      </div>
    </motion.button>
  );
}
