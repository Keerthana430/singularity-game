// data/partCatalog.ts
// Unified PartCatalog registering modular avatar components with combat stats,
// sockets, and procedural fallback definitions.

import { PartCatalog, PartDefinition } from '@/types/parts';

export const PART_CATALOG: PartCatalog = {
  // ─── WEAPONS (Socket: socket_hand_r) ───
  'katana-cyber': {
    id: 'katana-cyber',
    name: 'Cyber Katana',
    slot: 'weapon',
    socketName: 'socket_hand_r',
    stats: { hp: 0, atk: 55, def: 8, spd: 14, crit: 22 },
    rarity: 'epic',
    cost: 450,
    colorOptions: ['#00FF66', '#00F0FF', '#FF0055', '#F59E0B'],
    fallbackPrimitive: 'box',
    description: 'High-frequency photon edged blade with rapid draw speed and sharp critical lethality.',
  },
  'plasma-blade': {
    id: 'plasma-blade',
    name: 'Plasma Blade',
    slot: 'weapon',
    socketName: 'socket_hand_r',
    stats: { hp: 0, atk: 48, def: 12, spd: 10, crit: 18 },
    rarity: 'rare',
    cost: 250,
    colorOptions: ['#22D3EE', '#F43F5E', '#A855F7', '#34D399'],
    fallbackPrimitive: 'cylinder',
    description: 'Ionized plasma emitter forged for balanced damage output and defense.',
  },
  'heavy-hammer': {
    id: 'heavy-hammer',
    name: 'Rune War Hammer',
    slot: 'weapon',
    socketName: 'socket_hand_r',
    stats: { hp: 150, atk: 68, def: 24, spd: -6, crit: 12 },
    rarity: 'epic',
    cost: 500,
    colorOptions: ['#F59E0B', '#EF4444', '#78716C'],
    fallbackPrimitive: 'box',
    description: 'Massive dwarven runic maul that crushes armor at the cost of swing speed.',
  },
  'nano-dagger': {
    id: 'nano-dagger',
    name: 'Shadow Daggers',
    slot: 'weapon',
    socketName: 'socket_hand_r',
    stats: { hp: 0, atk: 38, def: 4, spd: 22, crit: 28 },
    rarity: 'rare',
    cost: 300,
    colorOptions: ['#A855F7', '#EC4899', '#06B6D4'],
    fallbackPrimitive: 'box',
    description: 'Ultralight twin daggers delivering blinding speed and deadly precision.',
  },
  'arcane-staff': {
    id: 'arcane-staff',
    name: 'Starlight Staff',
    slot: 'weapon',
    socketName: 'socket_hand_r',
    stats: { hp: 80, atk: 44, def: 10, spd: 8, crit: 15 },
    rarity: 'rare',
    cost: 320,
    colorOptions: ['#F43F5E', '#8B5CF6', '#10B981'],
    fallbackPrimitive: 'cylinder',
    description: 'Fairy focus crystal channeling radiant restorative and magical energy.',
  },
  'unarmed': {
    id: 'unarmed',
    name: 'Bionic Gauntlets',
    slot: 'weapon',
    socketName: 'socket_hand_r',
    stats: { hp: 0, atk: 25, def: 15, spd: 12, crit: 10 },
    rarity: 'common',
    cost: 0,
    colorOptions: ['#475569', '#334155'],
    fallbackPrimitive: 'box',
    description: 'Reinforced hand-to-hand bionic gauntlets for agile combat.',
  },

  // ─── TORSO / TOPS (Socket: socket_chest) ───
  'armor': {
    id: 'armor',
    name: 'Colosseum Plate Cuirass',
    slot: 'torso',
    socketName: 'socket_chest',
    stats: { hp: 320, atk: 10, def: 45, spd: -4, crit: 0 },
    rarity: 'epic',
    cost: 420,
    colorOptions: ['#F59E0B', '#64748B', '#1E293B'],
    fallbackPrimitive: 'box',
    description: 'Heavy duty composite armor plating that significantly reduces sustained damage.',
  },
  'lolita-dress': {
    id: 'lolita-dress',
    name: 'Royal Lolita Dress',
    slot: 'torso',
    socketName: 'socket_chest',
    stats: { hp: 210, atk: 12, def: 22, spd: 10, crit: 8 },
    rarity: 'rare',
    cost: 280,
    colorOptions: ['#FF5C93', '#7C5CFF', '#22D3EE', '#FFFFFF'],
    fallbackPrimitive: 'cylinder',
    description: 'Intricately frilled battle dress woven with lightweight reactive silk.',
  },
  'magical-dress': {
    id: 'magical-dress',
    name: 'Starweaver Gown',
    slot: 'torso',
    socketName: 'socket_chest',
    stats: { hp: 190, atk: 25, def: 18, spd: 12, crit: 14 },
    rarity: 'epic',
    cost: 380,
    colorOptions: ['#F43F5E', '#A855F7', '#38BDF8'],
    fallbackPrimitive: 'cylinder',
    description: 'Enchanted starcloth amplifying magical focus and evasive agility.',
  },
  'futuristic-suit': {
    id: 'futuristic-suit',
    name: 'Cyber Mesh Bodysuit',
    slot: 'torso',
    socketName: 'socket_chest',
    stats: { hp: 260, atk: 18, def: 30, spd: 14, crit: 10 },
    rarity: 'rare',
    cost: 320,
    colorOptions: ['#00FF66', '#00F0FF', '#111827'],
    fallbackPrimitive: 'box',
    description: 'Nanofiber kinetic suit providing balanced protection and maneuverability.',
  },
  'hoodie': {
    id: 'hoodie',
    name: 'Neon Street Hoodie',
    slot: 'torso',
    socketName: 'socket_chest',
    stats: { hp: 180, atk: 14, def: 20, spd: 12, crit: 5 },
    rarity: 'common',
    cost: 0,
    colorOptions: ['#7C5CFF', '#22D3EE', '#18181B'],
    fallbackPrimitive: 'box',
    description: 'Casual thermal streetwear with reinforced internal stitching.',
  },
  'tshirt': {
    id: 'tshirt',
    name: 'Classic Tee',
    slot: 'torso',
    socketName: 'socket_chest',
    stats: { hp: 150, atk: 8, def: 15, spd: 10, crit: 5 },
    rarity: 'common',
    cost: 0,
    colorOptions: ['#FFFFFF', '#000000', '#3B82F6'],
    fallbackPrimitive: 'box',
    description: 'Lightweight standard athletic shirt.',
  },

  // ─── LEGS / BOTTOMS (Socket: socket_hip) ───
  'armor-pants': {
    id: 'armor-pants',
    name: 'Reinforced Greaves',
    slot: 'legs',
    socketName: 'socket_hip',
    stats: { hp: 200, atk: 0, def: 35, spd: -2, crit: 0 },
    rarity: 'rare',
    cost: 260,
    colorOptions: ['#475569', '#1E293B', '#F59E0B'],
    fallbackPrimitive: 'box',
    description: 'Segmented leg armor protecting joints and femoral arteries.',
  },
  'skirt': {
    id: 'skirt',
    name: 'Pleated Combat Skirt',
    slot: 'legs',
    socketName: 'socket_hip',
    stats: { hp: 120, atk: 6, def: 12, spd: 16, crit: 8 },
    rarity: 'common',
    cost: 0,
    colorOptions: ['#1E3A5F', '#2C2C2C', '#FF5C93'],
    fallbackPrimitive: 'cylinder',
    description: 'Unrestricted leg freedom facilitating rapid sidesteps and lunges.',
  },
  'frill-skirt': {
    id: 'frill-skirt',
    name: 'Lace Petticoat',
    slot: 'legs',
    socketName: 'socket_hip',
    stats: { hp: 140, atk: 8, def: 16, spd: 12, crit: 10 },
    rarity: 'rare',
    cost: 180,
    colorOptions: ['#FF5C93', '#F43F5E', '#A855F7'],
    fallbackPrimitive: 'cylinder',
    description: 'Multi-layered petticoat creating aerodynamic defensive cushioning.',
  },
  'jeans': {
    id: 'jeans',
    name: 'Tactical Denim',
    slot: 'legs',
    socketName: 'socket_hip',
    stats: { hp: 140, atk: 4, def: 18, spd: 8, crit: 4 },
    rarity: 'common',
    cost: 0,
    colorOptions: ['#1E3A5F', '#1F2937'],
    fallbackPrimitive: 'box',
    description: 'Durable denim reinforced for daily wear and street skirmishes.',
  },

  // ─── SHOES (Socket: socket_feet) ───
  'boots': {
    id: 'boots',
    name: 'Heavy Combat Boots',
    slot: 'shoes',
    socketName: 'socket_feet',
    stats: { hp: 100, atk: 6, def: 20, spd: 4, crit: 2 },
    rarity: 'rare',
    cost: 160,
    colorOptions: ['#0F172A', '#78716C'],
    fallbackPrimitive: 'box',
    description: 'Steel-toed boots providing firm footing and recoil stabilization.',
  },
  'sneakers': {
    id: 'sneakers',
    name: 'Aero Dash Sneakers',
    slot: 'shoes',
    socketName: 'socket_feet',
    stats: { hp: 60, atk: 4, def: 8, spd: 18, crit: 6 },
    rarity: 'common',
    cost: 0,
    colorOptions: ['#FFFFFF', '#00FF66', '#FF0055'],
    fallbackPrimitive: 'box',
    description: 'Pneumatic shock absorbing soles maximizing dash acceleration.',
  },

  // ─── ACCESSORIES (Socket: socket_head or socket_back) ───
  'wings': {
    id: 'wings',
    name: 'Fairy Starlight Wings',
    slot: 'accessory',
    socketName: 'socket_back',
    stats: { hp: 80, atk: 12, def: 10, spd: 25, crit: 12 },
    rarity: 'legendary',
    cost: 650,
    colorOptions: ['#F43F5E', '#38BDF8', '#34D399'],
    fallbackPrimitive: 'crescent',
    description: 'Glistening gossamer wings granting aerial evasion and rapid strike speed.',
  },
  'plasma-jetpack': {
    id: 'plasma-jetpack',
    name: 'Ionized Thruster Pack',
    slot: 'accessory',
    socketName: 'socket_back',
    stats: { hp: 110, atk: 18, def: 16, spd: 18, crit: 8 },
    rarity: 'epic',
    cost: 480,
    colorOptions: ['#22D3EE', '#F59E0B'],
    fallbackPrimitive: 'cylinder',
    description: 'High-thrust back thrusters for dynamic positional lunging.',
  },
  'horns': {
    id: 'horns',
    name: 'Cyber Demon Horns',
    slot: 'accessory',
    socketName: 'socket_head',
    stats: { hp: 50, atk: 22, def: 8, spd: 6, crit: 15 },
    rarity: 'rare',
    cost: 240,
    colorOptions: ['#EF4444', '#A855F7', '#00FF66'],
    fallbackPrimitive: 'cylinder',
    description: 'Hardened sensory horns that heighten critical strike tracking.',
  },
  'cat-ears': {
    id: 'cat-ears',
    name: 'Kawaii Neko Audio Plugs',
    slot: 'accessory',
    socketName: 'socket_head',
    stats: { hp: 40, atk: 10, def: 6, spd: 20, crit: 14 },
    rarity: 'rare',
    cost: 220,
    colorOptions: ['#FF5C93', '#FFFFFF', '#111827'],
    fallbackPrimitive: 'crescent',
    description: 'Acoustic feline sensors giving earlier incoming attack detection.',
  },
};

/**
 * Compute aggregate combat stats from part catalog IDs
 */
export function calculateCatalogStats(partIds: string[]): {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
} {
  const total = { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 };
  for (const id of partIds) {
    const part = PART_CATALOG[id];
    if (part) {
      total.hp += part.stats.hp;
      total.atk += part.stats.atk;
      total.def += part.stats.def;
      total.spd += part.stats.spd;
      total.crit += part.stats.crit;
    }
  }
  return total;
}
