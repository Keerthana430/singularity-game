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

// ─── Pedestal (Ancient Overgrown Mossy Ruin Dais) ─────────────────────────────
function Pedestal() {
  const mossTufts = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (i % 2) * 0.15;
      const r = 1.18 + ((i * 7) % 5) * 0.03;
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        scale: 0.10 + ((i * 3) % 4) * 0.025,
        rot: angle,
      };
    });
  }, []);

  return (
    <group position={[0, Y_FLOOR, 0]}>
      {/* Ancient carved basalt ruin base */}
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <cylinderGeometry args={[1.30, 1.48, 0.18, 48]} />
        <meshStandardMaterial color="#141E19" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Weathered bronze rune perimeter ring with carved bevel */}
      <mesh position={[0, -0.001, 0]}>
        <cylinderGeometry args={[1.28, 1.30, 0.015, 48]} />
        <meshStandardMaterial
          color="#926C2A"
          roughness={0.4}
          metalness={0.75}
        />
      </mesh>

      {/* Glowing emerald soul rune channel */}
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[1.22, 1.22, 0.003, 48]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={0.85}
          roughness={0.3}
        />
      </mesh>

      {/* Lush overgrown moss turf top plate */}
      <mesh position={[0, 0.003, 0]}>
        <cylinderGeometry args={[1.14, 1.14, 0.004, 36]} />
        <meshStandardMaterial
          color="#163326"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Inner carved rune glyph circle */}
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.003, 24]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={1.1}
        />
      </mesh>

      {/* Inner ancient glyph ring */}
      <mesh position={[0, 0.006, 0]}>
        <ringGeometry args={[0.34, 0.38, 32]} />
        <meshStandardMaterial
          color="#926C2A"
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Organic moss clumps and sprouting vine curls around dais edge */}
      {mossTufts.map((tuft, idx) => (
        <group key={idx} position={[tuft.x, 0.01, tuft.z]} rotation={[0, tuft.rot, 0]}>
          <mesh castShadow receiveShadow scale={[tuft.scale * 1.3, tuft.scale * 0.55, tuft.scale]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#4D7C0F' : '#3F6212'} roughness={0.9} />
          </mesh>
          {/* Sprouting tiny nature leaf */}
          {idx % 3 === 0 && (
            <mesh position={[0, tuft.scale * 0.45, 0]} rotation={[0.2, 0, 0.4]}>
              <coneGeometry args={[0.035, 0.09, 4]} />
              <meshStandardMaterial color="#84CC16" roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ─── Canopy Starlight Spores & Floating Fireflies ────────────────────────────
function StarField() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 260;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#84CC16'), // moss lime
      new THREE.Color('#67E8F9'), // starlight cyan
      new THREE.Color('#FEF3C7'), // warm amber spore
      new THREE.Color('#00FF66'), // emerald soul
      new THREE.Color('#FFFFFF'), // white sparkle
    ];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle upward drift & sway of forest motes
    const geom = pointsRef.current.geometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] += 0.004;
      arr[i * 3] += Math.sin(t * 0.8 + i) * 0.002;
      if (arr[i * 3 + 1] > 7) {
        arr[i * 3 + 1] = -7;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
      />
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

      {/* Lighting — Canopy Twilight & Moss Ambient Setup */}
      {/* Sunlight beam key light */}
      <directionalLight
        position={[3, 6, 3]}
        intensity={2.6}
        color="#FEF3C7"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
      />
      {/* Cool atmospheric sky fill */}
      <directionalLight position={[-3, 3, 2]} intensity={1.1} color="#67E8F9" />
      {/* Canopy moss rim light for anime silhouettes */}
      <directionalLight position={[0, 2, -4]} intensity={2.2} color="#84CC16" />
      {/* Ambient & Forest Hemisphere Lighting */}
      <ambientLight intensity={0.55} color="#0D2117" />
      <hemisphereLight args={['#1F3A2B', '#08120D', 0.9]} />

      {/* Ancient ruin soul rune uplight underneath character */}
      <pointLight position={[0, Y_FLOOR + 0.15, 0]} intensity={2.4} color="#00FF66" distance={4} decay={2} />
      <pointLight position={[2, torsoWorldY, 1]} intensity={0.9} color="#67E8F9" distance={5} decay={2} />

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
      <color attach="background" args={['#0A1510']} />
      <fog attach="fog" args={['#0A1510', 8, 26]} />

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
