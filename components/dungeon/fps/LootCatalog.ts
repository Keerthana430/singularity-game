// components/dungeon/fps/LootCatalog.ts
// Loot Generation, Item Catalog, and Drop Probability Scaling

import { SurvivalItem, ItemRarity, WeaponId, InventorySlot } from './types';

export const BASE_ITEMS: Record<string, Omit<SurvivalItem, 'id'>> = {
  // ── WEAPONS ──
  pulse_rifle_common: {
    name: 'Pulse Rifle MK-IV',
    rarity: 'common',
    kind: 'weapon',
    weaponId: 'pulse_rifle',
    icon: 'rifle',
    color: '#00FF66',
    description: 'Rapid-firing plasma rifle. Balanced and dependable.',
    stats: { damageBonus: 0 },
  },
  pulse_rifle_epic: {
    name: 'Overcharged Pulse Rifle',
    rarity: 'epic',
    kind: 'weapon',
    weaponId: 'pulse_rifle',
    icon: 'rifle',
    color: '#A855F7',
    description: 'Supercharged coils increase pulse projectile velocity and rate of fire.',
    stats: { damageBonus: 10, critBonus: 10 },
  },
  energy_pistol_rare: {
    name: 'Arc Magnum',
    rarity: 'rare',
    kind: 'weapon',
    weaponId: 'energy_pistol',
    icon: 'pistol',
    color: '#22D3EE',
    description: 'Precision semi-auto hand cannon with lethal headshot multipliers.',
    stats: { critBonus: 15 },
  },
  plasma_shotgun_epic: {
    name: 'Scatter Core 8',
    rarity: 'epic',
    kind: 'weapon',
    weaponId: 'plasma_shotgun',
    icon: 'shotgun',
    color: '#D946EF',
    description: 'Fires dense clusters of ionized plasma buckshot at close range.',
    stats: { damageBonus: 25 },
  },
  void_railgun_legendary: {
    name: 'Void Piercer XI',
    rarity: 'legendary',
    kind: 'weapon',
    weaponId: 'void_railgun',
    icon: 'railgun',
    color: '#F59E0B',
    description: 'Heavy particle beam accelerator that obliterates elite carapaces.',
    stats: { damageBonus: 60, critBonus: 25 },
  },

  // ── CONSUMABLES ──
  nanite_medkit: {
    name: 'Nanite Medkit',
    rarity: 'common',
    kind: 'consumable',
    icon: 'medkit',
    color: '#10B981',
    description: 'Injects microscopic nanites to rapidly restore 400 Health.',
    stats: { healthRestore: 400 },
    quantity: 1,
    maxQuantity: 3,
  },
  shield_cell: {
    name: 'Kinetic Shield Cell',
    rarity: 'rare',
    kind: 'consumable',
    icon: 'shield',
    color: '#38BDF8',
    description: 'Recharges 150 kinetic shield barrier instantly.',
    stats: { shieldRestore: 150 },
    quantity: 1,
    maxQuantity: 3,
  },
  ammo_box: {
    name: 'Plasma Ammo Box',
    rarity: 'common',
    kind: 'ammo',
    icon: 'ammo',
    color: '#FBBF24',
    description: 'Restores high-capacity reserves for all carried weapons.',
    stats: { ammoRestore: 90 },
    quantity: 1,
    maxQuantity: 5,
  },
  overdrive_stim: {
    name: 'Overdrive Combat Stim',
    rarity: 'epic',
    kind: 'consumable',
    icon: 'stim',
    color: '#FB7185',
    description: 'Overclocks operative neural pathways: +50% weapon damage for 15 seconds.',
    stats: { damageBonus: 50, buffDuration: 15 },
    quantity: 1,
    maxQuantity: 2,
  },

  // ── PASSIVE RUN RELICS ──
  chrono_core: {
    name: 'Chrono Booster Relic',
    rarity: 'rare',
    kind: 'relic',
    icon: 'relic',
    color: '#22D3EE',
    description: 'Temporal servo enhancement granting +20% sprint movement speed.',
    stats: { speedBonus: 20 },
  },
  apex_lens: {
    name: 'Apex Targeting Lens',
    rarity: 'epic',
    kind: 'relic',
    icon: 'relic',
    color: '#A855F7',
    description: 'Holographic optical array adding +25% critical strike chance.',
    stats: { critBonus: 25 },
  },
  singularity_shard: {
    name: 'Singularity Core Shard',
    rarity: 'mythic',
    kind: 'relic',
    icon: 'relic',
    color: '#FB7185',
    description: 'Raw crystallized dungeon core energy granting massive bounty bonuses.',
    stats: { damageBonus: 40, shieldRestore: 200 },
  },
};

export function rollLootDrop(threatTier: number, isElite = false): SurvivalItem {
  // Roll rarity based on threat tier and elite flag
  const roll = Math.random();
  let rarity: ItemRarity = 'common';

  if (threatTier >= 4 || isElite) {
    if (roll < 0.15) rarity = 'mythic';
    else if (roll < 0.45) rarity = 'legendary';
    else if (roll < 0.8) rarity = 'epic';
    else rarity = 'rare';
  } else if (threatTier >= 2) {
    if (roll < 0.05) rarity = 'legendary';
    else if (roll < 0.3) rarity = 'epic';
    else if (roll < 0.65) rarity = 'rare';
    else rarity = 'common';
  } else {
    if (roll < 0.1) rarity = 'epic';
    else if (roll < 0.35) rarity = 'rare';
    else rarity = 'common';
  }

  // Filter items matching or close to rarity
  const itemKeys = Object.keys(BASE_ITEMS);
  const matching = itemKeys.filter((k) => BASE_ITEMS[k].rarity === rarity);
  const chosenKey = matching.length > 0
    ? matching[Math.floor(Math.random() * matching.length)]
    : itemKeys[Math.floor(Math.random() * itemKeys.length)];

  const template = BASE_ITEMS[chosenKey];
  return {
    ...template,
    id: `item-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
  };
}

export function createInitialInventory(): InventorySlot[] {
  return [
    {
      index: 0,
      item: { ...BASE_ITEMS.pulse_rifle_common, id: 'start-rifle' },
    },
    {
      index: 1,
      item: null,
    },
    {
      index: 2,
      item: null,
    },
    {
      index: 3,
      item: null,
    },
    {
      index: 4,
      item: null,
    },
  ];
}


