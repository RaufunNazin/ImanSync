import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useAudioStore } from '@/store/audioStore';
import { Play, Pause, X, SkipForward } from 'lucide-react-native';
import { Fonts, Spacing, useThemeColors, useThemeStyles } from '@/constants/theme';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import { useSegments } from 'expo-router';

export default function AudioPlayerBar() {
  const { currentSurahId, currentSurahName, isPlaying, isLoading, pause, resume, stop, playNext, playlist, playbackMode, currentAyahNumber, juzAyahs, currentJuzAyahIndex, hideGlobalBanner } = useAudioStore();
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();
  const { t, i18n } = useTranslation();
  const segments = useSegments() as string[];

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const isQuranRoute = segments.includes('quran') || segments.includes('surah') || segments.includes('juz') || segments.includes('quran-learn') || segments.includes('quran-search');
  const shouldShow = !!currentSurahId && isQuranRoute;

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
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (!shouldShow && !closing) {
      // Audio stopped externally (e.g. track ended)
      Animated.parallel([
        Animated.timing(translateY, { toValue: 150, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [shouldShow, closing]);

  // Handle hide-on-scroll
  useEffect(() => {
    if (!closing && shouldShow) {
      Animated.spring(translateY, {
        toValue: hideGlobalBanner ? 150 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [hideGlobalBanner]);

  const handleClose = () => {
    setClosing(true);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 150, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      stop();
      setClosing(false);
      setVisible(false);
    });
  };

  if (!visible && !shouldShow) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={[styles.card, themeStyles.cardShadow, { backgroundColor: colors.background, borderColor: colors.accent }]}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {t('surahNames.' + data.id, { defaultValue: data.name || ('Surah ' + data.id) })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {data.mode === 'juz' && data.juzQueueLength > 0 && data.index !== null
              ? t('quran.playingJuz', { defaultValue: `Queue (${formatNumber(data.juzQueueLength - data.index - 1, i18n.language)} remaining)`, count: formatNumber(data.juzQueueLength - data.index - 1, i18n.language) })
              : data.playlistLength > 0 
                ? t('quran.playingJuz', { defaultValue: `Queue (${formatNumber(data.playlistLength, i18n.language)} remaining)`, count: formatNumber(data.playlistLength, i18n.language) }) 
                : data.mode === 'ayah' && data.ayah 
                  ? `${t('surah.ayah', { defaultValue: 'Ayah' })} ${formatNumber(data.ayah, i18n.language)}`
                  : t('quran.nowPlaying', { defaultValue: 'Now Playing'})}
          </Text>
        </View>

        <View style={styles.controls}>
          {data.isLoading ? (
            <View style={styles.btn}>
              <ActivityIndicator size="small" color={colors.highlight} />
            </View>
          ) : data.isPlaying ? (
            <TouchableOpacity style={styles.btn} onPress={pause}>
              <Pause size={24} color={colors.highlight} fill={colors.highlight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={resume}>
              <Play size={24} color={colors.highlight} fill={colors.highlight} />
            </TouchableOpacity>
          )}

          {data.playlistLength > 0 && (
            <TouchableOpacity style={styles.btn} onPress={playNext}>
              <SkipForward size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btn} onPress={handleClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: (Platform.OS === 'ios' ? 88 : 70) + Spacing.two + 20,
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' as any,
  },
  info: {
    flex: 1,
    marginRight: Spacing.three,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  btn: {
    padding: Spacing.one,
  }
});
