'use client';
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { KeyboardControls, Sky, Stars } from '@react-three/drei';
import { FPSPlayer } from './FPSPlayer';
import { FPSMap } from './FPSMap';
import { FPSEnemyManager } from './FPSEnemyManager';
import { FPSHUD } from './FPSHUD';
import { fpsControlsMap } from './fpsConfig';
import { FPSLootManager } from './FPSLootManager';

export default function FPSGame() {
  const [hp, setHp] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [inventory, setInventory] = useState<string[]>([]);
  const [droppedLoot, setDroppedLoot] = useState<{ id: string, position: [number, number, number], type: string, color: string }[]>([]);

  const handleEnemyKilled = (position: [number, number, number], type: string) => {
    setDroppedLoot(prev => [
      ...prev,
      {
        id: `loot-${Date.now()}-${Math.random()}`,
        position: [position[0], position[1] + 1, position[2]],
        type: type === 'brute' ? 'Heavy Machine Gun' : type === 'scout' ? 'Sniper Rifle' : 'Assault Rifle',
        color: type === 'brute' ? '#ff0055' : type === 'scout' ? '#00ccff' : '#ffaa00'
      }
    ]);
  };

  return (
    <KeyboardControls map={fpsControlsMap}>
      <FPSHUD hp={hp} ammo={ammo} inventory={inventory} />
      <Canvas shadows camera={{ fov: 75 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
        <Stars />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} castShadow intensity={1.5} shadow-mapSize={[2048, 2048]} />
        
        <Physics gravity={[0, -20, 0]}>
          <FPSPlayer onHpChange={setHp} onAmmoChange={setAmmo} />
          <FPSMap />
          <FPSEnemyManager onEnemyKilled={handleEnemyKilled} />
          <FPSLootManager droppedLoot={droppedLoot} onLootPickup={(item) => setInventory(prev => [...prev, item])} />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}
