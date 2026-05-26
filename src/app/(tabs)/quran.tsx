import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark, BookOpen, ChevronRight, GraduationCap, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import SkeletonBox from '@/components/SkeletonBox';

interface Surah {
  id: number;
  name: string;
  nameAr: string;
  verses: number;
  type: string;
}

export default function QuranScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('surah');
  const [surahs, setSurahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReadSurah, setLastReadSurah] = useState({ id: '1', name: 'Al-Faatiha', ayah: 1 });
  const [lastReadJuz, setLastReadJuz] = useState({ id: '1', ayah: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [showLearnBanner, setShowLearnBanner] = useState(true);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          const formatted = json.data.map((item: any) => ({
            id: item.number,
            name: item.englishName,
            nameAr: item.name,
            verses: item.numberOfAyahs,
            type: item.revelationType,
          }));
          setSurahs(formatted);
        }
      })
      .catch(err => console.error("Error fetching surahs:", err))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Fix #2: guard all JSON.parse calls against corrupted AsyncStorage data
      AsyncStorage.getItem('last_read_surah').then(val => {
        if (val) {
          try { setLastReadSurah(JSON.parse(val)); } catch (e) { console.error('Corrupted last_read_surah', e); }
        }
      }).catch(e => console.error(e));

      AsyncStorage.getItem('last_read_juz').then(val => {
        if (val) {
          try { setLastReadJuz(JSON.parse(val)); } catch (e) { console.error('Corrupted last_read_juz', e); }
        }
      }).catch(e => console.error(e));

      AsyncStorage.getItem('imansync_quran_bookmarks').then(val => {
        if (val) {
          try { setBookmarks(JSON.parse(val)); } catch (e) { console.error('Corrupted quran_bookmarks', e); }
        }
      }).catch(e => console.error(e));

      AsyncStorage.getItem('imansync_hide_learn_banner').then(val => {
        if (val === 'true') setShowLearnBanner(false);
      }).catch(e => console.error(e));
    }, [])
  );

  const filteredSurahs = surahs.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) || 
      s.nameAr.toLowerCase().includes(q) || 
      String(s.id).includes(q)
    );
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      <PageHeader titleEn={t('quran.titleEn')} titleAr={t('quran.titleAr')} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('quran.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Word-by-Word Learn Mode CTA */}
        {showLearnBanner && (
          <TouchableOpacity 
            style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent + '15', padding: Spacing.four, borderRadius: 16, marginBottom: Spacing.two, borderWidth: 1, borderColor: colors.accent + '30' }}
            onPress={() => router.push('/quran-learn' as any)}
          >
            <GraduationCap size={24} color={colors.accent} />
            <View style={{ marginLeft: Spacing.three, flex: 1, paddingRight: 8 }}>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text }}>{t('home.learnQuran')}</Text>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{i18n.language === 'bn' ? 'ইন্টারেক্টিভ শব্দ-ভিত্তিক অডিও ও অনুবাদ' : 'Interactive word-by-word audio & translation'}</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            
            <TouchableOpacity 
              style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
              onPress={() => {
                setShowLearnBanner(false);
                AsyncStorage.setItem('imansync_hide_learn_banner', 'true');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Compact Last Read Card Removed */}
        {/* Tab Selection */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'surah' && { borderBottomWidth: 2, borderBottomColor: colors.highlight }]}
            onPress={() => setActiveTab('surah')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'surah' ? colors.highlight : colors.textSecondary }]}>{t('quran.tabSurah')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'juz' && { borderBottomWidth: 2, borderBottomColor: colors.highlight }]}
            onPress={() => setActiveTab('juz')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'juz' ? colors.highlight : colors.textSecondary }]}>{t('quran.tabJuz')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'bookmarks' && { borderBottomWidth: 2, borderBottomColor: colors.highlight }]}
            onPress={() => setActiveTab('bookmarks')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'bookmarks' ? colors.highlight : colors.textSecondary }]}>{t('quran.tabBookmarks')}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {loading && activeTab === 'surah' ? (
          <View style={[styles.listContainer, { marginTop: 8 }]}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={[styles.surahRowWrapper, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                <View style={[styles.surahRow]}>
                  <View style={styles.surahLeft}>
                    <SkeletonBox width={28} height={28} borderRadius={8} color={colors.border} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <SkeletonBox width={110} height={14} borderRadius={7} color={colors.border} />
                      <SkeletonBox width={70} height={11} borderRadius={5} color={colors.border} />
                    </View>
                  </View>
                  <SkeletonBox width={56} height={20} borderRadius={8} color={colors.border} />
                </View>
              </View>
            ))}
          </View>
        ) : activeTab === 'surah' ? (
          <View style={styles.listContainer}>
            {filteredSurahs.map((surah) => (
              <BlurView intensity={30} tint={colors.glassTint as any} key={surah.id} style={[styles.surahRowWrapper, { borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.surahRow} 
                  activeOpacity={0.7}
                  onPress={() => router.push(`/surah/${surah.id}`)}
                >
                  <View style={styles.surahLeft}>
                    <View style={[styles.numberBox, { borderColor: colors.border, borderWidth: 1 }]}>
                      <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(surah.id, i18n.language)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.surahNameEn, { color: colors.text }]}>{t('surahNames.' + surah.id, { defaultValue: surah.name })}</Text>
                      <Text style={[styles.surahMeta, { color: colors.textSecondary }]}>
                        {t('quran.' + surah.type, { defaultValue: surah.type })} • {t('surah.verses', { count: formatNumber(surah.verses, i18n.language) })}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.surahNameAr, { color: scheme === 'dark' ? colors.accent : colors.highlight }]}>{surah.nameAr}</Text>
                </TouchableOpacity>
              </BlurView>
            ))}
          </View>
        ) : activeTab === 'juz' ? (
          <View style={styles.gridContainer}>
            {Array.from({ length: 30 }).map((_, i) => (
              <BlurView key={i} intensity={30} tint={colors.glassTint as any} style={[styles.juzCardWrapper, { borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={styles.juzCard}
                  onPress={() => router.push(`/juz/${i + 1}`)}
                >
                  <Text style={[styles.juzText, { color: colors.text }]}>{t('quran.juz', { id: formatNumber(i + 1, i18n.language) })}</Text>
                </TouchableOpacity>
              </BlurView>
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {bookmarks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Bookmark size={48} color={colors.textSecondary} opacity={0.5} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('quran.noBookmarks')}</Text>
              </View>
            ) : (
              bookmarks.map((b: any, i: number) => (
                <BlurView intensity={30} tint={colors.glassTint as any} key={i} style={[styles.surahRowWrapper, { borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={[styles.surahRow, { paddingVertical: Spacing.four }]} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/surah/${b.surahId}?ayah=${b.numberInSurah}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Bookmark size={16} color={colors.accent} fill={colors.accent} />
                        <Text style={[styles.surahNameEn, { color: colors.text, fontSize: 16 }]}>{t('surahNames.' + b.surahId, { defaultValue: b.surahName })}</Text>
                        <View style={[styles.numberBox, { width: 24, height: 24, borderRadius: 12, borderColor: colors.border, borderWidth: 1 }]}>
                          <Text style={[styles.numberText, { color: colors.textSecondary, fontSize: 10 }]}>{formatNumber(b.numberInSurah, i18n.language)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.surahNameAr, { color: colors.text, fontSize: 20, textAlign: 'right', marginBottom: 4 }]} numberOfLines={1}>
                        {b.arabic}
                      </Text>
                      <Text style={[styles.surahMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                        {b.translation}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </BlurView>
              ))
            )}
          </View>
        )}

        <View style={{ height: Spacing.six + 20 }} />
      </ScrollView>

      {/* Floating Last Read Pill */}
      {activeTab !== 'bookmarks' && (
        <View style={styles.floatingHintContainer}>
          <View style={[styles.floatingHintCard, { borderColor: colors.accent, backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={styles.floatingHintTouch}
              onPress={() => {
                if (activeTab === 'surah') router.push(`/surah/${lastReadSurah.id}?ayah=${lastReadSurah.ayah}`);
                else router.push(`/juz/${lastReadJuz.id}?ayah=${lastReadJuz.ayah}`);
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.accent + '22' }]}>
                <BookOpen size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.three }}>
                <Text style={[styles.storiesTitle, { color: colors.text, fontSize: 14 }]}>
                  {t('quran.continue')} {activeTab === 'surah' ? t('surahNames.' + lastReadSurah.id, { defaultValue: lastReadSurah.name }) : t('quran.juz', { id: formatNumber(lastReadJuz.id, i18n.language) })}
                </Text>
                <Text style={[styles.storiesSubtitle, { color: colors.textSecondary, fontSize: 12 }]}>
                  {t('quran.goToAyah')} {formatNumber(activeTab === 'surah' ? lastReadSurah.ayah : lastReadJuz.ayah, i18n.language)}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  header: {
    // replaced by PageHeader component
  },
  container: { 
    padding: Spacing.four,
    paddingTop: 0
  },
  loaderContainer: {
    padding: Spacing.six,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.outfit,
    fontSize: 16,
    padding: 0,
  },
  compactLastReadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: 20,
    marginBottom: Spacing.four,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  lastReadTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  surahNameCompact: {
    fontFamily: Fonts.outfit,
    fontSize: 20,
  },
  continueBtnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  continueTextCompact: {
    fontFamily: Fonts.outfit,
    color: '#FFF',
    fontSize: 14,
  },
  floatingHintContainer: {
    position: 'absolute',
    bottom: Spacing.two + 20,
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 999,
  },
  floatingHintCard: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 5,
  },
  floatingHintTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesTitle: {
    fontFamily: Fonts.outfit,
    marginBottom: 4,
  },
  storiesSubtitle: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.one,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  listContainer: {
    gap: Spacing.three,
  },
  surahRowWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  surahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  numberBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: Fonts.outfit,
    fontSize: 11,
  },
  surahNameEn: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    marginBottom: 2,
  },
  surahMeta: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  surahNameAr: {
    fontFamily: Fonts.arabic,
    fontSize: 20,
    marginLeft: Spacing.two,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  juzCardWrapper: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  juzCard: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  juzText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
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
  }
});
