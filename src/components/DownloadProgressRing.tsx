import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Fonts } from '@/constants/theme';

interface DownloadProgressRingProps {
  progress: number;       // 0–100
  size: number;           // outer dimension in dp
  color: string;          // arc color
  trackColor: string;     // muted background ring color
  label: string;          // pre-formatted number string to display inside
}

export default function DownloadProgressRing({
  progress,
  size,
  color,
  trackColor,
  label,
}: DownloadProgressRingProps) {
  const strokeWidth = 2.5;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc — starts at top (rotated -90°) */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <Text
        style={{
          fontFamily: Fonts.outfit,
          fontSize: size <= 20 ? 7 : 8,
          color: color,
          fontWeight: '700',
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
