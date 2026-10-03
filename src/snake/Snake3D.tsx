import React, { useMemo, useRef } from 'react';
import { Vector3, CatmullRomCurve3, Mesh, ShaderMaterial, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../state/store';
import { getTilePosition } from '../board/tileMapping';

interface Snake3DProps {
  startPos: Vector3; // Head
  endPos: Vector3;   // Tail
}

export function Snake3D({ startPos, endPos }: Snake3DProps) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  const time = useRef({ value: 0 });
  const headRef = useRef<Mesh>(null);

  const activePlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const players = useGameStore((state) => state.players);
  const boardConfig = useGameStore((state) => state.boardConfig);

  const curve = useMemo(() => {
    const midPoint = new Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    midPoint.y += 1.5;
    
    const dir = new Vector3().subVectors(endPos, startPos).normalize();
    const perp = new Vector3(-dir.z, 0, dir.x).multiplyScalar(1.0);
    midPoint.add(perp);
    
    return new CatmullRomCurve3([
      startPos.clone().setY(startPos.y + 0.1),
      midPoint,
      endPos.clone().setY(endPos.y + 0.1)
    ]);
  }, [startPos, endPos]);

  useFrame((state, delta) => {
    time.current.value += delta;
    
    if (headRef.current && activePlayerIndex !== -1) {
      const activePlayer = players[activePlayerIndex];
      if (activePlayer) {
        const playerPos = getTilePosition(activePlayer.position, boardConfig.size, 10, 1);
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
        <tubeGeometry args={[curve, 32, 0.15, 8, false]} />
        <meshStandardMaterial 
          ref={materialRef}
          color="#ff2222" 
          roughness={0.2} 
          metalness={0.8}
          emissive="#550000"
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
              // Simple breathing: inflate slightly based on time and uv.x
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
        {/* Simple eyes */}
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
