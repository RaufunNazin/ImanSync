import { create } from 'zustand';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface JuzAyah {
  surahId: number;
  ayahNumber: number;
  surahName: string;
}

interface AudioState {
  sound: AudioPlayer | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentSurahId: number | null;
  currentSurahName: string | null;
  currentReciterId: number;
  playlist: number[]; // Queue of Surah IDs to play
  durationMillis: number;
  positionMillis: number;
  
  playbackMode: 'surah' | 'ayah' | 'juz';
  currentAyahNumber: number | null;
  ayahAudioList: { verse_key: string, url: string }[];
  audioRequestId: number;
  
  juzAyahs: JuzAyah[];
  currentJuzAyahIndex: number | null;
  hideGlobalBanner: boolean;

  // Actions
  setHideGlobalBanner: (hide: boolean) => void;
  setReciter: (id: number) => Promise<void>;
  playSurah: (surahId: number, surahName: string, autoPlay?: boolean) => Promise<void>;
  playAyah: (surahId: number, ayahNumber: number, surahName: string, autoPlayNext: boolean) => Promise<void>;
  playJuzAyahs: (ayahs: JuzAyah[], startIndex?: number) => Promise<void>;
  playJuz: (juzSurahs: number[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (millis: number) => Promise<void>;
  playNext: () => Promise<void>;
  _updatePlaybackStatus: (status: any) => void;
}

const RECITER_MALE_1 = 7; // Mishary


export const useAudioStore = create<AudioState>((set, get) => ({
  sound: null,
  isPlaying: false,
  isLoading: false,
  currentSurahId: null,
  currentSurahName: null,
  currentReciterId: RECITER_MALE_1,
  playlist: [],
  durationMillis: 0,
  positionMillis: 0,

  playbackMode: 'surah',
  currentAyahNumber: null,
  ayahAudioList: [],
  audioRequestId: 0,
  
  juzAyahs: [],
  currentJuzAyahIndex: null,
  hideGlobalBanner: false,

  setHideGlobalBanner: (hide: boolean) => set({ hideGlobalBanner: hide }),

  setReciter: async (id: number) => {
    set({ currentReciterId: id, ayahAudioList: [] });
    await AsyncStorage.setItem('imansync_quran_reciter', String(id));
    const { isPlaying, currentSurahId, currentSurahName, currentAyahNumber, playbackMode, playSurah, playAyah, playJuzAyahs, juzAyahs, currentJuzAyahIndex } = get();
    if (isPlaying && currentSurahId && currentSurahName) {
      if (playbackMode === 'juz' && juzAyahs.length > 0 && currentJuzAyahIndex !== null) {
        await playJuzAyahs(juzAyahs, currentJuzAyahIndex);
      } else if (playbackMode === 'ayah' && currentAyahNumber) {
        await playAyah(currentSurahId, currentAyahNumber, currentSurahName, true);
      } else {
        await playSurah(currentSurahId, currentSurahName, true);
      }
    }
  },

  playSurah: async (surahId: number, surahName: string, autoPlay: boolean = true) => {
    const { sound, currentReciterId, _updatePlaybackStatus, audioRequestId } = get();
    
    const reqId = audioRequestId + 1;
    set({ isLoading: true, currentSurahId: surahId, currentSurahName: surahName, playbackMode: 'surah', currentAyahNumber: null, audioRequestId: reqId });

    if (sound) {
      sound.pause();
      sound.removeListener('playbackStatusUpdate', _updatePlaybackStatus);
      set({ sound: null, isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }

    try {
      const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${currentReciterId}/${surahId}`);
      const json = await res.json();
      
      if (get().audioRequestId !== reqId) return;

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

        set({ sound: newSound });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to play Surah:", error);
      if (get().audioRequestId === reqId) set({ isLoading: false });
    }
  },

  playAyah: async (surahId: number, ayahNumber: number, surahName: string, _autoPlayNext: boolean) => {
    const { sound, currentReciterId, _updatePlaybackStatus, audioRequestId, currentSurahId, ayahAudioList } = get();
    
    const reqId = audioRequestId + 1;
    set({ isLoading: true, currentSurahId: surahId, currentSurahName: surahName, playbackMode: 'ayah', currentAyahNumber: ayahNumber, audioRequestId: reqId });

    if (sound) {
      sound.pause();
      sound.removeListener('playbackStatusUpdate', _updatePlaybackStatus);
      set({ sound: null, isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }

    try {
      let currentList = ayahAudioList;
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
        set({ sound: newSound });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to play Ayah:", error);
      if (get().audioRequestId === reqId) set({ isLoading: false });
    }
  },

  playJuzAyahs: async (ayahs: JuzAyah[], startIndex: number = 0) => {
    if (ayahs.length === 0 || startIndex >= ayahs.length) return;
    const current = ayahs[startIndex];
    
    set({ juzAyahs: ayahs, currentJuzAyahIndex: startIndex, playbackMode: 'juz', playlist: [] });
    
    const { sound, currentReciterId, _updatePlaybackStatus, audioRequestId, ayahAudioList, currentSurahId } = get();
    const reqId = audioRequestId + 1;
    set({ isLoading: true, currentSurahId: current.surahId, currentSurahName: current.surahName, currentAyahNumber: current.ayahNumber, audioRequestId: reqId });

    if (sound) {
      sound.pause();
      sound.removeListener('playbackStatusUpdate', _updatePlaybackStatus);
      set({ sound: null, isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }

    try {
      let currentList = ayahAudioList;
      if (current.surahId !== currentSurahId || currentList.length === 0) {
        const res = await fetch(`https://api.quran.com/api/v4/recitations/${currentReciterId}/by_chapter/${current.surahId}`);
        const json = await res.json();
        if (get().audioRequestId !== reqId) return;
        if (json.audio_files) {
          currentList = json.audio_files;
          set({ ayahAudioList: currentList });
        }
      }

      const ayahAudio = currentList.find(a => a.verse_key === `${current.surahId}:${current.ayahNumber}`);
      
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
        set({ sound: newSound });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to play Juz Ayah:", error);
      if (get().audioRequestId === reqId) set({ isLoading: false });
    }
  },

  playJuz: async (juzSurahs: number[]) => {
    if (juzSurahs.length === 0) return;
    const firstSurah = juzSurahs[0];
    const rest = juzSurahs.slice(1);
    set({ playlist: rest });
    await get().playSurah(firstSurah, "Surah " + firstSurah, true);
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
      set({ sound: null, isPlaying: false, currentSurahId: null, currentSurahName: null, currentAyahNumber: null, playlist: [], juzAyahs: [], currentJuzAyahIndex: null, positionMillis: 0, durationMillis: 0 });
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
      await playSurah(nextSurah, "Surah " + nextSurah, true);
    } else {
      await get().stop();
    }
  },

  _updatePlaybackStatus: (status: any) => {
    if (status.isLoaded) {
      set({ 
        positionMillis: status.currentTime * 1000, 
        durationMillis: status.duration ? status.duration * 1000 : 0,
        isPlaying: status.playing,
        isLoading: status.isBuffering
      });

      if (status.didJustFinish && !get().isLoading) {
        setTimeout(() => {
          const { playbackMode, currentSurahId, currentAyahNumber, ayahAudioList, juzAyahs, currentJuzAyahIndex } = get();
          
          if (playbackMode === 'juz' && currentJuzAyahIndex !== null) {
            const nextIndex = currentJuzAyahIndex + 1;
            if (nextIndex < juzAyahs.length) {
              get().playJuzAyahs(juzAyahs, nextIndex);
            } else {
              get().stop();
            }
          } else if (playbackMode === 'ayah' && currentSurahId && currentAyahNumber) {
            AsyncStorage.getItem('imansync_quran_settings').then(val => {
              let autoPlay = true;
              if (val) {
                try { autoPlay = JSON.parse(val).autoPlayNextAyah !== false; } catch (e) {}
              }
              if (autoPlay) {
                const nextAyahStr = `${currentSurahId}:${currentAyahNumber + 1}`;
                const hasNext = ayahAudioList.some(a => a.verse_key === nextAyahStr);
                if (hasNext) {
                  get().playAyah(currentSurahId, currentAyahNumber + 1, get().currentSurahName || "", true);
                } else {
                  get().stop();
                }
              } else {
                get().stop(); 
              }
            });
          } else {
            get().playNext();
          }
        }, 500);
      }
    } else if (status.error) {
      console.error(`Playback Error: ${status.error}`);
      set({ isPlaying: false, isLoading: false });
    } else {
      // It's still loading initially
      set({ isLoading: true });
    }
  }
}));

if (Platform.OS !== 'web') {
  AsyncStorage.getItem('imansync_quran_reciter').then((val) => {
    if (val) {
      useAudioStore.setState({ currentReciterId: parseInt(val, 10) });
    }
  });
}
