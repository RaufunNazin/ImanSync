import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import ThemeCard from '@/components/ThemeCard';
import * as Haptics from 'expo-haptics';
import { Book, Search, Bookmark, BookOpen } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatNumber } from '@/utils/formatNumber';

const SAHIH_BOOKS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', author: 'Imam al-Bukhari', arabic: 'صحيح البخاري' },
  { id: 'muslim', name: 'Sahih Muslim', author: 'Imam Muslim', arabic: 'صحيح مسلم' },
  { id: 'abudawud', name: 'Sunan Abu Dawud', author: 'Imam Abu Dawud', arabic: 'سنن أبي داود' },
  { id: 'tirmidhi', name: 'Jami\' at-Tirmidhi', author: 'Imam at-Tirmidhi', arabic: 'جامع الترمذي' },
  { id: 'nasai', name: 'Sunan an-Nasa\'i', author: 'Imam an-Nasa\'i', arabic: 'سنن النسائي' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', author: 'Imam Ibn Majah', arabic: 'سنن ابن ماجه' },
];

export default function HadithScreen() {
  const colors = useThemeColors();
  const activeColor = useActiveColor();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'books' | 'bookmarks'>('books');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [lastReadHadith, setLastReadHadith] = useState<{ book: string; chapter: string; hadithnumber: number; bookName: string; chapterName: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('imansync_hadith_bookmarks')
        .then(val => {
          if (val) {
            try { setBookmarks(JSON.parse(val)); } catch (e) { console.error('Corrupted hadith bookmarks', e); }
          }
        })
        .catch(e => console.error(e));

      AsyncStorage.getItem('last_read_hadith')
        .then(val => {
          if (val) {
            try { setLastReadHadith(JSON.parse(val)); } catch (e) { console.error('Corrupted last_read_hadith', e); }
          }
        })
        .catch(e => console.error(e));
    }, [])
  );

  const filteredBookmarks = bookmarks;

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('hadith.titleEn', { defaultValue: 'Hadith Library' })} 
        titleAr={t('hadith.titleAr', { defaultValue: 'الحديث' })} 
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.four }}>
            {lastReadHadith && (
              <TouchableOpacity activeOpacity={1} 
                onPress={() => {
                  router.push(`/hadith/chapter/${lastReadHadith.book}/${lastReadHadith.chapter}?hadithnumber=${lastReadHadith.hadithnumber}`);
                }} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                <BookOpen size={22} color={colors.textSecondary} />
                <View style={{ position: 'absolute', bottom: -5, zIndex: 10, backgroundColor: colors.background, paddingHorizontal: 2, borderRadius: 4 }}>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 8, color: colors.textSecondary, fontWeight: '700' }}>
                    {formatNumber(lastReadHadith.hadithnumber, i18n.language)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={1} onPress={() => router.push('/hadith-search' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Search size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        }
      />
      


      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity activeOpacity={1} 
            style={[styles.tabBtn, activeTab === 'books' && { borderBottomWidth: 2, borderBottomColor: activeColor }]}
            onPress={() => setActiveTab('books')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'books' ? activeColor : colors.textSecondary }]}>
              {t('hadith.tabBooks', { defaultValue: 'Books' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} 
            style={[styles.tabBtn, activeTab === 'bookmarks' && { borderBottomWidth: 2, borderBottomColor: activeColor }]}
            onPress={() => setActiveTab('bookmarks')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'bookmarks' ? activeColor : colors.textSecondary }]}>
              {t('quran.tabBookmarks', { defaultValue: 'Bookmarks' })}
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'books' ? (
          <View style={styles.grid}>
            {SAHIH_BOOKS.map((book) => (
              <ThemeCard key={book.id} intensity={30} style={[styles.bookRowWrapper, { borderColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={styles.bookRow}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/hadith/${book.id}` as any);
                  }}
                >
                  <View style={styles.bookLeft}>
                    <View style={[styles.numberBox, { backgroundColor: colors.textSecondary + '15', borderColor: colors.border, borderWidth: 1 }]}>
                      <Book size={18} color={activeColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bookNameEn, { color: colors.text }]}>{t(`hadith.books.${book.id}`, { defaultValue: book.name })}</Text>
                      <Text style={[styles.bookMeta, { color: colors.textSecondary }]}>
                        {t(`hadith.authors.${book.id}`, { defaultValue: book.author })}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                    <Text style={[styles.arabicText, { color: colors.textSecondary }]}>{book.arabic}</Text>
                  </View>
                </TouchableOpacity>
              </ThemeCard>
            ))}

          </View>
        ) : (
          <View style={styles.grid}>
            {filteredBookmarks.map((bookmark, idx) => (
              <ThemeCard key={`${bookmark.bookId}_${bookmark.chapterId}_${bookmark.hadithnumber}_${idx}`} intensity={30} style={[styles.bookRowWrapper, { borderColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={styles.bookRow}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/hadith/chapter/${bookmark.bookId}/${bookmark.chapterId}`);
                  }}
                >
                  <View style={styles.bookLeft}>
                    <View style={[styles.numberBox, { backgroundColor: colors.textSecondary + '15', borderColor: colors.border, borderWidth: 1 }]}>
                      <Bookmark size={18} color={activeColor} fill={activeColor} />
                    </View>
                    <View style={{ flex: 1, paddingRight: Spacing.two }}>
                      <Text style={[styles.bookNameEn, { color: colors.text }]} numberOfLines={2}>
                        {bookmark.bookName} - {bookmark.chapterName}
                      </Text>
                      <Text style={[styles.bookMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                        {bookmark.type === 'chapter' ? (
                          t('hadith.chapterBookmark', { defaultValue: 'Chapter Bookmark' })
                        ) : (
                          <>Hadith {formatNumber(bookmark.hadithnumber, i18n.language)} • {bookmark.translation || 'No translation'}</>
                        )}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </ThemeCard>
            ))}
            {filteredBookmarks.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('quran.noBookmarks', { defaultValue: 'No bookmarks yet.' })}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.two,
    fontFamily: Fonts.outfit,
    fontSize: 16,
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: Spacing.three,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  tabText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    padding: Spacing.four,
  },
  grid: {
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  bookRowWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    minHeight: 70,
  },
  bookLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  bookNameEn: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  bookMeta: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  arabicText: {
    fontFamily: Fonts.arabic,
    fontSize: 18,
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.six,
  },
  emptyText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginTop: Spacing.three,
  },
});
