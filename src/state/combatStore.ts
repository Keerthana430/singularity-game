import { create } from 'zustand';

export interface CombatEntity {
  id: string;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  isAlive: boolean;
  isStunned: boolean;
  isKnockedDown: boolean;
}

interface CombatStore {
  entities: Record<string, CombatEntity>;
  registerEntity: (id: string, maxHp: number, maxStamina: number) => void;
  applyDamage: (id: string, damage: number) => void;
  consumeStamina: (id: string, amount: number) => boolean;
  recoverStamina: (id: string, amount: number) => void;
  setKnockedDown: (id: string, isDown: boolean) => void;
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  entities: {},
  registerEntity: (id, maxHp, maxStamina) => set(state => ({
    entities: { ...state.entities, [id]: { id, hp: maxHp, maxHp, stamina: maxStamina, maxStamina, isAlive: true, isStunned: false, isKnockedDown: false } }
  })),
  applyDamage: (id, damage) => set(state => {
    const entity = state.entities[id];
    if (!entity || !entity.isAlive) return state;
    const newHp = Math.max(0, entity.hp - damage);
    return {
      entities: {
        ...state.entities,
        [id]: { ...entity, hp: newHp, isAlive: newHp > 0 }
      }
    };
  }),
  consumeStamina: (id, amount) => {
    let success = false;
    set(state => {
      const entity = state.entities[id];
      if (!entity || entity.stamina < amount) return state;
      success = true;
      return { entities: { ...state.entities, [id]: { ...entity, stamina: entity.stamina - amount } } };
    });
    return success;
  },
  recoverStamina: (id, amount) => set(state => {
    const entity = state.entities[id];
    if (!entity) return state;
    return { entities: { ...state.entities, [id]: { ...entity, stamina: Math.min(entity.maxStamina, entity.stamina + amount) } } };
  }),
  setKnockedDown: (id, isDown) => set(state => {
    const entity = state.entities[id];
    if (!entity) return state;
    return {
      entities: { ...state.entities, [id]: { ...entity, isKnockedDown: isDown } }
    };
  })
}));
