'use client';
// components/arena/Attack3DEffects.tsx
// Rich, distinct 3D visual effects for every species-specific attack,
// dynamic acrobatic dodge with phantom afterimages, and dramatic critical hit scenes.

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Wind } from 'lucide-react';
import * as THREE from 'three';

// ─── 1. Phantom Dodge Evasion Effect ────────────────────────────────────────

export function PhantomDodgeEffect({
  position,
  facing = 'right',
}: {
  position: [number, number, number];
  facing?: 'right' | 'left';
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const afterimage1Ref = useRef<THREE.Mesh>(null);
  const afterimage2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.scale.multiplyScalar(1.08);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 2.2);
    }
    if (afterimage1Ref.current) {
      afterimage1Ref.current.position.x += (facing === 'right' ? -delta * 1.8 : delta * 1.8);
      const mat = afterimage1Ref.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 2.0);
    }
    if (afterimage2Ref.current) {
      afterimage2Ref.current.position.x += (facing === 'right' ? -delta * 3.2 : delta * 3.2);
      const mat = afterimage2Ref.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 2.6);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Expanding Vapor Sonic Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[0.4, 0.7, 32]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Holographic Phantom Afterimage 1 */}
      <mesh ref={afterimage1Ref} position={[facing === 'right' ? -0.2 : 0.2, 0.4, 0]}>
        <capsuleGeometry args={[0.25, 0.7, 8, 16]} />
        <meshBasicMaterial color="#38BDF8" wireframe transparent opacity={0.6} />
      </mesh>

      {/* Holographic Phantom Afterimage 2 */}
      <mesh ref={afterimage2Ref} position={[facing === 'right' ? -0.45 : 0.45, 0.4, 0]}>
        <capsuleGeometry args={[0.22, 0.65, 8, 16]} />
        <meshBasicMaterial color="#00FF66" wireframe transparent opacity={0.4} />
      </mesh>

      {/* 3D Floating Holographic Evasion Badge */}
      <group position={[0, 1.4, 0]}>
        <Html center distanceFactor={8}>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.6)] backdrop-blur-md select-none pointer-events-none animate-in fade-in zoom-in-75 duration-200">
            <Wind size={13} className="text-cyan-300" aria-hidden="true" />
            <span className="text-xs font-black font-mono tracking-wider text-cyan-300 drop-shadow">
              PERFECT EVASION!
            </span>
          </div>
        </Html>
      </group>

      <pointLight color="#38BDF8" intensity={4} distance={3.5} />
    </group>
  );
}

// ─── 2. Dramatic Critical Hit Impact Scene ───────────────────────────────────

