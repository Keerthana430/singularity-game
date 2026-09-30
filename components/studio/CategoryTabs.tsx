'use client';
// components/studio/CategoryTabs.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { User, Smile, Scissors, Shirt, ShoppingBag, Footprints, Star, Palette } from 'lucide-react';
import { StudioCategory } from '@/types/avatar';
import { useAvatarStore } from '@/store/avatarStore';

import { sound } from '@/lib/audio';

const CATEGORIES: { id: StudioCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'body', label: 'Body', icon: <User size={15} /> },
  { id: 'face', label: 'Face', icon: <Smile size={15} /> },
  { id: 'hair', label: 'Hair', icon: <Scissors size={15} /> },
  { id: 'tops', label: 'Tops', icon: <Shirt size={15} /> },
  { id: 'bottoms', label: 'Bottoms', icon: <ShoppingBag size={15} /> },
  { id: 'shoes', label: 'Shoes', icon: <Footprints size={15} /> },
  { id: 'accessories', label: 'Accessories', icon: <Star size={15} /> },
  { id: 'colors', label: 'Colors', icon: <Palette size={15} /> },
];

interface CategoryTabsProps {
  orientation?: 'vertical' | 'horizontal';
}

export function CategoryTabs({ orientation = 'vertical' }: CategoryTabsProps) {
  const { activeCategory, setActiveCategory } = useAvatarStore();

  const handleCategorySelect = (catId: StudioCategory) => {
    sound.playClick();
    setActiveCategory(catId);
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Avatar categories">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={active}
              aria-controls={`category-panel-${cat.id}`}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 ${
                active
                  ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/50 shadow-[0_0_12px_rgba(0,255,102,0.25)]'
                  : 'text-white/60 border border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex flex-col gap-1 p-2" role="tablist" aria-label="Avatar categories" aria-orientation="vertical">
      {CATEGORIES.map((cat) => {
        const active = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={active}
            aria-controls={`category-panel-${cat.id}`}
            onClick={() => handleCategorySelect(cat.id)}
            className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 w-full text-left ${
              active
                ? 'text-white font-extrabold'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {active && (
              <motion.div
                layoutId="category-active"
                className="absolute inset-0 rounded-xl bg-[#00FF66]/15 border border-[#00FF66]/40 shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${active ? 'text-[#00FF66]' : ''}`}>{cat.icon}</span>
            <span className="relative z-10 uppercase tracking-wider">{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
