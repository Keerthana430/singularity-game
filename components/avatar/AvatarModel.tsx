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

export function getBodyProps(config: AvatarConfig) {
  const { type, height, headSize, bodySize } = config.body;
  const rawSpecies = (config.species || 'human').toLowerCase();
  const speciesKey = rawSpecies === 'fairie' ? 'fairy' : rawSpecies === 'dwarves' ? 'dwarf' : rawSpecies;

  // ── SPECIES DISTINCT VISUAL BUILDS (LORE ACCURATE) ──
  // User Reference Scale: Elf ~10, Human ~7, Dwarf ~5, Fairy ~3
  // Human: Medium, athletic, balanced (Height 1.0, golden ratio)
  // Elf: Slender, lithe, wasp waist, tall graceful legs (~10 vs 7)
  // Dwarf: Short, stout, "a bit fat", wide barrel chest & warrior belly (~5 vs 7)
  // Fairy: Tiny, delicate, short and cute, hovering with 4 wings (~3 vs 7)
  // Robot: Sleek cybernetic automaton, balanced stance
  // Ogre: Heavy towering brute with massive frame
  const speciesProfiles: Record<string, {
    overallScale: number;
    torsoHScale: number;
    bodyScaleX: number;
    bodyScaleZ: number;
    armScale: number;
    armWidthScale: number;
    legScale: number;
    legWidthScale: number;
    headRadius: number;
    hoverOffset: number;
    isTiny: boolean;
  }> = {
    human: {
      overallScale: 1.0,    // Reference: Normal athletic build (~7)
      torsoHScale: 1.0,
      bodyScaleX: 1.0,
      bodyScaleZ: 1.0,
      armScale: 1.0,
      armWidthScale: 1.0,
      legScale: 1.0,
      legWidthScale: 1.0,
      headRadius: 0.18,
      hoverOffset: 0,
      isTiny: false,
    },
    elf: {
      overallScale: 1.28,   // Reference: Tall & Slender (~10 vs human 7)
      torsoHScale: 1.08,    // Elongated graceful torso
      bodyScaleX: 0.78,    // Wasp waist, slender ribcage
      bodyScaleZ: 0.76,    // Sleek flat profile
      armScale: 1.12,      // Long graceful arms
      armWidthScale: 0.78, // Slender arms
      legScale: 1.22,      // Very long graceful supermodel legs
      legWidthScale: 0.78, // Slender legs
      headRadius: 0.165,   // Refined, smaller head = tall 8.5 head heroic ratio
      hoverOffset: 0,
      isTiny: false,
    },
    dwarf: {
      overallScale: 0.72,   // Reference: Short & stout (~5 vs human 7)
      torsoHScale: 0.84,    // Compact torso
      bodyScaleX: 1.30,    // Stout barrel chest & warrior belly
      bodyScaleZ: 1.32,    // Sturdy thick depth
      armScale: 0.84,      // Short sturdy arms
      armWidthScale: 1.35, // Muscular thick heavy brawny arms
      legScale: 0.74,      // Short stocky legs
      legWidthScale: 1.32, // Wide sturdy grounded legs
      headRadius: 0.20,    // Sturdy square-jawed head with braided beard
      hoverOffset: 0,
      isTiny: false,
    },
    fairy: {
      overallScale: 0.44,   // Reference: Small, short and cute! (~3 vs human 7)
      torsoHScale: 0.80,    // Petite cute chibi torso
      bodyScaleX: 0.76,    // Delicate tiny waist
      bodyScaleZ: 0.76,
      armScale: 0.72,      // Delicate tiny arms
      armWidthScale: 0.70,
      legScale: 0.68,      // Petite cute legs
      legWidthScale: 0.72,
      headRadius: 0.18,    // Cute chibi anime proportions (~4 heads tall)
      hoverOffset: 0.36,   // Floats in mid-air above the dais!
      isTiny: true,        // 4 fluttering translucent wings + sparkle motes
    },
    robot: {
      overallScale: 1.02,
      torsoHScale: 1.0,
      bodyScaleX: 1.0,
      bodyScaleZ: 0.98,
      armScale: 1.0,
      armWidthScale: 1.0,
      legScale: 1.0,
      legWidthScale: 1.0,
      headRadius: 0.18,
      hoverOffset: 0,
      isTiny: false,
    },
    ogre: {
      overallScale: 1.25,
      torsoHScale: 1.15,
      bodyScaleX: 1.35,
      bodyScaleZ: 1.32,
      armScale: 1.15,
      armWidthScale: 1.32,
      legScale: 1.05,
      legWidthScale: 1.30,
      headRadius: 0.21,
      hoverOffset: 0,
      isTiny: false,
    },
    alien: {
      overallScale: 1.06,
      torsoHScale: 1.06,
      bodyScaleX: 0.80,
      bodyScaleZ: 0.80,
      armScale: 1.08,
      armWidthScale: 0.78,
      legScale: 1.12,
      legWidthScale: 0.78,
      headRadius: 0.19,
      hoverOffset: 0,
      isTiny: false,
    },
  };

  const sp = speciesProfiles[speciesKey] || speciesProfiles.human;

  const base = {
    slim:    { bodyScaleX: 0.90, bodyScaleZ: 0.88, armScale: 0.98, legScale: 1.02, headRadius: 0.18 },
    regular: { bodyScaleX: 1.0,  bodyScaleZ: 1.0,  armScale: 1.0,  legScale: 1.0,  headRadius: 0.18 },
    broad:   { bodyScaleX: 1.10, bodyScaleZ: 1.10, armScale: 1.04, legScale: 0.98, headRadius: 0.19 },
    chibi:   { bodyScaleX: 1.0,  bodyScaleZ: 1.0,  armScale: 0.92, legScale: 0.85, headRadius: 0.20 },
  }[type] || { bodyScaleX: 1.0, bodyScaleZ: 1.0, armScale: 1.0, legScale: 1.0, headRadius: 0.18 };

  // Safe normalized clamp for user slider values to prevent models blowing out of the window
  const safeHeight = Math.max(0.75, Math.min(1.25, height || 1.0));
  const safeBodySize = Math.max(0.75, Math.min(1.3, bodySize || 1.0));
  const safeHeadSize = Math.max(0.8, Math.min(1.2, headSize || 1.0));

  const isMale = config.gender === 'male';

  return {
    speciesKey,
    isTiny: sp.isTiny,
    isMale,
    totalScale: safeHeight * sp.overallScale,
    hoverOffset: sp.hoverOffset,
    torsoHScale: sp.torsoHScale * (isMale ? 1.04 : 0.98),
    headRadius: base.headRadius * safeHeadSize * (sp.headRadius / 0.18),
    bodyScaleX: base.bodyScaleX * safeBodySize * sp.bodyScaleX * (isMale ? 1.08 : 0.95),
    bodyScaleZ: base.bodyScaleZ * safeBodySize * sp.bodyScaleZ * (isMale ? 0.98 : 0.95),
    armScale: base.armScale * sp.armScale,
    armWidthScale: sp.armWidthScale * (isMale ? 1.10 : 0.92),
    legScale: base.legScale * sp.legScale,
    legWidthScale: sp.legWidthScale * (isMale ? 1.08 : 0.92),
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface HeadProps {
  config: AvatarConfig;
  blinkT?: number;
  lookX?: number;
  lookY?: number;
}

function AvatarHead({ config }: HeadProps) {
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const blinkTimer = useRef(Math.random() * 3 + 2.5);
  const isBlinking = useRef(false);
  const blinkProgress = useRef(0);
  const lookTarget = useRef({ x: 0, y: 0 });
  const lookCurrent = useRef({ x: 0, y: 0 });

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.1, delta);

    // Natural head breathing micro-nod and micro-gaze
    if (Math.random() < 0.008) {
      lookTarget.current = {
        x: (Math.random() - 0.5) * 0.12,
        y: (Math.random() - 0.5) * 0.08,
      };
    }
    lookCurrent.current.x = THREE.MathUtils.lerp(lookCurrent.current.x, lookTarget.current.x, dt * 2.5);
    lookCurrent.current.y = THREE.MathUtils.lerp(lookCurrent.current.y, lookTarget.current.y, dt * 2.5);

    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 1.5) * 0.015 + lookCurrent.current.y;
      headRef.current.rotation.y = Math.sin(t * 0.8) * 0.025 + lookCurrent.current.x;
    }

    // Natural Eye Blink Cycle (0.12s blink every 2.5-6 seconds)
    blinkTimer.current -= dt;
    if (blinkTimer.current <= 0) {
      isBlinking.current = true;
      blinkProgress.current = 1.0;
      blinkTimer.current = Math.random() * 3.5 + 2.5;
    }

    if (isBlinking.current) {
      blinkProgress.current -= dt * 7.5;
      if (blinkProgress.current <= 0) {
        blinkProgress.current = 0;
        isBlinking.current = false;
      }
    }

    const scaleY = 1.0 - Math.sin(blinkProgress.current * Math.PI) * 0.9;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = scaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = scaleY;
  });

  const props = getBodyProps(config);
  const headRadius = props.headRadius;
  const isMale = props.isMale;
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

  const rawSpecies = (config.species || 'human').toLowerCase();
  const isElf = rawSpecies === 'elf';
  const isDwarf = rawSpecies === 'dwarf' || rawSpecies === 'dwarves';
  const isFairy = rawSpecies === 'fairy' || rawSpecies === 'fairie';
  const isOgre = rawSpecies === 'ogre';
  const isRobot = rawSpecies === 'robot';
  const isAlien = rawSpecies === 'alien';

  // Face shape modifiers (eliminates puffy roundness, implements sleek anime V-line & RPG archetypes)
  const faceShape = config.face.shape || 'oval';
  const shapeModifiers = {
    oval:   { widthMult: 0.93, heightMult: 1.08, jawTaper: 0.70, chinWidth: 0.28, cheekScale: 0.65 },
    heart:  { widthMult: 0.96, heightMult: 1.05, jawTaper: 0.56, chinWidth: 0.22, cheekScale: 0.75 },
    square: { widthMult: 1.02, heightMult: 1.02, jawTaper: 0.90, chinWidth: 0.48, cheekScale: 0.70 },
    round:  { widthMult: 0.95, heightMult: 1.00, jawTaper: 0.78, chinWidth: 0.35, cheekScale: 0.65 },
  }[faceShape] || { widthMult: 0.93, heightMult: 1.08, jawTaper: 0.70, chinWidth: 0.28, cheekScale: 0.65 };

  // Species-specific facial sculpting overrides
  let speciesJawMult = 1.0;
  let speciesChinMult = 1.0;
  let speciesWidthMult = 1.0;
  let speciesHeightMult = 1.0;

  if (isElf) {
    // Ethereal aristocratic V-line jaw, slender cranium, high cheekbones
    speciesJawMult = 0.75;
    speciesChinMult = 0.65;
    speciesWidthMult = 0.89;
    speciesHeightMult = 1.12;
  } else if (isFairy) {
    // Delicate petite anime sprite jawline
    speciesJawMult = 0.78;
    speciesChinMult = 0.70;
    speciesWidthMult = 0.91;
    speciesHeightMult = 1.04;
  } else if (isDwarf) {
    // Broad, rugged, chiseled warrior jawline
    speciesJawMult = 1.25;
    speciesChinMult = 1.40;
    speciesWidthMult = 1.14;
    speciesHeightMult = 0.96;
  } else if (isRobot) {
    // Angular cybernetic jaw plates
    speciesJawMult = 0.92;
    speciesChinMult = 0.85;
    speciesWidthMult = 0.95;
    speciesHeightMult = 1.04;
  } else if (isOgre) {
    // Massive brutish underbite jaw
    speciesJawMult = 1.35;
    speciesChinMult = 1.45;
    speciesWidthMult = 1.20;
    speciesHeightMult = 1.02;
  } else if (isAlien) {
    // Slender, elongated xenomorphic cranium with sharp tapered chin
    speciesJawMult = 0.60;
    speciesChinMult = 0.45;
    speciesWidthMult = 0.86;
    speciesHeightMult = 1.18;
  }

  const finalWidthMult = shapeModifiers.widthMult * speciesWidthMult;
  const finalHeightMult = shapeModifiers.heightMult * speciesHeightMult;
  const chinTaperRadius = headRadius * shapeModifiers.chinWidth * speciesChinMult;

  const eyeOffsetX = headRadius * 0.45 * finalWidthMult;
  const eyeY = headRadius * 0.02;
  const isAnimeOrSparkle = config.face.eyes === 'anime' || config.face.eyes === 'sparkle';
  const eyeScale = isAnimeOrSparkle ? 1.25 : config.face.eyes === 'narrow' ? 0.75 : 1.0;

  const mouthY = -headRadius * 0.38 * finalHeightMult;
  const isCuteSmile = config.face.expression === 'happy' || config.face.expression === 'blushing' || config.face.expression === 'uwu';
  const mouthMat = useMaterial(isCuteSmile ? '#FF4D80' : '#111111', 0.8, 0);

  return (
    <group ref={headRef}>
      {/* 3D Stylized Cranium (Proportional anime oval head, no bloated sphere ballooning) */}
      <mesh
        castShadow
        geometry={new THREE.SphereGeometry(headRadius, 32, 24)}
        scale={[finalWidthMult, finalHeightMult, 0.98]}
        material={skinMat}
      />

      {/* 3D Sculpted Tapered Jawline & Lower Face (Anime / RPG V-line Contour) */}
      <mesh
        castShadow
        position={[0, -headRadius * 0.38 * finalHeightMult, headRadius * 0.16]}
        geometry={new THREE.CylinderGeometry(
          headRadius * 0.86 * finalWidthMult,
          chinTaperRadius,
          headRadius * 0.60 * finalHeightMult,
          24
        )}
        scale={[1, 1, 0.76]}
        material={skinMat}
      />

      {/* 3D Sculpted Chiseled Chin Node */}
      <mesh
        castShadow
        position={[0, -headRadius * 0.68 * finalHeightMult, headRadius * 0.24]}
        geometry={new THREE.SphereGeometry(chinTaperRadius * 0.90, 18, 14)}
        scale={[isDwarf || isOgre ? 1.4 : 1.0, 0.72, 1.05]}
        material={skinMat}
      />

      {/* Subtle High Cheekbone Contours (Flush to skull wall, no hamster cheeks) */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`cheek-${side}`}
          position={[side * headRadius * 0.60 * finalWidthMult, -headRadius * 0.10 * finalHeightMult, headRadius * 0.44]}
          geometry={new THREE.SphereGeometry(headRadius * 0.12 * shapeModifiers.cheekScale, 14, 12)}
          scale={[0.75, 0.60, 0.32]}
          material={skinMat}
        />
      ))}

      {/* Cute 3D Sculpted Anime Nose Button */}
      <mesh
        position={[0, -headRadius * 0.08, headRadius * 0.92]}
        geometry={new THREE.ConeGeometry(headRadius * 0.055, headRadius * 0.10, 4)}
        rotation={[0.3, 0, 0]}
        material={skinMat}
      />

      {/* Rosy Blush Cheeks (Flush to skin surface, soft glow) */}
      {([-1, 1] as const).map((side) => (
        <group key={`blush-${side}`} position={[side * eyeOffsetX, eyeY - headRadius * 0.20, headRadius * 0.84]}>
          <mesh scale={[1, 0.45, 0.12]}>
            <sphereGeometry args={[headRadius * 0.16, 14, 12]} />
            <meshStandardMaterial
              color="#FF5C8A"
              roughness={0.9}
              transparent
              opacity={config.face.expression === 'blushing' ? 0.85 : 0.40}
            />
          </mesh>
          <mesh position={[side * 0.008, 0.008, 0.004]} scale={[1, 1, 0.2]}>
            <sphereGeometry args={[headRadius * 0.04, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* True 3D Expressive Eyes with Spherical Depth */}
      {([-1, 1] as const).map((side) => {
        const isWinkRight = config.face.eyes === 'wink' && side === 1;
        const eyeR = headRadius * 0.20 * eyeScale;
        return (
          <group
            key={side}
            ref={side === -1 ? leftEyeRef : rightEyeRef}
            position={[side * eyeOffsetX, eyeY, headRadius * 0.86]}
          >
            {isWinkRight ? (
              // Curved Playful Wink Arc ^
              <mesh rotation={[0, 0, 0]} position={[0, -0.005, 0.01]}>
                <torusGeometry args={[eyeR * 0.75, eyeR * 0.18, 6, 16, Math.PI]} />
                <meshStandardMaterial color={hexToColor('#111111')} />
              </mesh>
            ) : (
              <>
                {/* 3D Eyeball White */}
                <mesh geometry={new THREE.SphereGeometry(eyeR, 20, 16)} scale={[1, 1.22, 0.45]} material={eyeWhiteMat} />
                {/* 3D Iris Sphere */}
                <mesh position={[0, 0, eyeR * 0.25]} geometry={new THREE.SphereGeometry(eyeR * 0.75, 18, 16)} scale={[1, 1.18, 0.3]} material={eyeMat} />
                {/* 3D Pupil Core */}
                <mesh position={[0, 0, eyeR * 0.36]} geometry={new THREE.SphereGeometry(eyeR * 0.4, 14, 14)} scale={[1, 1.15, 0.25]}>
                  <meshStandardMaterial color="#0B0B0F" roughness={0.2} />
                </mesh>
                {/* Primary catchlight reflection sphere */}
                <mesh position={[side * eyeR * 0.28, eyeR * 0.42, eyeR * 0.42]} geometry={new THREE.SphereGeometry(eyeR * 0.24, 10, 10)} material={eyeWhiteMat} />
                {/* Secondary catchlight */}
                {isAnimeOrSparkle && (
                  <mesh position={[-side * eyeR * 0.24, -eyeR * 0.30, eyeR * 0.42]} geometry={new THREE.SphereGeometry(eyeR * 0.16, 8, 8)} material={eyeWhiteMat} />
                )}
                {/* Heart pupil inner highlight */}
                {isHeartEye && (
                  <mesh position={[0, 0, eyeR * 0.42]} scale={[eyeR * 0.8, eyeR * 0.8, eyeR * 0.8]}>
                    <coneGeometry args={[0.35, 0.7, 4]} />
                    <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} />
                  </mesh>
                )}
                {/* Curved 3D upper eyelid / lash rim */}
                <mesh position={[0, eyeR * 0.85, eyeR * 0.2]} rotation={[0, 0, -side * 0.08]} geometry={new THREE.TorusGeometry(eyeR * 0.9, eyeR * 0.18, 6, 16, Math.PI * 0.85)}>
                  <meshStandardMaterial color="#111118" roughness={0.4} />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* 3D Eyebrows */}
      {([-1, 1] as const).map((side) => {
        return (
          <mesh
            key={`brow-${side}`}
            position={[side * eyeOffsetX, eyeY + headRadius * 0.30 * eyeScale, headRadius * 0.88]}
            rotation={[0, 0, side * (config.face.eyebrows === 'angry' ? 0.35 : config.face.eyebrows === 'sad' ? -0.3 : 0.06)]}
            geometry={new THREE.BoxGeometry(headRadius * 0.30 * eyeScale, isDwarf ? headRadius * 0.14 : headRadius * 0.06, headRadius * 0.05)}
          >
            <meshStandardMaterial color={config.hairColor || '#1E293B'} roughness={0.7} />
          </mesh>
        );
      })}

      {/* 3D Expressive Mouth */}
      {config.face.expression === 'uwu' ? (
        // Cute :3 Cat Mouth (two touching half-loops)
        <group position={[0, mouthY, headRadius * 0.78]}>
          <mesh position={[-headRadius * 0.07, 0, 0]}>
            <torusGeometry args={[headRadius * 0.08, headRadius * 0.028, 6, 14, Math.PI]} />
            <meshStandardMaterial color={hexToColor('#FF4D80')} />
          </mesh>
          <mesh position={[headRadius * 0.07, 0, 0]}>
            <torusGeometry args={[headRadius * 0.08, headRadius * 0.028, 6, 14, Math.PI]} />
            <meshStandardMaterial color={hexToColor('#FF4D80')} />
          </mesh>
        </group>
      ) : config.face.expression === 'pout' ? (
        // Cute Little Pout Mouth (O shape)
        <mesh position={[0, mouthY, headRadius * 0.78]}>
          <torusGeometry args={[headRadius * 0.08, headRadius * 0.032, 6, 16]} />
          <meshStandardMaterial color={hexToColor('#FF4D80')} />
        </mesh>
      ) : (
        // Contoured 3D lips / smile
        <mesh
          position={[0, mouthY, headRadius * 0.78]}
          rotation={[0, 0, isCuteSmile ? 0 : config.face.expression === 'fierce' ? Math.PI : 0]}
          geometry={new THREE.TorusGeometry(headRadius * 0.16, headRadius * 0.035, 6, 16, Math.PI)}
          material={mouthMat}
        />
      )}

      {/* Species-Distinct Anatomical Sculpting & Flush Attachments */}
      {/* Elf: Long Elegant Swept-Back 3D Pointed Ears flush against cranium */}
      {isElf &&
        ([-1, 1] as const).map((side) => (
          <group
            key={`elf-ear-${side}`}
            position={[side * (headRadius * 0.86 * finalWidthMult), headRadius * 0.08, -headRadius * 0.06]}
            rotation={[0.10, side * 0.40, -side * 0.52]}
          >
            {/* Sculpted Pointed Ear */}
            <mesh geometry={new THREE.ConeGeometry(headRadius * 0.20, headRadius * 1.45, 8)} material={skinMat} />
            {/* Gold Ear Cuff */}
            <mesh position={[0, -headRadius * 0.18, 0]}>
              <torusGeometry args={[headRadius * 0.22, headRadius * 0.045, 6, 18]} />
              <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Glowing Arcane Drop Crystal */}
            <mesh position={[0, headRadius * 0.75, 0]}>
              <octahedronGeometry args={[headRadius * 0.085, 0]} />
              <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={3.0} />
            </mesh>
          </group>
        ))}

      {/* Elf: Arcane Silver Forehead Tiara sitting flush on the brow */}
      {isElf && (
        <group position={[0, headRadius * 0.28 * finalHeightMult, headRadius * 0.86]}>
          <mesh geometry={new THREE.TorusGeometry(headRadius * 0.88 * finalWidthMult, headRadius * 0.03, 6, 24, Math.PI * 0.6)} rotation={[Math.PI * 0.5, 0, Math.PI * 0.2]}>
            <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, headRadius * 0.04, headRadius * 0.04]}>
            <octahedronGeometry args={[headRadius * 0.09, 0]} />
            <meshStandardMaterial color="#34D399" emissive="#34D399" emissiveIntensity={3.5} />
          </mesh>
        </group>
      )}

      {/* Dwarf: Rich 3D Braided Beard & Thick Sculpted Mustache flush under nose (MALE ONLY) */}
      {isDwarf && isMale && (
        <group position={[0, -headRadius * 0.38 * finalHeightMult, headRadius * 0.52]}>
          {/* Curled Mustache over the mouth */}
          <mesh position={[0, headRadius * 0.16, headRadius * 0.20]} rotation={[0.1, 0, 0]}>
            <torusGeometry args={[headRadius * 0.20, headRadius * 0.065, 8, 18, Math.PI]} />
            <meshStandardMaterial color={config.hairColor || '#B45309'} roughness={0.7} />
          </mesh>
          {/* Main 3D Sculpted Beard Volume */}
          <mesh position={[0, -headRadius * 0.18, headRadius * 0.10]} rotation={[0.12, 0, 0]}>
            <sphereGeometry args={[headRadius * 0.30, 16, 14]} scale={[1.1, 1.15, 0.75]} />
            <meshStandardMaterial color={config.hairColor || '#B45309'} roughness={0.8} />
          </mesh>
          {/* Twin Braids with Golden Filigree Rings */}
          {([-1, 1] as const).map((side) => (
            <group key={`dwarf-braid-${side}`} position={[side * headRadius * 0.18, -headRadius * 0.55, headRadius * 0.18]}>
              <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.08, headRadius * 0.06, headRadius * 0.50, 10)}>
                <meshStandardMaterial color={config.hairColor || '#B45309'} roughness={0.8} />
              </mesh>
              <mesh position={[0, -headRadius * 0.12, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
                <torusGeometry args={[headRadius * 0.09, headRadius * 0.028, 6, 16]} />
                <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Dwarf FEMALE: Elegant Norse braided locks with rune beads framing cheeks, keeping cute face clear */}
      {isDwarf && !isMale && (
        <group position={[0, -headRadius * 0.20 * finalHeightMult, headRadius * 0.35]}>
          {([-1, 1] as const).map((side) => (
            <group key={`dwarf-fem-braid-${side}`} position={[side * headRadius * 0.65, -headRadius * 0.25, 0]}>
              <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.075, headRadius * 0.055, headRadius * 0.50, 8)}>
                <meshStandardMaterial color={config.hairColor || '#B45309'} roughness={0.7} />
              </mesh>
              <mesh position={[0, -headRadius * 0.14, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
                <torusGeometry args={[headRadius * 0.08, headRadius * 0.025, 6, 14]} />
                <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Fairy: Petite Pixie Ears with Glowing Tips & Celestial Antennas */}
      {isFairy && (
        <>
          {([-1, 1] as const).map((side) => (
            <group
              key={`fairy-ear-${side}`}
              position={[side * (headRadius * 0.84 * finalWidthMult), headRadius * 0.05, -headRadius * 0.06]}
              rotation={[0, side * 0.28, -side * 0.38]}
            >
              <mesh geometry={new THREE.ConeGeometry(headRadius * 0.15, headRadius * 0.62, 6)} material={skinMat} />
              <mesh position={[0, headRadius * 0.30, 0]}>
                <sphereGeometry args={[headRadius * 0.045, 8, 8]} />
                <meshStandardMaterial color="#F472B6" emissive="#F472B6" emissiveIntensity={3.0} />
              </mesh>
            </group>
          ))}
          {/* Celestial Glowing Antennas */}
          {([-1, 1] as const).map((side) => (
            <group key={`fairy-ant-${side}`} position={[side * headRadius * 0.28, headRadius * 0.88 * finalHeightMult, headRadius * 0.10]} rotation={[-0.1, 0, side * 0.26]}>
              <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.018, headRadius * 0.026, headRadius * 0.65, 6)}>
                <meshStandardMaterial color="#F472B6" emissive="#F472B6" emissiveIntensity={1.5} />
              </mesh>
              <mesh position={[0, headRadius * 0.35, 0]}>
                <sphereGeometry args={[headRadius * 0.085, 12, 10]} />
                <meshStandardMaterial color="#67E8F9" emissive="#67E8F9" emissiveIntensity={3.5} />
              </mesh>
            </group>
          ))}
        </>
      )}

      {/* Human: Natural Sculpted Adventurer Ears flush against head */}
      {rawSpecies === 'human' &&
        ([-1, 1] as const).map((side) => (
          <group
            key={`human-ear-${side}`}
            position={[side * (headRadius * 0.85 * finalWidthMult), -headRadius * 0.04, -headRadius * 0.04]}
            rotation={[0, side * 0.18, 0]}
          >
            <mesh geometry={new THREE.SphereGeometry(headRadius * 0.20, 12, 10)} scale={[0.42, 1.12, 0.68]} material={skinMat} />
          </group>
        ))}

      {isOgre && (
        <>
          {([-1, 1] as const).map((side) => (
            <group key={`ogre-horn-${side}`} position={[side * headRadius * 0.62 * finalWidthMult, headRadius * 0.72 * finalHeightMult, headRadius * 0.25]}>
              <mesh rotation={[0.35, 0, side * 0.28]} geometry={new THREE.ConeGeometry(headRadius * 0.20, headRadius * 0.80, 6)}>
                <meshStandardMaterial color="#3E2723" roughness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Jutting Lower Jaw with Twin Upward Tusks */}
          {([-1, 1] as const).map((side) => (
            <mesh key={`ogre-tusk-${side}`} position={[side * headRadius * 0.36, mouthY - headRadius * 0.06, headRadius * 0.80]} rotation={[-0.38, 0, side * 0.18]} geometry={new THREE.ConeGeometry(headRadius * 0.075, headRadius * 0.38, 5)}>
              <meshStandardMaterial color="#FEF3C7" roughness={0.3} />
            </mesh>
          ))}
        </>
      )}

      {isRobot &&
        ([-1, 1] as const).map((side) => (
          <group key={`bot-ear-${side}`} position={[side * (headRadius * 0.86 * finalWidthMult), 0, 0]}>
            <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.14, headRadius * 0.14, headRadius * 0.18, 12)} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={2.0} />
            </mesh>
          </group>
        ))}

      {isAlien &&
        ([-1, 1] as const).map((side) => (
          <group key={`alien-ant-${side}`} position={[side * headRadius * 0.42 * finalWidthMult, headRadius * 0.90 * finalHeightMult, 0]} rotation={[0, 0, side * 0.24]}>
            <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.03, headRadius * 0.045, headRadius * 0.90, 8)} material={skinMat} />
            <mesh position={[0, headRadius * 0.46, 0]}>
              <sphereGeometry args={[headRadius * 0.14, 12, 10]} />
              <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

interface HairProps { config: AvatarConfig; headRadius: number; windT?: number; }

function AvatarHair({ config, headRadius }: HairProps) {
  const mat = useMaterial(config.hairColor, 0.7, 0);
  const emissiveMat = useMaterial(config.hairColor, 0.4, 0.1, config.hairColor, 0.4);
  const r = headRadius;

  const hairSwayRef = useRef<THREE.Group>(null);
  const ahogeRef = useRef<THREE.Mesh>(null);
  const pigtailLeftRef = useRef<THREE.Group>(null);
  const pigtailRightRef = useRef<THREE.Group>(null);
  const futuristStrandsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ahogeRef.current) {
      ahogeRef.current.rotation.x = 0.4 + Math.sin(t * 3.5) * 0.08;
      ahogeRef.current.rotation.z = 0.35 + Math.sin(t * 2.8) * 0.06;
    }
    if (pigtailLeftRef.current) {
      pigtailLeftRef.current.rotation.z = -0.35 + Math.sin(t * 2.5) * 0.06;
      pigtailLeftRef.current.rotation.x = Math.sin(t * 1.8) * 0.035;
    }
    if (pigtailRightRef.current) {
      pigtailRightRef.current.rotation.z = 0.35 - Math.sin(t * 2.5) * 0.06;
      pigtailRightRef.current.rotation.x = Math.sin(t * 1.8) * 0.035;
    }
    if (hairSwayRef.current) {
      hairSwayRef.current.rotation.x = Math.sin(t * 1.6) * 0.03;
    }
    if (futuristStrandsRef.current) {
      futuristStrandsRef.current.children.forEach((child, i) => {
        child.rotation.x = Math.sin(t * 1.8 + i * 0.5) * 0.08;
      });
    }
  });

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
              <group ref={side === -1 ? pigtailLeftRef : pigtailRightRef}>
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
          <group ref={hairSwayRef}>
            <mesh position={[0, -r * 0.8, -r * 0.35]} geometry={new THREE.BoxGeometry(r * 1.6, r * 2.2, 0.18)} material={mat} />
          </group>
        </group>
      );

    case 'fluffy-short':
      return (
        <group>
          <mesh position={[0, r * 0.58, 0]} geometry={new THREE.SphereGeometry(r * 1.1, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62)} material={mat} />
          {/* Adorable Ahoge Antenna Cowlick on top */}
          <mesh ref={ahogeRef} position={[0, r * 1.35, 0.08]}>
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
          <group ref={hairSwayRef}>
            <mesh position={[0, -r * 0.6, -r * 0.3]} geometry={new THREE.CylinderGeometry(r * 0.55, r * 0.25, r * 2.2, 10)} material={mat} />
          </group>
        </group>
      );

    case 'ponytail':
      return (
        <group>
          <mesh position={[0, r * 0.6, 0]} geometry={new THREE.SphereGeometry(r * 1.03, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={mat} />
          {/* Ponytail */}
          <group ref={hairSwayRef}>
            <mesh position={[0, r * 0.1, -r * 1.0]} rotation={[0.5, 0, 0]} geometry={new THREE.CylinderGeometry(r * 0.18, r * 0.08, r * 1.4, 8)} material={mat} />
          </group>
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
          <group ref={futuristStrandsRef}>
            {(strands ?? []).map((strand, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(strand.angle) * r * 0.5,
                  r * 0.8 + Math.sin(i) * 0.04,
                  Math.sin(strand.angle) * r * 0.5,
                ]}
                rotation={[0, strand.angle, 0]}
                geometry={new THREE.CylinderGeometry(0.015, 0.005, strand.length, 4)}
                material={emissiveMat}
              />
            ))}
          </group>
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

  const rawSpecies = (config.species || 'human').toLowerCase();
  const isElf = rawSpecies === 'elf';
  const isDwarf = rawSpecies === 'dwarf' || rawSpecies === 'dwarves';
  const isFairy = rawSpecies === 'fairy' || rawSpecies === 'fairie';
  const isOgre = rawSpecies === 'ogre';

  const h = 0.52 * props.torsoHScale;
  // Lore-Accurate Stylized Humanoid Chest & Waist Radii:
  // Human: topR = 0.16, botR = 0.12 (Golden athletic ratio)
  // Elf: topR = 0.13, botR = 0.095 (Ethereal wasp waist, sleek ribcage)
  // Dwarf: topR = 0.20, botR = 0.185 (Sturdy wide barrel chest & warrior belly)
  // Fairy: topR = 0.088, botR = 0.072 (Petite chibi sprite waist)
  const baseChestR = isElf ? 0.13 : isDwarf ? 0.20 : isFairy ? 0.088 : isOgre ? 0.22 : 0.16;
  const baseWaistR = isElf ? 0.095 : isDwarf ? 0.185 : isFairy ? 0.072 : isOgre ? 0.20 : 0.12;

  const topR = baseChestR * props.bodyScaleX;
  const botR = baseWaistR * props.bodyScaleX;
  const depthScale = isDwarf ? 1.35 : isElf ? 0.82 : 1.0;
  const d = (baseChestR * 1.15) * props.bodyScaleZ * depthScale;
  const w = topR * 2;

  return (
    <group>
      {/* Smooth 3D Neck Joint */}
      <mesh position={[0, h * 0.5 + 0.04, 0]} geometry={new THREE.CylinderGeometry(0.055, 0.065, 0.08, 16)} material={skinMat} />

      {/* Main Stylized Contoured 3D Torso */}
      <mesh
        castShadow
        geometry={new THREE.CylinderGeometry(topR, botR, h, 24)}
        scale={[1, 1, d / w]}
        material={topMat}
      />

      {/* Dwarf: Burly Stout Belly Contour */}
      {isDwarf && (
        <mesh position={[0, -h * 0.14, d * 0.42]} geometry={new THREE.SphereGeometry(topR * 0.85, 18, 14)} scale={[1.2, 0.9, 0.75]} material={topMat} />
      )}

      {/* Dwarf: Heavy Gold/Bronze Armor Gorget & Rune Plates */}
      {isDwarf && (
        <group position={[0, h * 0.2, d * 0.52]}>
          <mesh geometry={new THREE.BoxGeometry(topR * 1.5, h * 0.32, 0.04)}>
            <meshStandardMaterial color="#D97706" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <octahedronGeometry args={[0.035, 0]} />
            <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={2.0} />
          </mesh>
        </group>
      )}

      {/* Elf: Arcane Silver Embroidery & Slender Chest Filigree */}
      {isElf && (
        <group position={[0, h * 0.1, d * 0.52]}>
          <mesh geometry={new THREE.BoxGeometry(topR * 0.15, h * 0.65, 0.015)}>
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0, h * 0.22, 0.01]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 0.45, 0.008, 6, 18, Math.PI]} />
            <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {/* Fairy: Celestial Blossom Corset & Starlight Ribbon */}
      {isFairy && (
        <group position={[0, -h * 0.1, 0]}>
          <mesh rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 0.75, 0.012, 6, 18]} />
            <meshStandardMaterial color="#F472B6" emissive="#F472B6" emissiveIntensity={2.0} />
          </mesh>
        </group>
      )}

      {/* Robot Glowing Core */}
      {config.species === 'robot' && (
        <mesh position={[0, h * 0.1, d * 0.52]}>
          <circleGeometry args={[topR * 0.35, 20]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={3.0} />
        </mesh>
      )}

      {/* 3D Clothing Overlays & Styles (Every outfit has distinct 3D geometry & styling) */}
      {config.top === 'lolita-dress' ? (
        <group>
          {/* White Frilly Collar - flush horizontal around neck */}
          <mesh position={[0, h * 0.44, d * 0.32]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 0.55, 0.022, 6, 22, Math.PI]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
          </mesh>
          {/* Sweet Pink Satin Bow on chest */}
          <mesh position={[0, h * 0.22, d * 0.56]}>
            <sphereGeometry args={[0.045, 14, 12]} />
            <meshStandardMaterial color="#FF5C93" roughness={0.3} />
          </mesh>
          <mesh position={[-0.04, h * 0.22, d * 0.55]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.03, 0.07, 4]} />
            <meshStandardMaterial color="#FF5C93" roughness={0.3} />
          </mesh>
          <mesh position={[0.04, h * 0.22, d * 0.55]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.03, 0.07, 4]} />
            <meshStandardMaterial color="#FF5C93" roughness={0.3} />
          </mesh>
          {/* Flared Tiered Lolita Skirt */}
          <mesh position={[0, -h * 0.45, 0]} geometry={new THREE.CylinderGeometry(topR * 0.95, topR * 1.45, h * 0.72, 24)} material={topMat} />
          {/* Horizontal lace hem rim */}
          <mesh position={[0, -h * 0.78, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 1.44, 0.022, 6, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
        </group>
      ) : config.top === 'maid-dress' ? (
        <group>
          {/* Crisp White Apron Bib */}
          <mesh position={[0, h * 0.05, d * 0.52]} geometry={new THREE.BoxGeometry(topR * 1.15, h * 0.70, 0.025)} material={whiteMat} />
          {/* White Apron Shoulder Ruffles */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * topR * 0.70, h * 0.35, 0]} geometry={new THREE.BoxGeometry(0.04, 0.05, d * 1.05)} material={whiteMat} />
          ))}
          {/* Flared Maid Apron Skirt with White Apron Overlay */}
          <mesh position={[0, -h * 0.44, 0]} geometry={new THREE.CylinderGeometry(topR * 0.95, topR * 1.42, h * 0.70, 24)} material={topMat} />
          <mesh position={[0, -h * 0.44, d * 0.10]} geometry={new THREE.CylinderGeometry(topR * 0.96, topR * 1.34, h * 0.62, 16, 1, false, -Math.PI * 0.45, Math.PI * 0.9)} material={whiteMat} />
          {/* Horizontal lace hem rim */}
          <mesh position={[0, -h * 0.76, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 1.41, 0.02, 6, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
        </group>
      ) : config.top === 'magical-dress' ? (
        <group>
          {/* Glowing Gemstone Star Brooch */}
          <mesh position={[0, h * 0.20, d * 0.56]}>
            <octahedronGeometry args={[0.055, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FF5C93" emissiveIntensity={3.0} />
          </mesh>
          <pointLight position={[0, h * 0.20, d * 0.6]} color="#FF5C93" intensity={2.0} distance={1.2} />
          {/* Flared Translucent Star Petal Skirt */}
          <mesh position={[0, -h * 0.45, 0]} geometry={new THREE.CylinderGeometry(topR * 0.98, topR * 1.48, h * 0.72, 20)}>
            <meshStandardMaterial color={hexToColor(config.topColor)} emissive={hexToColor(config.topColor)} emissiveIntensity={0.4} transparent opacity={0.75} roughness={0.3} />
          </mesh>
          {/* Horizontal gold starlight hem */}
          <mesh position={[0, -h * 0.78, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 1.47, 0.022, 6, 24]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2.0} />
          </mesh>
        </group>
      ) : config.top === 'sundress' ? (
        <group>
          {/* Spaghetti shoulder straps */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * topR * 0.55, h * 0.38, 0]} geometry={new THREE.BoxGeometry(0.015, 0.02, d * 0.95)} material={topMat} />
          ))}
          {/* Summer Waist Ribbon Sash */}
          <mesh position={[0, -h * 0.08, d * 0.52]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshStandardMaterial color="#FBBF24" />
          </mesh>
          {/* Breezy Flared Summer Skirt */}
          <mesh position={[0, -h * 0.44, 0]} geometry={new THREE.CylinderGeometry(topR * 0.92, topR * 1.38, h * 0.68, 20)} material={topMat} />
          {/* Horizontal summer hem rim */}
          <mesh position={[0, -h * 0.75, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 1.37, 0.018, 6, 22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
          </mesh>
        </group>
      ) : config.top === 'princess-gown' ? (
        <group>
          {/* Off-the-shoulder royal gold lace - horizontal collar */}
          <mesh position={[0, h * 0.38, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 1.05, 0.024, 6, 24]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Royal Gemstone Medallion */}
          <mesh position={[0, h * 0.22, d * 0.56]}>
            <octahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2.5} />
          </mesh>
          {/* Luxurious Grand Ballgown Skirt */}
          <mesh position={[0, -h * 0.48, 0]} geometry={new THREE.CylinderGeometry(topR * 0.98, topR * 1.55, h * 0.82, 24)} material={topMat} />
          {/* Horizontal gold hem rim */}
          <mesh position={[0, -h * 0.86, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 1.54, 0.026, 6, 26]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ) : config.top === 'cyber-dress' ? (
        <group>
          {/* Cyber Kimono Crossover Collar */}
          <mesh position={[topR * 0.15, h * 0.22, d * 0.52]} rotation={[0, 0, -0.4]} geometry={new THREE.BoxGeometry(0.03, h * 0.5, 0.02)}>
            <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[-topR * 0.15, h * 0.22, d * 0.53]} rotation={[0, 0, 0.4]} geometry={new THREE.BoxGeometry(0.03, h * 0.5, 0.02)}>
            <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.0} />
          </mesh>
          {/* Holographic Obi Belt & Digital Buckle */}
          <mesh position={[0, -h * 0.06, 0]} geometry={new THREE.CylinderGeometry(topR * 1.04, botR * 1.04, h * 0.22, 20)}>
            <meshStandardMaterial color="#0A0F1D" metalness={0.8} />
          </mesh>
          <mesh position={[0, -h * 0.06, d * 0.55]}>
            <boxGeometry args={[topR * 0.45, 0.06, 0.025]} />
            <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={3.0} />
          </mesh>
          {/* Angular Split Cyber Skirt */}
          <mesh position={[0, -h * 0.44, 0]} geometry={new THREE.CylinderGeometry(topR * 1.0, topR * 1.42, h * 0.68, 18)} material={topMat} />
        </group>
      ) : config.top === 'hoodie-dress' ? (
        <group>
          {/* Oversized draping hoodie dress */}
          <mesh position={[0, -h * 0.35, 0]} geometry={new THREE.CylinderGeometry(topR * 1.08, topR * 1.55, h * 0.65, 20)} material={topMat} />
          {/* Kangaroo pouch */}
          <mesh position={[0, -h * 0.08, d * 0.54]} geometry={new THREE.BoxGeometry(topR * 1.1, h * 0.24, 0.03)} material={topMat} />
          {/* Hood cowl behind neck */}
          <mesh position={[0, h * 0.38, -d * 0.42]} geometry={new THREE.SphereGeometry(topR * 1.08, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.58)} material={topMat} />
        </group>
      ) : config.top === 'armor' ? (
        <group>
          {/* Sculpted Multi-layer Titanium Cuirass */}
          <mesh position={[topR * 0.32, h * 0.10, d * 0.52]} geometry={new THREE.BoxGeometry(topR * 0.68, h * 0.44, 0.04)} material={topMat} />
          <mesh position={[-topR * 0.32, h * 0.10, d * 0.52]} geometry={new THREE.BoxGeometry(topR * 0.68, h * 0.44, 0.04)} material={topMat} />
          {/* Glowing Plasma Fusion Core Reactor */}
          <mesh position={[0, h * 0.12, d * 0.55]}>
            <circleGeometry args={[topR * 0.32, 20]} />
            <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3.5} />
          </mesh>
          <mesh position={[0, h * 0.12, d * 0.54]}>
            <torusGeometry args={[topR * 0.34, 0.018, 6, 20]} />
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Reinforced Gorget Plate */}
          <mesh position={[0, h * 0.38, d * 0.48]} geometry={new THREE.BoxGeometry(topR * 1.4, h * 0.12, 0.04)}>
            <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ) : config.top === 'futuristic-suit' ? (
        <group>
          {/* Hexagonal Nanotech Cyber Core */}
          <mesh position={[0, h * 0.14, d * 0.53]}>
            <circleGeometry args={[topR * 0.30, 6]} />
            <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={3.5} />
          </mesh>
          {/* Glowing Cyber Conduit Traces */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * topR * 0.42, 0, d * 0.52]} geometry={new THREE.BoxGeometry(0.015, h * 0.75, 0.015)}>
              <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.5} />
            </mesh>
          ))}
        </group>
      ) : config.top === 'hoodie' ? (
        <group>
          {/* Volumetric Hood Cowl */}
          <mesh position={[0, h * 0.38, -d * 0.42]} geometry={new THREE.SphereGeometry(topR * 1.05, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)} material={topMat} />
          {/* Kangaroo Pouch */}
          <mesh position={[0, -h * 0.12, d * 0.53]} geometry={new THREE.BoxGeometry(topR * 1.1, h * 0.26, 0.03)} material={topMat} />
          {/* White Drawstrings */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * topR * 0.28, h * 0.05, d * 0.54]}>
              <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ) : config.top === 'jacket' ? (
        <group>
          {/* Contrasting Inner Undershirt in center */}
          <mesh position={[0, 0, d * 0.51]} geometry={new THREE.BoxGeometry(topR * 0.6, h * 0.90, 0.015)} material={whiteMat} />
          {/* Wide Jacket Lapels */}
          <mesh position={[topR * 0.38, h * 0.12, d * 0.53]} rotation={[0, 0, 0.28]} geometry={new THREE.BoxGeometry(topR * 0.45, h * 0.55, 0.03)} material={topMat} />
          <mesh position={[-topR * 0.38, h * 0.12, d * 0.53]} rotation={[0, 0, -0.28]} geometry={new THREE.BoxGeometry(topR * 0.45, h * 0.55, 0.03)} material={topMat} />
          {/* Metallic Zipper line */}
          <mesh position={[topR * 0.14, -h * 0.14, d * 0.54]} geometry={new THREE.BoxGeometry(0.012, h * 0.45, 0.02)}>
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ) : config.top === 'shirt' ? (
        <group>
          {/* Crisp folded collar */}
          <mesh position={[0, h * 0.44, d * 0.30]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 0.54, 0.018, 6, 20, Math.PI]} />
            <meshStandardMaterial color={topMat.color} roughness={0.5} />
          </mesh>
          {/* Placket & Buttons */}
          <mesh position={[0, 0, d * 0.52]} geometry={new THREE.BoxGeometry(0.035, h * 0.90, 0.015)} material={topMat} />
          {[0.12, 0.0, -0.12].map((yOff, i) => (
            <mesh key={i} position={[0, yOff, d * 0.53]}>
              <sphereGeometry args={[0.012, 8, 8]} />
              <meshStandardMaterial color="#1E293B" />
            </mesh>
          ))}
          {/* Colored Necktie */}
          <mesh position={[0, h * 0.08, d * 0.54]} geometry={new THREE.BoxGeometry(0.05, h * 0.45, 0.015)}>
            <meshStandardMaterial color="#DC2626" roughness={0.4} />
          </mesh>
        </group>
      ) : config.top === 'tshirt' ? (
        <group>
          {/* Crewneck collar rib */}
          <mesh position={[0, h * 0.44, d * 0.30]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[topR * 0.52, 0.018, 6, 20, Math.PI]} />
            <meshStandardMaterial color={topMat.color} roughness={0.5} />
          </mesh>
          {/* Center Graphic Emblem */}
          <mesh position={[0, h * 0.12, d * 0.52]}>
            <octahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ) : config.top === 'crop' ? (
        <group>
          {/* High-cut crop top exposing midriff */}
          <mesh position={[0, -h * 0.20, 0]} geometry={new THREE.CylinderGeometry(botR * 1.02, botR * 1.02, 0.035, 20)}>
            <meshStandardMaterial color="#0A1017" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function AvatarArms({ config, action = 'idle' }: { config: AvatarConfig; breathT?: number; action?: string }) {
  const props = getBodyProps(config);
  const topMat = useMaterial(config.topColor, 0.5, config.top === 'armor' ? 0.6 : 0);
  const skinMat = useMaterial(config.skinTone, 0.65, 0.05);

  const rawSpecies = (config.species || 'human').toLowerCase();
  const isElf = rawSpecies === 'elf';
  const isDwarf = rawSpecies === 'dwarf' || rawSpecies === 'dwarves';
  const isFairy = rawSpecies === 'fairy' || rawSpecies === 'fairie';
  const isOgre = rawSpecies === 'ogre';

  const baseChestR = isElf ? 0.13 : isDwarf ? 0.20 : isFairy ? 0.088 : isOgre ? 0.22 : 0.16;
  const topR = baseChestR * props.bodyScaleX;

  const baseArmR = isElf ? 0.036 : isDwarf ? 0.065 : isFairy ? 0.022 : isOgre ? 0.075 : 0.044;
  const armR = baseArmR * props.armWidthScale;
  const armL = 0.52 * props.armScale;

  const shoulderPivotX = topR + armR * 0.85;

  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const hasWeapon = config.weapon && config.weapon !== 'unarmed';

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.1, delta);
    const lerpSpeed = Math.min(1, dt * 8.5);

    let leftTargetX = 0;
    let leftTargetY = 0;
    let leftTargetZ = -0.06;

    let rightTargetX = 0;
    let rightTargetY = 0;
    let rightTargetZ = 0.06;

    if (action === 'attack') {
      rightTargetX = -Math.PI * 0.52 + Math.sin(t * 8.0) * 0.12;
      rightTargetY = -0.15;
      rightTargetZ = 0.15;

      leftTargetX = Math.PI * 0.28;
      leftTargetY = 0.10;
      leftTargetZ = -0.22;
    } else if (action === 'defend') {
      leftTargetX = -Math.PI * 0.40;
      leftTargetY = 0.22;
      leftTargetZ = -0.25;

      rightTargetX = -Math.PI * 0.44;
      rightTargetY = -0.22;
      rightTargetZ = 0.25;
    } else if (action === 'victory') {
      rightTargetX = -Math.PI * 0.85 + Math.sin(t * 4.0) * 0.05;
      rightTargetY = 0;
      rightTargetZ = 0.22;

      leftTargetX = -0.15;
      leftTargetY = 0;
      leftTargetZ = -0.28;
    } else if (action === 'hit') {
      leftTargetX = Math.PI * 0.35;
      leftTargetY = 0.1;
      leftTargetZ = -0.42;

      rightTargetX = Math.PI * 0.32;
      rightTargetY = -0.1;
      rightTargetZ = 0.42;
    } else {
      // Natural organic Idle Breathing:
      const breath = Math.sin(t * 1.8);
      leftTargetX = breath * 0.035 + 0.02;
      leftTargetY = 0;
      leftTargetZ = -0.07 + breath * 0.012;

      if (hasWeapon) {
        rightTargetX = -0.24 + Math.sin(t * 1.8 + 0.4) * 0.03;
        rightTargetY = -0.05;
        rightTargetZ = 0.10 + Math.sin(t * 1.8) * 0.01;
      } else {
        rightTargetX = Math.sin(t * 1.8 + 0.4) * 0.035 + 0.02;
        rightTargetY = 0;
        rightTargetZ = 0.07 - breath * 0.012;
      }
    }

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, leftTargetX, lerpSpeed);
      leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, leftTargetY, lerpSpeed);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, leftTargetZ, lerpSpeed);
    }

    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, rightTargetX, lerpSpeed);
      rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, rightTargetY, lerpSpeed);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, rightTargetZ, lerpSpeed);
    }
  });

  return (
    <>
      {([-1, 1] as const).map((side) => {
        return (
          <group
            key={side}
            ref={side === -1 ? leftArmRef : rightArmRef}
            position={[side * shoulderPivotX, 0.06 * props.torsoHScale, 0]}
          >
            {/* Smooth Shoulder Deltoid Joint */}
            <mesh
              position={[0, 0, 0]}
              geometry={new THREE.SphereGeometry(armR * 1.15, 18, 16)}
              material={topMat}
            />

            {/* Shoulder Pauldron / Guard mounted directly on arm deltoid — sits proudly ON TOP of dress sleeves */}
            {config.accessories.shoulder && (
              <group position={[side * armR * 0.22, armR * 0.40, 0]} rotation={[0, 0, -side * 0.16]}>
                {config.accessories.shoulder === 'pauldrons' ? (
                  <>
                    <mesh geometry={new THREE.BoxGeometry(armR * 2.8, armR * 1.15, armR * 2.4)}>
                      <meshStandardMaterial color={hexToColor(config.accessoryColor || '#EAB308')} metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, armR * 0.22, 0]} geometry={new THREE.BoxGeometry(armR * 3.0, armR * 0.32, armR * 2.6)}>
                      <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.15} />
                    </mesh>
                  </>
                ) : (
                  <mesh geometry={new THREE.BoxGeometry(armR * 2.4, armR * 0.85, armR * 2.1)}>
                    <meshStandardMaterial color={hexToColor(config.accessoryColor || '#64748B')} metalness={0.7} roughness={0.3} />
                  </mesh>
                )}
              </group>
            )}

            {/* Stylized 3D Tapered Upper Arm / Sleeve */}
            <mesh
              castShadow
              position={[0, -armL * 0.32, 0]}
              geometry={new THREE.CylinderGeometry(armR * 0.98, armR * 0.92, armL * 0.52, 18)}
              material={topMat}
            />

            {/* Sleeve Cuff Ring */}
            <mesh
              position={[0, -armL * 0.58, 0]}
              geometry={new THREE.TorusGeometry(armR * 0.95, armR * 0.10, 6, 18)}
              rotation={[Math.PI * 0.5, 0, 0]}
              material={topMat}
            />

            {/* Stylized 3D Forearm */}
            <mesh
              castShadow
              position={[0, -armL * 0.72, 0]}
              geometry={new THREE.CylinderGeometry(armR * 0.90, armR * 0.78, armL * 0.28, 16)}
              material={skinMat}
            />

            {/* Stylized 3D Hand with Palm & Thumb */}
            <group position={[0, -armL * 0.88, 0]}>
              <mesh
                castShadow
                geometry={new THREE.SphereGeometry(armR * 0.82, 16, 14)}
                scale={[1, 1.15, 0.82]}
                material={skinMat}
              />
              <mesh
                position={[side * armR * 0.55, 0.01, armR * 0.25]}
                rotation={[0, 0, side * 0.32]}
                geometry={new THREE.CylinderGeometry(armR * 0.25, armR * 0.20, armR * 0.55, 8)}
                material={skinMat}
              />
            </group>

            {/* Weapon held in right hand (side === 1) */}
            {side === 1 && config.weapon && config.weapon !== 'unarmed' && (
              <group position={[0, -armL * 0.88, armR * 0.7]} rotation={[Math.PI * 0.45, 0, 0]}>
                {/* Fairy Weapon Adaptation: Fairies are tiny & cannot carry heavy hammer/scythe artifacts */}
                {props.isTiny && (config.weapon === 'energy-hammer' || config.weapon === 'void-scythe') ? (
                  <group scale={[0.55, 0.55, 0.55]}>
                    <mesh geometry={new THREE.CylinderGeometry(0.012, 0.014, 0.5, 8)}>
                      <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.3, 0]}>
                      <octahedronGeometry args={[0.07, 0]} />
                      <meshStandardMaterial color="#FF69B4" emissive="#FF69B4" emissiveIntensity={3.5} />
                    </mesh>
                    <pointLight color="#FF69B4" intensity={2.5} distance={1.2} position={[0, 0.3, 0]} />
                  </group>
                ) : config.weapon === 'photon-blade' ? (
                  <group scale={props.isTiny ? [0.55, 0.55, 0.55] : [0.75, 0.75, 0.75]}>
                    <mesh geometry={new THREE.CylinderGeometry(0.025, 0.03, 0.18, 10)}>
                      <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.5, 0]} geometry={new THREE.CylinderGeometry(0.018, 0.024, 0.85, 10)}>
                      <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={3.0} />
                    </mesh>
                  </group>
                ) : config.weapon === 'cyber-staff' ? (
                  <group scale={props.isTiny ? [0.55, 0.55, 0.55] : [0.75, 0.75, 0.75]}>
                    <mesh geometry={new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8)}>
                      <meshStandardMaterial color="#7C5CFF" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.6, 0]}>
                      <sphereGeometry args={[0.08, 16, 12]} />
                      <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.5} />
                    </mesh>
                  </group>
                ) : config.weapon === 'plasma-blaster' ? (
                  <group scale={props.isTiny ? [0.55, 0.55, 0.55] : [0.75, 0.75, 0.75]}>
                    <mesh geometry={new THREE.BoxGeometry(0.09, 0.16, 0.32)}>
                      <meshStandardMaterial color="#1E293B" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.03, 0.2]} geometry={new THREE.CylinderGeometry(0.028, 0.028, 0.15, 8)} rotation={[Math.PI / 2, 0, 0]}>
                      <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={2.0} />
                    </mesh>
                  </group>
                ) : config.weapon === 'void-scythe' ? (
                  <group scale={props.isTiny ? [0.55, 0.55, 0.55] : [0.75, 0.75, 0.75]}>
                    <mesh geometry={new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8)}>
                      <meshStandardMaterial color="#0F172A" />
                    </mesh>
                    <mesh position={[0.22, 0.55, 0]} rotation={[0, 0, -0.6]} geometry={new THREE.BoxGeometry(0.5, 0.06, 0.03)}>
                      <meshStandardMaterial color="#A855F7" emissive="#A855F7" emissiveIntensity={2.5} />
                    </mesh>
                  </group>
                ) : config.weapon === 'star-wand' ? (
                  <group scale={props.isTiny ? [0.65, 0.65, 0.65] : [0.8, 0.8, 0.8]}>
                    <mesh geometry={new THREE.CylinderGeometry(0.018, 0.022, 0.65, 8)}>
                      <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.38, 0]}>
                      <coneGeometry args={[0.10, 0.20, 5]} />
                      <meshStandardMaterial color="#FFDF00" emissive="#FF69B4" emissiveIntensity={2.5} />
                    </mesh>
                  </group>
                ) : config.weapon === 'energy-hammer' ? (
                  <group scale={props.speciesKey === 'dwarf' ? [1.0, 1.0, 1.0] : [0.85, 0.85, 0.85]}>
                    <mesh geometry={new THREE.CylinderGeometry(0.03, 0.03, 0.95, 8)}>
                      <meshStandardMaterial color="#334155" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.48, 0]} geometry={new THREE.BoxGeometry(0.32, 0.26, 0.40)}>
                      <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={2.2} />
                    </mesh>
                  </group>
                ) : null}
              </group>
            )}
          </group>
        );
      })}
    </>
  );
}

