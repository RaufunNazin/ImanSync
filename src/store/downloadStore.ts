import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface DownloadState {
  downloadedFiles: Record<string, string>; // key: `${reciterId}_${surahId}`, value: local file URI
  downloadProgress: Record<string, number>; // key: `${reciterId}_${surahId}`, value: 0-100 progress
  pausedDownloads: Record<string, boolean>; // key: `${reciterId}_${surahId}`, value: true if paused

  initialize: () => Promise<void>;
  getDownloadedUri: (reciterId: number, surahId: number) => string | null;
  downloadSurah: (reciterId: number, surahId: number) => Promise<void>;
  deleteSurah: (reciterId: number, surahId: number) => Promise<void>;
  pauseDownload: (reciterId: number, surahId: number) => Promise<void>;
  resumeDownload: (reciterId: number, surahId: number) => Promise<void>;
  cancelDownload: (reciterId: number, surahId: number) => Promise<void>;
}

const STORAGE_KEY = 'imansync_downloaded_audio';
const AUDIO_DIR = Platform.OS === 'web' ? '' : ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) + 'quran_audio';

// Module-level map to hold active DownloadResumable references (not serializable, so kept outside zustand)
const activeDownloads: Record<string, FileSystem.DownloadResumable> = {};

async function ensureDirExists() {
  if (Platform.OS === 'web') return;
  const info = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
}

// Helper to handle download completion for both initial download and resume
function handleDownloadResult(key: string, result: FileSystem.FileSystemDownloadResult | undefined, set: any) {
  if (result && result.uri) {
    delete activeDownloads[key];
    set((state: any) => {
      const newFiles = { ...state.downloadedFiles, [key]: result.uri };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles)).catch(console.error);

      const newProgress = { ...state.downloadProgress };
      delete newProgress[key];

      const newPaused = { ...state.pausedDownloads };
      delete newPaused[key];

      return { downloadedFiles: newFiles, downloadProgress: newProgress, pausedDownloads: newPaused };
    });
  }
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadedFiles: {},
  downloadProgress: {},
  pausedDownloads: {},

  initialize: async () => {
    if (Platform.OS === 'web') return;
    try {
      await ensureDirExists();
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Verify files actually exist on disk
        const verified: Record<string, string> = {};
        for (const key of Object.keys(parsed)) {
          const info = await FileSystem.getInfoAsync(parsed[key]);
          if (info.exists) {
            verified[key] = parsed[key];
          }
        }
        
        set({ downloadedFiles: verified });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
      }
    } catch (e) {
      console.error('Failed to initialize downloads', e);
    }
  },

  getDownloadedUri: (reciterId: number, surahId: number) => {
    return get().downloadedFiles[`${reciterId}_${surahId}`] || null;
  },

  downloadSurah: async (reciterId: number, surahId: number) => {
    if (Platform.OS === 'web') return;
    const key = `${reciterId}_${surahId}`;
    
    // Check if already downloading or downloaded
    if (get().downloadProgress[key] !== undefined || get().downloadedFiles[key]) return;

    try {
      // 1. Fetch the remote URL first
      set((state) => ({ downloadProgress: { ...state.downloadProgress, [key]: 0 } }));
      
      const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${reciterId}/${surahId}`);
      const json = await res.json();
      
      if (!json.audio_file || !json.audio_file.audio_url) {
        throw new Error('No audio URL found');
      }

      let url = json.audio_file.audio_url;
      if (url.startsWith('//')) {
        url = `https:${url}`;
      }

      // 2. Download the file
      await ensureDirExists();
      const localUri = AUDIO_DIR + `/reciter_${reciterId}_surah_${surahId}.mp3`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesExpectedToWrite > 0 ? 
            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100 : 0;
          
          const currentProgress = get().downloadProgress[key] || 0;
          // Throttle updates: only update if progress increased by >= 1% or finished
          if (progress - currentProgress >= 1 || progress === 100) {
            set((state) => ({ downloadProgress: { ...state.downloadProgress, [key]: progress } }));
          }
        }
      );

      // Store the reference so we can pause/resume/cancel later
      activeDownloads[key] = downloadResumable;

      const result = await downloadResumable.downloadAsync();
      handleDownloadResult(key, result, set);

    } catch (e) {
      console.error(`Failed to download surah ${surahId}`, e);
      delete activeDownloads[key];
      set((state) => {
        const newProgress = { ...state.downloadProgress };
        delete newProgress[key];
        const newPaused = { ...state.pausedDownloads };
        delete newPaused[key];
        return { downloadProgress: newProgress, pausedDownloads: newPaused };
      });
    }
  },

  pauseDownload: async (reciterId: number, surahId: number) => {
    const key = `${reciterId}_${surahId}`;
    const resumable = activeDownloads[key];
    if (!resumable) return;

    try {
      await resumable.pauseAsync();
      set((state) => ({ pausedDownloads: { ...state.pausedDownloads, [key]: true } }));
    } catch (e) {
      console.error(`Failed to pause download for surah ${surahId}`, e);
    }
  },

  resumeDownload: async (reciterId: number, surahId: number) => {
    const key = `${reciterId}_${surahId}`;
    const resumable = activeDownloads[key];
    if (!resumable) return;

    try {
      set((state) => ({ pausedDownloads: { ...state.pausedDownloads, [key]: false } }));
      const result = await resumable.resumeAsync();
      handleDownloadResult(key, result, set);
    } catch (e) {
      console.error(`Failed to resume download for surah ${surahId}`, e);
      delete activeDownloads[key];
      set((state) => {
        const newProgress = { ...state.downloadProgress };
        delete newProgress[key];
        const newPaused = { ...state.pausedDownloads };
        delete newPaused[key];
        return { downloadProgress: newProgress, pausedDownloads: newPaused };
      });
    }
  },

  cancelDownload: async (reciterId: number, surahId: number) => {
    const key = `${reciterId}_${surahId}`;
    const resumable = activeDownloads[key];

    if (resumable) {
      try {
        await resumable.cancelAsync();
      } catch (e) {
        // Ignore cancel errors
      }
    }

    // Clean up the partial file
    const localUri = AUDIO_DIR + `/reciter_${reciterId}_surah_${surahId}.mp3`;
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) {
        await FileSystem.deleteAsync(localUri);
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    delete activeDownloads[key];
    set((state) => {
      const newProgress = { ...state.downloadProgress };
      delete newProgress[key];
      const newPaused = { ...state.pausedDownloads };
      delete newPaused[key];
      return { downloadProgress: newProgress, pausedDownloads: newPaused };
    });
  },

  deleteSurah: async (reciterId: number, surahId: number) => {
    if (Platform.OS === 'web') return;
    const key = `${reciterId}_${surahId}`;
    const localUri = get().downloadedFiles[key];
    
    if (localUri) {
      try {
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists) {
          await FileSystem.deleteAsync(localUri);
        }
        
        set((state) => {
          const newFiles = { ...state.downloadedFiles };
          delete newFiles[key];
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFiles)).catch(console.error);
          return { downloadedFiles: newFiles };
        });
      } catch (e) {
        console.error(`Failed to delete surah ${surahId}`, e);
      }
    }
  }
}));
