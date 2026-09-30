// data/speciesAttacks.ts
// Species-Specific Attack Definitions — each species has unique attacks with
// distinct names, damage scaling, VFX color palettes, and particle effects.

import { Species } from '@/types/avatar';

export type AttackVfxType = 'slash' | 'projectile' | 'aoe' | 'beam' | 'strike';

export interface SpeciesAttack {
  id: string;
  name: string;
  description: string;
  moveType: 'strike' | 'magic' | 'shield' | 'ultimate';
  /** Primary stat used for damage: 'power' or 'magic' */
  scalingStat: 'power' | 'magic';
  /** Base damage multiplier on the scaling stat */
  damageMultiplier: number;
  /** Defense penetration percentage (0-1) — how much of enemy defense is ignored */
  armorPen: number;
  /** Overdrive energy gained per use (0 for ultimate which consumes 100) */
  overdriveGain: number;
  /** Cooldown in turns (0 = no cooldown) */
  cooldown: number;
  /** Chance to apply a status effect (0-1) */
  statusChance: number;
  /** Status effect type if applied */
  statusEffect?: 'burn' | 'freeze' | 'poison' | 'stun' | 'bleed';
  /** Status effect duration in turns */
  statusDuration?: number;
  /** Shield damage reduction multiplier (for defensive moves) */
  shieldReduction?: number;
  /** Reflect percentage (for defensive moves) */
  reflectPercent?: number;
  /** HP recovery percentage for shield moves (0-1) */
  barrierHealPercent?: number;

  // ─── Visual FX Properties ───────────────────────────────────
  vfxType: AttackVfxType;
  /** Primary particle/arc color */
  vfxColor: string;
  /** Secondary glow/accent color */
  vfxAccent: string;
  /** Spark/impact color */
  vfxSpark: string;
}

export interface SpeciesAttackSet {
  speciesId: Species;
  speciesName: string;
  attacks: SpeciesAttack[];
}

// ─── HUMAN: Adaptive Vanguard ──────────────────────────────────────────────
const humanAttacks: SpeciesAttack[] = [
  {
    id: 'human-photon-blade',
    name: 'Photon Blade',
    description: 'A precise photon-charged sword slash with balanced power.',
    moveType: 'strike',
    scalingStat: 'power',
    damageMultiplier: 2.1,
    armorPen: 0.45,
    overdriveGain: 15,
    cooldown: 0,
    statusChance: 0.15,
    statusEffect: 'bleed',
    statusDuration: 2,
    vfxType: 'slash',
    vfxColor: '#00FF66',
    vfxAccent: '#39FF14',
    vfxSpark: '#ADFF2F',
  },
  {
    id: 'human-plasma-burst',
    name: 'Plasma Burst',
    description: 'Concentrated plasma energy projectile that pierces armor.',
    moveType: 'magic',
    scalingStat: 'magic',
    damageMultiplier: 2.3,
    armorPen: 0.35,
    overdriveGain: 25,
    cooldown: 2,
    statusChance: 0.35,
    statusEffect: 'burn',
    statusDuration: 2,
    vfxType: 'projectile',
    vfxColor: '#22D3EE',
    vfxAccent: '#06B6D4',
    vfxSpark: '#67E8F9',
  },
  {
    id: 'human-iron-wall',
    name: 'Iron Bastion',
    description: 'Deploy tactical nano-shield with reflective parry counter.',
    moveType: 'shield',
    scalingStat: 'power',
    damageMultiplier: 0,
    armorPen: 0,
    overdriveGain: 15,
    cooldown: 3,
    statusChance: 0,
    shieldReduction: 0.7,
    reflectPercent: 0.4,
    barrierHealPercent: 0.05,
    vfxType: 'aoe',
    vfxColor: '#38BDF8',
    vfxAccent: '#0284C7',
    vfxSpark: '#BAE6FD',
  },
  {
    id: 'human-singularity-overdrive',
    name: 'Singularity Overdrive',
    description: 'Channel all combat energy into a devastating finisher.',
    moveType: 'ultimate',
    scalingStat: 'power',
    damageMultiplier: 3.5,
    armorPen: 0.6,
    overdriveGain: 0,
    cooldown: 0,
    statusChance: 1.0,
    statusEffect: 'stun',
    statusDuration: 1,
    vfxType: 'beam',
    vfxColor: '#F59E0B',
    vfxAccent: '#FBBF24',
    vfxSpark: '#FDE68A',
  },
];

