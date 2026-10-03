import React from 'react';
import { Text } from '@react-three/drei';
import { Vector3 } from 'three';

interface Tile3DProps {
  number: number;
  position: Vector3;
  size: number;
  isSnakeHead?: boolean;
  isLadderBase?: boolean;
}

export function Tile3D({ number, position, size, isSnakeHead, isLadderBase }: Tile3DProps) {
  // Checkered pattern or simple alternating colors
  const isEvenRow = Math.floor((number - 1) / 10) % 2 === 0;
  const colIndex = (number - 1) % 10;
  // Make a checkerboard
  const isDark = (colIndex % 2 === 0) === isEvenRow;
  
  let color = isDark ? '#2a2a35' : '#3a3a45';
  
  if (isSnakeHead) color = '#552222';
  if (isLadderBase) color = '#225522';
  
  return (
    <group position={position}>
      {/* Tile Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size * 0.95, size * 0.95]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      
      {/* Tile Number */}
      <Text
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={size * 0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {number}
      </Text>
    </group>
  );
}
