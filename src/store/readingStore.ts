import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';

interface ReadingState {
  dailyGoalPages: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  historyLog: Record<string, number>; // "YYYY-MM-DD" -> pages read
  notesLog: Record<string, string>; // "YYYY-MM-DD" -> note
  initialize: () => Promise<void>;
  addPagesRead: (pages: number) => void;
  setDailyGoal: (goal: number) => void;
  setNote: (date: string, note: string) => void;
  setHistoryAndNotes: (h: Record<string, number>, n: Record<string, string>) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      dailyGoalPages: 3,
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,
      historyLog: {},
      notesLog: {},

      initialize: async () => {
        try {
          const val = await AsyncStorage.getItem('imansync_reading_store');
          if (val) {
            const mmkvVal = zustandStorage.getItem('reading-storage');
            if (!mmkvVal) {
              set({ ...JSON.parse(val) });
            }
          }
        } catch (e) {
          console.error('Failed to load reading store from async storage', e);
        }
      },

      addPagesRead: (pages: number) => {
        const today = getLocalYYYYMMDD();
        const state = get();
        const newLog = { ...state.historyLog };
        
        // Add pages
        const currentReadToday = newLog[today] || 0;
        newLog[today] = currentReadToday + pages;

        let newStreak = state.currentStreak;
        let newLastRead = state.lastReadDate;
        let newLongest = state.longestStreak;

        const wasGoalMetBefore = currentReadToday >= state.dailyGoalPages;
        const isGoalMetNow = newLog[today] >= state.dailyGoalPages;

        if (!wasGoalMetBefore && isGoalMetNow) {
          if (state.lastReadDate) {
            const lastDate = new Date(state.lastReadDate);
            const todayDate = new Date(today);
            const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              newStreak += 1;
            } else if (diffDays > 1) {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }
          newLastRead = today;
          if (newStreak > newLongest) {
            newLongest = newStreak;
          }
        }

        set({
          historyLog: newLog,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastReadDate: newLastRead || state.lastReadDate,
        });
      },

      setDailyGoal: (goal: number) => {
        set({ dailyGoalPages: goal });
      },

      setNote: (date: string, note: string) => {
        const state = get();
        set({ notesLog: { ...state.notesLog, [date]: note } });
      },
      
      setHistoryAndNotes: (h, n) => {
        set({ historyLog: h, notesLog: n });
      }
    }),
    {
      name: 'reading-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const now = new Date();
          const oneYearAgo = now.getTime() - 365 * 24 * 60 * 60 * 1000;
          let pruned = false;
          const newHistory = { ...state.historyLog };
          const newNotes = { ...state.notesLog };
          
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
          
          for (const dateStr in newNotes) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
               const entryDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
               if (entryDate.getTime() < oneYearAgo) {
                 delete newNotes[dateStr];
                 pruned = true;
               }
            }
          }
          
          if (pruned) {
            state.setHistoryAndNotes(newHistory, newNotes);
          }
        }
      }
    }
  )
);
