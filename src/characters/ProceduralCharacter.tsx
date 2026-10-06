'use client';
import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { buildProceduralCharacter } from './characterUtils';
import { useCharacterAnimation } from './useCharacterAnimation';
import { useCombatStore } from '../state/combatStore';
import { ATTACKS, COMBAT_CONFIG, AttackType } from '../combat/attackDefinitions';

export type CombatState = 'IDLE' | 'PUNCH_L' | 'PUNCH_R' | 'DODGING' | 'BLOCKING' | 'JUMP_ATTACK' | 'HURT' | 'KNOCKDOWN' | 'ATTACKING' | 'CELEBRATING' | 'TAUNTING';

export interface ProceduralCharacterProps {
  playerId?: string;
  inputType?: 'player1' | 'player2' | 'ai';
  onHpChange?: (hp: number) => void;
  onKnockdown?: () => void;
  position?: [number, number, number];
}

export function ProceduralCharacter({ playerId = 'player1', inputType = 'player1', onHpChange, onKnockdown, position = [0, 0, 0] }: ProceduralCharacterProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const characterRef = useRef<THREE.Group>(null);
  const [combatState, setCombatState] = useState<CombatState>('IDLE');
  const [hp, setHp] = useState(100);
  const [isGrounded, setIsGrounded] = useState(true);
  const { rapier, world } = useRapier();
  const registerEntity = useCombatStore(state => state.registerEntity);
  const applyDamage = useCombatStore(state => state.applyDamage);
  const consumeStamina = useCombatStore(state => state.consumeStamina);

  useEffect(() => {
    registerEntity(playerId, 140, 100);
  }, [playerId, registerEntity]);

  const combatStateRefForHit = useRef(combatState);
  combatStateRefForHit.current = combatState;

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

  const { triggerPunch, triggerDodge, triggerHurt, triggerKnockdown, triggerGetUp, triggerCelebrate, triggerTaunt, triggerAutoCombo } = useCharacterAnimation(bones, velocityRef.current, isGrounded, combatStanceRef, combatState);

  let punchCombo = useRef(0);
  let timeSinceLastPunch = useRef(999);
  let pointerDownTime = useRef(0);
  let pointerDownPos = useRef({ x: 0, y: 0 });

  const takeHit = (dmg: number, dir: THREE.Vector3, isHeavy: boolean = false) => {
    const currentState = combatStateRefForHit.current;
    if (currentState === 'KNOCKDOWN' || currentState === 'HURT' || currentState === 'DODGING') return;
    
    let finalDmg = dmg;
    if (currentState === 'BLOCKING') {
      finalDmg = dmg * (isHeavy ? COMBAT_CONFIG.blockedDamageMultiplierHeavy : COMBAT_CONFIG.blockedDamageMultiplierLight);
    }
    
    applyDamage(playerId, finalDmg);
    
    // Check state from store immediately
    const entity = useCombatStore.getState().entities[playerId];
    const hp = entity ? entity.hp : 100;
    
    if (hp <= 0) {
      setCombatState('KNOCKDOWN');
      triggerKnockdown(() => {
        if (onKnockdown) onKnockdown();
      });
    } else {
      if (currentState !== 'BLOCKING') {
        setCombatState('HURT');
        triggerHurt(false, () => setCombatState('IDLE'));
      }
    }
  };

  useEffect(() => {
    if (inputType === 'ai') {
      const handleTestKeys = (e: KeyboardEvent) => {
        if (e.code === 'Numpad1' || (e.key === '1' && e.altKey)) { // Alt+1 or Numpad1: Take hit
          takeHit(10, new THREE.Vector3(0,0,1), false);
        }
        if (e.code === 'Numpad2' || (e.key === '2' && e.altKey)) { // Alt+2 or Numpad2: Block
          if (combatStateRefForHit.current !== 'BLOCKING') {
            setCombatState('BLOCKING');
          } else {
            setCombatState('IDLE');
          }
        }
      };
      window.addEventListener('keydown', handleTestKeys);
      return () => window.removeEventListener('keydown', handleTestKeys);
    }
 // AI doesn't use keyboard

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      
      const now = performance.now();
      
      // Player 1 uses WASD, Player 2 uses Arrow Keys
      const isP1 = inputType === 'player1';
      const kUp = isP1 ? 'w' : 'arrowup';
      const kDown = isP1 ? 's' : 'arrowdown';
      const kLeft = isP1 ? 'a' : 'arrowleft';
      const kRight = isP1 ? 'd' : 'arrowright';

      if ([kUp, kLeft, kDown, kRight].includes(k)) {
        if (combatState === 'IDLE' && now - lastKeyTime.current[k] < 300) {
          setCombatState('DODGING');
          let dx = k === kRight ? 1 : k === kLeft ? -1 : 0;
          let dz = k === kDown ? 1 : k === kUp ? -1 : 0; 
          
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

      if (k === kUp) keys.current.w = true;
      if (k === kLeft) keys.current.a = true;
      if (k === kDown) keys.current.s = true;
      if (k === kRight) keys.current.d = true;
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
                userData.takeHit(dmg, new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z), dmg > 15);
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
      const isP1 = inputType === 'player1';
      const kUp = isP1 ? 'w' : 'arrowup';
      const kDown = isP1 ? 's' : 'arrowdown';
      const kLeft = isP1 ? 'a' : 'arrowleft';
      const kRight = isP1 ? 'd' : 'arrowright';

      if (k === kUp) keys.current.w = false;
      if (k === kLeft) keys.current.a = false;
      if (k === kDown) keys.current.s = false;
      if (k === kRight) keys.current.d = false;
      if (e.key === 'Shift') keys.current.shift = false;
      if (e.code === 'Space') keys.current.space = false;
      if (k === 'control') keys.current.ctrl = false;
      if (k === 'e') {
        keys.current.e = false;
        if (combatState === 'BLOCKING') setCombatState('IDLE');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [combatState, inputType, triggerDodge, triggerHurt, triggerKnockdown, triggerGetUp, triggerCelebrate, triggerTaunt, triggerAutoCombo, world]);

  useEffect(() => {
    if (inputType === 'ai') return; // AI doesn't use mouse
    
    // Player 2 uses Numpad instead of Mouse
    if (inputType === 'player2') {
      const handleP2Keys = (e: KeyboardEvent) => {
        if (combatState !== 'IDLE' || !combatStanceRef.current) return;
        
        let attackType: CombatState | null = null;
        let isLeft = true;
        let pType: 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK' = 'JAB';

        if (e.key === '1') { // Light attack
           if (keys.current.a || keys.current.d) pType = 'HOOK';
           else if (punchCombo.current % 2 === 0) pType = 'JAB';
           else { pType = 'CROSS'; isLeft = false; }
        } else if (e.key === '2') { // Heavy attack
           pType = 'UPPERCUT';
           isLeft = false;
        }

        if (pType !== 'JAB' || e.key === '1') {
          triggerPunchAction(pType, isLeft);
        }
      };
      window.addEventListener('keydown', handleP2Keys);
      return () => window.removeEventListener('keydown', handleP2Keys);
    }

    // Player 1 uses Mouse
    const handlePointerDown = (e: MouseEvent) => {
      pointerDownTime.current = performance.now();
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const clickDuration = performance.now() - pointerDownTime.current;
      const dx = e.clientX - pointerDownPos.current.x;
      const dy = e.clientY - pointerDownPos.current.y;
      const distanceSq = dx * dx + dy * dy;
      
      // Threshold: ~10px distance squared is 100
      if (distanceSq > 100) return;
      
      // Safety threshold for long presses that aren't dragged but held for an unusual amount of time
      if (clickDuration > 400) return;
      
      // Only allow mouse attacks when explicitly locked onto an enemy
      if (!combatStanceRef.current) return;

      if (e.button === 0 || e.button === 2) {
        if (combatState === 'IDLE') {
          if (timeSinceLastPunch.current > 0.8) punchCombo.current = 0;
          
          let attackType: 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK' | 'SPIN_ATTACK' = 'JAB';
          let isLeft = true;
          
          if (!isGrounded) {
            attackType = 'JUMP_ATTACK';
            isLeft = false;
          } else if (e.button === 2) { 
            attackType = 'UPPERCUT';
            isLeft = false;
          } else { 
            if (keys.current.a || keys.current.d) {
              attackType = 'HOOK';
              isLeft = punchCombo.current % 2 === 0;
            } else if (keys.current.s) {
              attackType = 'UPPERCUT';
              isLeft = punchCombo.current % 2 === 0;
            } else {
              if (punchCombo.current % 2 === 0) {
                 attackType = 'JAB';
                 isLeft = true;
              } else {
                 attackType = 'CROSS';
                 isLeft = false;
              }
            }
          }
          triggerPunchAction(attackType, isLeft);
        }
      }
    };
    
    const triggerPunchAction = (attackType: 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK' | 'SPIN_ATTACK', isLeft: boolean) => {
      const attackDef = ATTACKS[attackType as AttackType];
      if (!consumeStamina(playerId, attackDef.staminaCost)) return;
      setCombatState(isLeft ? 'PUNCH_L' : 'PUNCH_R');
      punchCombo.current++;
      timeSinceLastPunch.current = 0;

      setTimeout(() => {
        if (rigidBodyRef.current) {
          const trans = rigidBodyRef.current.translation();
          const angle = facingAngleRef.current;
          
          const rayOrigin = new rapier.Vector3(trans.x, trans.y + 0.8, trans.z);
          const rayDir = new rapier.Vector3(Math.sin(angle), 0, Math.cos(angle));
          
          const ray = new rapier.Ray(rayOrigin, rayDir);
          const hit = world.castRay(ray, 1.2, true, undefined, undefined, rigidBodyRef.current.collider(0));

          if (hit) {
            const collider = hit.collider;
            const userData = collider.parent()?.userData as any;
            if (userData && userData.isEnemy && userData.takeHit && userData.playerId !== playerId) {
              const attackDef = ATTACKS[attackType as AttackType];
              const isHeavy = attackDef.hitReaction === 'HEAVY' || attackDef.hitReaction === 'KNOCKDOWN';
              const impactDir = new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z);
              userData.takeHit(attackDef.damage, impactDir, isHeavy);
            }
          }
        }
      }, 100); 

      triggerPunch(attackType, isLeft, () => {
        setCombatState('IDLE');
      });
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [combatState, isGrounded, inputType, triggerPunch, playerId, world]);

  useFrame((state, dt) => {
    timeSinceLastPunch.current += dt;

    if (!rigidBodyRef.current || !characterRef.current) return;

    const MOVE = {
      walkSpeed: 2.8,
      runSpeed: 5.5,
      accel: 12.0,
      decel: 8.0,
      jumpForce: 4.0
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

    let targetFacingAngle = facingAngleRef.current;
    
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
      targetFacingAngle = Math.atan2(moveDir.x, moveDir.z);
    }

    let lockedOn = false;
    let enemyPos: THREE.Vector3 | null = null;
    let minDist = 4.0; // Strict lock-on radius
    const charPos = rigidBodyRef.current.translation();
    
    world.bodies.forEach(b => {
      const ud = b.userData as any;
      if (ud && ud.isEnemy && ud.playerId !== playerId) {
        const et = b.translation();
        const dist = Math.hypot(charPos.x - et.x, charPos.z - et.z);
        if (dist <= minDist) {
          minDist = dist;
          enemyPos = new THREE.Vector3(et.x, et.y, et.z);
        }
      }
    });
    
    if (enemyPos) {
        const ep = enemyPos as THREE.Vector3;
        targetFacingAngle = Math.atan2(ep.x - charPos.x, ep.z - charPos.z);
        lockedOn = true;
    }

    if (lockedOn || (isMoving && !isPunching)) {
        let diff = targetFacingAngle - facingAngleRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        const turnSpeed = lockedOn ? 20.0 : 15.0; 
        facingAngleRef.current += diff * turnSpeed * dt;
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
      if (ud && ud.isEnemy && ud.playerId !== playerId) {
        const et = b.translation();
        const dist = Math.hypot(translation.x - et.x, translation.z - et.z);
        if (dist <= 4.0) nearEnemy = true;
      }
    });
    // Fallback if userData is on the collider's parent
    if (!nearEnemy) {
      world.colliders.forEach(c => {
        const ud = c.parent()?.userData as any;
        if (ud && ud.isEnemy && ud.playerId !== playerId) {
          const et = c.translation();
          const dist = Math.hypot(translation.x - et.x, translation.z - et.z);
          if (dist <= 4.0) nearEnemy = true;
        }
      });
    }

    combatStanceRef.current = nearEnemy;

    // Stamina Regeneration
    if (timeSinceLastPunch.current > 1.0) {
      useCombatStore.getState().recoverStamina(playerId, 15 * dt);
    }
    
    // AI Input (Testing dummy)
    if (inputType === 'ai') {
       // Just stand still
       keys.current.w = false;
       keys.current.s = false;
       keys.current.a = false;
       keys.current.d = false;
    }

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
    <RigidBody 
      ref={rigidBodyRef} 
      position={position}
      colliders={false} 
      enabledRotations={[false, false, false]}
      userData={{ isEnemy: true, playerId, takeHit }}
    >
      <CapsuleCollider args={[0.4, 0.4]} position={[0, 0.8, 0]} />
      <primitive ref={characterRef} object={group} />
      {inputType === 'ai' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[3.9, 4.0, 64]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </RigidBody>
  );
}
