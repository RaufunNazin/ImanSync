import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type QadaType = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr' | 'fasts';

interface QadaState {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
  fasts: number;
  isLoaded: boolean;
  initialize: () => Promise<void>;
  updateQada: (type: QadaType, amount: number) => void;
}

export const useQadaStore = create<QadaState>()(
  persist(
    (set, get) => ({
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      witr: 0,
      fasts: 0,
      isLoaded: true, // MMKV is synchronous so we can say it's loaded

      initialize: async () => {
        try {
          const val = await AsyncStorage.getItem('imansync_qada_store');
          if (val) {
            const mmkvVal = zustandStorage.getItem('qada-storage');
            if (!mmkvVal) {
              const parsed = JSON.parse(val);
              const sanitized: Partial<QadaState> = {};
              const types: QadaType[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr', 'fasts'];
              for (const type of types) {
                if (typeof parsed[type] === 'number') {
                  sanitized[type] = Math.max(0, parsed[type]);
                }
              }
              set({ ...sanitized, isLoaded: true });
            }
          }
        } catch (e) {
          console.error('Failed to load qada store from async storage', e);
        }
      },

      updateQada: (type: QadaType, amount: number) => {
        const current = get()[type];
        const nextValue = Math.max(0, current + amount); // Prevent negative
        set({ [type]: nextValue } as any);
      }
    }),
    {
      name: 'qada-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

