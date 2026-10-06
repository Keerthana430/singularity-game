'use client';
import React, { useState, useEffect } from 'react';
import { ProceduralCharacter } from '../characters/ProceduralCharacter';

interface Enemy {
  id: string;
  position: [number, number, number];
  hp: number;
  type: 'soldier' | 'brute' | 'scout';
}

export function FPSEnemyManager({ onEnemyKilled }: { onEnemyKilled: (position: [number, number, number], type: string) => void }) {
  const [enemies, setEnemies] = useState<Enemy[]>([
    { id: 'e1', position: [0, 0, -20], hp: 100, type: 'soldier' },
    { id: 'e2', position: [15, 0, -10], hp: 150, type: 'brute' },
    { id: 'e3', position: [-20, 0, -30], hp: 80, type: 'scout' }
  ]);

  const handleKnockdown = (id: string) => {
    // Wait for knockdown animation then remove and spawn loot
    setTimeout(() => {
      setEnemies(prev => {
        const enemy = prev.find(e => e.id === id);
        if (enemy) {
          onEnemyKilled(enemy.position, enemy.type);
        }
        return prev.filter(e => e.id !== id);
      });
    }, 2000);
  };

  return (
    <>
      {enemies.map((enemy) => (
        <ProceduralCharacter
          key={enemy.id}
          playerId={enemy.id}
          inputType="ai"
          position={enemy.position}
          onKnockdown={() => handleKnockdown(enemy.id)}
        />
      ))}
    </>
  );
}
