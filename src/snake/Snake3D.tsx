import React, { useMemo, useRef } from 'react';
import { Vector3, CatmullRomCurve3, Mesh, ShaderMaterial, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../state/store';
import { PerformanceConfig } from '../rendering/qualityConfig';
import { BoardLayout } from '../board/layout';
import { TileNumber } from '../shared';

interface Snake3DProps {
  layout: BoardLayout;
  headTile: number;
  tailTile: number;
  config: PerformanceConfig;
}

export function Snake3D({ layout, headTile, tailTile, config }: Snake3DProps) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  const time = useRef({ value: 0 });
  const headRef = useRef<Mesh>(null);

  const activePlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const players = useGameStore((state) => state.players);
  
  const getPos = (n: number) => {
    const t = layout.tiles[n as TileNumber];
    if (!t) return new Vector3(0, 0, 0);
    return new Vector3(t.center.x, t.surfaceHeight, t.center.z);
  };

  const startPos = getPos(headTile);
  const endPos = getPos(tailTile);

  const curve = useMemo(() => {
    // To make it ground-hugging over terraces, we can add intermediate points
    // if the snake spans multiple rows.
    const points: Vector3[] = [];
    points.push(startPos.clone().setY(startPos.y + 0.15));

    // Calculate intermediate points based on the path. 
    // Just sampling a few tiles between head and tail ensures it stays above the steps.
    const steps = 3;
    for (let i = 1; i < steps; i++) {
      const fraction = i / steps;
      const intermediateTile = Math.round(headTile - (headTile - tailTile) * fraction);
      const intermediatePos = getPos(intermediateTile);
      // Lift slightly to avoid clipping
      intermediatePos.y += 0.2; 
      
      // Add some sideways wiggle
      const dir = new Vector3().subVectors(endPos, startPos).normalize();
      const perp = new Vector3(-dir.z, 0, dir.x).multiplyScalar((i % 2 === 0 ? 1 : -1) * 0.3);
      intermediatePos.add(perp);
      
      points.push(intermediatePos);
    }
    
    points.push(endPos.clone().setY(endPos.y + 0.15));
    return new CatmullRomCurve3(points);
  }, [headTile, tailTile, layout]);

  useFrame((state, delta) => {
    time.current.value += delta;
    
    if (headRef.current && activePlayerIndex !== -1) {
      const activePlayer = players[activePlayerIndex];
      if (activePlayer) {
        const playerPos = getPos(activePlayer.position);
        const distance = startPos.distanceTo(playerPos);
        // If player is close, head looks at them
        if (distance < 5) {
          headRef.current.lookAt(playerPos.x, playerPos.y + 0.5, playerPos.z);
        } else {
          // Look down the body curve
          const tgt = curve.getPointAt(0.1);
          headRef.current.lookAt(tgt);
        }
      }
    }
  });

  return (
    <group>
      {/* Snake Body */}
      <mesh castShadow>
        <tubeGeometry args={[curve, config.snakeSegments, 0.15, Math.max(4, Math.floor(config.snakeSegments / 4)), false]} />
        <meshStandardMaterial 
          ref={materialRef}
          color="#8a2be2" // BlueViolet 
          roughness={0.2} 
          metalness={0.8}
          emissive="#3a0b5a"
          emissiveIntensity={1}
          onBeforeCompile={(shader) => {
            shader.uniforms.uTime = time.current;
            shader.vertexShader = `
              uniform float uTime;
              ${shader.vertexShader}
            `.replace(
              `#include <begin_vertex>`,
              `
              #include <begin_vertex>
              float breathing = sin(uTime * 2.0 - uv.x * 10.0) * 0.05;
              transformed += normal * breathing;
              `
            );
          }}
        />
      </mesh>
      
      {/* Snake Head for tracking */}
      <mesh ref={headRef} position={startPos.clone().setY(startPos.y + 0.15)} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#dd2222" roughness={0.3} />
        <mesh position={[0.1, 0.1, 0.15]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffff00" />
        </mesh>
        <mesh position={[-0.1, 0.1, 0.15]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ffff00" />
        </mesh>
      </mesh>
    </group>
  );
}