function LegShoe({ config, legR, side }: { config: AvatarConfig; legR: number; side: -1 | 1 }) {
  const isGlow = config.shoes === 'futuristic-shoes';
  const shoeMat = useMaterial(config.shoeColor || '#FFFFFF', 0.4, isGlow ? 0.4 : 0, isGlow ? config.shoeColor || '#00FF66' : undefined, isGlow ? 2.5 : 0);
  const darkMat = useMaterial('#090D14', 0.6, 0.2);
  const whiteMat = useMaterial('#F8FAFC', 0.5, 0);

  const rawSpecies = (config.species || 'human').toLowerCase();
  const isElf = rawSpecies === 'elf';
  const isDwarf = rawSpecies === 'dwarf' || rawSpecies === 'dwarves';
  const isFairy = rawSpecies === 'fairy' || rawSpecies === 'fairie';

  const shoeW = legR * 1.85;
  const shoeD = legR * 2.5;
  const shoeH = 0.055;

  switch (config.shoes) {
    case 'sneakers':
      return (
        <group>
          {/* Thick Rubber Outsole */}
          <mesh castShadow position={[0, shoeH * 0.4, shoeD * 0.10]} geometry={new THREE.BoxGeometry(shoeW, shoeH * 0.8, shoeD)} material={whiteMat} />
          {/* Upper Body */}
          <mesh castShadow position={[0, shoeH + 0.02, 0.02]} geometry={new THREE.CylinderGeometry(legR * 0.90, legR * 0.95, 0.065, 16)} material={shoeMat} />
          {/* Rounded White Toe Bumper */}
          <mesh castShadow position={[0, shoeH * 0.65, shoeD * 0.44]} geometry={new THREE.SphereGeometry(legR * 0.85, 14, 12)} scale={[1, 0.7, 1.1]} material={whiteMat} />
          {/* Tongue & Laces */}
          <mesh position={[0, shoeH + 0.045, shoeD * 0.18]} rotation={[0.4, 0, 0]} geometry={new THREE.BoxGeometry(shoeW * 0.6, 0.05, 0.08)} material={shoeMat} />
        </group>
      );
    case 'boots':
      return (
        <group>
          {/* Beveled Leather Sole */}
          <mesh castShadow position={[0, shoeH * 0.4, shoeD * 0.12]} geometry={new THREE.BoxGeometry(shoeW, shoeH * 0.8, shoeD)} material={shoeMat} />
          {/* Low block heel at rear */}
          <mesh castShadow position={[0, -shoeH * 0.2, -shoeD * 0.32]} geometry={new THREE.BoxGeometry(shoeW * 0.95, shoeH * 0.6, shoeD * 0.35)} material={darkMat} />
          {/* Mid-Calf Leather Boot Shaft */}
          <mesh castShadow position={[0, shoeH + 0.08, 0]} geometry={new THREE.CylinderGeometry(legR * 1.05, legR * 0.95, 0.16, 16)} material={shoeMat} />
          {/* Toe Cap */}
          <mesh castShadow position={[0, shoeH * 0.8, shoeD * 0.42]} geometry={new THREE.SphereGeometry(legR * 0.85, 14, 12)} scale={[1, 0.72, 1.2]} material={shoeMat} />
          {/* Golden Buckle Straps on outer shaft */}
          <mesh position={[side * (shoeW * 0.52), shoeH + 0.10, 0]} geometry={new THREE.BoxGeometry(0.015, 0.025, 0.04)}>
            <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );
    case 'futuristic-shoes':
      return (
        <group>
          {/* Split Anti-Grav Dual Pod Soles */}
          <mesh castShadow position={[0, shoeH * 0.35, shoeD * 0.30]} geometry={new THREE.BoxGeometry(shoeW, shoeH * 0.7, shoeD * 0.50)} material={darkMat} />
          <mesh castShadow position={[0, shoeH * 0.35, -shoeD * 0.25]} geometry={new THREE.BoxGeometry(shoeW, shoeH * 0.7, shoeD * 0.45)} material={darkMat} />
          {/* Cyber Armor Boot Shell */}
          <mesh castShadow position={[0, shoeH + 0.04, 0.02]} geometry={new THREE.CylinderGeometry(legR * 0.95, legR * 1.0, 0.08, 16)} material={shoeMat} />
          {/* Glowing Neon Light Rails */}
          <mesh position={[0, shoeH * 0.75, 0]} geometry={new THREE.BoxGeometry(shoeW * 1.08, 0.018, shoeD * 0.95)}>
            <meshStandardMaterial color={hexToColor(config.shoeColor || '#00FF66')} emissive={hexToColor(config.shoeColor || '#00FF66')} emissiveIntensity={3.0} />
          </mesh>
          {/* Power Core Ankle Ring */}
          <mesh position={[0, shoeH + 0.08, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[legR * 0.95, 0.016, 6, 18]} />
            <meshStandardMaterial color={hexToColor(config.shoeColor || '#00FF66')} emissive={hexToColor(config.shoeColor || '#00FF66')} emissiveIntensity={2.5} />
          </mesh>
        </group>
      );
    case 'sandals':
      return (
        <group>
          {/* Slim Leather Footbed */}
          <mesh castShadow position={[0, 0.012, shoeD * 0.10]} geometry={new THREE.BoxGeometry(shoeW * 0.92, 0.025, shoeD)} material={shoeMat} />
          {/* Front Cross-Strap Band */}
          <mesh position={[0, 0.035, shoeD * 0.30]} geometry={new THREE.BoxGeometry(shoeW * 0.96, 0.015, 0.06)} material={shoeMat} />
          {/* Ankle Wrap Ribbon Straps */}
          <mesh position={[0, 0.06, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[legR * 0.92, 0.012, 6, 16]} />
            <meshStandardMaterial color={shoeMat.color} />
          </mesh>
        </group>
      );
    case 'heels':
      return (
        <group>
          {/* Arched Incline Footbed */}
          <mesh castShadow position={[0, 0.04, shoeD * 0.12]} rotation={[-0.15, 0, 0]} geometry={new THREE.BoxGeometry(shoeW * 0.85, 0.025, shoeD * 0.95)} material={shoeMat} />
          {/* Pointed Pump Toe Cap */}
          <mesh castShadow position={[0, 0.035, shoeD * 0.44]} geometry={new THREE.ConeGeometry(legR * 0.75, 0.14, 12)} rotation={[Math.PI * 0.5, 0, 0]} scale={[1, 1, 0.65]} material={shoeMat} />
          {/* Slender Stiletto Heel Spike at rear */}
          <mesh castShadow position={[0, 0.01, -shoeD * 0.32]} geometry={new THREE.CylinderGeometry(0.012, 0.008, 0.065, 8)} material={darkMat} />
          {/* Ankle D'Orsay Strap */}
          <mesh position={[0, 0.075, -0.01]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[legR * 0.88, 0.012, 6, 16]} />
            <meshStandardMaterial color={shoeMat.color} />
          </mesh>
        </group>
      );
    case 'combat-boots':
    default:
      return (
        <group>
          {/* Heavy Cleated Combat Sole */}
          <mesh castShadow position={[0, shoeH * 0.5, shoeD * 0.12]} geometry={new THREE.BoxGeometry(shoeW * 1.05, shoeH, shoeD * 1.05)} material={darkMat} />
          {/* Tall Combat Shaft with Lacing */}
          <mesh castShadow position={[0, shoeH + 0.10, 0]} geometry={new THREE.CylinderGeometry(legR * 1.08, legR * 1.02, 0.20, 16)} material={shoeMat} />
          {/* Reinforced Toe Bumper */}
          <mesh castShadow position={[0, shoeH * 0.9, shoeD * 0.46]} geometry={new THREE.SphereGeometry(legR * 0.92, 14, 12)} scale={[1, 0.8, 1.15]} material={darkMat} />
          {/* Metallic Lace Eyelets */}
          {[-0.04, 0.0, 0.04, 0.08].map((yOff, i) => (
            <mesh key={i} position={[0, shoeH + 0.06 + yOff, shoeD * 0.20]} geometry={new THREE.BoxGeometry(shoeW * 0.45, 0.012, 0.012)}>
              <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          {/* Species Flair */}
          {isDwarf && (
            <mesh position={[0, shoeH * 1.1, shoeD * 0.48]}>
              <boxGeometry args={[shoeW * 0.85, shoeH * 0.8, shoeD * 0.18]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.2} />
            </mesh>
          )}
          {isElf && (
            <mesh position={[0, shoeH * 1.1, -shoeD * 0.4]}>
              <boxGeometry args={[shoeW * 0.45, shoeH * 1.2, 0.02]} />
              <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.2} />
            </mesh>
          )}
          {isFairy && (
            <mesh position={[0, shoeH * 1.0, shoeD * 0.42]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshStandardMaterial color="#F472B6" emissive="#F472B6" emissiveIntensity={2.5} />
            </mesh>
          )}
        </group>
      );
  }
}

function AvatarLegs({ config, action = 'idle' }: { config: AvatarConfig; shiftT?: number; action?: string }) {
  const props = getBodyProps(config);
  const bottomMat = useMaterial(config.bottomColor || '#1E3A5F', 0.65, 0);
  const skinMat = useMaterial(config.skinTone, 0.68, 0.05);

  const rawSpecies = (config.species || 'human').toLowerCase();
  const isElf = rawSpecies === 'elf';
  const isDwarf = rawSpecies === 'dwarf' || rawSpecies === 'dwarves';
  const isFairy = rawSpecies === 'fairy' || rawSpecies === 'fairie';
  const isOgre = rawSpecies === 'ogre';

  const baseWaistR = isElf ? 0.095 : isDwarf ? 0.16 : isFairy ? 0.072 : isOgre ? 0.19 : 0.12;
  const botR = baseWaistR * props.bodyScaleX;

  // Pelvis / Hips matches the Torso bottom seamlessly:
  const pelvisW = botR * 2;
  const pelvisD = botR * 1.8 * props.bodyScaleZ;
  const pelvisH = 0.10 * props.torsoHScale;

  // Legs attached directly to underside of pelvis:
  const legR = (pelvisW * 0.24) * props.legWidthScale;
  const legD = pelvisD * 0.90;
  const legH = 0.58 * props.legScale;
  const legSep = pelvisW * 0.25;

  const isTopDress =
    config.top === 'lolita-dress' ||
    config.top === 'maid-dress' ||
    config.top === 'magical-dress' ||
    config.top === 'sundress' ||
    config.top === 'princess-gown' ||
    config.top === 'cyber-dress' ||
    config.top === 'hoodie-dress';

  const hasSkirt = !isTopDress && (
    config.bottom === 'skirt' ||
    config.bottom === 'frill-skirt' ||
    config.bottom === 'tutu' ||
    config.bottom === 'maid-apron-skirt'
  );

  const isShorts = config.bottom === 'shorts';
  const isCargo = config.bottom === 'cargo';
  const isArmorPants = config.bottom === 'armor-pants';
  const isJoggers = config.bottom === 'joggers';
  const isLeggings = config.bottom === 'leggings';

  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.1, delta);
    const lerpSpeed = Math.min(1, dt * 8.5);

    let leftTargetX = 0;
    let leftTargetZ = 0;
    let rightTargetX = 0;
    let rightTargetZ = 0;

    if (action === 'attack') {
      leftTargetX = 0.18;
      leftTargetZ = -0.05;
      rightTargetX = -0.25;
      rightTargetZ = 0.05;
    } else if (action === 'defend') {
      leftTargetZ = -0.08;
      rightTargetZ = 0.08;
    } else if (action === 'hit') {
      leftTargetX = -0.16;
      rightTargetX = 0.12;
    } else if (action === 'victory') {
      const bounce = Math.sin(t * 8.0) * 0.05;
      leftTargetX = bounce;
      rightTargetX = -bounce;
    } else {
      // Natural upright idle
      const sway = Math.sin(t * 1.4);
      leftTargetX = sway * 0.02;
      leftTargetZ = sway * 0.008;
      rightTargetX = -sway * 0.02;
      rightTargetZ = sway * 0.008;
    }

    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, leftTargetX, lerpSpeed);
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, leftTargetZ, lerpSpeed);
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, rightTargetX, lerpSpeed);
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, rightTargetZ, lerpSpeed);
    }
  });

  return (
    <>
      {/* Solid Pelvis / Hip Block connecting seamlessly with Torso */}
      <mesh
        castShadow
        position={[0, -pelvisH * 0.5 + 0.005, 0]}
        geometry={new THREE.BoxGeometry(pelvisW, pelvisH, pelvisD)}
        material={bottomMat}
      />

      {/* Decorative Waistband / Cyber Belt detail */}
      <mesh
        position={[0, -0.005, 0]}
        geometry={new THREE.BoxGeometry(pelvisW * 1.02, 0.025 * props.torsoHScale, pelvisD * 1.02)}
      >
        <meshStandardMaterial color="#0A1017" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* 3D Skirt Overlay (only if top is not already a dress) */}
      {hasSkirt && (
        <group position={[0, -pelvisH * 0.2, 0]}>
          <mesh castShadow geometry={new THREE.CylinderGeometry(pelvisW * 0.52, pelvisW * 0.92, legH * 0.62, 20)} material={bottomMat} />
          {config.bottom === 'frill-skirt' && (
            <mesh position={[0, -legH * 0.3, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
              <torusGeometry args={[pelvisW * 0.90, 0.025, 6, 22]} />
              <meshStandardMaterial color={hexToColor(config.bottomColor)} roughness={0.6} />
            </mesh>
          )}
          {config.bottom === 'tutu' && (
            <mesh position={[0, -legH * 0.1, 0]} geometry={new THREE.CylinderGeometry(pelvisW * 0.60, pelvisW * 1.15, legH * 0.38, 24)}>
              <meshStandardMaterial color={hexToColor(config.bottomColor)} transparent opacity={0.65} roughness={0.9} />
            </mesh>
          )}
          {config.bottom === 'maid-apron-skirt' && (
            <mesh position={[0, -legH * 0.15, pelvisD * 0.42]} geometry={new THREE.BoxGeometry(pelvisW * 0.65, legH * 0.40, 0.02)}>
              <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
            </mesh>
          )}
        </group>
      )}

      {/* Two Legs - with distinct 3D bottom layers and integrated shoes */}
      {([-1, 1] as const).map((side) => {
        const isBareOrStockings = hasSkirt || isTopDress;
        const mainLegMat = isBareOrStockings ? skinMat : bottomMat;

        return (
          <group
            key={side}
            ref={side === -1 ? leftLegRef : rightLegRef}
            position={[side * legSep, -pelvisH, 0]}
          >
            {/* Upper Thigh / Shorts */}
            {isShorts ? (
              <>
                {/* Denim Shorts Thigh Section */}
                <mesh
                  castShadow
                  position={[0, -legH * 0.16, 0]}
                  geometry={new THREE.CylinderGeometry(legR * 1.04, legR * 0.98, legH * 0.32, 18)}
                  material={bottomMat}
                />
                {/* Folded Denim Cuff Ring */}
                <mesh position={[0, -legH * 0.31, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
                  <torusGeometry args={[legR * 1.02, 0.015, 6, 18]} />
                  <meshStandardMaterial color={hexToColor(config.bottomColor)} roughness={0.7} />
                </mesh>
                {/* Bare Leg below shorts */}
                <mesh
                  castShadow
                  position={[0, -legH * 0.65, 0]}
                  geometry={new THREE.CylinderGeometry(legR * 0.94, legR * 0.82, legH * 0.70, 18)}
                  scale={[1, 1, legD / (legR * 2)]}
                  material={skinMat}
                />
              </>
            ) : (
              /* Full Leg Cylinder */
              <mesh
                castShadow
                position={[0, -legH * 0.5, 0]}
                geometry={new THREE.CylinderGeometry(legR, legR * 0.85, legH, 18)}
                scale={[1, 1, legD / (legR * 2)]}
                material={mainLegMat}
              />
            )}

            {/* Smooth 3D Knee Contour */}
            <mesh
              position={[0, -legH * 0.48, legD * 0.4]}
              geometry={new THREE.SphereGeometry(legR * 0.65, 14, 12)}
              scale={[1, 0.8, 0.45]}
              material={isShorts || isBareOrStockings ? skinMat : bottomMat}
            />

            {/* Cargo Pants: 3D Flap Utility Pockets on outer thighs */}
            {isCargo && (
              <mesh position={[side * (legR * 0.95), -legH * 0.28, 0]} geometry={new THREE.BoxGeometry(0.04, legH * 0.25, legD * 0.65)} material={bottomMat}>
                <meshStandardMaterial color={hexToColor(config.bottomColor)} roughness={0.8} />
              </mesh>
            )}

            {/* Armor Pants: Steel Greaves & Knee Sabaton Plates */}
            {isArmorPants && (
              <group position={[0, -legH * 0.48, legD * 0.38]}>
                <mesh geometry={new THREE.BoxGeometry(legR * 1.5, legR * 1.1, 0.04)}>
                  <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0.025]}>
                  <octahedronGeometry args={[legR * 0.35, 0]} />
                  <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.15} />
                </mesh>
              </group>
            )}

            {/* Joggers: Contrast Racing Side Stripes */}
            {isJoggers && (
              <mesh position={[side * (legR * 0.98), -legH * 0.5, 0]} geometry={new THREE.BoxGeometry(0.012, legH * 0.85, 0.025)}>
                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
              </mesh>
            )}

            {/* Leggings: Glowing Neon Conduit Seam */}
            {isLeggings && (
              <mesh position={[side * (legR * 0.96), -legH * 0.5, 0]} geometry={new THREE.BoxGeometry(0.01, legH * 0.90, 0.015)}>
                <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={2.5} />
              </mesh>
            )}

            {/* INTEGRATED ANKLE SHOE — swings synchronously with the leg */}
            <group position={[0, -legH, 0]}>
              <LegShoe config={config} legR={legR} side={side} />
            </group>
          </group>
        );
      })}
    </>
  );
}

