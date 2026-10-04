'use client';
// components/studio/RpgEquipmentScreen.tsx
// Modern Mobile/Indie RPG Character Build & Outfitting Screen
// Theme: Deep Forest Obsidian Slate & Moss Emerald (unified with 3D canvas)

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLoadout, setSelectedLoadout] = useState<number>(1);
  const [showBuffInfo, setShowBuffInfo] = useState(false);
  const [sparkleActive, setSparkleActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'skills' | 'traits' | 'costume' | 'vault'>('equipment');

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
    setDrawerOpen(true);
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
    <div className="relative w-screen h-screen overflow-hidden rpg-wood-container flex flex-col select-none text-[#E2F5EC] font-sans">
      {/* Subtle diamond hatch pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#00FF6610_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* GAME LAUNCHER NAV BAR — links to all game routes              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <nav className="relative z-40 w-full flex items-center justify-between px-3 sm:px-6 py-1 bg-[#050C08]/95 border-b border-[#0F2318] backdrop-blur-sm shrink-0">
        {/* Left: Back to Home */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#8CA79B] hover:text-[#00FF66] transition-colors"
          title="Return to Home"
        >
          <ChevronLeft size={13} />
          <span>Home</span>
        </Link>

        {/* Center: Game route links */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {([
            { href: '/lobby', label: 'Arena', icon: <Swords size={11} /> },
            { href: '/dungeon', label: 'Dungeon', icon: <Flame size={11} /> },
            { href: '/ludo', label: 'Ludo', icon: <Compass size={11} /> },
            { href: '/snakes', label: 'Snakes', icon: <Wind size={11} /> },
            { href: '/contest', label: 'Contest', icon: <Crown size={11} /> },
          ] as { href: string; label: string; icon: React.ReactNode }[]).map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B8A77] hover:text-[#00FF66] hover:bg-[#00FF66]/8 transition-all border border-transparent hover:border-[#00FF66]/20"
            >
              {route.icon}
              <span className="hidden sm:inline">{route.label}</span>
            </Link>
          ))}
        </div>

        {/* Right: Studio label */}
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00FF66]/60 select-none">
          Studio
        </span>
      </nav>

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

        {/* Right: Currencies (Gold, Gems, Scrolls) */}
        <div className="flex items-center gap-2">
          {/* Gold Coins */}
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

          {/* Gems */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1C15]/95 border border-[#1E3E2F] shadow-sm">
            <Gem size={12} className="text-[#67E8F9]" />
            <span className="text-xs font-mono font-black text-[#67E8F9]">
              100
            </span>
          </div>

          {/* Relic Scrolls */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D1C15]/95 border border-[#1E3E2F] shadow-sm">
            <Scroll size={12} className="text-[#86EFAC]" />
            <span className="text-xs font-mono font-black text-[#86EFAC]">
              12
            </span>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN RPG EQUIPMENT STAGE (REF IMAGE 2 CENTER & SLOTS)      */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-between px-3 sm:px-6 max-w-5xl mx-auto w-full overflow-hidden">
        {/* UPPER HERO ARENA & 6 FLANKING SLOTS */}
        <div className="relative w-full flex-1 min-h-[300px] flex items-center justify-between">
          {/* ── LEFT FLANKING SLOTS: Weapon, Helmet, Armor ── */}
          <div className="z-20 flex flex-col gap-3.5 sm:gap-4 shrink-0">
            {/* Slot 1: WEAPON (with Roman Numeral Tab I/II) */}
            <div className="relative">
              {/* Tab I / II on top */}
              <div className="absolute -top-3 left-1 z-10 flex">
                <span className="px-2 py-0.5 rounded-t-md text-[9px] font-black bg-gradient-to-b from-[#00FF66] to-[#00B347] text-black border border-[#00B347] shadow-sm">
                  I
                </span>
                <span className="px-2 py-0.5 rounded-t-md text-[9px] font-bold bg-[#13281E] text-[#8CA79B] border border-[#1E3E2F] opacity-60">
                  II
                </span>
              </div>
              <button
                onClick={() => handleSlotClick('weapons')}
                className={`w-16 h-16 sm:w-20 sm:h-20 rpg-slot-box flex flex-col items-center justify-center p-1.5 text-center ${
                  activeCategory === 'weapons' && drawerOpen ? 'active' : ''
                }`}
              >
                <div className="mb-0.5 text-[#00FF66]"><Swords size={22} /></div>
                <span className="text-[9px] font-bold text-[#00FF66] leading-tight truncate w-full px-1">
                  {weaponDetails.name}
                </span>
                {/* Level badge */}
                <div className="absolute -bottom-2 bg-[#0A1811] border border-[#00FF66] px-1.5 py-0.2 rounded-full text-[9px] font-black text-[#00FF66]">
                  Lv. 1
                </div>
              </button>
            </div>

            {/* Slot 2: HELMET / HEADGEAR */}
            <button
              onClick={() => handleSlotClick('hair')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rpg-slot-box flex flex-col items-center justify-center p-1.5 text-center ${
                activeCategory === 'hair' && drawerOpen ? 'active' : ''
              }`}
            >
              <div className="mb-0.5 opacity-80 text-[#E2F5EC]"><HardHat size={22} /></div>
              <span className="text-[9px] font-bold text-[#E2F5EC] leading-tight truncate w-full px-1">
                {headDetails.name}
              </span>
            </button>

            {/* Slot 3: ARMOR / CHEST */}
            <button
              onClick={() => handleSlotClick('tops')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rpg-slot-box flex flex-col items-center justify-center p-1.5 text-center ${
                activeCategory === 'tops' && drawerOpen ? 'active' : ''
              }`}
            >
              <div className="mb-0.5 opacity-80 text-[#E2F5EC]"><Shield size={22} /></div>
              <span className="text-[9px] font-bold text-[#E2F5EC] leading-tight truncate w-full px-1">
                {chestDetails.name}
              </span>
            </button>
          </div>

          {/* ── CENTER 3D AVATAR HERO SHOWCASE ── */}
          <div className="relative flex-1 h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="w-full h-full relative">
              <AvatarViewer
                config={currentAvatar}
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
                  <div className="text-[#00FF66] animate-spin"><Sparkles size={48} /></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sub-Hero Action Cluster: Buff pill + [ AUTO EQUIP ] button */}
            <div className="absolute bottom-2 z-20 flex flex-col items-center gap-2">
              {/* Buff pill with (i) popup */}
              <button
                onClick={() => setShowBuffInfo(!showBuffInfo)}
                className="flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-[#0D1C15]/90 border border-[#1E3E2F] text-[#8CA79B] text-[10px] font-bold shadow-md hover:border-[#00FF66] transition-all"
              >
                <span>No Buff (Ready)</span>
                <Info size={11} className="text-[#00FF66]" />
              </button>

              {/* Auto Equip Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoEquip}
                  className="rpg-auto-equip-btn px-6 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg"
                >
                  <Sparkles size={14} className="text-[#00FF66]" />
                  <span>Auto Equip</span>
                </button>

                {/* Equipment Catalog Button */}
                <button
                  onClick={() => {
                    setActiveTab('costume');
                    setDrawerOpen(true);
                  }}
                  title="Open Equipment Catalog"
                  className="flex flex-col items-center text-[#7E9F90] hover:text-[#00FF66] transition-colors p-1"
                >
                  <BookOpen size={18} />
                  <span className="text-[8px] font-bold mt-0.5">Catalog</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT FLANKING SLOTS: Boots, Amulet, Relic/Back ── */}
          <div className="z-20 flex flex-col gap-3.5 sm:gap-4 shrink-0 items-end">
            {/* Slot 4: BOOTS / SABATONS */}
            <button
              onClick={() => handleSlotClick('shoes')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rpg-slot-box flex flex-col items-center justify-center p-1.5 text-center ${
                activeCategory === 'shoes' && drawerOpen ? 'active' : ''
              }`}
            >
              <div className="mb-0.5 opacity-80 text-[#E2F5EC]"><Footprints size={22} /></div>
              <span className="text-[9px] font-bold text-[#E2F5EC] leading-tight truncate w-full px-1">
                {bootsDetails.name}
              </span>
            </button>

            {/* Slot 5: AMULET / FACE */}
            <button
              onClick={() => handleSlotClick('accessories')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rpg-slot-box flex flex-col items-center justify-center p-1.5 text-center ${
                activeCategory === 'accessories' && drawerOpen ? 'active' : ''
              }`}
            >
              <div className="mb-0.5 opacity-80 text-[#E2F5EC]"><Eye size={22} /></div>
              <span className="text-[9px] font-bold text-[#E2F5EC] leading-tight truncate w-full px-1">
                {faceDetails.name}
              </span>
            </button>

            {/* Slot 6: RING / RELIC / BACK */}
            <button
              onClick={() => handleSlotClick('accessories')}
              className={`w-16 h-16 sm:w-20 sm:h-20 rpg-slot-box flex flex-col items-center justify-center p-1.5 text-center ${
                activeCategory === 'accessories' && drawerOpen ? 'active' : ''
              }`}
            >
              <div className="mb-0.5 opacity-80 text-[#E2F5EC]"><Backpack size={22} /></div>
              <span className="text-[9px] font-bold text-[#E2F5EC] leading-tight truncate w-full px-1">
                {backDetails.name}
              </span>
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 3. COMBAT POWER LAUREL & 10-STAT MATRIX (REF IMAGE 2 LOWER)   */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="w-full rpg-leather-panel p-3 sm:p-4 mb-2 z-20 shadow-2xl">
          {/* Golden Laurel Wreath Combat Power Header (Ref: ⚔️ 1,459) */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <Leaf size={14} className="text-[#00FF66]" />
            <div className="rpg-laurel-banner px-5 py-1 flex items-center gap-2">
              <Swords size={16} className="text-[#00FF66]" />
              <span className="font-mono font-black text-lg text-[#00FF66] tracking-wider">
                {combatPower.toLocaleString()}
              </span>
            </div>
            <Leaf size={14} className="text-[#00FF66] scale-x-[-1]" />
          </div>

          {/* 10-Stat Matrix Grid (2 Columns, matching Ref Image 2) */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono max-w-xl mx-auto">
            {/* Left Column Stats */}
            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">ATK</span>
              <span className="font-bold text-[#F0FDF4]">{stats.power}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">ATK Spd</span>
              <span className="font-bold text-[#F0FDF4]">{atkSpeed}%</span>
            </div>

            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">DEF</span>
              <span className="font-bold text-[#F0FDF4]">{stats.defense}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">HP</span>
              <span className="font-bold text-[#F0FDF4]">{stats.maxHp.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">HP Regen</span>
              <span className="font-bold text-[#F0FDF4]">{hpRegen}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">Skill Dmg</span>
              <span className="font-bold text-[#F0FDF4]">{skillDmg}%</span>
            </div>

            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">Crit Rate</span>
              <span className="font-bold text-[#F0FDF4]">{stats.criticalRate}%</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1E3E2F]/40 pb-0.5">
              <span className="text-[#8CA79B]">Crit Dmg</span>
              <span className="font-bold text-[#F0FDF4]">{critDmg}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8CA79B]">CD Reduce</span>
              <span className="font-bold text-[#F0FDF4]">{cooldownReduction}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8CA79B]">Move Spd</span>
              <span className="font-bold text-[#F0FDF4]">{moveSpeed}</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 4. BOTTOM CATEGORY NAVIGATION TABS (REF IMAGE 2 DOCK)         */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="w-full flex items-center justify-between bg-[#091510]/95 border-t border-[#162E23] py-2 px-2 sm:px-4 rounded-t-2xl z-20">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            {([
              { id: 'equipment' as const, label: 'Gear', icon: <Swords size={13} /> },
              { id: 'skills' as const, label: 'Species', icon: <Zap size={13} /> },
              { id: 'traits' as const, label: 'Body', icon: <Sliders size={13} /> },
              { id: 'costume' as const, label: 'Wardrobe', icon: <Palette size={13} /> },
              { id: 'vault' as const, label: 'Vault', icon: <Archive size={13} /> },
            ] as { id: 'equipment' | 'skills' | 'traits' | 'costume' | 'vault'; label: string; icon: React.ReactNode }[]).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'skills') setActiveCategory('species');
                    else if (tab.id === 'traits') setActiveCategory('body');
                    else if (tab.id === 'costume') setActiveCategory('hair');
                    setDrawerOpen(true);
                    sound.playClick();
                  }}
                  className={`rpg-tab-pill px-3 py-1.5 text-xs flex items-center gap-1 shrink-0 ${
                    isActive ? 'active' : 'hover:bg-white/5'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Save Avatar Action */}
          <button
            onClick={() => {
              saveAvatar();
              sound.playEquip();
              addToast(`"${currentAvatar.name}" saved to vault!`, 'success');
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#00FF66] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1 hover:scale-105 transition-all shadow-[0_0_12px_rgba(0,255,102,0.4)] shrink-0 ml-2"
          >
            <Check size={12} />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* 5. BOTTOM DOCK WITH ( X ) EXIT & QUICK ICONS                   */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="w-full flex items-center justify-between px-4 py-2 z-20 bg-[#050B08] border-t border-[#12241C]">
          {/* Chest / Vault */}
          <button
            onClick={() => {
              setActiveTab('vault');
              setDrawerOpen(true);
            }}
            title="Open Vault"
            className="text-[#7E9F90] hover:text-[#00FF66] p-1.5 transition-colors"
          >
            <Package size={20} />
          </button>

          {/* Grimoire / Rules */}
          <Link
            href="/style-guide"
            title="Grimoire & Design Rules"
            className="text-[#7E9F90] hover:text-[#00FF66] p-1.5 transition-colors"
          >
            <BookOpen size={20} />
          </Link>

          {/* Center ( X ) Exit Button to Return to Home / Arena */}
          <Link
            href="/"
            title="Return to Arena Lobby"
            className="w-10 h-10 -mt-4 rounded-full bg-gradient-to-b from-[#10241A] to-[#060D09] border-2 border-[#1E3E2F] flex items-center justify-center text-[#00FF66] hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            <X size={20} strokeWidth={3} />
          </Link>

          {/* Creature Mascot / Companion */}
          <button
            onClick={() => {
              updateAvatar({ accessories: { ...currentAvatar.accessories, back: 'backpack' } });
              sound.playEquip();
              addToast('Companion Mascot fitted to your pack!', 'info');
            }}
            title="Equip Creature Mascot"
            className="text-[#7E9F90] hover:text-[#00FF66] p-1.5 transition-colors"
          >
            <Package size={20} />
          </button>

          {/* World Map to Arena / Ludo */}
          <Link
            href="/lobby"
            title="Expedition World Map (Arena)"
            className="text-[#7E9F90] hover:text-[#00FF66] p-1.5 transition-colors"
          >
            <Map size={20} />
          </Link>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 6. SLIDE-UP ITEM SELECTOR DRAWER (OPENS ON SLOT TAP)          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute bottom-14 left-0 right-0 z-40 max-w-2xl mx-auto p-4"
          >
            <div className="rpg-leather-panel border-2 border-[#00FF66]/60 shadow-[0_0_40px_rgba(0,255,102,0.2)] overflow-hidden flex flex-col max-h-[55vh]">
              {/* Drawer Header */}
              <div className="px-4 py-2.5 bg-[#0B1712] border-b border-[#1E3E2F] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench size={14} className="text-[#00FF66]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#00FF66]">
                    {activeCategory} Equipment Bay
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => randomizeAvatar()}
                    className="p-1 rounded text-[#00FF66] hover:text-white"
                    title="Randomize Category"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-[#7E9F90] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Drawer Content: Full Customization Controls */}
              <div className="p-4 overflow-y-auto no-scrollbar flex-1 bg-[#070F0B]/95">
                <CustomizationPanel />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
