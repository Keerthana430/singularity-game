'use client';
// components/avatar/AvatarScene.tsx
// The R3F canvas + lighting + post-processing + dynamic camera + environment.
// Automatically zooms into body parts (face, hair, tops, shoes, full body) based on active category.

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AvatarConfig } from '@/types/avatar';
import { AvatarModel, getBodyProps } from './AvatarModel';

export type CameraFocusMode = 'full' | 'face' | 'torso' | 'shoes';

// Dais floor level in world space
const Y_FLOOR = -0.92;

// ─── Pedestal (Clean Metallic Studio Stage with Cyber Dais) ──────────────────
function Pedestal() {
  return (
    <group position={[0, Y_FLOOR, 0]}>
      {/* Main stage cylinder base */}
      <mesh position={[0, -0.07, 0]} receiveShadow>
        <cylinderGeometry args={[1.25, 1.4, 0.14, 48]} />
        <meshStandardMaterial color="#0A1017" roughness={0.35} metalness={0.8} />
      </mesh>
      {/* Outer neon green perimeter ring */}
      <mesh position={[0, 0.001, 0]}>
        <cylinderGeometry args={[1.22, 1.22, 0.002, 48]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      {/* Inner dark brushed platform plate */}
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.002, 36]} />
        <meshStandardMaterial
          color="#050C07"
          roughness={0.45}
          metalness={0.65}
        />
      </mesh>
      {/* Center glowing cyber core glyph */}
      <mesh position={[0, 0.003, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.002, 24]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={0.85}
        />
      </mesh>
    </group>
  );
}

