import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Bell, ChevronRight, Globe, MapPin, Moon, Settings as SettingsIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Appearance, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(scheme === 'dark');

  useEffect(() => {
    AsyncStorage.multiGet(['deen_notifications', 'deen_dark_mode']).then((values) => {
      values.forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'deen_notifications') setNotificationsEnabled(value === 'true');
          if (key === 'deen_dark_mode') {
            const isDark = value === 'true';
            setDarkModeEnabled(isDark);
            try {
              if (Platform.OS !== 'web') {
                Appearance.setColorScheme(isDark ? 'dark' : 'light');
              }
            } catch (e) {}
          }
        }
      });
    });
  }, []);

  const toggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    AsyncStorage.setItem('deen_notifications', String(enabled));
  };

  const toggleDarkMode = (enabled: boolean) => {
    setDarkModeEnabled(enabled);
    AsyncStorage.setItem('deen_dark_mode', String(enabled));
    try {
      if (Platform.OS !== 'web') {
        Appearance.setColorScheme(enabled ? 'dark' : 'light');
      }
    } catch (e) {
      console.log('Appearance.setColorScheme not supported on this platform');
    }
  };

  const cycleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'bn' : 'en';
    setLanguage(nextLang);
  };

  const SettingRow = ({ icon: Icon, title, value, type = 'navigate', onPress }: any) => (
    <TouchableOpacity 
      style={[styles.settingRow, { borderBottomColor: colors.border }]} 
      activeOpacity={type === 'navigate' ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Icon size={20} color={colors.highlight} />
        </View>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>
      
      {type === 'navigate' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      ) : type === 'toggle' ? (
        <Switch
          value={value}
          onValueChange={title === 'Notifications' ? toggleNotifications : toggleDarkMode}
          trackColor={{ false: colors.border, true: colors.highlight }}
          thumbColor="#FFFFFF"
        />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <PageHeader titleEn={t('settings.titleEn')} titleAr={t('settings.titleAr')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Text>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.card}>
          <SettingRow icon={Bell} title={t('settings.notifications')} value={notificationsEnabled} type="toggle" />
          <SettingRow icon={Moon} title={t('settings.theme')} value={darkModeEnabled} type="toggle" />
          <SettingRow icon={Globe} title={t('settings.language')} value={i18n.language === 'bn' ? 'বাংলা' : 'English'} onPress={cycleLanguage} />
        </BlurView>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.locationCalc')}</Text>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.card}>
          <SettingRow icon={MapPin} title={t('settings.location')} value={t('settings.autoGPS')} />
          <SettingRow icon={SettingsIcon} title={t('settings.calcMethod')} value={t('settings.karachi')} />
        </BlurView>

        <View style={{ height: Spacing.six }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? 40 : 0 
  },
  container: { 
    padding: Spacing.four,
    paddingTop: 0,
  },
  header: {
    // replaced by PageHeader component
  },
  title: { 
    fontFamily: Fonts.outfit,
    fontSize: 32, 
  },
  iconBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconBtn: {
    padding: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: Spacing.two,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 24,
    padding: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  settingValue: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    marginRight: 4,
  },
});
