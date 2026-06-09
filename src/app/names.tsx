import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useThemeColors, useThemeStyles } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';

interface NameItem {
  id: string;
  arabic: string;
  english: string;
  meaning: string;
}

export default function NamesScreen() {
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();

  const { t, i18n } = useTranslation();

  const names: NameItem[] = t('namesList', { returnObjects: true }) as NameItem[];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('names.titleEn')} titleAr={t('names.titleAr')} showBack />
      
      <FlatList
        data={names}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ThemeCard intensity={40}  style={[styles.cardWrapper, { borderColor: colors.border }]}>
            <View style={[styles.card, themeStyles.cardShadow]}>
              <View style={[styles.numberBox, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(item.id, i18n.language)}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.englishText, { color: colors.text }]}>{item.english}</Text>
                <Text style={[styles.meaningText, { color: colors.textSecondary }]}>{item.meaning}</Text>
              </View>
              <Text style={[styles.arabicText, { color: colors.accent }]}>{item.arabic}</Text>
            </View>
          </ThemeCard>
        )}
      />
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
    marginBottom: Spacing.four,
  },
  backBtn: {
    padding: Spacing.two,
    marginLeft: -Spacing.two,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
  },
  numberBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  numberText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  englishText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 4,
  },
  meaningText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  arabicText: {
    fontFamily: Fonts.arabic,
    fontSize: 28,
  }
});
