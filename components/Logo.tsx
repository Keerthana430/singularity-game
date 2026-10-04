'use client';
// components/Logo.tsx
import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function Logo({ size = 'md', showSubtitle = false }: LogoProps) {
  const sizeMap = {
    sm: { orb: 26, text: 'text-base', sub: 'text-[9px]' },
    md: { orb: 34, text: 'text-lg', sub: 'text-[10px]' },
    lg: { orb: 50, text: 'text-2xl', sub: 'text-xs' },
  };
  const s = sizeMap[size];

  return (
    <Link href="/" className="flex items-center gap-3 group select-none" aria-label="Singularity Avatar Builder Home">
      {/* Neon Cyber Orb Icon */}
      <div className="relative flex-shrink-0" style={{ width: s.orb, height: s.orb }}>
        <svg
          width={s.orb}
          height={s.orb}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="orb-core-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="60%" stopColor="#021405" />
              <stop offset="100%" stopColor="#05260C" />
            </radialGradient>
            <radialGradient id="orb-glow-green" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00FF66" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ring-grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FF66" />
              <stop offset="50%" stopColor="#39FF14" />
              <stop offset="100%" stopColor="#008F39" />
            </linearGradient>
            <filter id="orb-bloom-green">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer green glow */}
          <circle cx="24" cy="24" r="22" fill="url(#orb-glow-green)" />
          {/* Core */}
          <circle cx="24" cy="24" r="15" fill="url(#orb-core-green)" stroke="#00FF66" strokeWidth="1" />
          {/* Outer rotating-style ring */}
          <circle cx="24" cy="24" r="20" stroke="url(#ring-grad-green)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Dashed radar ring */}
          <circle cx="24" cy="24" r="17" stroke="rgba(0,255,102,0.4)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
          {/* Center singularity neon dot */}
          <circle cx="24" cy="24" r="3.5" fill="#00FF66" filter="url(#orb-bloom-green)" />
          <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />
          {/* Cyber bracket accents */}
          <path d="M 24 8 A 16 16 0 0 1 40 24" stroke="#00FF66" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 24 40 A 16 16 0 0 1 8 24" stroke="#39FF14" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-[0.22em] uppercase ${s.text} text-[#F0F4F1] group-hover:text-[#00FF66] transition-colors drop-shadow-[0_0_12px_rgba(0,255,102,0.4)]`}
          style={{ fontFamily: 'var(--font-display, "Orbitron", sans-serif)' }}
        >
          SINGULARITY
        </span>
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`${s.sub} tracking-[0.20em] uppercase text-[#00FF66] font-bold`}
              style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
            >
              OS // SYSTEM
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
