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
  // Coin currency & unlocked items
  coins: number;
  unlockedItems: string[];
  weaponLevels: Record<string, number>;

  // Post-battle healing timer
  /** Epoch timestamp (ms) when the last battle ended */
  lastBattleEndTime: number;
  /** Damage sustained as percentage of max HP (0–1) in last battle */
  lastBattleDamagePct: number;
  /** Healing duration in seconds calculated for the last battle */
  healingDurationSec: number;

  // Loadout management: Slot 1 is Our Rig (Custom Avatar), Slots 2 and 3 are distinct presets
  selectedLoadout: number;
  userCustomAvatar: AvatarConfig;
  loadoutSlots: Record<number, AvatarConfig>;

  // Actions
  selectLoadout: (slotNum: number) => void;
  resetLoadoutSlot: (slotNum: number) => void;
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
  // Economy actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  unlockItem: (itemId: string, cost: number) => boolean;
  upgradeWeapon: (weaponId: string, cost: number) => boolean;
  isItemUnlocked: (itemId: string) => boolean;
  topUpCoins: () => void;
  // Post-battle healing
  recordBattleEnd: (damagePct: number, isFairy: boolean) => void;
  /** Returns remaining healing seconds, 0 if healed */
  getRemainingHealTime: () => number;
  /** Returns true if avatar is still healing */
  isHealing: () => boolean;
  /** Instantly heal (costs coins) */
  instantHeal: () => void;
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

const STARTER_UNLOCKED = [
  'tshirt', 'hoodie', 'shirt', 'tank',
  'shorts', 'jeans', 'joggers',
  'sneakers',
  'short', 'long', 'ponytail', 'bob', 'bald',
  'glasses', 'cap',
  'unarmed',
];

const DEFAULT_AVATAR = createDefaultAvatar();
const INITIAL_SAVED_BUILDS = PRESET_AVATARS.map((p) => p.avatar);

export const PRESET_LOADOUT_2: AvatarConfig = {
  ...PRESET_AVATARS[1].avatar,
  weapon: 'cyber-staff',
  weaponColor: '#FF5C93',
  classRole: 'mage',
};

