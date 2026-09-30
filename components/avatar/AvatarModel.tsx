'use client';
// components/avatar/AvatarModel.tsx
// Fully procedural humanoid avatar built from Three.js geometry primitives.
// No external model files — everything is generated from capsules, boxes, spheres, etc.

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const isHeartEye = config.face.eyes === 'heart';
  const isCyberEye = config.face.eyes === 'cyber';
  const eyeColor = isHeartEye ? '#FF2D78' : isCyberEye ? '#00FF66' : '#111111';
  const eyeMat = useMaterial(
    eyeColor,
    0.2,
    isHeartEye || isCyberEye ? 0.8 : 0,
    isHeartEye ? '#FF2D78' : isCyberEye ? '#00FF66' : undefined,
    isHeartEye ? 1.5 : isCyberEye ? 2.0 : 0
  );
  const eyeWhiteMat = useMaterial('#FFFFFF', 0.9, 0);
  const blushMat = useMaterial('#FF5C8A', 0.9, 0);

  const headW = headRadius * 1.55;
  const headH = headRadius * 1.42;
  const headD = headRadius * 1.45;

  const eyeOffsetX = headW * 0.25;
  const eyeY = 0.02;
  const eyeZ = headD * 0.51;
  const isAnimeOrSparkle = config.face.eyes === 'anime' || config.face.eyes === 'sparkle';
  const eyeScale = isAnimeOrSparkle ? 1.3 : config.face.eyes === 'narrow' ? 0.75 : 1.0;
  const blinkScaleY = 1 - Math.max(0, blinkT) * 0.9;

  const mouthY = -headH * 0.25;
  const mouthZ = headD * 0.51;
  const isCuteSmile = config.face.expression === 'happy' || config.face.expression === 'blushing' || config.face.expression === 'uwu';
  const mouthMat = useMaterial(isCuteSmile ? '#FF4D80' : '#111111', 0.8, 0);

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

      {/* Rosy Blush Cheeks (Kawaii Aesthetic) */}
      {([-1, 1] as const).map((side) => (
        <group key={`blush-${side}`} position={[side * headW * 0.32, -headH * 0.12, eyeZ + 0.003]}>
          <mesh>
            <circleGeometry args={[0.055, 16]} />
            <meshStandardMaterial
              color="#FF5C8A"
              roughness={0.9}
              transparent
              opacity={config.face.expression === 'blushing' ? 0.85 : 0.45}
            />
          </mesh>
          <mesh position={[side * 0.015, 0.015, 0.002]}>
            <circleGeometry args={[0.015, 12]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* Eyes */}
      {([-1, 1] as const).map((side) => {
        const isWinkRight = config.face.eyes === 'wink' && side === 1;
        return (
          <group key={side} position={[side * eyeOffsetX, eyeY, eyeZ]}>
            {isWinkRight ? (
              // Curved Playful Wink Arc ^
              <mesh rotation={[0, 0, 0]} position={[0, -0.01, 0.005]}>
                <torusGeometry args={[0.065, 0.016, 4, 16, Math.PI]} />
                <meshStandardMaterial color={hexToColor('#111111')} />
              </mesh>
            ) : (
              <>
                {/* Main pupil / eye block */}
                <mesh scale={[1, blinkScaleY, 1]} geometry={new THREE.BoxGeometry(0.12 * eyeScale, 0.16 * eyeScale, 0.01)} material={eyeMat} />
                {/* Primary catchlight reflection dot */}
                <mesh position={[side * 0.025, 0.04, 0.01]} geometry={new THREE.BoxGeometry(0.04, 0.04, 0.01)} material={eyeWhiteMat} />
                {/* Secondary sparkly star/spark catchlight */}
                {isAnimeOrSparkle && (
                  <mesh position={[-side * 0.025, -0.035, 0.01]} geometry={new THREE.BoxGeometry(0.025, 0.025, 0.01)} material={eyeWhiteMat} />
                )}
                {/* Heart pupil inner highlight */}
                {isHeartEye && (
                  <mesh position={[0, 0, 0.012]}>
                    <coneGeometry args={[0.035, 0.07, 4]} />
                    <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.8} />
                  </mesh>
                )}
              </>
            )}
          </group>
        );
      })}

      {/* Mouth Expressions */}
      {config.face.expression === 'uwu' ? (
        // Cute :3 Cat Mouth (two touching half-loops)
        <group position={[0, mouthY, mouthZ]}>
          <mesh position={[-0.035, 0, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.04, 0.014, 4, 12, Math.PI]} />
            <meshStandardMaterial color={hexToColor('#FF4D80')} />
          </mesh>
          <mesh position={[0.035, 0, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.04, 0.014, 4, 12, Math.PI]} />
            <meshStandardMaterial color={hexToColor('#FF4D80')} />
          </mesh>
        </group>
      ) : config.face.expression === 'pout' ? (
        // Cute Little Pout Mouth (O shape)
        <mesh position={[0, mouthY, mouthZ]}>
          <torusGeometry args={[0.04, 0.016, 6, 16]} />
          <meshStandardMaterial color={hexToColor('#FF4D80')} />
        </mesh>
      ) : (
        // Classic smile or curved expression
        <mesh
          position={[0, mouthY, mouthZ]}
          rotation={[0, 0, isCuteSmile ? 0 : config.face.expression === 'fierce' ? Math.PI : 0]}
          geometry={new THREE.TorusGeometry(0.09, 0.02, 4, 16, Math.PI)}
          material={mouthMat}
        />
      )}

      {/* Species-Specific Visual Features */}
      {config.species === 'elf' && (
        ([-1, 1] as const).map((side) => (
          <mesh
            key={`elf-ear-${side}`}
            position={[side * (headW * 0.52 + 0.08), 0.02, -0.05]}
            rotation={[0, 0, -side * 0.45]}
            geometry={new THREE.ConeGeometry(0.08, 0.32, 4)}
            material={skinMat}
          />
        ))
      )}

      {config.species === 'ogre' && (
        ([-1, 1] as const).map((side) => (
          <group key={`ogre-horn-${side}`} position={[side * headW * 0.35, headH * 0.45, headD * 0.3]}>
            <mesh rotation={[0.4, 0, side * 0.3]} geometry={new THREE.ConeGeometry(0.09, 0.35, 5)}>
              <meshStandardMaterial color="#3E2723" roughness={0.3} />
            </mesh>
          </group>
        ))
      )}

      {config.species === 'robot' && (
        ([-1, 1] as const).map((side) => (
          <group key={`bot-ear-${side}`} position={[side * (headW * 0.52 + 0.04), 0, 0]}>
            <mesh geometry={new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12)} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={2.0} />
            </mesh>
          </group>
        ))
      )}

      {config.species === 'alien' && (
        ([-1, 1] as const).map((side) => (
          <group key={`alien-ant-${side}`} position={[side * headW * 0.32, headH * 0.55, 0]} rotation={[0, 0, side * 0.25]}>
            <mesh geometry={new THREE.CylinderGeometry(0.015, 0.02, 0.38, 8)} material={skinMat} />
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.06, 12, 10]} />
              <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))
      )}

      {config.species === 'fairie' && (
        <group position={[0, headH * 0.45, 0]}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.45, Math.sin(angle * 2) * 0.08, Math.sin(angle) * 0.45]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#F43F5E" emissive="#FF69B4" emissiveIntensity={3.0} />
              </mesh>
            );
          })}
        </group>
      )}
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
    case 'twintails':
      return (
        <group>
          {/* Base rounded hair with soft bangs */}
          <mesh position={[0, r * 0.58, 0]} geometry={new THREE.SphereGeometry(r * 1.05, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58)} material={mat} />
          {/* Cute front bangs */}
          <mesh position={[0, r * 0.32, r * 0.7]} geometry={new THREE.BoxGeometry(r * 1.25, r * 0.28, 0.14)} material={mat} />
          {/* Sidelocks */}
          {([-1, 1] as const).map((side) => (
            <mesh key={`side-${side}`} position={[side * r * 0.72, 0, r * 0.45]} geometry={new THREE.BoxGeometry(0.12, r * 0.9, 0.14)} material={mat} />
          ))}
          {/* High Bouncy Pigtails on both sides */}
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * r * 0.92, r * 0.6, -r * 0.1]}>
              {/* Cute Ribbon Hair Tie */}
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[r * 0.15, 12, 10]} />
                <meshStandardMaterial color="#FF5C93" roughness={0.3} />
              </mesh>
              {/* Dynamic swinging pigtail */}
              <group rotation={[windT * 0.08, 0, side * (0.35 + windT * 0.05)]}>
                <mesh position={[side * r * 0.18, -r * 0.75, 0]}>
                  <cylinderGeometry args={[r * 0.2, r * 0.1, r * 1.7, 10]} />
                  <meshStandardMaterial color={hexToColor(config.hairColor)} roughness={0.6} />
                </mesh>
                <mesh position={[side * r * 0.22, -r * 1.6, 0]}>
                  <coneGeometry args={[r * 0.12, r * 0.5, 8]} />
                  <meshStandardMaterial color={hexToColor(config.hairColor)} roughness={0.6} />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      );

    case 'twin-buns':
      return (
        <group>
          <mesh position={[0, r * 0.58, 0]} geometry={new THREE.SphereGeometry(r * 1.04, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58)} material={mat} />
          <mesh position={[0, r * 0.32, r * 0.7]} geometry={new THREE.BoxGeometry(r * 1.2, r * 0.25, 0.12)} material={mat} />
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * r * 0.85, r * 1.05, 0]}>
              {/* Odango bun */}
              <mesh>
                <sphereGeometry args={[r * 0.36, 16, 12]} />
                <meshStandardMaterial color={hexToColor(config.hairColor)} roughness={0.6} />
              </mesh>
              {/* Bun ribbon */}
              <mesh position={[0, -r * 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[r * 0.3, 0.04, 6, 16]} />
                <meshStandardMaterial color="#FF5C93" />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'hime-cut':
      return (
        <group>
          <mesh position={[0, r * 0.58, 0]} geometry={new THREE.SphereGeometry(r * 1.04, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58)} material={mat} />
          {/* Straight bangs */}
          <mesh position={[0, r * 0.32, r * 0.72]} geometry={new THREE.BoxGeometry(r * 1.25, r * 0.3, 0.12)} material={mat} />
          {/* Stepped side locks */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * r * 0.78, -r * 0.15, r * 0.42]} geometry={new THREE.BoxGeometry(0.12, r * 1.1, 0.18)} material={mat} />
          ))}
          {/* Long back sheet */}
          <mesh position={[0, -r * 0.8, -r * 0.35]} rotation={[windT * 0.03, 0, 0]} geometry={new THREE.BoxGeometry(r * 1.6, r * 2.2, 0.18)} material={mat} />
        </group>
      );

    case 'fluffy-short':
      return (
        <group>
          <mesh position={[0, r * 0.58, 0]} geometry={new THREE.SphereGeometry(r * 1.1, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62)} material={mat} />
          {/* Adorable Ahoge Antenna Cowlick on top */}
          <mesh position={[0, r * 1.35, 0.08]} rotation={[0.4 + windT * 0.1, 0, 0.35]}>
            <torusGeometry args={[r * 0.28, 0.032, 6, 16, Math.PI * 0.85]} />
            <meshStandardMaterial color={hexToColor(config.hairColor)} roughness={0.5} />
          </mesh>
        </group>
      );

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
  const isEmissive = config.top === 'futuristic-suit' || config.top === 'magical-dress';
  const topMat = useMaterial(config.topColor, 0.5, config.top === 'armor' ? 0.6 : 0, isEmissive ? config.topColor : undefined, isEmissive ? 0.3 : 0);
  const skinMat = useMaterial(config.skinTone, 0.7, 0);
  const whiteMat = useMaterial('#FFFFFF', 0.8, 0);
  const goldMat = useMaterial('#FFD700', 0.2, 0.8, '#FFD700', 0.4);

  const h = 0.72 * props.bodyScaleX;
  const w = 0.44 * props.bodyScaleX;
  const d = 0.32 * props.bodyScaleZ;

  return (
    <group>
      {/* Roblox Neck Joint Stud */}
      <mesh position={[0, h * 0.52, 0]} geometry={new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16)} material={skinMat} />

      {/* Robot glowing core */}
      {config.species === 'robot' && (
        <mesh position={[0, h * 0.1, d * 1.02]}>
          <circleGeometry args={[w * 0.3, 16]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.5} />
        </mesh>
      )}

      {/* Cute Dresses */}
      {config.top === 'lolita-dress' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.05, h, d * 2.02)} material={topMat} />
          {/* White Frilly Collar */}
          <mesh position={[0, h * 0.42, d * 0.95]} geometry={new THREE.TorusGeometry(w * 0.6, 0.05, 6, 20, Math.PI)} material={whiteMat} />
          {/* Cute Pink Bow on chest */}
          <mesh position={[0, h * 0.22, d * 1.05]}>
            <sphereGeometry args={[0.08, 12, 10]} />
            <meshStandardMaterial color="#FF5C93" />
          </mesh>
          {/* Flared Tiered Lolita Skirt */}
          <mesh position={[0, -h * 0.48, 0]} geometry={new THREE.CylinderGeometry(w * 1.15, w * 2.2, h * 0.8, 20)} material={topMat} />
          <mesh position={[0, -h * 0.85, 0]} geometry={new THREE.TorusGeometry(w * 2.15, 0.05, 6, 24)} material={whiteMat} />
        </>
      ) : config.top === 'maid-dress' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.05, h, d * 2.02)} material={topMat} />
          {/* Crisp White Apron Bib */}
          <mesh position={[0, h * 0.05, d * 1.03]} geometry={new THREE.BoxGeometry(w * 1.3, h * 0.8, 0.02)} material={whiteMat} />
          {/* White Apron Shoulder Ruffles */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * w * 0.7, h * 0.35, d * 0.6]} geometry={new THREE.BoxGeometry(0.12, 0.08, d * 1.4)} material={whiteMat} />
          ))}
          {/* Flared Maid Apron Skirt */}
          <mesh position={[0, -h * 0.46, 0]} geometry={new THREE.CylinderGeometry(w * 1.1, w * 2.15, h * 0.75, 20)} material={topMat} />
          <mesh position={[0, -h * 0.44, d * 0.55]} geometry={new THREE.CylinderGeometry(w * 0.95, w * 1.8, h * 0.7, 12, 1, false, -Math.PI * 0.35, Math.PI * 0.7)} material={whiteMat} />
        </>
      ) : config.top === 'magical-dress' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.05, h, d * 2.02)} material={topMat} />
          {/* Glowing Gemstone Star Brooch */}
          <mesh position={[0, h * 0.2, d * 1.06]}>
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshStandardMaterial color="#FFD700" emissive="#FF5C93" emissiveIntensity={2.0} />
          </mesh>
          {/* Flared Star Petal Skirt */}
          <mesh position={[0, -h * 0.48, 0]} geometry={new THREE.CylinderGeometry(w * 1.15, w * 2.3, h * 0.82, 16)} material={topMat} />
          <mesh position={[0, -h * 0.86, 0]} geometry={new THREE.TorusGeometry(w * 2.25, 0.05, 6, 24)}>
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.2} />
          </mesh>
        </>
      ) : config.top === 'sundress' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.0, h, d * 1.95)} material={topMat} />
          <mesh position={[0, h * 0.42, d * 0.95]} geometry={new THREE.TorusGeometry(w * 0.5, 0.035, 6, 16, Math.PI)} material={topMat} />
          <mesh position={[0, -h * 0.5, 0]} geometry={new THREE.CylinderGeometry(w * 1.05, w * 2.05, h * 0.85, 18)} material={topMat} />
        </>
      ) : config.top === 'princess-gown' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.08, h, d * 2.02)} material={topMat} />
          <mesh position={[0, h * 0.35, d * 1.04]} geometry={new THREE.BoxGeometry(w * 0.5, 0.06, 0.02)} material={goldMat} />
          <mesh position={[0, -h * 0.72, 0]} geometry={new THREE.CylinderGeometry(w * 1.1, w * 2.6, h * 1.3, 24)} material={topMat} />
        </>
      ) : config.top === 'cyber-dress' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.1, h, d * 2.04)} material={topMat} />
          <mesh position={[0, -h * 0.12, 0]} geometry={new THREE.BoxGeometry(w * 2.18, h * 0.28, d * 2.14)}>
            <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={1.8} />
          </mesh>
          <mesh position={[0, -h * 0.46, 0]} geometry={new THREE.CylinderGeometry(w * 1.1, w * 2.1, h * 0.72, 16)} material={topMat} />
        </>
      ) : config.top === 'hoodie-dress' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.18, h * 1.25, d * 2.12)} material={topMat} />
          <mesh position={[0, h * 0.42, -d * 0.75]} geometry={new THREE.SphereGeometry(w * 0.75, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={topMat} />
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * w * 0.3, h * 0.05, d * 1.1]}>
              <sphereGeometry args={[0.05, 10, 8]} />
              <meshStandardMaterial color="#FFFFFF" />
            </mesh>
          ))}
        </>
      ) : config.top === 'tshirt' || config.top === 'tank' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2, h, d * 2, 2, 2, 2)} material={topMat}>
            <meshStandardMaterial color={hexToColor(config.topColor)} roughness={0.65} metalness={0} />
          </mesh>
          <mesh position={[0, h * 0.44, d * 0.92]} geometry={new THREE.TorusGeometry(w * 0.52, 0.035, 8, 16, Math.PI)} material={skinMat} />
        </>
      ) : config.top === 'hoodie' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.1, h, d * 2.05, 2, 2, 2)} material={topMat} />
          <mesh position={[0, h * 0.38, -d * 0.7]} geometry={new THREE.SphereGeometry(w * 0.7, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={topMat} />
        </>
      ) : config.top === 'jacket' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.12, h, d * 2.08)} material={topMat} />
          <mesh position={[w * 0.3, h * 0.15, d * 1.02]} rotation={[0, 0, 0.4]} geometry={new THREE.BoxGeometry(0.1, h * 0.55, 0.04)} material={topMat} />
          <mesh position={[-w * 0.3, h * 0.15, d * 1.02]} rotation={[0, 0, -0.4]} geometry={new THREE.BoxGeometry(0.1, h * 0.55, 0.04)} material={topMat} />
        </>
      ) : config.top === 'armor' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.2, h, d * 2.1)} material={topMat} />
          <mesh position={[w * 0.28, h * 0.1, d * 1.01]} geometry={new THREE.BoxGeometry(w * 0.8, h * 0.5, 0.06)} material={topMat} />
          <mesh position={[-w * 0.28, h * 0.1, d * 1.01]} geometry={new THREE.BoxGeometry(w * 0.8, h * 0.5, 0.06)} material={topMat} />
        </>
      ) : config.top === 'futuristic-suit' ? (
        <>
          <mesh castShadow geometry={new THREE.BoxGeometry(w * 2.08, h, d * 2.0)} material={topMat} />
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

function AvatarArms({ config, breathT, action = 'idle' }: { config: AvatarConfig; breathT: number; action?: string }) {
  const props = getBodyProps(config);
  const topMat = useMaterial(config.topColor, 0.5, config.top === 'armor' ? 0.6 : 0);
  const skinMat = useMaterial(config.skinTone, 0.65, 0.05);
  const w = 0.44 * props.bodyScaleX;
  const armW = 0.34 * props.armScale;
  const armL = 0.72 * props.armScale;

  return (
    <>
      {([-1, 1] as const).map((side) => {
        let armRotX = breathT * 0.08 * side;
        let armRotZ = side * 0.06;

        if (action === 'attack') {
          armRotX = side === 1 ? -Math.PI * 0.5 : Math.PI * 0.25;
        } else if (action === 'defend') {
          armRotX = -Math.PI * 0.42;
          armRotZ = -side * 0.28;
        } else if (action === 'victory') {
          armRotX = -Math.PI * 0.85;
          armRotZ = side * 0.25;
        } else if (action === 'hit') {
          armRotX = Math.PI * 0.35;
          armRotZ = side * 0.3;
        }

        return (
          <group
            key={side}
            position={[side * (w + armW * 0.52), 0.08, 0]}
            rotation={[armRotX, 0, armRotZ]}
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

            {/* Blocky Hand / Lower Arm */}
            <mesh
              castShadow
              position={[0, -armL * 0.78, 0]}
              geometry={new THREE.BoxGeometry(armW * 0.95, armL * 0.36, armW * 0.95)}
              material={skinMat}
            />

            {/* Weapon held in right hand (side === 1) */}
            {side === 1 && config.weapon && config.weapon !== 'unarmed' && (
              <group position={[0, -armL * 0.88, armW * 0.35]} rotation={[Math.PI * 0.45, 0, 0]}>
                {config.weapon === 'photon-blade' && (
                  <group>
                    <mesh geometry={new THREE.CylinderGeometry(0.04, 0.045, 0.22, 10)}>
                      <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.65, 0]} geometry={new THREE.CylinderGeometry(0.025, 0.035, 1.1, 10)}>
                      <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3.0} />
                    </mesh>
                  </group>
                )}
                {config.weapon === 'cyber-staff' && (
                  <group>
                    <mesh geometry={new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8)}>
                      <meshStandardMaterial color="#7C5CFF" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.75, 0]}>
                      <sphereGeometry args={[0.12, 16, 12]} />
                      <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.5} />
                    </mesh>
                  </group>
                )}
                {config.weapon === 'plasma-blaster' && (
                  <group>
                    <mesh geometry={new THREE.BoxGeometry(0.12, 0.22, 0.45)}>
                      <meshStandardMaterial color="#1E293B" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.04, 0.28]} geometry={new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8)} rotation={[Math.PI / 2, 0, 0]}>
                      <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2.0} />
                    </mesh>
                  </group>
                )}
                {config.weapon === 'void-scythe' && (
                  <group>
                    <mesh geometry={new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8)}>
                      <meshStandardMaterial color="#0F172A" />
                    </mesh>
                    <mesh position={[0.3, 0.7, 0]} rotation={[0, 0, -0.6]} geometry={new THREE.BoxGeometry(0.65, 0.08, 0.04)}>
                      <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={2.5} />
                    </mesh>
                  </group>
                )}
                {config.weapon === 'star-wand' && (
                  <group>
                    <mesh geometry={new THREE.CylinderGeometry(0.025, 0.03, 0.85, 8)}>
                      <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.48, 0]}>
                      <coneGeometry args={[0.14, 0.26, 5]} />
                      <meshStandardMaterial color="#FFDF00" emissive="#FF69B4" emissiveIntensity={2.5} />
                    </mesh>
                  </group>
                )}
                {config.weapon === 'energy-hammer' && (
                  <group>
                    <mesh geometry={new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8)}>
                      <meshStandardMaterial color="#334155" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.6, 0]} geometry={new THREE.BoxGeometry(0.35, 0.3, 0.45)}>
                      <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={1.8} />
                    </mesh>
                  </group>
                )}
              </group>
            )}
          </group>
        );
      })}
    </>
  );
}

