import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import AppModal from './AppModal';
import SettingRow from './SettingRow';
import TimePickerModal from './TimePickerModal';
import { useTranslation } from 'react-i18next';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { usePreferencesStore } from '@/store/preferencesStore';
import { Bell, BellOff, Clock, ListTodo } from 'lucide-react-native';
import { formatNumber } from '@/utils/formatNumber';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const prefs = usePreferencesStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');

  const toggleNotifications = async (enabled: boolean) => {
    prefs.setPreferences({ notificationsEnabled: enabled });
    if (enabled) {
      import('@/services/notificationService').then(s => s.scheduleAllNotifications()).catch(console.error);
    } else {
      import('@notifee/react-native').then(n => n.default.cancelAllNotifications()).catch(console.error);
    }
  };

  const scheduleTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    };
  }, []);

  const scheduleUpdate = () => {
    if (scheduleTimerRef.current) clearTimeout(scheduleTimerRef.current);
    scheduleTimerRef.current = setTimeout(() => {
      import('@/services/notificationService').then(s => s.scheduleAllNotifications()).catch(console.error);
    }, 1000);
  };

  const formatTime12h = (hour: number, minute: number, lang: string) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    const timeEn = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return formatNumber(timeEn, lang);
  };

  return (
    <>
      <AppModal visible={visible} onClose={onClose} title={t('settings.notificationsTitle')}>
        <View style={{ gap: Spacing.four, paddingBottom: 20 }}>
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <SettingRow 
              icon={Bell} 
              title={t('settings.masterToggle')} 
              value={prefs.notificationsEnabled} 
              type="toggle" 
              isLast={!prefs.notificationsEnabled} 
              onPress={toggleNotifications} 
            />
            {prefs.notificationsEnabled && (
              <>
                <SettingRow icon={ListTodo} title={t('settings.dailyReminders')} value={prefs.taskRemindersEnabled} type="toggle" onPress={(v) => { prefs.setPreferences({ taskRemindersEnabled: v }); scheduleUpdate(); }} />
                <SettingRow
                  icon={BellOff}
                  title={t('settings.doNotDisturb')}
                  value={prefs.quietHours.enabled}
                  type="toggle"
                  isLast={!prefs.quietHours.enabled}
                  onPress={(v: boolean) => {
                    prefs.setPreferences({ quietHours: { ...prefs.quietHours, enabled: v } });
                    scheduleUpdate();
                  }}
                />
                {prefs.quietHours.enabled && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.three, paddingLeft: 52 }}>
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
                        {t('settings.to')}
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
                  </View>
                )}
              </>
            )}
          </View>

          {prefs.notificationsEnabled && (
            <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
              {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((prayer, index) => (
                <View key={prayer}>
                  <SettingRow 
                    icon={Clock} 
                    title={t(`settings.${prayer}Start`)} 
                    value={prefs[`${prayer}StartAlert` as keyof typeof prefs] as boolean} 
                    type="toggle" 
                    onPress={(v) => { prefs.setPreferences({ [`${prayer}StartAlert` as keyof typeof prefs]: v } as any); scheduleUpdate(); }} 
                  />
                  <SettingRow 
                    icon={Clock} 
                    title={t(`settings.${prayer}End`)} 
                    value={prefs[`${prayer}EndAlert` as keyof typeof prefs] as boolean} 
                    type="toggle" 
                    isLast={index === 4}
                    onPress={(v) => { prefs.setPreferences({ [`${prayer}EndAlert` as keyof typeof prefs]: v } as any); scheduleUpdate(); }} 
                  />
                  {index < 4 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </AppModal>

      <TimePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={pickerType === 'start' ? t('settings.dndFrom') : t('settings.dndTo')}
        initialHour={pickerType === 'start' ? prefs.quietHours.startHour : prefs.quietHours.endHour}
        initialMinute={pickerType === 'start' ? prefs.quietHours.startMinute : prefs.quietHours.endMinute}
        onSave={(hour, minute) => {
          setPickerVisible(false);
          if (pickerType === 'start') {
            prefs.setPreferences({ quietHours: { ...prefs.quietHours, startHour: hour, startMinute: minute } });
          } else {
            prefs.setPreferences({ quietHours: { ...prefs.quietHours, endHour: hour, endMinute: minute } });
          }
          scheduleUpdate();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.four,
  },
  settingTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  }
});
