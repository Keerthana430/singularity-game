// data/faces.ts
import { AvatarItem } from '@/types/avatar';

export const faceShapes: AvatarItem[] = [
  { id: 'round', name: 'Round', category: 'face', rarity: 'common', locked: false },
  { id: 'oval', name: 'Oval', category: 'face', rarity: 'common', locked: false },
  { id: 'square', name: 'Square', category: 'face', rarity: 'rare', locked: false },
  { id: 'heart', name: 'Heart', category: 'face', rarity: 'rare', locked: false },
];

export const eyeStyles: AvatarItem[] = [
  { id: 'sparkle', name: 'Sparkle Star', category: 'eyes', rarity: 'legendary', locked: false },
  { id: 'heart', name: 'Kawaii Heart', category: 'eyes', rarity: 'epic', locked: false },
  { id: 'wink', name: 'Playful Wink', category: 'eyes', rarity: 'rare', locked: false },
  { id: 'anime', name: 'Anime Glitter', category: 'eyes', rarity: 'epic', locked: false },
  { id: 'wide', name: 'Wide Cute', category: 'eyes', rarity: 'common', locked: false },
  { id: 'normal', name: 'Classic', category: 'eyes', rarity: 'common', locked: false },
  { id: 'cyber', name: 'Cyber Neon', category: 'eyes', rarity: 'legendary', locked: false },
  { id: 'narrow', name: 'Focused', category: 'eyes', rarity: 'rare', locked: false },
];

export const expressionStyles: AvatarItem[] = [
  { id: 'blushing', name: 'Rosy Blush', category: 'expression', rarity: 'rare', locked: false },
  { id: 'uwu', name: 'Cat Smile :3', category: 'expression', rarity: 'epic', locked: false },
  { id: 'happy', name: 'Happy Beam', category: 'expression', rarity: 'common', locked: false },
  { id: 'pout', name: 'Cute Pout', category: 'expression', rarity: 'rare', locked: false },
  { id: 'neutral', name: 'Calm', category: 'expression', rarity: 'common', locked: false },
  { id: 'cool', name: 'Smug Grin', category: 'expression', rarity: 'rare', locked: false },
  { id: 'fierce', name: 'Battle Ready', category: 'expression', rarity: 'rare', locked: false },
  { id: 'serious', name: 'Stoic', category: 'expression', rarity: 'common', locked: false },
];

export const skinTones = [
  '#FDDBB4', '#F5C895', '#E8B887', '#D4936A',
  '#C17D4C', '#A0622A', '#7A4416', '#4A2810',
];
