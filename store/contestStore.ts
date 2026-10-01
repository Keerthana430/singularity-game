'use client';
// store/contestStore.ts
// Client-side state management for the Avatar Beauty Contest.
// Each team can submit a build and cast exactly one "like" vote to another build.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AvatarConfig } from '@/types/avatar';

export interface ContestEntry {
  id: string;
  name: string;
  teamName: string;
  avatarConfig: AvatarConfig;
  likes: number;
  likedBy: string[]; // team names that voted for this entry
  submittedAt: string;
  tagline: string;
}

interface ContestStore {
  entries: ContestEntry[];
  myTeamName: string;
  hasSubmitted: boolean;
  hasVoted: boolean;
  votedForId: string | null;
  myEntryId: string | null;

  setTeamName: (name: string) => void;
  submitEntry: (avatar: AvatarConfig, tagline: string) => void;
  voteForEntry: (entryId: string) => boolean;
  removeMyEntry: () => void;
  getLeaderboard: () => ContestEntry[];
}

// Seed contest with pre-existing NPC entries for a lively gallery
const SEED_ENTRIES: ContestEntry[] = [
  {
    id: 'contest-npc-1',
    name: 'NOVA-PRISMA',
    teamName: 'Team Nebula',
    avatarConfig: {
      id: 'contest-npc-1',
      name: 'NOVA-PRISMA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: { type: 'slim', height: 1.0, headSize: 1.0, bodySize: 0.98 },
      skinTone: '#FDDBB4',
      face: { shape: 'oval', eyes: 'glowing', eyebrows: 'arched', nose: 'small', mouth: 'smile', expression: 'confident' },
      hair: 'anime',
      hairColor: '#FF69B4',
      top: 'futuristic-suit',
      topColor: '#FF69B4',
      bottom: 'leggings',
      bottomColor: '#1A1A2E',
      shoes: 'futuristic-shoes',
      shoeColor: '#FF69B4',
      accessories: { head: 'crown', back: 'wings' },
      accessoryColor: '#FFD700',
    },
    likes: 127,
    likedBy: ['Team Alpha', 'Team Omega', 'Team Sigma'],
    submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    tagline: 'Celestial radiance meets neon couture. Born from starlight.',
  },
  {
    id: 'contest-npc-2',
    name: 'SHADOW-LUX',
    teamName: 'Team Phantom',
    avatarConfig: {
      id: 'contest-npc-2',
      name: 'SHADOW-LUX',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: { type: 'regular', height: 1.05, headSize: 0.95, bodySize: 1.0 },
      skinTone: '#C17D4C',
      face: { shape: 'sharp', eyes: 'cyber', eyebrows: 'fierce', nose: 'straight', mouth: 'serious', expression: 'fierce' },
      hair: 'futuristic',
      hairColor: '#9B59B6',
      top: 'armor',
      topColor: '#1A1A2E',
      bottom: 'armor-pants',
      bottomColor: '#16213E',
      shoes: 'combat-boots',
      shoeColor: '#9B59B6',
      accessories: { face: 'visor', shoulder: 'shoulder-pads' },
      accessoryColor: '#9B59B6',
    },
    likes: 98,
    likedBy: ['Team Blaze', 'Team Frost'],
    submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    tagline: 'Dark elegance forged in obsidian void. Stealth meets style.',
  },
  {
    id: 'contest-npc-3',
    name: 'CYBER-BLOOM',
    teamName: 'Team Sakura',
    avatarConfig: {
      id: 'contest-npc-3',
      name: 'CYBER-BLOOM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: { type: 'chibi', height: 0.85, headSize: 1.25, bodySize: 0.9 },
      skinTone: '#F5C895',
      face: { shape: 'round', eyes: 'wide', eyebrows: 'normal', nose: 'button', mouth: 'laugh', expression: 'playful' },
      hair: 'twintails',
      hairColor: '#FF5C93',
      top: 'lolita-dress',
      topColor: '#FF5C93',
      bottom: 'frill-skirt',
      bottomColor: '#FFB6C1',
      shoes: 'boots',
      shoeColor: '#FF69B4',
      accessories: { head: 'bow', back: 'wings' },
      accessoryColor: '#FF69B4',
    },
    likes: 156,
    likedBy: ['Team Nova', 'Team Luna', 'Team Pixel', 'Team Glitch'],
    submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    tagline: 'Kawaii overload! Maximum cute energy in a cyberpunk shell.',
  },
  {
    id: 'contest-npc-4',
    name: 'IRON-FORGE',
    teamName: 'Team Titan',
    avatarConfig: {
      id: 'contest-npc-4',
      name: 'IRON-FORGE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: { type: 'broad', height: 1.15, headSize: 0.92, bodySize: 1.2 },
      skinTone: '#A0622A',
      face: { shape: 'square', eyes: 'focused', eyebrows: 'thick', nose: 'broad', mouth: 'smirk', expression: 'determined' },
      hair: 'short',
      hairColor: '#FFD700',
      top: 'armor',
      topColor: '#FFD700',
      bottom: 'cargo',
      bottomColor: '#2C2C2C',
      shoes: 'combat-boots',
      shoeColor: '#FFD700',
      accessories: { back: 'jetpack', head: 'glasses' },
      accessoryColor: '#F39C12',
    },
    likes: 73,
    likedBy: ['Team Vortex'],
    submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    tagline: 'Pure gilded power. The golden juggernaut of the arena.',
  },
  {
    id: 'contest-npc-5',
    name: 'GLITCH-WAVE',
    teamName: 'Team Matrix',
    avatarConfig: {
      id: 'contest-npc-5',
      name: 'GLITCH-WAVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: { type: 'slim', height: 1.0, headSize: 1.0, bodySize: 0.95 },
      skinTone: '#7A4416',
      face: { shape: 'sharp', eyes: 'cyber', eyebrows: 'fierce', nose: 'straight', mouth: 'serious', expression: 'fierce' },
      hair: 'spiky',
      hairColor: '#00FF66',
      top: 'hoodie',
      topColor: '#00FF66',
      bottom: 'joggers',
      bottomColor: '#0A0A0A',
      shoes: 'sneakers',
      shoeColor: '#00FF66',
      accessories: { head: 'headphones', face: 'mask' },
      accessoryColor: '#00FF66',
    },
    likes: 112,
    likedBy: ['Team Echo', 'Team Delta'],
    submittedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    tagline: 'Digital street pharaoh. Neon green drip from head to toe.',
  },
  {
    id: 'contest-npc-6',
    name: 'LUNA-FROST',
    teamName: 'Team Crescent',
    avatarConfig: {
      id: 'contest-npc-6',
      name: 'LUNA-FROST',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: { type: 'regular', height: 1.0, headSize: 1.0, bodySize: 1.0 },
      skinTone: '#FDDBB4',
      face: { shape: 'oval', eyes: 'glowing', eyebrows: 'arched', nose: 'small', mouth: 'smile', expression: 'confident' },
      hair: 'hime-cut',
      hairColor: '#22D3EE',
      top: 'magical-dress',
      topColor: '#22D3EE',
      bottom: 'skirt',
      bottomColor: '#E0F7FA',
      shoes: 'boots',
      shoeColor: '#22D3EE',
      accessories: { head: 'crown', back: 'cape' },
      accessoryColor: '#B3E5FC',
    },
    likes: 89,
    likedBy: ['Team Prism'],
    submittedAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
    tagline: 'Ice queen of the digital moonrise. Frozen elegance.',
  },
];

