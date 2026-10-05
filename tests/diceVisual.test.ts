import { describe, it, expect } from 'vitest';
import { Euler, Quaternion, Vector3 } from 'three';

// Simulation of the logic in Dice3D to ensure we correctly map 1-6 to the top face
function getDiceRotationForFace(result: number): Euler | null {
  // If face N is on +Y, what is the rotation required to put the original face N to +Y?
  // Let's assume standard faces: 1=Top(+Y), 2=Front(+Z), 3=Right(+X), 4=Left(-X), 5=Back(-Z), 6=Bottom(-Y)
  // To get face 2 (+Z) to +Y, we rotate -90 on X
  // To get face 3 (+X) to +Y, we rotate +90 on Z
  // To get face 4 (-X) to +Y, we rotate -90 on Z
  // To get face 5 (-Z) to +Y, we rotate +90 on X
  // To get face 6 (-Y) to +Y, we rotate 180 on X or Z
  const eulers: Record<number, Euler> = {
    1: new Euler(0, 0, 0),
    2: new Euler(-Math.PI / 2, 0, 0),
    3: new Euler(0, 0, Math.PI / 2),
    4: new Euler(0, 0, -Math.PI / 2),
    5: new Euler(Math.PI / 2, 0, 0),
    6: new Euler(Math.PI, 0, 0),
  };
  return eulers[result] || null;
}

/**
 * Gets the "up" face (the face pointing in +Y) for a given Euler rotation
 * of a standard box geometry.
 */
function getUpFace(euler: Euler): number {
  const upVector = new Vector3(0, 1, 0);
  const q = new Quaternion().setFromEuler(euler);
  
  // Standard face normals for a box
  const faces = [
    { face: 1, normal: new Vector3(0, 1, 0) },   // Top (+Y)
    { face: 2, normal: new Vector3(0, 0, 1) },   // Front (+Z)
    { face: 3, normal: new Vector3(1, 0, 0) },   // Right (+X)
    { face: 4, normal: new Vector3(-1, 0, 0) },  // Left (-X)
    { face: 5, normal: new Vector3(0, 0, -1) },  // Back (-Z)
    { face: 6, normal: new Vector3(0, -1, 0) },  // Bottom (-Y)
  ];

  let bestFace = 1;
  let maxDot = -Infinity;

  for (const { face, normal } of faces) {
    // Rotate the normal by the dice's rotation
    const rotatedNormal = normal.clone().applyQuaternion(q);
    
    // Check alignment with world UP
    const dot = rotatedNormal.dot(upVector);
    if (dot > maxDot) {
      maxDot = dot;
      bestFace = face;
    }
  }

  // Due to precision, if maxDot is close to 1, we found our top face
  if (maxDot > 0.99) {
    return bestFace;
  }
  return -1; // No face is perfectly up
}

describe('Dice3D Visual Logic Test', () => {
  it('forces the correct face up for results 1-6 exactly 1000/1000 times', () => {
    let successCount = 0;
    const TESTS = 1000;
    
    for (let i = 0; i < TESTS; i++) {
      // Pick random result 1-6
      const targetResult = Math.floor(Math.random() * 6) + 1;
      
      const forcedEuler = getDiceRotationForFace(targetResult);
      expect(forcedEuler).not.toBeNull();
      
      const upFace = getUpFace(forcedEuler!);
      
      if (upFace === targetResult) {
        successCount++;
      }
    }
    
    expect(successCount).toBe(TESTS);
  });
});
