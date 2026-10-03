'use client';
// components/retro/ToonTestModel.tsx
// Interactive Cel-Shaded Anime Model for SINGULARITY Style Bible.
// Combines stepped MeshToonMaterial, Drei <Outlines>, and custom rim lighting.

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { useToonMaterial } from './ToonShading';

export interface ToonTestModelProps {
  outlineThickness?: number;
  outlineColor?: string;
  toonSteps?: 2 | 3 | 4;
  armorColor?: string;
  accentColor?: string;
  showOutlines?: boolean;
}

export function ToonTestModel({
  outlineThickness = 0.035,
  outlineColor = '#050806',
  toonSteps = 3,
  armorColor = '#1E293B',
  accentColor = '#00FF66',
  showOutlines = true,
}: ToonTestModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const leftBladeRef = useRef<THREE.Group>(null);

  // Materials with stepped anime bands
  const armorMat = useToonMaterial(armorColor, undefined, 0, toonSteps);
  const whitePlatesMat = useToonMaterial('#F0F4F1', undefined, 0, toonSteps);
  const darkJointsMat = useToonMaterial('#0F1713', undefined, 0, toonSteps);
  const skinMat = useToonMaterial('#FFDFBA', undefined, 0, toonSteps);
  const hairMat = useToonMaterial('#10B981', '#00FF66', 0.2, toonSteps);
  const accentMat = useToonMaterial(accentColor, accentColor, 1.8, toonSteps);
  const goldTrimMat = useToonMaterial('#FFD600', '#FFD600', 0.8, toonSteps);

  // Anime idle breathing + scanning head animation
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.8) * 0.05;
      rootRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.9) * 0.12;
      headRef.current.rotation.x = Math.sin(t * 1.2) * 0.04;
    }
    if (coreRef.current) {
      const pulse = 1.2 + Math.sin(t * 4.0) * 0.6;
      (coreRef.current.material as THREE.MeshToonMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.6, 0]}>
      {/* ── 1. HEAD & ANIME HAIR ── */}
      <group ref={headRef} position={[0, 1.45, 0]}>
        {/* Anime Chiseled Head */}
        <mesh material={skinMat} castShadow>
          <boxGeometry args={[0.34, 0.42, 0.36]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>

        {/* Angular Jaw V-Chin */}
        <mesh position={[0, -0.22, 0.04]} rotation={[0, 0, Math.PI / 4]} material={skinMat}>
          <coneGeometry args={[0.18, 0.22, 4]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>

        {/* Visor / Anime Optics */}
        <mesh position={[0, 0.04, 0.19]} material={accentMat}>
          <boxGeometry args={[0.3, 0.08, 0.04]} />
        </mesh>

        {/* Spiky Anime Hair Bangs */}
        <group position={[0, 0.22, 0.06]}>
          {[-0.14, -0.06, 0.02, 0.12].map((x, i) => (
            <mesh
              key={i}
              position={[x, 0, 0.12]}
              rotation={[-0.3, 0, (i - 1.5) * 0.2]}
              material={hairMat}
              castShadow
            >
              <coneGeometry args={[0.07, 0.28, 4]} />
              {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
            </mesh>
          ))}
          {/* Back Spikes */}
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh
              key={`b-${i}`}
              position={[x, 0.1, -0.12]}
              rotation={[0.4, 0, (i - 1) * 0.3]}
              material={hairMat}
              castShadow
            >
              <coneGeometry args={[0.08, 0.32, 4]} />
              {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
            </mesh>
          ))}
        </group>
      </group>

      {/* ── 2. TORSO & PAULDRONS (MECHA-WARRIOR) ── */}
      <group position={[0, 0.85, 0]}>
        {/* Chest Armor Chassis */}
        <mesh material={armorMat} castShadow>
          <boxGeometry args={[0.62, 0.65, 0.38]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>

        {/* White Front Chest Plate */}
        <mesh position={[0, 0.08, 0.16]} material={whitePlatesMat}>
          <boxGeometry args={[0.46, 0.44, 0.1]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>

        {/* Glowing Singularity Core Reactor */}
        <mesh ref={coreRef} position={[0, 0.1, 0.22]} material={accentMat}>
          <octahedronGeometry args={[0.09, 0]} />
        </mesh>

        {/* Gold Collar Trim */}
        <mesh position={[0, 0.34, 0.04]} material={goldTrimMat}>
          <boxGeometry args={[0.34, 0.06, 0.32]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>

        {/* Left Shoulder Pauldron (Heavy Angular Anime Armor) */}
        <group position={[-0.44, 0.28, 0]} rotation={[0, 0, 0.25]}>
          <mesh material={armorMat} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.4]} />
            {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
          </mesh>
          <mesh position={[-0.04, 0.15, 0]} material={goldTrimMat}>
            <boxGeometry args={[0.08, 0.06, 0.36]} />
          </mesh>
        </group>

        {/* Right Shoulder Pauldron */}
        <group position={[0.44, 0.28, 0]} rotation={[0, 0, -0.25]}>
          <mesh material={armorMat} castShadow>
            <boxGeometry args={[0.26, 0.28, 0.4]} />
            {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
          </mesh>
          <mesh position={[0.04, 0.15, 0]} material={goldTrimMat}>
            <boxGeometry args={[0.08, 0.06, 0.36]} />
          </mesh>
        </group>

        {/* Belt & Waist Armor */}
        <mesh position={[0, -0.36, 0]} material={darkJointsMat}>
          <boxGeometry args={[0.54, 0.16, 0.34]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
        <mesh position={[0, -0.36, 0.18]} material={goldTrimMat}>
          <boxGeometry args={[0.16, 0.14, 0.04]} />
        </mesh>
      </group>

      {/* ── 3. ARMS & TACTICAL KATANA ── */}
      {/* Left Arm */}
      <group position={[-0.42, 0.72, 0]}>
        <mesh position={[0, -0.25, 0]} material={whitePlatesMat} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.16]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
        <mesh position={[0, -0.52, 0]} material={darkJointsMat}>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
      </group>

      {/* Right Arm (Holding Plasma Blade) */}
      <group position={[0.42, 0.72, 0]}>
        <mesh position={[0, -0.25, 0]} material={whitePlatesMat} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.16]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
        <mesh position={[0, -0.52, 0]} material={darkJointsMat}>
          <boxGeometry args={[0.14, 0.18, 0.14]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>

        {/* Anime Plasma Katana */}
        <group ref={leftBladeRef} position={[0, -0.55, 0.2]} rotation={[0.4, 0, 0]}>
          {/* Hilt */}
          <mesh position={[0, 0, -0.1]} material={darkJointsMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
          </mesh>
          {/* Tsuba guard */}
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={goldTrimMat}>
            <boxGeometry args={[0.12, 0.08, 0.02]} />
          </mesh>
          {/* Energy Blade */}
          <mesh position={[0, 0.65, 0.03]} material={accentMat}>
            <boxGeometry args={[0.04, 1.25, 0.02]} />
            {showOutlines && <Outlines thickness={outlineThickness * 0.8} color="#050806" />}
          </mesh>
        </group>
      </group>

      {/* ── 4. LEGS & GREAVES ── */}
      {/* Left Leg */}
      <group position={[-0.18, 0.15, 0]}>
        <mesh position={[0, -0.32, 0]} material={armorMat} castShadow>
          <boxGeometry args={[0.22, 0.58, 0.24]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
        <mesh position={[0, -0.7, 0.05]} material={whitePlatesMat}>
          <boxGeometry args={[0.24, 0.22, 0.36]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.18, 0.15, 0]}>
        <mesh position={[0, -0.32, 0]} material={armorMat} castShadow>
          <boxGeometry args={[0.22, 0.58, 0.24]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
        <mesh position={[0, -0.7, 0.05]} material={whitePlatesMat}>
          <boxGeometry args={[0.24, 0.22, 0.36]} />
          {showOutlines && <Outlines thickness={outlineThickness} color={outlineColor} />}
        </mesh>
      </group>

      {/* ── 5. FLOATING HOLOGRAM PEDESTAL RING ── */}
      <group position={[0, -0.65, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 0.96, 32]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
          <circleGeometry args={[0.82, 32]} />
          <meshStandardMaterial color="#0A110D" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
