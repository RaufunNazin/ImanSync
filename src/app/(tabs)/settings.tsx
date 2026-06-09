import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import ThemeCard from '@/components/ThemeCard';
import OptionsModal from '@/components/OptionsModal';
import PageHeader from '@/components/page-header';
import TimePickerModal from '@/components/TimePickerModal';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { setLanguage } from '@/i18n';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useThemeStore } from '@/store/themeStore';
import { districtMapBn, getDistrictName } from '@/utils/districts';
import { formatNumber } from '@/utils/formatNumber';
import {
  getStorageMode,
  getStorageUri,
  initPermanentStorage,
  migrateDuas,
  StorageMode,
  switchToInternalMode,
} from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Updates from 'expo-updates';
import { AlertCircle, Bell, BellOff, BookOpen, CalendarDays, Calculator, CheckCircle, Clock, FileText, FolderLock, Globe, Info, ListTodo, MapPin, Palette, RefreshCw, Scale, Shield, X} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CALC_METHODS = [
  { id: 1, key: 'settings.calcMethod_1' },
  { id: 2, key: 'settings.calcMethod_2' },
  { id: 3, key: 'settings.calcMethod_3' }
];

const MADHABS = [
  { id: 0, key: 'settings.madhab_0' },
  { id: 1, key: 'settings.madhab_1' }
];

