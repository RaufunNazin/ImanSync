import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import { fetchOnce } from '@/utils/fetchWithCache';
import { storage } from '@/store/mmkv';
import hadithChaptersBn from '@/data/hadith-chapters-bn.json';
import { useRouter } from 'expo-router';
import { Book, X } from 'lucide-react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Dimensions,
  KeyboardAvoidingView,
  ActivityIndicator,
  InteractionManager,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SAHIH_BOOKS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', author: 'Imam al-Bukhari', arabic: 'صحيح البخاري' },
  { id: 'muslim', name: 'Sahih Muslim', author: 'Imam Muslim', arabic: 'صحيح مسلم' },
  { id: 'abudawud', name: 'Sunan Abu Dawud', author: 'Imam Abu Dawud', arabic: 'سنن أبي داود' },
  { id: 'tirmidhi', name: 'Jami\' at-Tirmidhi', author: 'Imam at-Tirmidhi', arabic: 'جامع الترمذي' },
  { id: 'nasai', name: 'Sunan an-Nasa\'i', author: 'Imam an-Nasa\'i', arabic: 'سنن النسائي' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', author: 'Imam Ibn Majah', arabic: 'سنن ابن ماجه' },
];

interface HadithSection {
  bookId: string;
  bookName: string;
  bookNameAr: string;
  chapterId: string;
  chapterName: string;
  count: number;
}

