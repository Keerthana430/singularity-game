'use client';
// components/avatar/AvatarScene.tsx
// The R3F canvas + lighting + post-processing + camera + environment.
// Client-only (dynamic import with ssr:false from AvatarViewer).

import React, { useRef, Suspense, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Environment,
  useGLTF,
  PerspectiveCamera,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AvatarConfig } from '@/types/avatar';
import { AvatarModel } from './AvatarModel';

// ─── Pedestal ────────────────────────────────────────────────────────────────
function Pedestal() {
  return (
    <group position={[0, -1.62, 0]}>
      {/* Main disc */}
      <mesh receiveShadow>
        <cylinderGeometry args={[1.1, 1.3, 0.12, 40]} />
        <meshStandardMaterial color="#050C06" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Glowing singularity neon ring */}
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.85, 0.025, 8, 80]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={3.0}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      {/* Outer ring */}
      <mesh position={[0, 0.06, 0]}>
        <torusGeometry args={[1.05, 0.012, 6, 80]} />
        <meshStandardMaterial
          color="#39FF14"
          emissive="#39FF14"
          emissiveIntensity={2.0}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ─── Grid floor ──────────────────────────────────────────────────────────────
function GridFloor() {
  const gridRef = useRef<THREE.GridHelper>(null);
  return (
    <gridHelper
      ref={gridRef}
      args={[20, 30, '#00FF66', '#00260B']}
      position={[0, -1.68, 0]}
    />
  );
}

// ─── Background particles / stars ────────────────────────────────────────────
function StarField() {
  const points = React.useMemo(() => {
    const positions = new Float32Array(600);
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={points} count={200} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#ffffff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ─── Gravitational lensing ring behind avatar ─────────────────────────────────
function GravityRing() {
  return (
    <group position={[0, 0, -2.5]}>
      <mesh>
        <torusGeometry args={[2.8, 0.06, 6, 100]} />
        <meshStandardMaterial color="#7C5CFF" emissive="#7C5CFF" emissiveIntensity={0.6} transparent opacity={0.35} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.4, 0.03, 6, 100]} />
        <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.5} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ─── Main scene content ───────────────────────────────────────────────────────
interface SceneContentProps {
  config: AvatarConfig;
  animate: boolean;
  autoRotate: boolean;
}

function SceneContent({ config, animate, autoRotate }: SceneContentProps) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0.2, 3.5]} fov={45} near={0.1} far={100} />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.0}
        maxDistance={7}
        maxPolarAngle={Math.PI * 0.78}
        minPolarAngle={Math.PI * 0.15}
        autoRotate={autoRotate}
        autoRotateSpeed={1.5}
        makeDefault
      />

      {/* Lighting — three-point */}
      {/* Key light */}
      <directionalLight
        position={[3, 5, 3]}
        intensity={2.2}
        color="#E8E0FF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
      />
      {/* Fill light */}
      <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#22D3EE" />
      {/* Rim / back light */}
      <directionalLight position={[0, 1, -4]} intensity={1.4} color="#FF5C93" />
      {/* Ambient */}
      <ambientLight intensity={0.4} color="#1A103A" />

      {/* Point lights for glow atmosphere */}
      <pointLight position={[0, -1.5, 0]} intensity={2} color="#7C5CFF" distance={4} decay={2} />
      <pointLight position={[3, 2, 1]} intensity={0.6} color="#22D3EE" distance={6} decay={2} />

      {/* Environment */}
      <Environment preset="night" />

      {/* Scene elements */}
      <StarField />
      <GravityRing />
      <GridFloor />
      <Pedestal />

      {/* Avatar */}
      <group position={[0, -1.5, 0]}>
        <AvatarModel config={config} animate={animate} />
      </group>

      {/* Contact shadows */}
      <ContactShadows
        position={[0, -1.62, 0]}
        opacity={0.6}
        scale={3}
        blur={2.5}
        far={1}
        color="#3A1F7A"
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          radius={0.8}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

// ─── Placeholder shown in Suspense / error ────────────────────────────────────
function PlaceholderAvatar() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.4, 16, 14]} />
        <meshStandardMaterial color="#7C5CFF" wireframe />
      </mesh>
      <mesh>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color="#22D3EE" wireframe />
      </mesh>
    </group>
  );
}

// ─── Exported Canvas component ────────────────────────────────────────────────
interface AvatarSceneProps {
  config: AvatarConfig;
  animate?: boolean;
  autoRotate?: boolean;
  className?: string;
}

export function AvatarScene({ config, animate = true, autoRotate = false, className = '' }: AvatarSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={animate ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }}
      className={className}
      aria-label="3D Avatar Preview"
    >
      <color attach="background" args={['#070912']} />
      <fog attach="fog" args={['#070912', 12, 30]} />

      <Suspense fallback={<PlaceholderAvatar />}>
        <SceneContent config={config} animate={animate} autoRotate={autoRotate} />
      </Suspense>
    </Canvas>
  );
}
