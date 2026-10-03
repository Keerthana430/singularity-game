import React from 'react';
import { Html } from '@react-three/drei';
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
        <planeGeometry args={[size * 0.92, size * 0.92]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.8}
          emissive={isSnakeHead ? '#ff0000' : isLadderBase ? '#00ff00' : '#101020'}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Tile Edge / Border (Neon) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[size * 0.98, size * 0.98]} />
        <meshStandardMaterial 
          color="#000000" 
          emissive={isSnakeHead ? '#ff0055' : isLadderBase ? '#00ff55' : '#0055ff'} 
          emissiveIntensity={0.5} 
        />
      </mesh>
      
      {/* Tile Number (Using Html to bypass Troika worker issues) */}
      <Html
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        transform
        occlude
      >
        <div style={{
          color: '#ffffff',
          fontSize: `${size * 20}px`,
          fontWeight: 'bold',
          textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          {number}
        </div>
      </Html>
    </group>
  );
}