function AvatarLegs({ config, shiftT }: { config: AvatarConfig; shiftT: number }) {
  const props = getBodyProps(config);
  const bottomMat = useMaterial(config.bottomColor, 0.65, 0);
  const legW = 0.36 * props.legScale;
  const legH = 0.68 * props.legScale;
  const legSep = legW * 0.55;

  const hasSkirt = config.bottom === 'skirt' || config.bottom === 'frill-skirt' || config.bottom === 'tutu' || config.bottom === 'maid-apron-skirt';

  return (
    <>
      {/* 3D Skirt Overlay */}
      {hasSkirt && (
        <group position={[0, 0.04, 0]}>
          <mesh castShadow geometry={new THREE.CylinderGeometry(legW * 1.35, legW * 2.25, legH * 0.68, 16)} material={bottomMat} />
          {config.bottom === 'frill-skirt' && (
            <mesh position={[0, -legH * 0.34, 0]} geometry={new THREE.TorusGeometry(legW * 2.2, 0.04, 6, 20)} material={bottomMat} />
          )}
          {config.bottom === 'tutu' && (
            <mesh position={[0, -legH * 0.12, 0]} geometry={new THREE.CylinderGeometry(legW * 1.6, legW * 2.6, legH * 0.45, 20)}>
              <meshStandardMaterial color={hexToColor(config.bottomColor)} transparent opacity={0.65} roughness={0.9} />
            </mesh>
          )}
        </group>
      )}

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
    case 'cat-ears':
      return (
        <group position={[0, headRadius * 0.9, 0]}>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * headRadius * 0.55, 0, 0]} rotation={[0, 0, -side * 0.25]}>
              <mesh geometry={new THREE.ConeGeometry(headRadius * 0.32, headRadius * 0.6, 4)} material={mat} />
              <mesh position={[0, 0, 0.04]} geometry={new THREE.ConeGeometry(headRadius * 0.2, headRadius * 0.45, 4)}>
                <meshStandardMaterial color="#FF5C93" roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'bunny-ears':
      return (
        <group position={[0, headRadius * 1.0, 0]}>
          <mesh geometry={new THREE.TorusGeometry(headRadius * 0.85, 0.035, 6, 20, Math.PI)} material={darkMat} />
          <mesh position={[0, headRadius * 0.1, headRadius * 0.3]}>
            <sphereGeometry args={[0.08, 12, 10]} />
            <meshStandardMaterial color="#FF5C93" />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * headRadius * 0.38, headRadius * 0.6, 0]} rotation={[0, 0, side * 0.12]}>
              <mesh geometry={new THREE.CylinderGeometry(0.08, 0.12, headRadius * 1.3, 12)} material={mat} />
              <mesh position={[0, 0, 0.03]} geometry={new THREE.CylinderGeometry(0.04, 0.07, headRadius * 1.1, 12)}>
                <meshStandardMaterial color="#FF8FA3" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'bow':
      return (
        <group position={[0, headRadius * 1.05, headRadius * 0.2]} rotation={[-0.3, 0, 0]}>
          <mesh>
            <sphereGeometry args={[headRadius * 0.16, 12, 10]} />
            <meshStandardMaterial color={hexToColor(config.accessoryColor)} roughness={0.3} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * headRadius * 0.38, 0, 0]} rotation={[0, 0, side * 0.3]}>
              <cylinderGeometry args={[headRadius * 0.12, headRadius * 0.32, headRadius * 0.5, 12]} />
              <meshStandardMaterial color={hexToColor(config.accessoryColor)} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'halo':
      return (
        <group position={[0, headRadius * 1.55, 0]} rotation={[0.2, 0, 0]}>
          <mesh>
            <torusGeometry args={[headRadius * 0.75, 0.035, 8, 30]} />
            <meshStandardMaterial color="#FFDF00" emissive="#FFD700" emissiveIntensity={2.5} roughness={0.1} />
          </mesh>
        </group>
      );
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
          <mesh geometry={new THREE.TorusGeometry(headRadius * 1.0, 0.04, 6, 20, Math.PI)} material={darkMat} />
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
    case 'ribbon-choker':
      return (
        <group position={[0, -headRadius * 0.48, 0]}>
          <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.52, headRadius * 0.52, 0.07, 20)} material={mat} />
          <mesh position={[0, -0.02, headRadius * 0.54]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} emissive="#FFD700" emissiveIntensity={0.5} />
          </mesh>
        </group>
      );
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
    case 'angel-wings': {
      const flap = Math.sin(windT * 2.5) * 0.25;
      return (
        <group position={[0, 0.2, -0.28]}>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.18, 0, 0]} rotation={[0, side * 0.3, side * (0.35 + flap)]}>
              <mesh position={[side * 0.35, 0.25, 0]} geometry={new THREE.ConeGeometry(0.18, 0.8, 6)} rotation={[0, 0, -side * 0.8]}>
                <meshStandardMaterial color="#FFFFFF" emissive="#E0E7FF" emissiveIntensity={0.3} roughness={0.5} />
              </mesh>
              <mesh position={[side * 0.5, 0.05, 0]} geometry={new THREE.ConeGeometry(0.16, 0.75, 6)} rotation={[0, 0, -side * 1.1]}>
                <meshStandardMaterial color="#FFFFFF" emissive="#E0E7FF" emissiveIntensity={0.2} roughness={0.5} />
              </mesh>
              <mesh position={[side * 0.55, -0.2, 0]} geometry={new THREE.ConeGeometry(0.14, 0.65, 6)} rotation={[0, 0, -side * 1.3]}>
                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    }
    case 'fairy-wings': {
      const flap = Math.sin(windT * 5.0) * 0.35;
      return (
        <group position={[0, 0.2, -0.26]}>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.16, 0, 0]} rotation={[0, side * 0.2, side * (0.4 + flap)]}>
              <mesh position={[side * 0.38, 0.28, 0]} rotation={[0, 0, -side * 0.5]}>
                <circleGeometry args={[0.42, 16]} />
                <meshStandardMaterial color="#22D3EE" emissive="#FF5C93" emissiveIntensity={0.5} transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[side * 0.28, -0.15, 0]} rotation={[0, 0, -side * 1.2]}>
                <circleGeometry args={[0.26, 16]} />
                <meshStandardMaterial color="#A855F7" emissive="#22D3EE" emissiveIntensity={0.4} transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
        </group>
      );
    }
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

