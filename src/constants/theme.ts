/**
 * Islamic App Theme System: Andalusian Twilight
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0c1618', // Deep Indigo
    textSecondary: '#475569',
    background: '#f1f7ed', // Warm Ivory
    backgroundElement: '#FFFFFF', // Solid flat
    backgroundSelected: 'rgba(76, 149, 108, 0.2)', // Glassmorphism light green
    primary: '#0c1618', // Deep Charcoal
    accent: '#C8AA6E', // Dusty Golden (yellow/gold)
    highlight: '#4c956c', // Sage Green (green)
    success: '#4c956c', // Sage Green for explicit success states
    error: '#dc6040', // Terracotta Red (from restricted times)
    border: 'transparent',
    glassTint: 'light',
  },
  dark: {
    text: '#f1f7ed', // Off-White
    textSecondary: '#94A3B8',
    background: '#0c1618', // Deep Charcoal
    backgroundElement: '#1A2426', // Solid flat
    backgroundSelected: 'rgba(60, 64, 67, 0.8)',
    primary: '#f1f7ed', // Off-White
    accent: '#C8AA6E', // Dusty Golden (yellow/gold)
    highlight: '#4c956c', // Sage Green (green)
    success: '#4c956c', // Sage Green for explicit success states
    error: '#dc6040', // Terracotta Red (from restricted times)
    border: 'transparent',
    glassTint: 'dark',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

import { useThemeStore } from '@/store/themeStore';

export function useThemeColors() {
  const { theme } = useThemeStore();
  const currentTheme = theme === 'unspecified' ? 'light' : (theme ?? 'light');
  return Colors[currentTheme];
}

export function useActiveColor() {
  const { theme } = useThemeStore();
  const currentTheme = theme === 'unspecified' ? 'light' : (theme ?? 'light');
  return currentTheme === 'dark' ? Colors.dark.accent : Colors.light.highlight;
}

export function useThemeStyles() {
  const { theme } = useThemeStore();
  const currentTheme = theme === 'unspecified' ? 'light' : (theme ?? 'light');
  const isDark = currentTheme === 'dark';

  return {
    cardShadow: isDark ? {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    } : {
      shadowColor: '#0c1618',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    }
  };
}

export const Fonts = {
  outfit: 'Outfit_400Regular',
  arabic: 'NotoNaskhArabic_400Regular',
  arabicBold: 'NotoNaskhArabic_700Bold',
};

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
