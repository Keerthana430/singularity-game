'use client';
// components/snakes/Snakes3DView.tsx
// Dynamic SSR-safe wrapper for Snakes3DCanvas

import React from 'react';
import dynamic from 'next/dynamic';
import { Snakes3DCanvasProps } from './Snakes3DCanvas';

const Snakes3DCanvas = dynamic(
  () => import('./Snakes3DCanvas').then((m) => ({ default: m.Snakes3DCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#020502] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-14 h-14 border-4 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin shadow-[0_0_25px_rgba(0,255,102,0.6)]" />
        <div className="text-center">
          <p className="text-sm font-black text-white tracking-widest uppercase">
            // CALIBRATING 3D MOUNTAIN ARENA...
          </p>
          <p className="text-xs text-[#00FF66]/70 mt-1">
            Synthesizing 40 obsidian platforms, neon cyber-ladders & bio-serpents
          </p>
        </div>
      </div>
    ),
  }
);

export function Snakes3DView(props: Snakes3DCanvasProps) {
  return <Snakes3DCanvas {...props} />;
}
