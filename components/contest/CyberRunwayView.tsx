'use client';
// components/contest/CyberRunwayView.tsx
// Dynamic SSR-safe wrapper for CyberRunway3D

import React from 'react';
import dynamic from 'next/dynamic';
import { CyberRunwayProps } from './CyberRunway3D';

const CyberRunway3D = dynamic(
  () => import('./CyberRunway3D').then((m) => ({ default: m.CyberRunway3D })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#020406] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-14 h-14 border-4 border-[#FF007F]/20 border-t-[#FF007F] rounded-full animate-spin shadow-[0_0_25px_rgba(255,0,127,0.6)]" />
        <div className="text-center">
          <p className="text-sm font-black text-white tracking-widest uppercase">
            // INITIALIZING CYBERPUNK RUNWAY...
          </p>
          <p className="text-xs text-[#FF007F]/70 mt-1">
            Focusing holographic spotlights & staging haute couture
          </p>
        </div>
      </div>
    ),
  }
);

import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

export function CyberRunwayView(props: CyberRunwayProps) {
  return (
    <WebGLErrorBoundary fallbackTitle="Cyber Runway Hologram Offline">
      <CyberRunway3D {...props} />
    </WebGLErrorBoundary>
  );
}
