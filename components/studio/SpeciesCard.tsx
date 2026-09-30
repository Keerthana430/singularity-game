'use client';

import React from 'react';
import { SpeciesData } from '@/data/species';
import {
  Crown,
  Sparkles,
  Wand2,
  Shield,
  Flame,
  Cpu,
  Orbit,
  Check,
  Zap,
} from 'lucide-react';

interface SpeciesCardProps {
  species: SpeciesData;
  isSelected: boolean;
  onSelect: () => void;
}

// Visual Crest Icon for the top card emblem (mirrors collectible tabletop cards)
function SpeciesCrestIcon({ id, color }: { id: string; color: string }) {
  const iconProps = { size: 14, style: { color } };
  switch (id) {
    case 'human':
      return <Crown {...iconProps} />;
    case 'elf':
      return <Sparkles {...iconProps} />;
    case 'fairy':
      return <Wand2 {...iconProps} />;
    case 'dwarf':
      return <Shield {...iconProps} />;
    case 'ogre':
      return <Flame {...iconProps} />;
    case 'robot':
      return <Cpu {...iconProps} />;
    case 'alien':
      return <Orbit {...iconProps} />;
    default:
      return <Crown {...iconProps} />;
  }
}

// Stylized Character Card Portrait Artwork (mirrors Cyra / tabletop card art)
function SpeciesCardArt({ id, accentColor }: { id: string; accentColor: string }) {
  return (
    <div
      className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-t-xl"
      style={{
        background: `radial-gradient(ellipse at 50% 35%, ${accentColor}33 0%, rgba(10,14,12,0.9) 75%, #050806 100%)`,
      }}
    >
      {/* Background ambient pattern/grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
          backgroundSize: '12px 12px',
        }}
      />

      {/* SVG Character Silhouette / Portrait */}
      {id === 'human' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_10px_rgba(0,255,102,0.4)]">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#00FF66" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <path d="M50 18 L58 34 L76 36 L62 48 L66 66 L50 56 L34 66 L38 48 L24 36 L42 34 Z" fill="#00FF66" fillOpacity="0.25" stroke="#00FF66" strokeWidth="1.5" />
          <circle cx="50" cy="38" r="12" fill="#00FF66" fillOpacity="0.8" />
          <path d="M30 76 Q50 60 70 76" stroke="#00FF66" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M42 37 L58 37" stroke="#041208" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}

      {id === 'elf' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_10px_rgba(56,189,248,0.5)]">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.3" />
          {/* Elven crescent moon & pointed ears silhouette */}
          <path d="M32 38 Q22 28 20 22 Q28 26 34 34 Z" fill="#38BDF8" />
          <path d="M68 38 Q78 28 80 22 Q72 26 66 34 Z" fill="#38BDF8" />
          <ellipse cx="50" cy="40" rx="14" ry="17" fill="#38BDF8" fillOpacity="0.85" />
          <path d="M36 68 Q50 54 64 68" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
          <circle cx="50" cy="24" r="3" fill="#BAE6FD" />
          <path d="M40 38 Q50 44 60 38" stroke="#082f49" strokeWidth="1.5" fill="none" />
        </svg>
      )}

      {id === 'fairy' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_12px_rgba(244,63,94,0.6)]">
          {/* Luminous fairy wings */}
          <path d="M48 45 C30 18 10 25 18 50 C24 62 44 54 48 48 Z" fill="#F43F5E" fillOpacity="0.6" stroke="#FDA4AF" strokeWidth="1" />
          <path d="M52 45 C70 18 90 25 82 50 C76 62 56 54 52 48 Z" fill="#F43F5E" fillOpacity="0.6" stroke="#FDA4AF" strokeWidth="1" />
          <ellipse cx="50" cy="48" rx="8" ry="12" fill="#F43F5E" />
          <circle cx="50" cy="32" r="7" fill="#FFE4E6" />
          <circle cx="50" cy="21" r="2.5" fill="#FFF" />
          <path d="M46 32 L54 32" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {id === 'dwarf' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]">
          {/* Heavy runic helm & shield */}
          <path d="M30 35 L50 20 L70 35 L68 55 L50 62 L32 55 Z" fill="#F59E0B" fillOpacity="0.8" stroke="#FDE68A" strokeWidth="1.5" />
          {/* Iron horns */}
          <path d="M30 35 Q18 28 16 18 Q26 24 34 32" fill="#F59E0B" />
          <path d="M70 35 Q82 28 84 18 Q74 24 66 32" fill="#F59E0B" />
          {/* Braided beard */}
          <path d="M36 50 Q50 78 64 50 Q50 68 36 50 Z" fill="#D97706" />
          <rect x="42" y="38" width="16" height="4" rx="2" fill="#451A03" />
        </svg>
      )}

      {id === 'ogre' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_10px_rgba(234,179,8,0.5)]">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#EAB308" strokeWidth="1" strokeDasharray="4 2" opacity="0.3" />
          <ellipse cx="50" cy="42" rx="19" ry="16" fill="#EAB308" fillOpacity="0.85" />
          <path d="M36 32 L34 22 L40 28" fill="#FEF08A" stroke="#713F12" strokeWidth="1" />
          <path d="M64 32 L66 22 L60 28" fill="#FEF08A" stroke="#713F12" strokeWidth="1" />
          {/* Tusks */}
          <path d="M42 50 L40 43 L44 48" fill="#FEF08A" />
          <path d="M58 50 L60 43 L56 48" fill="#FEF08A" />
          <path d="M24 74 Q50 56 76 74" stroke="#EAB308" strokeWidth="4" fill="none" />
        </svg>
      )}

      {id === 'robot' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)]">
          {/* Chassis head & optic beam */}
          <rect x="34" y="28" width="32" height="28" rx="6" fill="#10B981" fillOpacity="0.85" stroke="#A7F3D0" strokeWidth="1.5" />
          <line x1="50" y1="28" x2="50" y2="18" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="50" cy="16" r="3" fill="#34D399" />
          <rect x="39" y="38" width="22" height="6" rx="2" fill="#064E3B" />
          <rect x="42" y="39.5" width="16" height="3" rx="1.5" fill="#34D399" />
          <path d="M28 72 L36 60 L64 60 L72 72 Z" fill="#10B981" fillOpacity="0.6" stroke="#A7F3D0" strokeWidth="1" />
        </svg>
      )}

      {id === 'alien' && (
        <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-[0_4px_12px_rgba(236,72,153,0.5)]">
          {/* Slender psionic alien head & cosmic ring */}
          <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#EC4899" strokeWidth="1.5" transform="rotate(-25 50 50)" opacity="0.4" />
          <path d="M34 32 C30 18 70 18 66 32 C62 46 54 58 50 58 C46 58 38 46 34 32 Z" fill="#EC4899" fillOpacity="0.85" stroke="#FBCFE8" strokeWidth="1" />
          <ellipse cx="42" cy="34" rx="4" ry="7" fill="#831843" transform="rotate(-15 42 34)" />
          <ellipse cx="58" cy="34" rx="4" ry="7" fill="#831843" transform="rotate(15 58 34)" />
          <circle cx="50" cy="24" r="2.5" fill="#F472B6" />
        </svg>
      )}

      {/* Subtle bottom vignette gradient to blend seamlessly into card body */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#080d09] to-transparent pointer-events-none" />
    </div>
  );
}

