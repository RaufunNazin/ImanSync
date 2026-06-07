import { create } from 'zustand';
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

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],

  initialize: async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_dua_folders');
      if (val) {
        set({ folders: JSON.parse(val) });
      }
    } catch (e) {
      console.error('Failed to load dua folders', e);
    }
  },

  addFolder: (name: string) => {
    const newFolder = { id: Math.random().toString(36).substring(7), name };
    const newFolders = [...get().folders, newFolder];
    set({ folders: newFolders });
    AsyncStorage.setItem('imansync_dua_folders', JSON.stringify(newFolders)).catch(console.error);
  },

  updateFolder: (id: string, name: string) => {
    const newFolders = get().folders.map(f => f.id === id ? { ...f, name } : f);
    set({ folders: newFolders });
    AsyncStorage.setItem('imansync_dua_folders', JSON.stringify(newFolders)).catch(console.error);
  },

  deleteFolder: (id: string) => {
    const newFolders = get().folders.filter(f => f.id !== id);
    set({ folders: newFolders });
    AsyncStorage.setItem('imansync_dua_folders', JSON.stringify(newFolders)).catch(console.error);
  }
}));