export const useContestStore = create<ContestStore>()(
  persist(
    (set, get) => ({
      entries: SEED_ENTRIES,
      myTeamName: '',
      hasSubmitted: false,
      hasVoted: false,
      votedForId: null,
      myEntryId: null,

      setTeamName: (name) => set({ myTeamName: name }),

      submitEntry: (avatar, tagline) => {
        const { myTeamName, entries } = get();
        if (!myTeamName) return;

        const entry: ContestEntry = {
          id: `contest-${Date.now()}`,
          name: avatar.name,
          teamName: myTeamName,
          avatarConfig: avatar,
          likes: 0,
          likedBy: [],
          submittedAt: new Date().toISOString(),
          tagline: tagline || 'A stunning avatar build.',
        };

        set({
          entries: [...entries, entry],
          hasSubmitted: true,
          myEntryId: entry.id,
        });
      },

      voteForEntry: (entryId) => {
        const { myEntryId, myTeamName, entries, votedForId } = get();
        if (entryId === myEntryId) return false; // Can't vote for yourself
        if (!myTeamName) return false;
        if (votedForId === entryId) return false; // Already voted for this build

        // If previously voted for another build, transfer vote (-1 from old, +1 to new)
        const updated = entries.map((e) => {
          if (votedForId && e.id === votedForId) {
            return {
              ...e,
              likes: Math.max(0, e.likes - 1),
              likedBy: e.likedBy.filter((t) => t !== myTeamName),
            };
          }
          if (e.id === entryId) {
            return {
              ...e,
              likes: e.likes + 1,
              likedBy: [...e.likedBy.filter((t) => t !== myTeamName), myTeamName],
            };
          }
          return e;
        });

        set({
          entries: updated,
          hasVoted: true,
          votedForId: entryId,
        });
        return true;
      },

      removeMyEntry: () => {
        const { myEntryId, entries } = get();
        set({
          entries: entries.filter((e) => e.id !== myEntryId),
          hasSubmitted: false,
          myEntryId: null,
        });
      },

      getLeaderboard: () => {
        return [...get().entries].sort((a, b) => b.likes - a.likes);
      },
    }),
    {
      name: 'singularity-beauty-contest',
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          const store = new Map<string, string>();
          return {
            getItem: (key) => store.get(key) ?? null,
            setItem: (key, value) => store.set(key, value),
            removeItem: (key) => store.delete(key),
          };
        }
      }),
      partialize: (state) => ({
        entries: state.entries,
        myTeamName: state.myTeamName,
        hasSubmitted: state.hasSubmitted,
        hasVoted: state.hasVoted,
        votedForId: state.votedForId,
        myEntryId: state.myEntryId,
      }),
    }
  )
);
