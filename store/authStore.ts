'use client';
// store/authStore.ts
// Client-side auth state management with session persistence.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TeamInfo {
  teamId: string;
  displayName: string;
  username: string;
}

interface AuthStore {
  isLoggedIn: boolean;
  team: TeamInfo | null;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  renameTeam: (newName: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      team: null,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', username, password }),
          });
          const json = await res.json();

          if (json.success) {
            set({
              isLoggedIn: true,
              team: json.team,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({ isLoading: false, error: json.error || 'Login failed' });
            return false;
          }
        } catch (err) {
          set({ isLoading: false, error: 'Network error. Please try again.' });
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout' }),
          });
        } catch {
          // ignore network errors
        }
        set({ isLoggedIn: false, team: null, error: null });
      },

      verifySession: async () => {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify' }),
          });
          const json = await res.json();

          if (json.success) {
            set({ isLoggedIn: true, team: json.team });
            return true;
          } else {
            set({ isLoggedIn: false, team: null });
            return false;
          }
        } catch {
          return get().isLoggedIn;
        }
      },

      renameTeam: async (newName) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rename', displayName: newName }),
          });
          const json = await res.json();

          if (json.success) {
            set({ team: json.team, isLoading: false, error: null });
            return true;
          } else {
            set({ isLoading: false, error: json.error || 'Rename failed' });
            return false;
          }
        } catch {
          set({ isLoading: false, error: 'Network error' });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'singularity-team-auth',
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
      // Only persist minimal UI state; do not persist tokens in localStorage.
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        team: state.team,
      }),
    }
  )
);
