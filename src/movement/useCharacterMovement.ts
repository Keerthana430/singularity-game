import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { AnimationController, CharacterState } from '../animation/AnimationController';

export function useCharacterMovement(
  rigidBodyRef: React.RefObject<RapierRigidBody | null>,
  animController: AnimationController
) {
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!rigidBodyRef.current || !animController) return;

    // Do not allow movement if in a locked combat state
    const lockedStates: CharacterState[] = ['PUNCH_JAB', 'PUNCH_CROSS', 'HIT_REACT', 'KNOCKDOWN'];
    if (lockedStates.includes(animController.currentState)) {
      return; // Physics keeps momentum, but player can't steer
    }

    const speed = keys.current['ShiftLeft'] ? 8 : 4;
    const isRunning = speed > 4;
    
    let moveX = 0;
    let moveZ = 0;

    if (keys.current['KeyW']) moveZ -= 1;
    if (keys.current['KeyS']) moveZ += 1;
    if (keys.current['KeyA']) moveX -= 1;
    if (keys.current['KeyD']) moveX += 1;

    // Handle Attack Input (Left Click -> Jab)
    if (keys.current['Space']) {
      // Basic jump jump logic placeholder
      const vel = rigidBodyRef.current.linvel();
      if (Math.abs(vel.y) < 0.1) {
        rigidBodyRef.current.applyImpulse({ x: 0, y: 15, z: 0 }, true);
      }
    }

    // Handle Combat Inputs
    if (keys.current['KeyJ']) { animController.setState('PUNCH_JAB'); return; }
    if (keys.current['KeyK']) { animController.setState('PUNCH_CROSS'); return; }
    if (keys.current['KeyL']) { animController.setState('PUNCH_HOOK'); return; }
    if (keys.current['KeyI']) { animController.setState('PUNCH_UPPERCUT'); return; }
    if (keys.current['KeyO']) { animController.setState('HEAVY_ATTACK'); return; }
    if (keys.current['KeyU']) { animController.setState('JUMP_ATTACK'); return; }
    if (keys.current['KeyB']) { animController.setState('BLOCK'); return; }
    if (keys.current['KeyH']) { animController.setState('HIT_REACT'); return; }
    if (keys.current['KeyN']) { animController.setState('KNOCKDOWN'); return; }

    const direction = new THREE.Vector3(moveX, 0, moveZ).normalize();
    const velocity = rigidBodyRef.current.linvel();

    if (direction.length() > 0) {
      // Calculate target velocity
      const targetVelocity = direction.multiplyScalar(speed);
      
      // Keep existing Y velocity (falling/jumping)
      rigidBodyRef.current.setLinvel({
        x: targetVelocity.x,
        y: velocity.y,
        z: targetVelocity.z
      }, true);

      // Rotate character mesh (Note: rigidBody shouldn't rotate, mesh group should)
      // We will handle rotation separately or snap it for now.
      
      // Update animation state
      if (Math.abs(velocity.y) > 0.5) {
        animController.setState(velocity.y > 0 ? 'JUMP' : 'FALL');
      } else {
        animController.setState(isRunning ? 'RUN' : 'WALK');
      }
    } else {
      // Apply friction manually if no input
      rigidBodyRef.current.setLinvel({
        x: velocity.x * 0.8,
        y: velocity.y,
        z: velocity.z * 0.8
      }, true);

      if (Math.abs(velocity.y) > 0.5) {
        animController.setState(velocity.y > 0 ? 'JUMP' : 'FALL');
      } else {
        animController.setState('IDLE');
      }
    }
  });
}
