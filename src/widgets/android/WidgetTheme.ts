import { ColorProp } from 'react-native-android-widget';

export const getWidgetTheme = (isDark: boolean): Record<string, ColorProp> => {
  if (isDark) {
    return {
      background: '#0c1618',
      text: '#f1f7ed',
      textSecondary: '#94A3B8',
      border: '#00000000',
      accent: '#C8AA6E',
      highlight: '#4c956c',
      error: '#dc6040',
      activeColor: '#C8AA6E', // Dark mode uses accent
      cardBackground: '#1A2426'
    };
  } else {
    return {
      background: '#f1f7ed',
      text: '#0c1618',
      textSecondary: '#475569',
      border: '#00000000',
      accent: '#C8AA6E',
      highlight: '#4c956c',
      error: '#dc6040',
      activeColor: '#4c956c', // Light mode uses highlight
      cardBackground: '#FFFFFF'
    };
  }
};
