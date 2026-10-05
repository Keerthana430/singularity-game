'use client';
// components/studio/RpgEquipmentScreen.tsx
// Modern Mobile/Indie RPG Character Build & Outfitting Screen
// Theme: Deep Forest Obsidian Slate & Moss Emerald (unified with 3D canvas)

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Flame,
  Wind,
  Coins,
  Crown,
  Info,
  Check,
  RotateCcw,
  BookOpen,
  Map,
  Compass,
  Archive,
  Shirt,
  Footprints,
  Feather,
  Eye,
  Sliders,
  Palette,
  Package,
  Gem,
  Scroll,
  Leaf,
  HardHat,
  Backpack,
  Hammer,
  Star,
  Layers,
  Box,
  Wrench,
} from 'lucide-react';
import { AvatarConfig, StudioCategory, AvatarItem } from '@/types/avatar';
import { useAvatarStore } from '@/store/avatarStore';
import { AvatarViewer } from '@/components/avatar/AvatarViewer';
import { calculateAvatarStats } from '@/lib/statsCalculator';
import { CustomizationPanel } from './CustomizationPanel';
import { hairStyles } from '@/data/hairStyles';
import { tops } from '@/data/tops';
import { bottoms } from '@/data/bottoms';
import { shoes } from '@/data/shoes';
import { weapons } from '@/data/weapons';
import { accessories } from '@/data/accessories';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';

