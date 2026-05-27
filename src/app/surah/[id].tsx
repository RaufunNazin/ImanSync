import { Colors, Fonts, Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, Minus, Plus, Settings2, X, Play, Pause } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import { useAudioStore } from '@/store/audioStore';
import { useThemeStore } from '@/store/themeStore';

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
  arabicFontSize: 28,
  translationFontSize: 16,
  translitFontSize: 14,
  showEnglish: true,
  showBangla: true,
  showEnglishTranslit: false,
  autoPlayNextAyah: true,
};

export default function SurahScreen() {
  const { id, ayah } = useLocalSearchParams();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const { playSurah, playAyah, pause, resume, isPlaying, currentSurahId, currentAyahNumber, playbackMode, currentReciterId, setReciter, isLoading: isAudioLoading } = useAudioStore();

  const [surahName, setSurahName] = useState('Loading...');
  const surahNameRef = useRef('Loading...');
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<string, boolean>>({});

  const flatListRef = useRef<FlatList>(null);
  const isInitialScrollDone = useRef(false);

  // Load Settings and Bookmarks
  useEffect(() => {
    AsyncStorage.getItem('imansync_quran_settings').then(val => {
      if (val) {
        try { setSettings(prev => ({ ...prev, ...JSON.parse(val) })); } catch (e) { console.error('Corrupted quran settings', e); }
      }
    });
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

  const updateSetting = (key: keyof Settings, val: any) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      AsyncStorage.setItem('imansync_quran_settings', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    let editions = 'quran-uthmani';
    if (settings.showEnglish) editions += ',en.asad';
    if (settings.showBangla) editions += ',bn.bengali';
    if (settings.showEnglishTranslit) editions += ',en.transliteration';

    fetch(`https://api.alquran.cloud/v1/surah/${id}/editions/${editions}`)
      .then(res => res.json())
      .then(async json => {
        if (json.data) {
          const arabicData = json.data.find((d: any) => d.edition.identifier === 'quran-uthmani');
          const englishData = json.data.find((d: any) => d.edition.identifier === 'en.asad');
          const banglaData = json.data.find((d: any) => d.edition.identifier === 'bn.bengali');
          const engTranslitData = json.data.find((d: any) => d.edition.identifier === 'en.transliteration');
          
          const name = englishData ? englishData.englishName : arabicData.englishName;
          surahNameRef.current = name;
          setSurahName(name);

          const mergedAyahs = arabicData.ayahs.map((arAyah: any, index: number) => ({
            numberInSurah: arAyah.numberInSurah,
            arabic: arAyah.text,
            english: englishData ? englishData.ayahs[index].text : undefined,
            bangla: banglaData ? banglaData.ayahs[index].text : undefined,
            englishTranslit: engTranslitData ? engTranslitData.ayahs[index].text : undefined,
          }));
          
          setAyahs(mergedAyahs);
        }
      })
      .catch(err => console.error("Error fetching surah:", err))
      .finally(() => setLoading(false));
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
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
        <View 
          style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four }} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('quranSettings.title')}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Font Sizes */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('quranSettings.textSizes')}</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.arabicFont')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => updateSetting('arabicFontSize', Math.max(20, settings.arabicFontSize - 2))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.text }]}>{formatNumber(settings.arabicFontSize, i18n.language)}</Text>
                <TouchableOpacity onPress={() => updateSetting('arabicFontSize', Math.min(60, settings.arabicFontSize + 2))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.translationFont')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => updateSetting('translationFontSize', Math.max(12, settings.translationFontSize - 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.text }]}>{formatNumber(settings.translationFontSize, i18n.language)}</Text>
                <TouchableOpacity onPress={() => updateSetting('translationFontSize', Math.min(30, settings.translationFontSize + 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.translitFont')}</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => updateSetting('translitFontSize', Math.max(10, settings.translitFontSize - 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.text }]}>{formatNumber(settings.translitFontSize, i18n.language)}</Text>
                <TouchableOpacity onPress={() => updateSetting('translitFontSize', Math.min(24, settings.translitFontSize + 1))} style={[styles.stepBtn, { borderColor: colors.border }]}>
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Translations */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.translations')}</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.enTrans')}</Text>
              <Switch value={settings.showEnglish} onValueChange={(v) => updateSetting('showEnglish', v)} trackColor={{ false: colors.border, true: colors.highlight }} thumbColor="#FFFFFF" />
            </View>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.bnTrans')}</Text>
              <Switch value={settings.showBangla} onValueChange={(v) => updateSetting('showBangla', v)} trackColor={{ false: colors.border, true: colors.highlight }} thumbColor="#FFFFFF" />
            </View>

            {/* Transliterations */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.translit', { defaultValue: 'Transliteration' })}</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.enTranslit', { defaultValue: 'Show Transliteration' })}</Text>
              <Switch value={settings.showEnglishTranslit} onValueChange={(v) => updateSetting('showEnglishTranslit', v)} trackColor={{ false: colors.border, true: colors.highlight }} thumbColor="#FFFFFF" />
            </View>

            {/* Audio Reciter */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.reciter', { defaultValue: 'Audio Reciter' })}</Text>
            
            <View style={[styles.settingRow, { borderBottomColor: colors.border, marginBottom: Spacing.two }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.autoPlayNextAyah', { defaultValue: 'Auto-Play Next Ayah' })}</Text>
              <Switch value={settings.autoPlayNextAyah} onValueChange={(v) => updateSetting('autoPlayNextAyah', v)} trackColor={{ false: colors.border, true: colors.highlight }} thumbColor="#FFFFFF" />
            </View>
            <View style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12, paddingBottom: Spacing.four }}>
              <TouchableOpacity 
                style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, currentReciterId === 7 && { borderColor: colors.highlight, backgroundColor: colors.highlight + '15' }]} 
                onPress={() => setReciter(7)}
              >
                <Text style={[styles.settingLabel, { color: currentReciterId === 7 ? colors.highlight : colors.text }]}>Mishary Rashid Alafasy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }, currentReciterId === 1 && { borderColor: colors.highlight, backgroundColor: colors.highlight + '15' }]} 
                onPress={() => setReciter(1)}
              >
                <Text style={[styles.settingLabel, { color: currentReciterId === 1 ? colors.highlight : colors.text }]}>AbdulBaset AbdulSamad</Text>
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
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('surahNames.' + id, { defaultValue: surahName })}</Text>
          {!loading && ayahs.length > 0 && <Text style={{ color: colors.textSecondary, fontFamily: Fonts.outfit, fontSize: 12 }}>{t('surah.verses', { count: formatNumber(ayahs.length, i18n.language) })}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.three, alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => {
              if (currentSurahId === Number(id)) {
                isPlaying ? pause() : resume();
              } else {
                playSurah(Number(id));
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
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.backBtn}>
            <Settings2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.highlight} />
        </View>
      ) : (
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
            <BlurView intensity={30} tint={colors.glassTint as any} style={[styles.ayahCardWrapper, { borderColor: colors.border }]}>
              <View style={styles.ayahCard}>
                <View style={styles.ayahHeader}>
                  <View style={[styles.numberCircle, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(item.numberInSurah, i18n.language)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => {
                      if (currentSurahId === Number(id) && currentAyahNumber === item.numberInSurah && playbackMode === 'ayah') {
                        isPlaying ? pause() : resume();
                      } else {
                        playAyah(Number(id), item.numberInSurah, settings.autoPlayNextAyah);
                      }
                    }} style={{ padding: Spacing.one }}>
                      {isAudioLoading && currentSurahId === Number(id) && currentAyahNumber === item.numberInSurah && playbackMode === 'ayah' ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : isPlaying && currentSurahId === Number(id) && currentAyahNumber === item.numberInSurah && playbackMode === 'ayah' ? (
                        <Pause size={20} color={colors.accent} fill={colors.accent} />
                      ) : (
                        <Play size={20} color={colors.accent} fill={colors.accent} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleBookmark(item)} style={{ padding: Spacing.one }}>
                      <Bookmark 
                        size={20} 
                        color={colors.accent} 
                        fill={bookmarkedAyahs[item.numberInSurah] ? colors.accent : 'transparent'} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={[styles.arabicText, { color: colors.text, fontSize: settings.arabicFontSize, lineHeight: settings.arabicFontSize * 1.8 }]}>
                  {item.arabic}
                </Text>

                {settings.showEnglishTranslit && item.englishTranslit && (
                  <Text style={[styles.translitText, { color: colors.accent, fontSize: settings.translitFontSize, lineHeight: settings.translitFontSize * 1.5 }]}>
                    {item.englishTranslit}
                  </Text>
                )}

                {settings.showEnglish && item.english && (
                  <Text style={[styles.englishText, { color: colors.textSecondary, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>
                    {item.english}
                  </Text>
                )}

                {settings.showBangla && item.bangla && (
                  <Text style={[styles.banglaText, { color: colors.textSecondary, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>
                    {item.bangla}
                  </Text>
                )}
              </View>
            </BlurView>
          )}
        />
      )}

      {renderSettingsModal()}
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 2 },
  title: { fontFamily: Fonts.outfit, fontSize: 17 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.four, paddingTop: 0, gap: Spacing.four },
  
  contextCard: {
    padding: Spacing.four,
    borderRadius: 20,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  contextTitle: { fontFamily: Fonts.outfit, fontSize: 18, marginBottom: Spacing.two },
  contextText: { fontFamily: Fonts.outfit, fontSize: 14, lineHeight: 22 },

  ayahCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ayahCard: { padding: Spacing.five },
  ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.three },
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    marginBottom: Spacing.two,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)'
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
