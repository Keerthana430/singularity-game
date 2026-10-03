'use client';
// Prototype page — mounts the 3D canvas and the full AppShell game flow.
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { GameRenderer } from '@/src/rendering';
import { AppShell } from '@/src/ui/AppShell';

export default function PrototypePage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden', position: 'relative' }}>
      {/* 3D canvas — always mounted so physics/animation stay alive during menu transitions */}
      <Canvas shadows style={{ position: 'absolute', inset: 0 }}>
        <Physics gravity={[0, -20, 0]}>
          <GameRenderer />
        </Physics>
      </Canvas>

      {/* Full game-flow UI shell layered on top of the canvas */}
      <AppShell />
    </div>
  );
}
