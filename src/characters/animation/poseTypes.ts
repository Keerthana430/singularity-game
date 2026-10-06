// Purpose: Pose vector type definition, joint limits table, and bone name mapping.
// Every pose is a flat object of joint angles. Blending = lerp per field.

export interface PoseVector {
  // Hips (root)
  hipsY: number;       // vertical offset from foot solver
  hipsX: number;       // pitch (positive = lean forward)
  hipsY_rot: number;   // yaw (positive = L hip forward)
  hipsZ: number;       // roll

  // Spine / Chest
  spineX: number;
  chestX: number;      // positive = lean forward
  chestY: number;      // positive = L shoulder forward (boxing twist)
  chestZ: number;      // positive = top leans toward L

  // Head
  headX: number;       // positive = nod/chin down
  headY: number;       // positive = look toward L
  headZ: number;

  // Left shoulder
  lShX: number;
  lShY: number;
  lShZ: number;

  // Left upper arm
  lUAx: number;        // negative = arm forward/up
  lUAy: number;
  lUAz: number;        // negative = arm out to side/up (L arm)

  // Left lower arm (forearm)
  lLAx: number;        // negative = elbow flexes. lUAx + lLAx must be in [-3.14, 0.2]

  // Right shoulder
  rShX: number;
  rShY: number;
  rShZ: number;

  // Right upper arm
  rUAx: number;
  rUAy: number;
  rUAz: number;        // positive = arm out to side/up (R arm, mirrored)

  // Right lower arm
  rLAx: number;

  // Left upper leg (thigh)
  lULx: number;        // negative = leg swings forward
  lULy: number;
  lULz: number;        // negative = leg out to side (L leg)

  // Left lower leg (shin)
  lLLx: number;        // positive = knee bends

  // Left foot
  lFtX: number;

  // Right upper leg
  rULx: number;
  rULy: number;
  rULz: number;        // positive = leg out to side (R leg, mirrored)

  // Right lower leg
  rLLx: number;

  // Right foot
  rFtX: number;
}

// Default neutral/rest pose
export const REST_POSE: PoseVector = {
  hipsY: 0.905, hipsX: 0, hipsY_rot: 0, hipsZ: 0,
  spineX: 0,
  chestX: 0, chestY: 0, chestZ: 0,
  headX: 0, headY: 0, headZ: 0,
  lShX: 0, lShY: 0, lShZ: 0,
  lUAx: 0, lUAy: 0, lUAz: 0,
  lLAx: -0.12,
  rShX: 0, rShY: 0, rShZ: 0,
  rUAx: 0, rUAy: 0, rUAz: 0,
  rLAx: -0.12,
  lULx: 0, lULy: 0, lULz: 0,
  lLLx: 0,
  lFtX: 0,
  rULx: 0, rULy: 0, rULz: 0,
  rLLx: 0,
  rFtX: 0,
};

// Fighting stance pose (Phase 3, corrected signs)
export const STANCE_POSE: PoseVector = {
  hipsY: 0.905,   // foot solver sets this
  hipsX: 0,
  hipsY_rot: 0.35,
  hipsZ: 0,
  spineX: 0,
  chestX: 0.12,
  chestY: 0.20,
  chestZ: 0,
  headX: 0.12,
  headY: -0.50,
  headZ: 0,
  lShX: -0.10, lShY: 0, lShZ: 0,
  lUAx: -1.00, lUAy: 0, lUAz: 0.30,
  lLAx: -1.95,
  rShX: -0.10, rShY: 0, rShZ: 0,
  rUAx: -0.90, rUAy: 0, rUAz: -0.40,
  rLAx: -2.20,
  lULx: -0.35, lULy: 0, lULz: -0.06,
  lLLx: 0.50,
  lFtX: -0.15,
  rULx: 0.30, rULy: 0, rULz: 0.06,
  rLLx: 0.60,
  rFtX: -0.45,
};

// Joint limits (from plan §1.5)
export interface JointLimits {
  min: number;
  max: number;
}

export const JOINT_LIMITS: Record<string, JointLimits> = {
  lUAx:  { min: -3.1,  max: 1.2  },
  rUAx:  { min: -3.1,  max: 1.2  },
  lUAz:  { min: -3.0,  max: 0.6  },  // L arm: negative = out/up
  rUAz:  { min: -0.6,  max: 3.0  },  // R arm: mirrored
  lLAx:  { min: -2.6,  max: 0.0  },
  rLAx:  { min: -2.6,  max: 0.0  },
  lULx:  { min: -1.6,  max: 1.0  },
  rULx:  { min: -1.6,  max: 1.0  },
  lULz:  { min: -0.7,  max: 0.15 },
  rULz:  { min: -0.15, max: 0.7  },
  lLLx:  { min: 0.0,   max: 2.3  },
  rLLx:  { min: 0.0,   max: 2.3  },
  chestX:{ min: -0.9,  max: 0.8  },
  chestY:{ min: -1.3,  max: 1.3  },
  headX: { min: -1.1,  max: 0.5  },
  headY: { min: -1.2,  max: 1.2  },
  hipsX: { min: -1.55, max: 0.6  },
};

// Min forearm world angle: lUAx + lLAx must be in [-3.14, 0.2]
export const FOREARM_WORLD_MIN = -3.14;
export const FOREARM_WORLD_MAX = 0.2;

// Hand-to-chest minimum distance (prevents hand clipping through torso)
export const HAND_TO_CHEST_MIN = 0.27;

// Lerp a pose
export function lerpPose(a: PoseVector, b: PoseVector, t: number): PoseVector {
  const out = {} as PoseVector;
  const keys = Object.keys(a) as Array<keyof PoseVector>;
  for (const k of keys) {
    out[k] = a[k] + (b[k] - a[k]) * t;
  }
  return out;
}

// Zero pose delta
export function zeroPose(): PoseVector {
  const out = {} as PoseVector;
  const keys = Object.keys(REST_POSE) as Array<keyof PoseVector>;
  for (const k of keys) out[k] = 0;
  return out;
}

// Add pose delta to base
export function addPose(base: PoseVector, delta: Partial<PoseVector>): PoseVector {
  return { ...base, ...Object.fromEntries(
    Object.entries(delta).map(([k, v]) => [k, (base[k as keyof PoseVector] ?? 0) + (v ?? 0)])
  )} as PoseVector;
}
