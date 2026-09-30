// types/avatar.ts
export type BodyType = 'slim' | 'regular' | 'broad' | 'chibi';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AvatarBody {
  type: BodyType;
  height: number;
  headSize: number;
  bodySize: number;
}

export interface AvatarFace {
  shape: string;
  eyes: string;
  eyebrows: string;
  nose: string;
  mouth: string;
  expression: string;
}

export interface AvatarAccessories {
  head?: string;
  face?: string;
  back?: string;
  shoulder?: string;
}

export interface AvatarConfig {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  body: AvatarBody;
  skinTone: string;
  face: AvatarFace;
  hair: string;
  hairColor: string;
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  shoes: string;
  shoeColor: string;
  accessories: AvatarAccessories;
  accessoryColor: string;
}

export interface AvatarItem {
  id: string;
  name: string;
  category: string;
  preview?: string;
  color?: string;
  rarity: Rarity;
  locked: boolean;
}

export type StudioCategory =
  | 'body'
  | 'face'
  | 'hair'
  | 'tops'
  | 'bottoms'
  | 'shoes'
  | 'accessories'
  | 'colors';

export interface ColorHistory {
  hex: string;
}
