import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { loadMyDuas, UserDua, getMediaUri } from '@/utils/my-duas-storage';

import { useVideoPlayer, VideoView } from 'expo-video';

export default function MyDuaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();
  
  const [dua, setDua] = useState<UserDua | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDua = async () => {
      const duas = await loadMyDuas();
      const found = duas.find(d => d.id === id);
      if (found) {
        setDua(found);
        if (found.mediaUri && found.type !== 'text') {
          const uri = await getMediaUri(found.mediaUri);
          setLocalUri(uri);
        }
      }
      setLoading(false);
    };
    fetchDua();
  }, [id]);

  const player = useVideoPlayer(localUri, player => {
    player.loop = true;
    player.pause();
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.loading', { defaultValue: 'Loading...' })} titleAr="" showBack />
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!dua) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.notFound', { defaultValue: 'Not Found' })} titleAr="" showBack />
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>{t('dua.notFound', { defaultValue: 'Dua not found.' })}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={dua.title} titleAr="" showBack />
      
      <ScrollView contentContainerStyle={styles.container}>
        {dua.type === 'text' && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            {dua.arabic && (
              <Text style={[styles.arabic, { color: colors.text }]}>{dua.arabic}</Text>
            )}
            {dua.transliteration && (
              <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{dua.transliteration}</Text>
            )}
            <Text style={[styles.translation, { color: colors.text }]}>{dua.translation}</Text>
          </View>
        )}

        {dua.type === 'image' && localUri && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Image 
              source={{ uri: localUri }} 
              style={styles.image} 
              resizeMode="contain"
            />
          </View>
        )}

        {dua.type === 'video' && localUri && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
            <VideoView 
              player={player} 
              style={styles.video} 
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
  },
  notFound: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  arabic: {
    fontFamily: Fonts.arabic,
    fontSize: 32,
    textAlign: 'right',
    includeFontPadding: false,
    lineHeight: 50,
  },
  transliteration: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontStyle: 'italic',
  },
  translation: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    lineHeight: 28,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  video: {
    width: '100%',
    height: 300,
  },
});
