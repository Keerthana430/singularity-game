// Purpose: Easing functions and keyframe sampler with per-joint lag.
// Implements the joint lag table from CHARACTER_ANIMATION_PLAN.md §2.6.

import { PoseVector, lerpPose } from './poseTypes';

// ─── Easing functions ────────────────────────────────────────────────────────

export function easeLin(t: number): number { return t; }

export function easeIn(t: number): number { return t * t * t; }

export function easeOut(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

export function easeIO(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Quintic ease out ("snap" — fast start, settles quickly)
export function easeSnap(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u * u * u;
}

export type EasingName = 'lin' | 'in' | 'out' | 'io' | 'snap';

export function applyEasing(t: number, easing: EasingName): number {
  switch (easing) {
    case 'lin':  return easeLin(t);
    case 'in':   return easeIn(t);
    case 'out':  return easeOut(t);
    case 'io':   return easeIO(t);
    case 'snap': return easeSnap(t);
    default:     return t;
  }
}

// ─── Keyframe types ──────────────────────────────────────────────────────────

export interface Keyframe {
  t: number;                          // time in seconds
  easing: EasingName;                 // applied from prev keyframe to this one
  pose: Partial<PoseVector>;          // only changed joints; rest inherit from previous
}

export interface KeyframeTrack {
  id: string;
  duration: number;
  keys: Keyframe[];
}

// ─── Joint lag table (§2.6) ──────────────────────────────────────────────────

// Lag in seconds for each joint group when a punch/kick is played.
export const LAG_IN: Record<string, number> = {
  feet:      0.000,
  hipsPos:   0.015,
  hipsRot:   0.030,
  chest:     0.045,
  shoulder:  0.055,
  upperArm:  0.060,
  forearm:   0.075,
  head:      0.050,
};

// Recoil uses half the lag
export const LAG_OUT: Record<string, number> = {
  feet:      0.000,
  hipsPos:   0.008,
  hipsRot:   0.015,
  chest:     0.022,
  shoulder:  0.028,
  upperArm:  0.030,
  forearm:   0.038,
  head:      0.025,
};

// Map from PoseVector field name to its lag group
export const FIELD_TO_LAG_GROUP: Record<string, string> = {
  lFtX: 'feet', rFtX: 'feet',
  lLLx: 'feet', rLLx: 'feet',
  lULx: 'feet', rULx: 'feet',
  lULy: 'feet', rULy: 'feet',
  lULz: 'feet', rULz: 'feet',

  hipsY: 'hipsPos',
  hipsX: 'hipsRot', hipsY_rot: 'hipsRot', hipsZ: 'hipsRot',

  spineX: 'chest',
  chestX: 'chest', chestY: 'chest', chestZ: 'chest',

  lShX: 'shoulder', lShY: 'shoulder', lShZ: 'shoulder',
  rShX: 'shoulder', rShY: 'shoulder', rShZ: 'shoulder',

  lUAx: 'upperArm', lUAy: 'upperArm', lUAz: 'upperArm',
  rUAx: 'upperArm', rUAy: 'upperArm', rUAz: 'upperArm',

  lLAx: 'forearm', rLAx: 'forearm',

  headX: 'head', headY: 'head', headZ: 'head',
};

// ─── Sampler ─────────────────────────────────────────────────────────────────

/**
 * Sample a keyframe track at time t, applying per-joint lag.
 * @param track The keyframe track
 * @param t Current time in seconds
 * @param basePose The "at rest" pose to inherit unchanged fields from
 * @param useLag Whether to apply joint lag (for punches/kicks)
 * @param lagTable Which lag table to use ('in' for strike, 'out' for recoil)
 */
export function sampleTrack(
  track: KeyframeTrack,
  t: number,
  basePose: PoseVector,
  useLag: boolean = false,
  lagPhase: 'in' | 'out' = 'in'
): PoseVector {
  const lagTable = lagPhase === 'in' ? LAG_IN : LAG_OUT;

  // Build result by sampling each field with its own lag
  const result: PoseVector = { ...basePose };
  const fields = Object.keys(basePose) as Array<keyof PoseVector>;

  for (const field of fields) {
    const lag = useLag ? (lagTable[FIELD_TO_LAG_GROUP[field] ?? 'hipsPos'] ?? 0) : 0;
    const laggedT = Math.max(0, t - lag);
    result[field] = sampleField(track, field as string, laggedT, basePose[field]);
  }

  return result;
}

/**
 * Sample a single field from a keyframe track at time t.
 */
function sampleField(
  track: KeyframeTrack,
  field: string,
  t: number,
  baseValue: number
): number {
  const keys = track.keys;
  if (keys.length === 0) return baseValue;

  // Clamp to track duration
  const clampedT = Math.max(0, Math.min(t, track.duration));

  // Find surrounding keyframes
  let prevKey = keys[0];
  let nextKey = keys[0];

  for (let i = 0; i < keys.length; i++) {
    if (keys[i].t <= clampedT) prevKey = keys[i];
    if (keys[i].t >= clampedT) { nextKey = keys[i]; break; }
  }

  if (prevKey === nextKey) {
    // Exactly on a keyframe
    return field in (prevKey.pose ?? {}) ? (prevKey.pose as any)[field] ?? baseValue : baseValue;
  }

  // Interpolate
  const span = nextKey.t - prevKey.t;
  const rawT = span > 0 ? (clampedT - prevKey.t) / span : 0;
  const easedT = applyEasing(rawT, nextKey.easing);

  const prevVal = field in (prevKey.pose ?? {}) ? (prevKey.pose as any)[field] ?? baseValue : baseValue;
  const nextVal = field in (nextKey.pose ?? {}) ? (nextKey.pose as any)[field] ?? prevVal : prevVal;

  return prevVal + (nextVal - prevVal) * easedT;
}

/**
 * Smoothstep function for envelope curves.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Compute a punch/hit envelope: fast attack, hold, slow decay.
 * @param t Current time
 * @param attackEnd Time when attack ramp finishes
 * @param holdEnd Time when hold ends (decay starts)
 * @param decayEnd Time when fully back to 0
 */
export function punchEnvelope(
  t: number,
  attackEnd: number,
  holdEnd: number,
  decayEnd: number
): number {
  if (t < attackEnd) return smoothstep(0, attackEnd, t);
  if (t < holdEnd) return 1;
  return 1 - smoothstep(holdEnd, decayEnd, t);
}
