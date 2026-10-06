// components/dungeon/fps/types.ts
// Sci-Fi First-Person Endless Survival Dungeon Shooter Type Definitions

export type WeaponId = 'pulse_rifle' | 'energy_pistol' | 'plasma_shotgun' | 'void_railgun';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: 'primary' | 'secondary' | 'heavy' | 'exotic';
  fireRate: number; // seconds between shots
  damage: number;
  critMultiplier: number;
  magSize: number;
  reserveMax: number;
  reloadTime: number; // in seconds
  spread: number; // rad spread
  recoilKickZ: number; // backward kick
  recoilPitchX: number; // upward kick
  pellets: number; // 1 for hitscan rifles/pistols, 8 for shotgun
  color: string;
  emissive: string;
  soundMethod: 'playRifleShot' | 'playPistolShot' | 'playShotgunShot';
  description: string;
}

export const WEAPON_CONFIGS: Record<WeaponId, WeaponDef> = {
  pulse_rifle: {
    id: 'pulse_rifle',
    name: 'Pulse Rifle MK-IV',
    category: 'primary',
    fireRate: 0.11,
    damage: 28,
    critMultiplier: 1.8,
    magSize: 30,
    reserveMax: 180,
    reloadTime: 1.3,
    spread: 0.02,
    recoilKickZ: 0.08,
    recoilPitchX: 0.035,
    pellets: 1,
    color: '#00FF66',
    emissive: '#00FF66',
    soundMethod: 'playRifleShot',
    description: 'Rapid-cycle plasma rifle with high suppression and tight recoil.',
  },
  energy_pistol: {
    id: 'energy_pistol',
    name: 'Arc Magnum',
    category: 'secondary',
    fireRate: 0.22,
    damage: 54,
    critMultiplier: 2.5,
    magSize: 12,
    reserveMax: 96,
    reloadTime: 1.0,
    spread: 0.006,
    recoilKickZ: 0.12,
    recoilPitchX: 0.07,
    pellets: 1,
    color: '#22D3EE',
    emissive: '#06B6D4',
    soundMethod: 'playPistolShot',
    description: 'High-precision semi-automatic hand cannon with devastating headshot crits.',
  },
  plasma_shotgun: {
    id: 'plasma_shotgun',
    name: 'Scatter Core 8',
    category: 'heavy',
    fireRate: 0.68,
    damage: 20, // per pellet (x8 = 160 dmg)
    critMultiplier: 1.6,
    magSize: 6,
    reserveMax: 36,
    reloadTime: 2.0,
    spread: 0.08,
    recoilKickZ: 0.22,
    recoilPitchX: 0.14,
    pellets: 8,
    color: '#D946EF',
    emissive: '#C026D3',
    soundMethod: 'playShotgunShot',
    description: 'Heavy plasma breach scattergun firing dense spreads of ionized buckshot.',
  },
  void_railgun: {
    id: 'void_railgun',
    name: 'Void Piercer XI',
    category: 'exotic',
    fireRate: 1.1,
    damage: 180,
    critMultiplier: 3.0,
    magSize: 4,
    reserveMax: 20,
    reloadTime: 2.4,
    spread: 0.002,
    recoilKickZ: 0.32,
    recoilPitchX: 0.22,
    pellets: 1,
    color: '#F59E0B',
    emissive: '#D97706',
    soundMethod: 'playRifleShot',
    description: 'Particle accelerator anti-material railgun that pierces heavy armor.',
  },
};

// ─── LOOT & INVENTORY SYSTEM ────────────────────────────────────────────────
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type LootItemKind = 'weapon' | 'consumable' | 'relic' | 'ammo';

export interface SurvivalItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  kind: LootItemKind;
  weaponId?: WeaponId;
  description: string;
  icon: 'rifle' | 'pistol' | 'shotgun' | 'railgun' | 'medkit' | 'shield' | 'ammo' | 'stim' | 'relic';
  color: string;
  quantity?: number;
  maxQuantity?: number;
  stats?: {
    damageBonus?: number;
    healthRestore?: number;
    shieldRestore?: number;
    ammoRestore?: number;
    critBonus?: number;
    speedBonus?: number;
    buffDuration?: number;
  };
}

export interface InventorySlot {
  index: number; // 0 to 4
  item: SurvivalItem | null;
}

