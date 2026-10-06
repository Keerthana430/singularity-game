import * as THREE from 'three';

export interface CharacterRig {
  group: THREE.Group;
  bones: Record<string, THREE.Group | THREE.Bone>;
  materials: Record<string, THREE.Material>;
}

// Helper: high-poly rounded body parts
export function createRoundedBox(w: number, h: number, d: number, mat: THREE.Material) {
  // Use a high-resolution sphere and scale it to form a smooth organic shape
  const geom = new THREE.SphereGeometry(1, 64, 48);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.scale.set(w / 2, h / 2, d / 2);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Helper: Create seamless procedural SkinnedMesh for limbs
export function createSkinnedLimb(radius: number, upperLength: number, lowerLength: number, mat: THREE.Material) {
  const totalLength = upperLength + lowerLength;
  const geom = new THREE.CylinderGeometry(radius, radius, totalLength, 32, 32);
  geom.translate(0, -totalLength / 2, 0); // Origin at top

  const pos = geom.attributes.position;
  const skinIndices = [];
  const skinWeights = [];
  const jointY = -upperLength;
  const blendZone = radius * 3.0;

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    let wUpper = 0, wLower = 0;
    if (y > jointY + blendZone / 2) {
      wUpper = 1; wLower = 0;
    } else if (y < jointY - blendZone / 2) {
      wUpper = 0; wLower = 1;
    } else {
      const t = (jointY + blendZone / 2 - y) / blendZone;
      wLower = t;
      wUpper = 1 - t;
    }
    skinIndices.push(0, 1, 0, 0);
    skinWeights.push(wUpper, wLower, 0, 0);
  }

  geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  const upperBone = new THREE.Bone();
  const lowerBone = new THREE.Bone();
  lowerBone.position.y = -upperLength;
  upperBone.add(lowerBone);

  const mesh = new THREE.SkinnedMesh(geom, mat);
  const skeleton = new THREE.Skeleton([upperBone, lowerBone]);
  mesh.add(upperBone);
  mesh.bind(skeleton);
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, upperBone, lowerBone };
}

