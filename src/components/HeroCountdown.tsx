import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatNumber } from '@/utils/formatNumber';
import { useTranslation } from 'react-i18next';
import { Fonts } from '@/constants/theme';

interface HeroCountdownProps {
  targetDate: Date | null;
  activeColor: string;
  isMakruh: boolean;
  isCurrentPrayerDone: boolean;
  errorColor: string;
}

const formatCountdown = (ms: number): string => {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function HeroCountdown({ targetDate, activeColor, isMakruh, isCurrentPrayerDone, errorColor }: HeroCountdownProps) {
  const { i18n } = useTranslation();
  const [timeToNextMs, setTimeToNextMs] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    
    let timer: NodeJS.Timeout;
    const update = () => {
      const now = Date.now();
      setTimeToNextMs(Math.max(0, targetDate.getTime() - now));
      
      const msUntilNextSecond = 1000 - (now % 1000);
      timer = setTimeout(update, msUntilNextSecond);
    };
    
    update();
    return () => clearTimeout(timer);
  }, [targetDate]);

  const displayCountdown = formatNumber(formatCountdown(timeToNextMs), i18n.language);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
      {displayCountdown.split('').map((char, idx) => (
        <Text 
          key={idx} 
          style={[
            styles.heroCountdown, 
            { 
              color: (isMakruh && !isCurrentPrayerDone) ? errorColor : activeColor,
              fontSize: 36,
              width: char === ':' || char === ' ' ? 14 : 22,
              textAlign: 'center',
              fontWeight: 'normal'
            }
          ]}
        >
          {char}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCountdown: {
    fontFamily: Fonts.outfit,
    fontVariant: ['tabular-nums'],
  }
});
