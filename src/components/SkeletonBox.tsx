import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleSheet } from 'react-native';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  color?: string;
  /** When true, the skeleton fades out and the children fade in */
  loaded?: boolean;
  children?: React.ReactNode;
}

export default function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
  color = 'rgba(150,150,150,0.2)',
  loaded = false,
  children,
}: SkeletonBoxProps) {
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;
  const skeletonReveal = useRef(new Animated.Value(1)).current;
  const contentReveal = useRef(new Animated.Value(0)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pulse animation while loading
  useEffect(() => {
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    if (!loaded) {
      pulseRef.current.start();
    }
    return () => pulseRef.current?.stop();
  }, []);

  // Cross-fade when loaded
  useEffect(() => {
    if (loaded) {
      pulseRef.current?.stop();
      Animated.parallel([
        Animated.timing(skeletonReveal, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentReveal, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      skeletonReveal.setValue(1);
      contentReveal.setValue(0);
      pulseRef.current?.start();
    }
  }, [loaded]);

  // If no children and loaded — just fade self out (non-inline usage)
  if (!children) {
    return (
      <Animated.View
        style={[
          {
            width: width as any,
            height,
            borderRadius,
            backgroundColor: color,
            opacity: loaded ? skeletonReveal : pulseOpacity,
          },
          style,
        ]}
      />
    );
  }

  // Inline mode: skeleton sits behind children
  return (
    <Animated.View style={[{ position: 'relative' }, style]}>
      {/* Skeleton shimmer */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: width as any,
            height,
            borderRadius,
            backgroundColor: color,
            opacity: Animated.multiply(pulseOpacity, skeletonReveal),
          },
        ]}
        pointerEvents="none"
      />
      {/* Real content */}
      <Animated.View style={{ opacity: contentReveal }}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
