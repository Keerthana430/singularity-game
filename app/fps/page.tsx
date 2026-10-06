'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const FPSGame = dynamic(() => import('@/src/fps/FPSGame'), { ssr: false });

export default function FPSPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <FPSGame />
    </div>
  );
}
