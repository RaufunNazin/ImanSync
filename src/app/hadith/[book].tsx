import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, InteractionManager } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import PageHeader from '@/components/page-header';
import ThemeCard from '@/components/ThemeCard';
import * as Haptics from 'expo-haptics';
import { Bookmark } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hadithChaptersBn from '@/data/hadith-chapters-bn.json';
import { fetchOnce } from '@/utils/fetchWithCache';

const BOOK_NAMES: Record<string, string> = {
  bukhari: 'Sahih al-Bukhari',
  muslim: 'Sahih Muslim',
  abudawud: 'Sunan Abu Dawud',
  tirmidhi: 'Jami\' at-Tirmidhi',
  nasai: 'Sunan an-Nasa\'i',
  ibnmajah: 'Sunan Ibn Majah',
};

interface Section {
  id: string;
  name: string;
  count: number;
}

export default function HadithBookScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const colors = useThemeColors();
  const activeColor = useActiveColor();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedChapters, setBookmarkedChapters] = useState<Record<string, boolean>>({});
  
  const interactionHandles = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      interactionHandles.current.forEach((h: any) => h?.cancel());
    };
  }, []);
  
  const bookName = book ? t(`hadith.books.${book}`, { defaultValue: BOOK_NAMES[book] }) : 'Hadith Book';

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('imansync_hadith_bookmarks')
        .then(val => {
          if (val) {
            try {
              const parsed = JSON.parse(val);
              const chapterMap: Record<string, boolean> = {};
              parsed.forEach((b: any) => {
                if (b.type === 'chapter' && b.bookId === book) {
                  chapterMap[b.chapterId] = true;
                }
              });
              setBookmarkedChapters(chapterMap);
            } catch (e) {
              console.error('Corrupted hadith bookmarks', e);
            }
          }
        })
        .catch(e => console.error(e));
    }, [book])
  );

  useEffect(() => {
    if (!book) return;
    
    let isMounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      fetchOnce({
        key: `hadith_info_${book}`,
        onStart: () => {
          if (isMounted) setLoading(true);
        },
        fetcher: async () => {
          const res = await fetch('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json');
          return res.json();
        },
        onData: (data) => {
          if (!isMounted) return;
          const bookData = data[book]?.metadata;
          if (bookData && bookData.sections && bookData.section_details) {
            const parsedSections: Section[] = [];
            
            for (const key in bookData.sections) {
              const sectionName = bookData.sections[key];
              const details = bookData.section_details[key];
              
              if (sectionName && details) {
                const count = details.hadithnumber_last - details.hadithnumber_first + 1;
                if (count > 0) {
                  parsedSections.push({
                    id: key,
                    name: sectionName,
                    count: count,
                  });
                }
              }
            }
            setSections(parsedSections);
          }
          setLoading(false);
        },
        onError: (err) => {
          console.error("Error fetching hadith info:", err);
          if (isMounted) setLoading(false);
        }
      });
    });

    return () => {
      isMounted = false;
      task.cancel();
    };
  }, [book]);

  const toggleBookmark = (section: Section) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const isBookmarked = bookmarkedChapters[section.id];
    const newMap = { ...bookmarkedChapters, [section.id]: !isBookmarked };
    setBookmarkedChapters(newMap);

    const handle = InteractionManager.runAfterInteractions(async () => {
      try {
        const stored = await AsyncStorage.getItem('imansync_hadith_bookmarks');
        let currentBookmarks = stored ? JSON.parse(stored) : [];
        
        if (isBookmarked) {
          // Remove
          currentBookmarks = currentBookmarks.filter((b: any) => 
            !(b.type === 'chapter' && b.bookId === book && b.chapterId === section.id)
          );
        } else {
          // Add
          currentBookmarks.push({
            type: 'chapter',
            bookId: book,
            bookName: bookName,
            chapterId: section.id,
            chapterName: section.name,
            addedAt: new Date().toISOString()
          });
        }
        
        await AsyncStorage.setItem('imansync_hadith_bookmarks', JSON.stringify(currentBookmarks));
      } catch (e) {
        console.error('Failed to toggle chapter bookmark', e);
        // Revert UI on failure
        setBookmarkedChapters({ ...bookmarkedChapters, [section.id]: isBookmarked });
      }
    });
    interactionHandles.current.push(handle);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={bookName} showBack />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={activeColor} />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          data={sections}
          keyExtractor={(item) => item.id.toString()}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          renderItem={({ item: section }) => {
            const isBookmarked = bookmarkedChapters[section.id];
            
            return (
              <ThemeCard intensity={30} style={[styles.cardWrapper, { borderColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={styles.card}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/hadith/chapter/${book}/${section.id}`);
                  }}
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.numberCircle, { backgroundColor: colors.textSecondary + '15', borderColor: colors.border, borderWidth: 1 }]}>
                      <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(section.id, i18n.language)}</Text>
                    </View>
                    
                    <View style={styles.textContainer}>
                      <Text style={[styles.sectionName, { color: colors.text }]} numberOfLines={2}>
                        {i18n.language === 'bn' && (hadithChaptersBn as any)[book as string]?.[section.id] 
                          ? (hadithChaptersBn as any)[book as string][section.id] 
                          : section.name}
                      </Text>
                      <Text style={[styles.hadithCount, { color: colors.textSecondary }]}>
                        {t('hadith.hadithCount', { count: formatNumber(section.count, i18n.language), defaultValue: `${section.count} Hadiths` })}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity activeOpacity={1} 
                    onPress={() => toggleBookmark(section)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    style={{ padding: Spacing.two }}
                  >
                    <Bookmark 
                      size={20} 
                      color={isBookmarked ? activeColor : colors.textSecondary} 
                      fill={isBookmarked ? activeColor : 'none'} 
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </ThemeCard>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    minHeight: 70,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  numberText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    fontWeight: '600',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionName: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 4,
  },
  hadithCount: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
});