// ─── Accessories ─────────────────────────────────────────────────────────────

function AvatarAccessoryHead({ id, config, headRadius }: { id: string; config: AvatarConfig; headRadius: number }) {
  const mat = useMaterial(config.accessoryColor || '#FFD700', 0.5, 0.2);
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
          <mesh rotation={[Math.PI * 0.5, 0, 0]} geometry={new THREE.TorusGeometry(headRadius * 0.85, 0.035, 6, 20, Math.PI)} material={darkMat} />
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
            <meshStandardMaterial color={hexToColor(config.accessoryColor || '#FF5C93')} roughness={0.3} />
          </mesh>
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * headRadius * 0.38, 0, 0]} rotation={[0, 0, side * 0.3]}>
              <cylinderGeometry args={[headRadius * 0.12, headRadius * 0.32, headRadius * 0.5, 12]} />
              <meshStandardMaterial color={hexToColor(config.accessoryColor || '#FF5C93')} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'halo':
      return (
        <group position={[0, headRadius * 1.55, 0]} rotation={[0.2, 0, 0]}>
          <mesh rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[headRadius * 0.75, 0.035, 8, 30]} />
            <meshStandardMaterial color="#FFDF00" emissive="#FFD700" emissiveIntensity={2.5} roughness={0.1} />
          </mesh>
        </group>
      );
    case 'hat':
      return (
        <group position={[0, headRadius * 1.05, 0]}>
          <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.62, headRadius * 0.58, headRadius * 0.9, 16)} material={mat} />
          <mesh position={[0, -headRadius * 0.46, 0]} geometry={new THREE.CylinderGeometry(headRadius * 1.1, headRadius * 1.1, 0.06, 20)} material={mat} />
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
          <mesh rotation={[Math.PI * 0.5, 0, 0]} geometry={new THREE.TorusGeometry(headRadius * 1.0, 0.04, 6, 20, Math.PI)} material={darkMat} />
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
                <meshStandardMaterial color={hexToColor(config.accessoryColor || '#FFD700')} emissive={hexToColor('#FFD700')} emissiveIntensity={0.5} />
              </mesh>
            );
          })}
        </group>
      );
    case 'glasses':
      return (
        <group position={[0, headRadius * 0.08, headRadius * 0.94]}>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * headRadius * 0.38, 0, 0]}>
              <mesh geometry={new THREE.TorusGeometry(headRadius * 0.22, 0.022, 6, 20)} material={mat} />
              <mesh position={[0, 0, 0.005]}>
                <circleGeometry args={[headRadius * 0.20, 16]} />
                <meshStandardMaterial color="#67E8F9" transparent opacity={0.35} roughness={0.1} />
              </mesh>
            </group>
          ))}
          {/* Bridge */}
          <mesh position={[0, 0, 0]} geometry={new THREE.BoxGeometry(headRadius * 0.32, 0.02, 0.02)} material={mat} />
          {/* Temples reaching back to ears */}
          {([-1, 1] as const).map((side) => (
            <mesh
              key={`temple-${side}`}
              position={[side * headRadius * 0.60, 0, -headRadius * 0.45]}
              geometry={new THREE.BoxGeometry(0.018, 0.018, headRadius * 0.90)}
              material={mat}
            />
          ))}
        </group>
      );
    default:
      return null;
  }
}