export function SpeciesCard({ species, isSelected, onSelect }: SpeciesCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`group relative text-left rounded-2xl flex flex-col transition-all duration-200 overflow-hidden cursor-pointer select-none ${
        isSelected
          ? 'scale-[1.02] shadow-[0_0_20px_rgba(0,255,102,0.3)]'
          : 'hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        background: isSelected ? '#0a140d' : '#080d0a',
        border: isSelected
          ? `2px solid ${species.accentColor}`
          : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* ── TOP HEADER / CREST EMBLEM ── */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-md shadow-md"
          style={{
            backgroundColor: `${species.accentColor}25`,
            borderColor: `${species.accentColor}60`,
          }}
        >
          <SpeciesCrestIcon id={species.id} color={species.accentColor} />
          <span
            className="text-[10px] font-mono font-black uppercase tracking-wider"
            style={{ color: species.accentColor }}
          >
            {species.name}
          </span>
        </div>

        {isSelected ? (
          <span className="w-5 h-5 rounded-full bg-[#00FF66] text-black flex items-center justify-center shadow-[0_0_8px_#00FF66]">
            <Check size={12} className="stroke-[3]" />
          </span>
        ) : (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white/50 border border-white/10 uppercase">
            {species.roles.length} ROLES
          </span>
        )}
      </div>

      {/* ── CARD HERO ARTWORK ── */}
      <SpeciesCardArt id={species.id} accentColor={species.accentColor} />

      {/* ── CARD BODY / BANNER ── */}
      <div className="p-3 flex-1 flex flex-col justify-between bg-[#070b08]/95 border-t border-white/5">
        <div>
          <div className="flex items-baseline justify-between mb-0.5">
            <h3
              className="text-xs font-black uppercase tracking-wider text-white group-hover:text-[#00FF66] transition-colors"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {species.name}
            </h3>
            <span className="text-[9px] font-mono text-white/50 truncate max-w-[100px]">
              {species.domain.split('&')[0]}
            </span>
          </div>

          <p className="text-[10px] text-white/60 line-clamp-1 leading-snug">
            {species.title}
          </p>

          {/* Innate Perk Badge */}
          <div
            className="mt-2 px-2 py-1 rounded-lg border text-[9px] font-medium flex items-center gap-1 leading-tight"
            style={{
              borderColor: `${species.accentColor}35`,
              backgroundColor: `${species.accentColor}12`,
            }}
          >
            <Zap size={10} className="shrink-0" style={{ color: species.accentColor }} />
            <span className="text-white/90 truncate font-sans">
              {species.innateBuff.replace('Innate Buff: ', '')}
            </span>
          </div>
        </div>

        {/* ── CARD FOOTER STAT METERS ── */}
        <div className="grid grid-cols-5 gap-1 pt-2.5 mt-2.5 border-t border-white/10 text-[9px] font-mono text-center">
          <div className="bg-white/5 rounded py-0.5">
            <span className="text-white/40 block text-[8px]">HP</span>
            <span className="font-bold text-emerald-400">{species.baseHp}</span>
          </div>
          <div className="bg-white/5 rounded py-0.5">
            <span className="text-white/40 block text-[8px]">ATK</span>
            <span className="font-bold text-rose-400">{species.basePower}</span>
          </div>
          <div className="bg-white/5 rounded py-0.5">
            <span className="text-white/40 block text-[8px]">DEF</span>
            <span className="font-bold text-cyan-400">{species.baseDefense}</span>
          </div>
          <div className="bg-white/5 rounded py-0.5">
            <span className="text-white/40 block text-[8px]">AGI</span>
            <span className="font-bold text-amber-400">{species.baseAgility}</span>
          </div>
          <div className="bg-white/5 rounded py-0.5">
            <span className="text-white/40 block text-[8px]">MAG</span>
            <span className="font-bold text-violet-400">{species.baseMagic}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
