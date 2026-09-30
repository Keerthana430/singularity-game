'use client';
// components/avatar/AvatarModel.tsx
// Fully procedural humanoid avatar built from Three.js geometry primitives.
// No external model files — everything is generated from capsules, boxes, spheres, etc.

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { AvatarConfig } from '@/types/avatar';

// ─── Helpers ────────────────────────────────────────────────────────────────

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function useMaterial(hex: string, roughness = 0.6, metalness = 0, emissive?: string, emissiveIntensity = 0) {
  return useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: hexToColor(hex),
      roughness,
      metalness,
    });
    if (emissive) {
      mat.emissive = hexToColor(emissive);
      mat.emissiveIntensity = emissiveIntensity;
    }
    return mat;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hex, roughness, metalness, emissive, emissiveIntensity]);
}

// ─── Body proportions ───────────────────────────────────────────────────────

function getBodyProps(config: AvatarConfig) {
  const { type, height, headSize, bodySize } = config.body;
  const base = {
    slim:    { bodyScaleX: 0.82, bodyScaleZ: 0.78, armScale: 0.88, legScale: 0.9,  headRadius: 0.38 },
    regular: { bodyScaleX: 1.0,  bodyScaleZ: 1.0,  armScale: 1.0,  legScale: 1.0,  headRadius: 0.40 },
    broad:   { bodyScaleX: 1.22, bodyScaleZ: 1.15, armScale: 1.12, legScale: 1.08, headRadius: 0.42 },
    chibi:   { bodyScaleX: 1.1,  bodyScaleZ: 1.05, armScale: 0.9,  legScale: 0.65, headRadius: 0.54 },
  }[type];
  return {
    ...base,
    totalScale: height,
    headRadius: base.headRadius * headSize,
    bodyScaleX: base.bodyScaleX * bodySize,
    bodyScaleZ: base.bodyScaleZ * bodySize,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface HeadProps {
  config: AvatarConfig;
  blinkT: number;
  lookX: number;
  lookY: number;
}

function AvatarHead({ config, blinkT, lookX, lookY }: HeadProps) {
  const { headRadius } = getBodyProps(config);
  const skinMat = useMaterial(config.skinTone, 0.65, 0.05);
  const eyeColor = config.face.eyes === 'cyber' ? '#00FF66' : '#111111';
  const eyeMat = useMaterial(eyeColor, 0.2, config.face.eyes === 'cyber' ? 0.8 : 0, config.face.eyes === 'cyber' ? '#00FF66' : undefined, 2.0);
  const eyeWhiteMat = useMaterial('#FFFFFF', 0.9, 0);

  const headW = headRadius * 1.55;
  const headH = headRadius * 1.42;
  const headD = headRadius * 1.45;

  const eyeOffsetX = headW * 0.25;
  const eyeY = 0.02;
  const eyeZ = headD * 0.51;
  const eyeScale = config.face.eyes === 'anime' ? 1.25 : config.face.eyes === 'narrow' ? 0.75 : 1.0;
  const blinkScaleY = 1 - Math.max(0, blinkT) * 0.9;

  const mouthY = -headH * 0.25;
  const mouthZ = headD * 0.51;
  const mouthMat = useMaterial(config.face.expression === 'happy' ? '#FF5C93' : '#111111', 0.8, 0);

  return (
    <group rotation={[lookY * 0.15, lookX * 0.12, 0]}>
      {/* Roblox Blocky Head */}
      <mesh castShadow geometry={new THREE.BoxGeometry(headW, headH, headD)} material={skinMat} />

      {/* Signature Roblox Cylinder Top Stud */}
      <mesh
        castShadow
        position={[0, headH * 0.5 + headRadius * 0.1, 0]}
        geometry={new THREE.CylinderGeometry(headRadius * 0.38, headRadius * 0.38, headRadius * 0.2, 24)}
        material={skinMat}
      />

      {/* Roblox Decal Eyes */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * eyeOffsetX, eyeY, eyeZ]}>
          {/* Main pupil / eye block */}
          <mesh scale={[1, blinkScaleY, 1]} geometry={new THREE.BoxGeometry(0.12 * eyeScale, 0.16 * eyeScale, 0.01)} material={eyeMat} />
          {/* Catchlight reflection dot */}
          <mesh position={[side * 0.025, 0.04, 0.01]} geometry={new THREE.BoxGeometry(0.04, 0.04, 0.01)} material={eyeWhiteMat} />
        </group>
      ))}

      {/* Roblox Classic Smile Mouth */}
      <mesh
        position={[0, mouthY, mouthZ]}
        rotation={[0, 0, config.face.expression === 'happy' ? 0 : config.face.expression === 'fierce' ? Math.PI : 0]}
        geometry={new THREE.TorusGeometry(0.09, 0.02, 4, 16, Math.PI)}
        material={mouthMat}
      />
    </group>
  );
}