function AvatarAccessoryFace({ id, config, headRadius }: { id: string; config: AvatarConfig; headRadius: number }) {
  const mat = useMaterial(config.accessoryColor || '#FF5C93', 0.3, 0.5, config.accessoryColor, 0.2);
  switch (id) {
    case 'ribbon-choker':
      return (
        <group position={[0, -headRadius * 0.44, 0]}>
          {/* Velvet Neck Band - flush horizontal around neck */}
          <mesh rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[headRadius * 0.54, 0.022, 8, 24]} />
            <meshStandardMaterial color={hexToColor(config.accessoryColor || '#FF5C93')} roughness={0.6} />
          </mesh>
          {/* Bow knot sitting proud on the front */}
          <mesh position={[0, -0.015, headRadius * 0.58]}>
            <sphereGeometry args={[0.038, 12, 10]} />
            <meshStandardMaterial color={hexToColor(config.accessoryColor || '#FF5C93')} roughness={0.4} />
          </mesh>
          {/* Golden Heart / Bell Pendant hanging over the chest */}
          <mesh position={[0, -0.05, headRadius * 0.60]}>
            <octahedronGeometry args={[0.036, 0]} />
            <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.15} emissive="#FFD700" emissiveIntensity={0.6} />
          </mesh>
          {/* Ribbon Tails flowing downward on top of dress */}
          {([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              position={[side * 0.025, -0.065, headRadius * 0.59]}
              rotation={[0.1, 0, side * 0.35]}
              geometry={new THREE.BoxGeometry(0.025, 0.065, 0.008)}
            >
              <meshStandardMaterial color={hexToColor(config.accessoryColor || '#FF5C93')} roughness={0.5} />
            </mesh>
          ))}
        </group>
      );
    case 'mask':
      return (
        <group position={[0, -headRadius * 0.16, headRadius * 0.72]}>
          <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.88, headRadius * 0.82, headRadius * 0.50, 16, 1, false, -Math.PI * 0.40, Math.PI * 0.80)} material={mat} />
          {/* Ear loops */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * headRadius * 0.65, 0, -headRadius * 0.35]} geometry={new THREE.BoxGeometry(0.012, 0.015, headRadius * 0.70)}>
              <meshStandardMaterial color="#1E293B" />
            </mesh>
          ))}
        </group>
      );
    case 'visor':
      return (
        <group position={[0, headRadius * 0.10, headRadius * 0.72]}>
          <mesh geometry={new THREE.CylinderGeometry(headRadius * 0.94, headRadius * 0.92, headRadius * 0.32, 18, 1, false, -Math.PI * 0.45, Math.PI * 0.90)}>
            <meshStandardMaterial color={hexToColor('#22D3EE')} transparent opacity={0.60} emissive={hexToColor('#22D3EE')} emissiveIntensity={1.8} />
          </mesh>
          {/* Side mounts */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * headRadius * 0.90, 0, -headRadius * 0.30]} geometry={new THREE.BoxGeometry(0.035, 0.06, 0.08)}>
              <meshStandardMaterial color="#0F172A" metalness={0.9} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

