import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useTranslation } from 'react-i18next';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { Bell, RefreshCw, Info, X } from 'lucide-react-native';

// TODO: Replace this URL with your raw GitHub Gist URL or JSON server URL
const SYSTEM_CONFIG_URL = 'https://raw.githubusercontent.com/RaufunNazin/ImanSync/main/system_config.json';
const CURRENT_APP_VERSION = '1.0.0'; // Manually bump this when publishing non-OTA updates

interface SystemConfig {
  latestVersion: string;
  changelog: {
    version: string;
    en: string[];
    bn: string[];
    ar?: string[];
  };
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
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme || 'light'];

  const [updateReady, setUpdateReady] = useState(false);
  const [changelog, setChangelog] = useState<SystemConfig['changelog'] | null>(null);
  const [notification, setNotification] = useState<SystemConfig['notification'] | null>(null);

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
      const response = await fetch(SYSTEM_CONFIG_URL);
      if (!response.ok) return;
      const config: SystemConfig = await response.json();

      // 3. Process Changelog
      const lastSeenVersion = await AsyncStorage.getItem('last_seen_changelog_version');
      if (config.changelog && config.changelog.version !== lastSeenVersion) {
        // If the app just updated to this version, show changelog
        // OR if you want to show it immediately regardless of true app version, uncomment:
        setChangelog(config.changelog);
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
      setChangelog(null);
    }
  };

  const dismissNotification = async () => {
    if (notification) {
      await AsyncStorage.setItem('last_seen_notification_id', notification.id);
      setNotification(null);
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
      <Modal visible={updateReady} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.highlight + '20' }]}>
              <RefreshCw size={32} color={colors.highlight} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('system.updateReadyTitle', 'Update Ready!')}</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>
              {t('system.updateReadyDesc', 'A new version of the app has been downloaded. Restart the app to apply the new features.')}
            </Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.highlight }]} onPress={handleRestart}>
              <Text style={styles.btnText}>{t('system.restartNow', 'Restart Now')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Changelog Modal */}
      <Modal visible={!!changelog && !updateReady} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border, maxHeight: '80%' }]}>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]} onPress={dismissChangelog}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={[styles.iconWrap, { backgroundColor: colors.accent + '20' }]}>
              <Info size={32} color={colors.accent} />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>{t('system.whatsNew', "What's New")}</Text>
            <Text style={[styles.versionTag, { color: colors.textSecondary }]}>v{changelog?.version}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%', marginTop: Spacing.four }}>
              {changelog && getLocalizedText(changelog).map((line: string, i: number) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.bulletText, { color: colors.text }]}>{line}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent, width: '100%', marginTop: Spacing.two }]} onPress={dismissChangelog}>
              <Text style={styles.btnText}>{t('system.awesome', 'Awesome!')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <Modal visible={!!notification && !updateReady && !changelog} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.highlight + '20' }]}>
              <Bell size={16} color={colors.highlight} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('system.notification', 'Notice')}</Text>
            <Text style={[styles.desc, { color: colors.text, textAlign: 'center', fontSize: 16 }]}>
              {notification && getLocalizedText(notification)}
            </Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.highlight, width: '100%', marginTop: Spacing.two }]} onPress={dismissNotification}>
              <Text style={styles.btnText}>{t('system.gotIt', 'Got It')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
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
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.outfit,
    color: '#FFF',
    fontSize: 16,
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