interface HairProps { config: AvatarConfig; headRadius: number; windT: number; }

function AvatarHair({ config, headRadius, windT }: HairProps) {
  const mat = useMaterial(config.hairColor, 0.7, 0);
  const emissiveMat = useMaterial(config.hairColor, 0.4, 0.1, config.hairColor, 0.4);
  const r = headRadius;

  const strands = useMemo(() => {
    if (config.hair !== 'futuristic') return null;
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      return { angle, length: 0.3 + Math.random() * 0.3 };
    });
  }, [config.hair]);

  switch (config.hair) {
    case 'bald':
      return null;

    case 'short':
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.02, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />
        </group>
      );

    case 'long':
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.03, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />
          {/* Long strands down back */}
          <mesh position={[0, -r * 0.6, -r * 0.3]} rotation={[windT * 0.04, 0, 0]} geometry={new THREE.CylinderGeometry(r * 0.55, r * 0.25, r * 2.2, 10)} material={mat} />
        </group>
      );

    case 'ponytail':
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.03, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />
          {/* Ponytail */}
          <mesh position={[0, r * 0.1, -r * 1.0]} rotation={[0.5 + windT * 0.06, 0, 0]} geometry={new THREE.CylinderGeometry(r * 0.18, r * 0.08, r * 1.4, 8)} material={mat} />
        </group>
      );

    case 'spiky': {
      const spikes = [
        { pos: [0, r * 1.5, 0] as [number,number,number], rot: [0, 0, 0] as [number,number,number] },
        { pos: [r * 0.5, r * 1.3, 0] as [number,number,number], rot: [0, 0, 0.5] as [number,number,number] },
        { pos: [-r * 0.5, r * 1.3, 0] as [number,number,number], rot: [0, 0, -0.5] as [number,number,number] },
        { pos: [0, r * 1.4, r * 0.3] as [number,number,number], rot: [-0.3, 0, 0] as [number,number,number] },
        { pos: [r * 0.3, r * 1.45, r * 0.2] as [number,number,number], rot: [-0.2, 0, 0.3] as [number,number,number] },
      ];
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.02, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />
          {spikes.map((s, i) => (
            <mesh key={i} position={s.pos} rotation={s.rot} geometry={new THREE.ConeGeometry(r * 0.18, r * 0.55, 6)} material={mat} />
          ))}
        </group>
      );
    }

    case 'curly': {
      const curls = Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return {
          x: Math.cos(angle) * r * 0.75,
          z: Math.sin(angle) * r * 0.75,
          y: r * (0.5 + (i % 2) * 0.15),
        };
      });
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.04, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6)} material={mat} />
          {curls.map((c, i) => (
            <mesh key={i} position={[c.x, c.y, c.z]} geometry={new THREE.TorusGeometry(r * 0.14, r * 0.09, 8, 12)} material={mat} />
          ))}
        </group>
      );
    }

    case 'anime': {
      const spikes = [
        [0, r * 1.6, r * 0.1],
        [r * 0.4, r * 1.45, r * 0.05],
        [-r * 0.4, r * 1.45, r * 0.05],
        [r * 0.7, r * 1.2, 0],
        [-r * 0.7, r * 1.2, 0],
      ] as [number, number, number][];
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.03, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />
          {spikes.map((pos, i) => (
            <mesh key={i} position={pos} rotation={[-0.2, (i - 2) * 0.3, 0]} geometry={new THREE.ConeGeometry(r * 0.14, r * 0.65, 4)} material={mat} />
          ))}
        </group>
      );
    }

    case 'futuristic':
      return (
        <group>
          <mesh position={[0, r * 0.55, 0]} geometry={new THREE.SphereGeometry(r * 1.02, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5)} material={mat} />
          {(strands ?? []).map((strand, i) => (
            <mesh
              key={i}
              position={[
                Math.cos(strand.angle) * r * 0.5,
                r * 0.8 + Math.sin(windT * 0.5 + i) * 0.04,
                Math.sin(strand.angle) * r * 0.5,
              ]}
              rotation={[Math.sin(windT * 0.3 + i * 0.5) * 0.1, strand.angle, 0]}
              geometry={new THREE.CylinderGeometry(0.015, 0.005, strand.length, 4)}
              material={emissiveMat}
            />
          ))}
        </group>
      );

    case 'bob':
      return (
        <group>
          <mesh position={[0, r * 0.5, 0]} geometry={new THREE.SphereGeometry(r * 1.06, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65)} material={mat} />
        </group>
      );

    case 'mohawk': {
      const mSpikes = Array.from({ length: 5 }, (_, i) => ({
        y: r * (1.1 + i * 0.12),
        x: 0,
        z: (i - 2) * r * 0.18,
      }));
      return (
        <group>
          <mesh position={[0, r * 0.3, 0]} geometry={new THREE.SphereGeometry(r * 1.0, 20, 16, Math.PI * 0.7, Math.PI * 0.6, 0, Math.PI * 0.55)} material={mat} />
          <mesh position={[0, r * 0.3, 0]} geometry={new THREE.SphereGeometry(r * 1.0, 20, 16, Math.PI * 1.7, Math.PI * 0.6, 0, Math.PI * 0.55)} material={mat} />
          {mSpikes.map((s, i) => (
            <mesh key={i} position={[s.x, s.y, s.z]} rotation={[s.z * 0.3, 0, 0]} geometry={new THREE.ConeGeometry(r * 0.12, r * 0.45, 5)} material={mat} />
          ))}
        </group>
      );
    }

    default:
      return <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.02, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />;
  }
}