export interface PhysicalLootDrop {
  id: string;
  item: SurvivalItem;
  position: [number, number, number];
  dropTime: number;
}

// ─── DIFFICULTY & THREAT DIRECTOR ───────────────────────────────────────────
export interface ThreatTierDef {
  tier: number;
  name: string;
  color: string;
  description: string;
  minSeconds: number;
  spawnRateSeconds: number;
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  eliteChance: number;
}

export const THREAT_TIERS: ThreatTierDef[] = [
  {
    tier: 1,
    name: 'QUIET BREACH',
    color: '#00FF66',
    description: 'Initial scouting signals detected. Common hostiles approaching.',
    minSeconds: 0,
    spawnRateSeconds: 5.5,
    enemyHealthMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    eliteChance: 0.05,
  },
  {
    tier: 2,
    name: 'HOSTILE INCURSION',
    color: '#38BDF8',
    description: 'Ruin security active. Guardian units deploying in force.',
    minSeconds: 90,
    spawnRateSeconds: 4.2,
    enemyHealthMultiplier: 1.35,
    enemyDamageMultiplier: 1.25,
    eliteChance: 0.15,
  },
  {
    tier: 3,
    name: 'HIGH THREAT',
    color: '#A855F7',
    description: 'Extreme energy surges. Armored brutes and elite sentinels active.',
    minSeconds: 210,
    spawnRateSeconds: 3.2,
    enemyHealthMultiplier: 1.8,
    enemyDamageMultiplier: 1.6,
    eliteChance: 0.3,
  },
  {
    tier: 4,
    name: 'SECTOR OVERLOAD',
    color: '#F59E0B',
    description: 'Containment failing. Executioner-class units and heavy artillery.',
    minSeconds: 380,
    spawnRateSeconds: 2.4,
    enemyHealthMultiplier: 2.4,
    enemyDamageMultiplier: 2.1,
    eliteChance: 0.45,
  },
  {
    tier: 5,
    name: 'NIGHTMARE PROTOCOL',
    color: '#EF4444',
    description: 'CRITICAL WARNING: The Dungeon Core awakens. Relentless titan spawns.',
    minSeconds: 580,
    spawnRateSeconds: 1.8,
    enemyHealthMultiplier: 3.2,
    enemyDamageMultiplier: 2.8,
    eliteChance: 0.65,
  },
];

// ─── ENEMY ARCHETYPES & AI ──────────────────────────────────────────────────
export type EnemyAIState =
  | 'idle'
  | 'chase'
  | 'strafe'
  | 'telegraph'
  | 'attack'
  | 'hurt'
  | 'dead';

export interface FPSEnemyEntity {
  id: string;
  name: string;
  archetype: 'slime' | 'skeleton' | 'golem' | 'scout' | 'guardian' | 'brute' | 'elite' | 'boss';
  isRanged?: boolean;
  position: [number, number, number];
  rotationY: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  color: string;
  aiState: EnemyAIState;
  stateTimer: number;
  telegraphProgress: number; // 0 to 1
  hitFlashTimer: number; // > 0 triggers bright flash
  isBoss?: boolean;
  bossPhase?: number; // 1, 2, or 3
  weakSpotExposed?: boolean;
}

export interface FPSProjectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  damage: number;
  color: string;
  radius: number;
  life: number; // seconds remaining
  isHostile: boolean;
}

export interface FloatingDamage {
  id: number;
  worldPosition: [number, number, number];
  damage: number;
  isCrit: boolean;
  isPlayerHurt?: boolean;
}

export interface FPSPickupItem {
  id: string;
  type: 'health' | 'shield' | 'ammo';
  position: [number, number, number];
  amount: number;
  label: string;
}

export interface ExtractionState {
  isActive: boolean;
  position: [number, number, number];
  channelProgress: number; // 0 to 1
  isChanneling: boolean;
  nextActivationSeconds: number;
}

export interface RunStats {
  survivalSeconds: number;
  threatTier: number;
  kills: number;
  eliteKills: number;
  bossKills: number;
  highestStreak: number;
  currentStreak: number;
  damageDealt: number;
  lootCollected: number;
  score: number;
  extracted: boolean;
  coinsEarned: number;
  soulShardsEarned: number;
}

export interface FPSSettings {
  mouseSensitivity: number; // e.g. 0.0022
  invertY: boolean;
  screenShake: boolean;
  fov: number;
}
