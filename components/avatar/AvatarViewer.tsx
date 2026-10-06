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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Canvas */}
      <div className="flex-1 min-h-0">
        {mounted ? (
          <AvatarScene
            config={config}
            animate={animate}
            autoRotate={autoRotate}
            focusMode={focusMode}
            onResetTrigger={resetTrigger}
            action={action}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#020502]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-2 border-[#00FF66]/30 border-t-[#00FF66] rounded-full animate-spin" />
              <p className="text-[#00FF66]/60 text-xs font-mono tracking-widest uppercase">INITIALIZING HOLO-RIG...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