function AvatarTorso({ config }: { config: AvatarConfig }) {
  const props = getBodyProps(config);
  const isEmissive = config.top === 'futuristic-suit';
  const topMat = useMaterial(config.topColor, 0.5, config.top === 'armor' ? 0.6 : 0, isEmissive ? config.topColor : undefined, isEmissive ? 0.3 : 0);
  const skinMat = useMaterial(config.skinTone, 0.7, 0);

  const h = 0.72 * props.bodyScaleX;
  const w = 0.44 * props.bodyScaleX;
  const d = 0.32 * props.bodyScaleZ;

  return (
    <group>
      {/* Roblox Neck Joint Stud */}
      <mesh position={[0, h * 0.52, 0]} geometry={new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16)} material={skinMat} />
      {config.top === 'tshirt' || config.top === 'tank' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2, h, d * 2, 2, 2, 2)} material={topMat}>
            <meshStandardMaterial color={hexToColor(config.topColor)} roughness={0.65} metalness={0} />
          </mesh>
          {/* Collar */}
          <mesh position={[0, h * 0.44, d * 0.92]} geometry={new THREE.TorusGeometry(w * 0.52, 0.035, 8, 16, Math.PI)} material={skinMat} />
        </>
      ) : config.top === 'hoodie' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.1, h, d * 2.05, 2, 2, 2)} material={topMat} />
          {/* Hood */}
          <mesh position={[0, h * 0.38, -d * 0.7]} geometry={new THREE.SphereGeometry(w * 0.7, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={topMat} />
        </>
      ) : config.top === 'jacket' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.12, h, d * 2.08)} material={topMat} />
          {/* Lapels */}
          <mesh position={[w * 0.3, h * 0.15, d * 1.02]} rotation={[0, 0, 0.4]} geometry={new THREE.BoxGeometry(0.1, h * 0.55, 0.04)} material={topMat} />
          <mesh position={[-w * 0.3, h * 0.15, d * 1.02]} rotation={[0, 0, -0.4]} geometry={new THREE.BoxGeometry(0.1, h * 0.55, 0.04)} material={topMat} />
        </>
      ) : config.top === 'armor' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.2, h, d * 2.1)} material={topMat} />
          {/* Chest plates */}
          <mesh position={[w * 0.28, h * 0.1, d * 1.01]} geometry={new THREE.BoxGeometry(w * 0.8, h * 0.5, 0.06)} material={topMat} />
          <mesh position={[-w * 0.28, h * 0.1, d * 1.01]} geometry={new THREE.BoxGeometry(w * 0.8, h * 0.5, 0.06)} material={topMat} />
        </>
      ) : config.top === 'futuristic-suit' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.08, h, d * 2.0)} material={topMat} />
          {/* Emissive trim lines */}
          <mesh position={[0, h * 0.05, d * 1.02]} geometry={new THREE.BoxGeometry(w * 0.06, h * 0.8, 0.02)}>
            <meshStandardMaterial color={hexToColor(config.topColor)} emissive={hexToColor('#22D3EE')} emissiveIntensity={1.5} roughness={0.2} />
          </mesh>
          <mesh position={[w * 0.6, h * 0.05, d * 0.6]} geometry={new THREE.BoxGeometry(0.02, h * 0.8, d * 0.8)}>
            <meshStandardMaterial color={hexToColor(config.topColor)} emissive={hexToColor('#7C5CFF')} emissiveIntensity={1.5} roughness={0.2} />
          </mesh>
          <mesh position={[-w * 0.6, h * 0.05, d * 0.6]} geometry={new THREE.BoxGeometry(0.02, h * 0.8, d * 0.8)}>
            <meshStandardMaterial color={hexToColor(config.topColor)} emissive={hexToColor('#7C5CFF')} emissiveIntensity={1.5} roughness={0.2} />
          </mesh>
        </>
      ) : (
        <mesh castShadow geometry={new THREE.BoxGeometry(w * 2, h, d * 2)} material={topMat} />
      )}
    </group>
  );
}

