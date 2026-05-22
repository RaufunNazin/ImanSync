import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { setLanguage } from '@/i18n';
import { useThemeStore } from '@/store/themeStore';
import { getDistrictName } from '@/utils/districts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { Bell, ChevronRight, Globe, MapPin, Moon, Settings as SettingsIcon, Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CALC_METHODS = [
  { id: 1, name: 'Karachi (UIS)' },
  { id: 2, name: 'ISNA (North America)' },
  { id: 3, name: 'MWL (Muslim World League)' }
];

export default function SettingsScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [calcMethodIndex, setCalcMethodIndex] = useState(0);
  const [locationName, setLocationName] = useState('');
  const [fetchingLoc, setFetchingLoc] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(['deen_notifications', 'deen_dark_mode', 'deen_calc_method', 'deen_location']).then((values) => {
      values.forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'deen_notifications') setNotificationsEnabled(value === 'true');
          if (key === 'deen_calc_method') {
            const methodId = parseInt(value, 10);
            const idx = CALC_METHODS.findIndex(m => m.id === methodId);
            if (idx >= 0) setCalcMethodIndex(idx);
          }
          if (key === 'deen_location') {
            try {
              const loc = JSON.parse(value);
              setLocationName(loc.city);
            } catch(e){}
          }
        } else {
          // Defaults
          if (key === 'deen_location') {
            setLocationName('Dhaka (Default)');
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
    setTheme(enabled ? 'dark' : 'light');
  };

  const cycleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'bn' : 'en';
    setLanguage(nextLang);
  };

  const cycleCalcMethod = () => {
    const nextIdx = (calcMethodIndex + 1) % CALC_METHODS.length;
    setCalcMethodIndex(nextIdx);
    AsyncStorage.setItem('deen_calc_method', String(CALC_METHODS[nextIdx].id));
  };

  const fetchLocation = async () => {
    setFetchingLoc(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to fetch prayer times for your area.');
        setFetchingLoc(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      let city = reverse[0]?.city || reverse[0]?.subregion || reverse[0]?.region || 'Unknown Location';
      setLocationName(city);
      
      await AsyncStorage.setItem('deen_location', JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city
      }));
    } catch (e) {
      console.log("Error fetching location", e);
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setFetchingLoc(false);
    }
  };

  const SettingRow = ({ id, icon: Icon, title, value, type = 'navigate', onPress }: any) => (
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
          onValueChange={id === 'notifications' ? toggleNotifications : toggleDarkMode}
          trackColor={{ false: colors.border, true: colors.highlight }}
          thumbColor="#FFFFFF"
        />
      ) : type === 'loading' ? (
        <ActivityIndicator size="small" color={colors.highlight} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('settings.titleEn')} titleAr={t('settings.titleAr')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        <View style={[styles.appFooter, { borderColor: colors.accent, backgroundColor: colors.backgroundElement }]}>
          <Image source={require('../../../assets/images/android-icon-foreground.png')} style={styles.footerLogo} resizeMode="contain" />
          <View style={styles.footerTextContainer}>
            <Text style={[styles.footerAppName, { color: colors.text }]}>ImanSync</Text>
            <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>{t('settings.footerSubtitle', { defaultValue: 'Crafted by Srizon for the satisfaction of Allah' })}</Text>
            <Text style={[styles.footerVersion, { color: colors.textSecondary }]}>v1.0.0</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Text>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.card}>
          <SettingRow id="notifications" icon={Bell} title={t('settings.notifications')} value={notificationsEnabled} type="toggle" />
          <SettingRow id="theme" icon={Moon} title={t('settings.theme')} value={scheme === 'dark'} type="toggle" />
          <SettingRow id="language" icon={Globe} title={t('settings.language')} value={i18n.language === 'bn' ? 'বাংলা' : 'English'} onPress={cycleLanguage} />
        </BlurView>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.locationCalc')}</Text>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.card}>
          <SettingRow 
            id="location" 
            icon={MapPin} 
            title={t('settings.location')} 
            value={getDistrictName(locationName, i18n.language)} 
            type={fetchingLoc ? 'loading' : 'navigate'} 
            onPress={fetchLocation} 
          />
          <SettingRow 
            id="method" 
            icon={SettingsIcon} 
            title={t('settings.calcMethod')} 
            value={t('settings.calcMethod_' + CALC_METHODS[calcMethodIndex].id)} 
            onPress={cycleCalcMethod}
          />
        </BlurView>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.system')}</Text>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.card}>
          <SettingRow 
            id="permissions"
            icon={Shield} 
            title={t('settings.managePermissions')} 
            value="" 
            onPress={() => Linking.openSettings()} 
          />
        </BlurView>
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
  header: {
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
    fontSize: 14,
  },
  appFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderRadius: 24,
  },
  footerLogo: {
    width: 64,
    height: 64,
    marginRight: Spacing.four,
  },
  footerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footerAppName: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
    letterSpacing: 1,
  },
  footerSubtitle: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  footerVersion: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  settingValue: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    marginRight: 4,
  },
});
