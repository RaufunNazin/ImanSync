import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { BookOpen, History, PenTool } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';

export default function StoriesScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { t } = useTranslation();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/quran');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      <PageHeader titleEn={t('stories.titleEn')} titleAr={t('stories.titleAr')} showBack />

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={[styles.circle, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <History size={64} color={colors.accent} />
          </View>
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>
          {t('stories.discover')}
        </Text>
        
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t('stories.body')}
        </Text>

        <View style={styles.featureList}>
          <BlurView intensity={30} tint={colors.glassTint as any} style={styles.featureCard}>
            <PenTool size={24} color={colors.accent} />
            <View style={styles.featureTextWrapper}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{t('stories.authentic')}</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t('stories.authenticDesc')}</Text>
            </View>
          </BlurView>

          <BlurView intensity={30} tint={colors.glassTint as any} style={styles.featureCard}>
            <BookOpen size={24} color={colors.accent} />
            <View style={styles.featureTextWrapper}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{t('stories.deeper')}</Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{t('stories.deeperDesc')}</Text>
            </View>
          </BlurView>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity 
          style={[styles.notifyBtn, { backgroundColor: colors.highlight }]}
          onPress={() => router.back()}
        >
          <Text style={styles.notifyText}>{t('stories.return')}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    marginBottom: Spacing.six,
  },
  backBtn: {
    padding: Spacing.two,
    marginLeft: -Spacing.two,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.six,
    paddingTop: 0,
  },
  iconWrapper: {
    alignItems: 'center',
    marginTop: Spacing.six,
    marginBottom: Spacing.six,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heading: {
    fontFamily: Fonts.outfit,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  body: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.six,
  },
  featureList: {
    gap: Spacing.four,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureTextWrapper: {
    marginLeft: Spacing.four,
    flex: 1,
  },
  featureTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 2,
  },
  featureDesc: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  notifyBtn: {
    paddingVertical: Spacing.four,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  notifyText: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    color: '#FFF',
  }
});
