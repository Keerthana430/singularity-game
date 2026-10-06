import { create } from 'zustand';

export type CombatState = 'IDLE' | 'PUNCH_L' | 'PUNCH_R' | 'DODGING' | 'BLOCKING' | 'JUMP_ATTACK' | 'HURT' | 'KNOCKDOWN' | 'ATTACKING' | 'CELEBRATING' | 'TAUNTING';
export type MovementState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'SQUAT';

interface CharacterState {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  combatState: CombatState;
  movementState: MovementState;
  takeDamage: (amount: number) => void;
  setCombatState: (state: CombatState) => void;
  setMovementState: (state: MovementState) => void;
  reset: () => void;
}

export const useCharacterState = create<CharacterState>((set) => ({
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  combatState: 'IDLE',
  movementState: 'IDLE',
  takeDamage: (amount) => set((state) => ({ 
    hp: Math.max(0, state.hp - amount),
    combatState: state.hp - amount <= 0 ? 'KNOCKDOWN' : 'HURT'
  })),
  setCombatState: (state) => set({ combatState: state }),
  setMovementState: (state) => set({ movementState: state }),
  reset: () => set({ hp: 100, stamina: 100, combatState: 'IDLE', movementState: 'IDLE' })
}));
