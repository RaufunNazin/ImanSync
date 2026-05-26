import { create } from 'zustand';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface AudioState {
  sound: AudioPlayer | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentSurahId: number | null;
  currentReciterId: number;
  playlist: number[]; // Queue of Surah IDs to play
  durationMillis: number;
  positionMillis: number;
  
  playbackMode: 'surah' | 'ayah';
  currentAyahNumber: number | null;
  ayahAudioList: { verse_key: string, url: string }[];
  audioRequestId: number;
  
  // Actions
  setReciter: (id: number) => Promise<void>;
  playSurah: (surahId: number, autoPlay?: boolean) => Promise<void>;
  playAyah: (surahId: number, ayahNumber: number, autoPlayNext: boolean) => Promise<void>;
  playJuz: (juzSurahs: number[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (millis: number) => Promise<void>;
  playNext: () => Promise<void>;
  _updatePlaybackStatus: (status: any) => void;
}

const RECITER_MALE_1 = 7; // Mishary
const RECITER_MALE_2 = 1; // AbdulBaset

export const useAudioStore = create<AudioState>((set, get) => ({
  sound: null,
  isPlaying: false,
  isLoading: false,
  currentSurahId: null,
  currentReciterId: RECITER_MALE_1,
  playlist: [],
  durationMillis: 0,
  positionMillis: 0,

  playbackMode: 'surah',
  currentAyahNumber: null,
  ayahAudioList: [],
  audioRequestId: 0,

  setReciter: async (id: number) => {
    set({ currentReciterId: id });
    await AsyncStorage.setItem('imansync_quran_reciter', String(id));
    // If currently playing, we should restart the current mode with the new reciter
    const { isPlaying, currentSurahId, currentAyahNumber, playbackMode, playSurah, playAyah } = get();
    if (isPlaying && currentSurahId) {
      if (playbackMode === 'ayah' && currentAyahNumber) {
        await playAyah(currentSurahId, currentAyahNumber, true);
      } else {
        await playSurah(currentSurahId, true);
      }
    }
  },

  playSurah: async (surahId: number, autoPlay: boolean = true) => {
    const { sound, currentReciterId, _updatePlaybackStatus, audioRequestId } = get();
    
    const reqId = audioRequestId + 1;
    set({ isLoading: true, currentSurahId: surahId, playbackMode: 'surah', currentAyahNumber: null, audioRequestId: reqId });

    if (sound) {
      sound.pause();
      sound.removeListener('playbackStatusUpdate', _updatePlaybackStatus);
      set({ sound: null, isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }

    try {
      const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${currentReciterId}/${surahId}`);
      const json = await res.json();
      
      if (get().audioRequestId !== reqId) return; // Prevent race condition

      if (json.audio_file && json.audio_file.audio_url) {
        let url = json.audio_file.audio_url;
        if (url.startsWith('//')) {
          url = `https:${url}`;
        }
        
        const newSound = createAudioPlayer(url);
        newSound.addListener('playbackStatusUpdate', _updatePlaybackStatus);
        
        if (autoPlay) {
          newSound.play();
        }

        set({ sound: newSound, isPlaying: autoPlay, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to play Surah:", error);
      if (get().audioRequestId === reqId) set({ isLoading: false });
    }
  },

  playAyah: async (surahId: number, ayahNumber: number, autoPlayNext: boolean) => {
    const { sound, currentReciterId, _updatePlaybackStatus, audioRequestId, currentSurahId, ayahAudioList } = get();
    
    const reqId = audioRequestId + 1;
    set({ isLoading: true, currentSurahId: surahId, playbackMode: 'ayah', currentAyahNumber: ayahNumber, audioRequestId: reqId });

    if (sound) {
      sound.pause();
      sound.removeListener('playbackStatusUpdate', _updatePlaybackStatus);
      set({ sound: null, isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }

    try {
      let currentList = ayahAudioList;
      // Fetch audio list if we switched surah or list is empty
      if (surahId !== currentSurahId || currentList.length === 0) {
        const res = await fetch(`https://api.quran.com/api/v4/recitations/${currentReciterId}/by_chapter/${surahId}`);
        const json = await res.json();
        if (get().audioRequestId !== reqId) return;
        if (json.audio_files) {
          currentList = json.audio_files;
          set({ ayahAudioList: currentList });
        }
      }

      const ayahAudio = currentList.find(a => a.verse_key === `${surahId}:${ayahNumber}`);
      
      if (ayahAudio && ayahAudio.url) {
        let url = ayahAudio.url;
        if (url.startsWith('//')) {
          url = `https:${url}`;
        } else if (!url.startsWith('http')) {
          url = `https://audio.qurancdn.com/${url}`;
        }
        
        const newSound = createAudioPlayer(url);
        newSound.addListener('playbackStatusUpdate', _updatePlaybackStatus);
        
        newSound.play();
        set({ sound: newSound, isPlaying: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to play Ayah:", error);
      if (get().audioRequestId === reqId) set({ isLoading: false });
    }
  },

  playJuz: async (juzSurahs: number[]) => {
    if (juzSurahs.length === 0) return;
    const firstSurah = juzSurahs[0];
    const rest = juzSurahs.slice(1);
    set({ playlist: rest });
    await get().playSurah(firstSurah, true);
  },

  pause: async () => {
    const { sound } = get();
    if (sound) {
      sound.pause();
      set({ isPlaying: false });
    }
  },

  resume: async () => {
    const { sound } = get();
    if (sound) {
      sound.play();
      set({ isPlaying: true });
    }
  },

  stop: async () => {
    const { sound, _updatePlaybackStatus } = get();
    if (sound) {
      sound.pause();
      sound.removeListener('playbackStatusUpdate', _updatePlaybackStatus);
      set({ sound: null, isPlaying: false, currentSurahId: null, currentAyahNumber: null, playlist: [], positionMillis: 0, durationMillis: 0 });
    }
  },

  seek: async (millis: number) => {
    const { sound } = get();
    if (sound) {
      await sound.seekTo(millis / 1000);
    }
  },

  playNext: async () => {
    const { playlist, playSurah } = get();
    if (playlist.length > 0) {
      const nextSurah = playlist[0];
      const rest = playlist.slice(1);
      set({ playlist: rest });
      await playSurah(nextSurah, true);
    } else {
      await get().stop();
    }
  },

  _updatePlaybackStatus: (status: any) => {
    if (status.isLoaded) {
      set({ 
        positionMillis: status.currentTime * 1000, 
        durationMillis: status.duration ? status.duration * 1000 : 0,
        isPlaying: status.playing
      });

      // Fix #4: guard against race condition — only call next when not
      // already loading, and wait 500ms so the store state is fully settled.
      if (status.didJustFinish && !get().isLoading) {
        setTimeout(() => {
          const { playbackMode, currentSurahId, currentAyahNumber, ayahAudioList } = get();
          if (playbackMode === 'ayah' && currentSurahId && currentAyahNumber) {
            // Auto-play logic relies on the UI component intercepting and calling it, 
            // OR we can do it here if we pass the autoPlay setting.
            // Wait, the store doesn't know about autoPlayNextAyah setting from UI!
            // We should use an event or fetch the setting from AsyncStorage here.
            AsyncStorage.getItem('imansync_quran_settings').then(val => {
              let autoPlay = true;
              if (val) {
                try { autoPlay = JSON.parse(val).autoPlayNextAyah !== false; } catch (e) {}
              }
              if (autoPlay) {
                // Check if next ayah exists
                const nextAyahStr = `${currentSurahId}:${currentAyahNumber + 1}`;
                const hasNext = ayahAudioList.some(a => a.verse_key === nextAyahStr);
                if (hasNext) {
                  get().playAyah(currentSurahId, currentAyahNumber + 1, true);
                } else {
                  get().stop();
                }
              } else {
                get().stop(); // if autoPlay is false, we just stop after this ayah.
              }
            });
          } else {
            get().playNext();
          }
        }, 500);
      }
    } else if (status.error) {
      console.error(`Playback Error: ${status.error}`);
      set({ isPlaying: false });
    }
  }
}));

// Initialize reciter on load
if (Platform.OS !== 'web') {
  AsyncStorage.getItem('imansync_quran_reciter').then((val) => {
    if (val) {
      useAudioStore.setState({ currentReciterId: parseInt(val, 10) });
    }
  });
}
