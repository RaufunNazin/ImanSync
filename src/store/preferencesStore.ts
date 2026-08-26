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
  fajrStartAlert: boolean;
  fajrEndAlert: boolean;
  dhuhrStartAlert: boolean;
  dhuhrEndAlert: boolean;
  asrStartAlert: boolean;
  asrEndAlert: boolean;
  maghribStartAlert: boolean;
  maghribEndAlert: boolean;
  ishaStartAlert: boolean;
  ishaEndAlert: boolean;
  taskRemindersEnabled: boolean;
  quietHours: QuietHours;
  calcMethod: number;
  madhab: number;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country?: string;
    isoCountryCode?: string;
  } | null;
  hijriOffset: number;
  showBanglaCalendar: boolean;
  banglaOffset: number;
  manualLocation: {
    latitude: number;
    longitude: number;
    city: string;
    country?: string;
    isoCountryCode?: string;
  } | null;
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
      fajrStartAlert: true,
      fajrEndAlert: true,
      dhuhrStartAlert: true,
      dhuhrEndAlert: true,
      asrStartAlert: true,
      asrEndAlert: true,
      maghribStartAlert: true,
      maghribEndAlert: true,
      ishaStartAlert: true,
      ishaEndAlert: true,
      taskRemindersEnabled: true,
      quietHours: defaultQuietHours,
      calcMethod: 1, // Default to Karachi (UIS)
      madhab: 1, // Default to Hanafi
      location: null,
      hijriOffset: 0,
      showBanglaCalendar: false,
      banglaOffset: 0,
      manualLocation: null,
      showCuratedDuas: false,
      
      setPreferences: (partial) => {
        set(partial);
      },
      
      initialize: async () => {
        try {
          const mmkvVal = await zustandStorage.getItem('preferences-storage');
          if (mmkvVal) {
             const mmkvParsed = typeof mmkvVal === 'string' ? JSON.parse(mmkvVal) : mmkvVal;
             if (mmkvParsed && mmkvParsed.state && mmkvParsed.state.prayerStartAlerts !== undefined) {
               const s = mmkvParsed.state.prayerStartAlerts;
               const e = mmkvParsed.state.prayerEndAlerts;
               set({
                 fajrStartAlert: s, fajrEndAlert: e,
                 dhuhrStartAlert: s, dhuhrEndAlert: e,
                 asrStartAlert: s, asrEndAlert: e,
                 maghribStartAlert: s, maghribEndAlert: e,
                 ishaStartAlert: s, ishaEndAlert: e,
               });
             }
             
             // Migrate manualCity string to null since we now require manualLocation object
             if (mmkvParsed && mmkvParsed.state && mmkvParsed.state.manualCity !== undefined) {
               set({ manualLocation: null });
               // The old manualCity will be ignored by zustand persist automatically if not in initial state, 
               // but explicit clear helps.
             }
          }

          // Fallback migration from old AsyncStorage
          const val = await AsyncStorage.getItem('imansync_preferences');
          if (val && !mmkvVal) {
            const parsed = JSON.parse(val);
            if (parsed.prayerAlertsEnabled !== undefined && parsed.fajrStartAlert === undefined) {
              const pv = parsed.prayerAlertsEnabled;
              parsed.fajrStartAlert = pv; parsed.fajrEndAlert = pv;
              parsed.dhuhrStartAlert = pv; parsed.dhuhrEndAlert = pv;
              parsed.asrStartAlert = pv; parsed.asrEndAlert = pv;
              parsed.maghribStartAlert = pv; parsed.maghribEndAlert = pv;
              parsed.ishaStartAlert = pv; parsed.ishaEndAlert = pv;
              delete parsed.prayerAlertsEnabled;
            } else if (parsed.prayerStartAlerts !== undefined && parsed.fajrStartAlert === undefined) {
              const s = parsed.prayerStartAlerts;
              const e = parsed.prayerEndAlerts;
              parsed.fajrStartAlert = s; parsed.fajrEndAlert = e;
              parsed.dhuhrStartAlert = s; parsed.dhuhrEndAlert = e;
              parsed.asrStartAlert = s; parsed.asrEndAlert = e;
              parsed.maghribStartAlert = s; parsed.maghribEndAlert = e;
              parsed.ishaStartAlert = s; parsed.ishaEndAlert = e;
              delete parsed.prayerStartAlerts;
              delete parsed.prayerEndAlerts;
            }
            set({ ...parsed });
          } else if (!val && !mmkvVal) {
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

