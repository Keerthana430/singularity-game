'use client';
// app/snakes/page.tsx
// Cyber Serpents & Ladders — Enhanced 100-Tile 3D Arcade Engine
// Integrated from the snake-and-ladder branch with Rapier 3D physics,
// procedural animated serpents & cyber-ladders, camera choreography, and synth audio.

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { GameRenderer, useQualityTier } from '@/src/rendering';
import { AppShell } from '@/src/ui/AppShell';
import { AudioController } from '@/src/audio';
import { ErrorBoundary } from '@/src/debug/ErrorBoundary';
import { GameDebugPanel } from '@/src/debug/GameDebugPanel';

export default function SnakesPage() {
  const { dpr } = useQualityTier();

  return (
    <ErrorBoundary>
      <div className="relative w-screen h-screen overflow-hidden pt-16 bg-[#050510] select-none">
        <AudioController />

        {/* 3D Canvas with Rapier physics engine */}
        <Canvas shadows dpr={dpr} style={{ position: 'absolute', inset: 0 }}>
          <Physics gravity={[0, -20, 0]}>
            <GameRenderer />
          </Physics>
        </Canvas>

        {/* Full game-flow UI shell layered on top of the canvas */}
        <AppShell />

        {/* Debug UI (toggle with backtick key `) */}
        <GameDebugPanel />
      </div>
    </ErrorBoundary>
  );
}
