// types/parts.ts
// Typed PartCatalog interface for modular avatar construction and combat stat aggregation

export type PartSlot =
  | 'head'
  | 'hair'
  | 'torso'
  | 'armLeft'
  | 'armRight'
  | 'legs'
  | 'shoes'
  | 'weapon'
  | 'accessory';

export type PartRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CombatStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number; // percentage (e.g. 15 = 15%)
}

export type SocketName =
  | 'socket_head'
  | 'socket_face'
  | 'socket_chest'
  | 'socket_hand_r'
  | 'socket_hand_l'
  | 'socket_hip'
  | 'socket_feet'
  | 'socket_back';

export interface PartDefinition {
  id: string;
  name: string;
  slot: PartSlot;
  socketName: SocketName;
  glbPath?: string; // Optional low-poly GLB path (CC0 Kenney/Quaternius)
  stats: CombatStats;
  rarity: PartRarity;
  cost: number;
  colorOptions: string[];
  fallbackPrimitive: 'box' | 'cylinder' | 'sphere' | 'capsule' | 'crescent';
  description?: string;
}

export type PartCatalog = Record<string, PartDefinition>;

export interface SerializedAvatarData {
  version: number;
  id: string;
  name: string;
  species: string;
  classRole: string;
  parts: {
    head?: string;
    hair?: string;
    torso?: string;
    legs?: string;
    shoes?: string;
    weapon?: string;
    accessory?: string;
  };
  colors: {
    skin: string;
    hair: string;
    top: string;
    bottom: string;
    shoes: string;
    weapon: string;
    accessory: string;
  };
}
