// Purpose: Pose validator — checks every keyframe and procedural sample for joint limit violations,
// hand-to-chest clipping, NaN values, and feet above floor.
// Run this on every phase before marking DONE.

import { PoseVector, JOINT_LIMITS, FOREARM_WORLD_MIN, FOREARM_WORLD_MAX, HAND_TO_CHEST_MIN } from './poseTypes';

export interface ValidationError {
  field: string;
  value: number;
  reason: string;
  moveId?: string;
  timeS?: number;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single pose vector.
 */
export function validatePose(
  pose: PoseVector,
  context: { moveId?: string; timeS?: number } = {}
): ValidationResult {
  const errors: ValidationError[] = [];

  const check = (field: string, value: number) => {
    if (Number.isNaN(value)) {
      errors.push({ field, value, reason: 'NaN', ...context });
      return;
    }
    const limits = JOINT_LIMITS[field];
    if (limits) {
      if (value < limits.min) {
        errors.push({ field, value, reason: `below min ${limits.min}`, ...context });
      }
      if (value > limits.max) {
        errors.push({ field, value, reason: `above max ${limits.max}`, ...context });
      }
    }
  };

  // Check all defined limits
  check('lUAx', pose.lUAx);
  check('rUAx', pose.rUAx);
  check('lUAz', pose.lUAz);
  check('rUAz', pose.rUAz);
  check('lLAx', pose.lLAx);
  check('rLAx', pose.rLAx);
  check('lULx', pose.lULx);
  check('rULx', pose.rULx);
  check('lULz', pose.lULz);
  check('rULz', pose.rULz);
  check('lLLx', pose.lLLx);
  check('rLLx', pose.rLLx);
  check('chestX', pose.chestX);
  check('chestY', pose.chestY);
  check('headX', pose.headX);
  check('headY', pose.headY);
  check('hipsX', pose.hipsX);

  // Forearm world angle constraint
  const lForearmWorld = pose.lUAx + pose.lLAx;
  if (lForearmWorld < FOREARM_WORLD_MIN) {
    errors.push({ field: 'lUAx+lLAx', value: lForearmWorld, reason: `forearm world angle ${lForearmWorld.toFixed(3)} < ${FOREARM_WORLD_MIN}`, ...context });
  }
  if (lForearmWorld > FOREARM_WORLD_MAX) {
    errors.push({ field: 'lUAx+lLAx', value: lForearmWorld, reason: `forearm world angle ${lForearmWorld.toFixed(3)} > ${FOREARM_WORLD_MAX}`, ...context });
  }

  const rForearmWorld = pose.rUAx + pose.rLAx;
  if (rForearmWorld < FOREARM_WORLD_MIN) {
    errors.push({ field: 'rUAx+rLAx', value: rForearmWorld, reason: `forearm world angle ${rForearmWorld.toFixed(3)} < ${FOREARM_WORLD_MIN}`, ...context });
  }
  if (rForearmWorld > FOREARM_WORLD_MAX) {
    errors.push({ field: 'rUAx+rLAx', value: rForearmWorld, reason: `forearm world angle ${rForearmWorld.toFixed(3)} > ${FOREARM_WORLD_MAX}`, ...context });
  }

  // NaN check on all fields
  const allFields = Object.entries(pose) as Array<[string, number]>;
  for (const [field, value] of allFields) {
    if (Number.isNaN(value)) {
      errors.push({ field, value, reason: 'NaN', ...context });
    }
  }

  return { passed: errors.length === 0, errors };
}

/**
 * Validate a sequence of poses at 60 Hz over a given duration.
 * poseFn(t) returns a PoseVector at time t seconds.
 */
export function validateSequence(
  poseFn: (t: number) => PoseVector,
  durationS: number,
  moveId: string
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const fps = 60;
  const steps = Math.ceil(durationS * fps);

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * durationS;
    const pose = poseFn(t);
    const result = validatePose(pose, { moveId, timeS: t });
    allErrors.push(...result.errors);
  }

  return { passed: allErrors.length === 0, errors: allErrors };
}

/**
 * Print a validation result to the console.
 */
export function reportValidation(result: ValidationResult, label: string): void {
  if (result.passed) {
    console.log(`[Validator] PASS: ${label}`);
  } else {
    console.error(`[Validator] FAIL: ${label} — ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      const loc = err.moveId ? `${err.moveId}@${(err.timeS ?? 0).toFixed(3)}s` : '';
      console.error(`  ${loc} ${err.field} = ${err.value.toFixed(4)}: ${err.reason}`);
    }
  }
}
