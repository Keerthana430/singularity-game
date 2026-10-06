const fs = require('fs');
const file = 'src/characters/ProceduralCharacter.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Imports
code = code.replace(
  "import { useCharacterAnimation } from './useCharacterAnimation';",
  "import { useCharacterAnimation } from './useCharacterAnimation';\nimport { useCombatStore } from '../state/combatStore';\nimport { ATTACKS, COMBAT_CONFIG, AttackType } from '../combat/attackDefinitions';"
);

// 2. Add store hooks
code = code.replace(
  "const { rapier, world } = useRapier();",
  "const { rapier, world } = useRapier();\n  const registerEntity = useCombatStore(state => state.registerEntity);\n  const applyDamage = useCombatStore(state => state.applyDamage);\n  const consumeStamina = useCombatStore(state => state.consumeStamina);\n\n  useEffect(() => {\n    registerEntity(playerId, 140, 100);\n  }, [playerId, registerEntity]);\n\n  const combatStateRefForHit = useRef(combatState);\n  combatStateRefForHit.current = combatState;"
);

// 3. Replace takeHit
const takeHitRegex = /const takeHit = \([\s\S]*?return newHp;\n\s+\}\);\n\s+\};/;
const newTakeHit = `const takeHit = (dmg: number, dir: THREE.Vector3, isHeavy: boolean = false) => {
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
  };`;
code = code.replace(takeHitRegex, newTakeHit);

// 4. Update triggerPunchAction
code = code.replace(
  /const triggerPunchAction = \(attackType: 'JAB' \| 'CROSS' \| 'HOOK' \| 'UPPERCUT' \| 'JUMP_ATTACK' \| 'SPIN_ATTACK', isLeft: boolean\) => {/g,
  `const triggerPunchAction = (attackType: 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK' | 'SPIN_ATTACK', isLeft: boolean) => {\n      const attackDef = ATTACKS[attackType as AttackType];\n      if (!consumeStamina(playerId, attackDef.staminaCost)) return;`
);

const punchHitRegex = /let dmg = 10;[\s\S]*?userData\.takeHit\(dmg, impactDir\);/g;
code = code.replace(punchHitRegex, `const attackDef = ATTACKS[attackType as AttackType];
              const isHeavy = attackDef.hitReaction === 'HEAVY' || attackDef.hitReaction === 'KNOCKDOWN';
              const impactDir = new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z);
              userData.takeHit(attackDef.damage, impactDir, isHeavy);`);

// Auto combo raycast update
const autoComboRaycastRegex = /if \(userData && userData\.isEnemy && userData\.takeHit\) {\n\s+userData\.takeHit\(dmg, new THREE\.Vector3\(rayDir\.x, rayDir\.y, rayDir\.z\)\);\n\s+}/g;
code = code.replace(autoComboRaycastRegex, `if (userData && userData.isEnemy && userData.takeHit) {
                userData.takeHit(dmg, new THREE.Vector3(rayDir.x, rayDir.y, rayDir.z), dmg > 15);
              }`);

// 5. Remove AI Logic & Add Testing Keys
const aiLogicRegex = /\/\/ AI Logic \(very simple distance closer & random puncher\)[\s\S]*?\}\n\n    \/\/ Apply Velocity directly via physics/g;
const newAiLogic = `// Stamina Regeneration
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

    // Apply Velocity directly via physics`;
code = code.replace(aiLogicRegex, newAiLogic);

// 6. Test keys in useEffect
const useEffectRegex = /useEffect\(\(\) => {\n    if \(inputType === 'ai'\) return;/;
code = code.replace(useEffectRegex, `useEffect(() => {
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
`);

fs.writeFileSync(file, code);
console.log('Refactor complete');
