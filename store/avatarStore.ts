'use client';
// store/avatarStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AvatarConfig, StudioCategory } from '@/types/avatar';
import { createDefaultAvatar } from '@/data/defaults';
import { PRESET_AVATARS } from '@/data/presets';

interface AvatarStore {
  // Current editing avatar
  currentAvatar: AvatarConfig;
  // Saved avatars
  savedAvatars: AvatarConfig[];
  // Undo/redo history
  history: AvatarConfig[];
  historyIndex: number;
  // Studio UI state
  activeCategory: StudioCategory;
  // Recent colors
  recentColors: string[];

  // Actions
  updateAvatar: (partial: Partial<AvatarConfig>) => void;
  updateBody: (partial: Partial<AvatarConfig['body']>) => void;
  updateFace: (partial: Partial<AvatarConfig['face']>) => void;
  updateAccessories: (partial: Partial<AvatarConfig['accessories']>) => void;
  saveAvatar: () => void;
  loadAvatar: (id: string) => void;
  deleteAvatar: (id: string) => void;
  renameAvatar: (id: string, name: string) => void;
  createNewAvatar: () => void;
  randomizeAvatar: () => void;
  resetAvatar: () => void;
  undo: () => void;
  redo: () => void;
  setActiveCategory: (cat: StudioCategory) => void;
  addRecentColor: (color: string) => void;
}

const HAIR_OPTIONS = ['twintails', 'twin-buns', 'hime-cut', 'fluffy-short', 'short', 'long', 'spiky', 'curly', 'ponytail', 'anime', 'futuristic', 'bob'];
const TOP_OPTIONS = ['lolita-dress', 'maid-dress', 'magical-dress', 'sundress', 'princess-gown', 'cyber-dress', 'hoodie-dress', 'tshirt', 'hoodie', 'jacket', 'armor', 'futuristic-suit', 'crop'];
const BOTTOM_OPTIONS = ['skirt', 'frill-skirt', 'tutu', 'maid-apron-skirt', 'shorts', 'jeans', 'cargo', 'armor-pants', 'joggers', 'leggings'];
const SHOE_OPTIONS = ['sneakers', 'boots', 'futuristic-shoes', 'combat-boots'];
const BODY_TYPES = ['slim', 'regular', 'broad', 'chibi'] as const;
const HAIR_COLORS = ['#2C1810', '#8B4513', '#FFD700', '#FF6B6B', '#4A90D9', '#9B59B6', '#2ECC71', '#1A1A1A', '#FF69B4'];
const TOP_COLORS = ['#7C5CFF', '#22D3EE', '#FF5C93', '#FF6B35', '#2ECC71', '#F39C12', '#E74C3C', '#1A1A2E'];
const BOTTOM_COLORS = ['#1E3A5F', '#2C2C2C', '#4A3728', '#1A3A2A', '#3D1A3A', '#2A1A3A'];
const SHOE_COLORS = ['#FFFFFF', '#000000', '#FF5C93', '#22D3EE', '#7C5CFF', '#FFD700'];
const SKIN_TONES = ['#FDDBB4', '#F5C895', '#E8B887', '#D4936A', '#C17D4C', '#A0622A', '#7A4416', '#4A2810'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DEFAULT_AVATAR = createDefaultAvatar();
const INITIAL_SAVED_BUILDS = PRESET_AVATARS.map((p) => p.avatar);

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      currentAvatar: DEFAULT_AVATAR,
      savedAvatars: INITIAL_SAVED_BUILDS,
      history: [DEFAULT_AVATAR],
      historyIndex: 0,
      activeCategory: 'body',
      recentColors: [],

      updateAvatar: (partial) => {
        const updated = {
          ...get().currentAvatar,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        set({
          currentAvatar: updated,
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        });
      },

      updateBody: (partial) => {
        const current = get().currentAvatar;
        get().updateAvatar({ body: { ...current.body, ...partial } });
      },

      updateFace: (partial) => {
        const current = get().currentAvatar;
        get().updateAvatar({ face: { ...current.face, ...partial } });
      },

      updateAccessories: (partial) => {
        const current = get().currentAvatar;
        get().updateAvatar({ accessories: { ...current.accessories, ...partial } });
      },

      saveAvatar: () => {
        const current = get().currentAvatar;
        const saved = get().savedAvatars;
        const existing = saved.findIndex((a) => a.id === current.id);
        const updated = { ...current, updatedAt: new Date().toISOString() };
        if (existing >= 0) {
          const newSaved = [...saved];
          newSaved[existing] = updated;
          set({ savedAvatars: newSaved, currentAvatar: updated });
        } else {
          set({ savedAvatars: [...saved, updated], currentAvatar: updated });
        }
      },

      loadAvatar: (id) => {
        const avatar = get().savedAvatars.find((a) => a.id === id);
        if (avatar) {
          set({
            currentAvatar: avatar,
            history: [avatar],
            historyIndex: 0,
          });
        }
      },

      deleteAvatar: (id) => {
        set({ savedAvatars: get().savedAvatars.filter((a) => a.id !== id) });
      },

      renameAvatar: (id, name) => {
        set({
          savedAvatars: get().savedAvatars.map((a) =>
            a.id === id ? { ...a, name, updatedAt: new Date().toISOString() } : a
          ),
        });
        if (get().currentAvatar.id === id) {
          set({ currentAvatar: { ...get().currentAvatar, name } });
        }
      },

      createNewAvatar: () => {
        const fresh = createDefaultAvatar();
        set({
          currentAvatar: fresh,
          history: [fresh],
          historyIndex: 0,
        });
      },

      randomizeAvatar: () => {
        const current = get().currentAvatar;
        get().updateAvatar({
          hair: pick(HAIR_OPTIONS),
          hairColor: pick(HAIR_COLORS),
          top: pick(TOP_OPTIONS),
          topColor: pick(TOP_COLORS),
          bottom: pick(BOTTOM_OPTIONS),
          bottomColor: pick(BOTTOM_COLORS),
          shoes: pick(SHOE_OPTIONS),
          shoeColor: pick(SHOE_COLORS),
          skinTone: pick(SKIN_TONES),
          body: {
            ...current.body,
            type: pick([...BODY_TYPES]),
          },
        });
      },

      resetAvatar: () => {
        const fresh = createDefaultAvatar();
        const withId = { ...fresh, id: get().currentAvatar.id, name: get().currentAvatar.name };
        const { history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(withId);
        set({
          currentAvatar: withId,
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({ currentAvatar: history[newIndex], historyIndex: newIndex });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({ currentAvatar: history[newIndex], historyIndex: newIndex });
        }
      },

      setActiveCategory: (cat) => set({ activeCategory: cat }),

      addRecentColor: (color) => {
        const recent = get().recentColors.filter((c) => c !== color);
        set({ recentColors: [color, ...recent].slice(0, 12) });
      },
    }),
    {
      name: 'singularity-avatar-builder',
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          // SSR / no localStorage: in-memory fallback
          const store = new Map<string, string>();
          return {
            getItem: (key) => store.get(key) ?? null,
            setItem: (key, value) => store.set(key, value),
            removeItem: (key) => store.delete(key),
          };
        }
      }),
      partialize: (state) => ({
        currentAvatar: state.currentAvatar,
        savedAvatars: state.savedAvatars,
        recentColors: state.recentColors,
      }),
    }
  )
);
