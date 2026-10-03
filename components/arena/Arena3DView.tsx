'use client';
// components/arena/Arena3DView.tsx
// Dynamic SSR-safe wrapper for Arena3DCanvas

import React from 'react';
import dynamic from 'next/dynamic';
import { AvatarConfig } from '@/types/avatar';
import { CombatAction, BiomeType } from './Arena3DCanvas';

const Arena3DCanvas = dynamic(
  () => import('./Arena3DCanvas').then((m) => ({ default: m.Arena3DCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] flex items-center justify-center bg-[#040608] rounded-2xl border border-white/10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#00FF66]/30 border-t-[#00FF66] rounded-full animate-spin" />
          <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            SYNCHRONIZING ARENA HOLO-COLOSSEUM...
          </p>
        </div>
      </div>
    ),
  }
);

import { WebGLErrorBoundary } from '@/components/shared/WebGLFallback';

interface Arena3DViewProps {
  playerConfig: AvatarConfig;
  opponentConfig: AvatarConfig;
  playerAction: CombatAction;
  opponentAction: CombatAction;
  biome?: BiomeType;
  roundKey?: number | string;
  activeFx?: 'slash' | 'magic' | 'shield' | 'ultimate' | 'healing' | null;
  fxSource?: 'player' | 'opponent';
  attackId?: string;
  vfxColor?: string;
  vfxAccent?: string;
  vfxSpark?: string;
  isCrit?: boolean;
  isDodge?: boolean;
  floatingCombatText?: {
    id: number;
    text: string;
    target: 'player' | 'opponent';
    isCrit?: boolean;
    color?: string;
  }[];
  className?: string;
}

export function Arena3DView(props: Arena3DViewProps) {
  return (
    <div className={`relative w-full overflow-hidden ${props.className || 'h-[400px] md:h-[480px] rounded-2xl border border-white/10'}`}>
      <WebGLErrorBoundary fallbackTitle="Arena Holo-Colosseum Offline">
        <Arena3DCanvas {...props} />
      </WebGLErrorBoundary>
    </div>
  );
}
