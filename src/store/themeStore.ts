import { create } from 'zustand';
import { ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: ColorSchemeName;
  setTheme: (theme: ColorSchemeName) => void;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light', // safe default before AsyncStorage loads
  setTheme: (theme) => {
    set({ theme });
    // Only persist the preference — do NOT call Appearance.setColorScheme()
    // On Android production, that API triggers an Activity recreation (app restart/crash)
    AsyncStorage.setItem('imansync_dark_mode', String(theme === 'dark')).catch(console.error);
  },
  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_dark_mode');
      if (val !== null) {
        set({ theme: val === 'true' ? 'dark' : 'light' });
      }
    } catch (e) {
      console.error('ThemeStore init error:', e);
    }
  }
}));
