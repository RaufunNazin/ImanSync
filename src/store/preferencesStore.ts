import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv';
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

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
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
      },
      
      initialize: async () => {
        try {
          // Fallback migration from old AsyncStorage
          const val = await AsyncStorage.getItem('imansync_preferences');
          if (val) {
            const parsed = JSON.parse(val);
            // Only migrate if we haven't saved to MMKV yet
            // Wait, persist auto-hydrates. But just in case, we can check if it's the default state.
            // Actually, we don't need this if persist handles it, but since we are changing engines:
            const mmkvVal = zustandStorage.getItem('preferences-storage');
            if (!mmkvVal) {
              if (parsed.prayerAlertsEnabled !== undefined && parsed.prayerStartAlerts === undefined) {
                parsed.prayerStartAlerts = parsed.prayerAlertsEnabled;
                parsed.prayerEndAlerts = parsed.prayerAlertsEnabled;
                delete parsed.prayerAlertsEnabled;
              }
              set({ ...parsed });
            }
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
             }
          }
        } catch (e) {
          console.error('Failed to load preferences from async storage', e);
        }
      }
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

