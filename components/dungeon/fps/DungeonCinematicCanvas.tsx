// components/dungeon/fps/DungeonCinematicCanvas.tsx
// Cinematic 3D Real-time Subterranean Cyber-Ruin Backdrop for the Dungeon FPS Title Screen
// Features atmospheric fog, monolithic pillars with cyber runes, central quantum portal, floating embers, and mouse parallax

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── FLOATING EMBERS & ATMOSPHERIC DUST ───────────────────────────────────────
function FloatingEmbers({ count = 160 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate randomized positions, speeds, and scales for embers
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 28,
      y: Math.random() * 12 - 1,
      z: (Math.random() - 0.5) * 24 - 4,
      speedY: 0.25 + Math.random() * 0.5,
      driftX: (Math.random() - 0.5) * 0.15,
      scale: 0.04 + Math.random() * 0.07,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    particles.forEach((p, i) => {
      p.y += p.speedY * delta;
      p.x += Math.sin(time + p.phase) * p.driftX * delta;
      // Wrap around when rising too high
      if (p.y > 11) {
        p.y = -1;
        p.x = (Math.random() - 0.5) * 28;
      }

      dummy.position.set(p.x, p.y, p.z);
      const pulseScale = p.scale * (0.8 + 0.4 * Math.sin(time * 2 + p.phase));
      dummy.scale.set(pulseScale, pulseScale, pulseScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#00FF66" transparent opacity={0.65} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

// ─── CENTRAL QUANTUM MONOLITH & PORTAL RINGS ─────────────────────────────────
function QuantumMonolith() {
  const ring1Ref = useRef<THREE.Group>(null!);
  const ring2Ref = useRef<THREE.Group>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.4;
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.6;
      ring2Ref.current.rotation.y = Math.cos(time * 0.6) * 0.2;
    }
    if (coreRef.current) {
      const scale = 1 + 0.08 * Math.sin(time * 3);
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 3.5, -12]}>
      {/* Outer Holographic Energy Ring */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[3.2, 0.08, 16, 64]} />
          <meshStandardMaterial
            color="#00FF66"
            emissive="#00FF66"
            emissiveIntensity={2.5}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Inner Counter-Rotating Hex Ring */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[2.2, 0.06, 12, 48]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={3}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Glowing Pulsing Core Orb */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial
          color="#052E16"
          emissive="#00FF66"
          emissiveIntensity={2}
          roughness={0.1}
          metalness={0.9}
          wireframe
        />
      </mesh>

      {/* Core Point Light */}
      <pointLight color="#00FF66" intensity={3.5} distance={18} decay={2} />
      <pointLight color="#38BDF8" intensity={1.5} distance={12} decay={2} />

      {/* Energy Pillar Beaming Vertically */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 14, 16]} />
        <meshBasicMaterial
          color="#00FF66"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ─── CYBER-RUIN MONOLITHS & ARCHITECTURE ──────────────────────────────────────
function RuinArchitecture() {
  const pillars = useMemo(() => [
    { x: -7, z: -3, h: 10, r: 0.9 },
    { x: 7, z: -3, h: 10, r: 0.9 },
    { x: -10, z: -8, h: 12, r: 1.1 },
    { x: 10, z: -8, h: 12, r: 1.1 },
    { x: -5, z: -14, h: 11, r: 0.8 },
    { x: 5, z: -14, h: 11, r: 0.8 },
  ], []);

  return (
    <group>
      {/* Ground: Dark Basalt Slabs with Circuit Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial
          color="#0b1711"
          roughness={0.8}
          metalness={0.4}
        />
      </mesh>

      {/* Grid Floor Overlay with Neon Seams */}
      <gridHelper
        args={[48, 24, '#00FF66', '#092416']}
        position={[0, 0.02, -6]}
      />

      {/* Stone Pillars Framing the View */}
      {pillars.map((p, idx) => (
        <group key={idx} position={[p.x, p.h / 2, p.z]}>
          {/* Main Pillar Body */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[p.r, p.r * 1.15, p.h, 8]} />
            <meshStandardMaterial
              color="#13231a"
              roughness={0.85}
              metalness={0.3}
            />
          </mesh>

          {/* Glowing Vertical Rune Inlay */}
          <mesh position={[0, 0, p.r * 0.95]}>
            <boxGeometry args={[0.15, p.h * 0.75, 0.08]} />
            <meshBasicMaterial color="#00FF66" />
          </mesh>
        </group>
      ))}

      {/* Back Wall / Ruin Backdrop */}
      <mesh position={[0, 7, -19]}>
        <planeGeometry args={[50, 16]} />
        <meshStandardMaterial
          color="#06120b"
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

// ─── PARALLAX CAMERA CONTROLLER ───────────────────────────────────────────────
function CinematicCamera() {
  const { camera } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current = { x, y };
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    // Gentle idle float + smooth mouse parallax
    const targetX = mouseRef.current.x * 1.4 + Math.sin(time * 0.3) * 0.4;
    const targetY = 2.4 + mouseRef.current.y * 0.6 + Math.cos(time * 0.4) * 0.2;
    const targetZ = 3.5;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 2.5);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 2.5);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 2.5);

    // Look towards the central portal
    camera.lookAt(0, 3.2, -12);
  });

  return null;
}

export function DungeonCinematicCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 2.5, 3.5], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#040906']} />
        <fogExp2 attach="fog" args={['#040d07', 0.045]} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.4} color="#0d261a" />
        <directionalLight position={[5, 12, 6]} intensity={1.2} color="#86efac" />
        <directionalLight position={[-8, 6, -4]} intensity={0.8} color="#38bdf8" />

        {/* Dynamic Scene Objects */}
        <CinematicCamera />
        <RuinArchitecture />
        <QuantumMonolith />
        <FloatingEmbers count={180} />
      </Canvas>

      {/* Atmospheric Film Grain / Vignette Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25 pointer-events-none" />
    </div>
  );
}
