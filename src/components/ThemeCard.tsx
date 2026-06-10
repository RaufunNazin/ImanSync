import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useThemeColors, useThemeStyles } from '@/constants/theme';
import Animated from 'react-native-reanimated';

interface ThemeCardProps extends ViewProps {
  children?: React.ReactNode;
  intensity?: number; // Kept for API compatibility, but ignored
  animated?: boolean;
  layout?: any;
}

export default function ThemeCard({ style, children, intensity, animated, ...props }: ThemeCardProps) {
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();

  const Container = animated ? Animated.View : View;
  
  const flatStyle = StyleSheet.flatten(style) || {};

  // Separate layout/shadow properties for the outer container
  // from presentation/padding properties for the inner container.
  const {
    // Layout and spacing (outer)
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    aspectRatio,
    alignSelf,
    opacity,
    transform,
    
    // Presentation and padding (inner)
    padding,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingHorizontal,
    paddingVertical,
    flexDirection,
    justifyContent,
    alignItems,
    flexWrap,
    alignContent,
    gap,
    rowGap,
    columnGap,
    backgroundColor = colors.backgroundElement,
    borderWidth = 1,
    borderColor = colors.border,
    borderRadius = 20,
    
    ...otherStyles
  } = flatStyle;

  const outerStyle = {
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    aspectRatio,
    alignSelf,
    opacity,
    transform,
    borderRadius, // Needed so outer shadow shape matches card shape
    ...otherStyles
  };

  const innerStyle = {
    flex: 1, // Fill the outer container completely
    backgroundColor,
    borderWidth,
    borderColor,
    borderRadius,
    overflow: 'hidden' as const, // Clip children to border radius without clipping shadow
    padding,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingHorizontal,
    paddingVertical,
    flexDirection,
    justifyContent,
    alignItems,
    flexWrap,
    alignContent,
    gap,
    rowGap,
    columnGap,
  };

  return (
    <Container
      style={[
        themeStyles.cardShadow,
        outerStyle
      ]}
      {...props}
    >
      <View style={innerStyle}>
        {children}
      </View>
    </Container>
  );
}
