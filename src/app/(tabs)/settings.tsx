import PageHeader from '@/components/page-header';
import TimePickerModal from '@/components/TimePickerModal';
import OptionsModal from '@/components/OptionsModal';
import { formatNumber } from '@/utils/formatNumber';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { setLanguage } from '@/i18n';
import { useThemeStore } from '@/store/themeStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { getDistrictName, districtMapBn } from '@/utils/districts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Updates from 'expo-updates';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Globe, MapPin, Moon, Settings as SettingsIcon, Shield, Info, FileText, RefreshCw } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CALC_METHODS = [
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 3, name: 'Muslim World League (MWL)' }
];

const MADHABS = [
  { id: 0, name: 'Shafi/Hanbali/Maliki' },
  { id: 1, name: 'Hanafi' }
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
        <Text style={[styles.settingTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
      </View>

      {type === 'navigate' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: value ? 1 : undefined, flexShrink: 1, justifyContent: 'flex-end', paddingLeft: value ? 10 : 0 }}>
          {!!value && <Text style={[styles.settingValue, { color: colors.textSecondary }]} numberOfLines={2}>{value}</Text>}
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
  const router = useRouter();

  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [optionsModalType, setOptionsModalType] = useState<'calc' | 'madhab' | 'hijri' | 'location' | null>(null);

  const prefs = usePreferencesStore();

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



  const formatTime12h = (hour: number, minute: number, lang: string) => {
    const isAM = hour < 12;
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const period = isAM ? ' AM' : ' PM';
    const hStr = formatNumber(h12, lang).padStart(2, formatNumber(0, lang));
    const mStr = formatNumber(minute, lang).padStart(2, formatNumber(0, lang));
    return `${hStr}:${mStr}${period}`;
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

      prefs.setPreferences({ location: { latitude: location.coords.latitude, longitude: location.coords.longitude, city } });
      import('../../services/notificationService').then(s => s.scheduleAllNotifications());
    } catch (e) {
      console.log('Error fetching location', e);
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setFetchingLoc(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      setCheckingUpdate(true);
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(t('settings.updatesAvailable'));
        await Updates.fetchUpdateAsync();
        Alert.alert(t('settings.updateRestarting'));
        await Updates.reloadAsync();
      } else {
        Alert.alert(t('settings.updatesNotAvailable'));
      }
    } catch (error) {
      console.log('Error checking for updates', error);
      Alert.alert(t('settings.errorCheckingUpdates'));
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('settings.titleEn')} titleAr={t('settings.titleAr')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

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
            value={prefs.manualCity ? getDistrictName(prefs.manualCity, i18n.language) : (prefs.location ? getDistrictName(prefs.location.city, i18n.language) : 'Auto (GPS)')}
            type={fetchingLoc ? 'loading' : 'navigate'}
            onPress={() => {
              setOptionsModalType('location');
              setOptionsModalVisible(true);
            }}
            colors={colors}
          />
          <SettingRow
            icon={SettingsIcon}
            title={t('settings.calcMethod')}
            value={CALC_METHODS.find(m => m.id === prefs.calcMethod)?.name || 'University of Islamic Sciences, Karachi'}
            onPress={() => {
              setOptionsModalType('calc');
              setOptionsModalVisible(true);
            }}
            colors={colors}
          />
          <SettingRow
            icon={SettingsIcon}
            title={t('settings.asrMethod', { defaultValue: 'Asr Method (Madhab)' })}
            value={MADHABS.find(m => m.id === prefs.madhab)?.name || 'Hanafi'}
            onPress={() => {
              setOptionsModalType('madhab');
              setOptionsModalVisible(true);
            }}
            colors={colors}
          />
          <SettingRow
            icon={SettingsIcon}
            title={t('settings.hijriOffset', { defaultValue: 'Hijri Date Adjustment' })}
            value={`${prefs.hijriOffset > 0 ? '+' : ''}${prefs.hijriOffset || 0} Days`}
            onPress={() => {
              setOptionsModalType('hijri');
              setOptionsModalVisible(true);
            }}
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
            colors={colors}
          />
          <SettingRow 
            icon={RefreshCw} 
            title={t('settings.checkForUpdates')} 
            type={checkingUpdate ? 'loading' : 'navigate'} 
            onPress={checkForUpdates} 
            colors={colors} 
          />
          <SettingRow 
            icon={FileText} 
            title={t('settings.changelog')} 
            onPress={() => router.push('/changelog')} 
            colors={colors} 
          />
          <SettingRow 
            icon={Info} 
            title={t('settings.aboutImanSync')} 
            onPress={() => router.push('/about')} 
            isLast={true} 
            colors={colors} 
          />
        </View>
      </ScrollView>

      {/* Options Modal */}
      {optionsModalType && (
        <OptionsModal
          visible={optionsModalVisible}
          onClose={() => setOptionsModalVisible(false)}
          title={
            optionsModalType === 'calc' ? t('settings.calcMethod') :
            optionsModalType === 'madhab' ? t('settings.asrMethod') :
            optionsModalType === 'hijri' ? t('settings.hijriOffset') :
            t('settings.location')
          }
          options={
            optionsModalType === 'calc' ? CALC_METHODS.map(m => ({ id: m.id, name: m.name })) :
            optionsModalType === 'madhab' ? MADHABS.map(m => ({ id: m.id, name: m.name })) :
            optionsModalType === 'hijri' ? [-2, -1, 0, 1, 2].map(n => ({ id: n, name: `${n > 0 ? '+' : ''}${n} ${t('days', { defaultValue: 'Days' })}` })) :
            [{ id: 'auto', name: 'Auto (GPS)' }, ...Object.keys(districtMapBn).sort().map(k => ({ id: k, name: getDistrictName(k, i18n.language) }))]
          }
          selectedValue={
            optionsModalType === 'calc' ? prefs.calcMethod :
            optionsModalType === 'madhab' ? prefs.madhab :
            optionsModalType === 'hijri' ? prefs.hijriOffset :
            (prefs.manualCity || 'auto')
          }
          enableSearch={optionsModalType === 'location'}
          onSelect={(val) => {
            if (optionsModalType === 'calc') prefs.setPreferences({ calcMethod: val as number });
            else if (optionsModalType === 'madhab') prefs.setPreferences({ madhab: val as number });
            else if (optionsModalType === 'hijri') prefs.setPreferences({ hijriOffset: val as number });
            else if (optionsModalType === 'location') {
              if (val === 'auto') {
                prefs.setPreferences({ manualCity: null });
                fetchLocation();
              } else {
                prefs.setPreferences({ manualCity: val as string });
              }
            }
            import('../../services/notificationService').then(s => s.scheduleAllNotifications());
          }}
          colors={colors}
        />
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
});