// ─── ELF: Sylph Mystic ─────────────────────────────────────────────────────
const elfAttacks: SpeciesAttack[] = [
  {
    id: 'elf-sylph-arrow',
    name: 'Sylph Arrow',
    description: 'Wind-guided spectral arrow with piercing precision.',
    moveType: 'strike',
    scalingStat: 'power',
    damageMultiplier: 1.9,
    armorPen: 0.55,
    overdriveGain: 15,
    cooldown: 0,
    statusChance: 0.25,
    statusEffect: 'bleed',
    statusDuration: 2,
    vfxType: 'projectile',
    vfxColor: '#38BDF8',
    vfxAccent: '#0EA5E9',
    vfxSpark: '#BAE6FD',
  },
  {
    id: 'elf-nature-surge',
    name: 'Nature Surge',
    description: 'Channeled elemental torrent of wind and thorns.',
    moveType: 'magic',
    scalingStat: 'magic',
    damageMultiplier: 2.5,
    armorPen: 0.4,
    overdriveGain: 25,
    cooldown: 2,
    statusChance: 0.4,
    statusEffect: 'poison',
    statusDuration: 3,
    vfxType: 'beam',
    vfxColor: '#34D399',
    vfxAccent: '#059669',
    vfxSpark: '#6EE7B7',
  },
  {
    id: 'elf-wind-barrier',
    name: 'Wind Barrier',
    description: 'Whirling gale shield that deflects attacks and heals.',
    moveType: 'shield',
    scalingStat: 'magic',
    damageMultiplier: 0,
    armorPen: 0,
    overdriveGain: 15,
    cooldown: 3,
    statusChance: 0,
    shieldReduction: 0.65,
    reflectPercent: 0.35,
    barrierHealPercent: 0.08,
    vfxType: 'aoe',
    vfxColor: '#6EE7B7',
    vfxAccent: '#34D399',
    vfxSpark: '#A7F3D0',
  },
  {
    id: 'elf-celestial-tempest',
    name: 'Celestial Tempest',
    description: 'Invoke the ancient winds into a devastating storm.',
    moveType: 'ultimate',
    scalingStat: 'magic',
    damageMultiplier: 3.8,
    armorPen: 0.5,
    overdriveGain: 0,
    cooldown: 0,
    statusChance: 0.8,
    statusEffect: 'freeze',
    statusDuration: 1,
    vfxType: 'aoe',
    vfxColor: '#06B6D4',
    vfxAccent: '#22D3EE',
    vfxSpark: '#CFFAFE',
  },
];

