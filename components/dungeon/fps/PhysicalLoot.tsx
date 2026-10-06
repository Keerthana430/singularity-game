// components/dungeon/fps/PhysicalLoot.tsx
// 3D Physical Loot Drops with Vertical Beacons, Spinning Meshes, and In-World Prompts

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PhysicalLootDrop, ItemRarity } from './types';
import { fpsPlayerCamera } from './FirstPersonController';

interface PhysicalLootProps {
  lootDrops: PhysicalLootDrop[];
  onPickupPrompt?: (item: PhysicalLootDrop | null) => void;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#38BDF8',
  rare: '#00FF66',
  epic: '#C084FC',
  legendary: '#F59E0B',
  mythic: '#FB7185',
};

export function PhysicalLoot({ lootDrops }: PhysicalLootProps) {
  return (
    <group>
      {lootDrops.map((drop) => (
        <SingleLootItem key={drop.id} drop={drop} />
      ))}
    </group>
  );
}

function SingleLootItem({ drop }: { drop: PhysicalLootDrop }) {
  const meshRef = useRef<THREE.Group>(null);
  const color = RARITY_COLORS[drop.item.rarity] || '#00FF66';
  const age = performance.now() - (drop.dropTime || performance.now());
  const remainingSeconds = Math.max(0, Math.ceil((30000 - age) / 1000));
  const isExpiringSoon = remainingSeconds <= 6;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 1.8;
      meshRef.current.position.y = drop.position[1] + 0.35 + Math.sin(clock.getElapsedTime() * 2.5) * 0.08;
      if (isExpiringSoon) {
        meshRef.current.visible = Math.sin(clock.getElapsedTime() * 16) > 0;
      } else {
        meshRef.current.visible = true;
      }
    }
  });

  return (
    <group position={drop.position}>
      {/* Floating Rotating Crystalline Mesh */}
      <group ref={meshRef}>
        <mesh>
          <octahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.4}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Outer Orbiting Energy Ring */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[0.38, 0.02, 6, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Vertical Light Beacon Column */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Floor Glow Decal Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.4, 0.6, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

    </group>
  );
}

