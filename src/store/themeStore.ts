import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ColorSchemeName } from 'react-native';
import { zustandStorage } from './mmkv';

interface ThemeState {
  theme: ColorSchemeName;
  setTheme: (theme: ColorSchemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // safe default
      setTheme: (theme) => {
        set({ theme });
        // Only persist the preference — do NOT call Appearance.setColorScheme()
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

