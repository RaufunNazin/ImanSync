import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: ColorSchemeName;
  isMonoColor: boolean;
  isBorderless: boolean;
  setTheme: (theme: ColorSchemeName) => void;
  setMonoColor: (mono: boolean) => void;
  setBorderless: (borderless: boolean) => void;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light', // safe default before AsyncStorage loads
  isMonoColor: false,
  isBorderless: false,
  setTheme: (theme) => {
    set({ theme });
    // Only persist the preference — do NOT call Appearance.setColorScheme()
    // On Android production, that API triggers an Activity recreation (app restart/crash)
    AsyncStorage.setItem('imansync_dark_mode', String(theme === 'dark')).catch(console.error);
  },
  setMonoColor: (isMonoColor) => {
    set({ isMonoColor });
    AsyncStorage.setItem('imansync_mono_color', String(isMonoColor)).catch(console.error);
  },
  setBorderless: (isBorderless) => {
    set({ isBorderless });
    AsyncStorage.setItem('imansync_borderless', String(isBorderless)).catch(console.error);
  },
  initialize: async () => {
    try {
      const [darkVal, monoVal, borderlessVal] = await Promise.all([
        AsyncStorage.getItem('imansync_dark_mode'),
        AsyncStorage.getItem('imansync_mono_color'),
        AsyncStorage.getItem('imansync_borderless')
      ]);
      
      set({ 
        theme: darkVal === 'true' ? 'dark' : 'light',
        isMonoColor: monoVal === 'true',
        isBorderless: borderlessVal === 'true'
      });
    } catch (e) {
      console.error('ThemeStore init error:', e);
    }
  }
}));
