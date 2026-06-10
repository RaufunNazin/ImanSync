import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { storage } from '@/store/mmkv';
import DuaService from '@/services/duaService';

// Constants for state tracking
const SYNC_STATE_KEY = 'preloader_sync_state';

interface SyncState {
  duaCategoriesDone: boolean;
  duaCategoryProgress: Record<string, boolean>; // Category ID -> boolean
  surahListDone: boolean;
  lastSurahDownloaded: number; // 0 to 114
}

const DEFAULT_SYNC_STATE: SyncState = {
  duaCategoriesDone: false,
  duaCategoryProgress: {},
  surahListDone: false,
  lastSurahDownloaded: 0,
};

export const usePreloaders = () => {
  const isRunning = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Load state
    const loadState = (): SyncState => {
      const saved = storage.getString(SYNC_STATE_KEY);
      return saved ? { ...DEFAULT_SYNC_STATE, ...JSON.parse(saved) } : { ...DEFAULT_SYNC_STATE };
    };

    const saveState = (state: SyncState) => {
      storage.set(SYNC_STATE_KEY, JSON.stringify(state));
    };

    const runQueue = async () => {
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        let state = loadState();

        // Pause if app goes to background
        const checkPause = () => {
          if (appState.current !== 'active') {
            throw new Error('PAUSED_BACKGROUND');
          }
        };

        // Delay starting by 5 seconds to not impact initial UI load
        await new Promise(res => setTimeout(res, 5000));
        checkPause();

        // ----------------------------------------------------
        // PHASE 1: High Priority (Lists)
        // ----------------------------------------------------
        
        // 1a. Dua Categories List
        if (!state.duaCategoriesDone) {
          await DuaService.getCategories(); // This automatically caches internally
          state.duaCategoriesDone = true;
          saveState(state);
          checkPause();
        }

        // 1b. Surah List
        if (!state.surahListDone) {
          const res = await fetch('https://api.alquran.cloud/v1/surah');
          const json = await res.json();
          if (json && json.data) {
            const formatted = json.data.map((item: any) => ({
              id: item.number,
              name: item.englishName,
              nameAr: item.name,
              verses: item.numberOfAyahs,
              type: item.revelationType,
            }));
            storage.set('quran_surahs_list', JSON.stringify(formatted));
            state.surahListDone = true;
            saveState(state);
            checkPause();
          }
        }

        // ----------------------------------------------------
        // PHASE 2: Medium Priority (Dua Content)
        // ----------------------------------------------------
        const categories = await DuaService.getCategories();
        if (categories && categories.length > 0) {
          for (const cat of categories) {
            checkPause();
            if (!state.duaCategoryProgress[cat.id]) {
              await DuaService.getDuasByCategory(cat.id); // Automatically caches
              state.duaCategoryProgress[cat.id] = true;
              saveState(state);
              // Small pause to prevent blocking JS thread entirely
              await new Promise(res => setTimeout(res, 300));
            }
          }
        }

        // ----------------------------------------------------
        // PHASE 3: Low Priority Heavyweight (Quran Text)
        // ----------------------------------------------------
        const editionsStr = 'quran-uthmani,en.asad,bn.bengali,en.transliteration';
        const cacheEditionsStr = 'quran-uthmani-en.asad-bn.bengali-en.transliteration';

        while (state.lastSurahDownloaded < 114) {
          checkPause();
          const targetSurah = state.lastSurahDownloaded + 1;
          const cacheKey = `quran_surah_${targetSurah}_${cacheEditionsStr}`;

          // Only fetch if not already cached
          if (!storage.getString(cacheKey)) {
            const res = await fetch(`https://api.alquran.cloud/v1/surah/${targetSurah}/editions/${editionsStr}`);
            const json = await res.json();
            
            if (json && json.data) {
              const arabicData = json.data.find((d: any) => d.edition.identifier === 'quran-uthmani');
              const englishData = json.data.find((d: any) => d.edition.identifier === 'en.asad');
              const banglaData = json.data.find((d: any) => d.edition.identifier === 'bn.bengali');
              const engTranslitData = json.data.find((d: any) => d.edition.identifier === 'en.transliteration');
              
              const name = englishData ? englishData.englishName : arabicData.englishName;
              
              const mergedAyahs = arabicData.ayahs.map((arAyah: any, index: number) => {
                let arabicText = arAyah.text;
                if (arAyah.numberInSurah === 1 && targetSurah !== 1 && targetSurah !== 9) {
                  arabicText = arabicText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ?/, "");
                }
                return {
                  numberInSurah: arAyah.numberInSurah,
                  arabic: arabicText,
                  english: englishData ? englishData.ayahs[index].text : undefined,
                  bangla: banglaData ? banglaData.ayahs[index].text : undefined,
                  englishTranslit: engTranslitData ? engTranslitData.ayahs[index].text : undefined,
                };
              });

              storage.set(cacheKey, JSON.stringify({ surahName: name, ayahs: mergedAyahs }));
            }
          }

          // Mark as done
          state.lastSurahDownloaded = targetSurah;
          saveState(state);
          
          // Tiny delay between heavy requests
          await new Promise(res => setTimeout(res, 800));
        }

      } catch (e: any) {
        if (e.message !== 'PAUSED_BACKGROUND') {
          console.error('Preloader error:', e);
        }
      } finally {
        isRunning.current = false;
      }
    };

    // App state listener to pause/resume
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
      if (nextAppState === 'active') {
        runQueue(); // Resume if active
      }
    });

    // Initial kickoff
    if (appState.current === 'active') {
      runQueue();
    }

    return () => {
      subscription.remove();
    };
  }, []);
};
