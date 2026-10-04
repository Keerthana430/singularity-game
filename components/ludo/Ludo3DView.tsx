'use client';
// components/ludo/Ludo3DView.tsx
// Dynamic SSR-safe wrapper for 3D Ludo Pirate Island Platform

import React from 'react';
import dynamic from 'next/dynamic';

const Ludo3DColosseum = dynamic(
  () => import('./Ludo3DColosseum').then((m) => ({ default: m.Ludo3DColosseum })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#020502] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-14 h-14 border-4 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin shadow-[0_0_25px_rgba(0,255,102,0.6)]" />
        <div className="text-center">
          <p className="text-sm font-black text-white tracking-widest uppercase">
            // INITIALIZING 3D COLOSSEUM...
          </p>
          <p className="text-xs text-[#00FF66]/60 mt-1">
            Constructing obsidian board, deploying avatars
          </p>
        </div>
      </div>
    ),
  }
);

import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

export function Ludo3DView(props: any) {
  return (
    <WebGLErrorBoundary fallbackTitle="Ludo Cyber Colosseum Offline">
      <Ludo3DColosseum {...props} />
    </WebGLErrorBoundary>
  );
}