export function buildProceduralCharacter(
  colorBody: number = 0x1a1f3d,
  colorAccent: number = 0x22d3ee,
  colorDark: number = 0x0e1225
): CharacterRig {
  const group = new THREE.Group();
  const bones: Record<string, THREE.Group | THREE.Bone> = {};

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorBody, roughness: 0.55, metalness: 0.3,
    emissive: 0x0a0e28, emissiveIntensity: 0.3
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: colorAccent, roughness: 0.3, metalness: 0.6,
    emissive: colorAccent, emissiveIntensity: 0.5
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: colorDark, roughness: 0.7, metalness: 0.2
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: colorAccent });
  const visorMat = new THREE.MeshBasicMaterial({
    color: colorAccent, transparent: true, opacity: 0.7
  });

  const armMat = new THREE.MeshStandardMaterial({
    color: 0xff3366, roughness: 0.5, metalness: 0.2
  });

  const materials = { bodyMat, accentMat, darkMat, eyeMat, visorMat, armMat };

  // Root
  bones.root = new THREE.Group();
  bones.root.name = 'root';
  group.add(bones.root);

  // Hips
  bones.hips = new THREE.Group();
  bones.hips.name = 'hips';
  bones.hips.position.y = 0.95;
  bones.root.add(bones.hips);

  const hipsMesh = createRoundedBox(0.44, 0.26, 0.37, darkMat); // 0.22*2 = 0.44
  bones.hips.add(hipsMesh);

  // Spine
  bones.spine = new THREE.Group();
  bones.spine.name = 'spine';
  bones.spine.position.y = 0.12;
  bones.hips.add(bones.spine);

  // Chest
  bones.chest = new THREE.Group();
  bones.chest.name = 'chest';
  bones.chest.position.y = 0.28;
  bones.spine.add(bones.chest);

  const chestMesh = createRoundedBox(0.52 * 1.2, 0.52 * 1.1, 0.52 * 0.85, bodyMat); // 0.26*2 = 0.52
  chestMesh.position.y = 0.08;
  bones.chest.add(chestMesh);

  const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.29), accentMat);
  chestStripe.position.y = 0.1;
  chestStripe.castShadow = true;
  bones.chest.add(chestStripe);

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

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.18), visorMat);
  visor.position.set(0, 0.02, 0.06);
  bones.head.add(visor);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeMat);
  eyeL.position.set(-0.06, 0.02, 0.16);
  bones.head.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 16), eyeMat);
  eyeR.position.set(0.06, 0.02, 0.16);
  bones.head.add(eyeR);

  // Left Arm
  bones.lShoulder = new THREE.Group();
  bones.lShoulder.name = 'lShoulder';
  bones.lShoulder.position.set(-0.38, 0.22, 0);
  bones.chest.add(bones.lShoulder);
  
  const lShoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 24), accentMat);
  lShoulderPad.castShadow = true;
  bones.lShoulder.add(lShoulderPad);

  const lArmObj = createSkinnedLimb(0.055, 0.28, 0.26, armMat);
  bones.lUpperArm = lArmObj.upperBone;
  bones.lUpperArm.name = 'lUpperArm';
  bones.lUpperArm.position.y = -0.04;
  bones.lShoulder.add(bones.lUpperArm);
  bones.lShoulder.add(lArmObj.mesh);

  bones.lLowerArm = lArmObj.lowerBone;
  bones.lLowerArm.name = 'lLowerArm';

  bones.lHand = new THREE.Group();
  bones.lHand.name = 'lHand';
  bones.lHand.position.y = -0.26;
  bones.lLowerArm.add(bones.lHand);

  const lHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 32, 24), accentMat);
  lHandMesh.castShadow = true;
  bones.lHand.add(lHandMesh);

  // Right Arm
  bones.rShoulder = new THREE.Group();
  bones.rShoulder.name = 'rShoulder';
  bones.rShoulder.position.set(0.38, 0.22, 0);
  bones.chest.add(bones.rShoulder);

  const rShoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 24), accentMat);
  rShoulderPad.castShadow = true;
  bones.rShoulder.add(rShoulderPad);

  const rArmObj = createSkinnedLimb(0.055, 0.28, 0.26, armMat);
  bones.rUpperArm = rArmObj.upperBone;
  bones.rUpperArm.name = 'rUpperArm';
  bones.rUpperArm.position.y = -0.04;
  bones.rShoulder.add(bones.rUpperArm);
  bones.rShoulder.add(rArmObj.mesh);

  bones.rLowerArm = rArmObj.lowerBone;
  bones.rLowerArm.name = 'rLowerArm';

  bones.rHand = new THREE.Group();
  bones.rHand.name = 'rHand';
  bones.rHand.position.y = -0.26;
  bones.rLowerArm.add(bones.rHand);

  const rHandMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 32, 24), accentMat);
  rHandMesh.castShadow = true;
  bones.rHand.add(rHandMesh);

  // Left Leg
  bones.lLegJoint = new THREE.Group();
  bones.lLegJoint.name = 'lLegJoint';
  bones.lLegJoint.position.set(-0.12, -0.08, 0);
  bones.hips.add(bones.lLegJoint);

  const lLegObj = createSkinnedLimb(0.065, 0.40, 0.38, bodyMat);
  bones.lUpperLeg = lLegObj.upperBone;
  bones.lUpperLeg.name = 'lUpperLeg';
  bones.lUpperLeg.position.set(0, 0, 0);
  bones.lLegJoint.add(bones.lUpperLeg);
  bones.lLegJoint.add(lLegObj.mesh);

  bones.lLowerLeg = lLegObj.lowerBone;
  bones.lLowerLeg.name = 'lLowerLeg';

  bones.lFoot = new THREE.Group();
  bones.lFoot.name = 'lFoot';
  bones.lFoot.position.y = -0.38;
  bones.lLowerLeg.add(bones.lFoot);

  const lFootMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), accentMat);
  lFootMesh.scale.set(0.8, 0.5, 1.4);
  lFootMesh.position.set(0, -0.02, 0.03);
  lFootMesh.castShadow = true;
  bones.lFoot.add(lFootMesh);

  // Right Leg
  bones.rLegJoint = new THREE.Group();
  bones.rLegJoint.name = 'rLegJoint';
  bones.rLegJoint.position.set(0.12, -0.08, 0);
  bones.hips.add(bones.rLegJoint);

  const rLegObj = createSkinnedLimb(0.065, 0.40, 0.38, bodyMat);
  bones.rUpperLeg = rLegObj.upperBone;
  bones.rUpperLeg.name = 'rUpperLeg';
  bones.rUpperLeg.position.set(0, 0, 0);
  bones.rLegJoint.add(bones.rUpperLeg);
  bones.rLegJoint.add(rLegObj.mesh);

  bones.rLowerLeg = rLegObj.lowerBone;
  bones.rLowerLeg.name = 'rLowerLeg';

  bones.rFoot = new THREE.Group();
  bones.rFoot.name = 'rFoot';
  bones.rFoot.position.y = -0.38;
  bones.rLowerLeg.add(bones.rFoot);

  const rFootMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 32, 24), accentMat);
  rFootMesh.scale.set(0.8, 0.5, 1.4);
  rFootMesh.position.set(0, -0.02, 0.03);
  rFootMesh.castShadow = true;
  bones.rFoot.add(rFootMesh);

  return { group, bones, materials };
}
