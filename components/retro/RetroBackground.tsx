'use client';
// components/retro/RetroBackground.tsx
// Warm 80s/90s Retro-Anime Space Atmosphere: Cosmic Deep Blues, Swirling Nebulae, Warm Station Practical Lights

import React, { useEffect, useState } from 'react';

export function RetroBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 1. Deep Cosmic Space Navy & Saturated Nebula Atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 70% at 75% 15%, rgba(168, 85, 247, 0.16) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 20% 85%, rgba(255, 107, 53, 0.12) 0%, transparent 55%),
            radial-gradient(ellipse 90% 60% at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 65%),
            radial-gradient(circle at 85% 75%, rgba(255, 199, 0, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, #0E1222 0%, #12162B 50%, #151A33 100%)
          `,
        }}
      />

      {/* 2. Distant Twinkling Anime Stars (Round Soft Dots) */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 20px 30px, #FFF5EA, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 90px 140px, #FFE4B5, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 150px 70px, #93C5FD, rgba(0,0,0,0)),
            radial-gradient(2.5px 2.5px at 220px 190px, #FFD1DC, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 310px 110px, #FFF5EA, rgba(0,0,0,0)),
            radial-gradient(2px 2px at 380px 240px, #FDE68A, rgba(0,0,0,0))
          `,
          backgroundSize: '400px 320px',
        }}
      />

      {/* 3. Glowing Orbital Atmospheric Aurora Arc */}
      <div
        className="absolute -bottom-[35vh] -left-[10vw] w-[120vw] h-[60vh] rounded-[100%] opacity-[0.25]"
        style={{
          background: 'linear-gradient(to top, rgba(56, 189, 248, 0.28) 0%, rgba(168, 85, 247, 0.15) 45%, transparent 80%)',
          filter: 'blur(30px)',
        }}
      />

      {/* 4. Warm Station Cabin / Observation Deck Lantern Accents */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.20]"
        style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(255, 158, 59, 0.4) 0%, rgba(255, 102, 51, 0.1) 45%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* 5. Subtle Retro 80s/90s Film Scanline & Grain Warmth */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 248, 238, 0.04) 3px,
              transparent 4px
            )
          `,
        }}
      />

      {/* 6. Station Telemetry Watermark (Flavor text) */}
      <div className="absolute bottom-4 left-6 hidden md:flex items-center gap-3 text-[10px] font-mono text-[#8F97B0]/40 tracking-wider select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF9E3B] animate-pulse" />
        <span>ORBITAL SECTOR 04 // OBSERVATION DECK</span>
        <span>•</span>
        <span className="text-[#00FF66]/50">SINGULARITY NET OK</span>
      </div>
    </div>
  );
}
