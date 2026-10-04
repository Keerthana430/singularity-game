'use client';
// components/avatar/AvatarViewer.tsx
// Client-only wrapper — dynamically imports the R3F Canvas to prevent SSR issues.
// Features smart contextual camera zooming per body part with manual override buttons.

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { RotateCcw, RefreshCw, User, Eye, Shirt, Footprints } from 'lucide-react';
import { AvatarConfig, StudioCategory } from '@/types/avatar';
import { useAvatarStore } from '@/store/avatarStore';
import type { CameraFocusMode } from './AvatarScene';

const AvatarScene = dynamic(
  () => import('./AvatarScene').then((m) => ({ default: m.AvatarScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#020502]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-2 border-[#00FF66]/30 border-t-[#00FF66] rounded-full animate-spin" />
          <p className="text-[#00FF66]/60 text-xs font-mono tracking-widest uppercase">INITIALIZING HOLO-RIG...</p>
        </div>
      </div>
    ),
  }
);

interface AvatarViewerProps {
  config: AvatarConfig;
  className?: string;
  showControls?: boolean;
  animate?: boolean;
  category?: StudioCategory;
  action?: 'idle' | 'attack' | 'hit' | 'defend' | 'victory';
}

function categoryToFocus(category?: StudioCategory): CameraFocusMode {
  if (!category) return 'full';
  switch (category) {
    case 'face':
    case 'hair':
    case 'accessories':
      return 'face';
    case 'tops':
    case 'weapons':
      return 'torso';
    case 'bottoms':
    case 'shoes':
      return 'shoes';
    case 'species':
    case 'body':
    case 'colors':
    default:
      return 'full';
  }
}

export function AvatarViewer({
  config,
  className = '',
  showControls = true,
  animate = true,
  category,
  action = 'idle',
}: AvatarViewerProps) {
  const storeCategory = useAvatarStore((s) => s.activeCategory);
  const activeCategory = category || storeCategory;

  const [focusMode, setFocusMode] = useState<CameraFocusMode>(() => categoryToFocus(activeCategory));
  const [autoRotate, setAutoRotate] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // When active category changes, auto-zoom to the corresponding body part
  useEffect(() => {
    if (activeCategory) {
      setFocusMode(categoryToFocus(activeCategory));
    }
  }, [activeCategory]);

  const handleResetCamera = useCallback(() => {
    setResetTrigger((c) => c + 1);
  }, []);

  const FOCUS_OPTIONS: { id: CameraFocusMode; label: string; icon: React.ReactNode }[] = [
    { id: 'full', label: 'Full', icon: <User size={13} /> },
    { id: 'face', label: 'Face', icon: <Eye size={13} /> },
    { id: 'torso', label: 'Torso', icon: <Shirt size={13} /> },
    { id: 'shoes', label: 'Shoes', icon: <Footprints size={13} /> },
  ];

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <AvatarScene
          config={config}
          animate={animate}
          autoRotate={autoRotate}
          focusMode={focusMode}
          onResetTrigger={resetTrigger}
          action={action}
          className="w-full h-full"
        />
      </div>

      {/* Floating Camera Control HUD — top-right to avoid overlap with Auto-Equip at bottom */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-2 right-2 flex items-center gap-1.5 z-20"
        >
          {/* Main Control Bar */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-[#00FF66]/20 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            {/* Quick Zoom Focus Buttons */}
            {FOCUS_OPTIONS.map((opt) => {
              const isActive = focusMode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFocusMode(opt.id)}
                  title={`Zoom to ${opt.label}`}
                  aria-label={`Zoom to ${opt.label}`}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#00FF66] text-black shadow-[0_0_10px_rgba(0,255,102,0.5)]'
                      : 'text-white/55 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {opt.icon}
                </button>
              );
            })}

            <div className="w-px h-4 bg-white/15 mx-0.5" />

            {/* Reset Camera button */}
            <button
              onClick={handleResetCamera}
              title="Reset camera focus"
              aria-label="Reset camera position"
              className="p-1 rounded-lg text-white/45 hover:text-[#00FF66] hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={12} />
            </button>

            {/* Toggle auto-rotate */}
            <button
              onClick={() => setAutoRotate((r) => !r)}
              title="Toggle auto-rotate"
              aria-label="Toggle auto-rotate"
              className={`p-1 rounded-lg transition-colors ${
                autoRotate
                  ? 'text-[#00FF66] bg-[#00FF66]/15 shadow-[0_0_8px_rgba(0,255,102,0.35)]'
                  : 'text-white/45 hover:text-white hover:bg-white/10'
              }`}
            >
              <RefreshCw size={12} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
