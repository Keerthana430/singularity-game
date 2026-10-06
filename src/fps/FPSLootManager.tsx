'use client';
import React, { useState } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Loot {
  id: string;
  position: [number, number, number];
  type: string;
  color: string;
}

export function FPSLootManager({ droppedLoot, onLootPickup }: { droppedLoot: Loot[], onLootPickup: (item: string) => void }) {
  // Combine initial loot and dropped loot
  const [initialLoot, setInitialLoot] = useState<Loot[]>([
    { id: 'l1', position: [5, 1, -5], type: 'Assault Rifle', color: '#ffaa00' },
    { id: 'l2', position: [-5, 1, -5], type: 'Medkit', color: '#00ffaa' },
  ]);

  // When an item is picked up, it is removed from the screen.
  // To handle this nicely across both arrays, we'll keep a list of "pickedUpIds"
  const [pickedUpIds, setPickedUpIds] = useState<Set<string>>(new Set());

  const allLoot = [...initialLoot, ...droppedLoot].filter(l => !pickedUpIds.has(l.id));

  const handlePickup = (id: string, type: string) => {
    onLootPickup(type);
    setPickedUpIds(prev => new Set(prev).add(id));
  };

  return (
    <>
      {allLoot.map((item) => (
        <LootItem key={item.id} item={item} onPickup={() => handlePickup(item.id, item.type)} />
      ))}
    </>
  );
}

function LootItem({ item, onPickup }: { item: Loot, onPickup: () => void }) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.5;
    }
  });

  return (
    <RigidBody position={item.position} colliders="cuboid" type="fixed" sensor onIntersectionEnter={onPickup}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.5} />
      </mesh>
    </RigidBody>
  );
}
