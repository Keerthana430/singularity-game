'use client';
// app/snakes/page.tsx
// Snakes & Ladders: College Edition 3D (100-Tile Campus Tower)
// Integrates the 3D spiral tower edition from /snake-and-ladder.html

import React from 'react';

export default function SnakesPage() {
  return (
    <div className="relative w-screen h-[calc(100vh-4rem)] mt-16 overflow-hidden bg-[#070a1c] select-none">
      <iframe
        src="/snake-and-ladder.html"
        title="Snakes & Ladders College Edition"
        className="w-full h-full border-0 block"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
