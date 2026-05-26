import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAudioStore } from '@/store/audioStore';
import { Play, Pause, X, SkipForward } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '@/store/themeStore';

export default function AudioPlayerBar() {
  const { currentSurahId, isPlaying, isLoading, pause, resume, stop, playNext, playlist, playbackMode, currentAyahNumber } = useAudioStore();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();

  if (!currentSurahId) return null;

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint={colors.glassTint as any} style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {t('surahNames.' + currentSurahId, { defaultValue: 'Surah ' + currentSurahId })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {playlist.length > 0 
              ? t('quran.playingJuz', { defaultValue: `Playing Queue (${formatNumber(playlist.length, i18n.language)} left)` }) 
              : playbackMode === 'ayah' && currentAyahNumber 
                ? `${t('surah.ayah', { defaultValue: 'Ayah' })} ${formatNumber(currentAyahNumber, i18n.language)}`
                : t('quran.nowPlaying', { defaultValue: 'Now Playing' })}
          </Text>
        </View>

        <View style={styles.controls}>
          {isLoading ? (
            <View style={styles.btn}>
              <ActivityIndicator size="small" color={colors.highlight} />
            </View>
          ) : isPlaying ? (
            <TouchableOpacity style={styles.btn} onPress={pause}>
              <Pause size={24} color={colors.highlight} fill={colors.highlight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={resume}>
              <Play size={24} color={colors.highlight} fill={colors.highlight} />
            </TouchableOpacity>
          )}

          {playlist.length > 0 && (
            <TouchableOpacity style={styles.btn} onPress={playNext}>
              <SkipForward size={24} color={colors.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btn} onPress={stop}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // slightly above tab bar
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 1000,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
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
