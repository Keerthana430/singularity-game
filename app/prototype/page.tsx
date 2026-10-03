'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { GameRenderer } from '@/src/rendering';
import { PrototypeUI } from '@/src/ui/PrototypeUI';

export default function PrototypePage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      <PrototypeUI />
      <Canvas shadows>

        <Physics gravity={[0, -20, 0]}>
          <GameRenderer />
        </Physics>
      </Canvas>
    </div>
  );
}