export function CriticalHitImpactScene({
  position,
  color = '#F59E0B',
}: {
  position: [number, number, number];
  color?: string;
}) {
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const shardsGroupRef = useRef<THREE.Group>(null);

  const shardData = useMemo(() => {
    return Array.from({ length: 20 }).map(() => ({
      dir: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.8 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize(),
      speed: Math.random() * 6 + 3,
      rotSpeed: (Math.random() - 0.5) * 15,
      size: Math.random() * 0.12 + 0.05,
    }));
  }, []);

  useFrame((_, delta) => {
    if (shockwaveRef.current) {
      shockwaveRef.current.scale.multiplyScalar(1.12);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 2.2);
    }
    if (flashRef.current) {
      flashRef.current.scale.multiplyScalar(1.08);
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, mat.opacity - delta * 3.5);
    }
    if (shardsGroupRef.current) {
      shardsGroupRef.current.children.forEach((child, i) => {
        const s = shardData[i];
        child.position.addScaledVector(s.dir, s.speed * delta);
        child.rotation.x += s.rotSpeed * delta;
        child.rotation.y += s.rotSpeed * delta;
        (child as THREE.Mesh).scale.multiplyScalar(0.92);
      });
    }
  });

  return (
    <group position={position}>
      {/* Screen-Wide Chromatic Shockwave Ring */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[0.5, 1.8, 36]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Explosive Starburst Core */}
      <mesh ref={flashRef} position={[0, 0.4, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshBasicMaterial color="#FBBF24" transparent opacity={0.95} wireframe />
      </mesh>

      {/* 20 Kinetic Shard Fragments */}
      <group ref={shardsGroupRef} position={[0, 0.4, 0]}>
        {shardData.map((s, i) => (
          <mesh key={i}>
            <tetrahedronGeometry args={[s.size, 0]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#EF4444' : '#F59E0B'} />
          </mesh>
        ))}
      </group>

      {/* High-Intensity Dramatic Strobe Light */}
      <pointLight color="#F59E0B" intensity={12} distance={6} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─── 3. Human Attack 3D Effects ─────────────────────────────────────────────

// Photon Blade (Double X-Slash)
export function PhotonBladeEffect({
  position,
  facing,
}: {
  position: [number, number, number];
  facing: 'right' | 'left';
}) {
  const mesh1Ref = useRef<THREE.Mesh>(null);
  const mesh2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (mesh1Ref.current) {
      mesh1Ref.current.rotation.z += delta * (facing === 'right' ? -16 : 16);
      mesh1Ref.current.scale.multiplyScalar(1.05);
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.rotation.z += delta * (facing === 'right' ? 16 : -16);
      mesh2Ref.current.scale.multiplyScalar(1.05);
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh1Ref} rotation={[0, facing === 'right' ? 0 : Math.PI, 0]}>
        <ringGeometry args={[0.6, 1.5, 32, 1, 0, Math.PI * 0.85]} />
        <meshBasicMaterial color="#00FF66" side={THREE.DoubleSide} transparent opacity={0.95} />
      </mesh>
      <mesh ref={mesh2Ref} rotation={[0, facing === 'right' ? 0 : Math.PI, Math.PI / 2]}>
        <ringGeometry args={[0.4, 1.3, 32, 1, 0, Math.PI * 0.85]} />
        <meshBasicMaterial color="#38BDF8" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <pointLight color="#00FF66" intensity={6} distance={4} />
    </group>
  );
}

// Plasma Burst (Ionized Projectile with orbiting electron rings)
export function PlasmaBurstEffect({
  source,
  target,
}: {
  source: [number, number, number];
  target: [number, number, number];
}) {
  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (!coreRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 16) + 1) / 2;
    coreRef.current.position.x = THREE.MathUtils.lerp(source[0], target[0], t);
    coreRef.current.position.y = THREE.MathUtils.lerp(source[1], target[1], t);
    coreRef.current.position.z = THREE.MathUtils.lerp(source[2], target[2], t);

    if (ring1Ref.current) ring1Ref.current.rotation.x += delta * 12;
    if (ring2Ref.current) ring2Ref.current.rotation.y += delta * 14;
  });

  return (
    <group ref={coreRef}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#22D3EE" />
      </mesh>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.5, 0.03, 8, 24]} />
        <meshBasicMaterial color="#06B6D4" />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.03, 8, 24]} />
        <meshBasicMaterial color="#67E8F9" />
      </mesh>
      <pointLight color="#22D3EE" intensity={6} distance={5} />
    </group>
  );
}

// Singularity Overdrive (Quantum Helix Beam + Event Horizon Vortex)
export function SingularityOverdriveEffect({
  source,
  target,
}: {
  source: [number, number, number];
  target: [number, number, number];
}) {
  const vortexRef = useRef<THREE.Mesh>(null);
  const accretionRef = useRef<THREE.Mesh>(null);
  const helixRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (vortexRef.current) vortexRef.current.rotation.z += delta * 18;
    if (accretionRef.current) accretionRef.current.rotation.z -= delta * 12;
    if (helixRef.current) helixRef.current.rotation.x += delta * 14;
  });

  // Calculate mid-point and beam length
  const midX = (source[0] + target[0]) / 2;
  const midY = (source[1] + target[1]) / 2;
  const length = Math.abs(target[0] - source[0]);

  return (
    <group>
      {/* Central Quantum Laser Beam */}
      <mesh position={[midX, midY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, length, 12]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>

      {/* Rotating Energy Helix Shell */}
      <group ref={helixRef} position={[midX, midY, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, length, 8, 1, true]} />
          <meshBasicMaterial color="#FBBF24" wireframe transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Collapsing Singularity Vortex at Target */}
      <group position={target}>
        <mesh ref={vortexRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 1.4, 32]} />
          <meshBasicMaterial color="#D97706" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={accretionRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 1.8, 24]} />
          <meshBasicMaterial color="#F59E0B" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <pointLight color="#F59E0B" intensity={8} distance={6} />
      </group>
    </group>
  );
}

