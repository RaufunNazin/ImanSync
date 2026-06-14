import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { Bookmark, Settings2, Share2, Plus, Minus } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View, Share } from 'react-native';
import AppModal from '@/components/AppModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import PageHeader from '@/components/page-header';
import { fetchOnce } from '@/utils/fetchWithCache';
import { storage } from '@/store/mmkv';
import hadithChaptersBn from '@/data/hadith-chapters-bn.json';

interface Hadith {
  hadithnumber: number;
  arabicnumber: number;
  arabic: string;
  english?: string;
  bangla?: string;
  reference?: {
    book: number;
    hadith: number;
  };
}

interface HadithSettings {
  arabicFontSize: number;
  translationFontSize: number;
  showEnglish: boolean;
  showBangla: boolean;
}

const DEFAULT_SETTINGS: HadithSettings = {
  arabicFontSize: 20,
  translationFontSize: 16,
  showEnglish: true,
  showBangla: true,
};

const BOOK_NAMES: Record<string, string> = {
  bukhari: 'Sahih al-Bukhari',
  muslim: 'Sahih Muslim',
  abudawud: 'Sunan Abu Dawud',
  tirmidhi: 'Jami\' at-Tirmidhi',
  nasai: 'Sunan an-Nasa\'i',
  ibnmajah: 'Sunan Ibn Majah',
};

