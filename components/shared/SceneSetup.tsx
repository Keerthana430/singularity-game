'use client';

import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Custom hook to detect when document visibility changes (tab backgrounded)
 * to allow pausing intensive render loops / animations and save GPU power.
 */
export function useVisibilityPause() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

/**
 * Returns mobile-safe capped DPR to avoid mobile GPU thermal throttling.
 */
export function getRecommendedDpr(): [number, number] {
  if (typeof window === 'undefined') return [1, 2];
  const isMobile = window.innerWidth < 768;
  return isMobile ? [1, 1.5] : [1, 2];
}

interface SharedLightingRigProps {
  ambientColor?: string;
  ambientIntensity?: number;
  sunColor?: string;
  sunIntensity?: number;
  sunPosition?: [number, number, number];
}

/**
 * Standard three-point holographic sci-fi lighting rig
 */
export function SharedLightingRig({
  ambientColor = '#061309',
  ambientIntensity = 0.5,
  sunColor = '#ECFDF5',
  sunIntensity = 1.4,
  sunPosition = [3, 8, 4],
}: SharedLightingRigProps) {
  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <directionalLight
        position={sunPosition}
        color={sunColor}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      {/* Cyan/Emerald Rim Light */}
      <directionalLight position={[-4, 3, -4]} color="#00FF66" intensity={0.65} />
      {/* Subtle Magenta/Violet Counter-Rim */}
      <directionalLight position={[4, 2, -3]} color="#A855F7" intensity={0.4} />
    </>
  );
}
