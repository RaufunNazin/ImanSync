import PageHeader from '@/components/page-header';
import TimePickerModal from '@/components/TimePickerModal';
import { formatNumber } from '@/utils/formatNumber';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { setLanguage } from '@/i18n';
import { useThemeStore } from '@/store/themeStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { getDistrictName } from '@/utils/districts';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ─── SettingRow MUST live OUTSIDE the screen component ───────────────────────
// If it's defined inside, React sees a brand-new component type on every render,
// unmounts all rows, and remounts them — causing the visible hang/freeze.
interface SettingRowProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  value?: any;
  type?: 'navigate' | 'toggle' | 'loading';
  onPress?: (val?: any) => void;
  isLast?: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
}

function SettingRow({ icon: Icon, title, value, type = 'navigate', onPress, isLast, colors }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
      ]}
      activeOpacity={type === 'navigate' ? 0.7 : 0.9}
      onPress={() => {
        if (type === 'toggle') {
          if (onPress) onPress(!value);
        } else if (onPress) {
          onPress();
        }
      }}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Icon size={20} color={colors.highlight} />
        </View>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>

      {type === 'navigate' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">{value}</Text>
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      ) : type === 'toggle' ? (
        <Switch
          value={!!value}
          onValueChange={(val) => {
            if (onPress) onPress(val);
          }}
          trackColor={{ false: colors.border, true: colors.highlight }}
          thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
        />
      ) : type === 'loading' ? (
        <ActivityIndicator size="small" color={colors.highlight} />
      ) : null}
    </TouchableOpacity>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();

  const [calcMethodIndex, setCalcMethodIndex] = useState(0);
  const [locationName, setLocationName] = useState<string>('Unknown Location');
  const [fetchingLoc, setFetchingLoc] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');

  const prefs = usePreferencesStore();

  useEffect(() => {
    AsyncStorage.multiGet(['imansync_calc_method', 'imansync_location']).then((values) => {
      values.forEach(([key, value]) => {
        if (value !== null) {
          if (key === 'imansync_calc_method') {
            const methodId = parseInt(value, 10);
            const idx = CALC_METHODS.findIndex(m => m.id === methodId);
            if (idx >= 0) setCalcMethodIndex(idx);
          }
          if (key === 'imansync_location') {
            try {
              const loc = JSON.parse(value);
              setLocationName(loc.city);
            } catch (e) {}
          }
        } else {
          if (key === 'imansync_location') {
            setLocationName('Dhaka (Default)');
          }
        }
      });
    });
  }, []);

  const toggleNotifications = async (enabled: boolean) => {
    prefs.setPreferences({ notificationsEnabled: enabled });
    if (enabled) {
      import('../../services/notificationService').then(s => s.scheduleAllNotifications());
    } else {
      import('@notifee/react-native').then(n => n.default.cancelAllNotifications());
    }
  };

  const togglePrayerAlerts = (enabled: boolean) => {
    prefs.setPreferences({ prayerAlertsEnabled: enabled });
    import('../../services/notificationService').then(s => s.scheduleAllNotifications());
  };

  const toggleTaskReminders = (enabled: boolean) => {
    prefs.setPreferences({ taskRemindersEnabled: enabled });
    import('../../services/notificationService').then(s => s.scheduleAllNotifications());
  };

  const toggleDarkMode = (enabled: boolean) => {
    // DO NOT wrap in InteractionManager — setTheme is a simple Zustand set().
    // Deferring caused setTheme to fire after the Switch component was already
    // unmounted by the in-flight re-render, producing the crash.
    setTheme(enabled ? 'dark' : 'light');
  };

  const cycleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'bn' : 'en';
    setLanguage(nextLang);
    import('../../services/notificationService').then(s => s.scheduleAllNotifications());
  };

  const cycleCalcMethod = async () => {
    const nextIdx = (calcMethodIndex + 1) % CALC_METHODS.length;
    setCalcMethodIndex(nextIdx);
    await AsyncStorage.setItem('imansync_calc_method', String(CALC_METHODS[nextIdx].id));
  };

  const formatTime12h = (hour: number, minute: number, lang: string) => {
    const isAM = hour < 12;
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const period = isAM ? (lang === 'bn' ? 'এএম' : 'AM') : (lang === 'bn' ? 'পিএম' : 'PM');
    const hStr = formatNumber(h12, lang).padStart(2, formatNumber(0, lang));
    const mStr = formatNumber(minute, lang).padStart(2, formatNumber(0, lang));
    return `${hStr}:${mStr} ${period}`;
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

      await AsyncStorage.setItem('imansync_location', JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city
      }));
    } catch (e) {
      console.log('Error fetching location', e);
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setFetchingLoc(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('settings.titleEn')} titleAr={t('settings.titleAr')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        <View style={[styles.appFooter, { borderColor: colors.accent, backgroundColor: colors.backgroundElement }]}>
          <Image source={require('../../../assets/images/android-icon-foreground.png')} style={styles.footerLogo} resizeMode="contain" />
          <View style={styles.footerTextContainer}>
            <Text style={[styles.footerAppName, { color: colors.text }]}>ImanSync</Text>
            <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>{t('settings.footerSubtitle', { defaultValue: 'Crafted seeking the satisfaction of Allah' })}</Text>
            <Text style={[styles.footerVersion, { color: colors.textSecondary }]}>v1.0.0</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <SettingRow icon={Globe} title={t('settings.language')} value={i18n.language === 'bn' ? 'বাংলা' : 'English'} onPress={cycleLanguage} colors={colors} />
          <SettingRow icon={Moon} title={t('settings.theme')} value={scheme === 'dark'} type="toggle" isLast={true} onPress={toggleDarkMode} colors={colors} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.notificationsTitle', { defaultValue: 'Notifications Settings' })}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <SettingRow icon={Bell} title={t('settings.masterToggle', { defaultValue: 'Master Toggle' })} value={prefs.notificationsEnabled} type="toggle" isLast={!prefs.notificationsEnabled} onPress={toggleNotifications} colors={colors} />
          {prefs.notificationsEnabled && (
            <>
              <SettingRow icon={Bell} title={t('settings.prayerAlerts', { defaultValue: 'Prayer Alerts' })} value={prefs.prayerAlertsEnabled} type="toggle" onPress={togglePrayerAlerts} colors={colors} />
              <SettingRow icon={Bell} title={t('settings.dailyReminders', { defaultValue: 'Daily Reminders' })} value={prefs.taskRemindersEnabled} type="toggle" onPress={toggleTaskReminders} colors={colors} />
              <SettingRow
                icon={Moon}
                title={t('settings.doNotDisturb')}
                value={prefs.quietHours.enabled}
                type="toggle"
                isLast={!prefs.quietHours.enabled}
                onPress={(v: boolean) => {
                  prefs.setPreferences({ quietHours: { ...prefs.quietHours, enabled: v } });
                  import('../../services/notificationService').then(s => s.scheduleAllNotifications());
                }}
                colors={colors}
              />
              {prefs.quietHours.enabled && (
                <>
                  <SettingRow
                    icon={Moon}
                    title={t('settings.dndFrom')}
                    value={formatTime12h(prefs.quietHours.startHour, prefs.quietHours.startMinute, i18n.language)}
                    type="navigate"
                    onPress={() => {
                      setPickerType('start');
                      setPickerVisible(true);
                    }}
                    colors={colors}
                  />
                  <SettingRow
                    icon={Moon}
                    title={t('settings.dndTo')}
                    value={formatTime12h(prefs.quietHours.endHour, prefs.quietHours.endMinute, i18n.language)}
                    type="navigate"
                    isLast={true}
                    onPress={() => {
                      setPickerType('end');
                      setPickerVisible(true);
                    }}
                    colors={colors}
                  />
                </>
              )}
            </>
          )}
        </View>

        <TimePickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          title={pickerType === 'start' ? t('settings.dndFrom') : t('settings.dndTo')}
          initialHour={pickerType === 'start' ? prefs.quietHours.startHour : prefs.quietHours.endHour}
          initialMinute={pickerType === 'start' ? prefs.quietHours.startMinute : prefs.quietHours.endMinute}
          colors={colors}
          onSave={(hour, minute) => {
            setPickerVisible(false);
            if (pickerType === 'start') {
              prefs.setPreferences({ quietHours: { ...prefs.quietHours, startHour: hour, startMinute: minute } });
            } else {
              prefs.setPreferences({ quietHours: { ...prefs.quietHours, endHour: hour, endMinute: minute } });
            }
            import('../../services/notificationService').then(s => s.scheduleAllNotifications());
          }}
        />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.locationCalc')}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <SettingRow
            icon={MapPin}
            title={t('settings.location')}
            value={getDistrictName(locationName, i18n.language)}
            type={fetchingLoc ? 'loading' : 'navigate'}
            onPress={fetchLocation}
            colors={colors}
          />
          <SettingRow
            icon={SettingsIcon}
            title={t('settings.calcMethod')}
            value={t('settings.calcMethod_' + CALC_METHODS[calcMethodIndex].id)}
            onPress={cycleCalcMethod}
            isLast={true}
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.system')}</Text>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <SettingRow
            icon={Shield}
            title={t('settings.managePermissions')}
            value=""
            onPress={() => Linking.openSettings()}
            isLast={true}
            colors={colors}
          />
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
    paddingTop: 0,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
    marginBottom: Spacing.two,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
    paddingRight: 10,
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
    flexShrink: 1,
  },
  settingValue: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
    marginRight: 4,
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
});
