import * as THREE from 'three';

export interface CharacterRig {
  group: THREE.Group;
  bones: Record<string, THREE.Group | THREE.Bone>;
  materials: Record<string, THREE.Material>;
}

// Helper: high-poly rounded body parts
export function createRoundedBox(w: number, h: number, d: number, mat: THREE.Material) {
  // Use a BoxGeometry instead of a Sphere so we can clearly see the character twisting
  const geom = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Helper: Create segmented limb (replaces SkinnedMesh for action-figure look)
export function createSegmentedLimb(radius: number, upperLength: number, lowerLength: number, bodyMat: THREE.Material, glowMat: THREE.Material) {
  const upperBone = new THREE.Group();
  const lowerBone = new THREE.Group();
  lowerBone.position.y = -upperLength;
  upperBone.add(lowerBone);

  // Joint glowing spheres
  const shoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.2, 16, 16), glowMat);
  const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.1, 16, 16), glowMat);
  elbowMesh.position.set(0, 0, 0); // elbow sits at the start of lowerBone
  lowerBone.add(elbowMesh);

  // Limb cylinders (or capsules)
  const upperGeom = new THREE.CylinderGeometry(radius, radius * 0.9, upperLength, 16);
  upperGeom.translate(0, -upperLength / 2, 0);
  const upperMesh = new THREE.Mesh(upperGeom, bodyMat);
  upperBone.add(upperMesh);

  const lowerGeom = new THREE.CylinderGeometry(radius * 0.9, radius * 0.7, lowerLength, 16);
  lowerGeom.translate(0, -lowerLength / 2, 0);
  const lowerMesh = new THREE.Mesh(lowerGeom, bodyMat);
  lowerBone.add(lowerMesh);

  // Setup shadows
  [shoulderMesh, elbowMesh, upperMesh, lowerMesh].forEach(m => {
    m.castShadow = true;
    m.receiveShadow = true;
  });

  return { upperBone, lowerBone, shoulderMesh };
}

