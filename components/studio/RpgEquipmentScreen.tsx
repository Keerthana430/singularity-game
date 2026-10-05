'use client';
// components/studio/RpgEquipmentScreen.tsx
// Modern RPG Character Build & Outfitting Screen with Dual-Flank Holographic Gear Sockets
// Theme: Deep Forest Obsidian Slate & Moss Emerald (unified with 3D canvas)

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Swords,
  Shield,
  Zap,
  Coins,
  Check,
  Crown,
  Footprints,
  Eye,
  Sliders,
  Palette,
  Backpack,
  Layers,
  Info,
} from 'lucide-react';
import { AvatarConfig, StudioCategory } from '@/types/avatar';
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
import { SPECIES_LIST } from '@/data/species';
import { sound } from '@/lib/audio';
import { useToast } from '@/components/Toast';

export function RpgEquipmentScreen() {
  const {
    currentAvatar,
    updateAvatar,
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

  // Derived combat power
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

  // Helper to resolve readable item names and rarity for equipment slots
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
      case 'bottom': {
        const item = bottoms.find((b) => b.id === id);
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
      case 'species': {
        const sp = SPECIES_LIST.find((s) => s.id === id);
        return { name: sp?.name || id, rarity: 'rare' };
      }
      default:
        return { name: id, rarity: 'common' };
    }
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'mythic':
        return '#00FF66';
      case 'legendary':
        return '#F59E0B';
      case 'epic':
        return '#A855F7';
      case 'rare':
        return '#38BDF8';
      case 'uncommon':
        return '#34D399';
      default:
        return '#64748B';
    }
  };

  const categoryMeta: Record<StudioCategory, { title: string; subtitle: string; icon: React.ReactNode }> = {
    weapons: { title: 'Weapon Armament', subtitle: 'Offensive Battle Gear', icon: <Swords size={18} /> },
    hair: { title: 'Head & Coiffure', subtitle: 'Headgear & Hairstyles', icon: <Crown size={18} /> },
    tops: { title: 'Chest Armor', subtitle: 'Torso Plating & Robes', icon: <Shield size={18} /> },
    bottoms: { title: 'Legs & Greaves', subtitle: 'Pants, Kilts & Armor', icon: <Layers size={18} /> },
    shoes: { title: 'Boots & Footwear', subtitle: 'Treads, Sabatons & Kicks', icon: <Footprints size={18} /> },
    accessories: { title: 'Back Auxiliaries', subtitle: 'Wings, Capes & Jetpacks', icon: <Backpack size={18} /> },
    face: { title: 'Face & Optics', subtitle: 'Visors, Masks & Eyewear', icon: <Eye size={18} /> },
    species: { title: 'Species Core', subtitle: 'Genetics & Innate Heritage', icon: <Zap size={18} /> },
    body: { title: 'Body Matrix', subtitle: 'Height, Silhouette & Frame', icon: <Sliders size={18} /> },
    colors: { title: 'Dyes & Shaders', subtitle: 'Chromatic Matrix & Aura', icon: <Palette size={18} /> },
  };

  const weaponDetails = getSlotDetails('weapon', currentAvatar.weapon);
  const headDetails = getSlotDetails('hair', currentAvatar.hair);
  const chestDetails = getSlotDetails('top', currentAvatar.top);
  const legsDetails = getSlotDetails('bottom', currentAvatar.bottom);
  const bootsDetails = getSlotDetails('shoes', currentAvatar.shoes);
  const faceDetails = getSlotDetails('face', currentAvatar.accessories?.face);
  const backDetails = getSlotDetails('back', currentAvatar.accessories?.back);
  const speciesDetails = getSlotDetails('species', currentAvatar.species);

  // Left Flank (Combat & Upper Armor)
  const leftSlots = [
    { cat: 'weapons' as StudioCategory, label: 'WEAPON', item: weaponDetails, icon: <Swords size={22} />, color: '#00FF66' },
    { cat: 'hair' as StudioCategory, label: 'HEAD / HAIR', item: headDetails, icon: <Crown size={22} />, color: '#38BDF8' },
    { cat: 'tops' as StudioCategory, label: 'CHEST ARMOR', item: chestDetails, icon: <Shield size={22} />, color: '#10B981' },
    { cat: 'bottoms' as StudioCategory, label: 'LEGS / GREAVES', item: legsDetails, icon: <Layers size={22} />, color: '#A855F7' },
  ];

  // Right Flank (Mobility, Aux & Core)
  const rightSlots = [
    { cat: 'accessories' as StudioCategory, label: 'BACK GEAR', item: backDetails, icon: <Backpack size={22} />, color: '#F59E0B' },
    { cat: 'shoes' as StudioCategory, label: 'BOOTS', item: bootsDetails, icon: <Footprints size={22} />, color: '#EC4899' },
    { cat: 'face' as StudioCategory, label: 'FACE / VISOR', item: faceDetails, icon: <Eye size={22} />, color: '#6366F1' },
    { cat: 'species' as StudioCategory, label: 'SPECIES CORE', item: speciesDetails, icon: <Zap size={22} />, color: '#14B8A6' },
  ];

  // Handle clicking an equipment slot
  const handleSlotClick = (category: StudioCategory) => {
    setActiveCategory(category);
    setPanelOpen(true);
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

  // Reusable RPG Gear Socket Renderer
  const renderGearSlot = (
    slot: {
      cat: StudioCategory;
      label: string;
      item: { name: string; rarity: string };
      icon: React.ReactNode;
      color: string;
    },
    align: 'left' | 'right'
  ) => {
    const isActive = activeCategory === slot.cat && panelOpen;
    const rarityColor = getRarityColor(slot.item.rarity);

    return (
      <motion.button
        key={slot.label}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => handleSlotClick(slot.cat)}
        className={`group relative flex items-center gap-2.5 p-1.5 rounded-2xl transition-all ${
          align === 'right' ? 'flex-row-reverse text-right' : 'text-left'
        } ${
          isActive
            ? 'bg-[#00FF66]/15 border-2 border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.4)]'
            : 'bg-[#07130E]/85 border border-[#1E3E2F] hover:border-[#00FF66]/60 hover:bg-[#0D1C15]/95 shadow-[0_6px_24px_rgba(0,0,0,0.6)]'
        } backdrop-blur-md`}
      >
        {/* Holographic Socket Disc Frame */}
        <div
          className="relative w-13 h-13 sm:w-15 sm:h-15 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform overflow-hidden"
          style={{
            background: isActive
              ? 'radial-gradient(circle, rgba(0,255,102,0.25) 0%, rgba(7,19,14,0.95) 75%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(7,19,14,0.95) 75%)',
            border: `2px solid ${isActive ? '#00FF66' : rarityColor}`,
            boxShadow: isActive
              ? '0 0 16px rgba(0,255,102,0.5), inset 0 0 12px rgba(0,255,102,0.3)'
              : `0 0 10px ${rarityColor}30`,
          }}
        >
          {/* Subtle Scanline Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity" />

          {/* Slot Icon */}
          <div
            className="transition-colors drop-shadow-md"
            style={{ color: isActive ? '#00FF66' : slot.color }}
          >
            {slot.icon}
          </div>

          {/* Small Corner Rarity Dot */}
          <div
            className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-black/80 shadow-sm"
            style={{ backgroundColor: rarityColor }}
            title={`Rarity: ${slot.item.rarity}`}
          />
        </div>

        {/* Sleek Minimal Label Under/Beside Socket on Hover or Active */}
        <div className={`hidden lg:flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} max-w-[110px]`}>
          <span
            className="text-[9px] font-mono font-black tracking-widest uppercase transition-colors"
            style={{ color: isActive ? '#00FF66' : '#7E9F90' }}
          >
            {slot.label}
          </span>
          <span className="text-[11px] font-bold text-white/90 truncate group-hover:text-[#00FF66] transition-colors">
            {slot.item.name}
          </span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden rpg-wood-container flex flex-col select-none text-[#E2F5EC] font-sans pt-16">
      {/* Subtle diamond hatch pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#00FF6610_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 1. TOP STATUS & CURRENCY BAR                                  */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <header className="relative z-30 px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2 max-w-5xl mx-auto w-full">
        {/* Left: Player Avatar Badge + Power */}
        <div className="flex items-center gap-2.5 bg-[#0D1C15]/95 border-2 border-[#1E3E2F] rounded-full pl-1.5 pr-4 py-1 shadow-lg">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#00FF66] bg-[#07130E] shrink-0">
            <div className="w-full h-full flex items-center justify-center font-black text-xs text-[#00FF66]">
              {currentAvatar.name.slice(0, 2).toUpperCase()}
            </div>
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

        {/* Right: Gold Coins */}
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN STAGE: LEFT DRAWER + 3D AVATAR HERO STAGE             */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden w-full">

        {/* ── LEFT: Item Customization Drawer (No Redundant Horizontal Tabs) ── */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              key="equip-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="relative z-20 shrink-0 flex flex-col bg-[#050C08]/98 border-r border-[#1E3E2F] shadow-[4px_0_24px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ minWidth: 0 }}
            >
              {/* Active Category Header with Close Button */}
              <div className="px-4 py-3.5 border-b border-[#1E3E2F] flex items-center justify-between bg-[#07130E]/90 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00FF66]/15 border border-[#00FF66]/50 flex items-center justify-center text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.25)]">
                    {categoryMeta[activeCategory]?.icon || <Sparkles size={16} />}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#7E9F90] uppercase block">
                      Fitting Slot
                    </span>
                    <h2 className="text-xs font-black text-white uppercase tracking-wider">
                      {categoryMeta[activeCategory]?.title || activeCategory}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  title="Close Fitting Drawer"
                  className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:border-[#00FF66]/50 hover:bg-[#00FF66]/10 flex items-center justify-center text-[#7E9F90] hover:text-[#00FF66] transition-all"
                >
                  <X size={15} />
                </button>
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

              {/* Bottom action row in left drawer */}
              <div className="shrink-0 px-4 py-3 border-t border-[#1E3E2F] flex items-center gap-3 bg-[#050C08]">
                <button
                  onClick={handleAutoEquip}
                  className="flex-1 rpg-auto-equip-btn py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl"
                >
                  <Sparkles size={14} className="text-[#00FF66]" />
                  <span>Auto Equip</span>
                </button>
                <button
                  onClick={() => {
                    saveAvatar();
                    sound.playEquip();
                    addToast(`"${currentAvatar.name}" saved!`, 'success');
                  }}
                  className="px-5 py-2 rounded-xl bg-[#00FF66] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,255,102,0.4)]"
                >
                  <Check size={13} strokeWidth={3} />
                  <span>Save</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CENTER / RIGHT: 3D Avatar Hero Stage with Dual-Flank RPG Sockets ── */}
        <div className="relative flex-1 h-full flex flex-col items-center justify-center overflow-hidden">

          {/* Panel toggle button — left edge of avatar stage */}
          <button
            onClick={() => setPanelOpen((v) => !v)}
            title={panelOpen ? 'Hide Equipment Drawer' : 'Show Equipment Drawer'}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-14 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] hover:border-[#00FF66] flex items-center justify-center text-[#00FF66] hover:scale-105 transition-all shadow-lg"
          >
            {panelOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Hover preview indicator banner */}
          <AnimatePresence>
            {hoverPreview && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/50 backdrop-blur-sm"
              >
                <span className="text-[10px] font-black text-[#00FF66] uppercase tracking-widest flex items-center gap-1.5">
                  <Eye size={12} />
                  <span>Previewing Equipment</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Avatar Viewer */}
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

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* DUAL-FLANK RPG EQUIPMENT SOCKETS (DIABLO / DESTINY STYLE)   */}
          {/* ═══════════════════════════════════════════════════════════ */}

          {/* Left Flank Gear Sockets (Weapon, Head, Chest, Legs) */}
          <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
            {leftSlots.map((slot) => renderGearSlot(slot, 'left'))}
          </div>

          {/* Right Flank Gear Sockets (Back, Boots, Face, Species) */}
          <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
            {rightSlots.map((slot) => renderGearSlot(slot, 'right'))}
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* BOTTOM QUICK DOCK: BODY MATRIX, DYES & SHADERS, SAVE       */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#07130E]/90 border border-[#1E3E2F] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => handleSlotClick('body')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'body' && panelOpen
                  ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]'
                  : 'text-[#7E9F90] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Body Matrix</span>
            </button>

            <button
              onClick={() => handleSlotClick('colors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'colors' && panelOpen
                  ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]'
                  : 'text-[#7E9F90] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Palette size={13} />
              <span className="hidden sm:inline">Dyes & Shaders</span>
            </button>

            <div className="w-[1px] h-4 bg-[#1E3E2F] mx-0.5" />

            <button
              onClick={handleAutoEquip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#00FF66]/15 border border-white/10 hover:border-[#00FF66]/50 text-white text-xs font-bold transition-all"
            >
              <Sparkles size={13} className="text-[#00FF66]" />
              <span className="hidden sm:inline">Auto Equip</span>
            </button>

            <button
              onClick={() => {
                saveAvatar();
                sound.playEquip();
                addToast(`"${currentAvatar.name}" saved!`, 'success');
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00FF66] hover:bg-[#00E65C] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_14px_rgba(0,255,102,0.45)] transition-all hover:scale-105"
            >
              <Check size={13} strokeWidth={3} />
              <span>Save</span>
            </button>
          </div>

          {/* Buff pill (Bottom-right accent) */}
          <div className="absolute bottom-4 right-4 z-20 hidden lg:block">
            <button
              onClick={() => setShowBuffInfo(!showBuffInfo)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] text-[#8CA79B] text-[10px] font-bold shadow-md hover:border-[#00FF66] transition-all"
            >
              <span>Buff Matrix</span>
              <Info size={11} className="text-[#00FF66]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
