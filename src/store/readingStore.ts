import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';

interface ReadingState {
  dailyGoalPages: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  historyLog: Record<string, number>; // "YYYY-MM-DD" -> pages read
  initialize: () => Promise<void>;
  addPagesRead: (pages: number) => void;
  setDailyGoal: (goal: number) => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  dailyGoalPages: 5,
  currentStreak: 0,
  longestStreak: 0,
  lastReadDate: null,
  historyLog: {},

  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_reading_store');
      if (val) {
        const parsed = JSON.parse(val);
        set(parsed);
      }
    } catch (e) {
      console.error('Failed to load reading store', e);
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

    // Check streak logic (only update streak if the goal was just hit, or if it's already hit)
    // Actually, streak counts days where goal was met.
    const wasGoalMetBefore = currentReadToday >= state.dailyGoalPages;
    const isGoalMetNow = newLog[today] >= state.dailyGoalPages;

    if (!wasGoalMetBefore && isGoalMetNow) {
      if (state.lastReadDate) {
        // Calculate days since last read
        const lastDate = new Date(state.lastReadDate);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Continuous
          newStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
        }
      } else {
        // First time
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

    const toSave = {
      dailyGoalPages: state.dailyGoalPages,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastReadDate: newLastRead || state.lastReadDate,
      historyLog: newLog,
    };
    AsyncStorage.setItem('imansync_reading_store', JSON.stringify(toSave)).catch(console.error);
  },

  setDailyGoal: (goal: number) => {
    set({ dailyGoalPages: goal });
    const state = get();
    const toSave = {
      dailyGoalPages: goal,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastReadDate: state.lastReadDate,
      historyLog: state.historyLog,
    };
    AsyncStorage.setItem('imansync_reading_store', JSON.stringify(toSave)).catch(console.error);
  }
}));
