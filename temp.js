
(function() {
  'use strict';

  // ─── RENDERER ───────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  // ─── SCENE ──────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050816);
  scene.fog = new THREE.FogExp2(0x050816, 0.008);

  // ─── CAMERA (Third-Person Follow) ──────────────────────────
  const cam = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
  cam.position.set(0, 3.5, 6);

  // OrbitControls for manual override (middle-drag orbit, scroll zoom)
  const ctl = new THREE.OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true;
  ctl.dampingFactor = 0.08;
  ctl.target.set(0, 1.2, 0);
  ctl.minDistance = 2;
  ctl.maxDistance = 20;
  ctl.maxPolarAngle = Math.PI * 0.48;
  ctl.enablePan = false;
  ctl.mouseButtons = {
    LEFT: null,                 // Free left-click for light attacks
    MIDDLE: THREE.MOUSE.ROTATE, // Camera orbit on middle mouse
    RIGHT: null                 // Free right-click for heavy attacks
  };
  // Prevent right-click context menu
  renderer.domElement.addEventListener('contextmenu', function(e) { e.preventDefault(); });

  // Third-person follow cam config
  const CAM_FOLLOW = {
    offset: new THREE.Vector3(0, 2.8, 5.5),   // behind and above
    lookOffset: new THREE.Vector3(0, 1.3, 0),  // look at chest height
    smoothPos: 0.06,  // position lerp factor
    smoothLook: 0.08  // look-at lerp factor
  };

  // ─── LIGHTING ───────────────────────────────────────────────
  // Hemisphere: sky + ground bounce
  scene.add(new THREE.HemisphereLight(0x4466aa, 0x112233, 0.35));

  // Main directional (moonlight)
  const dirLight = new THREE.DirectionalLight(0x8899cc, 0.9);
  dirLight.position.set(-5, 12, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 30;
  dirLight.shadow.camera.left = -6;
  dirLight.shadow.camera.right = 6;
  dirLight.shadow.camera.top = 6;
  dirLight.shadow.camera.bottom = -2;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  // Cyan rim light (right side)
  const cyanLight = new THREE.PointLight(0x22d3ee, 1.2, 18);
  cyanLight.position.set(3, 2, -2);
  scene.add(cyanLight);

  // Magenta rim light (left side)
  const magLight = new THREE.PointLight(0xff4fa3, 0.9, 18);
  magLight.position.set(-3, 2.5, -1);
  scene.add(magLight);

  // Warm top accent
  const topLight = new THREE.PointLight(0xfbbf24, 0.3, 12);
  topLight.position.set(0, 5, 0);
  scene.add(topLight);

  // ─── ARENA FLOOR ────────────────────────────────────────────
  // Main platform (expanded for walking space)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0c1228, roughness: 0.85, metalness: 0.15
  });
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 0.15, 64), floorMat);
  floor.position.y = -0.075;
  floor.receiveShadow = true;
  scene.add(floor);

  // Glowing edge ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(25, 0.06, 8, 128), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);

  // Inner ring (magenta)
  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(18, 0.04, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.01;
  scene.add(innerRing);

  // Floor glow circle
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(24, 48), glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  scene.add(glow);

  // Grid lines on the floor
  (function() {
    const gridHelper = new THREE.GridHelper(50, 50, 0x1a2855, 0x111a33);
    gridHelper.position.y = 0.01;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);
  })();

  // ─── OPPONENT CHARACTER ──────────────────────────────────────
  // Built with the same bone hierarchy as the player but different colors.
  const enemyBodyMat = new THREE.MeshStandardMaterial({ color: 0x3d1a1a, roughness: 0.55, metalness: 0.3, emissive: 0x280a0a, emissiveIntensity: 0.3 });
  const enemyAccentMat = new THREE.MeshStandardMaterial({ color: 0xff4fa3, roughness: 0.3, metalness: 0.6, emissive: 0xff4fa3, emissiveIntensity: 0.5 });
  const enemyDarkMat = new THREE.MeshStandardMaterial({ color: 0x25100e, roughness: 0.7, metalness: 0.2 });
  const enemyEyeMat = new THREE.MeshBasicMaterial({ color: 0xff4fa3 });
  const enemyVisorMat = new THREE.MeshBasicMaterial({ color: 0xff4fa3, transparent: true, opacity: 0.7 });

  function buildCharacter(mat, accent, dark, eyeM, visorM) {
    const group = new THREE.Group();
    const bones = {};
    bones.root = new THREE.Group(); bones.root.name = 'root'; group.add(bones.root);
    bones.hips = new THREE.Group(); bones.hips.name = 'hips'; bones.hips.position.y = 0.95; bones.root.add(bones.hips);
    bones.hips.add(roundedBox(0.42, 0.18, 0.25, 0.04, dark));
    bones.spine = new THREE.Group(); bones.spine.name = 'spine'; bones.spine.position.y = 0.12; bones.hips.add(bones.spine);
    bones.chest = new THREE.Group(); bones.chest.name = 'chest'; bones.chest.position.y = 0.28; bones.spine.add(bones.chest);
    const cm = roundedBox(0.48, 0.42, 0.28, 0.05, mat); cm.position.y = 0.05; bones.chest.add(cm);
    const cs = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.29), accent); cs.position.y = 0.1; bones.chest.add(cs);
    bones.neck = new THREE.Group(); bones.neck.name = 'neck'; bones.neck.position.y = 0.3; bones.chest.add(bones.neck);
    bones.neck.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8), mat));
    bones.head = new THREE.Group(); bones.head.name = 'head'; bones.head.position.y = 0.12; bones.neck.add(bones.head);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat); hm.scale.set(1, 1.15, 1); bones.head.add(hm);
    const vg = new THREE.BoxGeometry(0.28, 0.04, 0.18); bones.head.add(new THREE.Mesh(vg, visorM).translateX(0).translateY(0.02).translateZ(0.06));
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeM); eL.position.set(-0.06, 0.02, 0.16); bones.head.add(eL);
    const eR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeM); eR.position.set(0.06, 0.02, 0.16); bones.head.add(eR);
    // Arms
    bones.lShoulder = new THREE.Group(); bones.lShoulder.position.set(-0.3, 0.22, 0); bones.chest.add(bones.lShoulder);
    bones.lShoulder.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), accent));
    bones.lUpperArm = new THREE.Group(); bones.lUpperArm.position.y = -0.04; bones.lShoulder.add(bones.lUpperArm);
    const lua = capsule(0.055, 0.28, mat); lua.position.y = -0.12; bones.lUpperArm.add(lua);
    bones.lLowerArm = new THREE.Group(); bones.lLowerArm.position.y = -0.28; bones.lUpperArm.add(bones.lLowerArm);
    const lla = capsule(0.048, 0.26, dark); lla.position.y = -0.11; bones.lLowerArm.add(lla);
    bones.lHand = new THREE.Group(); bones.lHand.position.y = -0.26; bones.lLowerArm.add(bones.lHand);
    bones.lHand.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), accent));
    bones.rShoulder = new THREE.Group(); bones.rShoulder.position.set(0.3, 0.22, 0); bones.chest.add(bones.rShoulder);
    bones.rShoulder.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), accent));
    bones.rUpperArm = new THREE.Group(); bones.rUpperArm.position.y = -0.04; bones.rShoulder.add(bones.rUpperArm);
    const rua = capsule(0.055, 0.28, mat); rua.position.y = -0.12; bones.rUpperArm.add(rua);
    bones.rLowerArm = new THREE.Group(); bones.rLowerArm.position.y = -0.28; bones.rUpperArm.add(bones.rLowerArm);
    const rla = capsule(0.048, 0.26, dark); rla.position.y = -0.11; bones.rLowerArm.add(rla);
    bones.rHand = new THREE.Group(); bones.rHand.position.y = -0.26; bones.rLowerArm.add(bones.rHand);
    bones.rHand.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.05), accent));
    // Legs
    bones.lUpperLeg = new THREE.Group(); bones.lUpperLeg.position.set(-0.12, -0.08, 0); bones.hips.add(bones.lUpperLeg);
    const lul = capsule(0.065, 0.38, mat); lul.position.y = -0.18; bones.lUpperLeg.add(lul);
    bones.lLowerLeg = new THREE.Group(); bones.lLowerLeg.position.y = -0.4; bones.lUpperLeg.add(bones.lLowerLeg);
    const lll = capsule(0.055, 0.36, dark); lll.position.y = -0.16; bones.lLowerLeg.add(lll);
    bones.lFoot = new THREE.Group(); bones.lFoot.position.y = -0.38; bones.lLowerLeg.add(bones.lFoot);
    const lf = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), accent); lf.position.set(0, -0.02, 0.03); bones.lFoot.add(lf);
    bones.rUpperLeg = new THREE.Group(); bones.rUpperLeg.position.set(0.12, -0.08, 0); bones.hips.add(bones.rUpperLeg);
    const rul = capsule(0.065, 0.38, mat); rul.position.y = -0.18; bones.rUpperLeg.add(rul);
    bones.rLowerLeg = new THREE.Group(); bones.rLowerLeg.position.y = -0.4; bones.rUpperLeg.add(bones.rLowerLeg);
    const rll = capsule(0.055, 0.36, dark); rll.position.y = -0.16; bones.rLowerLeg.add(rll);
    bones.rFoot = new THREE.Group(); bones.rFoot.position.y = -0.38; bones.rLowerLeg.add(bones.rFoot);
    const rf = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), accent); rf.position.set(0, -0.02, 0.03); bones.rFoot.add(rf);
    group.traverse(function(c) { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return { group, bones };
  }

  const enemy = buildCharacter(enemyBodyMat, enemyAccentMat, enemyDarkMat, enemyEyeMat, enemyVisorMat);
  const enemyGroup = enemy.group;
  const eb = enemy.bones; // shorthand for enemy bones
  enemyGroup.position.set(0, 0, -3);
  enemyGroup.rotation.y = Math.PI; // Face the player
  scene.add(enemyGroup);

  // Enemy animation base positions
  const enemyBaseHipsY = eb.hips.position.y;

  // ─── PROCEDURAL CHARACTER ───────────────────────────────────
  // All body parts are built from primitives and attached to a bone hierarchy.
  // This gives us full programmatic control for animation.

  const charGroup = new THREE.Group();
  charGroup.position.y = 0;
  scene.add(charGroup);

  // Material palette
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1f3d, roughness: 0.55, metalness: 0.3,
    emissive: 0x0a0e28, emissiveIntensity: 0.3
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee, roughness: 0.3, metalness: 0.6,
    emissive: 0x22d3ee, emissiveIntensity: 0.5
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0e1225, roughness: 0.7, metalness: 0.2
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const visorMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee, transparent: true, opacity: 0.7
  });

  // Helper: create a capsule-like shape (cylinder + 2 spheres)
  function capsule(radius, height, mat) {
    const g = new THREE.Group();
    const cylH = Math.max(0, height - radius * 2);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, cylH, 12), mat);
    g.add(cyl);
    const topSph = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), mat);
    topSph.position.y = cylH / 2;
    g.add(topSph);
    const botSph = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), mat);
    botSph.position.y = -cylH / 2;
    g.add(botSph);
    return g;
  }

  // Helper: rounded box
  function roundedBox(w, h, d, r, mat) {
    // Use a regular box with beveled edges simulated by scaling
    const geom = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
    return new THREE.Mesh(geom, mat);
  }

  // ── BONE HIERARCHY ──
  // We use Three.js Groups as "bones" for easy hierarchical animation

  // Root (invisible, at foot level)
  const rootBone = new THREE.Group();
  rootBone.name = 'root';
  charGroup.add(rootBone);

  // Hips
  const hipsBone = new THREE.Group();
  hipsBone.name = 'hips';
  hipsBone.position.y = 0.95;
  rootBone.add(hipsBone);

  const hipsMesh = roundedBox(0.42, 0.18, 0.25, 0.04, darkMat);
  hipsBone.add(hipsMesh);

  // Spine
  const spineBone = new THREE.Group();
  spineBone.name = 'spine';
  spineBone.position.y = 0.12;
  hipsBone.add(spineBone);

  // Chest
  const chestBone = new THREE.Group();
  chestBone.name = 'chest';
  chestBone.position.y = 0.28;
  spineBone.add(chestBone);

  const chestMesh = roundedBox(0.48, 0.42, 0.28, 0.05, bodyMat);
  chestMesh.position.y = 0.05;
  chestBone.add(chestMesh);

  // Accent stripe on chest
  const chestStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.02, 0.29),
    accentMat
  );
  chestStripe.position.y = 0.1;
  chestBone.add(chestStripe);

  // Neck
  const neckBone = new THREE.Group();
  neckBone.name = 'neck';
  neckBone.position.y = 0.3;
  chestBone.add(neckBone);

  const neckMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8),
    bodyMat
  );
  neckBone.add(neckMesh);

  // Head
  const headBone = new THREE.Group();
  headBone.name = 'head';
  headBone.position.y = 0.12;
  neckBone.add(headBone);

  // Head shape: slightly elongated sphere
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 12),
    bodyMat
  );
  headMesh.scale.set(1, 1.15, 1);
  headBone.add(headMesh);

  // Visor / eye band
  const visorGeom = new THREE.BoxGeometry(0.28, 0.04, 0.18);
  const visor = new THREE.Mesh(visorGeom, visorMat);
  visor.position.set(0, 0.02, 0.06);
  headBone.add(visor);

  // Eyes (two glowing dots)
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat);
  eyeL.position.set(-0.06, 0.02, 0.16);
  headBone.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat);
  eyeR.position.set(0.06, 0.02, 0.16);
  headBone.add(eyeR);

  // ── ARMS ──

  // Left Shoulder
  const lShoulderBone = new THREE.Group();
  lShoulderBone.name = 'lShoulder';
  lShoulderBone.position.set(-0.3, 0.22, 0);
  chestBone.add(lShoulderBone);

  // Shoulder pad
  const lShoulderPad = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    accentMat
  );
  lShoulderBone.add(lShoulderPad);

  // Left Upper Arm
  const lUpperArmBone = new THREE.Group();
  lUpperArmBone.name = 'lUpperArm';
  lUpperArmBone.position.y = -0.04;
  lShoulderBone.add(lUpperArmBone);

  const lUpperArm = capsule(0.055, 0.28, bodyMat);
  lUpperArm.position.y = -0.12;
  lUpperArmBone.add(lUpperArm);

  // Left Elbow / Lower Arm
  const lLowerArmBone = new THREE.Group();
  lLowerArmBone.name = 'lLowerArm';
  lLowerArmBone.position.y = -0.28;
  lUpperArmBone.add(lLowerArmBone);

  const lLowerArm = capsule(0.048, 0.26, darkMat);
  lLowerArm.position.y = -0.11;
  lLowerArmBone.add(lLowerArm);

  // Left Hand
  const lHandBone = new THREE.Group();
  lHandBone.name = 'lHand';
  lHandBone.position.y = -0.26;
  lLowerArmBone.add(lHandBone);

  const lHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 0.05),
    accentMat
  );
  lHandBone.add(lHand);

  // Right Shoulder
  const rShoulderBone = new THREE.Group();
  rShoulderBone.name = 'rShoulder';
  rShoulderBone.position.set(0.3, 0.22, 0);
  chestBone.add(rShoulderBone);

  const rShoulderPad = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 6),
    accentMat
  );
  rShoulderBone.add(rShoulderPad);

  // Right Upper Arm
  const rUpperArmBone = new THREE.Group();
  rUpperArmBone.name = 'rUpperArm';
  rUpperArmBone.position.y = -0.04;
  rShoulderBone.add(rUpperArmBone);

  const rUpperArm = capsule(0.055, 0.28, bodyMat);
  rUpperArm.position.y = -0.12;
  rUpperArmBone.add(rUpperArm);

  // Right Lower Arm
  const rLowerArmBone = new THREE.Group();
  rLowerArmBone.name = 'rLowerArm';
  rLowerArmBone.position.y = -0.28;
  rUpperArmBone.add(rLowerArmBone);

  const rLowerArm = capsule(0.048, 0.26, darkMat);
  rLowerArm.position.y = -0.11;
  rLowerArmBone.add(rLowerArm);

  // Right Hand
  const rHandBone = new THREE.Group();
  rHandBone.name = 'rHand';
  rHandBone.position.y = -0.26;
  rLowerArmBone.add(rHandBone);

  const rHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.08, 0.05),
    accentMat
  );
  rHandBone.add(rHand);

  // ── LEGS ──

  // Left Upper Leg
  const lUpperLegBone = new THREE.Group();
  lUpperLegBone.name = 'lUpperLeg';
  lUpperLegBone.position.set(-0.12, -0.08, 0);
  hipsBone.add(lUpperLegBone);

  const lUpperLeg = capsule(0.065, 0.38, bodyMat);
  lUpperLeg.position.y = -0.18;
  lUpperLegBone.add(lUpperLeg);

  // Left Lower Leg
  const lLowerLegBone = new THREE.Group();
  lLowerLegBone.name = 'lLowerLeg';
  lLowerLegBone.position.y = -0.4;
  lUpperLegBone.add(lLowerLegBone);

  const lLowerLeg = capsule(0.055, 0.36, darkMat);
  lLowerLeg.position.y = -0.16;
  lLowerLegBone.add(lLowerLeg);

  // Left Foot
  const lFootBone = new THREE.Group();
  lFootBone.name = 'lFoot';
  lFootBone.position.y = -0.38;
  lLowerLegBone.add(lFootBone);

  const lFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.05, 0.16),
    accentMat
  );
  lFoot.position.set(0, -0.02, 0.03);
  lFootBone.add(lFoot);

  // Right Upper Leg
  const rUpperLegBone = new THREE.Group();
  rUpperLegBone.name = 'rUpperLeg';
  rUpperLegBone.position.set(0.12, -0.08, 0);
  hipsBone.add(rUpperLegBone);

  const rUpperLeg = capsule(0.065, 0.38, bodyMat);
  rUpperLeg.position.y = -0.18;
  rUpperLegBone.add(rUpperLeg);

  // Right Lower Leg
  const rLowerLegBone = new THREE.Group();
  rLowerLegBone.name = 'rLowerLeg';
  rLowerLegBone.position.y = -0.4;
  rUpperLegBone.add(rLowerLegBone);

  const rLowerLeg = capsule(0.055, 0.36, darkMat);
  rLowerLeg.position.y = -0.16;
  rLowerLegBone.add(rLowerLeg);

  // Right Foot
  const rFootBone = new THREE.Group();
  rFootBone.name = 'rFoot';
  rFootBone.position.y = -0.38;
  rLowerLegBone.add(rFootBone);

  const rFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.05, 0.16),
    accentMat
  );
  rFoot.position.set(0, -0.02, 0.03);
  rFootBone.add(rFoot);

  // Enable shadows on all character meshes
  charGroup.traverse(function(child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });


  // ─── FLOATING DUST PARTICLES ────────────────────────────────
  (function() {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: Math.random() * 0.002 + 0.001,
        z: (Math.random() - 0.5) * 0.003
      });
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x88aaff, size: 0.03, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const particles = new THREE.Points(geom, mat);
    scene.add(particles);
    window._dustParticles = { positions, velocities, geom };
  })();


  // ─── INPUT SYSTEM ───────────────────────────────────────────
  const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
  window.addEventListener('keydown', function(e) {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = true;
    if (k === 'a') keys.a = true;
    if (k === 's') keys.s = true;
    if (k === 'd') keys.d = true;
    if (e.key === 'Shift') keys.shift = true;
    if (e.code === 'Space') keys.space = true;
  });
  window.addEventListener('keyup', function(e) {
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = false;
    if (k === 'a') keys.a = false;
    if (k === 's') keys.s = false;
    if (k === 'd') keys.d = false;
    if (e.key === 'Shift') keys.shift = false;
    if (e.code === 'Space') keys.space = false;
  });
  // Prevent keys from sticking if window loses focus
  window.addEventListener('blur', function() {
    keys.w = keys.a = keys.s = keys.d = keys.shift = keys.space = false;
  });

  // Combat Input
  const combatAnim = { pWeight: 0, pElbow: -1.8, pShoulder: 0, pChestTwist: 0 };
  let currentPunchTl = null;

  window.addEventListener('pointerdown', function(e) {
    if (e.button === 0) { // Left click
      console.log('Left click detected', { combatState, progress: currentPunchTl ? currentPunchTl.progress() : 0 });
      if ((combatState === 'IDLE' || (currentPunchTl && currentPunchTl.progress() > 0.5))) {
      if (timeSinceLastPunch > 0.8) punchCombo = 0;
      const isLeft = punchCombo % 2 === 0;
      combatState = isLeft ? 'PUNCH_L' : 'PUNCH_R';
      punchCombo++;
      punchHitEffectSpawned = false;
      timeSinceLastPunch = 0;

      if (currentPunchTl) currentPunchTl.kill();

      combatAnim.pWeight = 0;
      combatAnim.pElbow = -1.8;
      combatAnim.pChestTwist = isLeft ? 0.4 : -0.4;
      combatAnim.pShoulder = 0;

      currentPunchTl = gsap.timeline({
        onComplete: () => {
          combatState = 'IDLE';
        }
      });

      // Windup
      currentPunchTl.to(combatAnim, { pWeight: 1.0, duration: 0.08, ease: "power1.out" });

      // Strike
      currentPunchTl.to(combatAnim, {
        pElbow: -0.2, pChestTwist: isLeft ? -0.5 : 0.5, pShoulder: 0.6,
        duration: 0.12, ease: "power2.in",
        onUpdate: function() {
          if (!punchHitEffectSpawned && this.progress() > 0.6) {
            charGroup.updateMatrixWorld(true);
            const fistPos = new THREE.Vector3(0, -0.4, 0);
            fistPos.applyMatrix4(isLeft ? lLowerArmBone.matrixWorld : rLowerArmBone.matrixWorld);
            
            const bagCenter = new THREE.Vector3();
            bagMesh.getWorldPosition(bagCenter);
            if (fistPos.distanceTo(bagCenter) < 1.1) {
              spawnImpactParticles(fistPos);
              const pushDir = new THREE.Vector3().subVectors(bagCenter, charGroup.position).normalize();
              bagRecoilX = pushDir.x * 0.8; bagRecoilZ = pushDir.z * 0.8;
            }
            punchHitEffectSpawned = true;
          }
        }
      });

      // Recovery
      currentPunchTl.to(combatAnim, {
        pWeight: 0, pElbow: -1.8, pChestTwist: isLeft ? 0.4 : -0.4, pShoulder: 0,
        duration: 0.35, ease: "power2.out"
      });
      }
    }
  }, true);

  // ─── COMBAT PARTICLES ─────────────────────────────────────────
  const impactParticles = [];
  function spawnImpactParticles(worldPos) {
    const geom = new THREE.BufferGeometry();
    const count = 20;
    const pos = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      pos[i*3] = worldPos.x;
      pos[i*3+1] = worldPos.y;
      pos[i*3+2] = worldPos.z;
      vel.push(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ));
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffe64f, size: 0.15, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mesh = new THREE.Points(geom, mat);
    scene.add(mesh);
    impactParticles.push({ mesh, vel, pos, life: 1.0 });
  }


  // ─── MOVEMENT PHYSICS ───────────────────────────────────────
  const MOVE = {
    walkSpeed: 2.8,        // units/sec
    runSpeed: 5.5,         // units/sec
    accel: 12.0,           // acceleration (units/sec²)
    decel: 8.0,            // deceleration when no input
    turnSpeed: 10.0,       // rotation lerp speed (rad/sec)
    arenaRadius: 23.5,     // keep character inside arena
    gravity: -28.0,        // gravity acceleration (units/sec²)
    jumpForce: 11.5        // initial vertical velocity when jumping
  };

  // Movement state
  const velocity = new THREE.Vector3(0, 0, 0);
  let speed = 0;                // current speed magnitude
  let moveBlend = 0;            // 0 = idle, 1 = full walk/run
  let walkCyclePhase = 0;       // accumulated walk animation phase
  let facingAngle = 0;          // current Y rotation of character
  
  // Jump state
  let velocityY = 0;
  let isGrounded = true;
  let jumpBlend = 0;            // 0 = grounded, 1 = mid-air
  let squatPhase = 0;           // for landing compression animation

  // Combat state
  let combatState = 'IDLE'; // 'IDLE', 'PUNCH_L', 'PUNCH_R'
  let combatTimer = 0;
  let punchHitEffectSpawned = false;
  let punchCombo = 0; 
  let timeSinceLastPunch = 999;


  // ─── IDLE BREATHING ANIMATION ───────────────────────────────
  // All animation is driven by elapsed time using sinusoidal easing.
  // No frame-count dependency. Fully deterministic given elapsed time.

  const IDLE = {
    breathFreq: 1.8, breathAmp: 0.015,
    hipSwayFreq: 0.7, hipSwayAmp: 0.008,
    headBobFreq: 1.2, headBobAmp: 0.003,
    headTiltFreq: 0.5, headTiltAmp: 0.015,
    shoulderFreq: 0.9, shoulderAmp: 0.012,
    armSwingFreq: 0.6, armSwingAmp: 0.04,
    bodyBobFreq: 1.8, bodyBobAmp: 0.006,
    leanFreq: 0.35, leanAmp: 0.01
  };

  // Walk cycle animation config
  const WALK = {
    legSwing: 0.55,       // max leg rotation (radians)
    armSwing: 0.45,       // max arm counter-swing
    hipBob: 0.025,        // vertical hip bounce
    hipSway: 0.03,        // lateral hip sway
    chestTwist: 0.04,     // torso counter-rotation
    headStabilize: 0.02,  // head counter-twist
    leanForward: 0.06,    // chest forward lean when moving
    footLift: 0.04,       // foot lifts off ground
    kneeFlexion: 0.35,    // max knee bend during swing
    cycleSpeed: 8.0,      // walk cycle frequency multiplier
    runMultiplier: 1.4    // amplify walk cycle for running
  };

  // Store base positions/rotations
  const baseHipsY = hipsBone.position.y;


  // ─── RENDER LOOP ────────────────────────────────────────────
  const clock = new THREE.Clock();
  const _tempVec = new THREE.Vector3(); // reusable vector (no per-frame alloc)
  const _camTarget = new THREE.Vector3();
  const _camLookAt = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05); // cap delta to prevent huge jumps
    const t = clock.getElapsedTime();
    const sin = Math.sin;
    const cos = Math.cos;
    const PI2 = Math.PI * 2;

    // ── MOVEMENT PHYSICS (Camera-Relative) ──
    let inputX = 0;
    let inputZ = 0;
    if (keys.w) inputZ -= 1;
    if (keys.s) inputZ += 1;
    if (keys.a) inputX -= 1;
    if (keys.d) inputX += 1;

    const isMoving = inputX !== 0 || inputZ !== 0;
    const isPunching = combatState !== 'IDLE';
    timeSinceLastPunch += dt;
    const targetSpeed = (isMoving && !isPunching) ? (keys.shift ? MOVE.runSpeed : MOVE.walkSpeed) : 0;

    // Accelerate / Decelerate
    if (isMoving) {
      speed = Math.min(speed + MOVE.accel * dt, targetSpeed);
    } else {
      speed = Math.max(speed - MOVE.decel * dt, 0);
    }

    // Determine movement direction based on camera angle
    let turnSpeed = 0;
    if (isMoving) {
      // Get camera's forward and right vectors (projected flat on XZ plane)
      const camForward = new THREE.Vector3();
      cam.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      const camRight = new THREE.Vector3();
      camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveDir = new THREE.Vector3()
        .addScaledVector(camRight, inputX)
        .addScaledVector(camForward, -inputZ)
        .normalize();

      // Desired facing angle
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      
      // Smoothly rotate character towards target angle (shortest path)
      let diff = targetAngle - facingAngle;
      // Normalize diff to [-PI, PI]
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      turnSpeed = diff * 15.0;
      facingAngle += turnSpeed * dt; // Turn speed factor
    }

    // Apply facing rotation
    charGroup.rotation.y = facingAngle;

    // Calculate horizontal velocity based on facing angle (always moves forward relative to itself)
    velocity.x = Math.sin(facingAngle) * speed;
    velocity.z = Math.cos(facingAngle) * speed;

    // ── VERTICAL PHYSICS (Jump & Gravity) ──
    if (keys.space && isGrounded) {
      velocityY = MOVE.jumpForce;
      isGrounded = false;
    }

    if (!isGrounded) {
      // Float slightly at apex (hang time)
      const isApex = Math.abs(velocityY) < 2.0;
      const currentGrav = isApex ? MOVE.gravity * 0.7 : MOVE.gravity;
      velocityY += currentGrav * dt;
    }

    // Apply velocity to character position
    charGroup.position.x += velocity.x * dt;
    charGroup.position.y += velocityY * dt;
    charGroup.position.z += velocity.z * dt;

    // Ground collision
    if (charGroup.position.y <= 0) {
      charGroup.position.y = 0;
      if (!isGrounded) {
        // Just landed
        isGrounded = true;
        velocityY = 0;
        squatPhase = 1.0; // Trigger landing squash
      }
    }

    // Clamp to arena bounds
    const distFromCenter = Math.sqrt(charGroup.position.x * charGroup.position.x + charGroup.position.z * charGroup.position.z);
    if (distFromCenter > MOVE.arenaRadius) {
      const scale = MOVE.arenaRadius / distFromCenter;
      charGroup.position.x *= scale;
      charGroup.position.z *= scale;
      speed *= 0.5; // bounce dampening
    }

    // Compute movement blend for animation
    const absSpeed = Math.abs(speed);
    const targetBlend = absSpeed > 0.1 ? Math.min(absSpeed / MOVE.walkSpeed, 1.5) : 0;
    moveBlend += (targetBlend - moveBlend) * Math.min(1, 8 * dt);
    const isRunning = absSpeed > MOVE.walkSpeed * 1.1;
    const runFactor = isRunning ? WALK.runMultiplier : 1.0;

    // Reverse walk animation if walking backwards
    walkCyclePhase += speed * WALK.cycleSpeed * dt;

    // ── ANIMATION BLENDING ──
    // Smooth jump state transitions
    const targetJumpBlend = isGrounded ? 0 : 1;
    jumpBlend += (targetJumpBlend - jumpBlend) * Math.min(1, 15 * dt);
    
    // Decay landing squat
    if (squatPhase > 0) {
      squatPhase = Math.max(0, squatPhase - 6 * dt);
    }

    const groundWeight = 1 - jumpBlend;
    const walkWeight = Math.min(moveBlend, 1) * groundWeight;
    const idleWeight = (1 - Math.min(moveBlend, 1)) * groundWeight;
    
    // Jump poses
    const isFalling = velocityY < -1.0 && !isGrounded;
    const fallWeight = isFalling ? jumpBlend : 0;
    const jumpRiseWeight = (!isFalling) ? jumpBlend : 0;

    // ── IDLE ANIMATION ──
    const breathPhase = sin(t * PI2 * IDLE.breathFreq);

    // ── WALK ANIMATION ──
    const wc = walkCyclePhase;
    const legSwing = sin(wc) * WALK.legSwing * runFactor;
    const armSwing = sin(wc) * WALK.armSwing * runFactor;
    const hipBob = Math.abs(sin(wc * 2)) * WALK.hipBob * runFactor;
    const hipSway = sin(wc) * WALK.hipSway;
    const chestTwist = sin(wc) * WALK.chestTwist * runFactor;
    const kneeBend = Math.max(0, -sin(wc)) * WALK.kneeFlexion * runFactor;
    const kneeOpp = Math.max(0, sin(wc)) * WALK.kneeFlexion * runFactor;
    const footLift = Math.max(0, sin(wc)) * WALK.footLift * runFactor;
    const footOpp = Math.max(0, -sin(wc)) * WALK.footLift * runFactor;

    // ── JUMP / FALL / SQUAT POSES ──
    // Tuck legs up, keep knees bent.
    const tuckLegs = -1.0 * jumpRiseWeight + 0.1 * fallWeight + -0.5 * squatPhase;
    const tuckKnees = 1.2 * jumpRiseWeight + 0.1 * fallWeight + 1.0 * squatPhase;
    // Flail arms: slightly out during rise, up during fall
    const armFlailZ = 0.3 * jumpRiseWeight + 0.8 * fallWeight;
    const armFlailX = 0.2 * jumpRiseWeight - 1.2 * fallWeight;
    // Bend elbows slightly during jump/fall so they don't snap straight
    const elbowBend = -0.6 * jumpRiseWeight - 0.4 * fallWeight;

    // ── APPLY BLENDED POSE ──
    chestBone.scale.y = 1 + breathPhase * IDLE.breathAmp * idleWeight;
    chestBone.scale.x = 1 - breathPhase * IDLE.breathAmp * 0.3 * idleWeight;
    chestBone.rotation.x = walkWeight * WALK.leanForward * runFactor * Math.sign(speed || 1)
      + 0.3 * squatPhase - 0.1 * fallWeight; 
    chestBone.rotation.y = walkWeight * chestTwist;
    chestBone.rotation.z = -turnSpeed * 0.05 * walkWeight; // Lean into turns

    hipsBone.position.y = baseHipsY
      + sin(t * PI2 * IDLE.bodyBobFreq) * IDLE.bodyBobAmp * idleWeight 
      + hipBob * walkWeight
      - 0.4 * squatPhase;                                             
    hipsBone.rotation.z = sin(t * PI2 * IDLE.hipSwayFreq) * IDLE.hipSwayAmp * idleWeight
      + hipSway * walkWeight;
    hipsBone.rotation.y = sin(t * PI2 * IDLE.leanFreq) * IDLE.leanAmp * idleWeight;

    headBone.position.y = 0.12
      + sin(t * PI2 * IDLE.headBobFreq) * IDLE.headBobAmp * idleWeight;
    headBone.rotation.z = sin(t * PI2 * IDLE.headTiltFreq) * IDLE.headTiltAmp * idleWeight
      - walkWeight * chestTwist * 0.5; 
    headBone.rotation.x = sin(t * PI2 * 0.4) * 0.01 * idleWeight
      - walkWeight * WALK.headStabilize
      - 0.3 * squatPhase + 0.2 * fallWeight; 

    lShoulderBone.rotation.z = sin(t * PI2 * IDLE.shoulderFreq) * IDLE.shoulderAmp * idleWeight
      + armFlailZ;
    rShoulderBone.rotation.z = -sin(t * PI2 * IDLE.shoulderFreq) * IDLE.shoulderAmp * idleWeight
      - armFlailZ;

    lUpperArmBone.rotation.x = sin(t * PI2 * IDLE.armSwingFreq) * IDLE.armSwingAmp * idleWeight
      + armSwing * walkWeight + armFlailX;   
    rUpperArmBone.rotation.x = -sin(t * PI2 * IDLE.armSwingFreq + 0.5) * IDLE.armSwingAmp * idleWeight
      - armSwing * walkWeight + armFlailX;   

    lLowerArmBone.rotation.x = (-0.12 + sin(t * PI2 * 0.8) * 0.02) * idleWeight
      + (-0.25 - Math.abs(armSwing) * 0.3) * walkWeight
      + elbowBend;
    rLowerArmBone.rotation.x = (-0.12 - sin(t * PI2 * 0.8 + 0.5) * 0.02) * idleWeight
      + (-0.25 - Math.abs(armSwing) * 0.3) * walkWeight
      + elbowBend;

    lUpperLegBone.rotation.x = sin(t * PI2 * IDLE.leanFreq) * 0.015 * idleWeight
      + legSwing * walkWeight + tuckLegs;     
    rUpperLegBone.rotation.x = -sin(t * PI2 * IDLE.leanFreq) * 0.015 * idleWeight
      - legSwing * walkWeight + tuckLegs;     

    lLowerLegBone.rotation.x = sin(t * PI2 * IDLE.leanFreq) * 0.015 * idleWeight
      + kneeBend * walkWeight + tuckKnees;
    rLowerLegBone.rotation.x = -sin(t * PI2 * IDLE.leanFreq) * 0.015 * idleWeight
      + kneeOpp * walkWeight + tuckKnees;

    lFootBone.rotation.x = footLift * walkWeight * 0.3 - 0.3 * jumpRiseWeight + 0.2 * fallWeight;
    rFootBone.rotation.x = footOpp * walkWeight * 0.3 - 0.3 * jumpRiseWeight + 0.2 * fallWeight;

    // ── COMBAT ANIMATION OVERRIDE ──
    const isBoxingStance = (timeSinceLastPunch < 2.0) || (combatState !== 'IDLE');
    let stanceWeight = isBoxingStance ? Math.max(0, Math.min(1.0, 2.0 - timeSinceLastPunch)) : 0;
    if (combatState !== 'IDLE') stanceWeight = 1.0;

    // Apply base boxing stance (guard up, light bounce)
    if (stanceWeight > 0) {
      const g = stanceWeight;
      lUpperArmBone.rotation.x = lUpperArmBone.rotation.x * (1-g) + (-1.2) * g;
      lUpperArmBone.rotation.z = lUpperArmBone.rotation.z * (1-g) + (0.3) * g;
      lLowerArmBone.rotation.x = lLowerArmBone.rotation.x * (1-g) + (-1.8) * g;

      rUpperArmBone.rotation.x = rUpperArmBone.rotation.x * (1-g) + (-1.2) * g;
      rUpperArmBone.rotation.z = rUpperArmBone.rotation.z * (1-g) + (-0.3) * g;
      rLowerArmBone.rotation.x = rLowerArmBone.rotation.x * (1-g) + (-1.8) * g;
      
      chestBone.rotation.y += 0.3 * g;
      hipsBone.rotation.y -= 0.2 * g;
      
      // Boxing bounce
      hipsBone.position.y += Math.abs(Math.sin(t * 12)) * 0.04 * g;
    }

    if (combatState !== 'IDLE' && combatAnim.pWeight > 0) {
      const isLeft = combatState === 'PUNCH_L';
      const pWeight = combatAnim.pWeight;
      
      if (isLeft) {
        lUpperArmBone.rotation.x = (-Math.PI/2) * pWeight + lUpperArmBone.rotation.x * (1-pWeight);
        lUpperArmBone.rotation.z = (-0.1) * pWeight + lUpperArmBone.rotation.z * (1-pWeight);
        lLowerArmBone.rotation.x = combatAnim.pElbow * pWeight + lLowerArmBone.rotation.x * (1-pWeight);
        lShoulderBone.rotation.y = -combatAnim.pShoulder * pWeight;
      } else {
        rUpperArmBone.rotation.x = (-Math.PI/2) * pWeight + rUpperArmBone.rotation.x * (1-pWeight);
        rUpperArmBone.rotation.z = (0.1) * pWeight + rUpperArmBone.rotation.z * (1-pWeight);
        rLowerArmBone.rotation.x = combatAnim.pElbow * pWeight + rLowerArmBone.rotation.x * (1-pWeight);
        rShoulderBone.rotation.y = -combatAnim.pShoulder * pWeight;
      }
      chestBone.rotation.y += combatAnim.pChestTwist * pWeight;
      chestBone.rotation.x += 0.25 * pWeight;
    }

    // Update Bag Physics
    bagPivot.rotation.x += (bagRecoilZ - bagPivot.rotation.x) * 8 * dt;
    bagPivot.rotation.z += (-bagRecoilX - bagPivot.rotation.z) * 8 * dt;
    bagRecoilX *= (1.0 - 6*dt);
    bagRecoilZ *= (1.0 - 6*dt);

    // ── COMBAT PARTICLES UPDATE ──
    for (let i = impactParticles.length - 1; i >= 0; i--) {
      const p = impactParticles[i];
      p.life -= dt * 4.0;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        impactParticles.splice(i, 1);
        continue;
      }
      p.mesh.material.opacity = p.life;
      for (let j = 0; j < p.vel.length; j++) {
        p.pos[j*3] += p.vel[j].x * dt;
        p.pos[j*3+1] += p.vel[j].y * dt;
        p.pos[j*3+2] += p.vel[j].z * dt;
      }
      p.mesh.geometry.attributes.position.needsUpdate = true;
    }

    // ── FLOATING DUST PARTICLES ──
    if (window._dustParticles) {
      const dp = window._dustParticles;
      for (let i = 0; i < dp.velocities.length; i++) {
        dp.positions[i * 3]     += dp.velocities[i].x;
        dp.positions[i * 3 + 1] += dp.velocities[i].y;
        dp.positions[i * 3 + 2] += dp.velocities[i].z;
        if (dp.positions[i * 3 + 1] > 6) {
          dp.positions[i * 3 + 1] = 0;
          dp.positions[i * 3]     = charGroup.position.x + (Math.random() - 0.5) * 20;
          dp.positions[i * 3 + 2] = charGroup.position.z + (Math.random() - 0.5) * 20;
        }
      }
      dp.geom.attributes.position.needsUpdate = true;
    }

    // ── GLOWING RING PULSE ──
    ring.material.opacity = 0.35 + sin(t * 1.5) * 0.15;
    innerRing.material.opacity = 0.2 + cos(t * 2.0) * 0.1;

    // ── THIRD-PERSON FREE ORBIT CAMERA ──
    const charPos = charGroup.position;
    
    // We want the controls target to smoothly track the character's chest
    _camLookAt.set(charPos.x, charPos.y + CAM_FOLLOW.lookOffset.y, charPos.z);
    
    // Find how much the target moved this frame
    const targetDelta = new THREE.Vector3().subVectors(_camLookAt, ctl.target);
    
    // Move the target
    ctl.target.copy(_camLookAt);
    
    // Move the camera by the same delta to maintain the user's orbit distance and angle
    cam.position.add(targetDelta);
    
    // Update OrbitControls (handles damping and user mouse input)
    ctl.update();

    // ── Render ──
    renderer.render(scene, cam);
  }

  animate();


  // ─── RESIZE HANDLER ─────────────────────────────────────────
  window.addEventListener('resize', function() {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
