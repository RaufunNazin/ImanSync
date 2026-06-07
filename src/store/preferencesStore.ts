import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuietHours {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface PreferencesState {
  notificationsEnabled: boolean;
  prayerStartAlerts: boolean;
  prayerEndAlerts: boolean;
  taskRemindersEnabled: boolean;
  quietHours: QuietHours;
  calcMethod: number;
  madhab: number;
  location: {
    latitude: number;
    longitude: number;
    city: string;
  } | null;
  hijriOffset: number;
  showBanglaCalendar: boolean;
  banglaOffset: number;
  manualCity: string | null;
  showCuratedDuas: boolean;
  setPreferences: (partial: Partial<Omit<PreferencesState, 'setPreferences' | 'initialize'>>) => void;
  initialize: () => Promise<void>;
}

export const defaultQuietHours: QuietHours = {
  enabled: true,
  startHour: 23,
  startMinute: 0,
  endHour: 8,
  endMinute: 0,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  notificationsEnabled: true,
  prayerStartAlerts: true,
  prayerEndAlerts: true,
  taskRemindersEnabled: true,
  quietHours: defaultQuietHours,
  calcMethod: 1, // Default to Karachi (UIS)
  madhab: 1, // Default to Hanafi
  location: null,
  hijriOffset: 0,
  showBanglaCalendar: false,
  banglaOffset: 0,
  manualCity: null,
  showCuratedDuas: false,
  
  setPreferences: (partial) => {
    set(partial);
    const state = get();
    const toSave = {
      notificationsEnabled: state.notificationsEnabled,
      prayerStartAlerts: state.prayerStartAlerts,
      prayerEndAlerts: state.prayerEndAlerts,
      taskRemindersEnabled: state.taskRemindersEnabled,
      quietHours: state.quietHours,
      calcMethod: state.calcMethod,
      madhab: state.madhab,
      location: state.location,
      hijriOffset: state.hijriOffset,
      showBanglaCalendar: state.showBanglaCalendar,
      banglaOffset: state.banglaOffset,
      manualCity: state.manualCity,
      showCuratedDuas: state.showCuratedDuas,
    };
    AsyncStorage.setItem('imansync_preferences', JSON.stringify(toSave)).catch(console.error);
  },
  
  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_preferences');
      if (val) {
        const parsed = JSON.parse(val);
        // Migration: map old prayerAlertsEnabled to the new keys if they are missing
        if (parsed.prayerAlertsEnabled !== undefined && parsed.prayerStartAlerts === undefined) {
          parsed.prayerStartAlerts = parsed.prayerAlertsEnabled;
          parsed.prayerEndAlerts = parsed.prayerAlertsEnabled;
          delete parsed.prayerAlertsEnabled;
        }
        set({ ...parsed });
      } else {
        // Migration from old separate AsyncStorage keys
        const locVal = await AsyncStorage.getItem('imansync_location');
        const methVal = await AsyncStorage.getItem('imansync_calc_method');
        const updates: Partial<PreferencesState> = {};
        if (locVal) {
          try {
            updates.location = JSON.parse(locVal);
          } catch(e) {}
        }
        if (methVal) updates.calcMethod = parseInt(methVal, 10);
        if (Object.keys(updates).length > 0) {
          set(updates);
          const state = get();
          AsyncStorage.setItem('imansync_preferences', JSON.stringify({
            notificationsEnabled: state.notificationsEnabled,
            prayerStartAlerts: state.prayerStartAlerts,
            prayerEndAlerts: state.prayerEndAlerts,
            taskRemindersEnabled: state.taskRemindersEnabled,
            quietHours: state.quietHours,
            calcMethod: state.calcMethod,
            madhab: state.madhab,
            location: state.location,
            hijriOffset: state.hijriOffset,
            showBanglaCalendar: state.showBanglaCalendar,
            banglaOffset: state.banglaOffset,
            manualCity: state.manualCity,
            showCuratedDuas: state.showCuratedDuas,
          })).catch(console.error);
        }
      }
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  }
}));
