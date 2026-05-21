/**
 * Islamic App Theme System: Andalusian Twilight
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0c1618', // Deep Indigo
    textSecondary: '#475569',
    background: '#f1f7ed', // Warm Ivory
    backgroundElement: 'rgba(255, 255, 255, 0.7)', // Glassmorphism white
    backgroundSelected: 'rgba(76, 149, 108, 0.2)', // Glassmorphism light green
    primary: '#0c1618', // Deep Charcoal
    accent: '#C8AA6E', // Dusty Golden
    highlight: '#4c956c', // Sage Green
    border: 'rgba(226, 232, 240, 0.5)',
    glassTint: 'light',
  },
  dark: {
    text: '#f1f7ed', // Off-White
    textSecondary: '#94A3B8',
    background: '#0c1618', // Deep Charcoal
    backgroundElement: 'rgba(41, 42, 45, 0.6)', // Glassmorphism slate
    backgroundSelected: 'rgba(60, 64, 67, 0.8)',
    primary: '#f1f7ed', // Off-White
    accent: '#C8AA6E', // Dusty Golden
    highlight: '#4c956c', // Sage Green
    border: 'rgba(60, 64, 67, 0.5)',
    glassTint: 'dark',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  outfit: 'Outfit_400Regular',
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
