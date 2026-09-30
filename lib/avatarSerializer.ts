// lib/avatarSerializer.ts
// Plain JSON serializer for Avatar builds: encodes only part IDs, colors, species,
// and body traits without any heavy mesh or geometry payloads.

import { AvatarConfig } from '@/types/avatar';
import { SerializedAvatarData } from '@/types/parts';
import { createDefaultAvatar } from '@/data/defaults';

export function serializeAvatar(avatar: AvatarConfig): string {
  const data: SerializedAvatarData = {
    version: 1,
    id: avatar.id,
    name: avatar.name,
    species: avatar.species || 'human',
    classRole: avatar.classRole || 'warrior',
    parts: {
      hair: avatar.hair,
      torso: avatar.top,
      legs: avatar.bottom,
      shoes: avatar.shoes,
      weapon: avatar.weapon,
      accessory: avatar.accessories.head || avatar.accessories.back || avatar.accessories.face,
    },
    colors: {
      skin: avatar.skinTone,
      hair: avatar.hairColor,
      top: avatar.topColor,
      bottom: avatar.bottomColor,
      shoes: avatar.shoeColor,
      weapon: avatar.weaponColor || '#00FF66',
      accessory: avatar.accessoryColor,
    },
  };
  return JSON.stringify(data, null, 2);
}

export function deserializeAvatar(jsonStr: string): AvatarConfig | null {
  try {
    const parsed = JSON.parse(jsonStr) as SerializedAvatarData;
    if (!parsed || !parsed.parts || !parsed.colors) return null;

    const base = createDefaultAvatar();
    return {
      ...base,
      id: parsed.id || base.id,
      name: parsed.name || base.name,
      species: (parsed.species as any) || 'human',
      classRole: (parsed.classRole as any) || 'warrior',
      skinTone: parsed.colors.skin || base.skinTone,
      hair: parsed.parts.hair || base.hair,
      hairColor: parsed.colors.hair || base.hairColor,
      top: parsed.parts.torso || base.top,
      topColor: parsed.colors.top || base.topColor,
      bottom: parsed.parts.legs || base.bottom,
      bottomColor: parsed.colors.bottom || base.bottomColor,
      shoes: parsed.parts.shoes || base.shoes,
      shoeColor: parsed.colors.shoes || base.shoeColor,
      weapon: parsed.parts.weapon || base.weapon,
      weaponColor: parsed.colors.weapon || '#00FF66',
      accessories: {
        ...base.accessories,
        head: parsed.parts.accessory,
      },
      accessoryColor: parsed.colors.accessory || base.accessoryColor,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to deserialize avatar JSON:', err);
    return null;
  }
}