export function RpgEquipmentScreen() {
  const {
    currentAvatar,
    updateAvatar,
    randomizeAvatar,
    saveAvatar,
    savedAvatars,
    loadAvatar,
    coins,
    topUpCoins,
    activeCategory,
    setActiveCategory,
  } = useAvatarStore();

  const { add: addToast } = useToast();

  const [selectedLoadout, setSelectedLoadout] = useState<number>(1);
  const [showBuffInfo, setShowBuffInfo] = useState(false);
  const [sparkleActive, setSparkleActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'skills' | 'traits' | 'costume' | 'vault'>('equipment');
  const [panelOpen, setPanelOpen] = useState(true);

  // Hover-preview: temporarily show an item on the avatar without equipping it
  const [hoverPreview, setHoverPreview] = useState<Partial<AvatarConfig> | null>(null);
  const handleHoverPreview = useCallback((patch: Partial<AvatarConfig> | null) => {
    setHoverPreview(patch);
  }, []);

  // Config seen by the 3D viewer — real config PLUS any hover preview overlay
  const displayConfig = useMemo<AvatarConfig>(() => {
    if (!hoverPreview) return currentAvatar;
    return { ...currentAvatar, ...hoverPreview };
  }, [currentAvatar, hoverPreview]);

  // Calculate live RPG combat stats
  const stats = useMemo(() => calculateAvatarStats(currentAvatar), [currentAvatar]);

  // Derived 10-stat matrix from Reference Image 2
  const combatPower = useMemo(() => {
    return Math.round(
      stats.maxHp * 0.5 +
        stats.power * 2.8 +
        stats.defense * 2.2 +
        stats.agility * 3.5 +
        stats.magic * 3.0 +
        stats.criticalRate * 12
    );
  }, [stats]);

  const atkSpeed = (20 + stats.agility * 0.18).toFixed(1);
  const hpRegen = Math.round(stats.maxHp * 0.008 + (stats.species.id === 'fairy' ? 8 : 2));
  const skillDmg = Math.round(stats.magic * 0.22);
  const critDmg = 120 + Math.round(stats.power * 0.25);
  const cooldownReduction = Math.min(35, Math.round(stats.agility * 0.12));
  const moveSpeed = (4.5 + stats.agility * 0.025).toFixed(1);

  // Helper to resolve readable item names for equipment slots
  const getSlotDetails = (cat: string, id?: string) => {
    if (!id || id === 'none' || id === 'unarmed') return { name: 'Empty', rarity: 'common' };
    switch (cat) {
      case 'weapon': {
        const item = weapons.find((w) => w.id === id);
        return { name: item?.name || id, rarity: item?.rarity || 'common' };
      }
      case 'hair': {
        const item = hairStyles.find((h) => h.id === id);
        return { name: item?.name || id, rarity: item?.rarity || 'common' };
      }
      case 'top': {
        const item = tops.find((t) => t.id === id);
        return { name: item?.name || id, rarity: item?.rarity || 'common' };
      }
      case 'shoes': {
        const item = shoes.find((s) => s.id === id);
        return { name: item?.name || id, rarity: item?.rarity || 'common' };
      }
      case 'face': {
        const item = accessories.find((a) => a.id === id);
        return { name: item?.name || id, rarity: item?.rarity || 'common' };
      }
      case 'back': {
        const item = accessories.find((a) => a.id === id);
        return { name: item?.name || id, rarity: item?.rarity || 'common' };
      }
      default:
        return { name: id, rarity: 'common' };
    }
  };

  const weaponDetails = getSlotDetails('weapon', currentAvatar.weapon);
  const headDetails = getSlotDetails('hair', currentAvatar.hair);
  const chestDetails = getSlotDetails('top', currentAvatar.top);
  const bootsDetails = getSlotDetails('shoes', currentAvatar.shoes);
  const faceDetails = getSlotDetails('face', currentAvatar.accessories?.face);
  const backDetails = getSlotDetails('back', currentAvatar.accessories?.back);

  // Handle clicking an equipment slot
  const handleSlotClick = (category: StudioCategory) => {
    setActiveCategory(category);
    sound.playClick();
  };

  // Handle Auto-Equip
  const handleAutoEquip = () => {
    const randomWeapon = weapons[Math.floor(Math.random() * (weapons.length - 1))];
    const bestTops = ['armor', 'futuristic-suit', 'jacket', 'hoodie'];
    const randomTop = bestTops[Math.floor(Math.random() * bestTops.length)];
    const randomShoe = shoes[Math.floor(Math.random() * shoes.length)];
    const backAccessories = ['backpack', 'wings', 'fairy-wings', 'angel-wings'];
    const randomBack = backAccessories[Math.floor(Math.random() * backAccessories.length)];

    updateAvatar({
      weapon: randomWeapon.id,
      top: randomTop,
      shoes: randomShoe.id,
      accessories: {
        ...currentAvatar.accessories,
        back: randomBack,
      },
    });

    setSparkleActive(true);
    setTimeout(() => setSparkleActive(false), 1400);
    sound.playEquip();
    addToast('Auto-Equipped: Highest Power Gear Fitted!', 'success');
  };

  // Handle preset loadout switch [ 1 ] [ 2 ] [ 3 ]
  const handleLoadoutSelect = (idx: number) => {
    setSelectedLoadout(idx);
    sound.playClick();
    if (savedAvatars[idx - 1]) {
      loadAvatar(savedAvatars[idx - 1].id);
      addToast(`Loaded Loadout #${idx}`, 'info');
    } else {
      addToast(`Loadout Slot #${idx} ready to save`, 'info');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden rpg-wood-container flex flex-col select-none text-[#E2F5EC] font-sans pt-16">
      {/* Subtle diamond hatch pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#00FF6610_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 1. TOP STATUS & CURRENCY BAR (REF IMAGE 2 TOP)                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <header className="relative z-30 px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2 max-w-5xl mx-auto w-full">
        {/* Left: Player Avatar Badge + Power */}
        <div className="flex items-center gap-2.5 bg-[#0D1C15]/95 border-2 border-[#1E3E2F] rounded-full pl-1.5 pr-4 py-1 shadow-lg">
          {/* Circular avatar mini-frame */}
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#00FF66] bg-[#07130E] shrink-0">
            <div className="w-full h-full flex items-center justify-center font-black text-xs text-[#00FF66]">
              {currentAvatar.name.slice(0, 2).toUpperCase()}
            </div>
            {/* Level mini-badge */}
            <div className="absolute bottom-0 right-0 bg-[#00FF66] text-black font-black text-[9px] px-1 rounded-tl">
              2
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#E2F5EC] truncate max-w-[110px] leading-tight">
              {currentAvatar.name}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono font-black text-[#00FF66]">
              <Swords size={10} />
              <span>{combatPower.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center: Preset Loadout Switcher [ 1 ] [ 2 ] [ 3 ] */}
        <div className="flex items-center gap-1.5 bg-[#0D1C15]/85 border border-[#1E3E2F] rounded-full p-1 shadow-inner">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleLoadoutSelect(num)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                selectedLoadout === num
                  ? 'bg-gradient-to-b from-[#00FF66] to-[#00B347] text-[#05140C] shadow-[0_0_12px_rgba(0,255,102,0.4)] scale-105 border border-[#FFF]'
                  : 'text-[#7E9F90] hover:text-white hover:bg-white/10'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Right: Gold Coins only */}
        <div className="flex items-center gap-2">
          <div
            onClick={topUpCoins}
            title="Click to replenish Gold"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1C15]/95 border border-[#1E3E2F] cursor-pointer hover:border-[#00FF66] transition-all shadow-sm"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#D97706] to-[#FCD34D] flex items-center justify-center text-black font-black text-[9px] shadow-sm">
              <Coins size={10} strokeWidth={3} />
            </div>
            <span className="text-xs font-mono font-black text-[#FCD34D]">
              {coins.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. MAIN STAGE - LEFT EQUIPMENT PANEL + RIGHT 3D AVATAR        */}
      {/* ============================================================= */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden w-full">

        {/* -- LEFT: Equipment / Customization Panel (collapsible) -- */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              key="equip-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative z-20 shrink-0 flex flex-col bg-[#050C08]/98 border-r border-[#1E3E2F] shadow-[4px_0_24px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ minWidth: 0 }}
            >

          {/* Category slot pills at top of panel */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 pt-3 pb-2.5 border-b border-[#1E3E2F] shrink-0">
            {([
              { id: 'weapons' as StudioCategory, label: 'Weapons', icon: <Swords size={12} /> },
              { id: 'species' as StudioCategory, label: 'Species', icon: <Zap size={12} /> },
              { id: 'body' as StudioCategory, label: 'Body', icon: <Sliders size={12} /> },
              { id: 'hair' as StudioCategory, label: 'Hair', icon: <Feather size={12} /> },
              { id: 'tops' as StudioCategory, label: 'Tops', icon: <Shirt size={12} /> },
              { id: 'bottoms' as StudioCategory, label: 'Bottoms', icon: <Layers size={12} /> },
              { id: 'shoes' as StudioCategory, label: 'Shoes', icon: <Footprints size={12} /> },
              { id: 'accessories' as StudioCategory, label: 'Access.', icon: <Backpack size={12} /> },
              { id: 'colors' as StudioCategory, label: 'Colors', icon: <Palette size={12} /> },
            ] as { id: StudioCategory; label: string; icon: React.ReactNode }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveCategory(tab.id); sound.playClick(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                  activeCategory === tab.id
                    ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/60 shadow-[0_0_10px_rgba(0,255,102,0.25)]'
                    : 'text-[#7E9F90] hover:text-white hover:bg-white/8 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Hover-preview indicator banner */}
          <AnimatePresence>
            {hoverPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden shrink-0"
              >
                <div className="mx-3 my-2 px-3 py-1.5 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/40 flex items-center gap-2">
                  <Eye size={12} className="text-[#00FF66] shrink-0" />
                  <span className="text-[10px] font-bold text-[#00FF66] uppercase tracking-wider">Preview Mode — hover any item to try it on</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable customization content */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
            <CustomizationPanel onHoverPreview={handleHoverPreview} />
          </div>

          {/* Bottom action row in left panel */}
          <div className="shrink-0 px-4 py-3 border-t border-[#1E3E2F] flex items-center gap-3 bg-[#050C08]">
            <button
              onClick={handleAutoEquip}
              className="flex-1 rpg-auto-equip-btn py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl"
            >
              <Sparkles size={14} className="text-[#00FF66]" />
              <span>Auto Equip</span>
            </button>
            <button
              onClick={() => { saveAvatar(); sound.playEquip(); addToast(`"${currentAvatar.name}" saved!`, 'success'); }}
              className="px-5 py-2 rounded-xl bg-[#00FF66] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,255,102,0.4)]"
            >
              <Check size={13} strokeWidth={3} />
              <span>Save</span>
            </button>
          </div>
        </motion.div>
        )}
        </AnimatePresence>

        {/* ── RIGHT: 3D Avatar Showcase (never blocked) ── */}
        <div className="relative flex-1 h-full flex flex-col items-center justify-center overflow-hidden">

          {/* Panel toggle button — left edge of avatar side */}
          <button
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? 'Hide Equipment Panel' : 'Show Equipment Panel'}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-14 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] hover:border-[#00FF66] flex items-center justify-center text-[#00FF66] hover:scale-105 transition-all shadow-lg"
          >
            {panelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {/* Hover-preview golden border glow */}
          {hoverPreview && (
            <div className="absolute inset-0 pointer-events-none z-10 border-2 border-[#00FF66]/30 rounded-none" />
          )}

          {/* Hover preview label */}
          <AnimatePresence>
            {hoverPreview && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/50 backdrop-blur-sm"
              >
                <span className="text-[10px] font-black text-[#00FF66] uppercase tracking-widest">👁 Previewing</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full h-full relative">
            <AvatarViewer
              config={displayConfig}
              className="w-full h-full"
              showControls={true}
              animate={true}
            />
          </div>

          {/* Floating Sparkles when Auto-Equip is triggered */}
          <AnimatePresence>
            {sparkleActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 1.6 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
              >
                <div className="text-[#00FF66] animate-spin"><Sparkles size={64} /></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flanking equipment slot quick-access dock (right side of avatar) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5 p-2 rounded-2xl bg-[#07130E]/90 border border-[#1E3E2F] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
            {[
              { cat: 'weapons' as StudioCategory, icon: <Swords size={20} />, label: 'WEAPON', item: weaponDetails },
              { cat: 'hair' as StudioCategory, icon: <HardHat size={20} />, label: 'HEAD', item: headDetails },
              { cat: 'tops' as StudioCategory, icon: <Shield size={20} />, label: 'CHEST', item: chestDetails },
              { cat: 'shoes' as StudioCategory, icon: <Footprints size={20} />, label: 'BOOTS', item: bootsDetails },
              { cat: 'accessories' as StudioCategory, icon: <Eye size={20} />, label: 'FACE', item: faceDetails },
              { cat: 'accessories' as StudioCategory, icon: <Backpack size={20} />, label: 'BACK', item: backDetails },
            ].map((slot, i) => {
              const isActive = activeCategory === slot.cat;
              return (
                <button
                  key={i}
                  onClick={() => handleSlotClick(slot.cat)}
                  title={`${slot.label}: ${slot.item.name}`}
                  className={`group relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                    isActive
                      ? 'bg-[#00FF66]/20 border-2 border-[#00FF66] shadow-[0_0_16px_rgba(0,255,102,0.45)] scale-105'
                      : 'bg-white/5 border border-white/10 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/10'
                  }`}
                >
                  <div className={`transition-colors ${isActive ? 'text-[#00FF66]' : 'text-[#7E9F90] group-hover:text-white'}`}>
                    {slot.icon}
                  </div>
                  <span className={`text-[8px] font-mono font-black tracking-widest ${isActive ? 'text-[#00FF66]' : 'text-white/40 group-hover:text-white/80'}`}>
                    {slot.label}
                  </span>
                  {/* Equipped item tooltip on hover */}
                  <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-md border border-white/10 whitespace-nowrap shadow-xl z-30">
                    <span className="text-[#00FF66] font-bold">{slot.label}:</span> {slot.item.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom center: Buff pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setShowBuffInfo(!showBuffInfo)}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] text-[#8CA79B] text-[10px] font-bold shadow-md hover:border-[#00FF66] transition-all"
            >
              <span>No Buff (Ready)</span>
              <Info size={11} className="text-[#00FF66]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
