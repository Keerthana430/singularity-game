'use client';
// components/avatar/AvatarViewer.tsx
// Client-only wrapper — dynamically imports the R3F Canvas to prevent SSR issues.

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { RotateCcw, RotateCw, Maximize2, RefreshCw, Eye } from 'lucide-react';
import { AvatarConfig } from '@/types/avatar';

const AvatarScene = dynamic(
  () => import('./AvatarScene').then((m) => ({ default: m.AvatarScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#070912]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm tracking-widest uppercase">Loading Avatar</p>
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
}

export function AvatarViewer({ config, className = '', showControls = true, animate = true }: AvatarViewerProps) {
  const [autoRotate, setAutoRotate] = useState(false);
  const [key, setKey] = useState(0); // remount trigger for camera reset

  const resetCamera = useCallback(() => setKey((k) => k + 1), []);

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <AvatarScene
          key={key}
          config={config}
          animate={animate}
          autoRotate={autoRotate}
          className="w-full h-full"
        />
      </div>

      {/* Camera control buttons */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
        >
          <div className="flex items-center gap-1.5 glass-panel px-3 py-2">
            <button
              onClick={resetCamera}
              title="Reset camera"
              aria-label="Reset camera position"
              className="p-1.5 text-white/50 hover:text-white transition-colors touch-target"
            >
              <RotateCcw size={14} />
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => setAutoRotate((r) => !r)}
              title="Toggle auto-rotate"
              aria-label="Toggle auto-rotate"
              className={`p-1.5 transition-colors touch-target ${autoRotate ? 'text-violet-400' : 'text-white/50 hover:text-white'}`}
            >
              <RefreshCw size={14} />
            </button>
            <div className="w-px h-4 bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider px-1 select-none">Drag to rotate</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
