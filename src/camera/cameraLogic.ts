import { Vector3, MathUtils } from 'three';
import { CameraMode } from './types';

// Fixed offset presets for different modes
export const CAMERA_OFFSETS: Record<CameraMode, Vector3> = {
  // Higher 3/4 elevated view (~35-45 deg elevation, ~30-45 deg yaw)
  gameplay: new Vector3(-9, 12, 11),
  dice: new Vector3(-4, 5, 6),
  movement: new Vector3(-8, 10, 9),
  snake: new Vector3(-5, 6, 7),
  ladder: new Vector3(-5, 6, 7),
  victory: new Vector3(-4, 3, 6),
  // Overview frames the whole board. The board center is (0, ~1.5, 0).
  overview: new Vector3(-12, 16, 14),
};

export interface CameraState {
  position: Vector3;
  target: Vector3;
}

/**
 * Pure function to calculate the desired camera position and look target
 * based on current mode, targets, and aspect ratio.
 */
export function calculateCameraDesiredState(
  mode: CameraMode,
  activeTarget: Vector3 | undefined,
  dicePosition: Vector3 | undefined,
  aspectRatio: number
): CameraState {
  const lookTarget = new Vector3(0, 0, 0);

  if (mode === 'overview') {
    lookTarget.set(0, 0, 0);
  } else if (mode === 'dice' && dicePosition) {
    lookTarget.copy(dicePosition);
  } else if (activeTarget) {
    lookTarget.copy(activeTarget);
  }

  // Determine the desired offset for the current mode
  const targetOffset = CAMERA_OFFSETS[mode].clone();

  // Adjust for aspect ratio if it's very narrow (e.g. mobile portrait)
  if (aspectRatio < 1.0) { // portrait
    targetOffset.z *= 1.5; // pull back to fit more vertically
    targetOffset.y *= 1.2; 
  } else if (aspectRatio > 2.0) { // ultrawide
    targetOffset.z *= 0.8;
  }

  // Set camera position
  const desiredPos = lookTarget.clone().add(targetOffset);

  // Apply limits to prevent camera from clipping below the board (y=0 is the board)
  if (desiredPos.y < 1.0) {
    desiredPos.y = 1.0;
  }

  // NaN check fallback
  if (isNaN(desiredPos.x) || isNaN(desiredPos.y) || isNaN(desiredPos.z)) {
    desiredPos.set(0, 10, 10);
    lookTarget.set(0, 0, 0);
  }

  return {
    position: desiredPos,
    target: lookTarget,
  };
}

/**
 * Pure function to integrate camera physics/smoothing over delta time
 */
export function updateCameraState(
  currentPos: Vector3,
  currentTarget: Vector3,
  desiredPos: Vector3,
  desiredTarget: Vector3,
  delta: number
) {
  const t = MathUtils.clamp(delta * 4, 0, 1);
  
  currentTarget.lerp(desiredTarget, t);
  currentPos.lerp(desiredPos, t * 0.8);

  if (currentPos.y < 1.0) {
    currentPos.y = 1.0;
  }

  if (isNaN(currentPos.x) || isNaN(currentPos.y) || isNaN(currentPos.z)) {
    currentPos.set(0, 10, 10);
    currentTarget.set(0, 0, 0);
  }
}