// ─── 4. Elf Attack 3D Effects ───────────────────────────────────────────────

// Sylph Arrow (Trio of Piercing Wind Crystal Arrows)
export function SylphArrowEffect({
  source,
  target,
}: {
  source: [number, number, number];
  target: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 18) + 1) / 2;
    groupRef.current.position.x = THREE.MathUtils.lerp(source[0], target[0], t);
    groupRef.current.position.y = THREE.MathUtils.lerp(source[1], target[1], t);
    groupRef.current.position.z = THREE.MathUtils.lerp(source[2], target[2], t);
  });

  const isRight = target[0] > source[0];

  return (
    <group ref={groupRef}>
      {/* 3 Staggered Piercing Crystal Arrows */}
      {[-0.15, 0, 0.15].map((offsetY, i) => (
        <group key={i} position={[isRight ? -i * 0.3 : i * 0.3, offsetY, 0]}>
          <mesh rotation={[0, 0, isRight ? -Math.PI / 2 : Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.6, 6]} />
            <meshBasicMaterial color="#38BDF8" />
          </mesh>
          {/* Wind vapor trail */}
          <mesh position={[isRight ? -0.4 : 0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.08, 0.8, 6]} />
            <meshBasicMaterial color="#BAE6FD" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
      <pointLight color="#38BDF8" intensity={5} distance={4} />
    </group>
  );
}

// Nature Surge (Spiraling Emerald Vine Spores Erupting from Ground)
export function NatureSurgeEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const tendril1Ref = useRef<THREE.Mesh>(null);
  const tendril2Ref = useRef<THREE.Mesh>(null);
  const sporesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (tendril1Ref.current) {
      tendril1Ref.current.rotation.y += delta * 6;
      tendril1Ref.current.position.y = (t % 1.2) * 1.5 - 0.4;
    }
    if (tendril2Ref.current) {
      tendril2Ref.current.rotation.y -= delta * 7;
      tendril2Ref.current.position.y = ((t + 0.6) % 1.2) * 1.5 - 0.4;
    }
    if (sporesRef.current) {
      sporesRef.current.rotation.y += delta * 3;
    }
  });

  return (
    <group position={position}>
      {/* Spiraling Emerald Vine Tendrils */}
      <mesh ref={tendril1Ref} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 1.6, 8, 1, true]} />
        <meshBasicMaterial color="#34D399" wireframe transparent opacity={0.8} />
      </mesh>
      <mesh ref={tendril2Ref} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.45, 0.65, 1.4, 8, 1, true]} />
        <meshBasicMaterial color="#059669" wireframe transparent opacity={0.6} />
      </mesh>

      {/* Floating Spore Particles */}
      <group ref={sporesRef} position={[0, 0.5, 0]}>
        {[0, 1, 2, 3, 4, 5].map((idx) => {
          const angle = (idx / 6) * Math.PI * 2;
          return (
            <mesh key={idx} position={[Math.cos(angle) * 0.6, (idx % 3) * 0.3, Math.sin(angle) * 0.6]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#6EE7B7" />
            </mesh>
          );
        })}
      </group>

      <pointLight color="#34D399" intensity={6} distance={4.5} position={[0, 0.6, 0]} />
    </group>
  );
}

