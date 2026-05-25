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
  prayerAlertsEnabled: boolean;
  taskRemindersEnabled: boolean;
  quietHours: QuietHours;
  setPreferences: (partial: Partial<Omit<PreferencesState, 'setPreferences' | 'initialize'>>) => void;
  initialize: () => Promise<void>;
}

export const defaultQuietHours: QuietHours = {
  enabled: false,
  startHour: 23,
  startMinute: 0,
  endHour: 5,
  endMinute: 0,
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  notificationsEnabled: true,
  prayerAlertsEnabled: true,
  taskRemindersEnabled: true,
  quietHours: defaultQuietHours,
  
  setPreferences: (partial) => {
    set(partial);
    const state = get();
    const toSave = {
      notificationsEnabled: state.notificationsEnabled,
      prayerAlertsEnabled: state.prayerAlertsEnabled,
      taskRemindersEnabled: state.taskRemindersEnabled,
      quietHours: state.quietHours,
    };
    AsyncStorage.setItem('imansync_preferences', JSON.stringify(toSave));
  },
  
  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_preferences');
      if (val) {
        const parsed = JSON.parse(val);
        set({ ...parsed });
      }
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  }
}));
