import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DuaFolder {
  id: string;
  name: string;
}

interface FolderState {
  folders: DuaFolder[];
  initialize: () => Promise<void>;
  addFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
      folders: [],

      initialize: async () => {
        try {
          const val = await AsyncStorage.getItem('imansync_dua_folders');
          if (val) {
            const mmkvVal = zustandStorage.getItem('folder-storage');
            if (!mmkvVal) {
              set({ folders: JSON.parse(val) });
            }
          }
        } catch (e) {
          console.error('Failed to load dua folders from async storage', e);
        }
      },

      addFolder: (name: string) => {
        const newFolder = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name };
        set({ folders: [...get().folders, newFolder] });
      },

      updateFolder: (id: string, name: string) => {
        set({ folders: get().folders.map(f => f.id === id ? { ...f, name } : f) });
      },

      deleteFolder: (id: string) => {
        set({ folders: get().folders.filter(f => f.id !== id) });
      }
    }),
    {
      name: 'folder-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
