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
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = new Date();
          const oneYearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;
          const newHistory = { ...state.history };
          let pruned = false;
          
          for (const dateStr in newHistory) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
               const entryDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
               if (entryDate.getTime() < oneYearAgo) {
                 delete newHistory[dateStr];
                 pruned = true;
               }
            }
          }
          
          if (pruned) {
            state.setHistory(newHistory);
          }
        }
      },
    }
  )
);
