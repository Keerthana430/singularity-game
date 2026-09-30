// lib/battleEngine.ts
// Pure, deterministic combat simulation engine decoupled from Three.js rendering.
// Executes headless on both client and server with a seeded PRNG (mulberry32).

import { AvatarConfig } from '@/types/avatar';
import { calculateAvatarStats, AvatarCombatStats } from '@/lib/statsCalculator';

// ─── Seeded Pseudo-Random Number Generator (Mulberry32) ─────────────────────

export function createSeededRng(seed: number) {
  let s = Math.floor(Math.abs(seed)) || 123456789;
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Weapon Affinity Advantage System ───────────────────────────────────────
// Blade/Katana -> counters Arcane/Staves (+20%)
// Arcane/Staves -> counters Heavy Hammer/Bastion (+20%)
// Heavy Hammer/Bastion -> counters Blade/Katana (+20%)

export type WeaponArchetype = 'blade' | 'hammer' | 'staff' | 'dagger' | 'bionic';

export function getWeaponArchetype(weaponId?: string): WeaponArchetype {
  const w = (weaponId || '').toLowerCase();
  if (w.includes('hammer')) return 'hammer';
  if (w.includes('staff')) return 'staff';
  if (w.includes('dagger')) return 'dagger';
  if (w.includes('katana') || w.includes('blade') || w.includes('sword')) return 'blade';
  return 'bionic';
}

export function calculateWeaponAdvantage(attackerWep: WeaponArchetype, defenderWep: WeaponArchetype): number {
  if (attackerWep === 'blade' && defenderWep === 'staff') return 1.20;
  if (attackerWep === 'staff' && defenderWep === 'hammer') return 1.20;
  if (attackerWep === 'hammer' && defenderWep === 'blade') return 1.20;
  return 1.0;
}

// ─── Battle Event Log Interfaces ────────────────────────────────────────────

export type CombatActionType = 'slash' | 'magic' | 'heavy' | 'rapid' | 'shield' | 'overdrive';

export interface BattleEvent {
  turn: number;
  attackerId: 'avatarA' | 'avatarB';
  attackerName: string;
  defenderId: 'avatarA' | 'avatarB';
  defenderName: string;
  action: CombatActionType;
  actionName: string;
  damage: number;
  isCrit: boolean;
  isEvaded: boolean;
  attackerHpAfter: number;
  defenderHpAfter: number;
  overdriveCharge: number;
  message: string;
}

export interface BattleSimulationResult {
  seed: number;
  totalTurns: number;
  winnerId: 'avatarA' | 'avatarB';
  winnerName: string;
  loserName: string;
  avatarAFinalHp: number;
  avatarBFinalHp: number;
  avatarAMaxHp: number;
  avatarBMaxHp: number;
  totalDamageDealtA: number;
  totalDamageDealtB: number;
  totalCritsA: number;
  totalCritsB: number;
  scoreA: number;
  scoreB: number;
  events: BattleEvent[];
}

/**
 * Score Formula:
 * Score = (isWin ? 1000 : 200)
 *       + round((RemainingHP / MaxHP) * 500)
 *       + max(0, 15 - turns) * 40
 *       + (crits * 50)
 */
export function calculateBattleScore(
  isWin: boolean,
  remainingHp: number,
  maxHp: number,
  turns: number,
  crits: number
): number {
  const winBonus = isWin ? 1000 : 200;
  const hpBonus = Math.round((Math.max(0, remainingHp) / Math.max(1, maxHp)) * 500);
  const speedBonus = Math.max(0, 15 - turns) * 40;
  const critBonus = crits * 50;
  return winBonus + hpBonus + speedBonus + critBonus;
}

// ─── Pure Deterministic Simulation Function ─────────────────────────────────

export function simulateBattle(
  avatarA: AvatarConfig,
  avatarB: AvatarConfig,
  seed: number = 42
): BattleSimulationResult {
  const rng = createSeededRng(seed);

  const statsA: AvatarCombatStats = calculateAvatarStats(avatarA);
  const statsB: AvatarCombatStats = calculateAvatarStats(avatarB);

  const wepA = getWeaponArchetype(avatarA.weapon);
  const wepB = getWeaponArchetype(avatarB.weapon);

  const advA = calculateWeaponAdvantage(wepA, wepB);
  const advB = calculateWeaponAdvantage(wepB, wepA);

  let hpA = statsA.maxHp;
  let hpB = statsB.maxHp;

  let overdriveA = 20;
  let overdriveB = 20;

  let totalDmgA = 0;
  let totalDmgB = 0;
  let critsA = 0;
  let critsB = 0;

  const events: BattleEvent[] = [];
  const MAX_TURNS = 30;
  let turn = 1;

  while (hpA > 0 && hpB > 0 && turn <= MAX_TURNS) {
    // Speed Initiative determines who strikes first on this round
    const speedRollA = statsA.agility + rng() * 10;
    const speedRollB = statsB.agility + rng() * 10;

    const firstIsA = speedRollA >= speedRollB;
    const order: ('A' | 'B')[] = firstIsA ? ['A', 'B'] : ['B', 'A'];

    for (const actor of order) {
      if (hpA <= 0 || hpB <= 0) break;

      const isA = actor === 'A';
      const attackerName = isA ? avatarA.name : avatarB.name;
      const defenderName = isA ? avatarB.name : avatarA.name;
      const attackerStats = isA ? statsA : statsB;
      const defenderStats = isA ? statsB : statsA;
      const wepAdv = isA ? advA : advB;
      const curOverdrive = isA ? overdriveA : overdriveB;

      // Decide tactical action
      let action: CombatActionType = 'slash';
      let actionName = 'Photon Blade Slash';

      if (curOverdrive >= 100) {
        action = 'overdrive';
        actionName = 'Singularity Overdrive Finisher';
        if (isA) overdriveA = 0;
        else overdriveB = 0;
      } else if (attackerStats.magic > attackerStats.power) {
        action = 'magic';
        actionName = 'Arcane Element Surge';
      } else if (wepA === 'hammer' || wepB === 'hammer') {
        action = 'heavy';
        actionName = 'Rune Maul Smash';
      } else if (wepA === 'dagger' || wepB === 'dagger') {
        action = 'rapid';
        actionName = 'Shadow Twin Flurry';
      }

      // Check Evasion
      const evasionCheck = rng() * 100;
      const isEvaded = evasionCheck < defenderStats.evasionRate;

      // Check Critical
      const critBonus = action === 'overdrive' ? 40 : 0;
      const critCheck = rng() * 100;
      const isCrit = !isEvaded && critCheck < attackerStats.criticalRate + critBonus;

      // Calculate Damage
      let damage = 0;
      if (!isEvaded) {
        let rawAtk = action === 'magic' ? attackerStats.magic * 2.2 : attackerStats.power * 2.1;
        if (action === 'overdrive') rawAtk *= 1.75;
        if (action === 'rapid') rawAtk *= 1.25;

        const effectiveDef = defenderStats.defense * 0.65;
        const baseDmg = Math.max(25, rawAtk - effectiveDef);
        const variance = 0.9 + rng() * 0.2; // 0.9 to 1.1x

        damage = Math.round(baseDmg * wepAdv * variance);
        if (isCrit) {
          damage = Math.round(damage * 1.6);
        }
      }

      // Apply Damage
      if (isA) {
        hpB = Math.max(0, hpB - damage);
        totalDmgA += damage;
        if (isCrit) critsA++;
        if (action !== 'overdrive') overdriveA = Math.min(100, overdriveA + 25);
      } else {
        hpA = Math.max(0, hpA - damage);
        totalDmgB += damage;
        if (isCrit) critsB++;
        if (action !== 'overdrive') overdriveB = Math.min(100, overdriveB + 25);
      }

      const logMsg = isEvaded
        ? `${defenderName} agilely dodged ${attackerName}'s ${actionName}!`
        : isCrit
        ? `CRITICAL STRIKE! ${attackerName} connected ${actionName} for ${damage} massive damage!`
        : `${attackerName} executed ${actionName} for ${damage} damage against ${defenderName}.`;

      events.push({
        turn,
        attackerId: isA ? 'avatarA' : 'avatarB',
        attackerName,
        defenderId: isA ? 'avatarB' : 'avatarA',
        defenderName,
        action,
        actionName,
        damage,
        isCrit,
        isEvaded,
        attackerHpAfter: isA ? hpA : hpB,
        defenderHpAfter: isA ? hpB : hpA,
        overdriveCharge: isA ? overdriveA : overdriveB,
        message: logMsg,
      });
    }

    turn++;
  }

  const winnerId: 'avatarA' | 'avatarB' = hpA >= hpB ? 'avatarA' : 'avatarB';
  const winnerName = winnerId === 'avatarA' ? avatarA.name : avatarB.name;
  const loserName = winnerId === 'avatarA' ? avatarB.name : avatarA.name;

  const scoreA = calculateBattleScore(winnerId === 'avatarA', hpA, statsA.maxHp, turn - 1, critsA);
  const scoreB = calculateBattleScore(winnerId === 'avatarB', hpB, statsB.maxHp, turn - 1, critsB);

  return {
    seed,
    totalTurns: turn - 1,
    winnerId,
    winnerName,
    loserName,
    avatarAFinalHp: hpA,
    avatarBFinalHp: hpB,
    avatarAMaxHp: statsA.maxHp,
    avatarBMaxHp: statsB.maxHp,
    totalDamageDealtA: totalDmgA,
    totalDamageDealtB: totalDmgB,
    totalCritsA: critsA,
    totalCritsB: critsB,
    scoreA,
    scoreB,
    events,
  };
}
