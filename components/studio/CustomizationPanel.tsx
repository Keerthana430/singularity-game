'use client';
// components/studio/CustomizationPanel.tsx
// Right panel: renders the appropriate controls for the active category.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarStore } from '@/store/avatarStore';
import { ItemCard } from './ItemCard';
import { ColorPicker } from './ColorPicker';
import { StatsPreviewCard } from './StatsPreviewCard';
import { hairStyles } from '@/data/hairStyles';
import { tops } from '@/data/tops';
import { bottoms } from '@/data/bottoms';
import { shoes } from '@/data/shoes';
import { accessories } from '@/data/accessories';
import { faceShapes, eyeStyles, expressionStyles, skinTones } from '@/data/faces';
import { SPECIES_LIST, SpeciesData } from '@/data/species';
import { weapons, WeaponItem } from '@/data/weapons';
import { Zap, Shield, Flame, Wind, Sparkles, Swords, Check } from 'lucide-react';

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
                onSelect={(id) => updateAccessories({ [slot.key]: id })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SpeciesPanel() {
  const { currentAvatar, updateAvatar } = useAvatarStore();
  const selectedSpecies = SPECIES_LIST.find((s) => s.id === (currentAvatar.species || 'human')) || SPECIES_LIST[0];

  return (
    <div className="flex flex-col gap-6">
      <StatsPreviewCard config={currentAvatar} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/50 uppercase tracking-widest">Choose Species (6 Innate Races)</p>
          <span className="text-[10px] text-[#00FF66] font-mono">Specialized Domains</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {SPECIES_LIST.map((sp) => {
            const isSelected = (currentAvatar.species || 'human') === sp.id;
            return (
              <button
                key={sp.id}
                onClick={() => {
                  useAvatarStore.getState().updateAvatar({
                    species: sp.id,
                    skinTone: sp.defaultSkinTone,
                    classRole: sp.roles[0].id,
                  });
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sp.accentColor }}
                    />
                    <span className="text-sm font-black text-white">{sp.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {sp.domain}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#00FF66] text-black flex items-center justify-center">
                      <Check size={12} className="stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/60 mt-1">{sp.tagline}</p>

                <div
                  className="mt-2.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1.5"
                  style={{
                    borderColor: `${sp.accentColor}30`,
                    backgroundColor: `${sp.accentColor}10`,
                  }}
                >
                  <Zap size={12} style={{ color: sp.accentColor }} />
                  <span className="text-white/90">
                    <strong>Buff: </strong>{sp.innateBuff}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/40">
                  <span>HP: {sp.baseHp}</span>
                  <span>ATK: {sp.basePower}</span>
                  <span>AGI: {sp.baseAgility}</span>
                  <span>DEF: {sp.baseDefense}</span>
                  <span>MAG: {sp.baseMagic}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Choice: Class Roles for chosen species */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-white/50 uppercase tracking-widest">
            {selectedSpecies.name} Sub-Class Specialization
          </p>
          <span className="text-[10px] text-violet-400 font-mono">Role Archetype</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectedSpecies.roles.map((role) => {
            const isRoleSelected = (currentAvatar.classRole || selectedSpecies.roles[0].id) === role.id;
            return (
              <button
                key={role.id}
                onClick={() => updateAvatar({ classRole: role.id })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isRoleSelected
                    ? 'border-violet-400 bg-violet-600/20 text-white shadow-[0_0_12px_rgba(124,92,255,0.25)]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-white">{role.name}</span>
                    <span className="text-[10px] font-mono uppercase text-violet-300">[{role.id}]</span>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1 leading-tight">{role.roleDesc}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/10 text-[10px] font-mono">
                  {role.hpMod !== 0 && (
                    <span className={role.hpMod > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      HP {role.hpMod > 0 ? `+${role.hpMod}` : role.hpMod}
                    </span>
                  )}
                  {role.powerMod !== 0 && (
                    <span className="text-rose-400">ATK +{role.powerMod}</span>
                  )}
                  {role.defenseMod !== 0 && (
                    <span className="text-cyan-400">DEF +{role.defenseMod}</span>
                  )}
                  {role.agilityMod !== 0 && (
                    <span className={role.agilityMod > 0 ? 'text-amber-400' : 'text-rose-400'}>
                      AGI {role.agilityMod > 0 ? `+${role.agilityMod}` : role.agilityMod}
                    </span>
                  )}
                  {role.magicMod !== 0 && (
                    <span className="text-violet-400">MAG +{role.magicMod}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeaponsPanel() {
  const { currentAvatar, updateAvatar } = useAvatarStore();
  const selectedWeapon = currentAvatar.weapon || 'unarmed';

  return (
    <div className="flex flex-col gap-6">
      <StatsPreviewCard config={currentAvatar} />

      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Equipped Weapon</p>
        <div className="grid grid-cols-1 gap-2.5">
          {weapons.map((w) => {
            const isSelected = selectedWeapon === w.id;
            return (
              <button
                key={w.id}
                onClick={() => updateAvatar({ weapon: w.id })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords size={15} className="text-[#00FF66]" />
                    <span className="text-xs font-black uppercase text-white">{w.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {w.type}
                  </span>
                </div>

                <p className="text-[11px] text-white/60 mt-1">{w.specialEffect}</p>

                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/50">
                  {w.powerBonus > 0 && <span className="text-rose-400">ATK +{w.powerBonus}</span>}
                  {w.magicBonus > 0 && <span className="text-violet-400">MAG +{w.magicBonus}</span>}
                  {w.agilityBonus > 0 && <span className="text-amber-400">AGI +{w.agilityBonus}</span>}
                  {w.defenseBonus > 0 && <span className="text-cyan-400">DEF +{w.defenseBonus}</span>}
                </div>
              </button>
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
    <AnimatePresence mode="wait">
      <motion.div
        key={activeCategory}
        id={`category-panel-${activeCategory}`}
        role="tabpanel"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="h-full overflow-y-auto p-4"
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
                onSelect={(id) => updateAvatar({ hair: id })}
                accentColor={currentAvatar.hairColor}
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
                onSelect={(id) => updateAvatar({ top: id })}
                accentColor={currentAvatar.topColor}
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
                onSelect={(id) => updateAvatar({ bottom: id })}
                accentColor={currentAvatar.bottomColor}
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
                onSelect={(id) => updateAvatar({ shoes: id })}
                accentColor={currentAvatar.shoeColor}
              />
            ))}
          </div>
        )}

        {activeCategory === 'accessories' && <AccessoriesPanel />}

        {activeCategory === 'colors' && <ColorsPanel />}
      </motion.div>
    </AnimatePresence>
  );
}
