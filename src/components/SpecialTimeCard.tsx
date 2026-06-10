import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';


import ThemeCard from '@/components/ThemeCard';
import { Fonts } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';

export interface SpecialTime {
  label: string;
  time: string;
  date: Date | null;
}

export default function SpecialTimeCard({ item, colors, i18nLanguage, styles, t, activeColor, timeColor, disableInteractive }: { item: SpecialTime, colors: any, i18nLanguage: string, styles: any, t: any, activeColor: string, timeColor?: string, disableInteractive?: boolean }) {
  const [showCountdown, setShowCountdown] = useState(false);

  // Initial sneak peek animation
  useEffect(() => {
    let peekTimeout: NodeJS.Timeout;
    if (!disableInteractive && item.date && item.time !== '--:--') {
      const diff = item.date.getTime() - Date.now();
      if (diff > 0) {
        peekTimeout = setTimeout(() => {
          setShowCountdown(true);
        }, 600);
      }
    }
    return () => {
      if (peekTimeout) clearTimeout(peekTimeout);
    };
  }, []); // Only run once on mount
  const [remainingStr, setRemainingStr] = useState('');

  const crossfade = useSharedValue(0);

  useEffect(() => {
    crossfade.value = withTiming(showCountdown ? 1 : 0, { duration: 300 });
  }, [showCountdown]);

  const countdownStyle = useAnimatedStyle(() => ({
    opacity: crossfade.value,
  }));

  const timeStyle = useAnimatedStyle(() => ({
    opacity: 1 - crossfade.value,
  }));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (showCountdown && item.date && item.time !== '--:--') {
      const update = () => {
        const diff = item.date!.getTime() - Date.now();
        if (diff <= 0) {
          setRemainingStr(formatNumber(t('home.timeRemainingMinsOnly', { minutes: '00' }), i18nLanguage));
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          if (h > 0) {
            setRemainingStr(formatNumber(t('home.timeRemaining', { hours: h.toString().padStart(2, '0'), minutes: m.toString().padStart(2, '0') }), i18nLanguage));
          } else {
            setRemainingStr(formatNumber(t('home.timeRemainingMinsOnly', { minutes: m.toString().padStart(2, '0') }), i18nLanguage));
          }
        }
      };
      update();
      interval = setInterval(update, 1000);

      timeout = setTimeout(() => {
        setShowCountdown(false);
      }, 3500);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [showCountdown, item.date?.getTime(), item.time, i18nLanguage, t]);

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => {
      if (!disableInteractive && item.date && item.time !== '--:--') {
        const diff = item.date.getTime() - Date.now();
        if (diff > 0) {
          setShowCountdown(true);
        }
      }
    }}>
      <ThemeCard
        intensity={30}
        style={[styles.specialCard, { borderColor: colors.border }]}
      >
        {/* The card content */}
        <View style={[styles.specialCardInner, { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }]}>
          <View style={{ height: 42, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            <Animated.Text style={[countdownStyle, { position: 'absolute', fontFamily: Fonts.outfit, fontSize: 16, lineHeight: 20, color: activeColor, textAlign: 'center' }]}>
              {remainingStr}
            </Animated.Text>
            <Animated.Text style={[timeStyle, { position: 'absolute', fontFamily: Fonts.outfit, fontSize: 22, color: timeColor || colors.accent, textAlign: 'center' }]}>
              {formatNumber(item.time.replace(/ AM| PM/g, ''), i18nLanguage)}
              {item.time.includes(' AM') && <Text style={{ fontSize: 13 }}> AM</Text>}
              {item.time.includes(' PM') && <Text style={{ fontSize: 13 }}> PM</Text>}
            </Animated.Text>
          </View>
          
          <View style={{ height: 14, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Animated.Text style={[countdownStyle, { position: 'absolute', fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>
              {t('home.timeLeft')}
            </Animated.Text>
            <Animated.Text style={[timeStyle, { position: 'absolute', fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }]}>
              {item.label}
            </Animated.Text>
          </View>
        </View>
      </ThemeCard>
    </TouchableOpacity>
  );
}
