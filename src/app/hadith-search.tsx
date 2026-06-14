import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import { fetchOnce } from '@/utils/fetchWithCache';
import { storage } from '@/store/mmkv';
import hadithChaptersBn from '@/data/hadith-chapters-bn.json';
import { useRouter } from 'expo-router';
import { Book, X } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
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
  const inputRef = useRef<TextInput>(null);

  const searchWidth = useSharedValue(40); // Starts small like an icon

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Expand search bar on mount
    searchWidth.value = withTiming(width - Spacing.four * 2 - 40, { duration: 150 });
    
    // Auto focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    fetchOnce({
      key: 'hadith_all_sections_list',
      onStart: () => {
      },
      fetcher: async () => {
        const res = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json');
        const data = await res.json();
        
        const allSections: HadithSection[] = [];
        
        SAHIH_BOOKS.forEach(book => {
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
        });
        return allSections;
      },
      onData: (data) => {
        if (data) {
          setSections(data);
        }
      },
      onError: (err) => {
        console.error("Error fetching hadith info for search:", err);
      }
    });
  }, []);

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          
          <View style={styles.listContainer}>
              {isSearching ? (
                 <View style={{ marginTop: 40, alignItems: 'center' }}>
                   <ActivityIndicator size="large" color={activeColor} />
                 </View>
              ) : debouncedQuery.length > 0 && filteredBooks.length === 0 && filteredSections.length === 0 ? (
                 <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                   {t('noResults', { defaultValue: 'No results found' })}
                 </Text>
              ) : (
                <>
                  {filteredBooks.map((book) => (
                    <Animated.View entering={FadeIn.duration(300)} key={book.id}>
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
                  ))}

                  {filteredSections.map((section) => (
                    <Animated.View entering={FadeIn.duration(300)} key={`${section.bookId}_${section.chapterId}`}>
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
                  ))}
                </>
              )}
            </View>
        </ScrollView>
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