function AvatarArms({ config, breathT }: { config: AvatarConfig; breathT: number }) {
  const props = getBodyProps(config);
  const topMat = useMaterial(config.topColor, 0.5, config.top === 'armor' ? 0.6 : 0);
  const skinMat = useMaterial(config.skinTone, 0.65, 0.05);
  const w = 0.44 * props.bodyScaleX;
  const armW = 0.34 * props.armScale;
  const armL = 0.72 * props.armScale;

  return (
    <>
      {([-1, 1] as const).map((side) => (
        <group
          key={side}
          position={[side * (w + armW * 0.52), 0.08, 0]}
          rotation={[breathT * 0.08 * side, 0, side * 0.06]}
        >
          {/* Shoulder Pivot Stud / Joint */}
          <mesh
            position={[0, 0, 0]}
            geometry={new THREE.SphereGeometry(armW * 0.52, 12, 10)}
            material={topMat}
          />

          {/* Blocky Sleeve / Upper Arm */}
          <mesh
            castShadow
            position={[0, -armL * 0.35, 0]}
            geometry={new THREE.BoxGeometry(armW, armL * 0.6, armW)}
            material={topMat}
          />

          {/* Blocky Hand / Lower Arm (Skin or Glove) */}
          <mesh
            castShadow
            position={[0, -armL * 0.78, 0]}
            geometry={new THREE.BoxGeometry(armW * 0.95, armL * 0.36, armW * 0.95)}
            material={skinMat}
          />
        </group>
      ))}
    </>
  );
}

function AvatarLegs({ config, shiftT }: { config: AvatarConfig; shiftT: number }) {
  const props = getBodyProps(config);
  const bottomMat = useMaterial(config.bottomColor, 0.65, 0);
  const legW = 0.36 * props.legScale;
  const legH = 0.68 * props.legScale;
  const legSep = legW * 0.55;

  return (
    <>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * legSep, 0, 0]} rotation={[0, 0, shiftT * 0.02 * side]}>
          {/* Blocky Leg */}
          <mesh
            castShadow
            position={[0, -legH * 0.5, 0]}
            geometry={new THREE.BoxGeometry(legW, legH, legW * 1.05)}
            material={bottomMat}
          />
        </group>
      ))}
    </>
  );
}

function AvatarShoes({ config }: { config: AvatarConfig }) {
  const props = getBodyProps(config);
  const isGlow = config.shoes === 'futuristic-shoes';
  const shoeMat = useMaterial(config.shoeColor, 0.4, isGlow ? 0.3 : 0, isGlow ? '#00FF66' : undefined, isGlow ? 1.5 : 0);
  const legW = 0.36 * props.legScale;
  const legH = 0.68 * props.legScale;
  const legSep = legW * 0.55;
  const soleY = -legH;

  return (
    <>
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * legSep, soleY, 0]}>
          {/* Blocky Roblox Shoe Foot */}
          <mesh
            castShadow
            position={[0, 0.08, 0.04]}
            geometry={new THREE.BoxGeometry(legW * 1.04, 0.18, legW * 1.25)}
            material={shoeMat}
          />
        </group>
      ))}
    </>
  );
}

// ─── Accessories ─────────────────────────────────────────────────────────────

