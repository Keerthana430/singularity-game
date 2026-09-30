'use client';
// components/studio/ColorPicker.tsx
import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Pipette } from 'lucide-react';
import { useAvatarStore } from '@/store/avatarStore';

const SWATCHES = [
  '#7C5CFF', '#22D3EE', '#FF5C93', '#FF6B35', '#FFD700', '#2ECC71',
  '#E74C3C', '#1A1A2E', '#FFFFFF', '#000000', '#8B4513', '#FF69B4',
  '#00CED1', '#4169E1', '#9B59B6', '#F39C12', '#1ABC9C', '#E67E22',
  '#2C3E50', '#ECF0F1', '#C0392B', '#16A085', '#8E44AD', '#27AE60',
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [hex, setHex] = useState(value);
  const { recentColors, addRecentColor } = useAvatarStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSwatch = useCallback((color: string) => {
    onChange(color);
    setHex(color);
    addRecentColor(color);
  }, [onChange, addRecentColor]);

  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      onChange(v);
      addRecentColor(v);
    }
  }, [onChange, addRecentColor]);

  const handleNativeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setHex(v);
    addRecentColor(v);
  }, [onChange, addRecentColor]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/50 uppercase tracking-widest">{label}</p>

      {/* Current color + hex input */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          aria-label="Open color picker"
          className="w-10 h-10 rounded-xl border border-white/20 flex-shrink-0 transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={handleNativeChange}
          className="sr-only"
          aria-label="Native color picker"
          id={`color-native-${label}`}
        />
        <div className="flex items-center gap-2 flex-1 glass-panel-light px-3 py-2">
          <span className="text-white/30 text-xs">#</span>
          <input
            type="text"
            value={hex.replace('#', '')}
            onChange={(e) => handleHexInput({ target: { value: '#' + e.target.value } } as React.ChangeEvent<HTMLInputElement>)}
            maxLength={6}
            placeholder="7C5CFF"
            className="flex-1 bg-transparent text-xs text-white/80 focus:outline-none font-mono uppercase"
            aria-label={`Hex color value for ${label}`}
          />
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: value }}
          />
        </div>
      </div>

      {/* Swatches grid */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Palette</p>
        <div className="grid grid-cols-8 gap-1.5">
          {SWATCHES.map((color) => (
            <button
              key={color}
              onClick={() => handleSwatch(color)}
              title={color}
              aria-label={`Select color ${color}`}
              className="w-6 h-6 rounded-lg border border-white/10 transition-all hover:scale-110 hover:border-white/40 relative flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              {value === color && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check size={10} className="text-white drop-shadow-md" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Recent</p>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.map((color) => (
              <button
                key={color}
                onClick={() => handleSwatch(color)}
                title={color}
                aria-label={`Recent color ${color}`}
                className="w-6 h-6 rounded-lg border border-white/10 transition-all hover:scale-110 relative"
                style={{ backgroundColor: color }}
              >
                {value === color && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check size={10} className="text-white drop-shadow-md" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
