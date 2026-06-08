import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeColors, useThemeStyles } from '@/constants/theme';
import Animated from 'react-native-reanimated';

interface ThemeCardProps extends ViewProps {
  children?: React.ReactNode;
  intensity?: number; // Kept for API compatibility, but ignored
  animated?: boolean;
}

export default function ThemeCard({ style, children, intensity, animated, ...props }: ThemeCardProps) {
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();

  const Container = animated ? Animated.View : View;

  return (
    <Container
      style={[
        {
          backgroundColor: colors.backgroundElement,
          overflow: 'hidden',
          borderColor: colors.border,
          borderWidth: 1, // Will be 1 but border color is transparent
        },
        themeStyles.cardShadow,
        style
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}
