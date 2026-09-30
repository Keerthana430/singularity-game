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
    innateBuff: '+20% Magic Power, +12% Evasion, Piercing Precision',
    baseHp: 880,
    basePower: 50,
    baseDefense: 35,
    baseAgility: 75,
    baseMagic: 80,
    defaultSkinTone: '#FDE68A',
    description: 'Ancient beings of grace and intellect, channelers of elemental nature and wind.',
    roles: [
      { id: 'mage', name: 'Arcane Spellweaver', roleDesc: 'High-yield magical burst damage that shreds through defense.', hpMod: -30, powerMod: 10, defenseMod: 5, agilityMod: 20, magicMod: 45 },
      { id: 'assassin', name: 'Shadow Mistwalker', roleDesc: 'Stealth ambushes and lightning-fast critical strikes.', hpMod: -60, powerMod: 30, defenseMod: 5, agilityMod: 40, magicMod: 15 },
      { id: 'warrior', name: 'Sylph Ranger', roleDesc: 'Acrobatic swordplay coupled with rapid physical slashes.', hpMod: 80, powerMod: 22, defenseMod: 15, agilityMod: 25, magicMod: 10 },
      { id: 'tank', name: 'Verdant Guardian', roleDesc: 'Nature barriers and life-leech shields that counter attacks.', hpMod: 220, powerMod: 10, defenseMod: 30, agilityMod: 10, magicMod: 20 },
    ],
  },
  {
    id: 'fairy',
    name: 'Fairy',
    title: 'Enchanted Sprite',
    tagline: 'Hyper-agile, starlight healing wings and sparkle blessings.',
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
  {
    id: 'dwarf',
    name: 'Dwarf',
    title: 'Forge Runesmith',
    tagline: 'Master craftsmen with unbreakable shields and high defense armor.',
    domain: 'Heavy Defense & Shieldcraft',
    accentColor: '#F59E0B',
    innateBuff: '+35% Physical Armor & Unyielding Stone Fortitude',
    baseHp: 1250,
    basePower: 70,
    baseDefense: 75,
    baseAgility: 35,
    baseMagic: 30,
    defaultSkinTone: '#E8B887',
    description: 'Dwarves excel in physical endurance, heavy hammer strikes, and impenetrable shield walls.',
    roles: [
      { id: 'tank', name: 'Mountain Bastion', roleDesc: 'Heavy fortress tower shields that reflect melee impacts.', hpMod: 350, powerMod: 10, defenseMod: 45, agilityMod: -15, magicMod: 0 },
      { id: 'warrior', name: 'Runic Axeman', roleDesc: 'Crushing heavy swings that stagger and break armor.', hpMod: 150, powerMod: 28, defenseMod: 25, agilityMod: 5, magicMod: 5 },
      { id: 'assassin', name: 'Tunnel Saboteur', roleDesc: 'Compact armor-piercing daggers targeting vital joints.', hpMod: -20, powerMod: 25, defenseMod: 15, agilityMod: 28, magicMod: 5 },
      { id: 'mage', name: 'Magma Runecaster', roleDesc: 'Forges explosive molten runes and protective thermal auras.', hpMod: 50, powerMod: 15, defenseMod: 20, agilityMod: 10, magicMod: 35 },
    ],
  },
  {
    id: 'ogre',
    name: 'Ogre',
    title: 'Colossus Berserker',
    tagline: 'Brute physical strength, massive frame, devastating crushing strikes.',
    domain: 'Raw HP & Physical Dominance',
    accentColor: '#EAB308',
    innateBuff: '+30% Base Health, +25 Physical Defense, Stagger Resistance',
    baseHp: 1400,
    basePower: 90,
    baseDefense: 65,
    baseAgility: 30,
    baseMagic: 20,
    defaultSkinTone: '#84CC16',
    description: 'Hulking behemoths capable of shattering boulders and soaking up massive enemy hits.',
    roles: [
      { id: 'tank', name: 'Dread Juggernaut', roleDesc: 'Colossal health pool and earth-quaking impact absorbs.', hpMod: 400, powerMod: 10, defenseMod: 40, agilityMod: -15, magicMod: 0 },
      { id: 'warrior', name: 'Mountain Berserker', roleDesc: 'Enrages at low health, multiplying physical damage output.', hpMod: 150, powerMod: 35, defenseMod: 20, agilityMod: 5, magicMod: 0 },
      { id: 'assassin', name: 'Titan Ambusher', roleDesc: 'Unexpected explosive rushdown that crushes light armor.', hpMod: 0, powerMod: 35, defenseMod: 15, agilityMod: 25, magicMod: 0 },
      { id: 'mage', name: 'Shaman Brawler', roleDesc: 'Earth tremors and ancestral totems that bolster durability.', hpMod: 100, powerMod: 20, defenseMod: 25, agilityMod: 10, magicMod: 25 },
    ],
  },
  {
    id: 'robot',
    name: 'Robot',
    title: 'Cyber Automaton',
    tagline: 'Titanium chassis, computational precision, particle beam integration.',
    domain: 'Armor Plating & Overclocking',
    accentColor: '#10B981',
    innateBuff: 'Calculated Damage Reduction (-20%), Immunity to Bleed/Poison',
    baseHp: 1150,
    basePower: 70,
    baseDefense: 70,
    baseAgility: 45,
    baseMagic: 60,
    defaultSkinTone: '#94A3B8',
    description: 'Sentient cybernetic androids forged with high-tensile alloys and particle processors.',
    roles: [
      { id: 'tank', name: 'Aegis Sentinel', roleDesc: 'Hardlight shields and nanite self-repair protocols.', hpMod: 320, powerMod: 8, defenseMod: 42, agilityMod: -5, magicMod: 10 },
      { id: 'warrior', name: 'Overclocked Striker', roleDesc: 'Servo-assisted blade combos with high burst cadence.', hpMod: 120, powerMod: 25, defenseMod: 20, agilityMod: 15, magicMod: 10 },
      { id: 'assassin', name: 'Nanite Infiltrator', roleDesc: 'Silent optic camouflage with point-blank laser darts.', hpMod: -40, powerMod: 28, defenseMod: 10, agilityMod: 35, magicMod: 15 },
      { id: 'mage', name: 'Beam Matrix Arcanist', roleDesc: 'Twin shoulder particle arrays firing ionized plasma.', hpMod: -20, powerMod: 15, defenseMod: 15, agilityMod: 15, magicMod: 40 },
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
];
