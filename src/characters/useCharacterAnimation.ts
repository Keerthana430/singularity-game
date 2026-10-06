import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useCharacterState } from '../state/characterState';

const IDLE = {
  breathFreq: 0.35, breathAmp: 0.02,
  hipSwayFreq: 0.175, hipSwayAmp: 0.015,
  headBobFreq: 0.35, headBobAmp: 0.005,
  headTiltFreq: 0.175, headTiltAmp: 0.01,
  shoulderFreq: 0.35, shoulderAmp: 0.02,
  armSwingFreq: 0.175, armSwingAmp: 0.05,
  bodyBobFreq: 0.35, bodyBobAmp: 0.015,
  leanFreq: 0.175, leanAmp: 0.015
};

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

export function useCharacterAnimation(bones: Record<string, THREE.Group | THREE.Bone>, velocity: THREE.Vector3, isGrounded: boolean, combatStanceRef?: React.MutableRefObject<boolean>) {
  const { combatState } = useCharacterState();
  
  const moveBlendRef = useRef(0);
  const walkCyclePhaseRef = useRef(0);
  const jumpBlendRef = useRef(0);
  const squatPhaseRef = useRef(0);
  const baseHipsYRef = useRef(0.95); // Base Y from generation
  
  // Combat animation state objects
  const combatAnimRef = useRef({ pWeight: 0, pElbow: -1.8, pShoulder: 0, pChestTwist: 0, pHook: 0, pUpper: 0, pLunge: 0, pArmZ: -0.2 });
  const dodgeAnimRef = useRef({ weight: 0, x: 0, z: 0, squat: 0 });
  const hitAnimRef = useRef({ weight: 0, pitch: 0, twist: 0 });
  const knockdownAnimRef = useRef({ weight: 0, pitch: 0, hipsY: 0, knees: 0, armsSpread: 0 });
  const blockAnimRef = useRef({ weight: 0 });
  
  // Track previous grounded state to trigger landing squat
  const prevGroundedRef = useRef(true);
  const stanceWeightRef = useRef(0);

  // We need combat logic to trigger when combatState changes in global store.
  // We can just rely on the component using this hook to trigger GSAP directly, OR we can watch state here.
  // For simplicity, we'll expose a triggerPunch method.
  
  const triggerPunch = (attackType: 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK', isLeft: boolean, onComplete: () => void) => {
    const combatAnim = combatAnimRef.current;
    
    gsap.killTweensOf(combatAnim);
    combatAnim.pWeight = 0;
    combatAnim.pElbow = -2.5; // Starts bent in guard
    combatAnim.pChestTwist = isLeft ? 0.4 : -0.4;
    combatAnim.pShoulder = 0;
    combatAnim.pHook = 0;
    combatAnim.pUpper = 0;
    combatAnim.pLunge = 0;
    combatAnim.pArmZ = -0.2; // Starts flared

    const tl = gsap.timeline({ onComplete });

    let strikeElbow = -0.1, strikeChest = isLeft ? -0.4 : 0.4, strikeShoulder = -1.5, strikeArmZ = 0;
    let windupHook = 0, strikeHook = 0, windupUpper = 0, strikeUpper = 0;
    let strikeDur = 0.12, lungeDist = 0.4, recoilDur = 0.35, recoilDelay = "+=0.05";
    
    if (attackType === 'HOOK') {
      strikeElbow = -1.5; strikeChest = isLeft ? -0.9 : 0.9; strikeShoulder = -1.0; strikeArmZ = -0.5;
      windupHook = -0.6; strikeHook = 1.2; strikeDur = 0.15; lungeDist = 0.3; recoilDur = 0.4;
    } else if (attackType === 'UPPERCUT') {
      strikeElbow = -2.2; strikeChest = isLeft ? -0.7 : 0.7; strikeShoulder = -1.2; strikeArmZ = 0.4;
      windupUpper = -0.8; strikeUpper = 1.3; strikeDur = 0.14; lungeDist = 0.2; recoilDur = 0.45;
    } else if (attackType === 'CROSS') {
      strikeChest = isLeft ? -0.8 : 0.8; strikeShoulder = -1.5; strikeDur = 0.14; lungeDist = 0.6; recoilDur = 0.4; strikeArmZ = -0.1;
    } else if (attackType === 'JUMP_ATTACK') {
      strikeElbow = -0.2; strikeChest = isLeft ? -0.8 : 0.8; strikeShoulder = -1.0; strikeArmZ = -0.5; strikeDur = 0.15; lungeDist = 0.8; recoilDur = 0.5; recoilDelay = "+=0.15";
    }

    // 1. Windup (Anticipation)
    tl.to(combatAnim, { pWeight: 1.0, pHook: windupHook, pUpper: windupUpper, pLunge: -0.1, duration: 0.1, ease: "power2.out" });
    
    // 2. Strike (Follow-through)
    tl.to(combatAnim, {
      pElbow: strikeElbow, pChestTwist: strikeChest, pShoulder: strikeShoulder, pHook: strikeHook, pUpper: strikeUpper, pLunge: lungeDist, pArmZ: strikeArmZ,
      duration: strikeDur, ease: "back.out(1.5)"
    });
    
    // 3. Recoil / Recovery
    tl.to(combatAnim, {
      pWeight: 0.2, pElbow: -2.0, pChestTwist: 0, pShoulder: 0, pHook: 0, pUpper: 0, pLunge: 0, pArmZ: -0.2,
      duration: recoilDur, ease: "power4.out"
    }, recoilDelay);
  };

  const triggerDodge = (dx: number, dz: number, onComplete: () => void) => {
    const dodgeAnim = dodgeAnimRef.current;
    gsap.killTweensOf(dodgeAnim);
    dodgeAnim.weight = 0;
    dodgeAnim.x = dx * 1.5;
    dodgeAnim.z = dz * 1.5;
    dodgeAnim.squat = 1.0;
    
    const tl = gsap.timeline({ onComplete });
    tl.to(dodgeAnim, { weight: 1.0, duration: 0.15, ease: "power2.out" });
    tl.to(dodgeAnim, { weight: 0, squat: 0, duration: 0.25, ease: "power2.inOut" });
  };

  const triggerHurt = (heavy: boolean, onComplete: () => void) => {
    const hitAnim = hitAnimRef.current;
    gsap.killTweensOf(hitAnim);
    hitAnim.weight = 0;
    
    const tl = gsap.timeline({ onComplete });
    tl.to(hitAnim, { weight: 1.0, pitch: heavy ? -0.5 : -0.2, twist: heavy ? 0.3 : 0.1, duration: 0.1, ease: "power2.out" });
    tl.to(hitAnim, { weight: 0, pitch: 0, twist: 0, duration: heavy ? 0.5 : 0.25, ease: "power2.inOut" });
  };

  const triggerKnockdown = (onComplete: () => void) => {
    const kAnim = knockdownAnimRef.current;
    gsap.killTweensOf(kAnim);
    kAnim.weight = 0;
    
    const tl = gsap.timeline({ onComplete });
    // 1. Windup (Squat & slight lean back)
    tl.to(kAnim, { weight: 1.0, pitch: -0.2, hipsY: -0.3, knees: 0.8, armsSpread: 0.5, duration: 0.1, ease: "power2.out" });
    // 2. Matrix Dodge (Deep lean backward)
    tl.to(kAnim, { pitch: -1.2, hipsY: -0.5, knees: 1.2, armsSpread: 1.2, duration: 0.2, ease: "back.out(1.2)" });
    // 3. Hold pose briefly
    tl.to(kAnim, { pitch: -1.2, duration: 0.1 });
    // 4. Snap back to standing
    tl.to(kAnim, { pitch: -0.2, hipsY: -0.2, knees: 0.5, armsSpread: 0, duration: 0.15, ease: "power2.in" });
    tl.to(kAnim, { weight: 0, pitch: 0, hipsY: 0, knees: 0, duration: 0.15, ease: "power2.out" });
  };

  const triggerGetUp = (onComplete: () => void) => {
    const kAnim = knockdownAnimRef.current;
    gsap.killTweensOf(kAnim);
    const tl = gsap.timeline({ onComplete });
    tl.to(kAnim, { pitch: -0.5, hipsY: -0.4, knees: 1.0, duration: 0.4, ease: "power2.inOut" });
    tl.to(kAnim, { weight: 0, pitch: 0, hipsY: 0, knees: 0, duration: 0.4, ease: "power2.inOut" });
  };

  useFrame((state, dt) => {
    if (!bones.root) return;
    
    const t = state.clock.getElapsedTime();
    const sin = Math.sin;
    const PI2 = Math.PI * 2;

    const speed = new THREE.Vector2(velocity.x, velocity.z).length();
    
    // Calculate movement blend
    const targetBlend = speed > 0.1 ? Math.min(speed / 2.8, 1.0) : 0;
    moveBlendRef.current += (targetBlend - moveBlendRef.current) * Math.min(1, 8 * dt);
    
    const runWeight = Math.max(0, Math.min(1, (speed - 3.0) / 2.5)); // 0 at walk speed (2.8), 1 at run speed (5.5)
    
    walkCyclePhaseRef.current += speed * (WALK.cycleSpeed - runWeight * 1.5) * dt;

    if (isGrounded && !prevGroundedRef.current) {
        squatPhaseRef.current = 1.0; // Trigger landing squash
    }
    prevGroundedRef.current = isGrounded;

    const targetJumpBlend = isGrounded ? 0 : 1;
    jumpBlendRef.current += (targetJumpBlend - jumpBlendRef.current) * Math.min(1, 15 * dt);
    
    const targetBlockWeight = combatState === 'BLOCKING' ? 1 : 0;
    blockAnimRef.current.weight += (targetBlockWeight - blockAnimRef.current.weight) * Math.min(1, 15 * dt);
    
    const targetStanceWeight = combatStanceRef?.current ? 1 : 0;
    stanceWeightRef.current += (targetStanceWeight - stanceWeightRef.current) * Math.min(1, 10 * dt);
    
    if (squatPhaseRef.current > 0) {
      squatPhaseRef.current = Math.max(0, squatPhaseRef.current - 6 * dt);
    }

    const groundWeight = 1 - jumpBlendRef.current;
    const blockWeight = blockAnimRef.current.weight;
    const walkWeight = Math.min(moveBlendRef.current, 1) * groundWeight * (1 - blockWeight * 0.5);
    const idleWeight = (1 - Math.min(moveBlendRef.current, 1)) * groundWeight * (1 - blockWeight);

    const isFalling = velocity.y < -1.0 && !isGrounded;
    const fallWeight = isFalling ? jumpBlendRef.current : 0;
    const jumpRiseWeight = (!isFalling) ? jumpBlendRef.current : 0;

    const breathPhase = sin(t * PI2 * IDLE.breathFreq);
    const wc = walkCyclePhaseRef.current;
    
    // Interpolate parameters based on runWeight (Phase 4: Run Cycle)
    const legSwingMax = WALK.legSwing + runWeight * 0.6; // Wider stride
    const armSwingMax = WALK.armSwing + runWeight * 0.7; // Harder arm pumping
    const footLiftMax = WALK.footLift + runWeight * 0.06; // Knees drive higher
    const chestLeanMax = WALK.leanForward + runWeight * 0.25; // Lean aggressively forward
    const hipBobMax = WALK.hipBob + runWeight * 0.03; // More vertical bounce

    // Walk/Run Cycle Mathematics
    const lLegSwing = -sin(wc) * legSwingMax;
    const rLegSwing = sin(wc) * legSwingMax;
    
    const lKnee = Math.max(0, Math.cos(wc)) * WALK.kneeFlexion * (1 + runWeight);
    const rKnee = Math.max(0, -Math.cos(wc)) * WALK.kneeFlexion * (1 + runWeight);
    
    const lFootLift = Math.max(0, Math.cos(wc)) * footLiftMax;
    const rFootLift = Math.max(0, -Math.cos(wc)) * footLiftMax;
    
    const lFootRoll = sin(wc) * 0.3 * (1 + runWeight * 0.5); // Heel -> Toe
    const rFootRoll = -sin(wc) * 0.3 * (1 + runWeight * 0.5);

    const lArmSwing = sin(wc) * armSwingMax;
    const rArmSwing = -sin(wc) * armSwingMax;
    // When running, elbows bend much tighter to the body (like a sprinter)
    const lElbowSwing = Math.max(0, -lArmSwing) * 0.8 + 0.1 + runWeight * 1.5; 
    const rElbowSwing = Math.max(0, -rArmSwing) * 0.8 + 0.1 + runWeight * 1.5;

    const hipBob = Math.abs(sin(wc * 2)) * hipBobMax;
    const hipSway = sin(wc) * 0.08 * (1 - runWeight * 0.8); // Less side-to-side swagger when sprinting
    const chestTwist = sin(wc) * 0.12 * (1 + runWeight * 1.0); // More torso rotation when sprinting

    const tuckLegs = -1.0 * jumpRiseWeight + 0.1 * fallWeight + -1.2 * squatPhaseRef.current;
    const tuckKnees = 1.2 * jumpRiseWeight + 0.1 * fallWeight + 1.8 * squatPhaseRef.current;
    const armFlailZ = 0.3 * jumpRiseWeight + 0.8 * fallWeight;
    const armFlailX = 0.2 * jumpRiseWeight - 1.2 * fallWeight;
    const fallElbowBend = -0.6 * jumpRiseWeight - 0.4 * fallWeight;
    
    // Core body
    // Simulate breathing by expanding chest depth (Z) and width (X) slightly, and tilting it up (negative X rotation)
    bones.chest.scale.z = 1 + breathPhase * IDLE.breathAmp * idleWeight;
    bones.chest.scale.x = 1 + breathPhase * (IDLE.breathAmp * 0.5) * idleWeight;
    bones.chest.scale.y = 1;
    bones.chest.rotation.x = walkWeight * chestLeanMax + 0.8 * squatPhaseRef.current - 0.1 * fallWeight - breathPhase * IDLE.breathAmp * idleWeight;
    bones.chest.rotation.y = walkWeight * chestTwist;
    bones.chest.rotation.z = 0; // Lean into turns could go here

    // In fighting stance, add a 2Hz boxer bounce and lower the hips
    const sw = stanceWeightRef.current;
    const isw = 1.0 - sw;
    const boxerBounce = Math.abs(Math.sin(t * Math.PI * 2 * 2.0)) * 0.02 * sw;

    bones.hips.position.y = baseHipsYRef.current 
        + Math.sin(t * Math.PI * 2 * IDLE.bodyBobFreq) * IDLE.bodyBobAmp * idleWeight 
        + hipBob * walkWeight 
        - 0.8 * squatPhaseRef.current
        - 0.1 * sw
        + boxerBounce;
    
    bones.hips.rotation.x = 0; // Prevent additive rotations like knockdown from accumulating indefinitely
    bones.hips.rotation.z = Math.sin(t * Math.PI * 2 * IDLE.hipSwayFreq) * IDLE.hipSwayAmp * idleWeight + hipSway * walkWeight;
    // Add subtle torso twist to stance
    bones.hips.rotation.y = Math.sin(t * Math.PI * 2 * IDLE.leanFreq) * IDLE.leanAmp * idleWeight + (0.1 * sw);

    bones.head.position.y = 0.12 + Math.sin(t * Math.PI * 2 * IDLE.headBobFreq) * IDLE.headBobAmp * idleWeight;
    bones.head.rotation.z = Math.sin(t * Math.PI * 2 * IDLE.headTiltFreq) * IDLE.headTiltAmp * idleWeight - walkWeight * chestTwist * 0.5;
    // Head subtly counters the chest breathing tilt
    bones.head.rotation.x = Math.sin(t * Math.PI * 2 * 0.4) * 0.01 * idleWeight - walkWeight * WALK.headStabilize - 0.3 * squatPhaseRef.current + 0.2 * fallWeight + breathPhase * (IDLE.breathAmp * 0.5) * idleWeight;

    // Default Legs (IDLE + WALK + FALLING + STANCE)
    // Left Leg (Lead Leg in stance)
    bones.lUpperLeg.rotation.x = lLegSwing * walkWeight + tuckLegs - 0.5 * sw;
    bones.lUpperLeg.rotation.z = -0.2 * sw; // Spread outward left
    bones.lLowerLeg.rotation.x = lKnee * walkWeight + tuckKnees + 0.8 * sw;
    bones.lLowerLeg.rotation.z = 0.2 * sw; // Keep shin vertical
    bones.lFoot.rotation.x = lFootRoll * walkWeight - 0.3 * sw;
    bones.lFoot.position.y = -0.38 + lFootLift * walkWeight;

    // Right Leg (Rear Leg in stance)
    bones.rUpperLeg.rotation.x = rLegSwing * walkWeight + tuckLegs + 0.1 * sw;
    bones.rUpperLeg.rotation.z = 0.2 * sw; // Spread outward right
    bones.rLowerLeg.rotation.x = rKnee * walkWeight + tuckKnees + 0.5 * sw;
    bones.rLowerLeg.rotation.z = -0.2 * sw; // Keep shin vertical
    bones.rFoot.rotation.x = rFootRoll * walkWeight - 0.6 * sw;
    bones.rFoot.position.y = -0.38 + rFootLift * walkWeight;

    // Default Arms (IDLE + WALK + FALLING + STANCE)
    // In idle, shoulders rise slightly with breath
    const shoulderBreath = breathPhase * IDLE.shoulderAmp * idleWeight;
    // In fighting stance, shoulders hunch forward (-0.1) and arms come up tight
    
    bones.lShoulder.rotation.z = (shoulderBreath + Math.sin(t * Math.PI * 2 * IDLE.shoulderFreq) * IDLE.shoulderAmp * idleWeight - 0.1 * walkWeight + armFlailZ) * isw + (0.1) * sw;
    bones.lShoulder.rotation.x = armFlailX * isw + (-0.1) * sw;
    bones.lUpperArm.rotation.x = (lArmSwing * walkWeight + Math.sin(t * Math.PI * 2 * IDLE.armSwingFreq) * IDLE.armSwingAmp * idleWeight) * isw + (-1.0) * sw;
    // Flare left elbow out naturally during walk and idle, and distinctly out (0.3) in fighting stance to avoid chest
    bones.lUpperArm.rotation.z = (0.2 * walkWeight + (0.15 + 0.05 * Math.sin(t * Math.PI * 2 * IDLE.armSwingFreq)) * idleWeight) * isw + (-0.3) * sw; 
    bones.lLowerArm.rotation.x = (-lElbowSwing * walkWeight - 0.1 * idleWeight + fallElbowBend) * isw + (-2.2) * sw;

    bones.rShoulder.rotation.z = (-shoulderBreath - Math.sin(t * Math.PI * 2 * IDLE.shoulderFreq) * IDLE.shoulderAmp * idleWeight + 0.1 * walkWeight - armFlailZ) * isw + (-0.1) * sw;
    bones.rShoulder.rotation.x = armFlailX * isw + (-0.1) * sw;
    bones.rUpperArm.rotation.x = (rArmSwing * walkWeight + Math.sin(t * Math.PI * 2 * IDLE.armSwingFreq) * IDLE.armSwingAmp * idleWeight) * isw + (-1.0) * sw;
    // Flare right elbow out naturally during walk and idle, and distinctly out (0.3) in fighting stance to avoid chest
    bones.rUpperArm.rotation.z = (-0.2 * walkWeight + (-0.15 - 0.05 * Math.sin(t * Math.PI * 2 * IDLE.armSwingFreq)) * idleWeight) * isw + (0.3) * sw; 
    bones.rLowerArm.rotation.x = (-rElbowSwing * walkWeight - 0.1 * idleWeight + fallElbowBend) * isw + (-2.2) * sw;

    // Apply Combat Override
    const cAnim = combatAnimRef.current;
    if (cAnim.pWeight > 0) {
      const iw = 1.0 - cAnim.pWeight;
      const cw = cAnim.pWeight;

      bones.chest.rotation.y = bones.chest.rotation.y * iw + cAnim.pChestTwist * cw;
      
      if (combatState === 'PUNCH_L') {
        bones.lShoulder.rotation.x = bones.lShoulder.rotation.x * iw + (-0.2) * cw;
        bones.lShoulder.rotation.y = cAnim.pHook * cw;
        bones.lShoulder.rotation.z = bones.lShoulder.rotation.z * iw + cAnim.pUpper * cw;
        bones.lUpperArm.rotation.x = bones.lUpperArm.rotation.x * iw + cAnim.pShoulder * cw;
        bones.lUpperArm.rotation.z = bones.lUpperArm.rotation.z * iw + cAnim.pArmZ * cw;
        bones.lLowerArm.rotation.x = bones.lLowerArm.rotation.x * iw + cAnim.pElbow * cw;
      } else if (combatState === 'PUNCH_R') {
        bones.rShoulder.rotation.x = bones.rShoulder.rotation.x * iw + (-0.2) * cw;
        bones.rShoulder.rotation.y = -cAnim.pHook * cw;
        bones.rShoulder.rotation.z = bones.rShoulder.rotation.z * iw - cAnim.pUpper * cw;
        bones.rUpperArm.rotation.x = bones.rUpperArm.rotation.x * iw + cAnim.pShoulder * cw;
        bones.rUpperArm.rotation.z = bones.rUpperArm.rotation.z * iw - cAnim.pArmZ * cw;
        bones.rLowerArm.rotation.x = bones.rLowerArm.rotation.x * iw + cAnim.pElbow * cw;
      }
    }

    // Apply Dodge Override
    const dAnim = dodgeAnimRef.current;
    if (dAnim.squat > 0) {
      bones.hips.position.y -= dAnim.squat * 0.3;
      bones.chest.rotation.x += dAnim.squat * 0.5;
    }
    // Apply Knockdown Override
    const kAnim = knockdownAnimRef.current;
    if (kAnim.weight > 0) {
      bones.hips.position.y += kAnim.hipsY * kAnim.weight;
      bones.hips.rotation.x += kAnim.pitch * kAnim.weight;
      
      bones.lUpperLeg.rotation.x = -kAnim.pitch * kAnim.weight;
      bones.rUpperLeg.rotation.x = -kAnim.pitch * kAnim.weight;
      bones.lLowerLeg.rotation.x += kAnim.knees * kAnim.weight;
      bones.rLowerLeg.rotation.x += kAnim.knees * kAnim.weight;
      
      bones.lUpperArm.rotation.z += kAnim.armsSpread * kAnim.weight;
      bones.rUpperArm.rotation.z -= kAnim.armsSpread * kAnim.weight;
      bones.lUpperArm.rotation.x = bones.lUpperArm.rotation.x * (1 - kAnim.weight);
      bones.rUpperArm.rotation.x = bones.rUpperArm.rotation.x * (1 - kAnim.weight);
    }

    // Apply Hit (Hurt) Override
    const hAnim = hitAnimRef.current;
    if (hAnim.weight > 0) {
      bones.chest.rotation.x += hAnim.pitch * hAnim.weight;
      bones.chest.rotation.y += hAnim.twist * hAnim.weight;
      bones.head.rotation.x += hAnim.pitch * 0.5 * hAnim.weight;
    }

    // Apply Block Override (Realistic Tight High Guard)
    if (blockWeight > 0) {
      const iw = 1.0 - blockWeight;
      const bw = blockWeight;

      bones.chest.rotation.x = bones.chest.rotation.x * iw + (0.25) * bw; // Crunch forward heavily to protect body
      bones.head.rotation.x = bones.head.rotation.x * iw + (-0.15) * bw; // Tuck chin down behind the gloves
      
      // Roll shoulders forward and up to protect the chin
      bones.lShoulder.rotation.x = bones.lShoulder.rotation.x * iw + (-0.3) * bw;
      bones.lShoulder.rotation.y = bones.lShoulder.rotation.y * iw + (0.2) * bw;
      
      bones.rShoulder.rotation.x = bones.rShoulder.rotation.x * iw + (-0.3) * bw;
      bones.rShoulder.rotation.y = bones.rShoulder.rotation.y * iw + (-0.2) * bw;
      
      // Upper arms: Raise up (-1.4), pull IN tightly across the chest/face (+0.3/-0.3)
      // Note: Removed the .y twist because it caused the elbow joint to bend sideways into the shoulder
      bones.lUpperArm.rotation.x = bones.lUpperArm.rotation.x * iw + (-1.4) * bw;
      bones.lUpperArm.rotation.z = bones.lUpperArm.rotation.z * iw + (0.3) * bw; 
      
      bones.rUpperArm.rotation.x = bones.rUpperArm.rotation.x * iw + (-1.4) * bw;
      bones.rUpperArm.rotation.z = bones.rUpperArm.rotation.z * iw + (-0.3) * bw;

      // Bend elbows straight up and slightly in, forming a vertical shield in front of the face
      bones.lLowerArm.rotation.x = bones.lLowerArm.rotation.x * iw + (-2.0) * bw;
      bones.rLowerArm.rotation.x = bones.rLowerArm.rotation.x * iw + (-2.0) * bw;
    }
  });

  return { triggerPunch, triggerDodge, triggerHurt, triggerKnockdown, triggerGetUp };
}
