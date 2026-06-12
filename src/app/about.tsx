import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { FontAwesome } from '@expo/vector-icons';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';

export default function AboutScreen() {
  const colors = useThemeColors();
  const activeColor = useActiveColor();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('settings.aboutImanSync')} 
        titleAr={t('settings.aboutTitleAr')} 
        showBack 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.logoWrap, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Image 
              source={require('../../assets/images/zoomed-icon.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </View>
          
          <Text style={[styles.appName, { color: colors.text }]}>{t('home.titleEn')}</Text>
          
          <View style={[styles.versionBadge, { backgroundColor: activeColor + '20' }]}>
            <Text style={[styles.versionText, { color: activeColor }]}>
              {t('settings.version')}: 1.0.0
            </Text>
          </View>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('settings.footerSubtitle', { defaultValue: 'Crafted seeking the satisfaction of Allah' })}
          </Text>
        </View>

        {/* Description Section */}
        <View style={[styles.descCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.descText, { color: colors.text }]}>
            {t('settings.aboutDesc')}
          </Text>
        </View>

        {/* Source Code Button */}
        <TouchableOpacity activeOpacity={1} 
          style={[styles.sourceBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => Linking.openURL('https://github.com/RaufunNazin/ImanSync.git')}
        >
          <FontAwesome name="github" size={20} color={colors.text} />
          <Text style={[styles.sourceBtnText, { color: colors.text }]}>{t('settings.viewSource')}</Text>
        </TouchableOpacity>

        <View style={styles.brandingSection}>
          <Text style={[styles.arabicBranding, { color: colors.textSecondary }]}>
            الحمد لله رب العالمين
          </Text>
        </View>
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
    alignItems: 'center',
    gap: Spacing.four,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  logo: {
    width: 72,
    height: 72,
  },
  appName: {
    fontFamily: Fonts.outfit,
    fontSize: 32,
    letterSpacing: 2,
    marginBottom: Spacing.two,
  },
  versionBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: Spacing.three,
  },
  versionText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  descCard: {
    width: '100%',
    padding: Spacing.five,
    borderRadius: 24,
    borderWidth: 1,
  },
  descText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
  },
  brandingSection: {
    marginTop: Spacing.two,
    opacity: 0.4,
  },
  arabicBranding: {
    fontFamily: Fonts.arabic,
    fontSize: 20,
  },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.six,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  sourceBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
  }
});
