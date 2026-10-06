import React from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

export function FPSMap() {
  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color="#2d4c1e" roughness={1} />
        </mesh>
      </RigidBody>

      {/* Basic House 1 */}
      <RigidBody type="fixed" position={[10, 2.5, 10]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[10, 5, 10]} />
          <meshStandardMaterial color="#8b7355" />
        </mesh>
      </RigidBody>

      {/* Basic House 2 */}
      <RigidBody type="fixed" position={[-15, 4, -20]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[12, 8, 15]} />
          <meshStandardMaterial color="#696969" />
        </mesh>
      </RigidBody>

      {/* Walls/Obstacles */}
      <RigidBody type="fixed" position={[0, 2, -15]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[20, 4, 1]} />
          <meshStandardMaterial color="#4a4a4a" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" position={[25, 1.5, -5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 3, 10]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
      </RigidBody>
      
      {/* Invisible bounding walls */}
      <RigidBody type="fixed" position={[100, 10, 0]}>
        <CuboidCollider args={[1, 20, 100]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-100, 10, 0]}>
        <CuboidCollider args={[1, 20, 100]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 10, 100]}>
        <CuboidCollider args={[100, 20, 1]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 10, -100]}>
        <CuboidCollider args={[100, 20, 1]} />
      </RigidBody>
    </group>
  );
}
