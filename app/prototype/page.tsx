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
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />
        <Physics gravity={[0, -20, 0]}>
          <GameRenderer />
        </Physics>
      </Canvas>
    </div>
  );
}