// ─── FAIRY: Enchanted Sprite ────────────────────────────────────────────────
const fairyAttacks: SpeciesAttack[] = [
  {
    id: 'fairy-stardust-strike',
    name: 'Stardust Strike',
    description: 'Flutter-dash delivery of crystallized starlight needles.',
    moveType: 'strike',
    scalingStat: 'magic',
    damageMultiplier: 2.0,
    armorPen: 0.5,
    overdriveGain: 15,
    cooldown: 0,
    statusChance: 0.2,
    statusEffect: 'freeze',
    statusDuration: 1,
    vfxType: 'strike',
    vfxColor: '#F472B6',
    vfxAccent: '#EC4899',
    vfxSpark: '#FBCFE8',
  },
  {
    id: 'fairy-cosmic-bloom',
    name: 'Cosmic Bloom',
    description: 'Explosive supernova of petal energy and cosmic sparkles.',
    moveType: 'magic',
    scalingStat: 'magic',
    damageMultiplier: 2.6,
    armorPen: 0.45,
    overdriveGain: 25,
    cooldown: 2,
    statusChance: 0.45,
    statusEffect: 'burn',
    statusDuration: 2,
    vfxType: 'aoe',
    vfxColor: '#F43F5E',
    vfxAccent: '#FB7185',
    vfxSpark: '#FFE4E6',
  },
  {
    id: 'fairy-petal-shield',
    name: 'Petal Shield',
    description: 'Blooming flower barrier that absorbs and mends wounds.',
    moveType: 'shield',
    scalingStat: 'magic',
    damageMultiplier: 0,
    armorPen: 0,
    overdriveGain: 15,
    cooldown: 3,
    statusChance: 0,
    shieldReduction: 0.6,
    reflectPercent: 0.3,
    barrierHealPercent: 0.12, // Fairies get better shield healing
    vfxType: 'aoe',
    vfxColor: '#FB7185',
    vfxAccent: '#F43F5E',
    vfxSpark: '#FFF1F2',
  },
  {
    id: 'fairy-nova-blossom',
    name: 'Nova Blossom',
    description: 'Channel all starlight into an apocalyptic petal storm.',
    moveType: 'ultimate',
    scalingStat: 'magic',
    damageMultiplier: 3.6,
    armorPen: 0.55,
    overdriveGain: 0,
    cooldown: 0,
    statusChance: 1.0,
    statusEffect: 'burn',
    statusDuration: 2,
    vfxType: 'beam',
    vfxColor: '#F43F5E',
    vfxAccent: '#EC4899',
    vfxSpark: '#FDE68A',
  },
];

// ─── DWARF: Forge Runesmith ─────────────────────────────────────────────────
const dwarfAttacks: SpeciesAttack[] = [
  {
    id: 'dwarf-rune-hammer',
    name: 'Rune Hammer',
    description: 'Devastating overhead hammer swing infused with rune energy.',
    moveType: 'strike',
    scalingStat: 'power',
    damageMultiplier: 2.3,
    armorPen: 0.35,
    overdriveGain: 15,
    cooldown: 0,
    statusChance: 0.3,
    statusEffect: 'stun',
    statusDuration: 1,
    vfxType: 'strike',
    vfxColor: '#F59E0B',
    vfxAccent: '#D97706',
    vfxSpark: '#FDE68A',
  },
  {
    id: 'dwarf-magma-bolt',
    name: 'Magma Bolt',
    description: 'Molten rune projectile that erupts on impact.',
    moveType: 'magic',
    scalingStat: 'magic',
    damageMultiplier: 2.2,
    armorPen: 0.4,
    overdriveGain: 25,
    cooldown: 2,
    statusChance: 0.5,
    statusEffect: 'burn',
    statusDuration: 3,
    vfxType: 'projectile',
    vfxColor: '#EA580C',
    vfxAccent: '#F97316',
    vfxSpark: '#FDBA74',
  },
  {
    id: 'dwarf-stone-fortress',
    name: 'Stone Fortress',
    description: 'Impenetrable mountain stone barrier with counter-quake.',
    moveType: 'shield',
    scalingStat: 'power',
    damageMultiplier: 0,
    armorPen: 0,
    overdriveGain: 15,
    cooldown: 3,
    statusChance: 0,
    shieldReduction: 0.8, // Best shield in the game
    reflectPercent: 0.5,
    barrierHealPercent: 0.03,
    vfxType: 'aoe',
    vfxColor: '#A16207',
    vfxAccent: '#92400E',
    vfxSpark: '#FDE68A',
  },
  {
    id: 'dwarf-forge-eruption',
    name: 'Forge Eruption',
    description: 'Unleash the fury of the forge in a volcanic explosion.',
    moveType: 'ultimate',
    scalingStat: 'power',
    damageMultiplier: 3.4,
    armorPen: 0.65,
    overdriveGain: 0,
    cooldown: 0,
    statusChance: 1.0,
    statusEffect: 'burn',
    statusDuration: 3,
    vfxType: 'aoe',
    vfxColor: '#DC2626',
    vfxAccent: '#F97316',
    vfxSpark: '#FDE68A',
  },
];

