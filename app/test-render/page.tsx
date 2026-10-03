'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { HelloTriangle } from '@/src/rendering/HelloTriangle';

export default function TestRenderPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <HelloTriangle />
      </Canvas>
      <div style={{ position: 'absolute', top: 20, left: 20, color: '#00ff88', fontFamily: 'monospace' }}>
        Renderer Boots OK
      </div>
    </div>
  );
}