export interface AvatarModelProps {
  config: AvatarConfig;
  animate?: boolean;
  action?: 'idle' | 'attack' | 'hit' | 'defend' | 'victory';
}

export function AvatarModel({ config, animate = true, action = 'idle' }: AvatarModelProps) {
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

    // Combat action / breathing pose
    if (groupRef.current) {
      if (action === 'attack') {
        groupRef.current.position.z = 0.55;
        groupRef.current.position.y = 0.08;
        groupRef.current.rotation.x = -0.15;
      } else if (action === 'hit') {
        groupRef.current.position.z = -0.45;
        groupRef.current.position.y = 0.12;
        groupRef.current.rotation.x = 0.28;
      } else if (action === 'defend') {
        groupRef.current.position.z = -0.1;
        groupRef.current.position.y = -0.05;
        groupRef.current.rotation.x = 0.08;
      } else if (action === 'victory') {
        groupRef.current.position.y = Math.abs(Math.sin(breathT.current * 4.0)) * 0.22;
        groupRef.current.position.z = 0;
        groupRef.current.rotation.x = 0;
      } else {
        // Idle
        groupRef.current.position.y = Math.sin(breathT.current * 1.2) * 0.015;
        groupRef.current.position.z = 0;
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.y = Math.sin(shiftT.current * 0.4) * 0.04;
      }
    }
  });

  const props = getBodyProps(config);
  const isChibi = config.body.type === 'chibi';
  const torsoY = isChibi ? 0.28 : 0.38;
  const legsY = isChibi ? -0.22 : -0.28;
  const headY = isChibi ? 0.92 : 0.78;
  const armsY = isChibi ? 0.22 : 0.3;

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
        <AvatarHair config={config} headRadius={props.headRadius} windT={wt} />
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
        {config.accessories.back && (
          <AvatarAccessoryBack id={config.accessories.back} config={config} windT={wt} />
        )}
        {config.accessories.shoulder && (
          <AvatarAccessoryShoulder id={config.accessories.shoulder} config={config} />
        )}
      </group>

      {/* Arms with Weapon and Action Animation */}
      <group position={[0, armsY, 0]}>
        <AvatarArms config={config} breathT={bt} action={action} />
      </group>

      {/* Legs with Skirt */}
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
