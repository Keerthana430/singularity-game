'use client';
// components/ludo/Ludo3DView.tsx
// Dynamic SSR-safe wrapper for 3D Ludo Pirate Island Platform

import React from 'react';
import dynamic from 'next/dynamic';
import { Ludo3DColosseumProps } from './Ludo3DColosseum';

const Ludo3DColosseum = dynamic(
  () => import('./Ludo3DColosseum').then((m) => ({ default: m.Ludo3DColosseum })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#101426] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-14 h-14 border-4 border-[#FF9E3B]/20 border-t-[#FF9E3B] rounded-full animate-spin shadow-[0_0_25px_rgba(255,158,59,0.4)]" />
        <div className="text-center">
          <p className="text-sm font-bold text-[#FFF8EE] tracking-widest uppercase">
            // PREPARING STATION LOUNGE TABLE...
          </p>
          <p className="text-xs text-[#FF9E3B]/70 mt-1">
            Setting felt surface, placing faction tokens
          </p>
        </div>
      </div>
    ),
  }
);

import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

export function Ludo3DView(props: Ludo3DColosseumProps) {
  return (
    <WebGLErrorBoundary fallbackTitle="Ludo Cyber Colosseum Offline">
      <Ludo3DColosseum {...props} />
    </WebGLErrorBoundary>
  );
}