// Celestial Tempest (Downward Starburst Lightning Pillars)
export function CelestialTempestEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const stormRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (stormRef.current) {
      stormRef.current.rotation.y += delta * 4;
    }
  });

  return (
    <group ref={stormRef} position={position}>
      {/* 3 Striking Celestial Light Pillars */}
      {[-0.35, 0, 0.35].map((xOff, i) => (
        <group key={i} position={[xOff, 1.2, (i - 1) * 0.2]}>
          <mesh>
            <cylinderGeometry args={[0.07, 0.18, 3.2, 8]} />
            <meshBasicMaterial color="#22D3EE" transparent opacity={0.85} />
          </mesh>
          {/* Ground Impact Ring */}
          <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.2, 0.6, 24]} />
            <meshBasicMaterial color="#06B6D4" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <pointLight color="#06B6D4" intensity={8} distance={5} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─── 5. Fairy Attack 3D Effects ─────────────────────────────────────────────

// Stardust Strike (Fluttering Shimmering Comet with Sparkle Trail)
export function StardustStrikeEffect({
  source,
  target,
}: {
  source: [number, number, number];
  target: [number, number, number];
}) {
  const cometRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (!cometRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 15) + 1) / 2;
    cometRef.current.position.x = THREE.MathUtils.lerp(source[0], target[0], t);
    // Sinusoidal fluttering flight path
    cometRef.current.position.y = THREE.MathUtils.lerp(source[1], target[1], t) + Math.sin(t * Math.PI * 4) * 0.25;
    cometRef.current.position.z = THREE.MathUtils.lerp(source[2], target[2], t) + Math.cos(t * Math.PI * 3) * 0.2;

    if (ringRef.current) ringRef.current.rotation.z += delta * 15;
  });

  return (
    <group ref={cometRef}>
      <mesh>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="#F472B6" />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.35, 0.55, 16]} />
        <meshBasicMaterial color="#EC4899" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Glitter sparkle cloud */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshBasicMaterial color="#FBCFE8" />
        </mesh>
      ))}
      <pointLight color="#F472B6" intensity={6} distance={4.5} />
    </group>
  );
}

// Cosmic Bloom (Expanding Lotus Mandala Shockwave)
export function CosmicBloomEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const mandala1Ref = useRef<THREE.Mesh>(null);
  const mandala2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (mandala1Ref.current) {
      mandala1Ref.current.rotation.z += delta * 4;
      mandala1Ref.current.scale.multiplyScalar(1.03);
    }
    if (mandala2Ref.current) {
      mandala2Ref.current.rotation.z -= delta * 5;
      mandala2Ref.current.scale.multiplyScalar(1.025);
    }
  });

  return (
    <group position={position}>
      {/* Inner Tier Rotating Petals */}
      <mesh ref={mandala1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <ringGeometry args={[0.4, 1.2, 12, 1]} />
        <meshBasicMaterial color="#F43F5E" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer Tier Rotating Petals */}
      <mesh ref={mandala2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
        <ringGeometry args={[0.9, 1.8, 16, 1]} />
        <meshBasicMaterial color="#FB7185" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#F43F5E" intensity={7} distance={5} position={[0, 0.4, 0]} />
    </group>
  );
}

// Astral Ascension (Radiant Iridescent Rainbow Prism Pillar)
export function AstralAscensionEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const beamRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (beamRef.current) beamRef.current.rotation.y += delta * 5;
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 3;
      haloRef.current.position.y = 0.5 + Math.sin(performance.now() * 0.005) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Colossal Ascending Prism Light Pillar */}
      <mesh ref={beamRef} position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 4.5, 12, 1, true]} />
        <meshBasicMaterial color="#EC4899" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* Floating Rainbow Halo */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.08, 12, 32]} />
        <meshBasicMaterial color="#FDE68A" />
      </mesh>
      <pointLight color="#F43F5E" intensity={9} distance={6} position={[0, 1.2, 0]} />
    </group>
  );
}

// ─── 6. Dwarf Attack 3D Effects ─────────────────────────────────────────────

