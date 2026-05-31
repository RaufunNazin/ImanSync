import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAudioStore } from '@/store/audioStore';
import { Play, Pause, X, SkipForward } from 'lucide-react-native';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import { useThemeStore } from '@/store/themeStore';

export default function AudioPlayerBar() {
  const { currentSurahId, currentSurahName, isPlaying, isLoading, pause, resume, stop, playNext, playlist, playbackMode, currentAyahNumber, juzAyahs, currentJuzAyahIndex } = useAudioStore();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();

  if (!currentSurahId) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.accent }]}>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {t('surahNames.' + currentSurahId, { defaultValue: currentSurahName || ('Surah ' + currentSurahId) })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {playbackMode === 'juz' && juzAyahs.length > 0 && currentJuzAyahIndex !== null
              ? t('quran.playingJuz', { defaultValue: `Queue (${formatNumber(juzAyahs.length - currentJuzAyahIndex - 1, i18n.language)} remaining)`, count: formatNumber(juzAyahs.length - currentJuzAyahIndex - 1, i18n.language) })
              : playlist.length > 0 
                ? t('quran.playingJuz', { defaultValue: `Queue (${formatNumber(playlist.length, i18n.language)} remaining)`, count: formatNumber(playlist.length, i18n.language) }) 
                : playbackMode === 'ayah' && currentAyahNumber 
                  ? `${t('surah.ayah', { defaultValue: 'Ayah' })} ${formatNumber(currentAyahNumber, i18n.language)}`
                  : t('quran.nowPlaying', { defaultValue: 'Now Playing'})}
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
      </View>
    </View>
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
