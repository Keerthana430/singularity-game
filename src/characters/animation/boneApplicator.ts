// Purpose: Apply a PoseVector to the Three.js bone groups from characterUtils.ts.
// Maps from pose field names to the actual Three.js Object3D references.

import * as THREE from 'three';
import { PoseVector } from './poseTypes';
import { solveHipsY, flatFootAngle } from './footSolver';

export interface BoneRefs {
  hips: THREE.Object3D;
  spine: THREE.Object3D;
  chest: THREE.Object3D;
  head: THREE.Object3D;
  lShoulder: THREE.Object3D;
  rShoulder: THREE.Object3D;
  lUpperArm: THREE.Object3D;
  rUpperArm: THREE.Object3D;
  lLowerArm: THREE.Object3D;
  rLowerArm: THREE.Object3D;
  lUpperLeg: THREE.Object3D;
  rUpperLeg: THREE.Object3D;
  lLowerLeg: THREE.Object3D;
  rLowerLeg: THREE.Object3D;
  lFoot?: THREE.Object3D;
  rFoot?: THREE.Object3D;
}

/**
 * Apply a PoseVector to the character's bone groups.
 * @param bones  Bone references from buildProceduralCharacter
 * @param pose   The pose to apply
 * @param gAmt   Ground blend weight (1 = grounded, 0 = airborne/lying)
 */
export function applyPoseToBones(
  bones: BoneRefs,
  pose: PoseVector,
  gAmt: number = 1.0
): void {
  // Solve hip height from legs (never hard-code hipsY)
  const solvedHipsY = solveHipsY(
    pose.lULx, pose.lLLx, pose.lULz,
    pose.rULx, pose.rLLx, pose.rULz,
    gAmt
  );

  // Apply hips
  bones.hips.position.y = solvedHipsY + (pose.hipsY - 0.905); // offset from solved base
  bones.hips.rotation.x = pose.hipsX;
  bones.hips.rotation.y = pose.hipsY_rot;
  bones.hips.rotation.z = pose.hipsZ;

  // Spine / Chest
  if (bones.spine) {
    bones.spine.rotation.x = pose.spineX;
  }
  bones.chest.rotation.x = pose.chestX;
  bones.chest.rotation.y = pose.chestY;
  bones.chest.rotation.z = pose.chestZ;

  // Head
  bones.head.rotation.x = pose.headX;
  bones.head.rotation.y = pose.headY;
  bones.head.rotation.z = pose.headZ;

  // Left arm
  if (bones.lShoulder) {
    bones.lShoulder.rotation.x = pose.lShX;
    bones.lShoulder.rotation.y = pose.lShY;
    bones.lShoulder.rotation.z = pose.lShZ;
  }
  bones.lUpperArm.rotation.x = pose.lUAx;
  bones.lUpperArm.rotation.y = pose.lUAy;
  bones.lUpperArm.rotation.z = pose.lUAz;
  bones.lLowerArm.rotation.x = pose.lLAx;

  // Right arm
  if (bones.rShoulder) {
    bones.rShoulder.rotation.x = pose.rShX;
    bones.rShoulder.rotation.y = pose.rShY;
    bones.rShoulder.rotation.z = pose.rShZ;
  }
  bones.rUpperArm.rotation.x = pose.rUAx;
  bones.rUpperArm.rotation.y = pose.rUAy;
  bones.rUpperArm.rotation.z = pose.rUAz;
  bones.rLowerArm.rotation.x = pose.rLAx;

  // Left leg
  bones.lUpperLeg.rotation.x = pose.lULx;
  bones.lUpperLeg.rotation.y = pose.lULy;
  bones.lUpperLeg.rotation.z = pose.lULz;
  bones.lLowerLeg.rotation.x = pose.lLLx;

  // Left foot (keep flat on floor)
  if (bones.lFoot) {
    bones.lFoot.rotation.x = pose.lFtX;
  }

  // Right leg
  bones.rUpperLeg.rotation.x = pose.rULx;
  bones.rUpperLeg.rotation.y = pose.rULy;
  bones.rUpperLeg.rotation.z = pose.rULz;
  bones.rLowerLeg.rotation.x = pose.rLLx;

  // Right foot
  if (bones.rFoot) {
    bones.rFoot.rotation.x = pose.rFtX;
  }
}
