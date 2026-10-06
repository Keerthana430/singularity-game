export type AttackType = 'JAB' | 'CROSS' | 'HOOK' | 'UPPERCUT' | 'JUMP_ATTACK' | 'SPIN_ATTACK' | 'HEAVY';
export type HitReactionType = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'KNOCKDOWN';

export interface AttackDefinition {
  damage: number;
  staminaCost: number;
  hitReaction: HitReactionType;
  knockbackForce: number;
  stunDuration: number;
}

export const ATTACKS: Record<AttackType, AttackDefinition> = {
  JAB: { damage: 8, staminaCost: 5, hitReaction: 'LIGHT', knockbackForce: 1.0, stunDuration: 0.2 },
  CROSS: { damage: 10, staminaCost: 8, hitReaction: 'LIGHT', knockbackForce: 1.2, stunDuration: 0.25 },
  HOOK: { damage: 12, staminaCost: 10, hitReaction: 'MEDIUM', knockbackForce: 1.8, stunDuration: 0.4 },
  UPPERCUT: { damage: 18, staminaCost: 15, hitReaction: 'HEAVY', knockbackForce: 2.5, stunDuration: 0.6 },
  HEAVY: { damage: 20, staminaCost: 20, hitReaction: 'HEAVY', knockbackForce: 3.0, stunDuration: 0.7 },
  JUMP_ATTACK: { damage: 18, staminaCost: 15, hitReaction: 'HEAVY', knockbackForce: 2.5, stunDuration: 0.6 },
  SPIN_ATTACK: { damage: 35, staminaCost: 25, hitReaction: 'KNOCKDOWN', knockbackForce: 5.0, stunDuration: 1.5 }
};

export const COMBAT_CONFIG = {
  blockedDamageMultiplierLight: 0.2, // 20% damage if light attack blocked
  blockedDamageMultiplierHeavy: 0.4  // 40% damage if heavy attack blocked
};
