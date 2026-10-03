import React, { useRef, useEffect } from 'react';
import { Vector3, Mesh } from 'three';
import gsap from 'gsap';

interface PlayerPawn3DProps {
  id: string;
  color: string;
  position: Vector3; // The target destination (e.g. from tile mapping)
  // For smooth pathing, we might want to pass a path array or let the pawn compute it 
  // via a game integration hook, but for now we just animate to `position` directly
}

export function PlayerPawn3D({ id, color, position }: PlayerPawn3DProps) {
  const meshRef = useRef<Mesh>(null);

  // Animate the pawn when its target position changes
  useEffect(() => {
    if (meshRef.current) {
      // Small hop animation
      gsap.to(meshRef.current.position, {
        x: position.x,
        z: position.z,
        duration: 0.5,
        ease: 'power2.inOut',
      });
      // Arc the Y
      gsap.to(meshRef.current.position, {
        y: position.y + 0.5, // Hop peak
        duration: 0.25,
        yoyo: true,
        repeat: 1,
        ease: 'power1.out',
      });
    }
  }, [position.x, position.y, position.z]);

  return (
    <mesh ref={meshRef} position={position} castShadow>
      {/* A simple cone/cylinder pawn */}
      <cylinderGeometry args={[0.2, 0.4, 1.0, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}
