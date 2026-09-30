// data/species.ts
import { Species, ClassRole } from '@/types/avatar';

export interface SpeciesData {
  id: Species;
  name: string;
  title: string;
  tagline: string;
  domain: string;
  accentColor: string;
  innateBuff: string;
  baseHp: number;
  basePower: number;
  baseDefense: number;
  baseAgility: number;
  baseMagic: number;
  defaultSkinTone: string;
  description: string;
  roles: {
    id: ClassRole;
    name: string;
    roleDesc: string;
    hpMod: number;
    powerMod: number;
    defenseMod: number;
    agilityMod: number;
    magicMod: number;
  }[];
}

export const SPECIES_LIST: SpeciesData[] = [
  {
    id: 'human',
    name: 'Human',
    title: 'Adaptive Vanguard',
    tagline: 'Infinite versatility, iron resolve, balanced master of all combat arts.',
    domain: 'Versatility & Tactics',
    accentColor: '#00FF66',
    innateBuff: '+15% All-Around Stat Boost & Quick Tactical Synergy',
    baseHp: 1000,
    basePower: 60,
    baseDefense: 45,
    baseAgility: 50,
    baseMagic: 45,
    defaultSkinTone: '#FDDBB4',
    description: 'Humans adapt swiftly to any battle environment, balancing offense, defense, and cunning.',
    roles: [
      { id: 'warrior', name: 'Vanguard Striker', roleDesc: 'Balanced blade combos and steady physical damage.', hpMod: 100, powerMod: 20, defenseMod: 15, agilityMod: 10, magicMod: 0 },
      { id: 'tank', name: 'Iron Bastion', roleDesc: 'Fortified heavy armor with damage reduction.', hpMod: 300, powerMod: 5, defenseMod: 35, agilityMod: -10, magicMod: 0 },
      { id: 'assassin', name: 'Shadow Operative', roleDesc: 'Swift fatal strikes with high critical hit probability.', hpMod: -50, powerMod: 25, defenseMod: 5, agilityMod: 35, magicMod: 10 },
      { id: 'mage', name: 'Plasma Arcanist', roleDesc: 'Channel energy pulses and disruptive spell barriers.', hpMod: -50, powerMod: 10, defenseMod: 10, agilityMod: 15, magicMod: 35 },
    ],
  },
  {
    id: 'elf',
    name: 'Elf',
    title: 'Sylph Mystic',
    tagline: 'Graceful archers and arcane spellweavers with heightened senses.',
    domain: 'Agility & Arcane Magic',
    accentColor: '#38BDF8',
    innateBuff: '+25% Evasion, +30% Critical Strike Multiplier, Pointed Ears',
    baseHp: 880,
    basePower: 50,
    baseDefense: 35,
    baseAgility: 80,
    baseMagic: 85,
    defaultSkinTone: '#FEE2E2',
    description: 'Elven bloodlines possess timeless reflexes and an intimate connection to the cosmic aether.',
    roles: [
      { id: 'mage', name: 'Aether Arch-Mage', roleDesc: 'Devastating magic bursts and luminous protective wards.', hpMod: 0, powerMod: 5, defenseMod: 10, agilityMod: 15, magicMod: 45 },
      { id: 'assassin', name: 'Windrunner Stalker', roleDesc: 'Silent piercing strikes from the shadows with hyper agility.', hpMod: -50, powerMod: 20, defenseMod: 5, agilityMod: 40, magicMod: 20 },
      { id: 'warrior', name: 'Bladedancer', roleDesc: 'Fluid acrobatic melee strikes that bypass heavy armor.', hpMod: 80, powerMod: 22, defenseMod: 15, agilityMod: 25, magicMod: 15 },
      { id: 'tank', name: 'Sylph Guardian', roleDesc: 'Harnesses wind barriers to absorb incoming kinetic blows.', hpMod: 220, powerMod: 10, defenseMod: 30, agilityMod: 10, magicMod: 20 },
    ],
  },
  {
    id: 'ogre',
    name: 'Ogre',
    title: 'Colossal Juggernaut',
    tagline: 'Titanic brute strength, towering health pools, and shattering slams.',
    domain: 'Colossal HP & Raw Defense',
    accentColor: '#F97316',
    innateBuff: '+45% Max HP, +35% Raw Physical Defense, Knockback Resistance',
    baseHp: 1500,
    basePower: 85,
    baseDefense: 80,
    baseAgility: 25,
    baseMagic: 20,
    defaultSkinTone: '#C17D4C',
    description: 'Immovable mountain giants that shrug off devastating strikes and counter with crushing blows.',
    roles: [
      { id: 'tank', name: 'Gargantuan Fortress', roleDesc: 'Colossal hitpoints and impervious natural armor.', hpMod: 500, powerMod: 10, defenseMod: 45, agilityMod: -15, magicMod: 0 },
      { id: 'warrior', name: 'Titan Berserker', roleDesc: 'Unrelenting devastation that scales as health drops.', hpMod: 250, powerMod: 40, defenseMod: 25, agilityMod: 5, magicMod: 0 },
      { id: 'assassin', name: 'Brawler Enforcer', roleDesc: 'Surprising heavy ambush blows that stun opponents.', hpMod: 100, powerMod: 30, defenseMod: 20, agilityMod: 20, magicMod: 0 },
      { id: 'mage', name: 'Earth Shaman', roleDesc: 'Earthquake tremors and molten stone shielding.', hpMod: 300, powerMod: 15, defenseMod: 30, agilityMod: 0, magicMod: 30 },
    ],
  },
  {
    id: 'robot',
    name: 'Robot / Android',
    title: 'Cybernetic Sentinel',
    tagline: 'Engineered perfection, photon reactors, and calculated combat algorithms.',
    domain: 'Armor Plating & Overclocking',
    accentColor: '#A855F7',
    innateBuff: '+40 Energy Shield, Immunity to Panic/Debuffs, Auto-Repair Protocol',
    baseHp: 1150,
    basePower: 70,
    baseDefense: 70,
    baseAgility: 45,
    baseMagic: 65,
    defaultSkinTone: '#94A3B8',
    description: 'Synthetically forged hulls equipped with sub-atomic processors and plasma emitters.',
    roles: [
      { id: 'tank', name: 'Titanium Bulwark', roleDesc: 'Energy shields and dynamic reactive damage deflection.', hpMod: 350, powerMod: 10, defenseMod: 40, agilityMod: -5, magicMod: 15 },
      { id: 'mage', name: 'Quantum Core Blaster', roleDesc: 'Fires high-output particle beams and ionic shockwaves.', hpMod: 50, powerMod: 15, defenseMod: 15, agilityMod: 15, magicMod: 45 },
      { id: 'warrior', name: 'Mecha Striker', roleDesc: 'Hydraulic powered fists and vibrating alloy blades.', hpMod: 150, powerMod: 30, defenseMod: 25, agilityMod: 15, magicMod: 10 },
      { id: 'assassin', name: 'Cyber Infiltrator', roleDesc: 'Overclocked optical camouflage and lethal laser blades.', hpMod: 0, powerMod: 25, defenseMod: 15, agilityMod: 35, magicMod: 20 },
    ],
  },
  {
    id: 'alien',
    name: 'Alien',
    title: 'Cosmic Psion',
    tagline: 'Dimensional anomalies wielding void manipulation and telekinesis.',
    domain: 'Void Magic & Phase Shifting',
    accentColor: '#EC4899',
    innateBuff: '+35% Void Energy, Telekinetic Barrier, Dimensional Evasion',
    baseHp: 950,
    basePower: 55,
    baseDefense: 40,
    baseAgility: 65,
    baseMagic: 95,
    defaultSkinTone: '#67E8F9',
    description: 'Travelers from outside the known galaxy whose psionic resonance warps local space-time.',
    roles: [
      { id: 'mage', name: 'Cosmic Singularity', roleDesc: 'Bends gravity and summons black hole implosions.', hpMod: 50, powerMod: 10, defenseMod: 15, agilityMod: 15, magicMod: 50 },
      { id: 'assassin', name: 'Warp Strider', roleDesc: 'Teleports behind defenders with phase-shift precision.', hpMod: -30, powerMod: 25, defenseMod: 10, agilityMod: 40, magicMod: 25 },
      { id: 'warrior', name: 'Graviton Duelist', roleDesc: 'Wields zero-gravity blades that slice through shields.', hpMod: 120, powerMod: 28, defenseMod: 20, agilityMod: 20, magicMod: 20 },
      { id: 'tank', name: 'Event Horizon Wall', roleDesc: 'Distorts incoming trajectories and redirects energy back.', hpMod: 280, powerMod: 10, defenseMod: 35, agilityMod: 10, magicMod: 25 },
    ],
  },
  {
    id: 'fairie',
    name: 'Fairie',
    title: 'Enchanted Pixie',
    tagline: 'Breathtakingly cute, hyper-agile, starlight healing and sparkle blessings.',
    domain: 'High Evasion & Regeneration',
    accentColor: '#F43F5E',
    innateBuff: '+30% Passive Health Regen Every Turn, Flutter Dodge, Tiny Hitbox',
    baseHp: 820,
    basePower: 45,
    baseDefense: 30,
    baseAgility: 95,
    baseMagic: 95,
    defaultSkinTone: '#FFF1F2',
    description: 'Luminous winged spirits endowed with starry glitters, rapid regeneration, and elusive charms.',
    roles: [
      { id: 'mage', name: 'Starlight Sorceress', roleDesc: 'Blasts sparkly cosmic beams and heals with petal winds.', hpMod: 50, powerMod: 5, defenseMod: 10, agilityMod: 25, magicMod: 45 },
      { id: 'assassin', name: 'Needle Pixie', roleDesc: 'Hyper-speed flutter strikes that deliver sweet poison venom.', hpMod: -50, powerMod: 25, defenseMod: 5, agilityMod: 45, magicMod: 20 },
      { id: 'warrior', name: 'Sylph Lancer', roleDesc: 'Tiny but fierce fighter wielding a starlight rapier.', hpMod: 100, powerMod: 28, defenseMod: 15, agilityMod: 30, magicMod: 15 },
      { id: 'tank', name: 'Floral Petal Ward', roleDesc: 'Puffy blooming flower shields that absorb and mend wounds.', hpMod: 240, powerMod: 5, defenseMod: 35, agilityMod: 20, magicMod: 25 },
    ],
  },
];
