'use client';
// components/studio/ItemCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Coins } from 'lucide-react';
import { AvatarItem, Rarity } from '@/types/avatar';
import { useAvatarStore } from '@/store/avatarStore';
import { useToast } from '@/components/Toast';
import { sound } from '@/lib/audio';

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

interface ItemCardProps {
  item: AvatarItem;
  selected: boolean;
  onSelect: (id: string) => void;
  accentColor?: string;
}

export function ItemCard({ item, selected, onSelect, accentColor }: ItemCardProps) {
  const { isItemUnlocked, unlockItem, coins } = useAvatarStore();
  const { add: addToast } = useToast();

  const cost = item.cost ?? 0;
  const isUnlocked = cost === 0 || isItemUnlocked(item.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isUnlocked) {
      sound.playEquip();
      onSelect(item.id);
    } else {
      // Purchase flow
      if (coins >= cost) {
        const success = unlockItem(item.id, cost);
        if (success) {
          sound.playWin();
          onSelect(item.id);
          addToast(`Unlocked ${item.name} for ${cost} Coins!`, 'success');
        }
      } else {
        sound.playImpact();
        addToast(
          `Requires ${cost} Coins (You have ${coins}). Win more battles in the Arena to earn coins!`,
          'error'
        );
      }
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isUnlocked) {
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
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={handleClick}
      draggable={isUnlocked}
      onDragStartCapture={handleDragStart}
      aria-pressed={selected}
      aria-label={`${item.name} — ${rarityLabel[item.rarity]}${!isUnlocked ? ` (${cost} coins)` : ''}`}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
        !isUnlocked
          ? 'border-white/10 bg-black/40 hover:border-amber-400/40'
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
        <div
          className="w-8 h-8 rounded-full opacity-70"
          style={{
            background: accentColor
              ? `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`
              : 'linear-gradient(135deg, #00FF66, #39FF14)',
          }}
        />

        {/* Lock / Coin Overlay if not owned */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg p-1 text-center">
            <Lock size={14} className="text-amber-400 mb-0.5" />
            <span className="text-[9px] font-black font-mono text-amber-300">
              {cost} 🪙
            </span>
          </div>
        )}

        {selected && isUnlocked && (
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

      {/* Rarity & Cost indicator */}
      <div className="flex items-center gap-1.5 text-[9px] font-mono">
        <div className={`w-1.5 h-1.5 rounded-full ${rarityDot[item.rarity]}`} />
        <span className={`uppercase tracking-wide rarity-${item.rarity}`}>
          {rarityLabel[item.rarity]}
        </span>
        {!isUnlocked && (
          <span className="text-amber-400 font-bold ml-1">{cost}🪙</span>
        )}
      </div>
    </motion.button>
  );
}
