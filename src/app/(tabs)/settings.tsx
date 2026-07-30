import Animated, { LinearTransition } from 'react-native-reanimated';
import ThemeCard from '@/components/ThemeCard';
import OptionsModal from '@/components/OptionsModal';
import PageHeader from '@/components/page-header';
import NotificationsModal from '@/components/NotificationsModal';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
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
import { Bell, BookOpen, CalendarDays, Calculator, FileText, FolderLock, Globe, Info, MapPin, Palette, RefreshCw, Scale, Shield} from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppModal from '@/components/AppModal';
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
  const activeColor = useActiveColor();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [optionsModalType, setOptionsModalType] = useState<'calc' | 'madhab' | 'hijri' | 'bangla' | 'location' | 'appearance' | 'calendar' | null>(null);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const prefs = usePreferencesStore();

  const params = useLocalSearchParams<{ highlight?: string }>();
  const [highlightedRow, setHighlightedRow] = useState<string | null>(params.highlight || null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const locationY = React.useRef(0);

  const updateStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (updateStatusTimeoutRef.current) clearTimeout(updateStatusTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      if (notificationDebounceRef.current) clearTimeout(notificationDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (params.highlight) {
      setHighlightedRow(params.highlight);
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (params.highlight === 'storage') {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        } else if (params.highlight === 'location' && locationY.current > 0) {
          scrollViewRef.current?.scrollTo({ y: locationY.current - 20, animated: true });
        }
      }, 400);

      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedRow(null), 3000);
    }
  }, [params.highlight]);

  // ── Permanent Storage ──────────────────────────────────────────────────────
  const [storageMode, setStorageMode] = useState<StorageMode>('internal');

  const [storageProcessing, setStorageProcessing] = useState(false);
  const [storageConfirmModal, setStorageConfirmModal] = useState<'enable' | 'disable' | null>(null);

  useEffect(() => {
    let isMounted = true;
    getStorageMode().then((mode) => {
      if (isMounted) setStorageMode(mode);
    });
    return () => { isMounted = false; };
  }, []);



  const toggleDarkMode = (enabled: boolean) => {
    // DO NOT wrap in InteractionManager — setTheme is a simple Zustand set().
    // Deferring caused setTheme to fire after the Switch component was already
    // unmounted by the in-flight re-render, producing the crash.
    setTheme(enabled ? 'dark' : 'light');
  };

  const cycleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'bn' : 'en';
    setLanguage(nextLang);
    
    if (notificationDebounceRef.current) clearTimeout(notificationDebounceRef.current);
    notificationDebounceRef.current = setTimeout(() => {
      import('../../services/notificationService').then(s => s.scheduleAllNotifications());
    }, 1000);
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

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const checkForUpdates = async () => {
    if (__DEV__) {
      setUpdateStatus(t('settings.devModeUpdateMsg', 'Unavailable in Dev'));
      if (updateStatusTimeoutRef.current) clearTimeout(updateStatusTimeoutRef.current);
      updateStatusTimeoutRef.current = setTimeout(() => setUpdateStatus(null), 3000);
      return;
    }

    try {
      setCheckingUpdate(true);
      if (updateStatusTimeoutRef.current) clearTimeout(updateStatusTimeoutRef.current);
      setUpdateStatus(t('settings.checkingUpdates', 'Checking for Updates...'));
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        if (!isMounted.current) return;
        setUpdateStatus(t('settings.downloadingUpdate', 'Downloading Update...'));
        await Updates.fetchUpdateAsync();
        
        if (!isMounted.current) return;
        setUpdateStatus(t('settings.restartingApp', 'Applying Updates...'));
        await Updates.reloadAsync();
      } else {
        if (!isMounted.current) return;
        setUpdateStatus(t('settings.upToDate', 'Up to Date'));
        if (updateStatusTimeoutRef.current) clearTimeout(updateStatusTimeoutRef.current);
        updateStatusTimeoutRef.current = setTimeout(() => { if (isMounted.current) setUpdateStatus(null) }, 3000);
      }
    } catch (error) {
      console.log('Error checking for updates', error);
      if (!isMounted.current) return;
      setUpdateStatus(t('settings.errorCheckingUpdates', 'Update Failed'));
      if (updateStatusTimeoutRef.current) clearTimeout(updateStatusTimeoutRef.current);
      updateStatusTimeoutRef.current = setTimeout(() => { if (isMounted.current) setUpdateStatus(null) }, 3000);
    } finally {
      if (isMounted.current) setCheckingUpdate(false);
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
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('settings.titleEn')} titleAr={t('settings.titleAr')} />
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Animated.View layout={LinearTransition.duration(200)}>

        <Animated.Text layout={LinearTransition.duration(200)} style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.preferences')}</Animated.Text>
        <ThemeCard animated layout={LinearTransition.duration(200)} style={[styles.card]}>
          <SettingRow icon={Globe} title={t('settings.language')} value={i18n.language === 'bn' ? 'বাংলা' : 'English'} onPress={cycleLanguage} />
          <SettingRow icon={Palette} title={t('settings.theme')} value={scheme === 'dark'} type="toggle" onPress={toggleDarkMode} />
                    <SettingRow icon={BookOpen} title={t('settings.showCuratedDuas')} value={prefs.showCuratedDuas} type="toggle" isLast={true} onPress={(v) => prefs.setPreferences({ showCuratedDuas: v })} />
        </ThemeCard>

        <Animated.Text layout={LinearTransition.duration(200)} style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.calendarSettings', { defaultValue: 'Calendar Settings' })}</Animated.Text>
        <ThemeCard animated layout={LinearTransition.duration(200)} style={[styles.card]}>
          <SettingRow
            icon={CalendarDays}
            title={t('settings.hijriOffset', { defaultValue: 'Hijri Date Adjustment' })}
            value={`${prefs.hijriOffset > 0 ? '+' : ''}${formatNumber(prefs.hijriOffset || 0, i18n.language)} ${t('settings.days', { defaultValue: 'Days' })}`}
            onPress={() => {
              setOptionsModalType('hijri');
              setOptionsModalVisible(true);
            }}
           
          />
          <SettingRow
            icon={CalendarDays}
            title={t('settings.showBanglaCalendar', { defaultValue: 'Show Bangla Calendar' })}
            value={prefs.showBanglaCalendar}
            type="toggle"
            isLast={!prefs.showBanglaCalendar}
            onPress={(val) => prefs.setPreferences({ showBanglaCalendar: val })}
           
          />
          {prefs.showBanglaCalendar && (
            <>
              <SettingRow
                icon={CalendarDays}
                title={t('settings.banglaOffset', { defaultValue: 'Bangla Date Adjustment' })}
                value={`${prefs.banglaOffset > 0 ? '+' : ''}${formatNumber(prefs.banglaOffset || 0, i18n.language)} ${t('settings.days', { defaultValue: 'Days' })}`}
                onPress={() => {
                  setOptionsModalType('bangla');
                  setOptionsModalVisible(true);
                }}
                isLast={true}
               
              />
            </>
          )}
        </ThemeCard>

        <Animated.Text layout={LinearTransition.duration(200)} style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.notificationsTitle', { defaultValue: 'Notifications Settings' })}</Animated.Text>
        <ThemeCard animated layout={LinearTransition.duration(200)} style={[styles.card]}>
          <SettingRow 
            icon={Bell} 
            title={t('settings.notificationsTitle')} 
            onPress={() => setNotificationsModalVisible(true)} 
            type="navigate" 
            isLast={true}
          />
        </ThemeCard>

        <Animated.Text layout={LinearTransition.duration(200)} onLayout={(e) => { locationY.current = e.nativeEvent.layout.y; }} style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.locationCalc')}</Animated.Text>
        <ThemeCard animated layout={LinearTransition.duration(200)} style={[styles.card]}>
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
           
          />
          <SettingRow
            icon={Calculator}
            title={t('settings.calcMethod')}
            value={t((CALC_METHODS.find(m => m.id === prefs.calcMethod)?.key + '_short') as any || 'settings.calcMethod_1_short')}
            onPress={() => {
              setOptionsModalType('calc');
              setOptionsModalVisible(true);
            }}
           
          />
          <SettingRow
            icon={Scale}
            title={t('settings.asrMethod', { defaultValue: 'Asr Method (Madhab)' })}
            value={t(MADHABS.find(m => m.id === prefs.madhab)?.key as any || 'settings.madhab_1')}
            onPress={() => {
              setOptionsModalType('madhab');
              setOptionsModalVisible(true);
            }}
           
          />
          </ThemeCard>

        <Animated.Text layout={LinearTransition.duration(200)} style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('settings.system')}</Animated.Text>
        <ThemeCard animated layout={LinearTransition.duration(200)} style={[styles.card]}>
          <SettingRow
            icon={FolderLock}
            title={t('settings.permanentStorage')}
            value={storageMode === 'permanent'}
            type={storageProcessing ? 'loading' : 'toggle'}
            onPress={togglePermanentStorage}
            highlight={highlightedRow === 'storage'}
           
          />
          <SettingRow 
            icon={Shield} 
            title={t('settings.managePermissions')} 
            onPress={() => Linking.openSettings()} 
           
          />
          <SettingRow 
            icon={RefreshCw} 
            title={updateStatus || t('settings.checkForUpdates')} 
            type={checkingUpdate ? 'loading' : 'navigate'} 
            onPress={checkForUpdates} 
            
          />
          <SettingRow 
            icon={FileText} 
            title={t('settings.changelog')} 
            onPress={() => router.push('/changelog')} 
            
          />
          <SettingRow 
            icon={Info} 
            title={t('settings.aboutImanSync')} 
            onPress={() => router.push('/about')} 
            isLast={true} 
            
          />
        </ThemeCard>
        </Animated.View>
      </ScrollView>

      <NotificationsModal visible={notificationsModalVisible} onClose={() => setNotificationsModalVisible(false)} />
      
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
         
          customContent={
            undefined
          }
        />
      )}

      {/* Storage Confirm Modal */}
      {storageConfirmModal && (
        <AppModal visible={true} onClose={() => setStorageConfirmModal(null)} scrollable={false}>
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <View style={[{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, { backgroundColor: colors.textSecondary + '20' }]}>
              <FolderLock size={32} color={colors.textSecondary} />
            </View>

            <Text style={[{ fontFamily: Fonts.outfit, fontSize: 18, marginBottom: 8, textAlign: 'center' }, { color: colors.text }]}>
              {storageConfirmModal === 'enable'
                ? t('settings.permanentStorageOn')
                : t('settings.permanentStorageOff')}
            </Text>
            <Text style={[{ fontFamily: Fonts.outfit, fontSize: 14, textAlign: 'center', marginBottom: 24 }, { color: colors.textSecondary }]}>
              {storageConfirmModal === 'enable'
                ? t('settings.permanentStorageOnDesc')
                : t('settings.permanentStorageOffDesc')}
            </Text>

            <TouchableOpacity activeOpacity={1}
              style={[{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' }, { backgroundColor: storageConfirmModal === 'enable' ? activeColor : colors.error }]}
              onPress={confirmStorageChange}
            >
              <Text style={{ fontFamily: Fonts.outfit, color: '#FFF', fontSize: 16, fontWeight: '500' }}>
                {storageConfirmModal === 'enable'
                  ? t('settings.permanentStorageConfirmEnable')
                  : t('settings.permanentStorageConfirmDisable')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1}
              style={[{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' }, { backgroundColor: colors.backgroundElement, marginTop: 8 }]}
              onPress={() => setStorageConfirmModal(null)}
            >
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, fontWeight: '500', color: colors.textSecondary }}>
                {t('settings.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </AppModal>
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
  card: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.four,
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

