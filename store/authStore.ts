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
  token: string | null;
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
      token: null,
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
              token: json.token,
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
        const { token } = get();
        try {
          await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'logout', token }),
          });
        } catch {
          // Logout locally regardless
        }
        set({ isLoggedIn: false, team: null, token: null, error: null });
      },

      verifySession: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoggedIn: false, team: null });
          return false;
        }

        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', token }),
          });
          const json = await res.json();

          if (json.success) {
            set({ isLoggedIn: true, team: json.team });
            return true;
          } else {
            set({ isLoggedIn: false, team: null, token: null });
            return false;
          }
        } catch {
          // Keep local state if network fails
          return get().isLoggedIn;
        }
      },

      renameTeam: async (newName) => {
        const { token } = get();
        if (!token) return false;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rename', token, displayName: newName }),
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
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        team: state.team,
        token: state.token,
      }),
    }
  )
);