import SettingRow from '@/components/SettingRow';
export default function SettingsScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
          const colors = useThemeColors();
    const { t, i18n } = useTranslation();
  const router = useRouter();

  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
    
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [optionsModalType, setOptionsModalType] = useState<'calc' | 'madhab' | 'hijri' | 'bangla' | 'location' | 'appearance' | 'calendar' | null>(null);

  const [updateModal, setUpdateModal] = useState<{ visible: boolean; title: string; message: string; type: 'loading' | 'success' | 'error' } | null>(null);

  const prefs = usePreferencesStore();

  const params = useLocalSearchParams<{ highlight?: string }>();
  const [highlightedRow, setHighlightedRow] = useState<string | null>(params.highlight || null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    if (params.highlight) {
      setHighlightedRow(params.highlight);
      
      setTimeout(() => {
        if (params.highlight === 'storage') {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        } else if (params.highlight === 'location') {
          scrollViewRef.current?.scrollTo({ y: 250, animated: true });
        }
      }, 400);

      const timer = setTimeout(() => setHighlightedRow(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [params.highlight]);

  // ── Permanent Storage ──────────────────────────────────────────────────────
  const [storageMode, setStorageMode] = useState<StorageMode>('internal');
  const [storageModeLoading, setStorageModeLoading] = useState(true);
  const [storageProcessing, setStorageProcessing] = useState(false);
  const [storageConfirmModal, setStorageConfirmModal] = useState<'enable' | 'disable' | null>(null);

  useEffect(() => {
    getStorageMode().then((mode) => {
      setStorageMode(mode);
      setStorageModeLoading(false);
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

  const togglePrayerStartAlerts = (enabled: boolean) => {
    prefs.setPreferences({ prayerStartAlerts: enabled });
    import('../../services/notificationService').then(s => s.scheduleAllNotifications());
  };

  const togglePrayerEndAlerts = (enabled: boolean) => {
    prefs.setPreferences({ prayerEndAlerts: enabled });
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
        Alert.alert(t('common.permissionDenied'), t('settings.locationPermissionMsg'));
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
      Alert.alert(t('common.error'), t('settings.locationFetchError'));
    } finally {
      setFetchingLoc(false);
    }
  };

  const checkForUpdates = async () => {
    if (__DEV__) {
      setUpdateModal({ visible: true, title: t('settings.devMode', 'Development Mode'), message: t('settings.devModeUpdateMsg', 'Update checking is disabled in development mode. Please build an APK (e.g. using EAS) to test Over-The-Air updates.'), type: 'error' });
      return;
    }

    try {
      setCheckingUpdate(true);
      setUpdateModal({ visible: true, title: t('settings.checkingUpdates', 'Checking for Updates'), message: t('settings.pleaseWait', 'Please wait while we check for the latest version...'), type: 'loading' });
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        setUpdateModal({ visible: true, title: t('settings.updatesAvailable', 'Update Found!'), message: t('settings.downloadingUpdate', 'Downloading and applying the new features...'), type: 'loading' });
        await Updates.fetchUpdateAsync();
        
        setUpdateModal({ visible: true, title: t('settings.updateRestarting', 'Restarting App'), message: t('settings.restartingApp', 'Applying updates now...'), type: 'loading' });
        await Updates.reloadAsync();
      } else {
        setUpdateModal({ visible: true, title: t('settings.upToDate', 'Up to Date'), message: t('settings.updatesNotAvailable', 'You are already running the latest version.'), type: 'success' });
      }
    } catch (error) {
      console.log('Error checking for updates', error);
      setUpdateModal({ visible: true, title: t('settings.error', 'Error'), message: t('settings.errorCheckingUpdates', 'Could not check for updates. Please try again later.'), type: 'error' });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const togglePermanentStorage = async (enable: boolean) => {
    setStorageConfirmModal(enable ? 'enable' : 'disable');
  };

  const confirmStorageChange = async () => {
    const action = storageConfirmModal;
    setStorageConfirmModal(null);
    setStorageProcessing(true);
    try {
      if (action === 'enable') {
        // initPermanentStorage opens the SAF picker
        await getStorageUri();
        const result = await initPermanentStorage();
        if (!result.cancelled) {
          // Migrate internal duas to permanent
          const newUri = await getStorageUri();
          if (newUri) await migrateDuas('to_permanent', newUri);
          setStorageMode('permanent');
          // Dismiss suggestion banners
          await AsyncStorage.setItem('imansync_storage_banner_dismissed', 'true');
        }
      } else if (action === 'disable') {
        await getStorageUri();
        await switchToInternalMode();
        setStorageMode('internal');
        // Reset banner dismiss so it re-shows
        await AsyncStorage.removeItem('imansync_storage_banner_dismissed');
      }
    } catch (e) {
      console.error('Storage mode change failed', e);
      Alert.alert(t('settings.error', 'Error'), t('settings.storageChangeFailed', 'Could not change storage mode. Please try again.'));
    } finally {
      setStorageProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('settings.titleEn')} titleAr={t('settings.titleAr')} />
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Text>
        <ThemeCard style={[styles.card]}>
          <SettingRow icon={Globe} title={t('settings.language')} value={i18n.language === 'bn' ? 'বাংলা' : 'English'} onPress={cycleLanguage} colors={colors} />
          <SettingRow icon={Palette} title={t('settings.theme')} value={scheme === 'dark'} type="toggle" onPress={toggleDarkMode} colors={colors} />
                    <SettingRow icon={BookOpen} title={t('settings.showCuratedDuas')} value={prefs.showCuratedDuas} type="toggle" isLast={true} onPress={(v) => prefs.setPreferences({ showCuratedDuas: v })} colors={colors} />
        </ThemeCard>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.calendarSettings', { defaultValue: 'Calendar Settings' })}</Text>
        <ThemeCard style={[styles.card]}>
          <SettingRow
            icon={CalendarDays}
            title={t('settings.hijriOffset', { defaultValue: 'Hijri Date Adjustment' })}
            value={`${prefs.hijriOffset > 0 ? '+' : ''}${formatNumber(prefs.hijriOffset || 0, i18n.language)} ${t('settings.days', { defaultValue: 'Days' })}`}
            onPress={() => {
              setOptionsModalType('hijri');
              setOptionsModalVisible(true);
            }}
            colors={colors}
          />
          <SettingRow
            icon={CalendarDays}
            title={t('settings.showBanglaCalendar', { defaultValue: 'Show Bangla Calendar' })}
            value={prefs.showBanglaCalendar}
            type="toggle"
            isLast={!prefs.showBanglaCalendar}
            onPress={(val) => prefs.setPreferences({ showBanglaCalendar: val })}
            colors={colors}
          />
          {prefs.showBanglaCalendar && (
            <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify()}>
              <SettingRow
                icon={CalendarDays}
                title={t('settings.banglaOffset', { defaultValue: 'Bangla Date Adjustment' })}
                value={`${prefs.banglaOffset > 0 ? '+' : ''}${formatNumber(prefs.banglaOffset || 0, i18n.language)} ${t('settings.days', { defaultValue: 'Days' })}`}
                onPress={() => {
                  setOptionsModalType('bangla');
                  setOptionsModalVisible(true);
                }}
                isLast={true}
                colors={colors}
              />
            </Animated.View>
          )}
        </ThemeCard>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.notificationsTitle', { defaultValue: 'Notifications Settings' })}</Text>
        <ThemeCard style={[styles.card]}>
          <SettingRow icon={Bell} title={t('settings.masterToggle', { defaultValue: 'Master Toggle' })} value={prefs.notificationsEnabled} type="toggle" isLast={!prefs.notificationsEnabled} onPress={toggleNotifications} colors={colors} />
          {prefs.notificationsEnabled && (
            <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify()}>
              <SettingRow icon={Clock} title={t('settings.prayerStartAlerts', { defaultValue: 'Prayer Start Alerts' })} value={prefs.prayerStartAlerts} type="toggle" onPress={togglePrayerStartAlerts} colors={colors} />
              <SettingRow icon={Clock} title={t('settings.prayerEndAlerts', { defaultValue: 'Prayer End Alerts' })} value={prefs.prayerEndAlerts} type="toggle" onPress={togglePrayerEndAlerts} colors={colors} />
              <SettingRow icon={ListTodo} title={t('settings.dailyReminders', { defaultValue: 'Daily Reminders' })} value={prefs.taskRemindersEnabled} type="toggle" onPress={toggleTaskReminders} colors={colors} />
              <SettingRow
                icon={BellOff}
                title={t('settings.doNotDisturb')}
                value={prefs.quietHours.enabled}
                type="toggle"
                isLast={true}
                onPress={(v: boolean) => {
                  prefs.setPreferences({ quietHours: { ...prefs.quietHours, enabled: v } });
                  import('../../services/notificationService').then(s => s.scheduleAllNotifications());
                }}
                colors={colors}
              />
              {prefs.quietHours.enabled && (
                <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition.springify()} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.three, paddingLeft: 52 }}>
                  <Text style={[styles.settingTitle, { color: colors.textSecondary, fontSize: 13 }]}>
                    {t('settings.dndSchedule')}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity activeOpacity={1} 
                      onPress={() => { setPickerType('start'); setPickerVisible(true); }}
                      style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.border + '40' }}
                    >
                      <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.text }}>
                        {formatTime12h(prefs.quietHours.startHour, prefs.quietHours.startMinute, i18n.language)}
                      </Text>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary }}>
                      {i18n.language === 'bn' ? 'থেকে' : 'to'}
                    </Text>
                    <TouchableOpacity activeOpacity={1} 
                      onPress={() => { setPickerType('end'); setPickerVisible(true); }}
                      style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.border + '40' }}
                    >
                      <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.text }}>
                        {formatTime12h(prefs.quietHours.endHour, prefs.quietHours.endMinute, i18n.language)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </ThemeCard>

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
        <ThemeCard style={[styles.card]}>
          <SettingRow
            icon={MapPin}
            title={t('settings.location')}
            value={prefs.manualCity ? getDistrictName(prefs.manualCity, i18n.language) : (prefs.location ? getDistrictName(prefs.location.city, i18n.language) : t('settings.autoGPS', { defaultValue: 'Auto (GPS)' }))}
            type={fetchingLoc ? 'loading' : 'navigate'}
            onPress={() => {
              setOptionsModalType('location');
              setOptionsModalVisible(true);
            }}
            highlight={highlightedRow === 'location'}
            colors={colors}
          />
          <SettingRow
            icon={Calculator}
            title={t('settings.calcMethod')}
            value={t((CALC_METHODS.find(m => m.id === prefs.calcMethod)?.key + '_short') as any || 'settings.calcMethod_1_short')}
            onPress={() => {
              setOptionsModalType('calc');
              setOptionsModalVisible(true);
            }}
            colors={colors}
          />
          <SettingRow
            icon={Scale}
            title={t('settings.asrMethod', { defaultValue: 'Asr Method (Madhab)' })}
            value={t(MADHABS.find(m => m.id === prefs.madhab)?.key as any || 'settings.madhab_1')}
            onPress={() => {
              setOptionsModalType('madhab');
              setOptionsModalVisible(true);
            }}
            colors={colors}
          />
          </ThemeCard>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.system')}</Text>
        <ThemeCard style={[styles.card]}>
          <SettingRow
            icon={FolderLock}
            title={t('settings.permanentStorage')}
            value={storageMode === 'permanent'}
            type={storageProcessing ? 'loading' : 'toggle'}
            onPress={togglePermanentStorage}
            highlight={highlightedRow === 'storage'}
            colors={colors}
            isLoading={storageModeLoading}
          />
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
        </ThemeCard>
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
            optionsModalType === 'bangla' ? t('settings.banglaOffset', { defaultValue: 'Bangla Offset' }) :
            
            t('settings.location')
          }
          options={
            optionsModalType === 'calc' ? CALC_METHODS.map(m => ({ id: m.id, name: t(m.key as any) })) :
            optionsModalType === 'madhab' ? MADHABS.map(m => ({ id: m.id, name: t(m.key as any) })) :
            optionsModalType === 'appearance'  ? [] :
            optionsModalType === 'hijri' || optionsModalType === 'bangla' ? [-2, -1, 0, 1, 2].map(n => ({ id: n, name: `${n > 0 ? '+' : ''}${formatNumber(n, i18n.language)} ${t('settings.days', { defaultValue: 'Days' })}` })) :
            [{ id: 'auto', name: t('settings.autoGPS', { defaultValue: 'Auto (GPS)' }) }, ...Object.keys(districtMapBn).sort().map(k => ({ id: k, name: getDistrictName(k, i18n.language) }))]
          }
          selectedValue={
            optionsModalType === 'calc' ? prefs.calcMethod :
            optionsModalType === 'madhab' ? prefs.madhab :
            optionsModalType === 'hijri' ? prefs.hijriOffset :
            optionsModalType === 'bangla' ? prefs.banglaOffset :
            (prefs.manualCity || 'auto')
          }
          enableSearch={optionsModalType === 'location'}
          onSelect={(val) => {
            if (optionsModalType === 'calc') prefs.setPreferences({ calcMethod: val as number });
            else if (optionsModalType === 'madhab') prefs.setPreferences({ madhab: val as number });
            else if (optionsModalType === 'hijri') prefs.setPreferences({ hijriOffset: val as number });
            else if (optionsModalType === 'bangla') prefs.setPreferences({ banglaOffset: val as number });
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
          customContent={
            undefined
          }
        />
      )}

      {/* Update Modal */}
      {updateModal && (
        <Modal visible={updateModal.visible} transparent animationType="fade">
          <View style={StyleSheet.absoluteFill}>
            <View   style={StyleSheet.absoluteFill} />
            <View style={updateStyles.overlay}>
              <View style={[updateStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {updateModal.type !== 'loading' && (
                  <TouchableOpacity activeOpacity={1} style={[updateStyles.closeBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setUpdateModal(null)}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                
                <View style={[updateStyles.iconWrap, { backgroundColor: updateModal.type === 'success' ? colors.accent + '20' : updateModal.type === 'error' ? '#ef444420' : colors.highlight + '20' }]}>
                  {updateModal.type === 'success' ? (
                    <CheckCircle size={32} color={colors.accent} />
                  ) : updateModal.type === 'error' ? (
                    <AlertCircle size={32} color="#ef4444" />
                  ) : (
                    <ActivityIndicator size="large" color={colors.highlight} />
                  )}
                </View>
                
                <Text style={[updateStyles.title, { color: colors.text }]}>{updateModal.title}</Text>
                <Text style={[updateStyles.desc, { color: colors.textSecondary }]}>{updateModal.message}</Text>
                
                {updateModal.type !== 'loading' && (
                  <TouchableOpacity activeOpacity={1} style={[updateStyles.btn, { backgroundColor: updateModal.type === 'success' ? colors.accent : '#ef4444' }]} onPress={() => setUpdateModal(null)}>
                    <Text style={updateStyles.btnText}>{t('system.gotIt', 'Got It')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Storage Confirm Modal */}
      {storageConfirmModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={StyleSheet.absoluteFill}>
            <View   style={StyleSheet.absoluteFill} />
            <View style={updateStyles.overlay}>
              <View style={[updateStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={[updateStyles.closeBtn, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => setStorageConfirmModal(null)}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={[updateStyles.iconWrap, { backgroundColor: colors.highlight + '20' }]}>
                  <FolderLock size={32} color={colors.highlight} />
                </View>

                <Text style={[updateStyles.title, { color: colors.text }]}>
                  {storageConfirmModal === 'enable'
                    ? t('settings.permanentStorageOn')
                    : t('settings.permanentStorageOff')}
                </Text>
                <Text style={[updateStyles.desc, { color: colors.textSecondary }]}>
                  {storageConfirmModal === 'enable'
                    ? t('settings.permanentStorageOnDesc')
                    : t('settings.permanentStorageOffDesc')}
                </Text>

                <TouchableOpacity activeOpacity={1}
                  style={[updateStyles.btn, { backgroundColor: storageConfirmModal === 'enable' ? colors.highlight : '#ef4444' }]}
                  onPress={confirmStorageChange}
                >
                  <Text style={updateStyles.btnText}>
                    {storageConfirmModal === 'enable'
                      ? t('settings.permanentStorageConfirmEnable')
                      : t('settings.permanentStorageConfirmDisable')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={1}
                  style={[updateStyles.btn, { backgroundColor: colors.backgroundElement, marginTop: 8 }]}
                  onPress={() => setStorageConfirmModal(null)}
                >
                  <Text style={[updateStyles.btnText, { color: colors.textSecondary }]}>
                    {t('settings.cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
    height: 15,
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
    paddingVertical: Spacing.two,
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

const updateStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 22,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  desc: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  btn: {
    width: '100%',
    paddingVertical: Spacing.three,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    color: '#fff',
  },
});

