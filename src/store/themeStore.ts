import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  theme: ColorSchemeName;
  setTheme: (theme: ColorSchemeName) => void;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: Appearance.getColorScheme() || 'light',
  setTheme: (theme) => {
    set({ theme });
    // Defer heavy native bridge operations to let React render instantly
    setTimeout(() => {
      try {
        Appearance.setColorScheme(theme);
      } catch (e) {}
      AsyncStorage.setItem('imansync_dark_mode', String(theme === 'dark'));
    }, 50);
  },
  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_dark_mode');
      if (val !== null) {
        const isDark = val === 'true';
        const theme = isDark ? 'dark' : 'light';
        set({ theme });
        try {
          Appearance.setColorScheme(theme);
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
  }
}));
