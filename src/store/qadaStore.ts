import { create } from 'zustand';
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
  initialize: () => Promise<void>;
  updateQada: (type: QadaType, amount: number) => void;
}

export const useQadaStore = create<QadaState>((set, get) => ({
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0,
  fasts: 0,

  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_qada_store');
      if (val) {
        set(JSON.parse(val));
      }
    } catch (e) {
      console.error('Failed to load qada store', e);
    }
  },

  updateQada: (type: QadaType, amount: number) => {
    const current = get()[type];
    const nextValue = Math.max(0, current + amount); // Prevent negative
    set({ [type]: nextValue } as any);
    
    // Save to storage
    const state = get();
    const toSave = {
      fajr: state.fajr,
      dhuhr: state.dhuhr,
      asr: state.asr,
      maghrib: state.maghrib,
      isha: state.isha,
      witr: state.witr,
      fasts: state.fasts,
    };
    AsyncStorage.setItem('imansync_qada_store', JSON.stringify(toSave)).catch(console.error);
  }
}));
