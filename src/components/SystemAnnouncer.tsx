import AppModal from './AppModal';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import { Bell, RefreshCw, Info } from 'lucide-react-native';

const SYSTEM_CONFIG_URL = 'https://raw.githubusercontent.com/RaufunNazin/ImanSync/main/system_config.json';


interface SystemConfig {
  latestVersion: string;
  changelog: Array<{
    version: string;
    en: string[];
    bn: string[];
    ar?: string[];
  }>;
  notification: {
    id: string;
    timestamp: string;
    en: string;
    bn: string;
    ar?: string;
  };
}

export default function SystemAnnouncer() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const activeColor = useActiveColor();

  const [updateReady, setUpdateReady] = useState(false);
  const [changelog, setChangelog] = useState<SystemConfig['changelog'][0] | null>(null);
  const [notification, setNotification] = useState<SystemConfig['notification'] | null>(null);
  const [activeModal, setActiveModal] = useState<'update' | 'changelog' | 'notification' | null>(null);

  useEffect(() => {
    if (updateReady) setActiveModal('update');
    else if (changelog) setActiveModal('changelog');
    else if (notification) setActiveModal('notification');
    else setActiveModal(null);
  }, [updateReady, changelog, notification]);

  useEffect(() => {
    checkSystem();
  }, []);

  const checkSystem = async () => {
    // 1. Check for OTA Updates
    if (!__DEV__) {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setUpdateReady(true);
          return; // Stop here, force restart first
        }
      } catch (e) {
        console.log('OTA Update Error:', e);
      }
    }

    try {
      // 2. Fetch Server Config
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(SYSTEM_CONFIG_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) return;
      const config: SystemConfig = await response.json();

      // 3. Process Changelog
      const lastSeenVersion = await AsyncStorage.getItem('last_seen_changelog_version');
      if (config.changelog && Array.isArray(config.changelog) && config.changelog.length > 0) {
        const latestChangelog = config.changelog[0];
        if (latestChangelog.version !== lastSeenVersion) {
          setChangelog(latestChangelog);
        }
      }

      // 4. Process Notification
      const lastSeenNotif = await AsyncStorage.getItem('last_seen_notification_id');
      if (config.notification && config.notification.id !== lastSeenNotif) {
        setNotification(config.notification);
      }

    } catch (e) {
      console.log('SystemAnnouncer Error:', e);
    }
  };

  const handleRestart = async () => {
    await Updates.reloadAsync();
  };

  const dismissChangelog = async () => {
    if (changelog) {
      await AsyncStorage.setItem('last_seen_changelog_version', changelog.version);
      setActiveModal(null);
      setTimeout(() => setChangelog(null), 300);
    }
  };

  const dismissNotification = async () => {
    if (notification) {
      await AsyncStorage.setItem('last_seen_notification_id', notification.id);
      setActiveModal(null);
      setTimeout(() => setNotification(null), 300);
    }
  };

  const getLocalizedText = (item: any) => {
    const lang = i18n.language;
    if (lang === 'bn' && item.bn) return item.bn;
    if (lang === 'ar' && item.ar) return item.ar;
    return item.en;
  };

  // ---------------- Render Modals ---------------- //

  if (!updateReady && !changelog && !notification) return null;

  return (
    <>
      {/* Update Ready Modal */}
      <AppModal visible={activeModal === 'update'} onClose={() => {}} hideClose scrollable={false}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={[styles.iconWrap, { backgroundColor: activeColor + '15' }]}>
            <RefreshCw size={32} color={activeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('system.updateReadyTitle', 'Update Ready!')}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>
            {t('system.updateReadyDesc', 'A new version of the app has been downloaded. Restart the app to apply the new features.')}
          </Text>
          <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor }]} onPress={handleRestart}>
            <Text style={styles.btnText}>{t('system.restartNow', 'Restart Now')}</Text>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* Changelog Modal */}
      <AppModal 
        visible={activeModal === 'changelog'} 
        onClose={dismissChangelog} 
        scrollable={true}
        footer={
          <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor, width: '100%', marginTop: 12 }]} onPress={dismissChangelog}>
            <Text style={styles.btnText}>{t('system.awesome', 'Awesome!')}</Text>
          </TouchableOpacity>
        }
      >
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={[styles.iconWrap, { backgroundColor: activeColor + '20' }]}>
            <Info size={32} color={activeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('system.whatsNew', "What's New")}</Text>
          <Text style={[styles.versionTag, { color: colors.textSecondary }]}>v{changelog?.version}</Text>
        </View>

        <View style={{ width: '100%', marginTop: 24 }}>
          {changelog && getLocalizedText(changelog).map((line: string, i: number) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: colors.textSecondary }]} />
              <Text style={[styles.bulletText, { color: colors.text }]}>{line}</Text>
            </View>
          ))}
        </View>
      </AppModal>

      {/* Notification Modal */}
      <AppModal 
        visible={activeModal === 'notification'} 
        onClose={dismissNotification} 
        scrollable={true}
        footer={
          <TouchableOpacity activeOpacity={1} style={[styles.btn, { backgroundColor: activeColor, width: '100%', marginTop: 12 }]} onPress={dismissNotification}>
            <Text style={styles.btnText}>{t('system.gotIt', 'Got It')}</Text>
          </TouchableOpacity>
        }
      >
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={[styles.iconWrap, { backgroundColor: activeColor + '15' }]}>
            <Bell size={32} color={activeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('system.notification', 'Notice')}</Text>
          <Text style={[styles.desc, { color: colors.text, textAlign: 'center', fontSize: 16, marginTop: 12 }]}>
            {notification && getLocalizedText(notification)}
          </Text>
        </View>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({


  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  card: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 120,
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  desc: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.two,
    lineHeight: 22,
  },
  versionTag: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.six,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.outfit,
    color: '#FFF',
    fontSize: 16,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
  }
});
