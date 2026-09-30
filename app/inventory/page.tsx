'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  Shield,
  Sparkles,
  Check,
  Lock,
  Scissors,
  Shirt,
  ShoppingBag,
  Footprints,
  Star,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { hairStyles } from '@/data/hairStyles';
import { tops } from '@/data/tops';
import { bottoms } from '@/data/bottoms';
import { shoes } from '@/data/shoes';
import { accessories } from '@/data/accessories';
import { useToast } from '@/components/Toast';
import { AvatarItem, Rarity } from '@/types/avatar';

const rarityColors: Record<Rarity, { border: string; bg: string; text: string }> = {
  common: { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-300' },
  rare: { border: 'border-blue-500/40', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  epic: { border: 'border-purple-500/40', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  legendary: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

type InventoryCategory = 'all' | 'hair' | 'tops' | 'bottoms' | 'shoes' | 'accessories';

export default function InventoryPage() {
  const { currentAvatar, updateAvatar, updateAccessories } = useAvatarStore();
  const { add: addToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  // Aggregated items catalog
  const allItems: AvatarItem[] = [
    ...hairStyles,
    ...tops,
    ...bottoms,
    ...shoes,
    ...accessories,
  ];

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
    return matchesCategory && matchesRarity;
  });

  const isEquipped = (item: AvatarItem) => {
    if (item.category === 'hair') return currentAvatar.hair === item.id;
    if (item.category === 'tops') return currentAvatar.top === item.id;
    if (item.category === 'bottoms') return currentAvatar.bottom === item.id;
    if (item.category === 'shoes') return currentAvatar.shoes === item.id;
    if (item.category === 'accessories') {
      const acc = currentAvatar.accessories;
      return (
        acc.head === item.id ||
        acc.face === item.id ||
        acc.back === item.id ||
        acc.shoulder === item.id
      );
    }
    return false;
  };

  const equipItem = (item: AvatarItem) => {
    if (item.locked) {
      addToast(`"${item.name}" is locked. Complete Arena objectives to unlock!`, 'error');
      return;
    }

    if (item.category === 'hair') updateAvatar({ hair: item.id });
    else if (item.category === 'tops') updateAvatar({ top: item.id });
    else if (item.category === 'bottoms') updateAvatar({ bottom: item.id });
    else if (item.category === 'shoes') updateAvatar({ shoes: item.id });
    else if (item.category === 'accessories') {
      const headItems = ['glasses', 'hat', 'cap', 'headphones', 'crown'];
      const faceItems = ['mask', 'visor'];
      const backItems = ['backpack', 'wings', 'jetpack'];
      const shoulderItems = ['shoulder-pads', 'pauldrons'];

      if (headItems.includes(item.id)) {
        updateAccessories({ head: currentAvatar.accessories.head === item.id ? undefined : item.id });
      } else if (faceItems.includes(item.id)) {
        updateAccessories({ face: currentAvatar.accessories.face === item.id ? undefined : item.id });
      } else if (backItems.includes(item.id)) {
        updateAccessories({ back: currentAvatar.accessories.back === item.id ? undefined : item.id });
      } else if (shoulderItems.includes(item.id)) {
        updateAccessories({ shoulder: currentAvatar.accessories.shoulder === item.id ? undefined : item.id });
      }
    }

    addToast(`Equipped ${item.name}!`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#070912] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Armory & Cosmetics</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Singularity Locker</h1>
          <p className="text-sm text-white/50 mt-1">Unlock, inspect, and equip combat gear and cybernetics.</p>
        </div>

        <Link
          href="/studio"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all self-start md:self-auto"
          style={{ background: 'linear-gradient(135deg, #7C5CFF, #22D3EE)' }}
        >
          <Layers size={16} />
          <span>Launch Customizer</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Filterable Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {([
              { id: 'all', label: 'All Items', icon: Package },
              { id: 'hair', label: 'Hair', icon: Scissors },
              { id: 'tops', label: 'Tops', icon: Shirt },
              { id: 'bottoms', label: 'Bottoms', icon: ShoppingBag },
              { id: 'shoes', label: 'Shoes', icon: Footprints },
              { id: 'accessories', label: 'Accessories', icon: Star },
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    active
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                      : 'border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Rarity Filter Bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40 uppercase tracking-wider font-semibold mr-1">Rarity:</span>
            {['all', 'common', 'rare', 'epic', 'legendary'].map((r) => (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider font-bold text-[10px] transition-all ${
                  rarityFilter === r
                    ? 'bg-white/20 text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const equipped = isEquipped(item);
              const rarityStyle = rarityColors[item.rarity];
              return (
                <div
                  key={`${item.category}-${item.id}`}
                  onClick={() => equipItem(item)}
                  className={`glass-panel p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] relative group ${
                    equipped
                      ? 'border-violet-400 bg-violet-950/30'
                      : `${rarityStyle.border} hover:border-white/30 bg-white/[0.02]`
                  }`}
                >
                  {/* Equipped pill */}
                  {equipped && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <Check size={10} />
                      <span>Equipped</span>
                    </div>
                  )}

                  {item.locked && (
                    <div className="absolute top-2 right-2 bg-red-500/80 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock size={10} />
                      <span>Locked</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded ${rarityStyle.bg} ${rarityStyle.text}`}
                    >
                      {item.rarity}
                    </span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white mt-2 group-hover:text-violet-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-white/40 uppercase font-mono mt-0.5">{item.category}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-white/40">Status</span>
                    <span className={equipped ? 'text-emerald-400 font-bold' : 'text-violet-400 font-medium'}>
                      {equipped ? 'Active' : 'Click to Equip'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Hologram Fitting Room */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="glass-panel p-5 rounded-2xl border border-white/15 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">Fitting Room</p>
                <h3 className="text-base font-bold uppercase text-white">{currentAvatar.name}</h3>
              </div>
              <span className="text-xs text-white/40 font-mono">LV.12</span>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden bg-black/60 border border-white/10 relative">
              <AvatarViewer config={currentAvatar} className="w-full h-full" showControls={false} animate={true} />
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white/40 bg-black/50 px-2 py-0.5 rounded">
                LIVE FITTING
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Top:</span>
                <span className="text-white font-medium">{currentAvatar.top}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Bottom:</span>
                <span className="text-white font-medium">{currentAvatar.bottom}</span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Shoes:</span>
                <span className="text-white font-medium">{currentAvatar.shoes}</span>
              </div>
            </div>

            <Link
              href="/studio"
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5"
            >
              <span>Fine-Tune Dyes & Sizing</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
