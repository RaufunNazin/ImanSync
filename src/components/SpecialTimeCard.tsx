import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Pointer } from 'lucide-react-native';
import ThemeCard from '@/components/ThemeCard';
import { Fonts } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';

export interface SpecialTime {
  label: string;
  time: string;
  date: Date | null;
}

export default function SpecialTimeCard({ item, colors, i18nLanguage, styles, t }: { item: SpecialTime, colors: any, i18nLanguage: string, styles: any, t: any }) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [remainingStr, setRemainingStr] = useState('');

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
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [showCountdown, item.date?.getTime(), item.time, i18nLanguage, t]);

  return (
    <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={() => {
      if (item.date && item.time !== '--:--') {
        setShowCountdown(true);
      }
    }}>
      <ThemeCard
        intensity={30}
        style={[styles.specialCard, { borderColor: colors.border }]}
      >
        {/* Subtle tap cue */}
        {!showCountdown && item.date && item.time !== '--:--' && (
          <View style={{ position: 'absolute', top: 6, right: 7, opacity: 0.3 }}>
            <Pointer size={12} color={colors.textSecondary} />
          </View>
        )}
        <View style={[styles.specialCardInner, { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }]}>
          <View style={{ height: 42, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            {showCountdown ? (
              <Animated.Text key="countdown" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ position: 'absolute', fontFamily: Fonts.outfit, fontSize: 16, lineHeight: 20, color: colors.highlight, textAlign: 'center' }}>
                {remainingStr}
              </Animated.Text>
            ) : (
              <Animated.Text key="time" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ position: 'absolute', fontFamily: Fonts.outfit, fontSize: 22, color: colors.accent, textAlign: 'center' }}>
                {formatNumber(item.time, i18nLanguage)}
              </Animated.Text>
            )}
          </View>
          <Text style={{ fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
            {showCountdown ? t('home.timeLeft') : item.label}
          </Text>
        </View>
      </ThemeCard>
    </TouchableOpacity>
  );
}