export function buildProceduralCharacter(
  colorBody: number = 0xb0b5b9, // Real Steel Silver/Grey
  colorAccent: number = 0x00e5ff, // Bright Cyan Glow (Atom's mesh)
  colorDark: number = 0x2b1c4a // Deep Purple/Blue for contrasting parts (Noisy Boy vibes)
): CharacterRig {
  const group = new THREE.Group();
  const bones: Record<string, THREE.Group | THREE.Bone> = {};

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorBody, 
    roughness: 0.2, // Shiny metallic finish
    metalness: 0.85, // Highly metallic robot chassis
    emissive: 0x111111,
    emissiveIntensity: 0.2 // Subtle base glow
  });
  
  // High emissive intensity triggers post-processing bloom
  const glowMat = new THREE.MeshStandardMaterial({
    color: colorAccent, roughness: 0.2, metalness: 0.1,
    emissive: colorAccent, emissiveIntensity: 2.5
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: colorDark, roughness: 0.7, metalness: 0.2
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x050505, roughness: 0.1, metalness: 0.8 // Dark shiny visor
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: colorAccent, roughness: 0.2, metalness: 0.1,
    emissive: colorAccent, emissiveIntensity: 2.0 // Glowing eyes
  });

  const materials = { bodyMat, glowMat, darkMat, visorMat, eyeMat };

  // Root
  bones.root = new THREE.Group();
  bones.root.name = 'root';
  group.add(bones.root);

  // Hips
  bones.hips = new THREE.Group();
  bones.hips.name = 'hips';
  bones.hips.position.y = 0.95;
  bones.root.add(bones.hips);

  // Pill shape for pelvis
  const hipsMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.15, 16, 32), bodyMat);
  hipsMesh.rotation.z = Math.PI / 2; // Horizontal pill
  hipsMesh.castShadow = true;
  bones.hips.add(hipsMesh);

  // Spine
  bones.spine = new THREE.Group();
  bones.spine.name = 'spine';
  bones.spine.position.y = 0.12;
  bones.hips.add(bones.spine);

  // Chest
  bones.chest = new THREE.Group();
  bones.chest.name = 'chest';
  bones.chest.position.y = 0.25;
  bones.spine.add(bones.chest);

  // Large pill shape for chest
  const chestMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.3, 16, 32), bodyMat);
  chestMesh.position.y = 0.15;
  chestMesh.castShadow = true;
  bones.chest.add(chestMesh);

  // Neck
  bones.neck = new THREE.Group();
  bones.neck.name = 'neck';
  bones.neck.position.y = 0.3;
  bones.chest.add(bones.neck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 32), bodyMat);
  neckMesh.castShadow = true;
  bones.neck.add(neckMesh);

  // Head
  bones.head = new THREE.Group();
  bones.head.name = 'head';
  bones.head.position.y = 0.12;
  bones.neck.add(bones.head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 64, 48), bodyMat);
  headMesh.scale.set(1, 1.15, 1);
  headMesh.castShadow = true;
  bones.head.add(headMesh);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeMat);
  eyeL.position.set(-0.06, 0.02, 0.16);
  bones.head.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeMat);
  eyeR.position.set(0.06, 0.02, 0.16);
  bones.head.add(eyeR);

  // Left Arm
  bones.lShoulder = new THREE.Group();
  bones.lShoulder.name = 'lShoulder';
  bones.lShoulder.position.set(-0.28, 0.22, 0); // Connected to chest sides
  bones.chest.add(bones.lShoulder);

  const lArmObj = createSegmentedLimb(0.06, 0.28, 0.26, bodyMat, glowMat);
  bones.lUpperArm = lArmObj.upperBone;
  bones.lUpperArm.name = 'lUpperArm';
  bones.lShoulder.add(bones.lUpperArm);
  bones.lShoulder.add(lArmObj.shoulderMesh);
  
  bones.lLowerArm = lArmObj.lowerBone;
  bones.lLowerArm.name = 'lLowerArm';

  bones.lHand = new THREE.Group();
  bones.lHand.name = 'lHand';
  bones.lHand.position.y = -0.26;
  bones.lLowerArm.add(bones.lHand);

  // Glowing sphere hands
  const lHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), glowMat);
  lHandMesh.castShadow = true;
  bones.lHand.add(lHandMesh);

  // Right Arm
  bones.rShoulder = new THREE.Group();
  bones.rShoulder.name = 'rShoulder';
  bones.rShoulder.position.set(0.28, 0.22, 0);
  bones.chest.add(bones.rShoulder);

  const rArmObj = createSegmentedLimb(0.06, 0.28, 0.26, bodyMat, glowMat);
  bones.rUpperArm = rArmObj.upperBone;
  bones.rUpperArm.name = 'rUpperArm';
  bones.rShoulder.add(bones.rUpperArm);
  bones.rShoulder.add(rArmObj.shoulderMesh);
  
  bones.rLowerArm = rArmObj.lowerBone;
  bones.rLowerArm.name = 'rLowerArm';

  bones.rHand = new THREE.Group();
  bones.rHand.name = 'rHand';
  bones.rHand.position.y = -0.26;
  bones.rLowerArm.add(bones.rHand);

  const rHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), glowMat);
  rHandMesh.castShadow = true;
  bones.rHand.add(rHandMesh);

  // Shoe creation helper
  const createShoe = () => {
    const shoe = new THREE.Group();
    // Main shoe body (Dark Blue)
    const shoeBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), bodyMat);
    shoeBody.position.set(0, -0.02, 0.04);
    shoeBody.castShadow = true;
    shoe.add(shoeBody);

    // Glowing Sole
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.26), glowMat);
    sole.position.set(0, -0.08, 0.04);
    sole.castShadow = true;
    shoe.add(sole);

    // Side Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.08, 0.04), glowMat);
    stripe.position.set(0, -0.02, 0.1);
    stripe.castShadow = true;
    shoe.add(stripe);

    return shoe;
  };

  // Left Leg
  bones.lLegJoint = new THREE.Group();
  bones.lLegJoint.name = 'lLegJoint';
  bones.lLegJoint.position.set(-0.14, -0.05, 0); // Connect to hips
  bones.hips.add(bones.lLegJoint);

  const lLegObj = createSegmentedLimb(0.07, 0.40, 0.38, bodyMat, glowMat);
  bones.lUpperLeg = lLegObj.upperBone;
  bones.lUpperLeg.name = 'lUpperLeg';
  bones.lLegJoint.add(bones.lUpperLeg);
  // No hip glowing joint sphere according to reference image, it just attaches to the dark blue pelvis directly

  bones.lLowerLeg = lLegObj.lowerBone;
  bones.lLowerLeg.name = 'lLowerLeg';

  bones.lFoot = new THREE.Group();
  bones.lFoot.name = 'lFoot';
  bones.lFoot.position.y = -0.38;
  bones.lLowerLeg.add(bones.lFoot);
  bones.lFoot.add(createShoe());

  // Glowing Ankles
  const lAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), glowMat);
  lAnkle.position.y = -0.38;
  bones.lLowerLeg.add(lAnkle);

  // Right Leg
  bones.rLegJoint = new THREE.Group();
  bones.rLegJoint.name = 'rLegJoint';
  bones.rLegJoint.position.set(0.14, -0.05, 0);
  bones.hips.add(bones.rLegJoint);

  const rLegObj = createSegmentedLimb(0.07, 0.40, 0.38, bodyMat, glowMat);
  bones.rUpperLeg = rLegObj.upperBone;
  bones.rUpperLeg.name = 'rUpperLeg';
  bones.rLegJoint.add(bones.rUpperLeg);

  bones.rLowerLeg = rLegObj.lowerBone;
  bones.rLowerLeg.name = 'rLowerLeg';

  bones.rFoot = new THREE.Group();
  bones.rFoot.name = 'rFoot';
  bones.rFoot.position.y = -0.38;
  bones.rLowerLeg.add(bones.rFoot);
  bones.rFoot.add(createShoe());

  // Glowing Ankles
  const rAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), glowMat);
  rAnkle.position.y = -0.38;
  bones.rLowerLeg.add(rAnkle);

  return { group, bones, materials };
}
