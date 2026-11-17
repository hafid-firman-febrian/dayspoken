import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';

import { kvStorage } from '@/lib/mmkv';

import type { ThemeMode } from './resolve-scheme';

// The theme-mode preference (system / light / dark). UI state, so it lives in Zustand
// (STRUCTURE.md), and it is saved in MMKV. MMKV is synchronous, so the store is hydrated
// when it is created: the first render already knows the mode, with no light frame.

const STORAGE_KEY = 'preferences.theme';

const themeModeSchema = z.enum(['system', 'light', 'dark']);

type ThemeModeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeModeStore = create<ThemeModeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (key) => kvStorage.getString(key) ?? null,
        setItem: (key, value) => kvStorage.set(key, value),
        removeItem: (key) => {
          kvStorage.remove(key);
        },
      })),
      partialize: (state) => ({ mode: state.mode }),
      // Anything that is not a known mode (an old or damaged value) becomes `system`.
      merge: (persisted, current) => {
        const stored = (persisted as { mode?: unknown } | null | undefined)?.mode;
        return { ...current, mode: themeModeSchema.catch('system').parse(stored) };
      },
    },
  ),
);

export function useThemeMode(): ThemeModeState {
  return useThemeModeStore();
}
