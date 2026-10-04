'use client';
// components/studio/CustomizationPanel.tsx
// Right panel: renders the appropriate controls for the active category.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarStore } from '@/store/avatarStore';
import { ItemCard } from './ItemCard';
import { ColorPicker } from './ColorPicker';
import { StatsPreviewCard } from './StatsPreviewCard';
import { SpeciesCard } from './SpeciesCard';
import { hairStyles } from '@/data/hairStyles';
import { tops } from '@/data/tops';
import { bottoms } from '@/data/bottoms';
import { shoes } from '@/data/shoes';
import { accessories } from '@/data/accessories';
import { faceShapes, eyeStyles, expressionStyles, skinTones } from '@/data/faces';
import { SPECIES_LIST, SpeciesData } from '@/data/species';
import { weapons, WeaponItem } from '@/data/weapons';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { sound } from '@/lib/audio';
import { Zap, Shield, Flame, Wind, Sparkles, Swords, Check, Dices, Coins, Hammer } from 'lucide-react';

const BODY_TYPES = [
  { id: 'slim', label: 'Slim', desc: 'Lean build' },
  { id: 'regular', label: 'Regular', desc: 'Balanced' },
  { id: 'broad', label: 'Broad', desc: 'Powerful' },
  { id: 'chibi', label: 'Chibi', desc: 'Cute & small' },
] as const;

