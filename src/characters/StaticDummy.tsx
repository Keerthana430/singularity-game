import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';

export function StaticDummy({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const [hitTimer, setHitTimer] = useState(0);

  // Expose a method to take hits (we can attach it to userData)
  const userData = useMemo(() => ({
    isEnemy: true,
    takeHit: (damage: number, impactDir: THREE.Vector3) => {
      setHitTimer(0.3); // flash red for 0.3s
      if (rigidBodyRef.current) {
        // Apply physics knockback
        const force = impactDir.normalize().multiplyScalar(damage * 2.0);
        // add some upward force
        force.y = damage * 0.5;
        rigidBodyRef.current.applyImpulse(force, true);
        
        // Add some torque to make it spin/tumble
        rigidBodyRef.current.applyTorqueImpulse(
          new THREE.Vector3((Math.random() - 0.5) * damage, 0, (Math.random() - 0.5) * damage),
          true
        );
      }
    }
  }), []);

  useFrame((state, delta) => {
    if (hitTimer > 0) {
      setHitTimer(h => Math.max(0, h - delta));
      if (materialRef.current) {
        materialRef.current.emissive.setHex(0xff0000);
        materialRef.current.emissiveIntensity = hitTimer * 3.0;
        materialRef.current.color.setHex(0xff0000);
      }
    } else {
      if (materialRef.current) {
        materialRef.current.emissive.setHex(0x000000);
        materialRef.current.color.setHex(0x555555);
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      colliders={false}
      mass={10}
      userData={userData}
      lockRotations={false}
    >
      <CapsuleCollider args={[0.6, 0.4]} />
      <mesh ref={meshRef} castShadow receiveShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 16, 16]} />
        <meshStandardMaterial ref={materialRef} color="#555555" roughness={0.7} metalness={0.2} />
      </mesh>
    </RigidBody>
  );
}
