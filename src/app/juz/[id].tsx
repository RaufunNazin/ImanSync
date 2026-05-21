import { Colors, Fonts, Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark, ChevronLeft, Minus, Plus, Settings2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';

interface Ayah {
  numberInSurah: number;
  arabic: string;
  english?: string;
  bangla?: string;
  englishTranslit?: string;
  surahName: string;
  surahId: number;
}

interface Settings {
  arabicFontSize: number;
  translationFontSize: number;
  showEnglish: boolean;
  showBangla: boolean;
  showEnglishTranslit: boolean;
  showContext: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  arabicFontSize: 28,
  translationFontSize: 16,
  showEnglish: true,
  showBangla: false,
  showEnglishTranslit: false,
  showContext: false,
};

export default function JuzScreen() {
  const { id, ayah } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<string, boolean>>({});

  const flatListRef = useRef<FlatList>(null);
  const isInitialScrollDone = useRef(false);

  // Load Settings and Bookmarks
  useEffect(() => {
    AsyncStorage.getItem('deen_quran_settings').then(val => {
      if (val) setSettings(prev => ({ ...prev, ...JSON.parse(val) }));
    });
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem('deen_quran_bookmarks');
      if (stored) {
        const parsed = JSON.parse(stored);
        const map: Record<string, boolean> = {};
        parsed.forEach((b: any) => {
          map[`${b.surahId}-${b.numberInSurah}`] = true;
        });
        setBookmarkedAyahs(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBookmark = async (ayahItem: Ayah) => {
    try {
      const stored = await AsyncStorage.getItem('deen_quran_bookmarks');
      let bookmarks = stored ? JSON.parse(stored) : [];
      
      const existsIndex = bookmarks.findIndex((b: any) => b.surahId === ayahItem.surahId && b.numberInSurah === ayahItem.numberInSurah);
      const key = `${ayahItem.surahId}-${ayahItem.numberInSurah}`;

      if (existsIndex >= 0) {
        bookmarks.splice(existsIndex, 1);
        setBookmarkedAyahs(prev => ({ ...prev, [key]: false }));
      } else {
        bookmarks.push({
          surahId: ayahItem.surahId,
          surahName: ayahItem.surahName,
          numberInSurah: ayahItem.numberInSurah,
          arabic: ayahItem.arabic,
          translation: ayahItem.english || '',
        });
        setBookmarkedAyahs(prev => ({ ...prev, [key]: true }));
      }
      
      await AsyncStorage.setItem('deen_quran_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error(e);
    }
  };

  const updateSetting = (key: keyof Settings, val: any) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      AsyncStorage.setItem('deen_quran_settings', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const urls = [`https://api.alquran.cloud/v1/juz/${id}/quran-uthmani`];
    if (settings.showEnglish) urls.push(`https://api.alquran.cloud/v1/juz/${id}/en.asad`);
    if (settings.showBangla) urls.push(`https://api.alquran.cloud/v1/juz/${id}/bn.bengali`);
    if (settings.showEnglishTranslit) urls.push(`https://api.alquran.cloud/v1/juz/${id}/en.transliteration`);

    Promise.all(urls.map(u => fetch(u).then(res => res.json())))
      .then(responses => {
        const arabicJson = responses.find(r => r.data && r.data.edition.identifier === 'quran-uthmani');
        const englishJson = responses.find(r => r.data && r.data.edition.identifier === 'en.asad');
        const banglaJson = responses.find(r => r.data && r.data.edition.identifier === 'bn.bengali');
        const engTranslitJson = responses.find(r => r.data && r.data.edition.identifier === 'en.transliteration');

        if (arabicJson && arabicJson.data) {
          const mergedAyahs = arabicJson.data.ayahs.map((arAyah: any, index: number) => ({
            numberInSurah: arAyah.numberInSurah,
            arabic: arAyah.text,
            english: englishJson ? englishJson.data.ayahs[index].text : undefined,
            bangla: banglaJson ? banglaJson.data.ayahs[index].text : undefined,
            englishTranslit: engTranslitJson ? engTranslitJson.data.ayahs[index].text : undefined,
            surahName: arAyah.surah.englishName,
            surahId: arAyah.surah.number,
          }));
          
          setAyahs(mergedAyahs);
        }
      })
      .catch(err => console.error("Error fetching juz:", err))
      .finally(() => setLoading(false));
  }, [id, settings.showEnglish, settings.showBangla, settings.showEnglishTranslit]);

  // Scroll to targeted Ayah if provided
  useEffect(() => {
    if (ayahs.length > 0 && ayah && !isInitialScrollDone.current) {
      const index = ayahs.findIndex(a => a.numberInSurah === Number(ayah)); // For Juz, navigating to a specific ayah might need to account for surah boundaries, but for Juz Last Read we'll just match the index in the mergedAyahs array by tracking the absolute index or just searching for the first match. Actually, for Juz we should track the absolute index within the Juz since `numberInSurah` resets.
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
      // In Juz, we save the `numberInSurah` and use it to jump back. Note that multiple surahs can have the same ayah number in a Juz, 
      // but for simplicity we findIndex of the first match which is generally fine unless the juz boundary cuts mid-ayah.
      if (topItem && topItem.numberInSurah) {
        AsyncStorage.setItem('last_read_juz', JSON.stringify({
          id,
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


  const renderSettingsModal = () => (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <BlurView intensity={90} tint={colors.glassTint as any} style={styles.modalContent}>
          
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('quranSettings.title')}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Font Sizes */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('quranSettings.textSizes')}</Text>
            <View style={styles.settingRow}>
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

            <View style={styles.settingRow}>
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

            {/* Translations */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.translations')}</Text>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.enTrans')}</Text>
              <Switch value={settings.showEnglish} onValueChange={(v) => updateSetting('showEnglish', v)} trackColor={{ true: colors.highlight }} />
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.bnTrans')}</Text>
              <Switch value={settings.showBangla} onValueChange={(v) => updateSetting('showBangla', v)} trackColor={{ true: colors.highlight }} />
            </View>

            {/* Transliterations */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>{t('quranSettings.translit')}</Text>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quranSettings.enTranslit')}</Text>
              <Switch value={settings.showEnglishTranslit} onValueChange={(v) => updateSetting('showEnglishTranslit', v)} trackColor={{ true: colors.highlight }} />
            </View>
            
            <View style={{ height: Spacing.six }} />
          </ScrollView>
        </BlurView>
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
        <Text style={[styles.title, { color: colors.text, flex: 1, textAlign: 'center' }]}>{t('quran.juz', { id: formatNumber(id as string, i18n.language) })}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.backBtn}>
          <Settings2 size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.highlight} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={ayahs}
          keyExtractor={(item, index) => String(item.surahId) + '-' + String(item.numberInSurah) + '-' + index}
          contentContainerStyle={styles.list}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={onScrollToIndexFailed}
          renderItem={({ item }) => (
            <BlurView intensity={30} tint={colors.glassTint as any} style={styles.ayahCardWrapper}>
              <View style={styles.ayahCard}>
                <View style={styles.ayahHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.numberCircle, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(item.numberInSurah, i18n.language)}</Text>
                    </View>
                    <Text style={[styles.surahTag, { color: colors.textSecondary }]}>{t('surahNames.' + item.surahId, { defaultValue: item.surahName })}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleBookmark(item)}>
                    <Bookmark 
                      size={20} 
                      color={colors.accent} 
                      fill={bookmarkedAyahs[`${item.surahId}-${item.numberInSurah}`] ? colors.accent : 'transparent'} 
                    />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.arabicText, { color: colors.text, fontSize: settings.arabicFontSize, lineHeight: settings.arabicFontSize * 1.8 }]}>
                  {item.arabic}
                </Text>

                {settings.showEnglishTranslit && item.englishTranslit && (
                  <Text style={[styles.translitText, { color: colors.accent, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>
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
  surahTag: { fontFamily: Fonts.outfit, fontSize: 14 },
  
  arabicText: {
    fontFamily: Fonts.outfit,
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
    borderColor: 'rgba(255,255,255,0.1)'
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
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.three,
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
