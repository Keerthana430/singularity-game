// components/dungeon/fps/HotbarInventoryHUD.tsx
// Hotbar Inventory Slots inspired by classic survival FPS layout (Minecraft-style bottom-center hotbar)

import React from 'react';
import {
  Crosshair,
  Heart,
  Shield,
  Zap,
  Sparkles,
  Package,
  Layers,
  CircleDot,
  Flame,
} from 'lucide-react';
import { InventorySlot, SurvivalItem, ItemRarity } from './types';

interface HotbarInventoryHUDProps {
  slots: InventorySlot[];
  activeSlotIndex: number;
  onSelectSlot: (index: number) => void;
  onUseItem?: (index: number) => void;
}

const RARITY_COLORS: Record<ItemRarity, { border: string; glow: string; text: string }> = {
  common: { border: '#38BDF8', glow: 'rgba(56,189,248,0.25)', text: 'text-cyan-400' },
  rare: { border: '#00FF66', glow: 'rgba(0,255,102,0.3)', text: 'text-[#00FF66]' },
  epic: { border: '#C084FC', glow: 'rgba(192,132,252,0.35)', text: 'text-purple-400' },
  legendary: { border: '#F59E0B', glow: 'rgba(245,158,11,0.4)', text: 'text-amber-400' },
  mythic: { border: '#FB7185', glow: 'rgba(251,113,133,0.45)', text: 'text-rose-400' },
};

function renderItemIcon(item: SurvivalItem) {
  const iconSize = 22;
  switch (item.icon) {
    case 'rifle':
    case 'shotgun':
    case 'pistol':
    case 'railgun':
      return <Crosshair size={iconSize} className="stroke-[2.2]" style={{ color: item.color }} />;
    case 'medkit':
      return <Heart size={iconSize} className="stroke-[2.2] text-emerald-400 fill-emerald-400/20" />;
    case 'shield':
      return <Shield size={iconSize} className="stroke-[2.2] text-cyan-400 fill-cyan-400/20" />;
    case 'ammo':
      return <Package size={iconSize} className="stroke-[2.2] text-amber-400" />;
    case 'stim':
      return <Flame size={iconSize} className="stroke-[2.2] text-rose-400 fill-rose-400/20" />;
    case 'relic':
      return <Sparkles size={iconSize} className="stroke-[2.2] text-purple-400" />;
    default:
      return <CircleDot size={iconSize} style={{ color: item.color }} />;
  }
}

export function HotbarInventoryHUD({
  slots,
  activeSlotIndex,
  onSelectSlot,
  onUseItem,
}: HotbarInventoryHUDProps) {
  const activeItem = slots[activeSlotIndex]?.item;

  return (
    <div className="flex flex-col items-center select-none pointer-events-auto">
      {/* Active Item Description Sub-Bar */}
      {activeItem && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/85 px-3 py-1 backdrop-blur-md shadow-lg animate-fadeIn">
          <span className={`text-[10px] font-black uppercase tracking-wider ${RARITY_COLORS[activeItem.rarity].text}`}>
            [{activeItem.rarity.toUpperCase()}]
          </span>
          <span className="text-xs font-bold text-white uppercase">{activeItem.name}</span>
          <span className="text-white/40 text-[10px] hidden sm:inline">· {activeItem.description}</span>
          {activeItem.kind === 'consumable' && (
            <span className="rounded bg-[#00FF66]/20 border border-[#00FF66]/50 px-1.5 py-0.5 text-[9px] font-bold text-[#00FF66]">
              [R-CLICK / Q TO USE]
            </span>
          )}
        </div>
      )}

      {/* ─── 5-SLOT HOTBAR CONTAINER (Minecraft / FPS Style) ─────────────── */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/85 p-2 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
        {slots.map((slot, i) => {
          const isActive = activeSlotIndex === i;
          const item = slot.item;
          const rarityConf = item ? RARITY_COLORS[item.rarity] : null;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectSlot(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (item?.kind === 'consumable') onUseItem?.(i);
              }}
              className={`relative flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center rounded-xl border transition-all duration-100 ${
                isActive
                  ? 'scale-105 border-[#00FF66] bg-[#00FF66]/15 shadow-[0_0_20px_rgba(0,255,102,0.4)] ring-2 ring-[#00FF66]/50'
                  : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.08]'
              }`}
              style={
                item && rarityConf && !isActive
                  ? { borderColor: `${rarityConf.border}55`, boxShadow: `inset 0 0 12px ${rarityConf.glow}` }
                  : undefined
              }
            >
              {/* Slot Number Badge (Top-Left) */}
              <span
                className={`absolute top-1 left-1.5 text-[9px] font-mono font-bold ${
                  isActive ? 'text-[#00FF66]' : 'text-white/40'
                }`}
              >
                {i + 1}
              </span>

              {/* Item Visual Icon */}
              {item ? (
                <div className="flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {renderItemIcon(item)}
                </div>
              ) : (
                <div className="h-2 w-2 rounded-full bg-white/10" />
              )}

              {/* Quantity / Stack Badge (Bottom-Right) */}
              {item?.quantity && item.quantity > 1 && (
                <span className="absolute bottom-1 right-1.5 text-[10px] font-mono font-black text-white bg-black/60 px-1 rounded">
                  x{item.quantity}
                </span>
              )}

              {/* Kind Micro-Indicator */}
              {item && (
                <span
                  className="absolute bottom-1 left-1.5 text-[7px] font-mono font-black uppercase tracking-tighter"
                  style={{ color: item.color }}
                >
                  {item.kind.slice(0, 3)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
