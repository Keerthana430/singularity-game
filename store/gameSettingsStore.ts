'use client';
// store/gameSettingsStore.ts
// Centralized visual effects, graphics quality, and accessibility options for all games

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sound, music } from '@/lib/audio';

export type FxQuality = 'ultra' | 'high' | 'balanced' | 'performance';

interface GameSettingsState {
  screenShake: boolean;
  fxQuality: FxQuality;
  reducedMotion: boolean;
  bloomEnabled: boolean;
  hitStopEnabled: boolean;
  particlesEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
  settingsModalOpen: boolean;

  // Actions
  setScreenShake: (enabled: boolean) => void;
  setFxQuality: (quality: FxQuality) => void;
  setReducedMotion: (enabled: boolean) => void;
  setBloomEnabled: (enabled: boolean) => void;
  setHitStopEnabled: (enabled: boolean) => void;
  setParticlesEnabled: (enabled: boolean) => void;
  setSfxVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  toggleMute: () => void;
  setSettingsModalOpen: (open: boolean) => void;
  resetDefaults: () => void;
}

export const useGameSettingsStore = create<GameSettingsState>()(
  persist(
    (set, get) => ({
      screenShake: true,
      fxQuality: 'high',
      reducedMotion: false,
      bloomEnabled: true,
      hitStopEnabled: true,
      particlesEnabled: true,
      sfxVolume: 0.75,
      musicVolume: 0.6,
      isMuted: false,
      settingsModalOpen: false,

      setScreenShake: (enabled) => set({ screenShake: enabled }),
      setFxQuality: (quality) => {
        set({
          fxQuality: quality,
          bloomEnabled: quality !== 'performance',
          particlesEnabled: quality !== 'performance',
        });
      },
      setReducedMotion: (enabled) => set({ reducedMotion: enabled, screenShake: !enabled }),
      setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
      setHitStopEnabled: (enabled) => set({ hitStopEnabled: enabled }),
      setParticlesEnabled: (enabled) => set({ particlesEnabled: enabled }),
      setSfxVolume: (vol) => {
        set({ sfxVolume: vol });
        sound.setVolume(vol);
      },
      setMusicVolume: (vol) => {
        set({ musicVolume: vol });
        music.setVolume(vol);
      },
      toggleMute: () => {
        const nextMute = !get().isMuted;
        set({ isMuted: nextMute });
        sound.setMuted(nextMute);
        if (nextMute) {
          music.setVolume(0);
        } else {
          music.setVolume(get().musicVolume);
        }
      },
      setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),
      resetDefaults: () =>
        set({
          screenShake: true,
          fxQuality: 'high',
          reducedMotion: false,
          bloomEnabled: true,
          hitStopEnabled: true,
          particlesEnabled: true,
          sfxVolume: 0.75,
          musicVolume: 0.6,
          isMuted: false,
        }),
    }),
    {
      name: 'singularity_game_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