// ─── Background ambient particles / starfield ────────────────────────────────
function StarField() {
  const points = React.useMemo(() => {
    const positions = new Float32Array(600);
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#88FFBB" transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

// ─── Dynamic Contextual Camera Rig ───────────────────────────────────────────
interface DynamicCameraRigProps {
  focusMode: CameraFocusMode;
  cameraTargets: Record<CameraFocusMode, { target: THREE.Vector3; position: THREE.Vector3 }>;
  autoRotate: boolean;
  onResetTrigger?: number;
}

function DynamicCameraRig({
  focusMode,
  cameraTargets,
  autoRotate,
  onResetTrigger = 0,
}: DynamicCameraRigProps) {
  const controlsRef = useRef<any>(null);
  const isTransitioning = useRef(true);
  const prevFocus = useRef(focusMode);
  const prevReset = useRef(onResetTrigger);
  const { camera } = useThree();

  useEffect(() => {
    prevFocus.current = focusMode;
    prevReset.current = onResetTrigger;
    isTransitioning.current = true;
  }, [focusMode, onResetTrigger, cameraTargets]);

  useEffect(() => {
    if (controlsRef.current) {
      const { target, position } = cameraTargets[focusMode];
      controlsRef.current.target.copy(target);
      camera.position.copy(position);
      controlsRef.current.update();
    }
  }, []);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    // OrbitControls damping inertia update on EVERY frame for silky smooth coasting!
    controlsRef.current.update();

    if (isTransitioning.current) {
      const { target: destTarget, position: destPos } = cameraTargets[focusMode];
      const lerpSpeed = Math.min(1, delta * 5.0);

      controlsRef.current.target.lerp(destTarget, lerpSpeed);
      camera.position.lerp(destPos, lerpSpeed);

      const distTgt = controlsRef.current.target.distanceTo(destTarget);
      const distPos = camera.position.distanceTo(destPos);
      if (distTgt < 0.003 && distPos < 0.003) {
        controlsRef.current.target.copy(destTarget);
        camera.position.copy(destPos);
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.065}
      rotateSpeed={0.85}
      minDistance={1.0}
      maxDistance={6.0}
      maxPolarAngle={Math.PI * 0.72}
      minPolarAngle={Math.PI * 0.12}
      autoRotate={autoRotate}
      autoRotateSpeed={1.5}
      onStart={() => {
        isTransitioning.current = false;
      }}
      makeDefault
    />
  );
}

// ─── Main scene content ───────────────────────────────────────────────────────
interface SceneContentProps {
  config: AvatarConfig;
  animate: boolean;
  autoRotate: boolean;
  focusMode: CameraFocusMode;
  onResetTrigger?: number;
  action?: 'idle' | 'attack' | 'hit' | 'defend' | 'victory';
}

function SceneContent({
  config,
  animate,
  autoRotate,
  focusMode,
  onResetTrigger = 0,
  action = 'idle',
}: SceneContentProps) {
  // Calculate anatomical proportions & exact coordinates
  const props = getBodyProps(config);

  // Position avatar group so soles of shoes rest exactly on Y_FLOOR
  const avatarGroupY = Y_FLOOR + (0.36 * props.torsoHScale + 0.58 * props.legScale) * props.totalScale;

  // Accurate World heights for all anatomical parts
  const torsoH = 0.52 * props.torsoHScale;
  const headH = props.headRadius * 1.38;
  const headCenterWorldY = avatarGroupY + (torsoH * 0.5 + 0.05 + headH * 0.48) * props.totalScale;
  const headTopWorldY = headCenterWorldY + (props.headRadius * 1.35) * props.totalScale;
  const torsoWorldY = avatarGroupY + (torsoH * 0.15) * props.totalScale;
  const shoesWorldY = Y_FLOOR + 0.10 * props.totalScale;

  // True vertical midpoint of character in world space:
  const characterHeight = headTopWorldY - Y_FLOOR;
  const fullBodyCenterY = Y_FLOOR + characterHeight * 0.52;

  // Generous camera distances tailored per species scale so the ENTIRE character is 100% visible
  // with generous margins above head and below pedestal — never half-visible!
  const fullBodyDist = Math.max(2.85, 2.70 + props.totalScale * 0.90);
  const faceDist = Math.max(0.95, 0.75 + props.totalScale * 0.45);
  const torsoDist = Math.max(1.45, 1.15 + props.totalScale * 0.55);
  const shoesDist = Math.max(1.35, 1.10 + props.totalScale * 0.50);

  // Build target points and camera coordinates for each contextual zoom mode
  const cameraTargets = useMemo(() => {
    return {
      face: {
        target: new THREE.Vector3(0, headCenterWorldY, 0),
        position: new THREE.Vector3(0, headCenterWorldY + 0.02, faceDist),
      },
      torso: {
        target: new THREE.Vector3(0, torsoWorldY, 0),
        position: new THREE.Vector3(0, torsoWorldY + 0.04, torsoDist),
      },
      shoes: {
        target: new THREE.Vector3(0, shoesWorldY + 0.12, 0),
        position: new THREE.Vector3(0, shoesWorldY + 0.30, shoesDist),
      },
      full: {
        target: new THREE.Vector3(0, fullBodyCenterY, 0),
        position: new THREE.Vector3(0, fullBodyCenterY + 0.06, fullBodyDist),
      },
    };
  }, [headCenterWorldY, torsoWorldY, shoesWorldY, fullBodyCenterY, fullBodyDist, faceDist, torsoDist, shoesDist]);

  // Initial camera placement
  const initialPos = cameraTargets[focusMode].position;

  return (
    <>
      {/* Default camera with high precision depth */}
      <PerspectiveCamera
        makeDefault
        position={[initialPos.x, initialPos.y, initialPos.z]}
        fov={40}
        near={0.1}
        far={100}
      />

      {/* Dynamic Camera Rig with contextual focus and smooth lerping */}
      <DynamicCameraRig
        focusMode={focusMode}
        cameraTargets={cameraTargets}
        autoRotate={autoRotate}
        onResetTrigger={onResetTrigger}
      />

      {/* Lighting — Three-point cinematic gaming setup */}
      {/* Key light */}
      <directionalLight
        position={[3, 5, 3]}
        intensity={2.2}
        color="#F0E8FF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
      />
      {/* Fill light */}
      <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#22D3EE" />
      {/* Rim / back light */}
      <directionalLight position={[0, 1.5, -4]} intensity={1.4} color="#FF5C93" />
      {/* Ambient & Hemisphere Lighting */}
      <ambientLight intensity={0.45} color="#140E28" />
      <hemisphereLight args={['#2A1B4E', '#050C06', 0.85]} />

      {/* Dais glow point light right underneath character */}
      <pointLight position={[0, Y_FLOOR + 0.15, 0]} intensity={2.2} color="#00FF66" distance={4} decay={2} />
      <pointLight position={[2, torsoWorldY, 1]} intensity={0.7} color="#22D3EE" distance={5} decay={2} />

      {/* Scene elements */}
      <StarField />
      <Pedestal />

      {/* Avatar positioned accurately on dais */}
      <group position={[0, avatarGroupY, 0]}>
        <AvatarModel config={config} animate={animate} action={action} />
      </group>

      {/* Contact shadows right on top of the pedestal */}
      <ContactShadows
        position={[0, Y_FLOOR + 0.002, 0]}
        opacity={0.65}
        scale={3}
        blur={2.0}
        far={1}
        color="#001808"
      />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.85}
          radius={0.8}
        />
        <Vignette eskil={false} offset={0.18} darkness={0.65} />
      </EffectComposer>
    </>
  );
}

// ─── Placeholder shown in Suspense / error ────────────────────────────────────
function PlaceholderAvatar() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.35, 16, 14]} />
        <meshStandardMaterial color="#00FF66" wireframe />
      </mesh>
      <mesh>
        <boxGeometry args={[0.6, 0.8, 0.35]} />
        <meshStandardMaterial color="#22D3EE" wireframe />
      </mesh>
    </group>
  );
}

// ─── Exported Canvas component ────────────────────────────────────────────────
export interface AvatarSceneProps {
  config: AvatarConfig;
  animate?: boolean;
  autoRotate?: boolean;
  focusMode?: CameraFocusMode;
  onResetTrigger?: number;
  className?: string;
  action?: 'idle' | 'attack' | 'hit' | 'defend' | 'victory';
}

export function AvatarScene({
  config,
  animate = true,
  autoRotate = false,
  focusMode = 'full',
  onResetTrigger = 0,
  className = '',
  action = 'idle',
}: AvatarSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      frameloop={animate ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace }}
      className={className}
      aria-label="3D Avatar Preview"
    >
      <color attach="background" args={['#030608']} />
      <fog attach="fog" args={['#030608', 10, 28]} />

      <Suspense fallback={<PlaceholderAvatar />}>
        <SceneContent
          config={config}
          animate={animate}
          autoRotate={autoRotate}
          focusMode={focusMode}
          onResetTrigger={onResetTrigger}
          action={action}
        />
      </Suspense>
    </Canvas>
  );
}
