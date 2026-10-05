// data/pets.ts
// The 9 Adorable Pet Companions from reference image 3.
// Each pet provides a subtle stat boost and pure cuteness/vibe during dungeon monster hunts!

export interface PetCompanion {
  id: string;
  name: string;
  species: string;
  title: string;
  tagline: string;
  statKey: 'hp' | 'magic' | 'defense' | 'crit' | 'atk' | 'regen' | 'evasion' | 'gold' | 'speed';
  statBoostDesc: string;
  boostValue: number;
  emoji: string;
  color: string;
  accentBg: string;
  reactionEmojis: string[];
  cheerMessage: string;
}

export const PET_COMPANIONS: PetCompanion[] = [
  {
    id: 'pyra',
    name: 'Pyra',
    species: 'Baby Heart Drake',
    title: 'Warm Hearthkeeper',
    tagline: 'Clutches a glowing heart. Keeps your spirit warm in damp dark crypts.',
    statKey: 'hp',
    statBoostDesc: '+5% Max HP (Warm Heart)',
    boostValue: 0.05,
    emoji: '🐲',
    color: '#84CC16',
    accentBg: '#142918',
    reactionEmojis: ['❤️', '🔥', '✨', '🥰'],
    cheerMessage: 'Pyra cuddles close and breathes a gentle warm hearth flame!',
  },
  {
    id: 'gloop',
    name: 'Gloop',
    species: 'Cyclops Slime',
    title: 'Curious Arcane Eye',
    tagline: 'Waves its little gelatinous hands and pulses with lavender mana sparks.',
    statKey: 'magic',
    statBoostDesc: '+5% Magic Power (Arcane Gaze)',
    boostValue: 0.05,
    emoji: '👁️',
    color: '#C084FC',
    accentBg: '#231535',
    reactionEmojis: ['👁️', '✨', '💜', '💫'],
    cheerMessage: 'Gloop wiggles excitedly and channels a pulse of raw mana!',
  },
  {
    id: 'pops',
    name: 'Pops',
    species: 'Fluffy Yeti Pup',
    title: 'Frost Popsicle Guardian',
    tagline: 'Never goes anywhere without its blue ice popsicle. Fluffy and brave.',
    statKey: 'defense',
    statBoostDesc: '+5% Defense (Frost Guard)',
    boostValue: 0.05,
    emoji: '❄️',
    color: '#38BDF8',
    accentBg: '#102738',
    reactionEmojis: ['❄️', '🍧', '🐾', '💙'],
    cheerMessage: 'Pops shares a lick of its popsicle, shielding you with frosty courage!',
  },
  {
    id: 'nyx',
    name: 'Nyx',
    species: 'Night Bat Kitten',
    title: 'Shadow Prowler',
    tagline: 'Winks cheekily in the shadows with tiny bat wings and a cute skull collar.',
    statKey: 'crit',
    statBoostDesc: '+5% Crit Rate (Shadow Stalker)',
    boostValue: 0.05,
    emoji: '🦇',
    color: '#A855F7',
    accentBg: '#211233',
    reactionEmojis: ['🦇', '💀', '💜', '😉'],
    cheerMessage: 'Nyx flutters playfully overhead and marks a monster weak spot!',
  },
  {
    id: 'chomp',
    name: 'Chomp',
    species: 'Aqua Dino Kaiju',
    title: 'Little Lake Chomper',
    tagline: 'Tiny horns, brave heart, always ready to take a bite out of pesky goblins.',
    statKey: 'atk',
    statBoostDesc: '+5% Attack Power (Snap Bite)',
    boostValue: 0.05,
    emoji: '🦖',
    color: '#2DD4BF',
    accentBg: '#0F2B26',
    reactionEmojis: ['🦖', '⚡', '💥', '💪'],
    cheerMessage: 'Chomp roars a tiny ferocious squeak, inspiring your blade strike!',
  },
  {
    id: 'shroomie',
    name: 'Shroomie',
    species: 'Polka-Dot Sprout',
    title: 'Soothing Cap Spore',
    tagline: 'A chubby mushroom buddy that sprinkles restorative spores while waddling.',
    statKey: 'regen',
    statBoostDesc: '+8 HP/sec Regen (Healing Spores)',
    boostValue: 8,
    emoji: '🍄',
    color: '#F87171',
    accentBg: '#2E1515',
    reactionEmojis: ['🍄', '🍃', '💖', '🌸'],
    cheerMessage: 'Shroomie shakes its cap, releasing a shower of soothing vitality spores!',
  },
  {
    id: 'bubbles',
    name: 'Bubbles',
    species: 'Pink Axolotl',
    title: 'Hydro Glide Sprite',
    tagline: 'Frilly pink gills and a slippery translucent body that slips past hazards.',
    statKey: 'evasion',
    statBoostDesc: '+5% Evasion (Slipstream)',
    boostValue: 0.05,
    emoji: '🌸',
    color: '#F472B6',
    accentBg: '#2B1424',
    reactionEmojis: ['🌸', '🫧', '🌊', '😊'],
    cheerMessage: 'Bubbles blows a protective ring of water bubbles around your boots!',
  },
  {
    id: 'munch',
    name: 'Munch',
    species: 'Cookie Shadow Fiend',
    title: 'Sweet Tooth Snacker',
    tagline: 'Horns, fuzzy dark fur, and a chocolate chip cookie it refuses to drop.',
    statKey: 'gold',
    statBoostDesc: '+15% Gold Drops (Sweet Luck)',
    boostValue: 0.15,
    emoji: '🍪',
    color: '#60A5FA',
    accentBg: '#122035',
    reactionEmojis: ['🍪', '🪙', '😋', '⭐'],
    cheerMessage: 'Munch crunches its cookie happily, detecting hidden gold caches nearby!',
  },
  {
    id: 'sproutling',
    name: 'Sproutling',
    species: 'Leaf Puddle Slime',
    title: 'Nature Sprig Pudding',
    tagline: 'A gentle lime pudding with two cute leaves growing proudly on its head.',
    statKey: 'speed',
    statBoostDesc: '+5% Move Speed (Plant Sprint)',
    boostValue: 0.05,
    emoji: '🌱',
    color: '#A3E635',
    accentBg: '#182C10',
    reactionEmojis: ['🌱', '🍃', '🏃', '💚'],
    cheerMessage: 'Sproutling leaves a trail of energetic clover beneath your feet!',
  },
];