// Rune Hammer (Gigantic Ethereal Runic Hammer Slam)
export function RuneHammerEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const hammerRef = useRef<THREE.Group>(null);
  const shockRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (hammerRef.current) {
      // Rapid downward slam arc
      hammerRef.current.rotation.x = THREE.MathUtils.lerp(
        hammerRef.current.rotation.x,
        Math.PI / 2.2,
        delta * 22
      );
      hammerRef.current.position.y = THREE.MathUtils.lerp(
        hammerRef.current.position.y,
        0.1,
        delta * 22
      );
    }
    if (shockRef.current) {
      shockRef.current.scale.multiplyScalar(1.06);
    }
  });

  return (
    <group position={position}>
      {/* Ethereal Glowing Runic Hammer */}
      <group ref={hammerRef} position={[0, 1.8, -0.4]} rotation={[-Math.PI / 4, 0, 0]}>
        {/* Shaft */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 8]} />
          <meshBasicMaterial color="#D97706" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.5]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>
      </group>

      {/* Ground Rune Fracture Ring */}
      <mesh ref={shockRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <ringGeometry args={[0.4, 1.3, 24]} />
        <meshBasicMaterial color="#FDE68A" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      <pointLight color="#F59E0B" intensity={7} distance={4.5} />
    </group>
  );
}

// Magma Bolt (Molten Lava Fireball with Spark Splash)
export function MagmaBoltEffect({
  source,
  target,
}: {
  source: [number, number, number];
  target: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (Math.sin(clock.getElapsedTime() * 15) + 1) / 2;
    meshRef.current.position.x = THREE.MathUtils.lerp(source[0], target[0], t);
    // Arc trajectory
    meshRef.current.position.y = THREE.MathUtils.lerp(source[1], target[1], t) + Math.sin(t * Math.PI) * 0.6;
    meshRef.current.position.z = THREE.MathUtils.lerp(source[2], target[2], t);
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial color="#EA580C" />
        <pointLight color="#F97316" intensity={6} distance={4} />
      </mesh>
    </group>
  );
}

// Forge Eruption (Volcanic Geyser with Lava Rocks)
export function ForgeEruptionEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const columnRef = useRef<THREE.Mesh>(null);
  const rocksRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (columnRef.current) {
      columnRef.current.rotation.y += delta * 8;
      columnRef.current.scale.y = THREE.MathUtils.lerp(columnRef.current.scale.y, 1.6, delta * 14);
    }
    if (rocksRef.current) {
      rocksRef.current.rotation.y += delta * 5;
    }
  });

  return (
    <group position={position}>
      {/* Erupting Molten Lava Column */}
      <mesh ref={columnRef} position={[0, 0.6, 0]} scale={[1, 0.2, 1]}>
        <cylinderGeometry args={[0.3, 0.8, 2.2, 12]} />
        <meshBasicMaterial color="#DC2626" />
      </mesh>
      {/* Molten Lava Rocks Flying Upwards */}
      <group ref={rocksRef} position={[0, 0.8, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.5, i * 0.25, Math.sin(a) * 0.5]}>
              <dodecahedronGeometry args={[0.1, 0]} />
              <meshBasicMaterial color="#F97316" />
            </mesh>
          );
        })}
      </group>
      <pointLight color="#DC2626" intensity={8} distance={5} position={[0, 0.8, 0]} />
    </group>
  );
}

// ─── 7. Ogre Attack 3D Effects ──────────────────────────────────────────────

// Titan Smash (Colossal Kinetic Shockwave Fist Slam)
export function TitanSmashEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const shockRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (shockRef.current) shockRef.current.scale.multiplyScalar(1.08);
    if (ringRef.current) ringRef.current.scale.multiplyScalar(1.06);
  });

  return (
    <group position={position}>
      <mesh ref={shockRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <ringGeometry args={[0.5, 1.6, 24]} />
        <meshBasicMaterial color="#84CC16" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <ringGeometry args={[1.0, 2.2, 24]} />
        <meshBasicMaterial color="#65A30D" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#84CC16" intensity={7} distance={4.5} />
    </group>
  );
}