function AvatarAccessoryHead({ id, config, headRadius }: { id: string; config: AvatarConfig; headRadius: number }) {
  const mat = useMaterial(config.accessoryColor, 0.5, 0.2);
  const darkMat = useMaterial('#1A1A2E', 0.8, 0);

  switch (id) {
    case 'hat':
      return (
        <group position={[0, headRadius * 1.05, 0]}>
          <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.62, headRadius * 0.58, headRadius * 0.9, 12)} material={mat} />
          <mesh position={[0, -headRadius * 0.46, 0]} geometry={new THREE.CylinderGeometry(headRadius * 1.1, headRadius * 1.1, 0.06, 12)} material={mat} />
        </group>
      );
    case 'cap':
      return (
        <group position={[0, headRadius * 0.7, 0]}>
          <mesh geometry={new THREE.SphereGeometry(headRadius * 1.0, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)} material={mat} />
          <mesh position={[0, -headRadius * 0.25, headRadius * 1.1]} rotation={[-0.2, 0, 0]} geometry={new THREE.BoxGeometry(headRadius * 1.6, 0.06, headRadius * 0.8)} material={mat} />
        </group>
      );
    case 'headphones':
      return (
        <group position={[0, headRadius * 0.6, 0]}>
          {/* Band */}
          <mesh geometry={new THREE.TorusGeometry(headRadius * 1.0, 0.04, 6, 20, Math.PI)} material={darkMat} />
          {/* Cups */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * headRadius * 1.0, 0, 0]} geometry={new THREE.CylinderGeometry(0.16, 0.18, 0.12, 12)} rotation={[0, 0, Math.PI / 2]} material={mat} />
          ))}
        </group>
      );
    case 'crown':
      return (
        <group position={[0, headRadius * 1.0, 0]}>
          <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.7, headRadius * 0.72, headRadius * 0.35, 5)} material={mat} />
          {Array.from({ length: 5 }, (_, i) => {
            const angle = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * headRadius * 0.68, headRadius * 0.28, Math.sin(angle) * headRadius * 0.68]}>
                <coneGeometry args={[0.06, 0.2, 4]} />
                <meshStandardMaterial color={hexToColor(config.accessoryColor)} emissive={hexToColor('#FFD700')} emissiveIntensity={0.5} />
              </mesh>
            );
          })}
        </group>
      );
    case 'glasses':
      return (
        <group position={[0, headRadius * 0.06, headRadius * 0.94]}>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * headRadius * 0.38, 0, 0]} geometry={new THREE.TorusGeometry(headRadius * 0.22, 0.025, 6, 16)} material={mat} />
          ))}
          {/* Bridge */}
          <mesh position={[0, 0, 0]} geometry={new THREE.BoxGeometry(headRadius * 0.34, 0.025, 0.025)} material={mat} />
        </group>
      );
    default:
      return null;
  }
}

function AvatarAccessoryFace({ id, config, headRadius }: { id: string; config: AvatarConfig; headRadius: number }) {
  const mat = useMaterial(config.accessoryColor, 0.3, 0.5, config.accessoryColor, 0.2);
  switch (id) {
    case 'mask':
      return (
        <mesh position={[0, -headRadius * 0.15, headRadius * 0.9]} geometry={new THREE.BoxGeometry(headRadius * 1.1, headRadius * 0.55, 0.08)} material={mat} />
      );
    case 'visor':
      return (
        <mesh position={[0, headRadius * 0.1, headRadius * 0.88]} geometry={new THREE.BoxGeometry(headRadius * 1.3, headRadius * 0.35, 0.05)}>
          <meshStandardMaterial color={hexToColor('#22D3EE')} transparent opacity={0.55} emissive={hexToColor('#22D3EE')} emissiveIntensity={0.8} />
        </mesh>
      );
    default:
      return null;
  }
}

function AvatarAccessoryBack({ id, config, windT }: { id: string; config: AvatarConfig; windT: number }) {
  const mat = useMaterial(config.accessoryColor, 0.5, 0);
  switch (id) {
    case 'backpack':
      return (
        <mesh position={[0, 0.0, -0.42]} geometry={new THREE.BoxGeometry(0.36, 0.52, 0.22)} material={mat} />
      );
    case 'wings': {
      const flap = Math.sin(windT * 2.5) * 0.25;
      return (
        <group position={[0, 0.15, -0.28]}>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              position={[side * 0.18, 0, 0]}
              rotation={[0, 0, side * (0.4 + flap)]}
            >
              <meshStandardMaterial color={hexToColor(config.accessoryColor)} emissive={hexToColor(config.accessoryColor)} emissiveIntensity={0.3} roughness={0.6} side={THREE.DoubleSide} />
              <planeGeometry args={[0.7, 1.0]} />
            </mesh>
          ))}
        </group>
      );
    }
    case 'jetpack':
      return (
        <group position={[0, 0.05, -0.4]}>
          <mesh geometry={new THREE.BoxGeometry(0.38, 0.5, 0.2)} material={mat} />
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.16, -0.3, 0.05]} geometry={new THREE.CylinderGeometry(0.07, 0.09, 0.18, 8)}>
              <meshStandardMaterial color={hexToColor('#FF6B35')} emissive={hexToColor('#FF6B35')} emissiveIntensity={1.2} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

