// data/accessories.ts
import { AvatarItem } from '@/types/avatar';

export const accessories: AvatarItem[] = [
  // Head slot
  { id: 'glasses', name: 'Glasses', category: 'accessories', rarity: 'common', locked: false },
  { id: 'hat', name: 'Top Hat', category: 'accessories', rarity: 'rare', locked: false },
  { id: 'cap', name: 'Cap', category: 'accessories', rarity: 'common', locked: false },
  { id: 'headphones', name: 'Headphones', category: 'accessories', rarity: 'epic', locked: false },
  { id: 'crown', name: 'Crown', category: 'accessories', rarity: 'legendary', locked: false },
  // Face slot
  { id: 'mask', name: 'Mask', category: 'accessories', rarity: 'rare', locked: false },
  { id: 'visor', name: 'Visor', category: 'accessories', rarity: 'epic', locked: false },
  // Back slot
  { id: 'backpack', name: 'Backpack', category: 'accessories', rarity: 'common', locked: false },
  { id: 'wings', name: 'Wings', category: 'accessories', rarity: 'legendary', locked: false },
  { id: 'jetpack', name: 'Jetpack', category: 'accessories', rarity: 'epic', locked: false },
  // Shoulder slot
  { id: 'shoulder-pads', name: 'Shoulder Pads', category: 'accessories', rarity: 'rare', locked: false },
  { id: 'pauldrons', name: 'Pauldrons', category: 'accessories', rarity: 'legendary', locked: true },
];
