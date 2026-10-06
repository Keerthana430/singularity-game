import { useRef } from 'react';
import * as THREE from 'three';
import { useCombatStore } from '../state/combatStore';

export function useAIController(
  playerId: string,
  world: any, 
  rigidBodyRef: React.RefObject<any>,
  combatState: string,
  keysRef: React.MutableRefObject<any>,
  triggerPunchAction: (type: any, isLeft: boolean) => void,
  triggerMatrixDodge: (onComplete: () => void) => void,
  setCombatState: (state: any) => void
) {
  const aiState = useRef({
    nextDecisionTime: 0,
    action: 'IDLE', // IDLE, CHASE, BACK_AWAY
    isBlocking: false,
    blockEndTime: 0
  });

  const updateAI = (dt: number, time: number) => {
    if (!rigidBodyRef.current) return;
    if (combatState === 'KNOCKDOWN' || combatState === 'HURT' || combatState === 'DODGING' || combatState === 'CELEBRATING') {
      keysRef.current.w = false;
      keysRef.current.s = false;
      keysRef.current.a = false;
      keysRef.current.d = false;
      if (keysRef.current.e) {
        keysRef.current.e = false;
      }
      return;
    }

    const myEntity = useCombatStore.getState().entities[playerId];
    if (!myEntity || !myEntity.isAlive) return;

    // Find player
    let playerPos = null as THREE.Vector3 | null;
    let playerIsAttacking = false;
    let playerIsAlive = true;
    const myPos = rigidBodyRef.current.translation();

    world.bodies.forEach((b: any) => {
      const ud = b.userData as any;
      if (ud && ud.isEnemy && ud.playerId !== playerId) {
        const t = b.translation();
        playerPos = new THREE.Vector3(t.x, t.y, t.z);
        if (ud.combatState === 'PUNCH_L' || ud.combatState === 'PUNCH_R' || ud.combatState === 'ATTACKING') {
          playerIsAttacking = true;
        }
        
        // Also check if opponent is dead to stop attacking
        const enemyEntity = useCombatStore.getState().entities[ud.playerId];
        if (enemyEntity && !enemyEntity.isAlive) {
           playerIsAlive = false;
        }
      }
    });

    if (!playerPos || !playerIsAlive) {
        // Stop moving if opponent is dead or missing
        keysRef.current.w = false;
        keysRef.current.s = false;
        return;
    }

    const dist = Math.hypot(playerPos.x - myPos.x, playerPos.z - myPos.z);
    const myStamina = myEntity.stamina;

    // 1. Reactive Defense (Blocking and Dodging)
    if (playerIsAttacking && !aiState.current.isBlocking && combatState === 'IDLE') {
      const reactionRand = Math.random();
      if (reactionRand < 0.15) { // 15% chance to Matrix Dodge
        setCombatState('DODGING');
        triggerMatrixDodge(() => {
          setCombatState('IDLE');
        });
        keysRef.current.w = false;
        keysRef.current.s = false;
        return;
      } else if (reactionRand < 0.35) { // 20% chance to weave back (dodge manually)
        aiState.current.action = 'BACK_AWAY';
        aiState.current.nextDecisionTime = time + 0.4;
        return;
      } else if (reactionRand < 0.85) { // 50% chance to block
        aiState.current.isBlocking = true;
        aiState.current.blockEndTime = time + 0.4 + Math.random() * 0.4; // Hold block for short time
        keysRef.current.e = true;
        setCombatState('BLOCKING');
        keysRef.current.w = false;
        keysRef.current.s = false;
        return;
      }
    }

    // Check if block should end
    if (aiState.current.isBlocking) {
      if (time > aiState.current.blockEndTime || (!playerIsAttacking && Math.random() < 0.1)) {
        aiState.current.isBlocking = false;
        keysRef.current.e = false;
        if (combatState === 'BLOCKING') setCombatState('IDLE');
      } else {
        return;
      }
    }

    // 2. State Machine Decisions (Pacing & Spacing)
    if (time > aiState.current.nextDecisionTime && combatState === 'IDLE') {
      aiState.current.nextDecisionTime = time + 0.4 + Math.random() * 0.4; // Decision loop

      const canAttack = myStamina > 30;
      const isClose = dist <= 1.4; // Melee range
      const isMid = dist > 1.4 && dist <= 3.5;
      const isFar = dist > 3.5;

      if (isFar) {
        // Close the gap
        aiState.current.action = 'CHASE';
      } else if (isMid) {
        if (canAttack && Math.random() > 0.4) {
           // Step in to attack
           aiState.current.action = 'CHASE';
        } else {
           // Wait outside range
           aiState.current.action = 'IDLE';
        }
      } else if (isClose) {
        if (canAttack) {
          // High chance to attack when in range, small chance to weave
          if (Math.random() > 0.25) {
            aiState.current.action = 'IDLE'; 
            
            const attacks: Array<'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT'> = ['JAB', 'CROSS'];
            if (myStamina > 40) attacks.push('HOOK');
            if (myStamina > 60 && Math.random() < 0.5) attacks.push('UPPERCUT'); 
            
            const chosenAttack = attacks[Math.floor(Math.random() * attacks.length)];
            const isLeft = Math.random() > 0.5;
            
            // Add a slight human-like delay before throwing
            setTimeout(() => {
                if (useCombatStore.getState().entities[playerId]?.isAlive) {
                    triggerPunchAction(chosenAttack, isLeft);
                }
            }, 50);
            
            return;
          } else {
            aiState.current.action = 'BACK_AWAY'; // Weave back after engaging
          }
        } else {
          // Low stamina, must disengage
          aiState.current.action = 'BACK_AWAY';
        }
      }
    }

    // 3. Apply Action Movement
    keysRef.current.w = false;
    keysRef.current.s = false;
    keysRef.current.a = false;
    keysRef.current.d = false;

    const distFromCenter = Math.hypot(myPos.x, myPos.z);

    if (aiState.current.action === 'CHASE' && dist > 1.0) {
      keysRef.current.w = true;
    } else if (aiState.current.action === 'BACK_AWAY' && dist < 4.0) {
      // Prevent AI from backing out of the camera frame / arena bounds
      if (distFromCenter < 3.5) {
        keysRef.current.s = true;
      }
    }
  };

  return { updateAI };
}
