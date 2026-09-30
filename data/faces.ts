// data/faces.ts
import { AvatarItem } from '@/types/avatar';

export const faceShapes: AvatarItem[] = [
  { id: 'round', name: 'Round', category: 'face', rarity: 'common', locked: false },
  { id: 'oval', name: 'Oval', category: 'face', rarity: 'common', locked: false },
  { id: 'square', name: 'Square', category: 'face', rarity: 'rare', locked: false },
  { id: 'heart', name: 'Heart', category: 'face', rarity: 'rare', locked: false },
];

export const eyeStyles: AvatarItem[] = [
  { id: 'normal', name: 'Normal', category: 'eyes', rarity: 'common', locked: false },
  { id: 'wide', name: 'Wide', category: 'eyes', rarity: 'common', locked: false },
  { id: 'narrow', name: 'Narrow', category: 'eyes', rarity: 'rare', locked: false },
  { id: 'anime', name: 'Anime', category: 'eyes', rarity: 'epic', locked: false },
  { id: 'cyber', name: 'Cyber', category: 'eyes', rarity: 'legendary', locked: false },
];

export const expressionStyles: AvatarItem[] = [
  { id: 'neutral', name: 'Neutral', category: 'expression', rarity: 'common', locked: false },
  { id: 'happy', name: 'Happy', category: 'expression', rarity: 'common', locked: false },
  { id: 'serious', name: 'Serious', category: 'expression', rarity: 'common', locked: false },
  { id: 'fierce', name: 'Fierce', category: 'expression', rarity: 'rare', locked: false },
  { id: 'cool', name: 'Cool', category: 'expression', rarity: 'rare', locked: false },
];

export const skinTones = [
  '#FDDBB4', '#F5C895', '#E8B887', '#D4936A',
  '#C17D4C', '#A0622A', '#7A4416', '#4A2810',
];
