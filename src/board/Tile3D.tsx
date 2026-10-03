import React from 'react';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { TileLayout } from './layout/types';
import { LAYOUT_CONFIG } from './layout/config';

interface Tile3DProps {
  layout: TileLayout;
  isSnakeHead?: boolean;
  isLadderBase?: boolean;
}

export function Tile3D({ layout, isSnakeHead, isLadderBase }: Tile3DProps) {
  const { tileNumber, center, surfaceHeight, size, isStep, facingDirection } = layout;
  
  const isEvenRow = Math.floor((tileNumber - 1) / 10) % 2 === 0;
  const colIndex = (tileNumber - 1) % 10;
  const isDark = (colIndex % 2 === 0) === isEvenRow;
  
  let color = isDark ? '#2a2a35' : '#3a3a45';
  if (isSnakeHead) color = '#552222';
  if (isLadderBase) color = '#225522';
  
  // The tile is a thick block. Its top is at Y=surfaceHeight.
  // We extend it down to Y=0 or slightly below so it looks like a solid pillar.
  // The height of the box is surfaceHeight + blockDepth.
  const blockDepth = 1.0; 
  const totalHeight = surfaceHeight + blockDepth;
  const centerY = surfaceHeight - (totalHeight / 2);

  // Position passed in center has y = surfaceHeight.
  // We use the center x and z, but adjust y for the mesh.
  
  return (
    <group position={[center.x, 0, center.z]}>
      {/* Tile Pillar */}
      <mesh position={[0, centerY, 0]} receiveShadow castShadow>
        <boxGeometry args={[size * 0.96, totalHeight, size * 0.96]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.4} 
          metalness={0.6}
          emissive={isSnakeHead ? '#440000' : isLadderBase ? '#004400' : '#050510'}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Top Surface Accent */}
      <mesh position={[0, surfaceHeight + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 0.88, size * 0.88]} />
        <meshStandardMaterial 
          color="#000000" 
          emissive={isSnakeHead ? '#ff0055' : isLadderBase ? '#00ff55' : '#0055ff'} 
          emissiveIntensity={0.5} 
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Step connection */}
      {isStep && (
        <mesh 
          position={[
            facingDirection.x * (size * 0.5), 
            surfaceHeight + LAYOUT_CONFIG.stepHeight / 2, 
            facingDirection.z * (size * 0.5)
          ]} 
          receiveShadow 
          castShadow
        >
          {/* A small connecting block */}
          <boxGeometry args={[
            facingDirection.x !== 0 ? size * 0.5 : size * 0.6, 
            LAYOUT_CONFIG.stepHeight, 
            facingDirection.z !== 0 ? size * 0.5 : size * 0.6
          ]} />
          <meshStandardMaterial color="#1a1a25" roughness={0.6} metalness={0.3} />
        </mesh>
      )}
      
      {/* Tile Number (Using Html to bypass Troika worker issues) */}
      <Html
        position={[0, surfaceHeight + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        transform
        occlude
      >
        <div style={{
          color: '#ffffff',
          fontSize: `${size * 24}px`,
          fontWeight: '900',
          WebkitTextStroke: '1px black',
          textShadow: '0px 2px 4px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          {tileNumber}
        </div>
      </Html>
    </group>
  );
}