// ─── OGRE: Colossus Berserker ───────────────────────────────────────────────
const ogreAttacks: SpeciesAttack[] = [
  {
    id: 'ogre-titan-smash',
    name: 'Titan Smash',
    description: 'Colossal fist smash that cracks the ground beneath.',
    moveType: 'strike',
    scalingStat: 'power',
    damageMultiplier: 2.5,
    armorPen: 0.3,
    overdriveGain: 15,
    cooldown: 0,
    statusChance: 0.35,
    statusEffect: 'stun',
    statusDuration: 1,
    vfxType: 'strike',
    vfxColor: '#84CC16',
    vfxAccent: '#65A30D',
    vfxSpark: '#BEF264',
  },
  {
    id: 'ogre-earth-tremor',
    name: 'Earth Tremor',
    description: 'Ground-shaking seismic slam that sends shockwaves.',
    moveType: 'magic',
    scalingStat: 'power', // Ogre magic scales off power!
    damageMultiplier: 2.1,
    armorPen: 0.5,
    overdriveGain: 25,
    cooldown: 2,
    statusChance: 0.4,
    statusEffect: 'stun',
    statusDuration: 1,
    vfxType: 'aoe',
    vfxColor: '#A16207',
    vfxAccent: '#854D0E',
    vfxSpark: '#D9F99D',
  },
  {
    id: 'ogre-boulder-guard',
    name: 'Boulder Guard',
    description: 'Rip a boulder from the ground as an immovable shield.',
    moveType: 'shield',
    scalingStat: 'power',
    damageMultiplier: 0,
    armorPen: 0,
    overdriveGain: 15,
    cooldown: 3,
    statusChance: 0,
    shieldReduction: 0.75,
    reflectPercent: 0.45,
    barrierHealPercent: 0.04,
    vfxType: 'aoe',
    vfxColor: '#78716C',
    vfxAccent: '#57534E',
    vfxSpark: '#D6D3D1',
  },
  {
    id: 'ogre-cataclysm',
    name: 'Cataclysm',
    description: 'Berserker fury — annihilating ground pound that levels all.',
    moveType: 'ultimate',
    scalingStat: 'power',
    damageMultiplier: 3.8,
    armorPen: 0.7,
    overdriveGain: 0,
    cooldown: 0,
    statusChance: 1.0,
    statusEffect: 'stun',
    statusDuration: 2,
    vfxType: 'aoe',
    vfxColor: '#EF4444',
    vfxAccent: '#DC2626',
    vfxSpark: '#FCA5A5',
  },
];

// ─── Master Registry ────────────────────────────────────────────────────────

export const SPECIES_ATTACKS: Record<string, SpeciesAttackSet> = {
  human: { speciesId: 'human', speciesName: 'Human', attacks: humanAttacks },
  elf: { speciesId: 'elf', speciesName: 'Elf', attacks: elfAttacks },
  fairy: { speciesId: 'fairy', speciesName: 'Fairy', attacks: fairyAttacks },
  fairie: { speciesId: 'fairy', speciesName: 'Fairy', attacks: fairyAttacks },
  dwarf: { speciesId: 'dwarf', speciesName: 'Dwarf', attacks: dwarfAttacks },
  dwarves: { speciesId: 'dwarf', speciesName: 'Dwarf', attacks: dwarfAttacks },
  ogre: { speciesId: 'ogre', speciesName: 'Ogre', attacks: ogreAttacks },
};

/**
 * Get attacks for a species. Falls back to human if species not found.
 */
export function getSpeciesAttacks(species?: string): SpeciesAttackSet {
  const key = (species || 'human').toLowerCase();
  return SPECIES_ATTACKS[key] || SPECIES_ATTACKS.human;
}

/**
 * Get a specific attack by moveType for a species.
 */
export function getAttackByType(species: string | undefined, moveType: 'strike' | 'magic' | 'shield' | 'ultimate'): SpeciesAttack {
  const attackSet = getSpeciesAttacks(species);
  return attackSet.attacks.find(a => a.moveType === moveType) || attackSet.attacks[0];
}
