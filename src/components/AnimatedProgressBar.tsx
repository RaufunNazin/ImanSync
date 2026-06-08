import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  /** Progress value 0–100 */
  progress: number;
  color: string;
  height?: number;
  borderRadius?: number;
  trackColor?: string;
  duration?: number;
  style?: ViewStyle;
}

/**
 * A progress bar whose fill width smoothly animates to `progress` with withTiming.
 */
export default function AnimatedProgressBar({
  progress,
  color,
  height = 4,
  borderRadius = 2,
  trackColor = 'rgba(150,150,150,0.15)',
  duration = 600,
  style,
}: AnimatedProgressBarProps) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%` as any,
  }));

  return (
    <Animated.View
      style={[
        {
          height,
          backgroundColor: trackColor,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: color,
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </Animated.View>
  );
}