export default function HadithChapterScreen() {
  const { book, chapter, hadithnumber } = useLocalSearchParams<{ book: string; chapter: string; hadithnumber?: string }>();
  const colors = useThemeColors();
  const activeColor = useActiveColor();
  const { t, i18n } = useTranslation();

  const [settings, setSettings] = useState<HadithSettings>(() => {
    let initialSettings = {
      ...DEFAULT_SETTINGS,
      showBangla: i18n.language === 'bn',
      showEnglish: i18n.language !== 'bn',
    };
    const saved = storage.getString('imansync_hadith_settings');
    if (saved) {
      try { initialSettings = { ...initialSettings, ...JSON.parse(saved) }; } catch (e) {}
    }
    return initialSettings;
  });

  const [chapterName, setChapterName] = useState(() => {
    if (!book || !chapter) return 'Loading...';
    const cacheKey = `hadith_${book}_${chapter}_name`;
    const cached = storage.getString(cacheKey);
    return cached ? cached : `Chapter ${chapter}`;
  });

  const [hadiths, setHadiths] = useState<Hadith[]>(() => {
    if (!book || !chapter) return [];
    const cacheKey = `hadith_${book}_${chapter}_data`;
    const cached = storage.getString(cacheKey);
    return cached ? JSON.parse(cached) : [];
  });

  const [loading, setLoading] = useState(!hadiths.length);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState<Record<string, boolean>>({});
  
  const flatListRef = useRef<FlatList>(null);
  const isInitialScrollDone = useRef(false);
  const chapterNameRef = useRef(chapterName);

  useEffect(() => {
    chapterNameRef.current = chapterName;
  }, [chapterName]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const topItem = viewableItems[0].item as Hadith;
      if (topItem && topItem.hadithnumber) {
        AsyncStorage.setItem('last_read_hadith', JSON.stringify({
          book,
          chapter,
          hadithnumber: topItem.hadithnumber,
          bookName: BOOK_NAMES[book as string] || 'Hadith',
          chapterName: chapterNameRef.current
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

  useEffect(() => {
    if (hadiths.length > 0 && hadithnumber && !isInitialScrollDone.current) {
      const index = hadiths.findIndex(h => h.hadithnumber === Number(hadithnumber));
      if (index >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
          isInitialScrollDone.current = true;
        }, 300);
      }
    }
  }, [hadiths, hadithnumber]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem('imansync_hadith_bookmarks');
      if (stored) {
        const parsed = JSON.parse(stored);
        const map: Record<string, boolean> = {};
        parsed.forEach((b: any) => {
          if (b.type === 'hadith' && b.bookId === book && b.chapterId === chapter) map[b.hadithnumber] = true;
        });
        setBookmarkedHadiths(map);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBookmark = async (hadithItem: Hadith) => {
    try {
      const stored = await AsyncStorage.getItem('imansync_hadith_bookmarks');
      let bookmarks = stored ? JSON.parse(stored) : [];
      
      const existsIndex = bookmarks.findIndex((b: any) => b.type === 'hadith' && b.bookId === book && b.chapterId === chapter && b.hadithnumber === hadithItem.hadithnumber);
      
      if (existsIndex >= 0) {
        bookmarks.splice(existsIndex, 1);
        setBookmarkedHadiths(prev => ({ ...prev, [hadithItem.hadithnumber]: false }));
      } else {
        bookmarks.push({
          type: 'hadith',
          bookId: book,
          chapterId: chapter,
          bookName: BOOK_NAMES[book as string] || book,
          chapterName: chapterName,
          hadithnumber: hadithItem.hadithnumber,
          arabic: hadithItem.arabic,
          translation: hadithItem.english || hadithItem.bangla || '',
        });
        setBookmarkedHadiths(prev => ({ ...prev, [hadithItem.hadithnumber]: true }));
      }
      
      await AsyncStorage.setItem('imansync_hadith_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.error(e);
    }
  };

  const shareHadith = async (hadithItem: Hadith) => {
    try {
      const parts = [
        `${BOOK_NAMES[book as string] || book} - ${chapterName}`,
        `Hadith ${hadithItem.hadithnumber}`,
        hadithItem.arabic,
      ];
      
      if (settings.showBangla && hadithItem.bangla) {
        parts.push(hadithItem.bangla);
      }
      if (settings.showEnglish && hadithItem.english) {
        parts.push(hadithItem.english);
      }
      
      parts.push(`Shared via ImanSync`);
      
      await Share.share({
        message: parts.join('\n\n'),
      });
    } catch (e) {
      console.error('Error sharing hadith:', e);
    }
  };

  const updateSetting = (key: keyof HadithSettings, val: any) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      storage.set('imansync_hadith_settings', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!book || !chapter) return;
    
    const cacheKey = `hadith_${book}_${chapter}_data`;

    fetchOnce({
      key: cacheKey,
      onStart: () => {
        if (!hadiths.length) setLoading(true);
      },
      fetcher: async () => {
        const baseUrl = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
        
        const [arRes, enRes, bnRes] = await Promise.all([
          fetch(`${baseUrl}/ara-${book}/sections/${chapter}.json`).catch(() => null),
          fetch(`${baseUrl}/eng-${book}/sections/${chapter}.json`).catch(() => null),
          fetch(`${baseUrl}/ben-${book}/sections/${chapter}.json`).catch(() => null),
        ]);

        const arData = arRes && arRes.ok ? await arRes.json() : null;
        const enData = enRes && enRes.ok ? await enRes.json() : null;
        const bnData = bnRes && bnRes.ok ? await bnRes.json() : null;

        if (!arData || !arData.hadiths) {
          throw new Error("Failed to fetch Arabic hadith data");
        }

        const nameAr = arData.metadata?.section?.[chapter] || `Chapter ${chapter}`;
        const nameEn = enData?.metadata?.section?.[chapter] || nameAr;
        
        let nameBn = bnData?.metadata?.section?.[chapter] || nameEn;
        if ((hadithChaptersBn as any)[book as string]?.[chapter]) {
          nameBn = (hadithChaptersBn as any)[book as string][chapter];
        }
                     
        storage.set(`hadith_${book}_${chapter}_name`, nameEn);

        // Merge the languages using hadithnumber
        const mergedHadiths: Hadith[] = arData.hadiths.map((arHadith: any) => {
          const hn = arHadith.hadithnumber;
          const enMatch = enData?.hadiths?.find((h: any) => h.hadithnumber === hn);
          const bnMatch = bnData?.hadiths?.find((h: any) => h.hadithnumber === hn);
          
          return {
            hadithnumber: hn,
            arabicnumber: arHadith.arabicnumber,
            arabic: arHadith.text,
            english: enMatch?.text,
            bangla: bnMatch?.text,
            reference: arHadith.reference,
          };
        });

        return { chapterNameEn: nameEn, chapterNameBn: nameBn, chapterNameAr: nameAr, hadiths: mergedHadiths };
      },
      onData: (data) => {
        if (data) {
          setChapterName(i18n.language === 'bn' ? data.chapterNameBn : data.chapterNameEn);
          setHadiths(data.hadiths);
        }
        setLoading(false);
      },
      onError: (err) => {
        console.error("Error fetching hadith:", err);
        setLoading(false);
      }
    });
  }, [book, chapter]);

  const renderItem = ({ item }: { item: Hadith }) => {
    const isBookmarked = bookmarkedHadiths[item.hadithnumber];

    return (
      <ThemeCard intensity={30} style={[styles.hadithCardWrapper, { borderColor: colors.border, marginBottom: Spacing.four }]}>
        <View style={styles.hadithCard}>
          {/* Hadith Header */}
          <View style={[styles.hadithHeader, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={[styles.hadithNumberCircle, { backgroundColor: colors.background }]}>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                style={[styles.hadithNumberText, { color: activeColor }]}
              >
                {formatNumber(item.hadithnumber, i18n.language)}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => shareHadith(item)} style={styles.iconButton}>
                <Share2 size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleBookmark(item)} style={styles.iconButton}>
                <Bookmark size={20} color={isBookmarked ? activeColor : colors.textSecondary} fill={isBookmarked ? activeColor : 'none'} />
              </TouchableOpacity>
            </View>
          </View>

        {/* Hadith Content */}
        <View style={styles.hadithContent}>
          <Text style={[styles.arabicText, { color: colors.text, fontSize: settings.arabicFontSize, lineHeight: settings.arabicFontSize * 1.8 }]}>
            {item.arabic}
          </Text>

          {settings.showBangla && item.bangla && (
            <Text style={[styles.translationText, { color: colors.textSecondary, fontSize: settings.translationFontSize, marginTop: Spacing.four }]}>
              {item.bangla}
            </Text>
          )}

          {settings.showEnglish && item.english && (
            <Text style={[styles.translationText, { color: colors.textSecondary, fontSize: settings.translationFontSize, marginTop: Spacing.three }]}>
              {item.english}
            </Text>
          )}
        </View>
      </View>
    </ThemeCard>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t(`hadith.books.${book}`, { defaultValue: BOOK_NAMES[book as string] || 'Hadith' })}
        titleAr={chapterName}
        showBack 
        rightElement={
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.settingsBtn}>
            <Settings2 size={20} color={colors.text} />
          </TouchableOpacity>
        }
      />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={activeColor} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={hadiths}
          keyExtractor={(item) => item.hadithnumber.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50, minimumViewTime: 300 }}
          onScrollToIndexFailed={onScrollToIndexFailed}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* Settings Modal */}
      <AppModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={t('quran.readingSettings', { defaultValue: 'Reading Settings' })}
      >
        <View style={styles.settingsContainer}>
          {/* Arabic Font Size */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quran.arabicFontSize', { defaultValue: 'Arabic Font Size' })}</Text>
            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={() => updateSetting('arabicFontSize', Math.max(16, settings.arabicFontSize - 2))}
                style={[styles.fontBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Minus size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.fontSizeValue, { color: colors.text }]}>{settings.arabicFontSize}</Text>
              <TouchableOpacity
                onPress={() => updateSetting('arabicFontSize', Math.min(48, settings.arabicFontSize + 2))}
                style={[styles.fontBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Translation Font Size */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quran.translationFontSize', { defaultValue: 'Translation Font Size' })}</Text>
            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={() => updateSetting('translationFontSize', Math.max(12, settings.translationFontSize - 2))}
                style={[styles.fontBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Minus size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.fontSizeValue, { color: colors.text }]}>{settings.translationFontSize}</Text>
              <TouchableOpacity
                onPress={() => updateSetting('translationFontSize', Math.min(32, settings.translationFontSize + 2))}
                style={[styles.fontBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle English */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quran.showEnglish', { defaultValue: 'Show English' })}</Text>
            <Switch
              value={settings.showEnglish}
              onValueChange={(val) => updateSetting('showEnglish', val)}
              trackColor={{ true: activeColor, false: colors.border }}
              thumbColor={colors.background}
            />
          </View>

          {/* Toggle Bangla */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('quran.showBangla', { defaultValue: 'Show Bangla' })}</Text>
            <Switch
              value={settings.showBangla}
              onValueChange={(val) => updateSetting('showBangla', val)}
              trackColor={{ true: activeColor, false: colors.border }}
              thumbColor={colors.background}
            />
          </View>
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  settingsBtn: {
    padding: 8,
  },
  hadithCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  hadithCard: {
    padding: Spacing.five,
  },
  hadithHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  hadithNumberCircle: {
    minWidth: 46,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hadithNumberText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  hadithContent: {
    paddingHorizontal: 4,
  },
  arabicText: {
    fontFamily: Fonts.arabic,
    textAlign: 'right',
  },
  translationText: {
    fontFamily: Fonts.outfit,
    lineHeight: 24,
  },
  settingsContainer: {
    gap: Spacing.four,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fontBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeValue: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
});
