// Purpose: Foot-planting solver — computes hip height from leg angles, no hard-coded Y.
// Formula from CHARACTER_ANIMATION_PLAN.md §2.4

// Segment lengths (must match characterUtils.ts)
const UPPER_LEG = 0.40;
const LOWER_LEG = 0.38;
const FOOT_OFFSET = 0.045;

/**
 * Compute the vertical drop of one leg from the hip joint to the floor contact.
 * ULx = upper leg X rotation, LLx = lower leg X rotation, ULz = upper leg Z rotation
 * All angles in radians, following the rig sign conventions.
 */
export function legDrop(ULx: number, LLx: number, ULz: number): number {
  // Vertical component from the plan's formula:
  // (0.08 + 0.40*cos(hipsX + ULx) + 0.38*cos(hipsX + ULx + LLx) + 0.045) * cos(ULz)
  // We call this with hipsX already factored in, so we pass 0 for hipsX:
  const drop =
    (0.08 +
      UPPER_LEG * Math.cos(ULx) +
      LOWER_LEG * Math.cos(ULx + LLx) +
      FOOT_OFFSET) *
    Math.cos(ULz);
  return drop;
}

/**
 * Solve the hip Y position from leg configuration.
 * The hip sits at the maximum of both leg drops (the foot that needs the most vertical reach defines the floor).
 * @param lULx Left upper leg X
 * @param lLLx Left lower leg X
 * @param lULz Left upper leg Z
 * @param rULx Right upper leg X
 * @param rLLx Right lower leg X
 * @param rULz Right upper leg Z
 * @param gAmt Ground blend weight (1 = on ground, 0 = in air/lying)
 */
export function solveHipsY(
  lULx: number,
  lLLx: number,
  lULz: number,
  rULx: number,
  rLLx: number,
  rULz: number,
  gAmt: number = 1.0
): number {
  const lDrop = legDrop(lULx, lLLx, lULz);
  const rDrop = legDrop(rULx, rLLx, rULz);
  const solved = Math.max(lDrop, rDrop);
  // Base height from straight legs is ~0.905
  // Blend toward solved when grounded
  const base = 0.905;
  return base * (1 - gAmt) + solved * gAmt;
}

/**
 * Compute the foot compensation angle to keep the sole flat on the floor.
 * foot.x = -(UL.x + LL.x) + offset
 * @param ULx upper leg X
 * @param LLx lower leg X
 * @param offset +0.08 for toes-up lead foot, +0.45 for raised rear heel
 */
export function flatFootAngle(ULx: number, LLx: number, offset: number = 0): number {
  return -(ULx + LLx) + offset;
}
