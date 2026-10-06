import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { buildProceduralCharacter } from './characterUtils';
import { useCharacterAnimation } from './useCharacterAnimation';
import { useCharacterState } from '../state/characterState';

export function ProceduralCharacter() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const characterRef = useRef<THREE.Group>(null);
  const { setCombatState, combatState } = useCharacterState();
  const [isGrounded, setIsGrounded] = useState(true);
  const { rapier, world } = useRapier();

  // Generate character hierarchy once
  const { group, bones } = useMemo(() => buildProceduralCharacter(), []);

  // Use a generic keyboard controller setup (assuming WASD + space + shift + click)
  // We can just use native event listeners or drei's useKeyboardControls if setup.
  // For simplicity and immediate compatibility with our previous logic, we'll track keys here:
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false, space: false, ctrl: false, e: false });

  const velocityRef = useRef(new THREE.Vector3());
  const speedRef = useRef(0);
  const facingAngleRef = useRef(0);
  const moveDirRef = useRef(new THREE.Vector3(0, 0, 1));
  const dodgeDirRef = useRef(new THREE.Vector3());
  const combatStanceRef = useRef(false);
  const lastKeyTime = useRef<Record<string, number>>({ w: 0, a: 0, s: 0, d: 0 });

  const { triggerPunch, triggerDodge, triggerHurt, triggerKnockdown, triggerGetUp, triggerCelebrate, triggerTaunt, triggerAutoCombo } = useCharacterAnimation(bones, velocityRef.current, isGrounded, combatStanceRef);

  let punchCombo = useRef(0);
  let timeSinceLastPunch = useRef(999);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      
      const now = performance.now();
      if (['w', 'a', 's', 'd'].includes(k)) {
        if (combatState === 'IDLE' && now - lastKeyTime.current[k] < 300) {
          setCombatState('DODGING');
          let dx = k === 'd' ? 1 : k === 'a' ? -1 : 0;
          let dz = k === 's' ? 1 : k === 'w' ? -1 : 0; // W is -1 (forward relative to camera)
          
          dodgeDirRef.current.set(dx, 0, dz);

          triggerDodge(dx, dz, () => {
            setCombatState('IDLE');
            dodgeDirRef.current.set(0, 0, 0);
          });
          lastKeyTime.current[k] = 0;
        } else {
          lastKeyTime.current[k] = now;
        }
      }

      if (k === 'w') keys.current.w = true;
      if (k === 'a') keys.current.a = true;
      if (k === 's') keys.current.s = true;
      if (k === 'd') keys.current.d = true;
      if (e.key === 'Shift') keys.current.shift = true;
      if (e.code === 'Space') keys.current.space = true;
      if (k === 'control') keys.current.ctrl = true;
      if (k === 'e') {
        keys.current.e = true;
        if (combatState === 'IDLE' || combatState === 'BLOCKING') {
          setCombatState('BLOCKING');
        }
      }
      if (k === 'h' && combatState !== 'HURT' && combatState !== 'KNOCKDOWN') {
        setCombatState('HURT');
        triggerHurt(keys.current.shift, () => setCombatState('IDLE'));
      }
      if (k === 'q' && combatState !== 'KNOCKDOWN') {
        setCombatState('KNOCKDOWN');
        triggerKnockdown(() => {
          setCombatState('IDLE');
        });
      }
      if (k === 'c' && combatState === 'IDLE') {
        // Pseudo state for celebrate so we don't punch
        setCombatState('CELEBRATING');
        triggerCelebrate(() => setCombatState('IDLE'));
      }
      if (k === 't' && combatState === 'IDLE') {
        setCombatState('TAUNTING');
        timeSinceLastPunch.current = 0;
        triggerTaunt(() => setCombatState('IDLE'));
      }
      if (k === '1' && combatState === 'IDLE') {
        setCombatState('ATTACKING');
        timeSinceLastPunch.current = 0;
        // Start auto combo
        triggerAutoCombo(() => setCombatState('IDLE'));
        
        // Raycast logic for the auto combo
        const performStrike = (type: string, delay: number, dmg: number) => {
          setTimeout(() => {
            if (!characterRef.current || !rigidBodyRef.current) return;
            const pos = characterRef.current.position.clone();
            const rayOrigin = { x: pos.x, y: pos.y + 1, z: pos.z };
            const q = characterRef.current.quaternion;
            const rayDir = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
            const ray = new rapier.Ray(rayOrigin, rayDir);
            const hit = world.castRay(ray, 1.2, true, undefined, undefined, rigidBodyRef.current.collider(0));
            if (hit) {
              const userData = hit.collider.parent()?.userData as any;
              if (userData && userData.isEnemy && userData.takeHit) {
                userData.takeHit(dmg, new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z));
              }
            }
          }, delay);
        };
        
        performStrike('JAB', 100, 5);
        performStrike('CROSS', 400, 10);
        performStrike('HOOK', 700, 15);
        performStrike('SPIN_ATTACK', 1000, 35);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') keys.current.w = false;
      if (k === 'a') keys.current.a = false;
      if (k === 's') keys.current.s = false;
      if (k === 'd') keys.current.d = false;
      if (e.key === 'Shift') keys.current.shift = false;
      if (e.code === 'Space') keys.current.space = false;
      if (k === 'control') keys.current.ctrl = false;
      if (k === 'e') {
        keys.current.e = false;
        setCombatState('IDLE');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [combatState, setCombatState, triggerDodge, triggerHurt, triggerKnockdown, triggerGetUp, triggerCelebrate, triggerTaunt, triggerAutoCombo, world]);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        if (combatState === 'IDLE') {
          if (timeSinceLastPunch.current > 0.8) punchCombo.current = 0;
          
          let attackType: 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK' = 'JAB';
          let isLeft = true;
          
          if (!isGrounded) {
            attackType = 'JUMP_ATTACK';
            isLeft = false;
          } else if (e.button === 2) { 
            attackType = (keys.current.w || keys.current.s) ? 'UPPERCUT' : 'HOOK';
            isLeft = false;
          } else { 
            if (keys.current.a || keys.current.d) {
              attackType = 'HOOK';
              isLeft = punchCombo.current % 2 === 0;
            } else if (keys.current.s) {
              attackType = 'UPPERCUT';
              isLeft = punchCombo.current % 2 === 0;
            } else {
              // 4-hit auto combo
              if (punchCombo.current === 0) {
                 attackType = 'JAB';
                 isLeft = true;
              } else if (punchCombo.current === 1) {
                 attackType = 'CROSS';
                 isLeft = false;
              } else if (punchCombo.current === 2) {
                 attackType = 'HOOK';
                 isLeft = true;
              } else {
                 attackType = 'SPIN_ATTACK'; // Heavy Combo Finisher
                 isLeft = false;
                 punchCombo.current = -1; // Will reset to 0 below
              }
            }
          }

          setCombatState(isLeft ? 'PUNCH_L' : 'PUNCH_R');
          punchCombo.current++;
          timeSinceLastPunch.current = 0;

          // Schedule Hit Detection
          setTimeout(() => {
            if (rigidBodyRef.current) {
              const trans = rigidBodyRef.current.translation();
              const angle = facingAngleRef.current;
              
              const rayOrigin = new rapier.Vector3(trans.x, trans.y + 0.8, trans.z);
              const rayDir = new rapier.Vector3(Math.sin(angle), 0, Math.cos(angle));
              
              const ray = new rapier.Ray(rayOrigin, rayDir);
              const maxToi = 1.2; // Strike distance
              const solid = true;
              
              // We raycast, ignoring this character's collider
              const hit = world.castRay(
                ray,
                maxToi,
                solid,
                undefined,
                undefined,
                rigidBodyRef.current.collider(0)
              );

              if (hit) {
                const collider = hit.collider;
                // Check if hit object has takeHit
                const userData = collider.parent()?.userData as any;
                if (userData && userData.isEnemy && userData.takeHit) {
                  // Damage based on attack type
                  let dmg = 10;
                  if (attackType === 'HOOK') dmg = 15;
                  if (attackType === 'UPPERCUT') dmg = 18;
                  if (attackType === 'JUMP_ATTACK') dmg = 25;
                  if (attackType === 'SPIN_ATTACK') dmg = 35; // Massive damage finisher
                  if (attackType === 'JAB') dmg = 5;

                  const impactDir = new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z);
                  userData.takeHit(dmg, impactDir);
                }
              }
            }
          }, 100); // 100ms windup before strike hits

          triggerPunch(attackType, isLeft, () => {
            setCombatState('IDLE');
          });
        }
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [combatState, isGrounded, triggerPunch, setCombatState]);

  useFrame((state, dt) => {
    timeSinceLastPunch.current += dt;

    if (!rigidBodyRef.current || !characterRef.current) return;

    const MOVE = {
      walkSpeed: 2.8,
      runSpeed: 5.5,
      accel: 12.0,
      decel: 8.0,
      jumpForce: 8.0
    };

    let inputX = 0;
    let inputZ = 0;
    if (keys.current.w) inputZ -= 1;
    if (keys.current.s) inputZ += 1;
    if (keys.current.a) inputX -= 1;
    if (keys.current.d) inputX += 1;

    const isMoving = inputX !== 0 || inputZ !== 0;
    const isPunching = combatState !== 'IDLE';
    const targetSpeed = (isMoving && !isPunching) ? (keys.current.shift ? MOVE.runSpeed : MOVE.walkSpeed) : 0;

    if (isMoving) {
      speedRef.current = Math.min(speedRef.current + MOVE.accel * dt, targetSpeed);
    } else {
      speedRef.current = Math.max(speedRef.current - MOVE.decel * dt, 0);
    }

    if (isMoving && !isPunching) {
      const cam = state.camera;
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

      moveDirRef.current.copy(moveDir);

      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      
      let diff = targetAngle - facingAngleRef.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      if (combatStanceRef.current) {
        let enemyPos: THREE.Vector3 | null = null;
        let minDist = 10.0;
        const charPos = rigidBodyRef.current.translation();
        world.bodies.forEach(b => {
          const ud = b.userData as any;
          if (ud && ud.isEnemy) {
            const et = b.translation();
            const dist = Math.hypot(charPos.x - et.x, charPos.z - et.z);
            if (dist < minDist) {
              minDist = dist;
              enemyPos = new THREE.Vector3(et.x, et.y, et.z);
            }
          }
        });
        
        if (enemyPos) {
           const lockAngle = Math.atan2(enemyPos!.x - charPos.x, enemyPos!.z - charPos.z);
           let lockDiff = lockAngle - facingAngleRef.current;
           while (lockDiff < -Math.PI) lockDiff += Math.PI * 2;
           while (lockDiff > Math.PI) lockDiff -= Math.PI * 2;
           facingAngleRef.current += lockDiff * 10.0 * dt;
        } else {
           facingAngleRef.current += diff * 15.0 * dt;
        }
      } else {
        facingAngleRef.current += diff * 15.0 * dt;
      }
    }

    characterRef.current.rotation.y = facingAngleRef.current;

    const currentVel = rigidBodyRef.current.linvel();
    let desiredVelocityX = moveDirRef.current.x * speedRef.current;
    let desiredVelocityZ = moveDirRef.current.z * speedRef.current;
    
    // Add dodge velocity if active
    if (combatState === 'DODGING') {
      const cam = state.camera;
      const camForward = new THREE.Vector3();
      cam.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      const camRight = new THREE.Vector3();
      camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

      const dDir = new THREE.Vector3()
        .addScaledVector(camRight, dodgeDirRef.current.x)
        .addScaledVector(camForward, -dodgeDirRef.current.z)
        .normalize();

      const dodgeSpeed = 12.0;
      desiredVelocityX += dDir.x * dodgeSpeed;
      desiredVelocityZ += dDir.z * dodgeSpeed;
    }
    
    // Jump
    let jumpVelocity = currentVel.y;
    // Ground check raycast approximation
    const translation = rigidBodyRef.current.translation();
    if (translation.y < 1.1) {
      if (!isGrounded) setIsGrounded(true);
    } else {
      if (isGrounded) setIsGrounded(false);
    }

    if (keys.current.space && isGrounded) {
      jumpVelocity = MOVE.jumpForce;
      setIsGrounded(false);
    }

    // Determine combat stance
    let nearEnemy = false;
    world.bodies.forEach(b => {
      const ud = b.userData as any;
      if (ud && ud.isEnemy) {
        const et = b.translation();
        const dist = Math.hypot(translation.x - et.x, translation.z - et.z);
        if (dist < 4.0) nearEnemy = true;
      }
    });
    // Fallback if userData is on the collider's parent
    if (!nearEnemy) {
      world.colliders.forEach(c => {
        const ud = c.parent()?.userData as any;
        if (ud && ud.isEnemy) {
          const et = c.translation();
          const dist = Math.hypot(translation.x - et.x, translation.z - et.z);
          if (dist < 4.0) nearEnemy = true;
        }
      });
    }

    combatStanceRef.current = nearEnemy || timeSinceLastPunch.current < 5.0;

    // Apply Velocity directly via physics
    rigidBodyRef.current.setLinvel({
      x: desiredVelocityX,
      y: jumpVelocity,
      z: desiredVelocityZ
    }, true);

    // Update refs for animation loop
    velocityRef.current.set(desiredVelocityX, jumpVelocity, desiredVelocityZ);
  });

  return (
    <RigidBody ref={rigidBodyRef} colliders={false} enabledRotations={[false, false, false]}>
      <CapsuleCollider args={[0.4, 0.4]} position={[0, 0.8, 0]} />
      <primitive ref={characterRef} object={group} />
    </RigidBody>
  );
}
