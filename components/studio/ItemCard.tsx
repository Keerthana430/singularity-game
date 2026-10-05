'use client';
// components/studio/ItemCard.tsx
// Rich RPG Equipment card with distinct item-specific icons, signature color themes,
// and glowing previews to eliminate the duplicate generic circle swatch.

import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Shirt,
  Sparkles,
  Crown,
  Feather,
  Scissors,
  Footprints,
  Shield,
  Eye,
  Glasses,
  Headphones,
  Flame,
  Zap,
  Heart,
  Star,
  Sun,
  Bot,
  Layers,
  Smile,
  CircleDot,
  Hexagon,
} from 'lucide-react';
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

// Item-specific distinctive iconography & badges
function getItemVisual(item: AvatarItem, itemColor: string) {
  const id = item.id.toLowerCase();

  // ── Tops & Outfits ──
  if (id === 'lolita-dress') {
    return {
      icon: <Heart size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: 'LOLITA',
      bgGlow: '#FF7EB6',
    };
  }
  if (id === 'maid-dress') {
    return {
      icon: <Sparkles size={22} className="stroke-[2.2]" style={{ color: '#FFFFFF' }} />,
      tag: 'MAID',
      bgGlow: '#E2E8F0',
    };
  }
  if (id === 'magical-dress') {
    return {
      icon: <Star size={22} className="stroke-[2.2]" style={{ color: '#C084FC' }} />,
      tag: 'MAGICAL',
      bgGlow: '#8B5CF6',
    };
  }
  if (id === 'sundress') {
    return {
      icon: <Sun size={22} className="stroke-[2.2]" style={{ color: '#F59E0B' }} />,
      tag: 'SUMMER',
      bgGlow: '#FBBF24',
    };
  }
  if (id === 'princess-gown') {
    return {
      icon: <Crown size={22} className="stroke-[2.2]" style={{ color: '#F472B6' }} />,
      tag: 'GOWN',
      bgGlow: '#EC4899',
    };
  }
  if (id === 'cyber-dress') {
    return {
      icon: <Zap size={22} className="stroke-[2.2]" style={{ color: '#22D3EE' }} />,
      tag: 'CYBER',
      bgGlow: '#06B6D4',
    };
  }
  if (id === 'hoodie-dress') {
    return {
      icon: <Feather size={22} className="stroke-[2.2]" style={{ color: '#818CF8' }} />,
      tag: 'COZY',
      bgGlow: '#6366F1',
    };
  }
  if (id === 'armor') {
    return {
      icon: <Shield size={22} className="stroke-[2.2]" style={{ color: '#94A3B8' }} />,
      tag: 'ARMOR',
      bgGlow: '#475569',
    };
  }
  if (id === 'futuristic-suit') {
    return {
      icon: <Bot size={22} className="stroke-[2.2]" style={{ color: '#00FF66' }} />,
      tag: 'MECHA',
      bgGlow: '#00FF66',
    };
  }
  if (id === 'hoodie') {
    return {
      icon: <Shirt size={22} className="stroke-[2.2]" style={{ color: '#CBD5E1' }} />,
      tag: 'STREET',
      bgGlow: '#334155',
    };
  }
  if (id === 'jacket') {
    return {
      icon: <Layers size={22} className="stroke-[2.2]" style={{ color: '#F59E0B' }} />,
      tag: 'JACKET',
      bgGlow: '#78350F',
    };
  }
  if (id === 'shirt') {
    return {
      icon: <Shirt size={22} className="stroke-[2.2]" style={{ color: '#F8FAFC' }} />,
      tag: 'FORMAL',
      bgGlow: '#94A3B8',
    };
  }
  if (id === 'tshirt') {
    return {
      icon: <Shirt size={22} className="stroke-[2.2]" style={{ color: '#60A5FA' }} />,
      tag: 'CASUAL',
      bgGlow: '#3B82F6',
    };
  }
  if (id === 'tank') {
    return {
      icon: <Flame size={22} className="stroke-[2.2]" style={{ color: '#FB7185' }} />,
      tag: 'SPORT',
      bgGlow: '#E11D48',
    };
  }
  if (id === 'crop') {
    return {
      icon: <Heart size={22} className="stroke-[2.2]" style={{ color: '#F472B6' }} />,
      tag: 'CROP',
      bgGlow: '#D946EF',
    };
  }

  // ── Bottoms ──
  if (id.includes('skirt') || id === 'tutu') {
    return {
      icon: <Scissors size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: 'SKIRT',
      bgGlow: itemColor,
    };
  }
  if (id === 'jeans' || id === 'shorts' || id === 'cargo' || id === 'joggers' || id === 'leggings') {
    return {
      icon: <Layers size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: 'PANTS',
      bgGlow: itemColor,
    };
  }
  if (id === 'armor-pants') {
    return {
      icon: <Shield size={22} className="stroke-[2.2]" style={{ color: '#94A3B8' }} />,
      tag: 'GREAVES',
      bgGlow: '#475569',
    };
  }

  // ── Shoes ──
  if (item.category === 'shoes') {
    return {
      icon: <Footprints size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: id.toUpperCase().slice(0, 7),
      bgGlow: itemColor,
    };
  }

  // ── Accessories ──
  if (id === 'cat-ears' || id === 'bunny-ears') {
    return {
      icon: <Smile size={22} className="stroke-[2.2]" style={{ color: '#F472B6' }} />,
      tag: 'EARS',
      bgGlow: '#FF5C93',
    };
  }
  if (id === 'bow') {
    return {
      icon: <Heart size={22} className="stroke-[2.2]" style={{ color: '#FF2D78' }} />,
      tag: 'BOW',
      bgGlow: '#FF2D78',
    };
  }
  if (id === 'halo') {
    return {
      icon: <Sun size={22} className="stroke-[2.2]" style={{ color: '#FFD700' }} />,
      tag: 'HOLY',
      bgGlow: '#FFD700',
    };
  }
  if (id === 'glasses') {
    return {
      icon: <Glasses size={22} className="stroke-[2.2]" style={{ color: '#38BDF8' }} />,
      tag: 'OPTIC',
      bgGlow: '#38BDF8',
    };
  }
  if (id === 'crown') {
    return {
      icon: <Crown size={22} className="stroke-[2.2]" style={{ color: '#F59E0B' }} />,
      tag: 'ROYAL',
      bgGlow: '#F59E0B',
    };
  }
  if (id === 'headphones') {
    return {
      icon: <Headphones size={22} className="stroke-[2.2]" style={{ color: '#22D3EE' }} />,
      tag: 'AUDIO',
      bgGlow: '#06B6D4',
    };
  }
  if (id === 'mask' || id === 'visor') {
    return {
      icon: <Eye size={22} className="stroke-[2.2]" style={{ color: '#00FF66' }} />,
      tag: 'VISOR',
      bgGlow: '#00FF66',
    };
  }
  if (id.includes('wing')) {
    return {
      icon: <Feather size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: 'WINGS',
      bgGlow: itemColor,
    };
  }
  if (id === 'jetpack') {
    return {
      icon: <Flame size={22} className="stroke-[2.2]" style={{ color: '#F97316' }} />,
      tag: 'THRUST',
      bgGlow: '#F97316',
    };
  }
  if (id.includes('pauldron') || id.includes('shoulder')) {
    return {
      icon: <Shield size={22} className="stroke-[2.2]" style={{ color: '#EAB308' }} />,
      tag: 'GUARD',
      bgGlow: '#EAB308',
    };
  }

  // ── Hair ──
  if (item.category === 'hair') {
    return {
      icon: <Sparkles size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: 'HAIR',
      bgGlow: itemColor,
    };
  }

  // ── Face ──
  if (item.category === 'face' || id.includes('eye') || id.includes('wink')) {
    return {
      icon: <Eye size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
      tag: 'EYES',
      bgGlow: itemColor,
    };
  }

  // Default fallback
  return {
    icon: <CircleDot size={22} className="stroke-[2.2]" style={{ color: itemColor }} />,
    tag: 'ITEM',
    bgGlow: itemColor,
  };
}

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

  // Every item has its own signature color, falling back to accentColor or vibrant emerald
  const itemColor = item.color || accentColor || '#00FF66';
  const visual = getItemVisual(item, itemColor);

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
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={handleClick}
      draggable={isUnlocked}
      onDragStartCapture={handleDragStart}
      aria-pressed={selected}
      aria-label={`${item.name} — ${rarityLabel[item.rarity]}${!isUnlocked ? ` (${cost} coins)` : ''}`}
      className={`relative w-full flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 cursor-pointer text-left overflow-hidden ${
        !isUnlocked
          ? 'border-white/10 bg-black/60 hover:border-amber-400/50'
          : selected
          ? 'border-[#00FF66] bg-[#00FF66]/15 shadow-[0_0_24px_rgba(0,255,102,0.35)] ring-1 ring-[#00FF66]'
          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
      }`}
    >
      {/* Visual Preview Area with Distinct Iconography & Signature Hue */}
      <div
        className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-inner my-0.5"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${visual.bgGlow}45 0%, rgba(10,12,18,0.95) 85%)`,
          border: `1px solid ${visual.bgGlow}60`,
        }}
      >
        {/* Subtle Ambient Backlight Glow */}
        <div
          className="absolute inset-0 opacity-40 blur-md pointer-events-none"
          style={{ background: visual.bgGlow }}
        />

        {/* Dynamic Distinct Item Icon */}
        <div className="relative z-10 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-115 scale-110">
          {visual.icon}
        </div>

        {/* Micro Subtype Badge */}
        <span
          className="absolute top-1.5 right-1.5 text-[8px] font-mono font-black px-1.5 py-0.2 rounded uppercase tracking-wider text-black z-10 shadow-sm"
          style={{ backgroundColor: visual.bgGlow }}
        >
          {visual.tag}
        </span>

        {/* Color Dot indicator */}
        <div
          className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full border border-black/80 shadow-sm z-10"
          style={{ backgroundColor: itemColor }}
          title={`Theme: ${itemColor}`}
        />

        {/* Lock / Coin Overlay if not owned */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs rounded-2xl p-1 text-center z-20">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-1">
              <Lock size={13} className="text-amber-400" />
            </div>
            <span className="text-[10px] font-black font-mono text-amber-300">
              {cost} COINS
            </span>
          </div>
        )}

        {/* Active Selected Ring */}
        {selected && isUnlocked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 border-2 border-[#00FF66] rounded-2xl shadow-[inset_0_0_12px_rgba(0,255,102,0.6)] pointer-events-none"
          />
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-bold text-white text-center leading-snug line-clamp-1 px-1 w-full truncate">
        {item.name}
      </span>

      {/* Rarity & Cost indicator (dedicated clean layout without overlapping) */}
      <div className="w-full flex items-center justify-between px-1 text-[10px] font-mono mt-auto pt-1.5 border-t border-white/5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${rarityDot[item.rarity]}`} />
          <span className={`uppercase font-bold tracking-wider text-[9px] truncate rarity-${item.rarity}`}>
            {rarityLabel[item.rarity]}
          </span>
        </div>
        {!isUnlocked ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[9px] shrink-0 font-mono">
            <span>🪙</span>
            <span>{cost}</span>
          </div>
        ) : (
          selected && (
            <span className="text-[9px] font-black text-[#00FF66] tracking-wider shrink-0 font-mono">
              EQUIPPED
            </span>
          )
        )}
      </div>
    </motion.button>
  );
}
