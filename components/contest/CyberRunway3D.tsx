'use client';
// components/contest/CyberRunway3D.tsx
// High-Fashion Cyberpunk Runway 3D Canvas
// The avatar stands on a giant holographic catwalk with reactive volumetric spotlights,
// turntable dais that rotates on hover, expanding plasma shockwaves, and floating neon heart bursts on vote.

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Heart, Sparkles } from 'lucide-react';
import { AvatarConfig } from '@/types/avatar';
import { AvatarModel, getBodyProps } from '@/components/avatar/AvatarModel';

export interface CyberRunwayProps {
  avatar: AvatarConfig;
  name: string;
  teamName: string;
  likes: number;
  styleScore?: number;
  isHovered?: boolean;
  isVoted?: boolean;
  votePulse?: number;
  onVote?: () => void;
  onHoverChange?: (hovered: boolean) => void;
  interactive?: boolean;
  cameraOrbit?: boolean;
}

// Dais floor level in world space
const Y_FLOOR = -0.92;

// ─── 3D GIANT HOLOGRAPHIC RUNWAY ───────────────────────────────────────────
function HolographicRunwayStage({
  isHovered,
  isVoted,
  votePulse,
}: {
  isHovered: boolean;
  isVoted: boolean;
  votePulse: number;
}) {
  const runwayGlowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const pulseWaveRef = useRef<THREE.Mesh>(null);
  const pulseTime = useRef(999);

  // Trigger pulse wave on vote change
  useEffect(() => {
    if (votePulse > 0) {
      pulseTime.current = 0;
    }
  }, [votePulse]);

  useFrame((_, delta) => {
    // Rotating runway holographic dial
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * (isHovered ? 1.8 : 0.4);
    }

    // Dynamic runway edge breathing
    if (runwayGlowRef.current) {
      const mat = runwayGlowRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = isHovered ? 2.5 : 1.2;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, delta * 6);
    }

    // Expanding shockwave pulse on vote
    if (pulseWaveRef.current && pulseTime.current < 1.2) {
      pulseTime.current += delta;
      const progress = pulseTime.current / 1.2;
      const scale = 0.5 + progress * 4.2;
      pulseWaveRef.current.scale.set(scale, scale, 1);
      const mat = pulseWaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - progress);
    }
  });

  return (
    <group position={[0, Y_FLOOR, 0]}>
      {/* ── 1. MAIN RUNWAY CATWALK (EXTENDS FORWARD & BACKWARD) ── */}
      <mesh position={[0, -0.1, 1.2]} receiveShadow>
        <boxGeometry args={[2.8, 0.18, 7.5]} />
        <meshStandardMaterial
          color="#03080A"
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* ── 2. GLASS / TRANSLUCENT RUNWAY TOP SURFACE ── */}
      <mesh position={[0, 0.002, 1.2]} receiveShadow>
        <planeGeometry args={[2.5, 7.3]} />
        <meshStandardMaterial
          color="#FF007F"
          emissive="#FF007F"
          emissiveIntensity={isHovered ? 0.45 : 0.15}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* ── 3. RUNWAY SIDE NEON RAILS (MAGENTA & GREEN) ── */}
      {/* Left Rail */}
      <mesh ref={runwayGlowRef} position={[-1.32, 0.04, 1.2]}>
        <boxGeometry args={[0.08, 0.08, 7.4]} />
        <meshStandardMaterial
          color="#FF007F"
          emissive="#FF007F"
          emissiveIntensity={1.8}
        />
      </mesh>
      {/* Right Rail */}
      <mesh position={[1.32, 0.04, 1.2]}>
        <boxGeometry args={[0.08, 0.08, 7.4]} />
        <meshStandardMaterial
          color="#00FF66"
          emissive="#00FF66"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* ── 4. RUNWAY CHEVRONS / STRIPES ── */}
      {[-2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0].map((z, idx) => (
        <mesh key={idx} position={[0, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 0.04]} />
          <meshBasicMaterial
            color={idx % 2 === 0 ? '#FF007F' : '#00FF66'}
            transparent
            opacity={isHovered ? 0.75 : 0.35}
          />
        </mesh>
      ))}

      {/* ── 5. CIRCULAR MODEL TURNTABLE DAIS (CENTER STAGE) ── */}
      <group position={[0, 0.01, 0]}>
        {/* Obsidian platform base */}
        <mesh position={[0, -0.04, 0]} receiveShadow>
          <cylinderGeometry args={[1.4, 1.55, 0.1, 48]} />
          <meshStandardMaterial color="#0A0B10" roughness={0.2} metalness={0.92} />
        </mesh>

        {/* Outer glowing runway ring */}
        <mesh position={[0, 0.012, 0]}>
          <ringGeometry args={[1.34, 1.42, 48]} />
          <meshStandardMaterial
            color="#FF007F"
            emissive="#FF007F"
            emissiveIntensity={isHovered ? 3.0 : 1.5}
          />
        </mesh>

        {/* Rotating holographic ring glyphs */}
        <group ref={ringRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.95, 1.02, 36]} />
            <meshBasicMaterial
              color="#00FF66"
              transparent
              opacity={isHovered ? 0.9 : 0.5}
              wireframe
            />
          </mesh>
        </group>

        {/* Inner runway stage circle */}
        <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 36]} />
          <meshStandardMaterial
            color="#080312"
            emissive="#FF007F"
            emissiveIntensity={isHovered ? 0.35 : 0.1}
            roughness={0.25}
          />
        </mesh>

        {/* Center spotlight beacon marker */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.32, 24]} />
          <meshBasicMaterial color="#00FF66" />
        </mesh>
      </group>

      {/* ── 6. EXPANDING SHOCKWAVE PULSE RING ON VOTE ── */}
      <mesh
        ref={pulseWaveRef}
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[0.01, 0.01, 1]}
      >
        <ringGeometry args={[0.85, 1.05, 32]} />
        <meshBasicMaterial color="#FF007F" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── 7. RUNWAY LIGHTING BEACONS (FLANKING SIDES) ── */}
      {[-1.5, 0.0, 1.5, 3.0].map((z, i) => (
        <group key={i}>
          {/* Left beacon post */}
          <mesh position={[-1.55, 0.35, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
            <meshStandardMaterial color="#FF007F" emissive="#FF007F" emissiveIntensity={isHovered ? 2.5 : 1.2} />
          </mesh>
          <pointLight position={[-1.55, 0.75, z]} color="#FF007F" intensity={isHovered ? 1.5 : 0.6} distance={2.5} />

          {/* Right beacon post */}
          <mesh position={[1.55, 0.35, z]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
            <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={isHovered ? 2.5 : 1.2} />
          </mesh>
          <pointLight position={[1.55, 0.75, z]} color="#00FF66" intensity={isHovered ? 1.5 : 0.6} distance={2.5} />
        </group>
      ))}
    </group>
  );
}

// ─── 3D FLOATING NEON HEARTS BURST (ON VOTE) ────────────────────────────────
function HeartParticles3D({ votePulse }: { votePulse: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      radius: 0.35 + (i % 3) * 0.25,
      speed: 1.2 + (i % 4) * 0.4,
      driftX: (Math.sin(i * 1.5) * 0.3),
      driftZ: (Math.cos(i * 1.5) * 0.3),
      scale: 0.12 + (i % 3) * 0.05,
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const animTime = useRef(999);

  useEffect(() => {
    if (votePulse > 0) {
      animTime.current = 0;
    }
  }, [votePulse]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (animTime.current < 2.0) {
      animTime.current += delta;
      const progress = animTime.current / 2.0;

      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        child.position.y = Y_FLOOR + 0.3 + progress * 2.8 * p.speed;
        child.position.x = Math.cos(p.angle) * p.radius + progress * p.driftX;
        child.position.z = Math.sin(p.angle) * p.radius + progress * p.driftZ;
        child.rotation.y += delta * 3;
        child.rotation.z += delta * 2;
        const fade = Math.sin(progress * Math.PI);
        child.scale.setScalar(p.scale * Math.max(0.01, fade));
      });
    } else {
      groupRef.current.children.forEach((child) => child.scale.setScalar(0.001));
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i} scale={0.001}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color="#FF007F"
            emissive="#FF007F"
            emissiveIntensity={3.5}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── RUNWAY LIGHTING & SPOTLIGHT CONTROLLER ─────────────────────────────────
function RunwaySpotlights({ isHovered, isVoted }: { isHovered: boolean; isVoted: boolean }) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const fillSpotRef = useRef<THREE.SpotLight>(null);

  useFrame((_, delta) => {
    // The spotlight intensifies on hover or vote!
    const targetIntensity = isVoted ? 8.0 : isHovered ? 5.5 : 2.4;
    if (spotRef.current) {
      spotRef.current.intensity = THREE.MathUtils.lerp(
        spotRef.current.intensity,
        targetIntensity,
        delta * 5
      );
    }
    if (fillSpotRef.current) {
      fillSpotRef.current.intensity = THREE.MathUtils.lerp(
        fillSpotRef.current.intensity,
        isHovered ? 3.2 : 1.4,
        delta * 5
      );
    }
  });

  return (
    <>
      {/* ── KEY FASHION SPOTLIGHT (OVERHEAD CONE DIRECTLY ON AVATAR) ── */}
      <spotLight
        ref={spotRef}
        position={[0, 4.8, 1.8]}
        target-position={[0, 0.4, 0]}
        intensity={2.4}
        angle={Math.PI / 5.5}
        penumbra={0.65}
        color={isHovered ? '#FFF0F8' : '#FFE5F0'}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* ── MAGENTA RIM / DRAMATIC CONTOUR LIGHT ── */}
      <spotLight
        ref={fillSpotRef}
        position={[-2.8, 3.5, -2.5]}
        target-position={[0, 0.5, 0]}
        intensity={1.4}
        angle={Math.PI / 4}
        color="#FF007F"
      />

      {/* ── CYAN BACKLIGHT / HIGH-FASHION SEPARATION ── */}
      <directionalLight position={[2.8, 2.5, -2.0]} intensity={1.6} color="#00FF66" />

      {/* ── AMBIENT BASE NOIR ── */}
      <ambientLight intensity={0.4} color="#0A0514" />
      <hemisphereLight args={['#250C2C', '#020503', 0.6]} />

      {/* ── UNDER-DAIS GLOW FLARE ── */}
      <pointLight
        position={[0, Y_FLOOR + 0.1, 0]}
        color={isHovered ? '#FF007F' : '#00FF66'}
        intensity={isHovered ? 3.0 : 1.5}
        distance={3.5}
      />
    </>
  );
}

