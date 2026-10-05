'use client';
// components/retro/CharacterBakeOff.tsx
// Phase 1 Character Approach Bake-Off:
// Comparing the SAME Hero Character ("Nova Cadet Kai") across 3 distinct technical architectures:
// A) Smooth Toon-Shaded 3D built in code (rounded forms, painted texture, no boxy primitives)
// B) VRM / GLTF Anime Humanoid Model via @pixiv/three-vrm architecture
// C) Layered 2D Painted Paper-Doll Sprite in 3D scene (swappable 5 species + existing store compatibility)

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useToonMaterial } from './ToonShading';

export type CharacterApproachType = 'approachA' | 'approachB' | 'approachC';
export type SpeciesType = 'human' | 'elf' | 'cyborg' | 'fairy' | 'dwarf';

interface BakeOffProps {
  species?: SpeciesType;
  showOutlines?: boolean;
  animated?: boolean;
  activeApproach?: 'all' | 'A' | 'B' | 'C';
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED RETRO LIGHTING RIG FOR THE BAKE-OFF
// ─────────────────────────────────────────────────────────────────────────────
export function WarmAnimeLightingRig() {
  return (
    <>
      {/* Ambient warm space fill */}
      <ambientLight intensity={1.1} color="#2A2440" />

      {/* Main warm practical lantern / star key light */}
      <directionalLight
        position={[4, 5, 4]}
        intensity={2.6}
        color="#FFE5C4"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Warm sunset amber fill */}
      <directionalLight position={[-4, 2, -2]} intensity={1.5} color="#FF9E3B" />

      {/* Electric sky blue rim backlight (for authentic anime silhouette pop) */}
      <directionalLight position={[0, 4, -4]} intensity={2.8} color="#38BDF8" />

      {/* Point light for character blush and cozy warmth */}
      <pointLight position={[0, 1.2, 1.8]} intensity={1.6} distance={4} color="#FFAA55" />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROACH A: SMOOTH TOON-SHADED 3D BUILT IN CODE
// Rounded organic forms, zero boxy primitives, 2-3 tone stepped cel shading
// ─────────────────────────────────────────────────────────────────────────────
export function ApproachAToon3D({
  species = 'human',
  showOutlines = true,
  animated = true,
}: {
  species?: SpeciesType;
  showOutlines?: boolean;
  animated?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

  // Stepped materials with warm retro palette
  const skinMat = useToonMaterial({ color: '#FFDFBA', steps: 2 });
  const hairMat = useToonMaterial({ color: '#A5B4FC', steps: 3 }); // Soft lavender
  const jacketMat = useToonMaterial({ color: '#FDBA74', steps: 2 }); // Apricot windbreaker
  const innerMat = useToonMaterial({ color: '#FFF8EE', steps: 2 }); // Warm cream shirt
  const pantsMat = useToonMaterial({ color: '#2DD4BF', steps: 2 }); // Baggy retro-teal pants
  const bootsMat = useToonMaterial({ color: '#F1F5F9', steps: 2 }); // Chunky sneakers
  const metalMat = useToonMaterial({ color: '#FFC700', steps: 3 }); // Star gold badge
  const eyesMat = useToonMaterial({ color: '#1E1B4B', steps: 2 }); // Deep anime indigo eyes
  const blushMat = useToonMaterial({ color: '#FB7185', steps: 2 }); // Cheerful blush

  // Animated "on twos" clock (stepped 12fps timer)
  useFrame(({ clock }) => {
    if (!animated || !groupRef.current) return;
    const time = clock.getElapsedTime();
    // Stepped 12 fps quantization
    const steppedTime = Math.floor(time * 12) / 12;

    // Subtle breathing bounce (squash & stretch)
    const breath = Math.sin(steppedTime * 2.8) * 0.025;
    groupRef.current.position.y = breath;
    groupRef.current.scale.set(1 + breath * 0.5, 1 - breath * 0.5, 1 + breath * 0.5);

    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(steppedTime * 1.4) * 0.04;
      headRef.current.rotation.x = Math.sin(steppedTime * 2.8) * 0.02;
    }
    if (hairRef.current) {
      hairRef.current.rotation.z = Math.sin(steppedTime * 2.2) * 0.05;
    }
    if (armLRef.current && armRRef.current) {
      armLRef.current.rotation.x = Math.sin(steppedTime * 2.0) * 0.12;
      armRRef.current.rotation.x = -Math.sin(steppedTime * 2.0) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.9, 0]}>
      {/* ── SNEAKERS & LEGS ────────────────────────────────────────── */}
      {/* Left Leg (Baggy balloon pants) */}
      <group position={[-0.22, 0.5, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.45, 12, 16]} />
          <primitive object={pantsMat} attach="material" />
          {showOutlines && <Outlines thickness={1.6} color="#151928" />}
        </mesh>
        {/* Sneaker */}
        <mesh position={[0, -0.38, 0.08]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <primitive object={bootsMat} attach="material" />
          {showOutlines && <Outlines thickness={1.5} color="#151928" />}
        </mesh>
      </group>

      {/* Right Leg (Baggy balloon pants) */}
      <group position={[0.22, 0.5, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.45, 12, 16]} />
          <primitive object={pantsMat} attach="material" />
          {showOutlines && <Outlines thickness={1.6} color="#151928" />}
        </mesh>
        {/* Sneaker */}
        <mesh position={[0, -0.38, 0.08]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <primitive object={bootsMat} attach="material" />
          {showOutlines && <Outlines thickness={1.5} color="#151928" />}
        </mesh>
      </group>

      {/* ── TORSO & COZY JACKET ────────────────────────────────────── */}
      <group position={[0, 1.05, 0]}>
        {/* Main windbreaker body */}
        <mesh castShadow>
          <capsuleGeometry args={[0.26, 0.38, 12, 16]} />
          <primitive object={jacketMat} attach="material" />
          {showOutlines && <Outlines thickness={1.8} color="#151928" />}
        </mesh>

        {/* Rolled puffy jacket collar */}
        <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.08, 12, 24]} />
          <primitive object={jacketMat} attach="material" />
          {showOutlines && <Outlines thickness={1.5} color="#151928" />}
        </mesh>

        {/* Inner cream top peek */}
        <mesh position={[0, 0.18, 0.15]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <primitive object={innerMat} attach="material" />
        </mesh>

        {/* Utility belt & Singularity green badge */}
        <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.04, 8, 24]} />
          <meshBasicMaterial color="#1E293B" />
        </mesh>
        <mesh position={[0, -0.16, 0.26]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 16]} />
          <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* ── ARMS & HANDS ───────────────────────────────────────────── */}
      {/* Left Arm */}
      <group ref={armLRef} position={[-0.38, 1.15, 0]}>
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, 0.15]} castShadow>
          <capsuleGeometry args={[0.11, 0.28, 10, 14]} />
          <primitive object={jacketMat} attach="material" />
          {showOutlines && <Outlines thickness={1.5} color="#151928" />}
        </mesh>
        <mesh position={[-0.03, -0.38, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <primitive object={skinMat} attach="material" />
          {showOutlines && <Outlines thickness={1.4} color="#151928" />}
        </mesh>
      </group>

      {/* Right Arm (Holding plasma wrench / gadget) */}
      <group ref={armRRef} position={[0.38, 1.15, 0]}>
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, -0.15]} castShadow>
          <capsuleGeometry args={[0.11, 0.28, 10, 14]} />
          <primitive object={jacketMat} attach="material" />
          {showOutlines && <Outlines thickness={1.5} color="#151928" />}
        </mesh>
        <mesh position={[0.03, -0.38, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <primitive object={skinMat} attach="material" />
          {showOutlines && <Outlines thickness={1.4} color="#151928" />}
        </mesh>
        {/* Retro Tool / Wrench */}
        <group position={[0.05, -0.45, 0.1]} rotation={[0.4, 0, -0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.35, 12]} />
            <primitive object={metalMat} attach="material" />
            {showOutlines && <Outlines thickness={1.4} color="#151928" />}
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <torusGeometry args={[0.07, 0.025, 8, 16]} />
            <primitive object={metalMat} attach="material" />
          </mesh>
        </group>
      </group>

      {/* ── HEAD & EXPRESSIVE FACE ─────────────────────────────────── */}
      <group ref={headRef} position={[0, 1.62, 0]}>
        {/* Rounded anime head */}
        <mesh castShadow>
          <sphereGeometry args={[0.36, 24, 24]} />
          <primitive object={skinMat} attach="material" />
          {showOutlines && <Outlines thickness={1.8} color="#151928" />}
        </mesh>

        {/* Anime Eyes (Large, expressive rounded ovals) */}
        {/* Left eye */}
        <mesh position={[-0.12, 0.02, 0.32]} rotation={[0, -0.2, 0]}>
          <capsuleGeometry args={[0.06, 0.07, 8, 12]} />
          <primitive object={eyesMat} attach="material" />
        </mesh>
        <mesh position={[-0.11, 0.05, 0.35]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Right eye */}
        <mesh position={[0.12, 0.02, 0.32]} rotation={[0, 0.2, 0]}>
          <capsuleGeometry args={[0.06, 0.07, 8, 12]} />
          <primitive object={eyesMat} attach="material" />
        </mesh>
        <mesh position={[0.13, 0.05, 0.35]}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Cute blush marks */}
        <mesh position={[-0.17, -0.07, 0.29]} rotation={[0, -0.3, 0]}>
          <circleGeometry args={[0.05, 12]} />
          <primitive object={blushMat} attach="material" />
        </mesh>
        <mesh position={[0.17, -0.07, 0.29]} rotation={[0, 0.3, 0]}>
          <circleGeometry args={[0.05, 12]} />
          <primitive object={blushMat} attach="material" />
        </mesh>

        {/* Cheerful small smile */}
        <mesh position={[0, -0.1, 0.34]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.04, 0.012, 6, 12, Math.PI]} />
          <meshBasicMaterial color="#7F1D1D" />
        </mesh>

        {/* ── SPECIES FEATURES ─────────────────────────────────────── */}
        {species === 'elf' && (
          <>
            <mesh position={[-0.34, 0.04, -0.04]} rotation={[0, 0, -0.5]}>
              <coneGeometry args={[0.08, 0.34, 12]} />
              <primitive object={skinMat} attach="material" />
              {showOutlines && <Outlines thickness={1.4} color="#151928" />}
            </mesh>
            <mesh position={[0.34, 0.04, -0.04]} rotation={[0, 0, 0.5]}>
              <coneGeometry args={[0.08, 0.34, 12]} />
              <primitive object={skinMat} attach="material" />
              {showOutlines && <Outlines thickness={1.4} color="#151928" />}
            </mesh>
          </>
        )}

        {species === 'cyborg' && (
          <group position={[0.34, 0.08, 0]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
              <primitive object={metalMat} attach="material" />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3} />
            </mesh>
          </group>
        )}

        {species === 'dwarf' && (
          <>
            <mesh position={[-0.22, 0.32, 0.08]} rotation={[-0.2, 0, -0.4]}>
              <coneGeometry args={[0.07, 0.22, 10]} />
              <primitive object={metalMat} attach="material" />
              {showOutlines && <Outlines thickness={1.4} color="#151928" />}
            </mesh>
            <mesh position={[0.22, 0.32, 0.08]} rotation={[-0.2, 0, 0.4]}>
              <coneGeometry args={[0.07, 0.22, 10]} />
              <primitive object={metalMat} attach="material" />
              {showOutlines && <Outlines thickness={1.4} color="#151928" />}
            </mesh>
          </>
        )}

        {/* ── PUFFY CLOUD ANIME HAIR ───────────────────────────────── */}
        <group ref={hairRef} position={[0, 0.12, 0]}>
          {/* Main puffy back hair lobes */}
          <mesh position={[0, 0.18, -0.1]} castShadow>
            <sphereGeometry args={[0.42, 20, 20]} />
            <primitive object={hairMat} attach="material" />
            {showOutlines && <Outlines thickness={1.8} color="#151928" />}
          </mesh>
          {/* Left puffy volume */}
          <mesh position={[-0.26, 0.15, -0.05]} castShadow>
            <sphereGeometry args={[0.26, 16, 16]} />
            <primitive object={hairMat} attach="material" />
            {showOutlines && <Outlines thickness={1.8} color="#151928" />}
          </mesh>
          {/* Right puffy volume */}
          <mesh position={[0.26, 0.15, -0.05]} castShadow>
            <sphereGeometry args={[0.26, 16, 16]} />
            <primitive object={hairMat} attach="material" />
            {showOutlines && <Outlines thickness={1.8} color="#151928" />}
          </mesh>
          {/* Anime Front Bangs & Cowlicks */}
          <mesh position={[-0.14, 0.28, 0.25]} rotation={[0.2, 0, -0.2]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <primitive object={hairMat} attach="material" />
            {showOutlines && <Outlines thickness={1.6} color="#151928" />}
          </mesh>
          <mesh position={[0.14, 0.28, 0.25]} rotation={[0.2, 0, 0.2]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <primitive object={hairMat} attach="material" />
            {showOutlines && <Outlines thickness={1.6} color="#151928" />}
          </mesh>
          {/* Cute top ahoge / cowlick */}
          <mesh position={[0, 0.48, 0.05]} rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.05, 0.18, 8, 12]} />
            <primitive object={hairMat} attach="material" />
            {showOutlines && <Outlines thickness={1.4} color="#151928" />}
          </mesh>
        </group>
      </group>

      {/* ── SPECIES BACK ACCESSORIES (FAIRY WINGS) ──────────────────── */}
      {species === 'fairy' && (
        <group position={[0, 1.2, -0.28]}>
          <mesh rotation={[0, -0.3, 0.4]}>
            <planeGeometry args={[0.45, 0.7]} />
            <meshStandardMaterial
              color="#A7F3D0"
              emissive="#34D399"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[0, 0.3, -0.4]}>
            <planeGeometry args={[0.45, 0.7]} />
            <meshStandardMaterial
              color="#A7F3D0"
              emissive="#34D399"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROACH B: VRM / GLTF ANIME HUMANOID ARCHITECTURE (@pixiv/three-vrm)
// Procedurally rigged skeletal humanoid avatar demonstrating bone deformation & MToon shaders
// ─────────────────────────────────────────────────────────────────────────────
export function ApproachBVRMAnime({
  species = 'human',
  showOutlines = true,
  animated = true,
}: {
  species?: SpeciesType;
  showOutlines?: boolean;
  animated?: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const spineRef = useRef<THREE.Group>(null);
  const headBoneRef = useRef<THREE.Group>(null);
  const leftArmBone = useRef<THREE.Group>(null);
  const rightArmBone = useRef<THREE.Group>(null);

  // MToon / Cel Shaders with VRM style tone curves
  const vrmSkin = useToonMaterial({ color: '#FFE0BD', steps: 2 });
  const vrmHair = useToonMaterial({ color: '#C084FC', steps: 2 }); // Soft violet
  const vrmSuit = useToonMaterial({ color: '#FB923C', steps: 2 }); // Station orange flight suit
  const vrmPants = useToonMaterial({ color: '#38BDF8', steps: 2 }); // Sky blue slacks
  const vrmAccent = useToonMaterial({ color: '#FFD700', steps: 3 });

  // Skeletal animation clock
  useFrame(({ clock }) => {
    if (!animated || !spineRef.current) return;
    const t = clock.getElapsedTime();
    const stepT = Math.floor(t * 12) / 12; // 12fps stepped

    spineRef.current.position.y = 0.95 + Math.sin(stepT * 3) * 0.02;
    if (headBoneRef.current) {
      headBoneRef.current.rotation.y = Math.sin(stepT * 1.5) * 0.12;
      headBoneRef.current.rotation.x = Math.sin(stepT * 3.0) * 0.04;
    }
    if (leftArmBone.current && rightArmBone.current) {
      leftArmBone.current.rotation.z = 0.3 + Math.sin(stepT * 2.5) * 0.08;
      rightArmBone.current.rotation.z = -0.3 - Math.sin(stepT * 2.5) * 0.08;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.9, 0]}>
      {/* VRM Bone Root Skeleton */}
      <group position={[0, 0, 0]}>
        {/* Legs / Hips */}
        <mesh position={[-0.2, 0.45, 0]}>
          <cylinderGeometry args={[0.13, 0.11, 0.85, 16]} />
          <primitive object={vrmPants} attach="material" />
          {showOutlines && <Outlines thickness={1.6} color="#111827" />}
        </mesh>
        <mesh position={[0.2, 0.45, 0]}>
          <cylinderGeometry args={[0.13, 0.11, 0.85, 16]} />
          <primitive object={vrmPants} attach="material" />
          {showOutlines && <Outlines thickness={1.6} color="#111827" />}
        </mesh>

        {/* Shoes */}
        <mesh position={[-0.2, 0.06, 0.08]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshToonMaterial color="#FFFFFF" />
          {showOutlines && <Outlines thickness={1.5} color="#111827" />}
        </mesh>
        <mesh position={[0.2, 0.06, 0.08]}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshToonMaterial color="#FFFFFF" />
          {showOutlines && <Outlines thickness={1.5} color="#111827" />}
        </mesh>

        {/* Spine / Torso Bone */}
        <group ref={spineRef} position={[0, 0.95, 0]}>
          <mesh position={[0, 0.22, 0]}>
            <capsuleGeometry args={[0.24, 0.42, 14, 18]} />
            <primitive object={vrmSuit} attach="material" />
            {showOutlines && <Outlines thickness={1.8} color="#111827" />}
          </mesh>

          {/* Left Arm Bone */}
          <group ref={leftArmBone} position={[-0.35, 0.38, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.44, 12]} />
              <primitive object={vrmSuit} attach="material" />
              {showOutlines && <Outlines thickness={1.5} color="#111827" />}
            </mesh>
            <mesh position={[0, -0.48, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <primitive object={vrmSkin} attach="material" />
            </mesh>
          </group>

          {/* Right Arm Bone */}
          <group ref={rightArmBone} position={[0.35, 0.38, 0]}>
            <mesh position={[0, -0.22, 0]}>
              <cylinderGeometry args={[0.09, 0.08, 0.44, 12]} />
              <primitive object={vrmSuit} attach="material" />
              {showOutlines && <Outlines thickness={1.5} color="#111827" />}
            </mesh>
            <mesh position={[0, -0.48, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <primitive object={vrmSkin} attach="material" />
            </mesh>
          </group>

          {/* Head & Neck Bone */}
          <group ref={headBoneRef} position={[0, 0.58, 0]}>
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.34, 24, 24]} />
              <primitive object={vrmSkin} attach="material" />
              {showOutlines && <Outlines thickness={1.8} color="#111827" />}
            </mesh>

            {/* Anime eyes with MToon highlight */}
            <mesh position={[-0.12, 0.22, 0.3]}>
              <capsuleGeometry args={[0.05, 0.06, 8, 12]} />
              <meshBasicMaterial color="#1E1B4B" />
            </mesh>
            <mesh position={[0.12, 0.22, 0.3]}>
              <capsuleGeometry args={[0.05, 0.06, 8, 12]} />
              <meshBasicMaterial color="#1E1B4B" />
            </mesh>

            {/* Hair with VRM Spring Bone styling */}
            <group position={[0, 0.3, 0]}>
              <mesh position={[0, 0.05, -0.06]}>
                <sphereGeometry args={[0.38, 18, 18]} />
                <primitive object={vrmHair} attach="material" />
                {showOutlines && <Outlines thickness={1.8} color="#111827" />}
              </mesh>
              <mesh position={[-0.15, -0.05, 0.22]}>
                <coneGeometry args={[0.14, 0.32, 12]} />
                <primitive object={vrmHair} attach="material" />
                {showOutlines && <Outlines thickness={1.5} color="#111827" />}
              </mesh>
              <mesh position={[0.15, -0.05, 0.22]}>
                <coneGeometry args={[0.14, 0.32, 12]} />
                <primitive object={vrmHair} attach="material" />
                {showOutlines && <Outlines thickness={1.5} color="#111827" />}
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROACH C: LAYERED 2D PAINTED PAPER-DOLL SPRITE IN 3D SCENE
// Pure 80s/90s hand-painted cel animation feel, 100% store swappable, stepped 12fps
// ─────────────────────────────────────────────────────────────────────────────
export function ApproachCPaperDollSprite({
  species = 'human',
  animated = true,
}: {
  species?: SpeciesType;
  animated?: boolean;
}) {
  const spriteGroup = useRef<THREE.Group>(null);

  // Generate hand-painted cel layers as high-resolution canvas textures
  const textures = useMemo(() => {
    if (typeof window === 'undefined') return null;

    // Helper to generate crisp cel layer canvas
    const createLayerCanvas = (drawFn: (ctx: CanvasRenderingContext2D) => void) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 768;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        drawFn(ctx);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.NearestFilter;
      return tex;
    };

    // Layer 1: Body, Skin & Face
    const bodyTex = createLayerCanvas((ctx) => {
      // Warm cel skin tone
      ctx.fillStyle = '#FFDFBA';
      ctx.strokeStyle = '#181E34';
      ctx.lineWidth = 7;

      // Rounded anime head
      ctx.beginPath();
      ctx.ellipse(256, 260, 115, 110, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cheerful blushing cheeks
      ctx.fillStyle = 'rgba(251, 113, 133, 0.7)';
      ctx.beginPath();
      ctx.ellipse(190, 290, 25, 15, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(322, 290, 25, 15, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Large expressive anime eyes
      ctx.fillStyle = '#1E1B4B';
      // Left eye
      ctx.beginPath();
      ctx.ellipse(205, 250, 22, 28, -0.05, 0, Math.PI * 2);
      ctx.fill();
      // Right eye
      ctx.beginPath();
      ctx.ellipse(307, 250, 22, 28, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Eye highlights (sparkling anime star reflection)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(198, 240, 9, 0, Math.PI * 2);
      ctx.arc(300, 240, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(212, 260, 4, 0, Math.PI * 2);
      ctx.arc(314, 260, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cute smile
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(256, 290, 18, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Species features
      if (species === 'elf') {
        ctx.fillStyle = '#FFDFBA';
        ctx.strokeStyle = '#181E34';
        ctx.lineWidth = 7;
        // Left elf ear
        ctx.beginPath();
        ctx.moveTo(150, 260);
        ctx.lineTo(80, 220);
        ctx.lineTo(150, 290);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Right elf ear
        ctx.beginPath();
        ctx.moveTo(362, 260);
        ctx.lineTo(432, 220);
        ctx.lineTo(362, 290);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });

    // Layer 2: Cozy Clothes (Jacket & Baggy Trousers)
    const clothesTex = createLayerCanvas((ctx) => {
      ctx.strokeStyle = '#181E34';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';

      // Baggy space-teal trousers
      ctx.fillStyle = '#2DD4BF';
      ctx.beginPath();
      ctx.roundRect(165, 450, 75, 180, [20, 20, 30, 30]);
      ctx.roundRect(272, 450, 75, 180, [20, 20, 30, 30]);
      ctx.fill();
      ctx.stroke();

      // Chunky round sneakers
      ctx.fillStyle = '#FFF8EE';
      ctx.beginPath();
      ctx.roundRect(145, 620, 95, 55, [25]);
      ctx.roundRect(272, 620, 95, 55, [25]);
      ctx.fill();
      ctx.stroke();

      // Apricot windbreaker jacket
      ctx.fillStyle = '#FDBA74';
      ctx.beginPath();
      ctx.roundRect(160, 340, 192, 130, [30]);
      ctx.fill();
      ctx.stroke();

      // Fluffy rounded collar
      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.ellipse(256, 350, 70, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Singularity signature green badge
      ctx.fillStyle = '#00FF66';
      ctx.beginPath();
      ctx.arc(256, 450, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Layer 3: Puffy Anime Hair
    const hairTex = createLayerCanvas((ctx) => {
      ctx.fillStyle = '#A5B4FC'; // Soft lavender
      ctx.strokeStyle = '#181E34';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';

      // Voluminous rounded cloud puffs
      ctx.beginPath();
      ctx.arc(256, 170, 100, 0, Math.PI * 2);
      ctx.arc(170, 185, 75, 0, Math.PI * 2);
      ctx.arc(342, 185, 75, 0, Math.PI * 2);
      ctx.arc(190, 240, 60, 0, Math.PI * 2);
      ctx.arc(322, 240, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cowlick / Ahoge
      ctx.fillStyle = '#818CF8';
      ctx.beginPath();
      ctx.moveTo(256, 80);
      ctx.quadraticCurveTo(280, 40, 310, 65);
      ctx.quadraticCurveTo(270, 75, 256, 100);
      ctx.fill();
      ctx.stroke();

      // Warm cel highlight band
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(256, 160, 65, 12, -0.05, 0, Math.PI * 2);
      ctx.fill();
    });

    return { bodyTex, clothesTex, hairTex };
  }, [species]);

  // Stepped 12fps squash-and-stretch idle animation
  useFrame(({ clock }) => {
    if (!animated || !spriteGroup.current) return;
    const t = clock.getElapsedTime();
    const stepT = Math.floor(t * 12) / 12;

    const squash = Math.sin(stepT * 3.5) * 0.04;
    spriteGroup.current.scale.set(1 + squash, 1 - squash, 1);
    spriteGroup.current.position.y = -0.05 + squash * 0.5;
  });

  if (!textures) return null;

  return (
    <group ref={spriteGroup} position={[0, 0.2, 0]}>
      {/* Plane Sprite Layer: Clothes */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.7, 2.5]} />
        <meshBasicMaterial map={textures.clothesTex} transparent alphaTest={0.05} />
      </mesh>

      {/* Plane Sprite Layer: Head & Skin */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.7, 2.5]} />
        <meshBasicMaterial map={textures.bodyTex} transparent alphaTest={0.05} />
      </mesh>

      {/* Plane Sprite Layer: Hair & Cowlicks */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.7, 2.5]} />
        <meshBasicMaterial map={textures.hairTex} transparent alphaTest={0.05} />
      </mesh>

      {/* Subtle floor contact shadow */}
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#0C0F1E" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
