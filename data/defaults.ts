// data/defaults.ts
import { AvatarConfig } from '@/types/avatar';
import { v4 as uuidv4 } from 'uuid';

export function createDefaultAvatar(name = 'My Avatar'): AvatarConfig {
  return {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    body: { type: 'regular', height: 1.0, headSize: 1.0, bodySize: 1.0 },
    skinTone: '#E8B887',
    face: {
      shape: 'round',
      eyes: 'normal',
      eyebrows: 'normal',
      nose: 'normal',
      mouth: 'normal',
      expression: 'neutral',
    },
    hair: 'short',
    hairColor: '#2C1810',
    top: 'tshirt',
    topColor: '#7C5CFF',
    bottom: 'jeans',
    bottomColor: '#1E3A5F',
    shoes: 'sneakers',
    shoeColor: '#FFFFFF',
    accessories: {},
    accessoryColor: '#FFD700',
  };
}

export const randomHairColors = [
  '#2C1810', '#8B4513', '#FFD700', '#FF6B6B',
  '#4A90D9', '#9B59B6', '#2ECC71', '#E8B887',
  '#1A1A1A', '#F5F5F5', '#FF69B4', '#00CED1',
];

export const randomTopColors = [
  '#7C5CFF', '#22D3EE', '#FF5C93', '#FF6B35',
  '#2ECC71', '#F39C12', '#E74C3C', '#1A1A2E',
  '#16213E', '#0F3460', '#533483', '#E94560',
];
