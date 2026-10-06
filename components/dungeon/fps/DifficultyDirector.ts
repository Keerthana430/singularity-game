// components/dungeon/fps/DifficultyDirector.ts
// Central Director continuously evaluating survival time, kills, and player threat
// Spawns recognizable Slimes, Skeletons (Ranged), Golems, and Void Liches

import { THREAT_TIERS, ThreatTierDef, FPSEnemyEntity } from './types';

export interface DirectorEvaluation {
  currentTier: ThreatTierDef;
  tierIndex: number;
  healthMultiplier: number;
  damageMultiplier: number;
  spawnInterval: number;
  eliteChance: number;
  maxActiveEnemies: number;
  threatProgress: number; // 0 to 1 progress within tier
}

export function evaluateDirector(survivalSeconds: number, kills: number): DirectorEvaluation {
  let tierIndex = 0;
  for (let i = THREAT_TIERS.length - 1; i >= 0; i--) {
    if (survivalSeconds >= THREAT_TIERS[i].minSeconds) {
      tierIndex = i;
      break;
    }
  }

  const currentTier = THREAT_TIERS[tierIndex];
  const nextTier = THREAT_TIERS[tierIndex + 1];

  let threatProgress = 1;
  if (nextTier) {
    const range = nextTier.minSeconds - currentTier.minSeconds;
    const elapsed = survivalSeconds - currentTier.minSeconds;
    threatProgress = Math.min(1, Math.max(0, elapsed / range));
  }

  const killScaling = kills * 0.012;
  const healthMultiplier = currentTier.enemyHealthMultiplier + killScaling;
  const damageMultiplier = currentTier.enemyDamageMultiplier + (survivalSeconds / 360) * 0.25;
  const spawnInterval = Math.max(2.0, currentTier.spawnRateSeconds - kills * 0.035);
  const eliteChance = Math.min(0.65, currentTier.eliteChance + kills * 0.006);
  const maxActiveEnemies = Math.min(7, 4 + Math.floor(survivalSeconds / 110));

  return {
    currentTier,
    tierIndex,
    healthMultiplier,
    damageMultiplier,
    spawnInterval,
    eliteChance,
    maxActiveEnemies,
    threatProgress,
  };
}

// 6 Perimeter portal spawn coordinates in the expanded 42x42 ruin
export const SPAWN_PORTALS: [number, number, number][] = [
  [-17.5, 0, -15.0],
  [17.5, 0, -15.0],
  [-17.5, 0, 15.0],
  [17.5, 0, 15.0],
  [0, 0, -18.5],
  [0, 0, 18.5],
];

export function generateSurvivalEnemy(
  id: string,
  survivalSeconds: number,
  kills: number,
  playerPos: [number, number, number]
): FPSEnemyEntity {
  const evalState = evaluateDirector(survivalSeconds, kills);
  const isElite = Math.random() < evalState.eliteChance;

  // Choose a spawn portal that is at least 8m away from player
  let bestPortal = SPAWN_PORTALS[0];
  let bestDist = 0;
  for (const portal of SPAWN_PORTALS) {
    const d = Math.hypot(portal[0] - playerPos[0], portal[2] - playerPos[2]);
    if (d > 7.5 && (bestDist === 0 || d > bestDist)) {
      bestPortal = portal;
      bestDist = d;
    }
  }

  // Archetypes pool: Slimes, Skeletons (Ranged), Golems, and Void Liches (Elite)
  let archetypes: ('slime' | 'skeleton' | 'golem' | 'elite')[] = ['slime', 'skeleton'];
  if (evalState.tierIndex >= 1) archetypes = ['slime', 'skeleton', 'golem'];
  if (evalState.tierIndex >= 2) archetypes = ['slime', 'skeleton', 'skeleton', 'golem'];
  if (isElite || evalState.tierIndex >= 3) archetypes = ['skeleton', 'golem', 'elite'];

  const archetype = isElite ? 'elite' : archetypes[Math.floor(Math.random() * archetypes.length)];

  let baseHp = 110;
  let baseAtk = 20;
  let baseSpeed = 4.2;
  let baseRange = 2.4;
  let color = '#10B981';
  let name = 'Acid Slime';
  let isRanged = false;

  if (archetype === 'slime') {
    name = isElite ? 'Apex King Slime' : 'Acid Slime';
    baseHp = 95;
    baseAtk = 18;
    baseSpeed = 5.2; // Fast bouncy rusher
    baseRange = 2.2;
    color = '#22C55E';
    isRanged = false;
  } else if (archetype === 'skeleton') {
    name = isElite ? 'Dead-Eye Skeleton' : 'Skeleton Archer';
    baseHp = 135;
    baseAtk = 26;
    baseSpeed = 3.2; // Maintains distance
    baseRange = 9.5; // Long range attacks!
    color = '#E2E8F0';
    isRanged = true;
  } else if (archetype === 'golem') {
    name = isElite ? 'Colossus Golem' : 'Rune Stone Golem';
    baseHp = 340;
    baseAtk = 38;
    baseSpeed = 2.8; // Heavy slow tank
    baseRange = 2.8;
    color = '#F59E0B';
    isRanged = false;
  } else if (archetype === 'elite') {
    name = 'Void Lich Necromancer';
    baseHp = 480;
    baseAtk = 45;
    baseSpeed = 3.6;
    baseRange = 8.5; // Ranged spellcaster
    color = '#EF4444';
    isRanged = true;
  }

  const finalHp = Math.round(baseHp * evalState.healthMultiplier);
  const finalShield = isElite ? Math.round(180 * evalState.healthMultiplier) : 0;
  const finalAtk = Math.round(baseAtk * evalState.damageMultiplier);

  // Slight random offset from portal center
  const ox = (Math.random() - 0.5) * 2.0;
  const oz = (Math.random() - 0.5) * 2.0;

  return {
    id,
    name,
    archetype,
    isRanged,
    position: [bestPortal[0] + ox, 0, bestPortal[2] + oz],
    rotationY: Math.random() * Math.PI * 2,
    hp: finalHp,
    maxHp: finalHp,
    shield: finalShield,
    maxShield: finalShield,
    attack: finalAtk,
    defense: 25,
    speed: baseSpeed,
    range: baseRange,
    color,
    aiState: 'idle',
    stateTimer: Math.random() * 0.5,
    telegraphProgress: 0,
    hitFlashTimer: 0,
  };
}
