import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ColorSchemeName } from 'react-native';
import { zustandStorage } from './mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: ColorSchemeName;
  setTheme: (theme: ColorSchemeName) => void;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // safe default
      setTheme: (theme) => {
        set({ theme });
        // Only persist the preference — do NOT call Appearance.setColorScheme()
      },
      initialize: async () => {
        try {
          const darkVal = await AsyncStorage.getItem('imansync_dark_mode');
          if (darkVal !== null) {
            // Only migrate if not already in mmkv
            const mmkvVal = zustandStorage.getItem('theme-storage');
            if (!mmkvVal) {
              set({
                theme: darkVal === 'true' ? 'dark' : 'light'
              });
            }
          }
        } catch (e) {
          console.error('ThemeStore init error:', e);
        }
      }
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