function AvatarAccessoryShoulder({ id, config }: { id: string; config: AvatarConfig }) {
  const mat = useMaterial(config.accessoryColor, 0.4, 0.5);
  switch (id) {
    case 'shoulder-pads':
    case 'pauldrons':
      return (
        <>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.58, 0.22, 0]} geometry={new THREE.BoxGeometry(0.22, 0.14, 0.32)} material={mat} />
          ))}
        </>
      );
    default:
      return null;
  }
}

// ─── Main exported component ──────────────────────────────────────────────────

interface AvatarModelProps {
  config: AvatarConfig;
  animate?: boolean;
}

export function AvatarModel({ config, animate = true }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Animation state
  const breathT = useRef(0);
  const blinkT = useRef(0);
  const blinkTimer = useRef(Math.random() * 3 + 2);
  const shiftT = useRef(0);
  const windT = useRef(0);
  const lookX = useRef(0);
  const lookY = useRef(0);
  const lookTargetX = useRef(0);
  const lookTargetY = useRef(0);

  useFrame((_, delta) => {
    if (!animate) return;
    breathT.current += delta;
    windT.current += delta;
    shiftT.current += delta * 0.6;

    // Blink
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      blinkT.current = 1;
      blinkTimer.current = Math.random() * 3 + 2;
    }
    blinkT.current = Math.max(0, blinkT.current - delta * 6);

    // Look around randomly
    if (Math.random() < 0.005) {
      lookTargetX.current = (Math.random() - 0.5) * 2;
      lookTargetY.current = (Math.random() - 0.5) * 0.6;
    }
    lookX.current += (lookTargetX.current - lookX.current) * delta * 2;
    lookY.current += (lookTargetY.current - lookY.current) * delta * 2;

    // Breathing / weight shift
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(breathT.current * 1.2) * 0.015;
      groupRef.current.rotation.y = Math.sin(shiftT.current * 0.4) * 0.04;
    }
  });

  const props = getBodyProps(config);
  const isChibi = config.body.type === 'chibi';
  const torsoY = isChibi ? 0.28 : 0.38;
  const legsY = isChibi ? -0.22 : -0.28;
  const headY = isChibi ? 0.92 : 0.78;
  const armsY = isChibi ? 0.22 : 0.3;

  // Breath values to pass down (use refs for performance)
  const bt = breathT.current;
  const wt = windT.current;
  const st = shiftT.current;
  const blink = blinkT.current;
  const lx = lookX.current;
  const ly = lookY.current;

  return (
    <group ref={groupRef} scale={[props.totalScale, props.totalScale, props.totalScale]}>
      {/* Head */}
      <group position={[0, headY, 0]}>
        <AvatarHead config={config} blinkT={blink} lookX={lx} lookY={ly} />
        {/* Hair attached to head */}
        <AvatarHair config={config} headRadius={props.headRadius} windT={wt} />
        {/* Head accessories */}
        {config.accessories.head && (
          <AvatarAccessoryHead id={config.accessories.head} config={config} headRadius={props.headRadius} />
        )}
        {config.accessories.face && (
          <AvatarAccessoryFace id={config.accessories.face} config={config} headRadius={props.headRadius} />
        )}
      </group>

      {/* Torso */}
      <group position={[0, torsoY, 0]}>
        <AvatarTorso config={config} />
        {/* Back accessories */}
        {config.accessories.back && (
          <AvatarAccessoryBack id={config.accessories.back} config={config} windT={wt} />
        )}
        {/* Shoulder accessories */}
        {config.accessories.shoulder && (
          <AvatarAccessoryShoulder id={config.accessories.shoulder} config={config} />
        )}
      </group>

      {/* Arms */}
      <group position={[0, armsY, 0]}>
        <AvatarArms config={config} breathT={bt} />
      </group>

      {/* Legs */}
      <group position={[0, legsY, 0]}>
        <AvatarLegs config={config} shiftT={st} />
      </group>

      {/* Shoes */}
      <group position={[0, legsY, 0]}>
        <AvatarShoes config={config} />
      </group>
    </group>
  );
}
