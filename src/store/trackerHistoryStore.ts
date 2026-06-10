import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TrackerHistoryState {
  history: Record<string, Record<string, boolean>>;
  isLoaded: boolean;
  toggleTask: (dateStr: string, taskId: string) => void;
  setHistory: (history: Record<string, Record<string, boolean>>) => void;
  initialize: () => Promise<void>;
}

export const useTrackerHistoryStore = create<TrackerHistoryState>()(
  persist(
    (set) => ({
      history: {},
      isLoaded: true,
      
      toggleTask: (dateStr: string, taskId: string) => {
        set((state) => {
          const todayData = state.history[dateStr] || {};
          const nextToday = { ...todayData, [taskId]: !todayData[taskId] };
          return { history: { ...state.history, [dateStr]: nextToday } };
        });
      },
      
      setHistory: (history) => {
        set({ history });
      },

      initialize: async () => {
        try {
          const val = await AsyncStorage.getItem('imansync_tracker_history');
          if (val) {
            const mmkvVal = zustandStorage.getItem('tracker-history-storage');
            if (!mmkvVal) {
              set({ history: JSON.parse(val), isLoaded: true });
            }
          }
        } catch (e) {
          console.error('Failed to load tracker history from async storage', e);
        }
      }
    }),
    {
      name: 'tracker-history-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