export const PRESET_LOADOUT_3: AvatarConfig = {
  ...PRESET_AVATARS[2].avatar,
  weapon: 'energy-hammer',
  weaponColor: '#F39C12',
  classRole: 'tank',
};

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set, get) => ({
      currentAvatar: DEFAULT_AVATAR,
      userCustomAvatar: DEFAULT_AVATAR,
      selectedLoadout: 1,
      loadoutSlots: {
        1: DEFAULT_AVATAR,
        2: PRESET_LOADOUT_2,
        3: PRESET_LOADOUT_3,
      },
      savedAvatars: INITIAL_SAVED_BUILDS,
      history: [DEFAULT_AVATAR],
      historyIndex: 0,
      activeCategory: 'body',
      recentColors: [],
      // Testing Phase: Unlimited Coins
      coins: 9999999,
      unlockedItems: STARTER_UNLOCKED,
      weaponLevels: { unarmed: 1 },
      // Post-battle healing timer state
      lastBattleEndTime: 0,
      lastBattleDamagePct: 0,
      healingDurationSec: 0,

      topUpCoins: () => {
        set({ coins: 9999999 });
      },

      addCoins: (amount) => {
        set({ coins: Math.max(9999999, get().coins + amount) });
      },

      spendCoins: (_amount) => {
        // Testing phase: unlimited coins! Never decline purchase, maintain unlimited funds
        set({ coins: 9999999 });
        return true;
      },

      unlockItem: (itemId, _cost) => {
        const { unlockedItems } = get();
        if (!unlockedItems.includes(itemId)) {
          set({
            coins: 9999999,
            unlockedItems: [...unlockedItems, itemId],
          });
        }
        return true;
      },

      upgradeWeapon: (weaponId, cost) => {
        const { weaponLevels, coins } = get();
        const currentLevel = weaponLevels[weaponId] || 1;
        if (currentLevel >= 5) return false;
        if (coins < cost) return false;
        set({
          coins: Math.max(0, coins - cost),
          weaponLevels: {
            ...weaponLevels,
            [weaponId]: Math.min(5, currentLevel + 1),
          },
        });
        return true;
      },

      isItemUnlocked: (itemId) => {
        const { unlockedItems } = get();
        return unlockedItems.includes(itemId);
      },

      // ─── Post-Battle Healing Timer Actions ──────────────────────
      recordBattleEnd: (damagePct: number, isFairy: boolean) => {
        if (damagePct <= 0) {
          set({ lastBattleEndTime: 0, lastBattleDamagePct: 0, healingDurationSec: 0 });
          return;
        }
        // Formula: linear scale from 30s (0% damage) to 300s (100% damage)
        // damagePct is 0–1 representing how much of maxHP was lost
        const rawDuration = 30 + damagePct * 270; // 30s to 300s (5 min)
        const duration = isFairy ? rawDuration * 0.6 : rawDuration; // Fairy heals 40% faster
        const finalDuration = Math.max(30, Math.min(300, Math.round(duration)));
        set({
          lastBattleEndTime: Date.now(),
          lastBattleDamagePct: damagePct,
          healingDurationSec: finalDuration,
        });
      },

      getRemainingHealTime: () => {
        const { lastBattleEndTime, healingDurationSec } = get();
        if (!lastBattleEndTime || !healingDurationSec) return 0;
        const elapsed = (Date.now() - lastBattleEndTime) / 1000;
        return Math.max(0, Math.round(healingDurationSec - elapsed));
      },

      isHealing: () => {
        return get().getRemainingHealTime() > 0;
      },

      instantHeal: () => {
        set({
          lastBattleEndTime: 0,
          lastBattleDamagePct: 0,
          healingDurationSec: 0,
        });
      },

      selectLoadout: (slotNum: number) => {
        const state = get();
        const activeSlot = state.selectedLoadout || 1;

        // Current custom avatar
        let userCustom = state.userCustomAvatar || state.currentAvatar || DEFAULT_AVATAR;

        // If currently on slot 1, save current avatar edits into custom slot
        if (activeSlot === 1) {
          userCustom = { ...state.currentAvatar };
        }

        const currentSlots: Record<number, AvatarConfig> = {
          1: userCustom,
          2: state.loadoutSlots?.[2] || PRESET_LOADOUT_2,
          3: state.loadoutSlots?.[3] || PRESET_LOADOUT_3,
          ...state.loadoutSlots,
        };

        if (activeSlot === 1) {
          currentSlots[1] = userCustom;
        } else {
          currentSlots[activeSlot] = { ...state.currentAvatar };
        }

        // Determine target avatar to activate
        let targetAvatar: AvatarConfig;
        if (slotNum === 1) {
          targetAvatar = userCustom;
        } else if (slotNum === 2) {
          targetAvatar = currentSlots[2] || PRESET_LOADOUT_2;
        } else {
          targetAvatar = currentSlots[3] || PRESET_LOADOUT_3;
        }

        set({
          selectedLoadout: slotNum,
          userCustomAvatar: userCustom,
          loadoutSlots: currentSlots,
          currentAvatar: targetAvatar,
          history: [targetAvatar],
          historyIndex: 0,
        });
      },

      resetLoadoutSlot: (slotNum: number) => {
        let resetConfig: AvatarConfig;
        if (slotNum === 1) {
          resetConfig = createDefaultAvatar('My Avatar');
        } else if (slotNum === 2) {
          resetConfig = { ...PRESET_LOADOUT_2 };
        } else {
          resetConfig = { ...PRESET_LOADOUT_3 };
        }

        const updatedSlots = {
          ...get().loadoutSlots,
          [slotNum]: resetConfig,
        };

        const isCurrentSlot = (get().selectedLoadout || 1) === slotNum;

        if (slotNum === 1) {
          set({
            userCustomAvatar: resetConfig,
            loadoutSlots: updatedSlots,
            ...(isCurrentSlot ? { currentAvatar: resetConfig, history: [resetConfig], historyIndex: 0 } : {}),
          });
        } else {
          set({
            loadoutSlots: updatedSlots,
            ...(isCurrentSlot ? { currentAvatar: resetConfig, history: [resetConfig], historyIndex: 0 } : {}),
          });
        }
      },

      updateAvatar: (partial) => {
        const state = get();
        const updated = {
          ...state.currentAvatar,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        const { history, historyIndex, selectedLoadout } = state;
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);

        const slot = selectedLoadout || 1;
        const currentSlots = {
          1: state.userCustomAvatar || state.currentAvatar,
          2: PRESET_LOADOUT_2,
          3: PRESET_LOADOUT_3,
          ...state.loadoutSlots,
          [slot]: updated,
        };

        // If on Slot 1 ("Our Avatar"), keep userCustomAvatar strictly synchronized
        let newUserCustom = state.userCustomAvatar || updated;
        if (slot === 1) {
          newUserCustom = updated;
          currentSlots[1] = updated;
        }

        set({
          currentAvatar: updated,
          userCustomAvatar: newUserCustom,
          loadoutSlots: currentSlots,
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
        const state = get();
        const current = state.currentAvatar;
        const slot = state.selectedLoadout || 1;
        const userCustom = slot === 1 ? current : (state.userCustomAvatar || current);
        const saved = state.savedAvatars;
        const existing = saved.findIndex((a) => a.id === current.id);
        const updated = { ...current, updatedAt: new Date().toISOString() };
        const newSaved = existing >= 0 ? [...saved] : [...saved, updated];
        if (existing >= 0) newSaved[existing] = updated;

        set({
          savedAvatars: newSaved,
          currentAvatar: updated,
          userCustomAvatar: userCustom,
          loadoutSlots: {
            ...state.loadoutSlots,
            [slot]: updated,
            1: userCustom,
          },
        });
      },

      loadAvatar: (id) => {
        const avatar = get().savedAvatars.find((a) => a.id === id);
        if (avatar) {
          const slot = get().selectedLoadout || 1;
          const updatedSlots = {
            ...get().loadoutSlots,
            [slot]: avatar,
          };
          set({
            currentAvatar: avatar,
            ...(slot === 1 ? { userCustomAvatar: avatar } : {}),
            loadoutSlots: updatedSlots,
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
          userCustomAvatar: fresh,
          selectedLoadout: 1,
          loadoutSlots: {
            ...get().loadoutSlots,
            1: fresh,
          },
          history: [fresh],
          historyIndex: 0,
        });
      },

      randomizeAvatar: () => {
        const current = get().currentAvatar;
        get().updateAvatar({
          gender: pick(['male', 'female'] as const),
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
        const slot = get().selectedLoadout || 1;
        get().resetLoadoutSlot(slot);
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
        userCustomAvatar: state.userCustomAvatar,
        loadoutSlots: state.loadoutSlots,
        selectedLoadout: state.selectedLoadout,
        savedAvatars: state.savedAvatars,
        recentColors: state.recentColors,
        lastBattleEndTime: state.lastBattleEndTime,
        lastBattleDamagePct: state.lastBattleDamagePct,
        healingDurationSec: state.healingDurationSec,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.userCustomAvatar) {
          const userSaved = state.savedAvatars?.find((a) => !a.id.startsWith('preset-'));
          state.userCustomAvatar = userSaved || state.currentAvatar || DEFAULT_AVATAR;
        }
        if (!state.loadoutSlots || !state.loadoutSlots[1]) {
          state.loadoutSlots = {
            1: state.userCustomAvatar || state.currentAvatar || DEFAULT_AVATAR,
            2: state.loadoutSlots?.[2] || PRESET_LOADOUT_2,
            3: state.loadoutSlots?.[3] || PRESET_LOADOUT_3,
          };
        }
        if (!state.selectedLoadout) {
          state.selectedLoadout = 1;
        }
      },
    }
  )
);