function BodyPanel() {
  const { currentAvatar, updateBody } = useAvatarStore();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Body Type</p>
        <div className="grid grid-cols-2 gap-2">
          {BODY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateBody({ type: t.id })}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentAvatar.body.type === t.id
                  ? 'border-[#00FF66]/60 bg-[#00FF66]/15 text-white shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              <p className="text-xs font-bold tracking-wide">{t.label}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      {([
        { key: 'height', label: 'Height', min: 0.7, max: 1.3, step: 0.01 },
        { key: 'headSize', label: 'Head Size', min: 0.7, max: 1.4, step: 0.01 },
        { key: 'bodySize', label: 'Body Size', min: 0.7, max: 1.3, step: 0.01 },
      ] as const).map((slider) => (
        <div key={slider.key}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/50 uppercase tracking-widest">{slider.label}</p>
            <span className="text-xs text-[#00FF66] font-mono font-bold">{currentAvatar.body[slider.key].toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={currentAvatar.body[slider.key]}
            onChange={(e) => updateBody({ [slider.key]: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #7C5CFF ${((currentAvatar.body[slider.key] - slider.min) / (slider.max - slider.min)) * 100}%, rgba(255,255,255,0.1) 0%)`,
            }}
            aria-label={slider.label}
          />
        </div>
      ))}

      {/* Skin tone */}
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Skin Tone</p>
        <div className="flex flex-wrap gap-2">
          {skinTones.map((tone) => (
            <button
              key={tone}
              onClick={() => useAvatarStore.getState().updateAvatar({ skinTone: tone })}
              aria-label={`Skin tone ${tone}`}
              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                currentAvatar.skinTone === tone ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: tone }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FacePanel() {
  const { currentAvatar, updateFace } = useAvatarStore();
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Eyes</p>
        <div className="grid grid-cols-3 gap-2">
          {eyeStyles.map((e) => (
            <ItemCard
              key={e.id}
              item={e}
              selected={currentAvatar.face.eyes === e.id}
              onSelect={(id) => updateFace({ eyes: id })}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Expression</p>
        <div className="grid grid-cols-3 gap-2">
          {expressionStyles.map((e) => (
            <ItemCard
              key={e.id}
              item={e}
              selected={currentAvatar.face.expression === e.id}
              onSelect={(id) => updateFace({ expression: id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AccessoriesPanel() {
  const { currentAvatar, updateAccessories } = useAvatarStore();
  const slots = [
    { key: 'head' as const, label: 'Head', items: accessories.filter((a) => ['cat-ears', 'bunny-ears', 'bow', 'halo', 'glasses', 'hat', 'cap', 'headphones', 'crown'].includes(a.id)) },
    { key: 'face' as const, label: 'Face', items: accessories.filter((a) => ['ribbon-choker', 'mask', 'visor'].includes(a.id)) },
    { key: 'back' as const, label: 'Back', items: accessories.filter((a) => ['angel-wings', 'fairy-wings', 'backpack', 'wings', 'jetpack'].includes(a.id)) },
    { key: 'shoulder' as const, label: 'Shoulder', items: accessories.filter((a) => ['shoulder-pads', 'pauldrons'].includes(a.id)) },
  ];

  return (
    <div className="flex flex-col gap-6">
      {slots.map((slot) => (
        <div key={slot.key}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/50 uppercase tracking-widest">{slot.label} Slot</p>
            {currentAvatar.accessories[slot.key] && (
              <button
                onClick={() => updateAccessories({ [slot.key]: undefined })}
                className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {slot.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={currentAvatar.accessories[slot.key] === item.id}
                onSelect={(id) => {
                  updateAccessories({ [slot.key]: id });
                  if (item.color) {
                    useAvatarStore.getState().updateAvatar({ accessoryColor: item.color });
                  }
                }}
                accentColor={item.color || currentAvatar.accessoryColor}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const SPECIES_ANATOMICAL_PRESETS: Record<string, { body: { type: 'slim' | 'regular' | 'broad' | 'chibi'; height: number; bodySize: number; headSize: number }; defaultWeapon: string }> = {
  human: {
    body: { type: 'regular', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'photon-blade',
  },
  elf: {
    body: { type: 'slim', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'cyber-staff',
  },
  fairy: {
    body: { type: 'chibi', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'star-wand',
  },
  dwarf: {
    body: { type: 'broad', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'energy-hammer',
  },
  robot: {
    body: { type: 'regular', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'plasma-blaster',
  },
  ogre: {
    body: { type: 'broad', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'energy-hammer',
  },
  alien: {
    body: { type: 'slim', height: 1.0, bodySize: 1.0, headSize: 1.0 },
    defaultWeapon: 'cyber-staff',
  },
};

function SpeciesPanel() {
  const { currentAvatar, updateAvatar } = useAvatarStore();

  const selectedSpecies = SPECIES_LIST.find((s) => s.id === (currentAvatar.species || 'human')) || SPECIES_LIST[0];

  const handleSelectSpecies = (sp: SpeciesData) => {
    sound.playClick();
    const preset = SPECIES_ANATOMICAL_PRESETS[sp.id] || SPECIES_ANATOMICAL_PRESETS.human;
    useAvatarStore.getState().updateAvatar({
      species: sp.id,
      skinTone: sp.defaultSkinTone,
      classRole: sp.roles[0].id,
      body: { ...currentAvatar.body, ...preset.body },
      weapon: (!currentAvatar.weapon || currentAvatar.weapon === 'unarmed') ? preset.defaultWeapon : currentAvatar.weapon,
    });
  };

  const handleRollRandomSpecies = () => {
    const chosen = SPECIES_LIST[Math.floor(Math.random() * SPECIES_LIST.length)];
    sound.playSweep();
    handleSelectSpecies(chosen);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── CARD DECK HEADER: Streamlined 1-row control ── */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Character Species
          </h3>
          <p className="text-[10px] text-white/50 font-mono">Select your combat archetype</p>
        </div>

        <button
          onClick={handleRollRandomSpecies}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono uppercase tracking-wider transition-all shadow-sm active:scale-95"
          title="Draw random card"
        >
          <Dices size={13} className="text-amber-400" />
          <span>Roll Random</span>
        </button>
      </div>

      {/* ── 2-COLUMN COLLECTIBLE CARD GRID (CLEAN & SPACIOUS) ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {SPECIES_LIST.map((sp) => (
          <SpeciesCard
            key={sp.id}
            species={sp}
            isSelected={(currentAvatar.species || 'human') === sp.id}
            onSelect={() => handleSelectSpecies(sp)}
          />
        ))}
      </div>

      {/* ── ACTIVE CARD DOSSIER & SUB-CLASS DECK ── */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-3">
        <div className="p-3 rounded-xl border border-white/10 bg-white/3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSpecies.accentColor }} />
              <span className="text-xs font-black uppercase text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                {selectedSpecies.name} Combat Traits
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/50">{selectedSpecies.domain}</span>
          </div>

          <p className="text-[11px] text-white/80 leading-relaxed font-sans">
            <strong className="text-emerald-400">Innate Buff: </strong>{selectedSpecies.innateBuff}
          </p>

          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-white/10 text-center font-mono text-[10px]">
            <div className="bg-white/5 rounded py-1">
              <span className="text-white/40 block text-[9px]">HP</span>
              <span className="font-bold text-emerald-400">{selectedSpecies.baseHp}</span>
            </div>
            <div className="bg-white/5 rounded py-1">
              <span className="text-white/40 block text-[9px]">ATK</span>
              <span className="font-bold text-rose-400">{selectedSpecies.basePower}</span>
            </div>
            <div className="bg-white/5 rounded py-1">
              <span className="text-white/40 block text-[9px]">DEF</span>
              <span className="font-bold text-cyan-400">{selectedSpecies.baseDefense}</span>
            </div>
            <div className="bg-white/5 rounded py-1">
              <span className="text-white/40 block text-[9px]">AGI</span>
              <span className="font-bold text-amber-400">{selectedSpecies.baseAgility}</span>
            </div>
            <div className="bg-white/5 rounded py-1">
              <span className="text-white/40 block text-[9px]">MAG</span>
              <span className="font-bold text-violet-400">{selectedSpecies.baseMagic}</span>
            </div>
          </div>
        </div>

        {/* 4 Sub-Class Roles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-white/50 tracking-wider font-bold">
              Sub-Class Specializations (4)
            </span>
            <span className="text-[9px] font-mono text-violet-300 uppercase px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/30">
              Active: {currentAvatar.classRole || selectedSpecies.roles[0].id}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {selectedSpecies.roles.map((role) => {
              const isRoleSelected = (currentAvatar.classRole || selectedSpecies.roles[0].id) === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    sound.playClick();
                    updateAvatar({ classRole: role.id });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between select-none ${
                    isRoleSelected
                      ? 'border-violet-400 bg-violet-950/40 text-white shadow-[0_0_12px_rgba(167,139,250,0.3)]'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-black uppercase text-white truncate">{role.name}</span>
                      {isRoleSelected && <Check size={10} className="text-violet-400" />}
                    </div>
                    <span className="text-[8px] font-mono uppercase text-violet-300">[{role.id}]</span>
                    <p className="text-[10px] text-white/50 leading-tight mt-1 line-clamp-2">{role.roleDesc}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-white/10 text-[9px] font-mono">
                    {role.hpMod !== 0 && (
                      <span className={role.hpMod > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        HP {role.hpMod > 0 ? `+${role.hpMod}` : role.hpMod}
                      </span>
                    )}
                    {role.powerMod !== 0 && <span className="text-rose-400">ATK +{role.powerMod}</span>}
                    {role.defenseMod !== 0 && <span className="text-cyan-400">DEF +{role.defenseMod}</span>}
                    {role.magicMod !== 0 && <span className="text-violet-400">MAG +{role.magicMod}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeaponsPanel() {
  const { currentAvatar, updateAvatar, coins, unlockedItems, weaponLevels, unlockItem, upgradeWeapon } = useAvatarStore();
  const { add: addToast } = useToast();
  const selectedWeapon = currentAvatar.weapon || 'unarmed';

  const handleUnlockWeapon = (w: WeaponItem) => {
    const cost = w.cost ?? 0;
    if (coins >= cost) {
      const ok = unlockItem(w.id, cost);
      if (ok) {
        sound.playWin();
        updateAvatar({ weapon: w.id });
        addToast(`Unlocked and equipped ${w.name} for ${cost} Coins!`, 'success');
      }
    } else {
      sound.playImpact();
      addToast(`Requires ${cost} Coins (You have ${coins}). Win more Arena battles to earn coins!`, 'error');
    }
  };

  const handleUpgradeWeapon = (weaponId: string) => {
    const curLevel = weaponLevels[weaponId] || 1;
    const upgradeCost = curLevel * 100;
    if (coins >= upgradeCost) {
      const ok = upgradeWeapon(weaponId, upgradeCost);
      if (ok) {
        sound.playWin();
        addToast(`Upgraded weapon to Level ${curLevel + 1}! (+12 ATK, +6 DEF)`, 'success');
      }
    } else {
      sound.playImpact();
      addToast(`Requires ${upgradeCost} Coins for upgrade (You have ${coins}). Win battles to earn coins!`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {currentAvatar.species === 'fairy' && (
        <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center gap-2.5 text-xs text-pink-200">
          <Sparkles size={16} className="text-pink-400 flex-shrink-0" />
          <span><strong>Fairy Weapon Resonance:</strong> Due to fairy physiology and flight, heavy weapons are magically refined into celestial wands and ethereal starlight foci.</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/50 uppercase tracking-widest font-bold">Weapon Armory</p>
          <span className="text-[10px] font-mono text-amber-400">Battle & Upgrade</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {weapons.map((w) => {
            const isEquipped = selectedWeapon === w.id;
            const cost = w.cost ?? 0;
            const isUnlocked = cost === 0 || unlockedItems.includes(w.id);
            const level = weaponLevels[w.id] || 1;
            const upgradeCost = level * 100;

            return (
              <div
                key={w.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                  isEquipped
                    ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords size={16} className={isEquipped ? 'text-[#00FF66]' : 'text-white/60'} />
                    <span className="text-xs font-black uppercase text-white">{w.name}</span>
                    {isUnlocked && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Lv.{level}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {w.type}
                  </span>
                </div>

                <p className="text-[11px] text-white/60 leading-tight">{w.specialEffect}</p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-white/50">
                  {w.powerBonus > 0 && <span className="text-rose-400">ATK +{w.powerBonus + (level - 1) * 12}</span>}
                  {w.magicBonus > 0 && <span className="text-violet-400">MAG +{w.magicBonus}</span>}
                  {w.agilityBonus > 0 && <span className="text-amber-400">AGI +{w.agilityBonus}</span>}
                  {w.defenseBonus > 0 && <span className="text-cyan-400">DEF +{w.defenseBonus + (level - 1) * 6}</span>}
                </div>

                {/* Equip / Unlock / Upgrade Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  {isUnlocked ? (
                    <>
                      <button
                        onClick={() => {
                          sound.playEquip();
                          updateAvatar({ weapon: w.id });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          isEquipped
                            ? 'bg-[#00FF66] text-black font-extrabold'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isEquipped ? '✓ Equipped' : 'Equip Weapon'}
                      </button>

                      <button
                        onClick={() => handleUpgradeWeapon(w.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-mono font-bold uppercase transition-all"
                        title={`Upgrade for ${upgradeCost} Coins`}
                      >
                        <Hammer size={12} />
                        <span>Forge (+12 ATK) {upgradeCost} COINS</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUnlockWeapon(w)}
                      className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Unlock Weapon</span>
                      <span className="font-extrabold">({cost} Coins)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ColorPicker
        label="Weapon Energy Glow Color"
        value={currentAvatar.weaponColor || '#00FF66'}
        onChange={(c) => updateAvatar({ weaponColor: c })}
      />
    </div>
  );
}

function ColorsPanel() {
  const { currentAvatar, updateAvatar } = useAvatarStore();
  return (
    <div className="flex flex-col gap-8">
      <ColorPicker label="Hair Color" value={currentAvatar.hairColor} onChange={(c) => updateAvatar({ hairColor: c })} />
      <ColorPicker label="Top Color" value={currentAvatar.topColor} onChange={(c) => updateAvatar({ topColor: c })} />
      <ColorPicker label="Bottom Color" value={currentAvatar.bottomColor} onChange={(c) => updateAvatar({ bottomColor: c })} />
      <ColorPicker label="Shoe Color" value={currentAvatar.shoeColor} onChange={(c) => updateAvatar({ shoeColor: c })} />
      <ColorPicker label="Accessory Color" value={currentAvatar.accessoryColor} onChange={(c) => updateAvatar({ accessoryColor: c })} />
    </div>
  );
}

export function CustomizationPanel() {
  const { activeCategory, currentAvatar, updateAvatar } = useAvatarStore();

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            id={`category-panel-${activeCategory}`}
            role="tabpanel"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="p-4"
          >
            {activeCategory === 'species' && <SpeciesPanel />}

            {activeCategory === 'weapons' && <WeaponsPanel />}

            {activeCategory === 'body' && <BodyPanel />}

            {activeCategory === 'face' && <FacePanel />}

            {activeCategory === 'hair' && (
              <div className="grid grid-cols-3 gap-2">
                {hairStyles.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={currentAvatar.hair === item.id}
                    onSelect={(id) => updateAvatar({ hair: id, ...(item.color ? { hairColor: item.color } : {}) })}
                    accentColor={item.color || currentAvatar.hairColor}
                  />
                ))}
              </div>
            )}

            {activeCategory === 'tops' && (
              <div className="grid grid-cols-3 gap-2">
                {tops.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={currentAvatar.top === item.id}
                    onSelect={(id) => updateAvatar({ top: id, ...(item.color ? { topColor: item.color } : {}) })}
                    accentColor={item.color || currentAvatar.topColor}
                  />
                ))}
              </div>
            )}

            {activeCategory === 'bottoms' && (
              <div className="grid grid-cols-3 gap-2">
                {bottoms.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={currentAvatar.bottom === item.id}
                    onSelect={(id) => updateAvatar({ bottom: id, ...(item.color ? { bottomColor: item.color } : {}) })}
                    accentColor={item.color || currentAvatar.bottomColor}
                  />
                ))}
              </div>
            )}

            {activeCategory === 'shoes' && (
              <div className="grid grid-cols-3 gap-2">
                {shoes.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    selected={currentAvatar.shoes === item.id}
                    onSelect={(id) => updateAvatar({ shoes: id, ...(item.color ? { shoeColor: item.color } : {}) })}
                    accentColor={item.color || currentAvatar.shoeColor}
                  />
                ))}
              </div>
            )}

            {activeCategory === 'accessories' && <AccessoriesPanel />}

            {activeCategory === 'colors' && <ColorsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
