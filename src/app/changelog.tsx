import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import systemConfig from '../../system_config.json';

export default function ChangelogScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  
  const lang = (i18n.language === 'bn' ? 'bn' : 'en') as 'en' | 'bn';
  const changelogs = Array.isArray(systemConfig.changelog) ? systemConfig.changelog : [systemConfig.changelog];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('settings.changelog')} 
        titleAr="سجل التغييرات" 
        showBack 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {changelogs.map((log: any, index: number) => {
          const lines = log[lang] || log.en;
          return (
            <View key={index} style={{ marginBottom: 32 }}>
              <View style={styles.versionHeader}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <Text style={[styles.versionText, { color: colors.highlight }]}>
                    Version {log.version}
                  </Text>
                  {log.date && (
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                      {log.date}
                    </Text>
                  )}
                </View>
                <View style={[styles.hr, { backgroundColor: colors.border }]} />
              </View>
              {lines.map((line: string, idx: number) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
                  <Text style={[styles.changelogText, { color: colors.text }]}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
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
    paddingTop: 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  changelogText: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    lineHeight: 24,
    flex: 1,
  },
  versionHeader: {
    marginBottom: 16,
  },
  versionText: {
    fontFamily: Fonts.outfit,
    fontWeight: '600',
    fontSize: 18,
  },
  dateText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 18,
    marginRight: 8,
    marginTop: -2,
  }
});
