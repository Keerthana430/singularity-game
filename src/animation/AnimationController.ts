import * as THREE from 'three';

export type CharacterState = 
  | 'IDLE' 
  | 'WALK' 
  | 'RUN' 
  | 'STRAFE_LEFT' 
  | 'STRAFE_RIGHT' 
  | 'BACKWARD'
  | 'JUMP' 
  | 'FALL' 
  | 'LAND'
  | 'PUNCH_JAB'
  | 'PUNCH_CROSS'
  | 'PUNCH_HOOK'
  | 'PUNCH_UPPERCUT'
  | 'HEAVY_ATTACK'
  | 'JUMP_ATTACK'
  | 'BLOCK'
  | 'DODGE_LEFT'
  | 'DODGE_RIGHT'
  | 'BACKSTEP'
  | 'HIT_REACT'
  | 'KNOCKDOWN'
  | 'GET_UP';

export interface BoneTargets {
  [boneName: string]: {
    rotation?: THREE.Euler;
    position?: THREE.Vector3;
  };
}

export class AnimationController {
  private bones: Record<string, THREE.Group | THREE.Bone>;
  public currentState: CharacterState = 'IDLE';
  public timeInState: number = 0;
  
  // Transition speed for blending
  public blendSpeed: number = 10.0; 

  constructor(bones: Record<string, THREE.Group | THREE.Bone>) {
    this.bones = bones;
  }

