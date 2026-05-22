import { create } from 'zustand';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioState {
  sound: AudioPlayer | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentSurahId: number | null;
  currentReciterId: number;
  playlist: number[]; // Queue of Surah IDs to play
  durationMillis: number;
  positionMillis: number;
  
  // Actions
  setReciter: (id: number) => Promise<void>;
  playSurah: (surahId: number, autoPlay?: boolean) => Promise<void>;
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

  setReciter: async (id: number) => {
    set({ currentReciterId: id });
    await AsyncStorage.setItem('deen_quran_reciter', String(id));
    // If currently playing, we should restart the current surah with the new reciter
    const { isPlaying, currentSurahId, playSurah } = get();
    if (isPlaying && currentSurahId) {
      await playSurah(currentSurahId, true);
    }
  },

  playSurah: async (surahId: number, autoPlay: boolean = true) => {
    const { sound, currentReciterId, _updatePlaybackStatus } = get();
    
    set({ isLoading: true, currentSurahId: surahId });

    if (sound) {
      sound.remove();
      set({ sound: null, isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }

    try {
      // Fetch the chapter recitation audio URL
      const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${currentReciterId}/${surahId}`);
      const json = await res.json();
      
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
      set({ isLoading: false });
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
    const { sound } = get();
    if (sound) {
      sound.remove();
      set({ sound: null, isPlaying: false, currentSurahId: null, playlist: [], positionMillis: 0, durationMillis: 0 });
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

      if (status.didJustFinish) {
        get().playNext();
      }
    } else if (status.error) {
      console.error(`Playback Error: ${status.error}`);
      set({ isPlaying: false });
    }
  }
}));

// Initialize reciter on load
AsyncStorage.getItem('deen_quran_reciter').then((val) => {
  if (val) {
    useAudioStore.setState({ currentReciterId: parseInt(val, 10) });
  }
});