export default function HadithSearchScreen() {

  const colors = useThemeColors();
  const activeColor = useActiveColor();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [sections, setSections] = useState<HadithSection[]>(() => {
    const cached = storage.getString('hadith_all_sections_list');
    return cached ? JSON.parse(cached) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isLoading, setIsLoading] = useState(sections.length === 0);
  const inputRef = useRef<TextInput>(null);

  const searchWidth = useSharedValue(40); // Starts small like an icon

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSections = useCallback(() => {
    fetchOnce({
      key: 'hadith_all_sections_list',
      onStart: () => {
        setFetchError(false);
        if (sections.length === 0) setIsLoading(true);
      },
      fetcher: async () => {
        return new Promise<HadithSection[]>((resolve, reject) => {
          InteractionManager.runAfterInteractions(async () => {
            try {
              const res = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json');
              if (!res.ok) throw new Error('Network error');
              
              // Yield before heavy JSON parsing
              await new Promise(r => setTimeout(r, 10));
              const data = await res.json();
              
              const allSections: HadithSection[] = [];
              
              // Yield before processing massive arrays
              await new Promise(r => setTimeout(r, 10));
              
              for (const book of SAHIH_BOOKS) {
                const bookData = data[book.id]?.metadata;
                if (bookData && bookData.sections && bookData.section_details) {
                  for (const key in bookData.sections) {
                    const sectionName = bookData.sections[key];
                    const details = bookData.section_details[key];
                    if (sectionName && details) {
                      const count = details.hadithnumber_last - details.hadithnumber_first + 1;
                      if (count > 0) {
                        allSections.push({
                          bookId: book.id,
                          bookName: book.name,
                          bookNameAr: book.arabic,
                          chapterId: key,
                          chapterName: sectionName,
                          count: count,
                        });
                      }
                    }
                  }
                }
              }
              resolve(allSections);
            } catch (err) {
              reject(err);
            }
          });
        });
      },
      onData: (data) => {
        if (!isMounted.current) return;
        if (data) {
          setSections(data);
        }
        setIsLoading(false);
      },
      onError: (err) => {
        if (!isMounted.current) return;
        console.error("Error fetching hadith info for search:", err);
        if (sections.length === 0) setFetchError(true);
        setIsLoading(false);
      }
    });
  }, [sections.length]);

  useEffect(() => {
    // Expand search bar on mount
    searchWidth.value = withTiming(width - Spacing.four * 2 - 40, { duration: 150 });
    
    // Auto focus
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    fetchSections();

    return () => clearTimeout(timer);
  }, [fetchSections, searchWidth]);

  const animatedSearchStyle = useAnimatedStyle(() => {
    return {
      width: searchWidth.value,
    };
  });

  const handleBack = () => {
    router.back();
  };

  // Filter books and sections
  const filteredBooks = SAHIH_BOOKS.filter(b => {
    if (!debouncedQuery) return false;
    const q = debouncedQuery.toLowerCase();
    const translatedName = t(`hadith.books.${b.id}`, { defaultValue: b.name }).toLowerCase();
    const translatedAuthor = t(`hadith.authors.${b.id}`, { defaultValue: b.author }).toLowerCase();
    return (
      b.name.toLowerCase().includes(q) || 
      b.arabic.toLowerCase().includes(q) || 
      translatedName.includes(q) ||
      translatedAuthor.includes(q) ||
      b.author.toLowerCase().includes(q)
    );
  });

  const filteredSections = sections.filter(s => {
    if (!debouncedQuery) return false;
    const q = debouncedQuery.toLowerCase();
    const translatedBookName = t(`hadith.books.${s.bookId}`, { defaultValue: s.bookName }).toLowerCase();
    const translatedChapterNameBn = (hadithChaptersBn as any)[s.bookId]?.[s.chapterId]?.toLowerCase() || '';

    return (
      s.chapterName.toLowerCase().includes(q) || 
      translatedChapterNameBn.includes(q) ||
      translatedBookName.includes(q) ||
      String(s.chapterId).includes(q)
    );
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        showBack={true}
        onBack={handleBack}
        rightElement={
          <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('hadith.searchPlaceholder', { defaultValue: 'Search Hadiths...' })}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity activeOpacity={1} onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          {fetchError ? (
            <View style={{ marginTop: 80, alignItems: 'center' }}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, marginBottom: 16 }]}>
                {t('common.networkError', { defaultValue: 'Network Error: Please check your connection' })}
              </Text>
              <TouchableOpacity activeOpacity={1} style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: activeColor, borderRadius: 8 }} onPress={fetchSections}>
                <Text style={{ color: '#fff', fontFamily: Fonts.outfit, fontSize: 16 }}>{t('common.retry', { defaultValue: 'Retry' })}</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading || isSearching ? (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={activeColor} />
            </View>
          ) : debouncedQuery.length > 0 && filteredBooks.length === 0 && filteredSections.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('noResults', { defaultValue: 'No results found' })}
            </Text>
          ) : (
            <FlatList
              data={[...filteredBooks, ...filteredSections]}
              keyExtractor={(item) => 'id' in item ? `book_${item.id}` : `section_${item.bookId}_${item.chapterId}`}
              contentContainerStyle={styles.listContainer}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if ('id' in item) {
                  // Book item
                  const book = item;
                  return (
                    <Animated.View entering={FadeIn.duration(300)}>
                      <ThemeCard intensity={30} style={[styles.cardWrapper, { borderColor: colors.border }]}>
                        <TouchableOpacity activeOpacity={1} 
                          style={styles.cardRow}
                          onPress={() => router.push(`/hadith/${book.id}` as any)}
                        >
                          <View style={styles.cardLeft}>
                            <View style={[styles.numberBox, { borderColor: colors.border, borderWidth: 1 }]}>
                              <Book size={18} color={activeColor} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.titleTextEn, { color: colors.text }]}>{t(`hadith.books.${book.id}`, { defaultValue: book.name })}</Text>
                              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                                {t(`hadith.authors.${book.id}`, { defaultValue: book.author })}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.titleTextAr, { color: activeColor }]}>{book.arabic}</Text>
                        </TouchableOpacity>
                      </ThemeCard>
                    </Animated.View>
                  );
                } else {
                  // Section item
                  const section = item;
                  return (
                    <Animated.View entering={FadeIn.duration(300)}>
                      <ThemeCard intensity={30} style={[styles.cardWrapper, { borderColor: colors.border }]}>
                        <TouchableOpacity activeOpacity={1} 
                          style={styles.cardRow}
                          onPress={() => router.push(`/hadith/chapter/${section.bookId}/${section.chapterId}` as any)}
                        >
                          <View style={styles.cardLeft}>
                            <View style={[styles.numberBox, { borderColor: colors.border, borderWidth: 1 }]}>
                              <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(section.chapterId, i18n.language)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.titleTextEn, { color: colors.text }]} numberOfLines={2}>
                                {i18n.language === 'bn' && (hadithChaptersBn as any)[section.bookId]?.[section.chapterId] 
                                  ? (hadithChaptersBn as any)[section.bookId][section.chapterId] 
                                  : section.chapterName}
                              </Text>
                              <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {t(`hadith.books.${section.bookId}`, { defaultValue: section.bookName })} • {t('hadith.hadithCount', { count: formatNumber(section.count, i18n.language), defaultValue: `${section.count} Hadiths` })}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </ThemeCard>
                    </Animated.View>
                  );
                }
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.outfit,
    fontSize: 16,
    padding: 0,
  },
  container: { 
    padding: Spacing.four
  },
  listContainer: {
    gap: Spacing.three,
  },
  emptyText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  numberBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  titleTextEn: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    marginBottom: 2,
  },
  metaText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  titleTextAr: {
    fontFamily: Fonts.arabic,
    fontSize: 18,
    marginLeft: Spacing.two,
  },
});
