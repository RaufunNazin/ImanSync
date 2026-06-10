import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useThemeColors, useThemeStyles } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, Minus, Plus, Settings2, X, Play, Pause, DownloadCloud, CheckCircle, Share2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import { useAudioStore } from '@/store/audioStore';
import { useDownloadStore } from '@/store/downloadStore';
import DownloadProgressRing from '@/components/DownloadProgressRing';
import ConfirmModal from '@/components/ConfirmModal';
import { fetchOnce } from '@/utils/fetchWithCache';
import { storage } from '@/store/mmkv';

interface Ayah {
  numberInSurah: number;
  arabic: string;
  english?: string;
  bangla?: string;
  englishTranslit?: string;
}

interface Settings {
  arabicFontSize: number;
  translationFontSize: number;
  translitFontSize: number;
  showEnglish: boolean;
  showBangla: boolean;
  showEnglishTranslit: boolean;
  autoPlayNextAyah: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  arabicFontSize: 20,
  translationFontSize: 16,
  translitFontSize: 16,
  showEnglish: true,
  showBangla: true,
  showEnglishTranslit: false,
  autoPlayNextAyah: true,
};

export default function SurahScreen() {
  const { id, ayah } = useLocalSearchParams();
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();
  const isDark = colors.background === '#0c1618';
  const activeQuranColor = isDark ? colors.accent : colors.highlight;
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const { playSurah, playAyah, pause, resume, isPlaying, currentSurahId, currentAyahNumber, playbackMode, currentReciterId, setReciter, isLoading: isAudioLoading } = useAudioStore();
  const downloadStore = useDownloadStore();

  const [settings, setSettings] = useState<Settings>(() => {
    let initialSettings = {
      ...DEFAULT_SETTINGS,
      showBangla: i18n.language === 'bn',
      showEnglish: i18n.language === 'en',
      showEnglishTranslit: i18n.language === 'en',
    };
    const saved = storage.getString('imansync_quran_settings_sync');
    if (saved) {
      try { initialSettings = { ...initialSettings, ...JSON.parse(saved) }; } catch (e) {}
    }
    return initialSettings;
  });

  const getEditionsString = (s: Settings) => {
    let editions = 'quran-uthmani';
    if (s.showEnglish) editions += ',en.asad';
    if (s.showBangla) editions += ',bn.bengali';
    if (s.showEnglishTranslit) editions += ',en.transliteration';
    return editions;
  };

  const [surahName, setSurahName] = useState(() => {
    if (!id) return 'Loading...';
    const cacheKey = `quran_surah_${id}_${getEditionsString(settings)}`;
    const cached = storage.getString(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.surahName || 'Loading...';
    }
    return 'Loading...';
  });

  const surahNameRef = useRef(surahName);

  const [ayahs, setAyahs] = useState<Ayah[]>(() => {
    if (!id) return [];
    const cacheKey = `quran_surah_${id}_${getEditionsString(settings)}`;
    const cached = storage.getString(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.ayahs || [];
    }
    return [];
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<string, boolean>>({});
  const [deleteDownloadConfirm, setDeleteDownloadConfirm] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const isInitialScrollDone = useRef(false);

  // Load Settings and Bookmarks
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem('imansync_quran_bookmarks');
      if (stored) {
        const parsed = JSON.parse(stored);
        const map: Record<string, boolean> = {};
        parsed.forEach((b: any) => {
          if (b.surahId === id) map[b.numberInSurah] = true;
        });
        setBookmarkedAyahs(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBookmark = async (ayahItem: Ayah) => {
    try {
      const stored = await AsyncStorage.getItem('imansync_quran_bookmarks');
      let bookmarks = stored ? JSON.parse(stored) : [];
      
      const existsIndex = bookmarks.findIndex((b: any) => b.surahId === id && b.numberInSurah === ayahItem.numberInSurah);
      
      if (existsIndex >= 0) {
        bookmarks.splice(existsIndex, 1);
        setBookmarkedAyahs(prev => ({ ...prev, [ayahItem.numberInSurah]: false }));
      } else {
        bookmarks.push({
          surahId: id,
          surahName: surahName,
          numberInSurah: ayahItem.numberInSurah,
          arabic: ayahItem.arabic,
          translation: ayahItem.english || '',
        });
        setBookmarkedAyahs(prev => ({ ...prev, [ayahItem.numberInSurah]: true }));
      }
      
      await AsyncStorage.setItem('imansync_quran_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error(e);
    }
  };

  const shareAyah = async (ayahItem: Ayah) => {
    try {
      const parts = [
        `${t('surahNames.' + id, { defaultValue: surahName })} (${formatNumber(id as string, i18n.language)}:${formatNumber(ayahItem.numberInSurah, i18n.language)})`,
        ayahItem.arabic,
      ];
      
      if (settings.showEnglishTranslit && ayahItem.englishTranslit) {
        parts.push(ayahItem.englishTranslit);
      }
      if (settings.showBangla && ayahItem.bangla) {
        parts.push(ayahItem.bangla);
      }
      if (settings.showEnglish && ayahItem.english) {
        parts.push(ayahItem.english);
      }
      
      parts.push(`Shared via ImanSync`);
      
      await Share.share({
        message: parts.join('\n\n'),
      });
    } catch (e) {
      console.error('Error sharing ayah:', e);
    }
  };

  const updateSetting = (key: keyof Settings, val: any) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      storage.set('imansync_quran_settings_sync', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    
    const editions = getEditionsString(settings);
    const cacheKey = `quran_surah_${id}_${editions}`;

    fetchOnce({
      key: cacheKey,
      onStart: () => {
      },
      fetcher: async () => {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${id}/editions/${editions}`);
        const json = await res.json();
        if (json.data) {
          const arabicData = json.data.find((d: any) => d.edition.identifier === 'quran-uthmani');
          const englishData = json.data.find((d: any) => d.edition.identifier === 'en.asad');
          const banglaData = json.data.find((d: any) => d.edition.identifier === 'bn.bengali');
          const engTranslitData = json.data.find((d: any) => d.edition.identifier === 'en.transliteration');
          
          const name = englishData ? englishData.englishName : arabicData.englishName;
          
          const mergedAyahs = arabicData.ayahs.map((arAyah: any, index: number) => {
            let arabicText = arAyah.text;
            if (arAyah.numberInSurah === 1 && Number(id) !== 1 && Number(id) !== 9) {
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

          return { surahName: name, ayahs: mergedAyahs };
        }
        return { surahName: 'Unknown', ayahs: [] };
      },
      onData: (data) => {
        if (data) {
          surahNameRef.current = data.surahName;
          setSurahName(data.surahName);
          setAyahs(data.ayahs);
        }
      },
      onError: (err) => {
        console.error("Error fetching surah:", err);
      }
    });
  }, [id, settings.showEnglish, settings.showBangla, settings.showEnglishTranslit]);

  // Scroll to targeted Ayah if provided
  useEffect(() => {
    if (ayahs.length > 0 && ayah && !isInitialScrollDone.current) {
      const index = ayahs.findIndex(a => a.numberInSurah === Number(ayah));
      if (index >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
          isInitialScrollDone.current = true;
        }, 300);
      }
    }
  }, [ayahs, ayah]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const topItem = viewableItems[0].item;
      // Skip context block which might not have numberInSurah
      if (topItem && topItem.numberInSurah) {
        AsyncStorage.setItem('last_read_surah', JSON.stringify({
          id,
          name: surahNameRef.current,
          ayah: topItem.numberInSurah
        })).catch(e => console.log(e));
      }
    }
  }).current;

  const onScrollToIndexFailed = (info: any) => {
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    });
  };

  const renderContextBlock = () => {
    return null;
  };

  const renderSettingsModal = () => (
    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
        <View 
          style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.textSecondary + '20' }]}
        >
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four }} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('quranSettings.title')}</Text>
            <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Font Sizes */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('quranSettings.textSizes')}</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.arabicFont')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity activeOpacity={1} onPress={() => updateSetting('arabicFontSize', Math.max(20, settings.arabicFontSize - 2))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.text }]}>{formatNumber(settings.arabicFontSize, i18n.language)}</Text>
                <TouchableOpacity activeOpacity={1} onPress={() => updateSetting('arabicFontSize', Math.min(60, settings.arabicFontSize + 2))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.translationFont')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity activeOpacity={1} onPress={() => updateSetting('translationFontSize', Math.max(12, settings.translationFontSize - 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.text }]}>{formatNumber(settings.translationFontSize, i18n.language)}</Text>
                <TouchableOpacity activeOpacity={1} onPress={() => updateSetting('translationFontSize', Math.min(30, settings.translationFontSize + 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.translitFont')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity activeOpacity={1} onPress={() => updateSetting('translitFontSize', Math.max(10, settings.translitFontSize - 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.text }]}>{formatNumber(settings.translitFontSize, i18n.language)}</Text>
                <TouchableOpacity activeOpacity={1} onPress={() => updateSetting('translitFontSize', Math.min(24, settings.translitFontSize + 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Translations */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.translations')}</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.enTrans')}</Text>
              <Switch value={settings.showEnglish} onValueChange={(v) => updateSetting('showEnglish', v)} trackColor={{ false: colors.border, true: activeQuranColor }} thumbColor="#FFFFFF" />
            </View>
            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.bnTrans')}</Text>
              <Switch value={settings.showBangla} onValueChange={(v) => updateSetting('showBangla', v)} trackColor={{ false: colors.border, true: activeQuranColor }} thumbColor="#FFFFFF" />
            </View>

            {/* Transliterations */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.translit', { defaultValue: 'Transliteration' })}</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20' }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.enTranslit', { defaultValue: 'Show Transliteration' })}</Text>
              <Switch value={settings.showEnglishTranslit} onValueChange={(v) => updateSetting('showEnglishTranslit', v)} trackColor={{ false: colors.border, true: activeQuranColor }} thumbColor="#FFFFFF" />
            </View>

            {/* Audio Reciter */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.reciter', { defaultValue: 'Audio Reciter' })}</Text>
            
            <View style={[styles.settingRow, { borderBottomColor: colors.textSecondary + '20', marginBottom: Spacing.two }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.autoPlayNextAyah', { defaultValue: 'Auto-Play Next Ayah' })}</Text>
              <Switch value={settings.autoPlayNextAyah} onValueChange={(v) => updateSetting('autoPlayNextAyah', v)} trackColor={{ false: colors.border, true: activeQuranColor }} thumbColor="#FFFFFF" />
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12, paddingBottom: Spacing.four }}>
              <TouchableOpacity activeOpacity={1} 
                style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, currentReciterId === 7 ? { borderColor: activeQuranColor, backgroundColor: activeQuranColor + '15' } : { backgroundColor: colors.backgroundElement, ...themeStyles.cardShadow }]} 
                onPress={() => setReciter(7)}
              >
                <Text style={[styles.settingLabel, { color: currentReciterId === 7 ? activeQuranColor : colors.text }]}>{t("quran.reciters.mishary")}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1} 
                style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, currentReciterId === 1 ? { borderColor: activeQuranColor, backgroundColor: activeQuranColor + '15' } : { backgroundColor: colors.backgroundElement, ...themeStyles.cardShadow }]} 
                onPress={() => setReciter(1)}
              >
                <Text style={[styles.settingLabel, { color: currentReciterId === 1 ? activeQuranColor : colors.text }]}>{t("quran.reciters.abdulBaset")}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1} 
                style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, currentReciterId === 3 ? { borderColor: activeQuranColor, backgroundColor: activeQuranColor + '15' } : { backgroundColor: colors.backgroundElement, ...themeStyles.cardShadow }]} 
                onPress={() => setReciter(3)}
              >
                <Text style={[styles.settingLabel, { color: currentReciterId === 3 ? activeQuranColor : colors.text }]}>{t("quran.reciters.sudais")}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/quran');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={1} onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('surahNames.' + id, { defaultValue: surahName })}</Text>
          {ayahs.length > 0 && <Text style={{ color: colors.textSecondary, fontFamily: Fonts.outfit, fontSize: 12 }}>{t('surah.verses', { count: formatNumber(ayahs.length, i18n.language) })}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
          <TouchableOpacity activeOpacity={1} 
            onPress={() => {
              if (currentSurahId === Number(id)) {
                isPlaying ? pause() : resume();
              } else {
                playSurah(Number(id), surahName);
              }
            }} 
            style={styles.backBtn}
          >
            {isAudioLoading && currentSurahId === Number(id) ? (
              <ActivityIndicator size="small" color={colors.highlight} />
            ) : isPlaying && currentSurahId === Number(id) ? (
              <Pause size={20} color={colors.highlight} fill={colors.highlight} />
            ) : (
              <Play size={20} color={colors.highlight} fill={colors.highlight} />
            )}
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} 
            onPress={() => {
              const reciterId = currentReciterId;
              const surahId = Number(id);
              const key = `${reciterId}_${surahId}`;
              const isDownloaded = downloadStore.downloadedFiles[key];
              const progress = downloadStore.downloadProgress[key];
              
              if (isDownloaded) {
                setDeleteDownloadConfirm(true);
              } else if (progress === undefined) {
                downloadStore.downloadSurah(reciterId, surahId);
              }
            }}
            style={styles.backBtn}
          >
            {downloadStore.downloadedFiles[`${currentReciterId}_${id}`] ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={18} color={colors.highlight} />
              </View>
            ) : downloadStore.downloadProgress[`${currentReciterId}_${id}`] !== undefined ? (
              <DownloadProgressRing
                size={22}
                progress={downloadStore.downloadProgress[`${currentReciterId}_${id}`]}
                color={activeQuranColor}
                trackColor={colors.textSecondary + '30'}
                label={formatNumber(Math.round(downloadStore.downloadProgress[`${currentReciterId}_${id}`]), i18n.language)}
              />
            ) : (
              <DownloadCloud size={20} color={colors.textSecondary} opacity={0.6} />
            )}
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} onPress={() => setModalVisible(true)} style={styles.backBtn}>
            <Settings2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      

        <FlatList
          ref={flatListRef}
          data={ayahs}
          keyExtractor={(item) => String(item.numberInSurah)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderContextBlock}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={onScrollToIndexFailed}
          renderItem={({ item }) => (
            <ThemeCard intensity={30}  style={[styles.ayahCardWrapper, { borderColor: colors.border }]}>
              <View style={styles.ayahCard}>
                <View style={styles.ayahHeader}>
                  <View style={[styles.numberCircle, { borderColor: colors.textSecondary + '20', backgroundColor: colors.textSecondary + '15' }]}>
                    <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(item.numberInSurah, i18n.language)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                    <TouchableOpacity activeOpacity={1} onPress={() => shareAyah(item)} style={{ padding: Spacing.one }}>
                      <Share2 
                        size={20} 
                        color={colors.textSecondary} 
                        opacity={0.6}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={1} onPress={() => {
                      if (currentSurahId === Number(id) && currentAyahNumber === item.numberInSurah && playbackMode === 'ayah') {
                        isPlaying ? pause() : resume();
                      } else {
                        playAyah(Number(id), item.numberInSurah, surahName, settings.autoPlayNextAyah);
                      }
                    }} style={{ padding: Spacing.one }}>
                      {isAudioLoading && currentSurahId === Number(id) && currentAyahNumber === item.numberInSurah && playbackMode === 'ayah' ? (
                        <ActivityIndicator size="small" color={activeQuranColor} />
                      ) : isPlaying && currentSurahId === Number(id) && currentAyahNumber === item.numberInSurah && playbackMode === 'ayah' ? (
                        <Pause size={20} color={activeQuranColor} fill={activeQuranColor} />
                      ) : (
                        <Play size={20} color={activeQuranColor} fill={activeQuranColor} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={1} onPress={() => toggleBookmark(item)} style={{ padding: Spacing.one }}>
                      <Bookmark 
                        size={20} 
                        color={activeQuranColor} 
                        fill={bookmarkedAyahs[item.numberInSurah] ? activeQuranColor : 'transparent'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={[styles.arabicText, { color: colors.text, fontSize: settings.arabicFontSize, lineHeight: settings.arabicFontSize * 1.8 }]}>
                  {item.arabic}
                </Text>

                {settings.showEnglishTranslit && item.englishTranslit && (
                  <Text style={[styles.translitText, { color: colors.textSecondary, fontSize: settings.translitFontSize, lineHeight: settings.translitFontSize * 1.5 }]}>
                    {item.englishTranslit}
                  </Text>
                )}

                {settings.showBangla && item.bangla && (
                  <Text style={[styles.banglaText, { color: colors.textSecondary, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>
                    {item.bangla}
                  </Text>
                )}

                {settings.showEnglish && item.english && (
                  <Text style={[styles.englishText, { color: colors.textSecondary, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>
                    {item.english}
                  </Text>
                )}
              </View>
            </ThemeCard>
          )}
        />

      {renderSettingsModal()}
      <ConfirmModal
        visible={deleteDownloadConfirm}
        title={t('quran.deleteDownloadTitle', { defaultValue: 'Delete Audio' })}
        message={t('quran.deleteDownloadMessage', { defaultValue: 'Remove this downloaded surah audio from your device?' })}
        confirmText={t('quran.deleteDownloadConfirm', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        onConfirm={() => { setDeleteDownloadConfirm(false); downloadStore.deleteSurah(currentReciterId, Number(id)); }}
        onCancel={() => setDeleteDownloadConfirm(false)}
        colors={colors}
        confirmColor={colors.error}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    height: 51,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 2 },
  title: { fontFamily: Fonts.outfit, fontSize: 14 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.four, gap: Spacing.four },
  
  contextCard: {
    padding: Spacing.four,
    borderRadius: 20,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  contextTitle: { fontFamily: Fonts.outfit, fontSize: 18, marginBottom: Spacing.two },
  contextText: { fontFamily: Fonts.outfit, fontSize: 14, lineHeight: 22 },

  ayahCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  ayahCard: { padding: Spacing.five },
  ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  numberCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  numberText: { fontFamily: Fonts.outfit, fontSize: 11 },
  
  arabicText: {
    fontFamily: Fonts.arabic,
    textAlign: 'right',
    marginBottom: Spacing.four,
  },
  englishText: { fontFamily: Fonts.outfit, marginTop: Spacing.two },
  banglaText: { fontFamily: Fonts.outfit, marginTop: Spacing.two },
  translitText: { fontFamily: Fonts.outfit, fontStyle: 'italic', marginTop: Spacing.two },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.five,
    maxHeight: '80%',
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  modalTitle: { fontFamily: Fonts.outfit, fontSize: 24 },
  closeBtn: { padding: Spacing.two },
  
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
    height: 15,
    marginBottom: Spacing.two,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: { fontFamily: Fonts.outfit, fontSize: 16 },
  settingSub: { fontFamily: Fonts.outfit, fontSize: 12, marginTop: 2 },
  
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { fontFamily: Fonts.outfit, fontSize: 16, minWidth: 24, textAlign: 'center' }
});
