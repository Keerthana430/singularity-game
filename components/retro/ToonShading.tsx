'use client';
// components/retro/ToonShading.tsx
// Core 3D Toon Shading engine for SINGULARITY: Retro-Anime Direction.
// Provides stepped discrete cell-shading gradient maps, cel materials, and 4 anime lighting rigs.

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Creates a stepped discrete 1D gradient map texture with NearestFilter.
 * This forces Three.js MeshToonMaterial into sharp anime cel-shading bands.
 */
export function createToonGradientMap(steps: 2 | 3 | 4 = 3): THREE.DataTexture {
  let values: number[];
  if (steps === 2) {
    values = [70, 255];
  } else if (steps === 3) {
    values = [60, 165, 255];
  } else {
    values = [45, 115, 185, 255];
  }

  const data = new Uint8Array(values);
  const texture = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Hook to memoize and reuse stepped MeshToonMaterial.
 */
export function useToonMaterial(
  colorHex: string,
  emissiveHex?: string,
  emissiveIntensity = 0,
  steps: 2 | 3 | 4 = 3
) {
  const gradientMap = useMemo(() => createToonGradientMap(steps), [steps]);

  return useMemo(() => {
    const mat = new THREE.MeshToonMaterial({
      color: new THREE.Color(colorHex),
      gradientMap,
    });
    if (emissiveHex) {
      mat.emissive = new THREE.Color(emissiveHex);
      mat.emissiveIntensity = emissiveIntensity;
    }
    return mat;
  }, [colorHex, gradientMap, emissiveHex, emissiveIntensity]);
}

/**
 * Presets for Anime 3-Point + Colored Practical Lighting Rigs
 */
export type AnimeLightingPreset = 'arena' | 'tabletop' | 'mountain' | 'runway';

export function AnimeLightingRig({
  preset = 'arena',
  rimIntensity = 2.5,
  keyIntensity = 2.8,
  fillIntensity = 0.8,
  showGizmo = false,
}: {
  preset?: AnimeLightingPreset;
  rimIntensity?: number;
  keyIntensity?: number;
  fillIntensity?: number;
  showGizmo?: boolean;
}) {
  const rimLightRef = useRef<THREE.DirectionalLight>(null);

  // Subtle breathing oscillation for the dramatic anime rim backlight
  useFrame((state) => {
    if (rimLightRef.current) {
      const t = state.clock.getElapsedTime();
      rimLightRef.current.intensity = rimIntensity + Math.sin(t * 1.5) * 0.2;
    }
  });

  return (
    <group name={`anime-lighting-${preset}`}>
      {/* 1. KEY LIGHT: High-contrast directional light casting sharp anime shadows */}
      {preset === 'arena' && (
        <directionalLight
          position={[6, 12, 7]}
          intensity={keyIntensity}
          color="#FFFDF5"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
      )}
      {preset === 'tabletop' && (
        <directionalLight
          position={[8, 16, 10]}
          intensity={keyIntensity * 0.9}
          color="#F8FAFC"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      )}
      {preset === 'mountain' && (
        <directionalLight
          position={[10, 20, 14]}
          intensity={keyIntensity}
          color="#E0F2FE"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      )}
      {preset === 'runway' && (
        <directionalLight
          position={[0, 14, 10]}
          intensity={keyIntensity * 1.1}
          color="#FFF8E7"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      )}

      {/* 2. RIM LIGHT (BACKLIGHT): The defining retro-anime silhouette halo */}
      <directionalLight
        ref={rimLightRef}
        position={[-6, 8, -9]}
        intensity={rimIntensity}
        color={preset === 'runway' ? '#FFD600' : preset === 'mountain' ? '#00E5FF' : '#00FF66'}
      />

      {/* Secondary Edge Rim */}
      <directionalLight
        position={[8, 6, -8]}
        intensity={rimIntensity * 0.65}
        color="#38BDF8"
      />

      {/* 3. SOFT AMBIENT FILL: Cool blue/charcoal shadows, avoiding pitch black mud */}
      <ambientLight
        intensity={fillIntensity}
        color={preset === 'arena' ? '#1E293B' : preset === 'mountain' ? '#0F172A' : '#18241D'}
      />

      {/* 4. PRACTICAL ACCENT LIGHTS (Atmospheric in-universe color glow) */}
      {preset === 'arena' && (
        <>
          <pointLight position={[0, -0.2, 0]} intensity={3.0} color="#00FF66" distance={6} />
          <pointLight position={[-4, 2, 4]} intensity={1.5} color="#00E5FF" distance={8} />
          <pointLight position={[4, 2, -4]} intensity={1.2} color="#D946EF" distance={8} />
        </>
      )}
      {preset === 'tabletop' && (
        <>
          <pointLight position={[0, 1.5, 0]} intensity={2.8} color="#00FF66" distance={10} />
          <pointLight position={[-6, 3, -6]} intensity={1.8} color="#2962FF" distance={9} />
          <pointLight position={[6, 3, 6]} intensity={1.8} color="#FFD600" distance={9} />
        </>
      )}
      {preset === 'mountain' && (
        <>
          <pointLight position={[0, 11, -6]} intensity={4.0} color="#FFD600" distance={12} />
          <pointLight position={[-3, 4, 0]} intensity={2.2} color="#00FF66" distance={10} />
        </>
      )}
      {preset === 'runway' && (
        <>
          <spotLight position={[0, 8, 0]} intensity={5.0} angle={0.6} penumbra={0.4} color="#FFFFFF" castShadow />
          <pointLight position={[-2.5, 0.4, 2]} intensity={2.0} color="#D946EF" distance={5} />
          <pointLight position={[2.5, 0.4, -2]} intensity={2.0} color="#00E5FF" distance={5} />
        </>
      )}
    </group>
  );
}