// Earth Tremor (Ground Ripple Rings)
export function EarthTremorEffect({
  source,
  target,
}: {
  source: [number, number, number];
  target: [number, number, number];
}) {
  const midX = (source[0] + target[0]) / 2;

  return (
    <group position={[midX, -0.5, 0]}>
      {[-0.8, -0.3, 0.2, 0.7].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2 + i * 0.1, 0.35 + i * 0.1, 16]} />
          <meshBasicMaterial color="#EAB308" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <pointLight color="#EAB308" intensity={5} distance={4} />
    </group>
  );
}

// Cataclysm (Enraged Crimson Fire Aura & Volcanic Rupture)
export function CataclysmEffect({
  position,
}: {
  position: [number, number, number];
}) {
  const auraRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (auraRef.current) {
      auraRef.current.rotation.y += delta * 6;
      auraRef.current.scale.setScalar(1 + Math.sin(performance.now() * 0.008) * 0.15);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 8;
      ringRef.current.scale.multiplyScalar(1.04);
    }
  });

  return (
    <group position={position}>
      <mesh ref={auraRef} position={[0, 0.6, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#EF4444" wireframe transparent opacity={0.65} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <ringGeometry args={[0.7, 2.0, 32]} />
        <meshBasicMaterial color="#DC2626" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#EF4444" intensity={9} distance={5.5} position={[0, 0.7, 0]} />
    </group>
  );
}

// ─── 8. Unique Species-Specific Shields ─────────────────────────────────────

// Human: Iron Bastion (Hexagonal Cyber-Matrix Dome)
export function HumanIronBastion({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2.5;
      meshRef.current.rotation.x += delta * 1.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#38BDF8" wireframe transparent opacity={0.7} />
      </mesh>
      <pointLight color="#38BDF8" intensity={4} distance={4} />
    </group>
  );
}

// Elf: Wind Barrier (Swirling Tornado Cyclone)
export function ElfWindBarrier({ position }: { position: [number, number, number] }) {
  const cycloneRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (cycloneRef.current) cycloneRef.current.rotation.y += delta * 14;
  });

  return (
    <group position={position}>
      <mesh ref={cycloneRef} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.7, 1.2, 1.8, 16, 1, true]} />
        <meshBasicMaterial color="#6EE7B7" wireframe transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#34D399" intensity={4} distance={3.8} />
    </group>
  );
}

// Fairy: Petal Shield (Orbiting Crystal Lotus Petals)
export function FairyPetalShield({ position }: { position: [number, number, number] }) {
  const haloRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (haloRef.current) haloRef.current.rotation.y += delta * 4;
  });

  return (
    <group position={position}>
      <group ref={haloRef} position={[0, 0.4, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9]}>
              <coneGeometry args={[0.2, 0.4, 5]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#F472B6' : '#FDE68A'} />
            </mesh>
          );
        })}
      </group>
      <pointLight color="#F472B6" intensity={4} distance={4} />
    </group>
  );
}

// Dwarf: Stone Fortress (Heavy Runic Stone Bastion)
export function DwarfStoneFortress({ position }: { position: [number, number, number] }) {
  const bastionRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bastionRef.current) bastionRef.current.rotation.y += delta * 1.5;
  });

  return (
    <group position={position}>
      <group ref={bastionRef} position={[0, 0.4, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85]} rotation={[0, a, 0]}>
              <boxGeometry args={[0.6, 1.2, 0.15]} />
              <meshBasicMaterial color="#A16207" />
            </mesh>
          );
        })}
      </group>
      <pointLight color="#F59E0B" intensity={4} distance={4} />
    </group>
  );
}

// Ogre: Boulder Guard (Floating Heavy Granite Boulders)
export function OgreBoulderGuard({ position }: { position: [number, number, number] }) {
  const bouldersRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bouldersRef.current) bouldersRef.current.rotation.y += delta * 2.5;
  });

  return (
    <group position={position}>
      <group ref={bouldersRef} position={[0, 0.4, 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9]}>
              <dodecahedronGeometry args={[0.3, 0]} />
              <meshBasicMaterial color="#78716C" />
            </mesh>
          );
        })}
      </group>
      <pointLight color="#A8A29E" intensity={4} distance={4} />
    </group>
  );
}
