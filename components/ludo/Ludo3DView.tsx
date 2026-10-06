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
      <div className="w-full h-full bg-[#040711] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-14 h-14 border-4 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin shadow-[0_0_25px_rgba(0,255,102,0.4)]" />
        <div className="text-center">
          <p className="text-sm font-bold text-white tracking-widest uppercase">
            // INITIALIZING OBSIDIAN COLOSSEUM MATRIX...
          </p>
          <p className="text-xs text-[#00FF66]/70 mt-1">
            Calibrating quantum conduits &amp; deploying faction avatars
          </p>
        </div>
      </div>
    ),
  }
);

import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

export function Ludo3DView(props: Ludo3DColosseumProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-[#040711] flex flex-col items-center justify-center gap-4 font-mono">
        <div className="w-14 h-14 border-4 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin shadow-[0_0_25px_rgba(0,255,102,0.4)]" />
        <div className="text-center">
          <p className="text-sm font-black text-white tracking-widest uppercase">
            // PREPARING COLOSSEUM PLATFORM...
          </p>
          <p className="text-xs text-[#00FF66]/70 mt-1">
            Activating nanotech chassis &amp; faction citadels
          </p>
        </div>
      </div>
    );
  }

  return (
    <WebGLErrorBoundary fallbackTitle="Ludo Cyber Colosseum Offline">
      <Ludo3DColosseum {...props} />
    </WebGLErrorBoundary>
  );
}
