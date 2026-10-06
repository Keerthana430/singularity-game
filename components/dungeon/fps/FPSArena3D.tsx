// components/dungeon/fps/FPSArena3D.tsx
// Rich Architectural 3D Sci-Fi Arena with Textured Tiled Flooring, Layered Wall Panels,
// Glowing Portal Gates, Illuminated Cover Reactors, and Suspended Overhead Girders

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FPSArena3DProps {
  floor: number;
  palette: {
    fog: string;
    sky?: string;
    floor: string;
    wall?: string;
    trim: string;
    danger: string;
    accent?: string;
  };
}

export function FPSArena3D({ floor, palette }: FPSArena3DProps) {
  const accentColor = palette.accent || '#38BDF8';
  const wallBaseColor = palette.wall || '#2A4356';
  const floorBaseColor = palette.floor || '#1E3245';

  // Rotating central core & pillar plasma reactors
  const reactorRef = useRef<THREE.Group>(null);
  const portalRingsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (reactorRef.current) {
      reactorRef.current.rotation.y = t * 0.6;
    }
    if (portalRingsRef.current) {
      portalRingsRef.current.rotation.z = t * 1.2;
    }
  });

  // Floating ambient cyber energy motes
  const motes = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => ({
      x: ((i * 37) % 22) - 11,
      y: ((i * 19) % 45) / 10 + 0.6,
      z: ((i * 53) % 22) - 11,
      size: 0.04 + (i % 3) * 0.02,
      color: i % 2 === 0 ? palette.trim : accentColor,
    }));
  }, [palette.trim, accentColor]);

  // Checkered floor plate coordinates (10x10 modular floor tiles across 40m x 40m)
  const floorTiles = useMemo(() => {
    const tiles: { x: number; z: number; isAlt: boolean }[] = [];
    const size = 4.0;
    for (let x = -5; x < 5; x++) {
      for (let z = -5; z < 5; z++) {
        tiles.push({
          x: x * size + size / 2,
          z: z * size + size / 2,
          isAlt: (x + z) % 2 === 0,
        });
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      {/* ─── 1. OVERHEAD CEILING DOME & SKY CANOPY ──────────────────────── */}
      {/* Vast sky dome with celestial nebula gradient */}
      <mesh position={[0, 16, 0]}>
        <sphereGeometry args={[36, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={palette.sky || '#102A43'}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Cyber Celestial Hex Grid Ring in Sky */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 15, 0]}>
        <ringGeometry args={[14, 28, 32]} />
        <meshBasicMaterial color={palette.trim} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* ─── 2. TEXTURED HIGH-CONTRAST ARENA FLOOR ─────────────────────── */}
      {/* Heavy Sub-Foundation Slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[46, 46]} />
        <meshStandardMaterial color="#0F172A" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Modular Checkered Slate Tiles */}
      {floorTiles.map((tile, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[tile.x, 0.005, tile.z]}
          receiveShadow
        >
          <planeGeometry args={[3.85, 3.85]} />
          <meshStandardMaterial
            color={tile.isAlt ? floorBaseColor : '#25374C'}
            roughness={0.42}
            metalness={0.65}
          />
        </mesh>
      ))}

      {/* Floor Grout Grid Lines (Clean Neon Inlays) */}
      <gridHelper args={[40, 40, palette.trim, '#334D66']} position={[0, 0.015, 0]} />

      {/* Perimeter Safety Curb (Warning border) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[19.4, 20.2, 48]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glowing Energy Pathways Crossing the Arena */}
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 0]}>
          <planeGeometry args={[0.14, 38]} />
          <meshBasicMaterial color={palette.trim} transparent opacity={0.8} />
        </mesh>
      ))}
      {[-4.5, 4.5].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, z]}>
          <planeGeometry args={[38, 0.14]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Diagonal Conduits Leading to Portals */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.022, 0]}>
        <planeGeometry args={[0.1, 46]} />
        <meshBasicMaterial color={palette.trim} transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} position={[0, 0.022, 0]}>
        <planeGeometry args={[0.1, 46]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.45} />
      </mesh>


      {/* ─── 3. CENTER CYBER TERMINAL DAIS ──────────────────────────────── */}
      <group position={[0, 0, 0]}>
        {/* Outer Circular Stepped Plinth */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.5, 2.7, 0.24, 24]} />
          <meshStandardMaterial color="#2E4459" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Inner Elevated Reactor Ring */}
        <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.6, 0.18, 24]} />
          <meshStandardMaterial color="#1E2F40" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Glowing Reactor Glass Core Disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.36, 0]}>
          <circleGeometry args={[1.2, 24]} />
          <meshStandardMaterial
            color={palette.trim}
            emissive={palette.trim}
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>

        {/* Concentric Holographic Runes */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.38, 0]}>
          <ringGeometry args={[1.8, 1.95, 32]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.38, 0]}>
          <ringGeometry args={[2.2, 2.3, 32]} />
          <meshBasicMaterial color={palette.trim} transparent opacity={0.6} />
        </mesh>

        {/* Vertical Holographic Core Beam */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 2.4, 16]} />
          <meshBasicMaterial color={palette.trim} transparent opacity={0.3} />
        </mesh>

        {/* Floating Rotating Energy Ring */}
        <group ref={reactorRef} position={[0, 1.5, 0]}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.55, 0.03, 8, 24]} />
            <meshBasicMaterial color={palette.trim} />
          </mesh>
          <mesh rotation={[-Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.75, 0.025, 8, 24]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        </group>

        {/* Dais Spotlight */}
        <pointLight position={[0, 2.5, 0]} color={palette.trim} intensity={4.5} distance={10} decay={2} />
      </group>

      {/* ─── 4. 8 TACTICAL COVER PILLARS (EXPANDED DUNGEON) ─────────── */}
      {[
        { x: -5.5, z: -4.5 },
        { x: 5.5, z: -4.5 },
        { x: -5.5, z: 4.5 },
        { x: 5.5, z: 4.5 },
        { x: -12.5, z: -10.5 },
        { x: 12.5, z: -10.5 },
        { x: -12.5, z: 10.5 },
        { x: 12.5, z: 10.5 },
      ].map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          {/* Heavy Chamfered Base */}
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.0, 0.6, 2.0]} />
            <meshStandardMaterial color="#1E2F40" metalness={0.9} roughness={0.35} />
          </mesh>

          {/* Main Pillar Body (Steel Alloy with Bevels) */}
          <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 4.2, 1.5]} />
            <meshStandardMaterial color="#334B61" metalness={0.8} roughness={0.35} />
          </mesh>

          {/* Reinforced Armor Ribs on Faces */}
          {[-0.8, 0.8].map((offset, j) => (
            <mesh key={`rib-x-${j}`} position={[offset, 2.6, 0]}>
              <boxGeometry args={[0.12, 3.8, 1.2]} />
              <meshStandardMaterial color="#4A657E" metalness={0.85} roughness={0.25} />
            </mesh>
          ))}
          {[-0.8, 0.8].map((offset, j) => (
            <mesh key={`rib-z-${j}`} position={[0, 2.6, offset]}>
              <boxGeometry args={[1.2, 3.8, 0.12]} />
              <meshStandardMaterial color="#4A657E" metalness={0.85} roughness={0.25} />
            </mesh>
          ))}

          {/* 4 Corner Vertical Neon Conduit Strips */}
          {[
            [-0.78, -0.78],
            [0.78, -0.78],
            [-0.78, 0.78],
            [0.78, 0.78],
          ].map(([cx, cz], k) => (
            <mesh key={`corner-${k}`} position={[cx, 2.6, cz]}>
              <boxGeometry args={[0.06, 4.0, 0.06]} />
              <meshStandardMaterial
                color={palette.trim}
                emissive={palette.trim}
                emissiveIntensity={2.8}
              />
            </mesh>
          ))}

          {/* Recessed Glowing Core Chamber */}
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 1.6, 16]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={3.2}
              roughness={0.1}
            />
          </mesh>

          {/* Pillar Crown Capital */}
          <mesh position={[0, 4.85, 0]} castShadow>
            <boxGeometry args={[1.9, 0.4, 1.9]} />
            <meshStandardMaterial color="#2E4459" metalness={0.9} roughness={0.3} />
          </mesh>

          {/* Pillar Uplight */}
          <pointLight position={[0, 2.5, 0]} color={accentColor} intensity={3.2} distance={6} decay={2} />
        </group>
      ))}

      {/* ─── 5. ARCHITECTURAL PERIMETER WALLS (42m SCALE) ──────────────── */}
      {/* North Wall (Z = -20.5) */}
      <WallSection
        position={[0, 4.0, -20.5]}
        rotationY={0}
        wallColor={wallBaseColor}
        trimColor={palette.trim}
        accentColor={accentColor}
        hasGate={true}
      />
      {/* South Wall (Z = 20.5) */}
      <WallSection
        position={[0, 4.0, 20.5]}
        rotationY={Math.PI}
        wallColor={wallBaseColor}
        trimColor={palette.trim}
        accentColor={accentColor}
        hasGate={true}
      />
      {/* West Wall (X = -20.5) */}
      <WallSection
        position={[-20.5, 4.0, 0]}
        rotationY={Math.PI / 2}
        wallColor={wallBaseColor}
        trimColor={palette.trim}
        accentColor={accentColor}
        hasGate={true}
      />
      {/* East Wall (X = 20.5) */}
      <WallSection
        position={[20.5, 4.0, 0]}
        rotationY={-Math.PI / 2}
        wallColor={wallBaseColor}
        trimColor={palette.trim}
        accentColor={accentColor}
        hasGate={true}
      />

      {/* ─── 6. OVERHEAD STRUCTURAL TRUSS ROOF & STADIUM LIGHTS ─────────── */}
      {/* Longitudinal Space Frame Girders */}
      {[-12, -6, 0, 6, 12].map((z) => (
        <group key={`girder-z-${z}`} position={[0, 7.5, z]}>
          <mesh castShadow>
            <boxGeometry args={[41.5, 0.45, 0.55]} />
            <meshStandardMaterial color="#334B61" metalness={0.88} roughness={0.35} />
          </mesh>
          {/* Under-slung Neon Conduit Channel */}
          <mesh position={[0, -0.24, 0]}>
            <boxGeometry args={[41.0, 0.05, 0.08]} />
            <meshStandardMaterial
              color={palette.trim}
              emissive={palette.trim}
              emissiveIntensity={2.0}
            />
          </mesh>
        </group>
      ))}

      {/* Transverse Cross Girders */}
      {[-12, 0, 12].map((x) => (
        <mesh key={`girder-x-${x}`} position={[x, 7.7, 0]}>
          <boxGeometry args={[0.55, 0.4, 41.5]} />
          <meshStandardMaterial color="#2E4459" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}


      {/* 4 Suspended Industrial Floodlight Pods */}
      {[
        [-6, -6],
        [6, -6],
        [-6, 6],
        [6, 6],
      ].map(([fx, fz], k) => (
        <group key={`flood-${k}`} position={[fx, 6.5, fz]}>
          {/* Light Fixture Pod */}
          <mesh>
            <cylinderGeometry args={[0.45, 0.6, 0.5, 12]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Glowing Lens */}
          <mesh position={[0, -0.26, 0]}>
            <circleGeometry args={[0.5, 12]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={3} />
          </mesh>
          {/* Directed Flood Light */}
          <pointLight color="#E2E8F0" intensity={3.5} distance={14} decay={1.8} position={[0, -0.5, 0]} />
        </group>
      ))}

      {/* ─── 7. FLOATING AMBIENT CYBER MOTES ─────────────────────────────── */}
      {motes.map((m, i) => (
        <mesh key={`mote-${i}`} position={[m.x, m.y, m.z]}>
          <sphereGeometry args={[m.size, 6, 6]} />
          <meshBasicMaterial color={m.color} transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

// ─── REUSABLE DETAILED WALL SECTION COMPONENT ────────────────────────────────
function WallSection({
  position,
  rotationY,
  wallColor,
  trimColor,
  accentColor,
  hasGate,
}: {
  position: [number, number, number];
  rotationY: number;
  wallColor: string;
  trimColor: string;
  accentColor: string;
  hasGate: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Main Structural Bulkhead Wall */}
      <mesh receiveShadow>
        <boxGeometry args={[42.0, 8.0, 0.8]} />
        <meshStandardMaterial color={wallColor} roughness={0.48} metalness={0.62} />
      </mesh>

      {/* Bottom Armor Wainscot Base Curb */}
      <mesh position={[0, -3.2, 0.45]} receiveShadow>
        <boxGeometry args={[42.0, 1.6, 0.3]} />
        <meshStandardMaterial color="#1E2F40" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Top Gantry Trim Cornice */}
      <mesh position={[0, 3.7, 0.45]}>
        <boxGeometry args={[42.0, 0.6, 0.3]} />
        <meshStandardMaterial color="#2E4459" roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Horizontal Neon Wall Sconces */}
      <mesh position={[0, 1.5, 0.42]}>
        <boxGeometry args={[40, 0.08, 0.06]} />
        <meshStandardMaterial color={trimColor} emissive={trimColor} emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0, -1.0, 0.42]}>
        <boxGeometry args={[40, 0.06, 0.06]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.0} />
      </mesh>

      {/* Vertical Structural Buttress Columns (6 on each wall) */}
      {[-15, -9, -3.5, 3.5, 9, 15].map((bx) => (
        <group key={`buttress-${bx}`} position={[bx, 0, 0.45]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.7, 7.8, 0.35]} />
            <meshStandardMaterial color="#334B61" roughness={0.4} metalness={0.75} />
          </mesh>
          {/* Vertical LED Status Strip on Buttress */}
          <mesh position={[0, 0, 0.19]}>
            <boxGeometry args={[0.08, 6.6, 0.04]} />
            <meshStandardMaterial color={trimColor} emissive={trimColor} emissiveIntensity={2.4} />
          </mesh>
        </group>
      ))}


      {/* Arched Cyber Portal Gate in Wall Center */}
      {hasGate && (
        <group position={[0, -1.0, 0.5]}>
          {/* Gate Outer Arch Frame */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[4.4, 4.4, 0.35]} />
            <meshStandardMaterial color="#1E2F40" roughness={0.35} metalness={0.85} />
          </mesh>

          {/* Recessed Forcefield Portal Void */}
          <mesh position={[0, 0.6, 0.05]}>
            <planeGeometry args={[3.2, 3.6]} />
            <meshStandardMaterial
              color="#0284C7"
              emissive="#0284C7"
              emissiveIntensity={2.8}
              roughness={0.1}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Shimmering Forcefield Hex Trim Lines */}
          <mesh position={[0, 0.6, 0.06]}>
            <ringGeometry args={[0.9, 1.05, 6]} />
            <meshBasicMaterial color={trimColor} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0.6, 0.06]}>
            <ringGeometry args={[1.35, 1.45, 6]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.6} />
          </mesh>

          {/* Portal Overhead Sconce Beacon */}
          <pointLight position={[0, 2.6, 0.6]} color={trimColor} intensity={4.5} distance={7} decay={2} />
        </group>
      )}
    </group>
  );
}
