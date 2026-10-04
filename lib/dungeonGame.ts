export type RoomType = 'combat' | 'elite' | 'treasure' | 'shop' | 'healing' | 'event' | 'boss';
export type EnemyArchetype = 'melee' | 'ranged' | 'assassin' | 'tank' | 'swarm' | 'mage' | 'support' | 'boss';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cursed';

export interface FloorDefinition {
  name: string;
  subtitle: string;
  color: string;
  enemies: string[];
  boss: string;
}

export interface RoomNode {
  id: string;
  type: RoomType;
  label: string;
  description: string;
  visited: boolean;
  cleared: boolean;
  discovered: boolean;
  x: number;
  y: number;
}

export interface EnemyDefinition {
  name: string;
  archetype: EnemyArchetype;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  color: string;
}

export interface LootItem {
  id: string;
  name: string;
  rarity: Rarity;
  kind: 'weapon' | 'armor' | 'relic' | 'potion';
  description: string;
  attack?: number;
  defense?: number;
  maxHp?: number;
  crit?: number;
  healing?: number;
}

export const FLOORS: FloorDefinition[] = [
  { name: 'The Forgotten Entrance', subtitle: 'Cold steel. Older memories.', color: 'var(--brand)', enemies: ['Dungeon Slime', 'Skeleton', 'Cave Bat'], boss: 'The Gate Warden' },
  { name: 'The Blood Sewers', subtitle: 'The walls pulse beneath the waterline.', color: '#ef4444', enemies: ['Armored Skeleton', 'Poison Spider', 'Berserker Goblin'], boss: 'The Sewer Maw' },
  { name: 'The Ruined Temple', subtitle: 'Every prayer ends in a whisper.', color: '#c084fc', enemies: ['Shadow Assassin', 'Cultist', 'Demon Hound'], boss: 'The Hollow Saint' },
  { name: 'The Abyss', subtitle: 'Gravity is only another lie down here.', color: '#22d3ee', enemies: ['Void Creature', 'Elite Knight', 'Corrupted Mage'], boss: 'The Gravity Tyrant' },
  { name: 'The Core', subtitle: 'The dungeon has started saying your name.', color: '#f59e0b', enemies: ['Abyssal Warrior', 'Soul Eater', 'Void Beast'], boss: 'The Memory Eater' },
  { name: 'The Heart of the Dungeon', subtitle: 'You have been here before.', color: '#fb7185', enemies: ['Echo of You', 'Core Sentinel', 'Broken Guardian'], boss: 'The Dungeon Core' },
];

const ROOM_DATA: Record<RoomType, { label: string; description: string }> = {
  combat: { label: 'Combat', description: 'Hostile signals detected. Clear the chamber to continue.' },
  elite: { label: 'Elite', description: 'An empowered enemy guards a high-value cache.' },
  treasure: { label: 'Treasure', description: 'A sealed relic chamber. The lock is already warm.' },
  shop: { label: 'Shop', description: 'A strange merchant trades survival for gold.' },
  healing: { label: 'Medbay', description: 'A forgotten repair cradle still has one charge.' },
  event: { label: 'Mystery', description: 'The dungeon offers a choice, and remembers your answer.' },
  boss: { label: 'Boss', description: 'The next door leads deeper into the living dungeon.' },
};

export function makeRoomMap(floor: number, seed = Date.now()): RoomNode[] {
  const random = seeded(seed + floor * 997);
  const types: RoomType[] = ['combat', 'combat', 'elite', 'treasure', 'shop', 'healing', 'event', 'boss'];
  const shuffled = [...types.slice(0, -1)].sort(() => random() - 0.5);
  const selected = [shuffled[0], shuffled[1], shuffled[2], shuffled[3], shuffled[4], 'boss' as RoomType];
  return selected.map((type, index) => ({
    id: `${floor}-${index}-${Math.floor(random() * 9999)}`,
    type,
    label: ROOM_DATA[type].label,
    description: ROOM_DATA[type].description,
    visited: index === 0,
    cleared: false,
    discovered: index < 2,
    x: index % 3,
    y: Math.floor(index / 3),
  }));
}