// ─── AVATAR MODEL WITH TURNTABLE ROTATION ───────────────────────────────────
function RunwayAvatarModel({
  avatar,
  isHovered,
}: {
  avatar: AvatarConfig;
  isHovered: boolean;
}) {
  const modelGroupRef = useRef<THREE.Group>(null);
  const rotSpeedRef = useRef(0.4);

  // Compute anatomical placement so shoes align perfectly with Y_FLOOR
  const props = getBodyProps(avatar);
  const avatarGroupY = Y_FLOOR + (0.36 * props.torsoHScale + 0.58 * props.legScale) * props.totalScale;

  useFrame((_, delta) => {
    if (!modelGroupRef.current) return;

    // The avatar rotates smoothly on the runway!
    // When hovered, the rotation gracefully speeds up or poses
    const targetSpeed = isHovered ? 1.25 : 0.42;
    rotSpeedRef.current = THREE.MathUtils.lerp(rotSpeedRef.current, targetSpeed, delta * 3.5);
    modelGroupRef.current.rotation.y += delta * rotSpeedRef.current;
  });

  return (
    <group ref={modelGroupRef} position={[0, avatarGroupY, 0]}>
      <AvatarModel config={avatar} animate={true} action="idle" />
    </group>
  );
}

// ─── HOLOGRAPHIC STYLE SCORE TELEMETRY CARD (AS SHOWN IN USER DIAGRAM) ──────
function FloatingStyleScoreHUD({
  name,
  teamName,
  likes,
  styleScore,
  isHovered,
  isVoted,
  onVote,
}: {
  name: string;
  teamName: string;
  likes: number;
  styleScore: number;
  isHovered: boolean;
  isVoted: boolean;
  onVote?: () => void;
}) {
  return (
    <group position={[1.4, 0.9, 0.2]}>
      <Html distanceFactor={10} center>
        <div
          className={`select-none transition-all duration-300 pointer-events-auto ${
            isHovered ? 'scale-105 opacity-100' : 'opacity-85 hover:opacity-100'
          }`}
        >
          {/* Top connection spark indicator */}
          <div className="flex flex-col items-center">
            <Sparkles size={14} className="text-[#FF007F] animate-pulse" />
            <span className="text-[9px] font-mono text-[#FF007F] font-black uppercase tracking-widest mt-0.5">
              AVATAR
            </span>
            <div className="w-px h-3 bg-gradient-to-b from-[#FF007F] to-transparent" />
          </div>

          {/* Holographic Fashion Week Badge Card */}
          <div
            className={`w-44 p-3 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.8)] ${
              isVoted
                ? 'bg-[#FF007F]/20 border-[#FF007F] shadow-[0_0_25px_rgba(255,0,127,0.5)]'
                : isHovered
                ? 'bg-black/90 border-[#FF007F]/80 shadow-[0_0_20px_rgba(255,0,127,0.35)]'
                : 'bg-black/80 border-white/20'
            }`}
          >
            {/* Model Name & Category */}
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
              <span
                className="text-xs font-black uppercase tracking-wider text-white truncate max-w-[110px]"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {name}
              </span>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#FF007F]/20 text-[#FF007F] border border-[#FF007F]/40 font-bold">
                LOOK
              </span>
            </div>

            {/* Team Designation */}
            <p className="text-[9px] font-mono text-white/50 mb-2 truncate">
              BY {teamName}
            </p>

            {/* STYLE SCORE & HEARTS */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <div className="px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                <span className="text-[8px] font-mono text-white/40 uppercase">STYLE</span>
                <span className="text-xs font-black font-mono text-[#00FF66]">
                  {styleScore}
                </span>
              </div>
              <div className="px-2 py-1.5 rounded-xl bg-[#FF007F]/10 border border-[#FF007F]/30 flex flex-col items-center">
                <span className="text-[8px] font-mono text-[#FF007F]/80 uppercase">LIKES</span>
                <span className="text-xs font-black font-mono text-[#FF007F] flex items-center gap-1">
                  <Heart size={11} className="fill-current text-[#FF007F]" />
                  <span>{likes}</span>
                </span>
              </div>
            </div>

            {/* VOTE BUTTON */}
            {onVote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote();
                }}
                className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-lg ${
                  isVoted
                    ? 'bg-[#FF007F] text-white shadow-[0_0_15px_#FF007F]'
                    : 'bg-gradient-to-r from-[#FF007F] to-[#FF5C93] text-white hover:brightness-110'
                }`}
              >
                <Heart size={11} className={isVoted ? 'fill-current' : ''} />
                <span>{isVoted ? 'VOTED' : 'VOTE'}</span>
              </button>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── MAIN 3D CYBER RUNWAY CANVAS ───────────────────────────────────────────
export function CyberRunway3D({
  avatar,
  name,
  teamName,
  likes,
  styleScore = 95,
  isHovered: externalHovered,
  isVoted = false,
  votePulse = 0,
  onVote,
  onHoverChange,
  interactive = true,
  cameraOrbit = true,
}: CyberRunwayProps) {
  const [internalHovered, setInternalHovered] = useState(false);
  const isHovered = externalHovered ?? internalHovered;

  const handlePointerEnter = () => {
    setInternalHovered(true);
    onHoverChange?.(true);
  };

  const handlePointerLeave = () => {
    setInternalHovered(false);
    onHoverChange?.(false);
  };

// ─── AMBIENT RUNWAY STARDUST PARTICLES ──────────────────────────────────────
function RunwayStardustParticles() {
  const points = useMemo(() => {
    const p = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) {
      p[i * 3] = (Math.random() - 0.5) * 8;
      p[i * 3 + 1] = Y_FLOOR + Math.random() * 4.5;
      p[i * 3 + 2] = (Math.random() - 0.5) * 8 + 1.0;
    }
    return p;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        color="#FF007F"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

  return (
    <div
      className="relative w-full h-full bg-[#020406] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.45, 3.4], fov: 42 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020406']} />
        <fog attach="fog" args={['#020406', 7, 20]} />

        {/* ── High-Fashion Slow Cinematic Orbit Controls ── */}
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.6}
          maxDistance={6.0}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 6}
          autoRotate={cameraOrbit}
          autoRotateSpeed={isHovered ? 1.6 : 0.65}
          target={[0, 0.15, 0]}
        />

        {/* ── Ambient Runway Stardust Particles ── */}
        <RunwayStardustParticles />

        {/* ── Spotlights & Lighting ── */}
        <RunwaySpotlights isHovered={isHovered} isVoted={isVoted} />

        {/* ── Holographic Catwalk & Dais ── */}
        <HolographicRunwayStage
          isHovered={isHovered}
          isVoted={isVoted}
          votePulse={votePulse}
        />

        {/* ── 3D Heart Burst on Vote ── */}
        <HeartParticles3D votePulse={votePulse} />

        {/* ── The Avatar on Turntable ── */}
        <RunwayAvatarModel avatar={avatar} isHovered={isHovered} />

        {/* ── Ground Contact Shadows for Realistic Grounding ── */}
        <ContactShadows
          position={[0, Y_FLOOR + 0.005, 0]}
          opacity={0.85}
          scale={4.5}
          blur={1.8}
          far={2.5}
        />

        {/* ── Floating Holographic Style Score HUD ── */}
        {interactive && (
          <FloatingStyleScoreHUD
            name={name}
            teamName={teamName}
            likes={likes}
            styleScore={styleScore}
            isHovered={isHovered}
            isVoted={isVoted}
            onVote={onVote}
          />
        )}

        {/* ── Post-Processing: Bloom for Catwalk Rails & Spotlights ── */}
        <EffectComposer>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.8}
            radius={0.75}
          />
          <Vignette eskil={false} offset={0.15} darkness={0.65} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