  setState(newState: CharacterState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.timeInState = 0;
    }
  }

  update(delta: number, t: number) {
    this.timeInState += delta;
    const targets = this.getTargets(t);

    // Smoothly blend current bone values to targets
    for (const [boneName, target] of Object.entries(targets)) {
      const bone = this.bones[boneName];
      if (!bone) continue;

      if (target.rotation) {
        const currentQuat = new THREE.Quaternion().setFromEuler(bone.rotation);
        const targetQuat = new THREE.Quaternion().setFromEuler(target.rotation);
        currentQuat.slerp(targetQuat, delta * this.blendSpeed);
        bone.rotation.setFromQuaternion(currentQuat);
      }
      
      if (target.position) {
        bone.position.lerp(target.position, delta * this.blendSpeed);
      }
    }
  }

  private getTargets(t: number): BoneTargets {
    const targets: BoneTargets = {};
    const e = (x: number, y: number, z: number) => new THREE.Euler(x, y, z);
    const p = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

    // Default Stance (Fighting Idle)
    let bHipsPos = p(0, 0.95 + Math.sin(t * 3) * 0.02, 0);
    let bSpineRot = e(Math.sin(t * 1.5) * 0.02, 0, 0);
    let bChestRot = e(Math.sin(t * 1.5 + 1) * 0.02, 0, 0);
    let bHeadRot = e(0, 0, 0);

    let lShoulderRot = e(-0.1, 0.2, 0.3);
    let lUpperArmRot = e(-0.4, 0.2, -0.2);
    let lLowerArmRot = e(-1.7, 0, 0);

    let rShoulderRot = e(-0.1, -0.2, -0.3);
    let rUpperArmRot = e(-0.1, -0.2, 0.3);
    let rLowerArmRot = e(-1.5, 0, 0);

    let lUpperLegRot = e(-0.1, 0, 0);
    let lLowerLegRot = e(0.2, 0, 0);
    
    let rUpperLegRot = e(-0.1, 0, 0);
    let rLowerLegRot = e(0.2, 0, 0);

    // Overrides based on State
    switch (this.currentState) {
      case 'WALK':
        this.blendSpeed = 12.0;
        const walkSpeed = t * 8;
        bHipsPos.y = 0.95 + Math.abs(Math.sin(walkSpeed)) * 0.05;
        bSpineRot = e(0.1, Math.sin(walkSpeed) * 0.1, 0);
        
        lUpperArmRot = e(-0.4 + Math.sin(walkSpeed) * 0.5, 0.2, -0.2);
        rUpperArmRot = e(-0.1 - Math.sin(walkSpeed) * 0.5, -0.2, 0.3);
        
        lUpperLegRot = e(-Math.sin(walkSpeed) * 0.6, 0, 0);
        lLowerLegRot = e(Math.max(0, Math.sin(walkSpeed) * 0.6), 0, 0);
        
        rUpperLegRot = e(Math.sin(walkSpeed) * 0.6, 0, 0);
        rLowerLegRot = e(Math.max(0, -Math.sin(walkSpeed) * 0.6), 0, 0);
        break;

      case 'RUN':
        this.blendSpeed = 15.0;
        const runSpeed = t * 14;
        bHipsPos.y = 0.9 + Math.abs(Math.sin(runSpeed)) * 0.08;
        bSpineRot = e(0.3, Math.sin(runSpeed) * 0.2, 0); // Lean forward
        
        lUpperArmRot = e(-0.4 + Math.sin(runSpeed) * 1.0, 0.2, -0.2);
        lLowerArmRot = e(-1.5 + Math.sin(runSpeed) * 0.3, 0, 0);
        rUpperArmRot = e(-0.1 - Math.sin(runSpeed) * 1.0, -0.2, 0.3);
        rLowerArmRot = e(-1.5 - Math.sin(runSpeed) * 0.3, 0, 0);
        
        lUpperLegRot = e(-Math.sin(runSpeed) * 1.0, 0, 0);
        lLowerLegRot = e(Math.max(0, Math.sin(runSpeed) * 1.2), 0, 0);
        
        rUpperLegRot = e(Math.sin(runSpeed) * 1.0, 0, 0);
        rLowerLegRot = e(Math.max(0, -Math.sin(runSpeed) * 1.2), 0, 0);
        break;

      case 'PUNCH_JAB':
        this.blendSpeed = 25.0; 
        if (this.timeInState < 0.1) {
          bSpineRot.y = -0.3; 
          lUpperArmRot = e(-0.6, 0.5, -0.2);
          lLowerArmRot = e(-2.0, 0, 0);
        } else if (this.timeInState < 0.25) {
          bSpineRot.y = 0.4; 
          lUpperArmRot = e(-1.5, 0, 0);
          lLowerArmRot = e(-0.1, 0, 0); 
        } else if (this.timeInState > 0.4) {
          this.setState('IDLE');
        }
        break;

      case 'PUNCH_CROSS':
        this.blendSpeed = 22.0;
        if (this.timeInState < 0.15) {
          bSpineRot.y = 0.4; 
          rUpperArmRot = e(-0.2, -0.6, 0.2);
          rLowerArmRot = e(-2.0, 0, 0);
        } else if (this.timeInState < 0.35) {
          bSpineRot.y = -0.5; 
          rUpperArmRot = e(-1.5, 0, 0);
          rLowerArmRot = e(-0.1, 0, 0); 
        } else if (this.timeInState > 0.5) {
          this.setState('IDLE');
        }
        break;

      case 'PUNCH_HOOK':
        this.blendSpeed = 20.0;
        if (this.timeInState < 0.2) {
          bSpineRot.y = -0.6; // Wind up
          lUpperArmRot = e(-0.2, 0.8, -1.0);
          lLowerArmRot = e(-1.5, 0, 0);
        } else if (this.timeInState < 0.4) {
          bSpineRot.y = 0.6; // Swing through
          lUpperArmRot = e(0, -0.5, -1.5);
          lLowerArmRot = e(-1.5, 0, 0);
        } else if (this.timeInState > 0.6) {
          this.setState('IDLE');
        }
        break;

      case 'PUNCH_UPPERCUT':
        this.blendSpeed = 18.0;
        if (this.timeInState < 0.2) {
          bHipsPos.y = 0.7; // Crouch
          bSpineRot = e(0.4, 0.5, 0);
          rUpperArmRot = e(0.5, 0, 0.2);
          rLowerArmRot = e(-2.0, 0, 0);
        } else if (this.timeInState < 0.45) {
          bHipsPos.y = 1.1; // Explode up
          bSpineRot = e(-0.2, -0.6, 0);
          rUpperArmRot = e(-2.5, 0, 0);
          rLowerArmRot = e(-0.5, 0, 0);
        } else if (this.timeInState > 0.7) {
          this.setState('IDLE');
        }
        break;

      case 'HEAVY_ATTACK':
        this.blendSpeed = 15.0;
        if (this.timeInState < 0.4) {
          bSpineRot = e(0.2, -0.8, 0);
          rUpperArmRot = e(-0.5, -1.0, 0.5);
          rLowerArmRot = e(-2.5, 0, 0);
        } else if (this.timeInState < 0.7) {
          bSpineRot = e(-0.2, 0.8, 0);
          rUpperArmRot = e(-1.5, 0.5, 0.5);
          rLowerArmRot = e(-0.1, 0, 0);
        } else if (this.timeInState > 1.0) {
          this.setState('IDLE');
        }
        break;

      case 'JUMP_ATTACK':
        this.blendSpeed = 20.0;
        if (this.timeInState < 0.3) {
          bSpineRot = e(-0.4, 0, 0);
          lUpperArmRot = e(-2.8, 0, -0.5);
          rUpperArmRot = e(-2.8, 0, 0.5);
        } else if (this.timeInState < 0.6) {
          bSpineRot = e(0.8, 0, 0);
          lUpperArmRot = e(0.5, 0, -0.5);
          rUpperArmRot = e(0.5, 0, 0.5);
        } else if (this.timeInState > 0.8) {
          this.setState('IDLE');
        }
        break;

      case 'HIT_REACT':
        this.blendSpeed = 25.0;
        if (this.timeInState < 0.15) {
          bHipsPos.y = 1.0;
          bSpineRot = e(-0.4, 0, 0); // Snap back
          bHeadRot = e(-0.5, 0, 0);
          lUpperArmRot = e(-1.0, 0, -0.5);
          rUpperArmRot = e(-1.0, 0, 0.5);
        } else if (this.timeInState > 0.4) {
          this.setState('IDLE');
        }
        break;

      case 'KNOCKDOWN':
        this.blendSpeed = 10.0;
        bHipsPos.y = 0.2; // On ground
        bSpineRot = e(-1.5, 0, 0); // Lying back
        lUpperArmRot = e(-0.2, 0, -1.2);
        rUpperArmRot = e(-0.2, 0, 1.2);
        lUpperLegRot = e(-1.0, 0, 0);
        lLowerLegRot = e(1.5, 0, 0);
        rUpperLegRot = e(-1.2, 0, 0);
        rLowerLegRot = e(1.2, 0, 0);
        break;

      case 'BLOCK':
        this.blendSpeed = 20.0;
        bSpineRot = e(0.2, 0, 0); // Hunch over
        bHeadRot = e(-0.2, 0, 0);
        lUpperArmRot = e(-1.2, 0.8, 0);
        lLowerArmRot = e(-2.2, 0, 0);
        rUpperArmRot = e(-1.2, -0.8, 0);
        rLowerArmRot = e(-2.2, 0, 0);
        break;
        
      case 'JUMP':
        this.blendSpeed = 15.0;
        bHipsPos.y = 1.1;
        bSpineRot = e(0.2, 0, 0);
        lUpperLegRot = e(-0.5, 0, 0);
        lLowerLegRot = e(0.8, 0, 0);
        rUpperLegRot = e(-0.2, 0, 0);
        rLowerLegRot = e(0.4, 0, 0);
        break;
        
      case 'FALL':
        this.blendSpeed = 10.0;
        bHipsPos.y = 1.0;
        bSpineRot = e(-0.1, 0, 0);
        lUpperArmRot = e(-2.0, 0, 0);
        rUpperArmRot = e(-2.0, 0, 0);
        lUpperLegRot = e(0.2, 0, 0);
        rUpperLegRot = e(0.2, 0, 0);
        break;

      default:
        this.blendSpeed = 10.0;
        break;
    }

    targets.hips = { position: bHipsPos };
    targets.spine = { rotation: bSpineRot };
    targets.chest = { rotation: bChestRot };
    targets.head = { rotation: bHeadRot };
    
    targets.lShoulder = { rotation: lShoulderRot };
    targets.lUpperArm = { rotation: lUpperArmRot };
    targets.lLowerArm = { rotation: lLowerArmRot };
    
    targets.rShoulder = { rotation: rShoulderRot };
    targets.rUpperArm = { rotation: rUpperArmRot };
    targets.rLowerArm = { rotation: rLowerArmRot };
    
    targets.lUpperLeg = { rotation: lUpperLegRot };
    targets.lLowerLeg = { rotation: lLowerLegRot };
    
    targets.rUpperLeg = { rotation: rUpperLegRot };
    targets.rLowerLeg = { rotation: rLowerLegRot };

    return targets;
  }
}
