// lib/statsCalculator.ts
// Transparent RPG Combat Stat Calculator based on Species, Class Role, Weapon, and Gear.

import { AvatarConfig } from '@/types/avatar';
import { SPECIES_LIST, SpeciesData } from '@/data/species';
import { weapons, WeaponItem } from '@/data/weapons';

export interface StatBreakdown {
  hp: number;
  power: number;
  defense: number;
  agility: number;
  magic: number;
}

export interface CalculatedStats {
  maxHp: number;
  power: number;
  defense: number;
  agility: number;
  magic: number;
  criticalRate: number; // Percentage, e.g., 25%
  evasionRate: number;  // Percentage, e.g., 18%
  species: SpeciesData;
  speciesBuff: string;
  className: string;
  weaponItem: WeaponItem;
  breakdown: {
    species: StatBreakdown;
    role: StatBreakdown;
    gear: StatBreakdown;
    weapon: StatBreakdown;
  };
}

export function calculateAvatarStats(config: AvatarConfig): CalculatedStats {
  // 1. Resolve Species
  const rawSpecies = config.species || 'human';
  const speciesKey = rawSpecies === 'fairie' ? 'fairy' : rawSpecies === 'dwarves' ? 'dwarf' : rawSpecies;
  const species = SPECIES_LIST.find((s) => s.id === speciesKey) || SPECIES_LIST[0];

  // 2. Resolve Class Role
  const roleKey = config.classRole || species.roles[0].id;
  const role = species.roles.find((r) => r.id === roleKey) || species.roles[0];

  // 3. Resolve Weapon
  const weaponKey = config.weapon || 'unarmed';
  const weaponItem = weapons.find((w) => w.id === weaponKey) || weapons[weapons.length - 1];

  // 4. Calculate Gear Bonuses
  const gear: StatBreakdown = { hp: 0, power: 0, defense: 0, agility: 0, magic: 0 };

  // Top Gear bonuses
  switch (config.top) {
    case 'armor':
      gear.defense += 35;
      gear.hp += 180;
      gear.power += 15;
      break;
    case 'futuristic-suit':
      gear.power += 25;
      gear.magic += 30;
      gear.defense += 15;
      break;
    case 'lolita-dress':
      gear.magic += 35;
      gear.agility += 20;
      gear.hp += 80;
      break;
    case 'maid-dress':
      gear.agility += 28;
      gear.magic += 22;
      gear.hp += 60;
      break;
    case 'magical-dress':
      gear.magic += 50;
      gear.agility += 25;
      gear.hp += 50;
      break;
    case 'sundress':
      gear.agility += 18;
      gear.magic += 15;
      gear.hp += 70;
      break;
    case 'princess-gown':
      gear.magic += 40;
      gear.defense += 25;
      gear.hp += 120;
      break;
    case 'cyber-dress':
      gear.power += 22;
      gear.magic += 30;
      gear.agility += 20;
      break;
    case 'hoodie-dress':
    case 'hoodie':
      gear.agility += 16;
      gear.hp += 80;
      break;
    case 'jacket':
      gear.power += 15;
      gear.defense += 15;
      break;
    default:
      gear.agility += 8;
      gear.hp += 30;
  }

  // Bottoms bonuses
  switch (config.bottom) {
    case 'armor-pants':
      gear.defense += 28;
      gear.hp += 90;
      break;
    case 'frill-skirt':
      gear.agility += 18;
      gear.magic += 18;
      break;
    case 'tutu':
      gear.agility += 25;
      gear.magic += 12;
      break;
    case 'skirt':
    case 'maid-apron-skirt':
      gear.agility += 18;
      break;
    case 'cargo':
      gear.defense += 14;
      gear.agility += 10;
      break;
    case 'leggings':
      gear.agility += 16;
      break;
    default:
      gear.agility += 5;
  }

  // Accessories bonuses
  if (config.accessories?.head === 'crown') {
    gear.magic += 28;
    gear.defense += 10;
  } else if (config.accessories?.head === 'cat-ears' || config.accessories?.head === 'bunny-ears') {
    gear.agility += 22;
    gear.magic += 10;
  } else if (config.accessories?.head === 'halo') {
    gear.magic += 30;
    gear.hp += 100;
  } else if (config.accessories?.head === 'headphones') {
    gear.agility += 14;
    gear.magic += 10;
  }

  if (config.accessories?.face === 'visor') {
    gear.power += 18;
    gear.agility += 12;
  } else if (config.accessories?.face === 'ribbon-choker') {
    gear.magic += 16;
    gear.agility += 12;
  }

  if (config.accessories?.back === 'angel-wings' || config.accessories?.back === 'fairy-wings') {
    gear.agility += 35;
    gear.magic += 25;
    gear.hp += 60;
  } else if (config.accessories?.back === 'wings') {
    gear.agility += 30;
    gear.power += 15;
  } else if (config.accessories?.back === 'jetpack') {
    gear.power += 25;
    gear.agility += 20;
  }

  if (config.accessories?.shoulder === 'pauldrons' || config.accessories?.shoulder === 'shoulder-pads') {
    gear.defense += 25;
    gear.hp += 70;
  }

  // Body scale modifier (chibi = +agility, broad = +hp/+def, slim = +speed)
  const bodyBonus: StatBreakdown = {
    hp: config.body.type === 'broad' ? 250 : config.body.type === 'chibi' ? -100 : 0,
    power: config.body.type === 'broad' ? 20 : 0,
    defense: config.body.type === 'broad' ? 25 : 0,
    agility: config.body.type === 'chibi' ? 25 : config.body.type === 'slim' ? 18 : 0,
    magic: config.body.type === 'chibi' ? 20 : 0,
  };

  const speciesBreakdown: StatBreakdown = {
    hp: species.baseHp,
    power: species.basePower,
    defense: species.baseDefense,
    agility: species.baseAgility,
    magic: species.baseMagic,
  };

  const roleBreakdown: StatBreakdown = {
    hp: role.hpMod,
    power: role.powerMod,
    defense: role.defenseMod,
    agility: role.agilityMod,
    magic: role.magicMod,
  };

  const weaponBreakdown: StatBreakdown = {
    hp: 0,
    power: weaponItem.powerBonus,
    defense: weaponItem.defenseBonus,
    agility: weaponItem.agilityBonus,
    magic: weaponItem.magicBonus,
  };

  const totalHp = Math.round(species.baseHp + role.hpMod + gear.hp + bodyBonus.hp);
  const totalPower = Math.round(species.basePower + role.powerMod + weaponItem.powerBonus + gear.power + bodyBonus.power);
  const totalDefense = Math.round(species.baseDefense + role.defenseMod + weaponItem.defenseBonus + gear.defense + bodyBonus.defense);
  const totalAgility = Math.round(species.baseAgility + role.agilityMod + weaponItem.agilityBonus + gear.agility + bodyBonus.agility);
  const totalMagic = Math.round(species.baseMagic + role.magicMod + weaponItem.magicBonus + gear.magic + bodyBonus.magic);

  // Critical and Evasion formulas
  const criticalRate = Math.min(65, Math.round(10 + totalAgility * 0.25 + (config.face.eyes === 'sparkle' || config.face.eyes === 'cyber' ? 8 : 0)));
  const evasionRate = Math.min(50, Math.round(8 + totalAgility * 0.22 + (species.id === 'fairie' || species.id === 'elf' ? 12 : 0)));

  return {
    maxHp: Math.max(500, totalHp),
    power: Math.max(20, totalPower),
    defense: Math.max(15, totalDefense),
    agility: Math.max(15, totalAgility),
    magic: Math.max(10, totalMagic),
    criticalRate,
    evasionRate,
    species,
    speciesBuff: species.innateBuff,
    className: role.name,
    weaponItem,
    breakdown: {
      species: speciesBreakdown,
      role: roleBreakdown,
      gear: {
        hp: gear.hp + bodyBonus.hp,
        power: gear.power + bodyBonus.power,
        defense: gear.defense + bodyBonus.defense,
        agility: gear.agility + bodyBonus.agility,
        magic: gear.magic + bodyBonus.magic,
      },
      weapon: weaponBreakdown,
    },
  };
}
