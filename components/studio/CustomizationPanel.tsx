'use client';
// components/studio/CustomizationPanel.tsx
// Right panel: renders the appropriate controls for the active category.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarStore } from '@/store/avatarStore';
import { ItemCard } from './ItemCard';
import { ColorPicker } from './ColorPicker';
import { hairStyles } from '@/data/hairStyles';
import { tops } from '@/data/tops';
import { bottoms } from '@/data/bottoms';
import { shoes } from '@/data/shoes';
import { accessories } from '@/data/accessories';
import { faceShapes, eyeStyles, expressionStyles, skinTones } from '@/data/faces';

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
    { key: 'head' as const, label: 'Head', items: accessories.filter((a) => ['glasses', 'hat', 'cap', 'headphones', 'crown'].includes(a.id)) },
    { key: 'face' as const, label: 'Face', items: accessories.filter((a) => ['mask', 'visor'].includes(a.id)) },
    { key: 'back' as const, label: 'Back', items: accessories.filter((a) => ['backpack', 'wings', 'jetpack'].includes(a.id)) },
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
