import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface AnimatedCardProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export default function AnimatedCard({
  children,
  style,
  scaleTo = 0.95,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: AnimatedCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 });
        if (onPressIn) onPressIn(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        if (onPressOut) onPressOut(e);
      }}
      onPress={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        if (onPress) onPress(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