export function getEnemyDefinition(name: string, floor: number, elite = false): EnemyDefinition {
  const base = 1 + floor * 0.22;
  const presets: Record<string, Omit<EnemyDefinition, 'maxHp' | 'attack' | 'defense'>> = {
    'Dungeon Slime': { name, archetype: 'swarm', speed: 0.08, range: 0.75, color: '#00ff66' },
    Skeleton: { name, archetype: 'melee', speed: 0.12, range: 0.95, color: '#cbd5e1' },
    'Cave Bat': { name, archetype: 'ranged', speed: 0.15, range: 3.1, color: '#a78bfa' },
    'Armored Skeleton': { name, archetype: 'tank', speed: 0.08, range: 1.0, color: '#94a3b8' },
    'Poison Spider': { name, archetype: 'ranged', speed: 0.13, range: 2.8, color: '#fb7185' },
    'Berserker Goblin': { name, archetype: 'melee', speed: 0.18, range: 0.8, color: '#f97316' },
    'Shadow Assassin': { name, archetype: 'assassin', speed: 0.22, range: 0.75, color: '#c084fc' },
    Cultist: { name, archetype: 'support', speed: 0.10, range: 2.5, color: '#fbbf24' },
    'Demon Hound': { name, archetype: 'melee', speed: 0.20, range: 0.9, color: '#f43f5e' },
    'Void Creature': { name, archetype: 'swarm', speed: 0.14, range: 1.0, color: '#22d3ee' },
    'Elite Knight': { name, archetype: 'tank', speed: 0.09, range: 1.05, color: '#38bdf8' },
    'Corrupted Mage': { name, archetype: 'mage', speed: 0.10, range: 3.4, color: '#e879f9' },
    'Abyssal Warrior': { name, archetype: 'melee', speed: 0.13, range: 1.0, color: '#f59e0b' },
    'Soul Eater': { name, archetype: 'assassin', speed: 0.18, range: 0.8, color: '#fb7185' },
    'Void Beast': { name, archetype: 'tank', speed: 0.07, range: 1.2, color: '#818cf8' },
    'Echo of You': { name, archetype: 'assassin', speed: 0.20, range: 1.0, color: '#fb7185' },
    'Core Sentinel': { name, archetype: 'ranged', speed: 0.12, range: 3.5, color: '#22d3ee' },
    'Broken Guardian': { name, archetype: 'support', speed: 0.08, range: 3.0, color: '#c084fc' },
  };
  const preset = presets[name] || presets.Skeleton;
  const multiplier = elite ? 1.45 : 1;
  return {
    ...preset,
    maxHp: Math.round((220 + floor * 85) * base * multiplier),
    attack: Math.round((28 + floor * 10) * base * (elite ? 1.18 : 1)),
    defense: Math.round((14 + floor * 4) * base * (elite ? 1.3 : 1)),
  };
}

export function getBossDefinition(floor: number): EnemyDefinition {
  const base = getEnemyDefinition(FLOORS[floor].boss, floor, true);
  return { ...base, archetype: 'boss', maxHp: Math.round(base.maxHp * 2.5), attack: Math.round(base.attack * 1.3), range: 1.4, speed: 0.1 };
}

export function rollLoot(floor: number, elite = false): LootItem {
  const loot: LootItem[] = [
    { id: 'edge', name: 'Void Edge', rarity: elite ? 'Epic' : 'Rare', kind: 'weapon', description: 'A weapon that remembers every critical strike.', attack: 18 + floor * 4, crit: 4 + floor },
    { id: 'plate', name: 'Reactive Plate', rarity: elite ? 'Rare' : 'Uncommon', kind: 'armor', description: 'Turns impact into a thin layer of armor.', defense: 11 + floor * 2, maxHp: 35 + floor * 8 },
    { id: 'core', name: 'Burning Core', rarity: elite ? 'Legendary' : 'Epic', kind: 'relic', description: 'Attacks can ignite enemies and briefly increase damage.', attack: 9 + floor * 2 },
    { id: 'potion', name: 'Health Potion', rarity: 'Common', kind: 'potion', description: 'Restore a portion of maximum HP.', healing: 0.35 },
  ];
  return loot[(Math.floor(Math.random() * loot.length) + floor + (elite ? 1 : 0)) % loot.length];
}

export function xpForLevel(level: number) { return Math.round(100 + (level - 1) * 70); }

function seeded(seed: number) {
  let value = Math.abs(seed) || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
