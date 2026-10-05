'use client';
// Prototype page - mounts the 3D canvas and the full AppShell game flow.
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { GameRenderer, useQualityTier } from '@/src/rendering';
import { AppShell } from '@/src/ui/AppShell';
import { AudioController } from '@/src/audio';
import { ErrorBoundary } from '@/src/debug/ErrorBoundary';
import { GameDebugPanel } from '@/src/debug/GameDebugPanel';

export default function PrototypePage() {
  const { dpr } = useQualityTier();
  
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden', position: 'relative' }}>
        <AudioController />
        
        {/* 3D canvas - always mounted so physics/animation stay alive during menu transitions */}
        <Canvas shadows dpr={dpr} style={{ position: 'absolute', inset: 0 }}>
          <Physics gravity={[0, -20, 0]}>
            <GameRenderer />
          </Physics>
        </Canvas>

        {/* Full game-flow UI shell layered on top of the canvas */}
        <AppShell />
        
        {/* Debug UI (toggle with backtick key) */}
        <GameDebugPanel />
      </div>
    </ErrorBoundary>
  );
}
