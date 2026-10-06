'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Suspense } from 'react';
import { ProceduralCharacter } from '@/src/characters/ProceduralCharacter';
import { StaticDummy } from '@/src/characters/StaticDummy';
import { CombatHUD } from '@/src/ui/CombatHUD';

export default function CharacterTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>
      <CombatHUD />
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={1.5}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} color="#ff4fa3" intensity={2} />
        <pointLight position={[5, 5, -5]} color="#22d3ee" intensity={2} />

        {/* Environment */}
        <Suspense fallback={null}>
          <Physics debug>
            {/* Ground */}
            <RigidBody type="fixed">
              <mesh receiveShadow position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            </RigidBody>

            {/* The Character */}
            <ProceduralCharacter />
            
            {/* Target Dummy */}
            <ProceduralCharacter playerId="opponent1" inputType="ai" position={[0, 0, -3]} />
          </Physics>
        </Suspense>

        <OrbitControls makeDefault />
        <gridHelper args={[50, 50, '#334155', '#1e293b']} position={[0, -0.09, 0]} />
      </Canvas>
    </div>
  );
}
