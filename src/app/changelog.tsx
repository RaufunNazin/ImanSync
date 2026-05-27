import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function ChangelogScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [changelog, setChangelog] = useState('');
  
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/RaufunNazin/ImanSync/main/CHANGELOG.md')
      .then(res => res.text())
      .then(text => {
        setChangelog(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching changelog:', err);
        setChangelog('Failed to load changelog.');
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('settings.changelog')} 
        titleAr="سجل التغييرات" 
        showBack 
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.highlight} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.changelogText, { color: colors.text }]}>
              {changelog}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    paddingTop: 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: Spacing.four,
    borderRadius: 24,
    borderWidth: 1,
  },
  changelogText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    lineHeight: 22,
  }
});