function AvatarAccessoryBack({ id, config }: { id: string; config: AvatarConfig; windT?: number }) {
  const isFlared =
    config.top.includes('dress') ||
    config.top.includes('gown') ||
    config.top === 'jacket' ||
    config.top === 'armor' ||
    config.bottom === 'tutu' ||
    config.bottom === 'frill-skirt';
  const backZ = isFlared ? -0.22 : -0.15;
  const mat = useMaterial(config.accessoryColor || '#FFD700', 0.5, 0);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (id === 'angel-wings') {
      const flap = Math.sin(t * 3.0) * 0.22;
      if (leftWingRef.current) leftWingRef.current.rotation.z = -0.35 - flap;
      if (rightWingRef.current) rightWingRef.current.rotation.z = 0.35 + flap;
    } else if (id === 'fairy-wings') {
      const flap = Math.sin(t * 14.0) * 0.35;
      if (leftWingRef.current) leftWingRef.current.rotation.z = -0.4 - flap;
      if (rightWingRef.current) rightWingRef.current.rotation.z = 0.4 + flap;
    } else if (id === 'wings') {
      const flap = Math.sin(t * 3.2) * 0.25;
      if (leftWingRef.current) leftWingRef.current.rotation.z = -0.4 - flap;
      if (rightWingRef.current) rightWingRef.current.rotation.z = 0.4 + flap;
    }
  });

  switch (id) {
    case 'angel-wings':
      return (
        <group position={[0, 0.12, backZ]}>
          {([-1, 1] as const).map((side) => (
            <group
              key={side}
              ref={side === -1 ? leftWingRef : rightWingRef}
              position={[side * 0.08, 0, 0]}
              rotation={[0, side * 0.3, side * 0.35]}
            >
              <mesh position={[side * 0.18, 0.14, 0]} geometry={new THREE.ConeGeometry(0.09, 0.45, 6)} rotation={[0, 0, -side * 0.8]}>
                <meshStandardMaterial color="#FFFFFF" emissive="#E0E7FF" emissiveIntensity={0.3} roughness={0.5} />
              </mesh>
              <mesh position={[side * 0.26, 0.03, 0]} geometry={new THREE.ConeGeometry(0.08, 0.40, 6)} rotation={[0, 0, -side * 1.1]}>
                <meshStandardMaterial color="#FFFFFF" emissive="#E0E7FF" emissiveIntensity={0.2} roughness={0.5} />
              </mesh>
              <mesh position={[side * 0.28, -0.10, 0]} geometry={new THREE.ConeGeometry(0.07, 0.34, 6)} rotation={[0, 0, -side * 1.3]}>
                <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'fairy-wings':
      return (
        <group position={[0, 0.12, backZ]}>
          {([-1, 1] as const).map((side) => (
            <group
              key={side}
              ref={side === -1 ? leftWingRef : rightWingRef}
              position={[side * 0.08, 0, 0]}
              rotation={[0, side * 0.2, side * 0.4]}
            >
              <mesh position={[side * 0.22, 0.16, 0]} rotation={[0, 0, -side * 0.5]}>
                <circleGeometry args={[0.24, 16]} />
                <meshStandardMaterial color="#22D3EE" emissive="#FF5C93" emissiveIntensity={0.5} transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[side * 0.16, -0.08, 0]} rotation={[0, 0, -side * 1.2]}>
                <circleGeometry args={[0.15, 16]} />
                <meshStandardMaterial color="#A855F7" emissive="#22D3EE" emissiveIntensity={0.4} transparent opacity={0.65} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'backpack':
      return (
        <mesh position={[0, 0.0, backZ - 0.04]} geometry={new THREE.BoxGeometry(0.20, 0.28, 0.12)} material={mat} />
      );
    case 'wings':
      return (
        <group position={[0, 0.10, backZ]}>
          {([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              ref={side === -1 ? leftWingRef : rightWingRef}
              position={[side * 0.10, 0, 0]}
              rotation={[0, 0, side * 0.4]}
            >
              <meshStandardMaterial color={hexToColor(config.accessoryColor || '#38BDF8')} emissive={hexToColor(config.accessoryColor || '#38BDF8')} emissiveIntensity={0.3} roughness={0.6} side={THREE.DoubleSide} />
              <planeGeometry args={[0.4, 0.55]} />
            </mesh>
          ))}
        </group>
      );
    case 'jetpack':
      return (
        <group position={[0, 0.04, backZ - 0.03]}>
          <mesh geometry={new THREE.BoxGeometry(0.22, 0.28, 0.12)} material={mat} />
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.09, -0.16, 0.03]} geometry={new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8)}>
              <meshStandardMaterial color={hexToColor('#FF6B35')} emissive={hexToColor('#FF6B35')} emissiveIntensity={1.2} />
            </mesh>
          ))}
        </group>
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
  const innateWingsRef = useRef<THREE.Group>(null);
  const sparklesRef = useRef<THREE.Group>(null);
  const curPos = useRef(new THREE.Vector3(0, 0, 0));
  const curRot = useRef(new THREE.Euler(0, 0, 0));

  const props = getBodyProps(config);

  useFrame(({ clock }, delta) => {
    if (!animate) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(0.1, delta);
    const lerpSpeed = Math.min(1, dt * 8.0);

    // Flap innate fairy wings continuously at 22Hz
    if (innateWingsRef.current) {
      innateWingsRef.current.children.forEach((child, i) => {
        const side = i === 0 ? -1 : 1;
        const flap = Math.sin(t * 22.0) * 0.42;
        child.rotation.y = side * 0.32 + flap;
      });
    }

    // Orbit fairy sparkle motes at 60fps
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += dt * 1.5;
    }

    // Determine target root position & rotation based on action
    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    if (action === 'attack') {
      targetZ = 0.35;
      targetY = 0.05;
      targetRotX = -0.12;
    } else if (action === 'hit') {
      targetZ = -0.32;
      targetY = 0.08;
      targetRotX = 0.20;
    } else if (action === 'defend') {
      targetZ = -0.06;
      targetY = -0.04;
      targetRotX = 0.06;
    } else if (action === 'victory') {
      targetY = Math.abs(Math.sin(t * 4.0)) * 0.18;
      targetZ = 0;
      targetRotX = -0.04;
    } else {
      // Idle: smooth floating for Fairy, gentle breathing heave for other species
      const hover = props.hoverOffset > 0 ? props.hoverOffset + Math.sin(t * 2.4) * 0.05 : 0;
      targetY = hover || Math.sin(t * 1.5) * 0.012;
      targetZ = 0;
      targetRotX = 0;
      targetRotY = Math.sin(t * 0.7) * 0.035;
    }

    if (groupRef.current) {
      curPos.current.x = THREE.MathUtils.lerp(curPos.current.x, targetX, lerpSpeed);
      curPos.current.y = THREE.MathUtils.lerp(curPos.current.y, targetY, lerpSpeed);
      curPos.current.z = THREE.MathUtils.lerp(curPos.current.z, targetZ, lerpSpeed);

      curRot.current.x = THREE.MathUtils.lerp(curRot.current.x, targetRotX, lerpSpeed);
      curRot.current.y = THREE.MathUtils.lerp(curRot.current.y, targetRotY, lerpSpeed);

      groupRef.current.position.copy(curPos.current);
      groupRef.current.rotation.copy(curRot.current);
    }
  });

  const torsoH = 0.52 * props.torsoHScale;
  const headH = props.headRadius * 1.38;

  // Seamless anatomical stacking from center origin:
  const legsY = -torsoH * 0.5;
  const torsoY = 0.0;
  const headY = torsoH * 0.5 + 0.05 + headH * 0.48;
  const armsY = torsoH * 0.36;

  return (
    <group ref={groupRef} scale={[props.totalScale, props.totalScale, props.totalScale]}>
      {/* Head */}
      <group position={[0, headY, 0]}>
        <AvatarHead config={config} />
        <AvatarHair config={config} headRadius={props.headRadius} />
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
        {config.accessories.back ? (
          <AvatarAccessoryBack id={config.accessories.back} config={config} />
        ) : props.isTiny ? (
          /* Innate 4 Fluttering Wings for Fairy */
          <group ref={innateWingsRef} position={[0, 0.06, -0.12]}>
            {([-1, 1] as const).map((side) => {
              return (
                <group key={`fairy-innate-${side}`} position={[side * 0.04, 0, 0]} rotation={[0, side * 0.32, side * 0.28]}>
                  {/* Upper Shimmering Wing */}
                  <mesh position={[side * 0.22, 0.16, 0]} rotation={[0, 0, -side * 0.35]}>
                    <circleGeometry args={[0.24, 16]} />
                    <meshStandardMaterial
                      color="#67E8F9"
                      emissive="#F472B6"
                      emissiveIntensity={0.9}
                      transparent
                      opacity={0.75}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                  {/* Lower Shimmering Wing */}
                  <mesh position={[side * 0.14, -0.08, 0]} rotation={[0, 0, -side * 1.05]}>
                    <circleGeometry args={[0.15, 16]} />
                    <meshStandardMaterial
                      color="#E879F9"
                      emissive="#38BDF8"
                      emissiveIntensity={0.7}
                      transparent
                      opacity={0.7}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        ) : null}

        {/* Fairy Sparkle Dust motes underneath */}
        {props.isTiny && (
          <group ref={sparklesRef} position={[0, -0.2, 0]}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(angle) * 0.14, -0.05, Math.sin(angle) * 0.14]}>
                  <sphereGeometry args={[0.012, 6, 6]} />
                  <meshStandardMaterial color="#F472B6" emissive="#67E8F9" emissiveIntensity={3.0} />
                </mesh>
              );
            })}
          </group>
        )}
      </group>

      {/* Arms with Weapon and Action Animation (with shoulder pauldrons mounted to arm deltoids) */}
      <group position={[0, armsY, 0]}>
        <AvatarArms config={config} action={action} />
      </group>

      {/* Legs with Bottoms and integrated Shoes */}
      <group position={[0, legsY, 0]}>
        <AvatarLegs config={config} action={action} />
      </group>
    </group>
  );
}
