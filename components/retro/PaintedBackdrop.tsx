'use client';
// components/retro/PaintedBackdrop.tsx
// Authentic 1980s/1990s Anime Painted Backdrop:
// Cozy Space Station Lounge Window overlooking a Swirling Cosmic Nebula & Turquoise Planet

import React from 'react';

export function PaintedBackdropSample() {
  return (
    <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
      {/* 1. Painted Deep-Space Nebula Canvas */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 65% 55% at 75% 25%, rgba(217, 70, 239, 0.45) 0%, transparent 60%),
            radial-gradient(ellipse 55% 45% at 30% 70%, rgba(255, 107, 53, 0.4) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 85% 85%, rgba(255, 199, 0, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.35) 0%, transparent 50%),
            linear-gradient(135deg, #0D1124 0%, #151A38 50%, #1A1838 100%)
          `,
        }}
      />

      {/* 2. Painted Crescent Planet with Glowing Dawn Terminator */}
      <div
        className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 70% 30%, 
              #38BDF8 0%, 
              #0284C7 35%, 
              #0F172A 70%, 
              #070A14 100%
            )
          `,
          boxShadow: '0 0 50px rgba(56, 189, 248, 0.4), inset -10px -10px 40px rgba(0,0,0,0.9)',
        }}
      >
        {/* Warm Golden City Lights on the Nightside */}
        <div
          className="absolute inset-0 rounded-full opacity-60 mix-blend-screen"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 45% 65%, #FFAA00, transparent),
              radial-gradient(1.5px 1.5px at 52% 72%, #FF8800, transparent),
              radial-gradient(1px 1px at 38% 58%, #FFD700, transparent),
              radial-gradient(2px 2px at 60% 80%, #FFAA00, transparent)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* 3. Star Dust & Asteroid Silhouettes */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 15% 15%, #FFF5EA, transparent),
            radial-gradient(2px 2px at 65% 35%, #FDE68A, transparent),
            radial-gradient(1.5px 1.5px at 85% 20%, #A5B4FC, transparent),
            radial-gradient(2px 2px at 40% 45%, #FECDD3, transparent)
          `,
          backgroundSize: '150px 150px',
        }}
      />

      {/* 4. Rounded Cozy Station Lounge Window Frame (Station Interior) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top/Side Curved Frame */}
        <div className="absolute inset-0 border-[14px] border-[#202742] rounded-2xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
        {/* Brass Rivets on Frame */}
        <div className="absolute top-2 left-6 w-2 h-2 rounded-full bg-[#FFC700]/70 border border-[#B45309]" />
        <div className="absolute top-2 right-6 w-2 h-2 rounded-full bg-[#FFC700]/70 border border-[#B45309]" />
        <div className="absolute bottom-2 left-6 w-2 h-2 rounded-full bg-[#FFC700]/70 border border-[#B45309]" />
        <div className="absolute bottom-2 right-6 w-2 h-2 rounded-full bg-[#FFC700]/70 border border-[#B45309]" />
      </div>

      {/* 5. Cozy Warm Practical Lantern & Steaming Mug on the Sill */}
      <div className="absolute bottom-4 right-8 flex items-center gap-3 bg-[#181D33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
        <div className="w-3 h-3 rounded-full bg-[#FF9E3B] animate-pulse shadow-[0_0_10px_#FF9E3B]" />
        <span className="text-[11px] font-bold text-[#FFF8EE] tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
          ORBITAL LOUNGE // SECTOR 03
        </span>
      </div>

      {/* 6. Subtle 80s/90s Film Cel Grain */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 248, 238, 0.05) 3px,
              transparent 4px
            )
          `,
        }}
      />
    </div>
  );
}
