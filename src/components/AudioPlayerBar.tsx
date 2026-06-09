import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useAudioStore } from '@/store/audioStore';
import { Play, Pause, X } from 'lucide-react-native';
import { Fonts, Spacing, useThemeColors, useThemeStyles } from '@/constants/theme';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';

export default function AudioPlayerBar() {
  const { currentSurahId, currentSurahName, isPlaying, isLoading, pause, resume, stop, playlist, playbackMode, currentAyahNumber, juzAyahs, currentJuzAyahIndex } = useAudioStore();
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();
  const { i18n } = useTranslation();

  const translateX = useRef(new Animated.Value(150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const shouldShow = !!currentSurahId;

  const cachedData = useRef({
    id: currentSurahId,
    name: currentSurahName,
    isPlaying: isPlaying,
    mode: playbackMode,
    index: currentJuzAyahIndex,
    ayah: currentAyahNumber,
    juzQueueLength: juzAyahs.length,
    playlistLength: playlist.length,
    isLoading: isLoading,
  });

  if (shouldShow) {
    cachedData.current = {
      id: currentSurahId,
      name: currentSurahName,
      isPlaying: isPlaying,
      mode: playbackMode,
      index: currentJuzAyahIndex,
      ayah: currentAyahNumber,
      juzQueueLength: juzAyahs.length,
      playlistLength: playlist.length,
      isLoading: isLoading,
    };
  }

  const data = cachedData.current;

  // Animate in when audio starts, animate out when it stops
  useEffect(() => {
    if (shouldShow && !closing) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (!shouldShow && !closing) {
      // Audio stopped externally (e.g. track ended)
      Animated.parallel([
        Animated.timing(translateX, { toValue: 150, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [shouldShow, closing]);



  const handleClose = () => {
    setClosing(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 150, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      stop();
      setClosing(false);
      setVisible(false);
    });
  };

  if (!visible && !shouldShow) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX }], opacity }]}>
      <View style={[styles.card, themeStyles.cardShadow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {formatNumber(Number(data.id), i18n.language)}:{data.ayah ? formatNumber(data.ayah, i18n.language) : formatNumber(1, i18n.language)}
          </Text>
        </View>

        {data.isLoading ? (
          <View style={styles.btn}>
            <ActivityIndicator size="small" color={colors.highlight} />
          </View>
        ) : data.isPlaying ? (
          <TouchableOpacity activeOpacity={1} style={styles.btn} onPress={pause}>
            <Pause size={24} color={colors.highlight} fill={colors.highlight} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={1} style={styles.btn} onPress={resume}>
            <Play size={24} color={colors.highlight} fill={colors.highlight} />
          </TouchableOpacity>
        )}

        <TouchableOpacity activeOpacity={1} style={styles.btn} onPress={handleClose}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: (Platform.OS === 'ios' ? 88 : 70) + Spacing.four,
    right: Spacing.four,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' as any,
    gap: Spacing.two,
    minWidth: 48,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  btn: {
    padding: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
