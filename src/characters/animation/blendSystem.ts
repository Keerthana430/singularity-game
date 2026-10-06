// Purpose: Cross-fade blend system for transitioning between poses.
// On state switch: copy the currently-displayed pose to prev, interpolate to new target.
// This removes all pops/snaps between states.

import { PoseVector, lerpPose } from './poseTypes';
import { AnimState, getBlendTime } from './stateTable';
import { easeIO } from './poseSampler';

export interface BlendState {
  fromPose: PoseVector;
  toPose: PoseVector;
  fromState: AnimState;
  toState: AnimState;
  elapsed: number;        // seconds since transition started
  duration: number;       // total blend duration
  complete: boolean;
}

/**
 * Start a new blend from the currently displayed pose to a new target.
 * @param current The currently displayed pose (captured at the moment of transition)
 * @param target The new target pose
 * @param from The state we're transitioning from
 * @param to The state we're transitioning to
 */
export function startBlend(
  current: PoseVector,
  target: PoseVector,
  from: AnimState,
  to: AnimState
): BlendState {
  return {
    fromPose: { ...current },
    toPose: { ...target },
    fromState: from,
    toState: to,
    elapsed: 0,
    duration: getBlendTime(from, to),
    complete: false,
  };
}

/**
 * Advance the blend by dt seconds and return the current interpolated pose.
 */
export function advanceBlend(blend: BlendState, dt: number): PoseVector {
  blend.elapsed += dt;
  if (blend.elapsed >= blend.duration) {
    blend.complete = true;
    return { ...blend.toPose };
  }
  const rawT = blend.elapsed / blend.duration;
  const t = easeIO(rawT);
  return lerpPose(blend.fromPose, blend.toPose, t);
}

/**
 * Update a blend's target pose while in progress (for live-driven poses like locomotion).
 * The from pose stays locked at transition start to avoid discontinuities.
 */
export function updateBlendTarget(blend: BlendState, newTarget: PoseVector): void {
  blend.toPose = { ...newTarget };
}
