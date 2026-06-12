import ThemeCard from '@/components/ThemeCard';
import PageHeader from '@/components/page-header';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bookmark, BookOpen, Search, Target, DownloadCloud, CheckCircle, GraduationCap, ChevronRight, X, Play, Pause, Square } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAudioStore } from '@/store/audioStore';
import { useReadingStore } from '@/store/readingStore';
import { useDownloadStore } from '@/store/downloadStore';

import DownloadProgressRing from '@/components/DownloadProgressRing';
import ConfirmModal from '@/components/ConfirmModal';
import ActionSheet from '@/components/ActionSheet';
import Reanimated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';
import * as Haptics from 'expo-haptics';
import surahsData from '@/data/surahs.json';

const SurahDownloadButton = React.memo(({ surahId, reciterId, colors, i18n_language, t }: any) => {
  const isDownloaded = useDownloadStore((s) => s.downloadedFiles[`${reciterId}_${surahId}`]);
  const progress = useDownloadStore((s) => s.downloadProgress[`${reciterId}_${surahId}`]);
  const downloadStore = useDownloadStore();
  const downloadSurah = downloadStore.downloadSurah;
  const deleteSurah = downloadStore.deleteSurah;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const isDark = colors.background === '#0c1618';
  const activeColor = isDark ? colors.accent : colors.highlight;

  return (
    <>
      <TouchableOpacity activeOpacity={1} 
        onPress={() => {
          if (isDownloaded) {
            setConfirmVisible(true);
          } else if (progress !== undefined) {
            setDownloadModalVisible(true);
          } else {
            downloadSurah(reciterId, surahId);
          }
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isDownloaded ? (
          <Reanimated.View entering={FadeInDown.duration(300)}>
            <CheckCircle size={16} color={activeColor} />
          </Reanimated.View>
        ) : progress !== undefined ? (
          <DownloadProgressRing
            size={22}
            progress={progress}
            color={activeColor}
            trackColor={colors.textSecondary + '30'}
            label={formatNumber(Math.round(progress), i18n_language)}
            isPaused={!!downloadStore.pausedDownloads[`${reciterId}_${surahId}`]}
          />
        ) : (
          <Reanimated.View entering={FadeInDown.duration(300)}>
            <DownloadCloud size={18} color={colors.textSecondary} opacity={0.6} />
          </Reanimated.View>
        )}
      </TouchableOpacity>
      <ConfirmModal
        visible={confirmVisible}
        title={t('quran.deleteDownloadTitle', { defaultValue: 'Delete Audio' })}
        message={t('quran.deleteDownloadMessage', { defaultValue: 'Remove this downloaded surah audio from your device?' })}
        confirmText={t('quran.deleteDownloadConfirm', { defaultValue: 'Delete' })}
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        onConfirm={() => { setConfirmVisible(false); deleteSurah(reciterId, surahId); }}
        onCancel={() => setConfirmVisible(false)}
        colors={colors}
        confirmColor={colors.error}
      />
      <ActionSheet
        visible={downloadModalVisible}
        title={t('quran.download.title', { defaultValue: 'Download Options' })}
        options={[
          ...(downloadStore.pausedDownloads[`${reciterId}_${surahId}`]
            ? [{
                id: 'resume',
                icon: <Play size={20} color={activeColor} />,
                label: t('quran.download.resume', { defaultValue: 'Resume Download' }),
                onPress: () => downloadStore.resumeDownload(reciterId, surahId),
                iconBgColor: activeColor + '22',
              }]
            : [{
                id: 'pause',
                icon: <Pause size={20} color={colors.accent} />,
                label: t('quran.download.pause', { defaultValue: 'Pause Download' }),
                onPress: () => downloadStore.pauseDownload(reciterId, surahId),
                iconBgColor: colors.accent + '22',
              }]),
          {
            id: 'stop',
            icon: <Square size={20} color={colors.error} fill={colors.error} />,
            label: t('quran.download.stop', { defaultValue: 'Stop Download' }),
            onPress: () => downloadStore.cancelDownload(reciterId, surahId),
            iconBgColor: colors.error + '22',
            labelColor: colors.error,
          },
        ]}
        onClose={() => setDownloadModalVisible(false)}
        colors={colors}
      />
    </>
  );
});

const SurahRow = React.memo(({ surah, colors, language, reciterId, isBookmarked, onPress, onBookmarkToggle, t }: any) => {
  const handlePress = useCallback(() => onPress(surah.id), [onPress, surah.id]);
  const handleBookmark = useCallback(() => onBookmarkToggle(surah), [onBookmarkToggle, surah]);
  
  return (
    <ThemeCard intensity={30} style={[styles.surahRowWrapper, { borderColor: colors.border }]}>
      <TouchableOpacity activeOpacity={1}
        style={styles.surahRow}
        onPress={handlePress}
      >
        <View style={styles.surahLeft}>
          <View style={[styles.numberBox, { backgroundColor: colors.textSecondary + '15', borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(surah.id, language)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.surahNameEn, { color: colors.text }]}>{language === 'bn' && surah.nameBn ? surah.nameBn : surah.nameEn}</Text>
            <Text style={[styles.surahMeta, { color: colors.textSecondary }]}>
              {language === 'bn' && surah.typeBn ? surah.typeBn : surah.typeEn} • {language === 'bn' && surah.versesBn ? surah.versesBn : surah.versesEn}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <SurahDownloadButton
            surahId={surah.id}
            reciterId={reciterId}
            colors={colors}
            i18n_language={language}
            t={t}
          />
          <TouchableOpacity
            activeOpacity={1}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleBookmark}
          >
          {(() => {
            const isDark = colors.background === '#0c1618';
            const activeColor = isDark ? colors.accent : colors.highlight;
            return (
              <Bookmark
                size={16}
                color={isBookmarked ? activeColor : colors.textSecondary}
                fill={isBookmarked ? activeColor : 'transparent'}
                opacity={isBookmarked ? 1 : 0.5}
              />
            );
          })()}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </ThemeCard>
  );
});


export default function QuranScreen() {

  const colors = useThemeColors();
  const isDark = colors.background === '#0c1618';
  const activeQuranColor = isDark ? colors.accent : colors.highlight;
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const audioStore = useAudioStore();
  const downloadStore = useDownloadStore();
  const readingStore = useReadingStore();
  const today = getLocalYYYYMMDD();
  const pagesReadToday = readingStore.historyLog[today] || 0;
  const isGoalMet = pagesReadToday >= readingStore.dailyGoalPages;
  
  const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'bookmarks'>('surah');
  const surahs = surahsData.data;
  const [lastReadSurah, setLastReadSurah] = useState({ id: '1', name: 'Al-Faatiha', ayah: 1 });
  const [lastReadJuz, setLastReadJuz] = useState({ id: '1', ayah: 1 });
  const [bookmarks, setBookmarks] = useState([]);
  const [showLearnBanner, setShowLearnBanner] = useState(true);
  const [toast, setToast] = useState<{message: string} | null>(null);
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ message });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        audioStore.setHideGlobalBanner(false);
    }, 3000);
  };

  useEffect(() => {
    downloadStore.initialize();
  }, []);

  const toggleSurahBookmark = useCallback(async (surah: any) => {
    try {
      const stored = await AsyncStorage.getItem('imansync_quran_bookmarks');
      let currentBookmarks = stored ? JSON.parse(stored) : [];
      
      const existsIndex = currentBookmarks.findIndex((b: any) => b.type === 'surah' && b.surahId === surah.id);
      if (existsIndex >= 0) {
        currentBookmarks.splice(existsIndex, 1);
        showToast(t('quran.surahBookmarkRemoved', { defaultValue: 'Surah bookmark removed' }));
      } else {
        currentBookmarks.push({
          type: 'surah',
          surahId: surah.id,
          surahName: surah.nameEn || surah.name,
          surahNameAr: surah.nameAr,
          verses: surah.verses,
          revelationType: surah.typeEn || surah.type,
        });
        showToast(t('quran.surahBookmarked', { defaultValue: 'Surah bookmarked' }));
      }
      setBookmarks(currentBookmarks);
      await AsyncStorage.setItem('imansync_quran_bookmarks', JSON.stringify(currentBookmarks));
    } catch (e) {
      console.error(e);
    }
  }, [t]);

  const toggleJuzBookmark = useCallback(async (juzId: number) => {
    try {
      const stored = await AsyncStorage.getItem('imansync_quran_bookmarks');
      let currentBookmarks = stored ? JSON.parse(stored) : [];
      
      const existsIndex = currentBookmarks.findIndex((b: any) => b.type === 'juz' && b.juzId === juzId);
      if (existsIndex >= 0) {
        currentBookmarks.splice(existsIndex, 1);
        showToast(t('quran.juzBookmarkRemoved', { defaultValue: 'Juz bookmark removed' }));
      } else {
        currentBookmarks.push({
          type: 'juz',
          juzId: juzId,
        });
        showToast(t('quran.juzBookmarked', { defaultValue: 'Juz bookmarked' }));
      }
      setBookmarks(currentBookmarks);
      await AsyncStorage.setItem('imansync_quran_bookmarks', JSON.stringify(currentBookmarks));
    } catch (e) {
      console.error(e);
    }
  }, [t]);

  const handleSurahPress = useCallback((id: string | number) => {
    router.push(`/surah/${id}`);
  }, [router]);

  const isJuzBookmarked = (id: number) => bookmarks.some((b: any) => b.type === 'juz' && b.juzId === id);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  // Sync audio bar hide/show with scroll
  useEffect(() => {
    const listenerId = scrollY.addListener((event) => {
      let currentOffset = event.value;
      let direction = currentOffset > 0 && currentOffset > scrollOffset.current ? 'down' : 'up';
      const isScrollingDown = direction === 'down';
      
      if (audioStore.currentSurahId) {
        audioStore.setHideGlobalBanner(isScrollingDown);
      }
      scrollOffset.current = currentOffset;
    });

    return () => scrollY.removeListener(listenerId);
  }, [audioStore.currentSurahId]);



  const bookmarkedSurahIds = useMemo(() => {
    const set = new Set<number>();
    bookmarks.forEach((b: any) => { if (b.type === 'surah') set.add(b.surahId); });
    return set;
  }, [bookmarks]);

  useEffect(() => {
    readingStore.initialize();
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

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      
      <PageHeader 
        titleEn={t('quran.titleEn')} 
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <TouchableOpacity activeOpacity={1}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isGoalMet ? colors.highlight + '22' : 'transparent',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isGoalMet ? colors.highlight : colors.border
              }}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/quran-tracker' as any);
              }}
            >
              <Target size={12} color={isGoalMet ? colors.highlight : colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={{
                fontFamily: Fonts.outfit,
                fontSize: 12,
                color: isGoalMet ? colors.highlight : colors.textSecondary,
                fontWeight: '600'
              }}>
                {formatNumber(pagesReadToday, i18n.language)} / {formatNumber(readingStore.dailyGoalPages, i18n.language)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1} 
              onPress={() => {
                if (activeTab === 'surah') router.push(`/surah/${lastReadSurah.id}?ayah=${lastReadSurah.ayah}`);
                else router.push(`/juz/${lastReadJuz.id}?ayah=${lastReadJuz.ayah}`);
              }} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <BookOpen size={22} color={colors.textSecondary} />
              <View style={{ position: 'absolute', bottom: -5, zIndex: 10, backgroundColor: colors.background, paddingHorizontal: 2, borderRadius: 4 }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 8, color: colors.textSecondary, fontWeight: '700' }}>
                  {activeTab === 'surah' ? formatNumber(Number(lastReadSurah.id), i18n.language) : formatNumber(Number(lastReadJuz.id), i18n.language)}:{activeTab === 'surah' ? formatNumber(lastReadSurah.ayah, i18n.language) : formatNumber(lastReadJuz.ayah, i18n.language)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1} onPress={() => router.push('/quran-search' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Search size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        }
      />

      <Animated.FlatList 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.container} 
        keyboardDismissMode="on-drag" 
        keyboardShouldPersistTaps="handled"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            {isGoalMet && pagesReadToday === readingStore.dailyGoalPages && (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <ConfettiCannon count={50} origin={{x: -10, y: 0}} fallSpeed={2500} fadeOut autoStart />
              </View>
            )}

            {/* Word-by-Word Learn Mode CTA */}
            {showLearnBanner && (
              <TouchableOpacity activeOpacity={1} 
                style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.textSecondary + '10', padding: Spacing.four, borderRadius: 16, marginBottom: Spacing.two, borderWidth: 1, borderColor: colors.textSecondary + '20' }}
                onPress={() => router.push('/quran-learn' as any)}
              >
                <GraduationCap size={24} color={colors.textSecondary} />
                <View style={{ marginLeft: Spacing.three, flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text }}>{t('home.learnQuran')}</Text>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{t('quranSettings.interactiveAudio')}</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                
                <TouchableOpacity activeOpacity={1} 
                  style={{ position: 'absolute', top: 8, right: 8, padding: 4 }}
                  onPress={() => {
                    setShowLearnBanner(false);
                    AsyncStorage.setItem('imansync_hide_learn_banner', 'true').catch(console.error);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Tab Selection */}
            <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
              <TouchableOpacity activeOpacity={1} 
                style={[styles.tabBtn, activeTab === 'surah' && { borderBottomWidth: 2, borderBottomColor: activeQuranColor }]}
                onPress={() => setActiveTab('surah')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'surah' ? activeQuranColor : colors.textSecondary }]}>{t('quran.tabSurah')}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1} 
                style={[styles.tabBtn, activeTab === 'juz' && { borderBottomWidth: 2, borderBottomColor: activeQuranColor }]}
                onPress={() => setActiveTab('juz')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'juz' ? activeQuranColor : colors.textSecondary }]}>{t('quran.tabJuz')}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1} 
                style={[styles.tabBtn, activeTab === 'bookmarks' && { borderBottomWidth: 2, borderBottomColor: activeQuranColor }]}
                onPress={() => setActiveTab('bookmarks')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'bookmarks' ? activeQuranColor : colors.textSecondary }]}>{t('quran.tabBookmarks')}</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        data={activeTab === 'surah' ? surahs : [{ id: 'dummy_tab_content' }]}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item, index }: any) => {
          if (activeTab === 'surah') {
            const isLast = index === surahs.length - 1;
            return (
              <View style={{ marginBottom: isLast ? 0 : Spacing.three }}>
                <SurahRow
                  surah={item}
                  colors={colors}
                  language={i18n.language}
                  reciterId={audioStore.currentReciterId}
                  isBookmarked={bookmarkedSurahIds.has(item.id)}
                  onPress={handleSurahPress}
                  onBookmarkToggle={toggleSurahBookmark}
                  t={t}
                />
              </View>
            );
          } else if (activeTab === 'juz') {
            return (
              <View style={styles.gridContainer}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <ThemeCard key={i} intensity={30}  style={[styles.juzCardWrapper, { borderColor: colors.border }]}>
                    <TouchableOpacity activeOpacity={1} 
                      style={styles.juzCard}
                      onPress={() => router.push(`/juz/${i + 1}`)}
                    >
                      <TouchableOpacity
                        activeOpacity={1}
                        style={{ position: 'absolute', top: 8, right: 8 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={(e) => { e.stopPropagation(); toggleJuzBookmark(i + 1); }}
                      >
                        <Bookmark
                          size={12}
                          color={isJuzBookmarked(i + 1) ? activeQuranColor : colors.textSecondary}
                          fill={isJuzBookmarked(i + 1) ? activeQuranColor : 'transparent'}
                          opacity={isJuzBookmarked(i + 1) ? 1 : 0.4}
                        />
                      </TouchableOpacity>
                      <Text style={[styles.juzText, { color: colors.text }]}>{t('quran.juz', { id: formatNumber(i + 1, i18n.language) })}</Text>
                    </TouchableOpacity>
                  </ThemeCard>
                ))}
              </View>
            );
          } else {
            return (
              <View style={styles.listContainer}>
                {bookmarks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Bookmark size={48} color={colors.textSecondary} opacity={0.5} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('quran.noBookmarks')}</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'column', gap: Spacing.four }}>
                    {/* Surahs Section */}
                    {bookmarks.some((b: any) => b.type === 'surah') && (
                      <View>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: Spacing.three, paddingHorizontal: Spacing.one }]}>{t('quran.bookmarkedSurahs', { defaultValue: 'Bookmarked Surahs' })}</Text>
                        <View style={styles.listContainer}>
                          {bookmarks.filter((b: any) => b.type === 'surah').map((surah: any, i: number) => {
                            const canonicalSurah = surahs.find((s: any) => s.id === surah.surahId);
                            const surahData = canonicalSurah ? canonicalSurah : {
                              id: surah.surahId,
                              nameEn: surah.surahName,
                              nameBn: surah.surahName,
                              nameAr: surah.surahNameAr,
                              typeEn: surah.revelationType,
                              typeBn: surah.revelationType,
                              verses: surah.verses,
                              versesEn: `${surah.verses} Verses`,
                              versesBn: `${formatNumber(surah.verses, 'bn')} আয়াত`
                            };
                            return (
                              <SurahRow
                                key={`surah-${i}`}
                                surah={surahData}
                                colors={colors}
                                language={i18n.language}
                                reciterId={audioStore.currentReciterId}
                                isBookmarked={true}
                                onPress={() => router.push(`/surah/${surah.surahId}`)}
                                onBookmarkToggle={() => toggleSurahBookmark({ id: surah.surahId })}
                                t={t}
                              />
                            );
                          })}
                        </View>
                      </View>
                    )}
    
                    {/* Juz Section */}
                    {bookmarks.some((b: any) => b.type === 'juz') && (
                      <View>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: Spacing.three, paddingHorizontal: Spacing.one }]}>{t('quran.bookmarkedJuz', { defaultValue: 'Bookmarked Juz' })}</Text>
                        <View style={styles.gridContainer}>
                          {bookmarks.filter((b: any) => b.type === 'juz').map((juz: any, i: number) => (
                            <ThemeCard key={`juz-${i}`} intensity={30}  style={[styles.juzCardWrapper, { borderColor: colors.border }]}>
                              <TouchableOpacity activeOpacity={1} 
                                style={styles.juzCard}
                                onPress={() => router.push(`/juz/${juz.juzId}`)}
                                onLongPress={() => toggleJuzBookmark(juz.juzId)}
                              >
                                <View style={{ position: 'absolute', top: 8, right: 8 }}>
                                  <Bookmark size={12} color={activeQuranColor} fill={activeQuranColor} />
                                </View>
                                <Text style={[styles.juzText, { color: colors.text }]}>{t('quran.juz', { id: formatNumber(juz.juzId, i18n.language) })}</Text>
                              </TouchableOpacity>
                            </ThemeCard>
                          ))}
                        </View>
                      </View>
                    )}
    
                    {/* Ayahs Section */}
                    {bookmarks.some((b: any) => !b.type || b.type === 'ayah') && (
                      <View>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: Spacing.three, paddingHorizontal: Spacing.one }]}>{t('quran.bookmarkedAyahs', { defaultValue: 'Bookmarked Ayahs' })}</Text>
                        <View style={styles.listContainer}>
                          {bookmarks.filter((b: any) => !b.type || b.type === 'ayah').map((b: any, i: number) => (
                            <ThemeCard intensity={30}  key={`ayah-${i}`} style={[styles.ayahCardWrapper, { borderColor: colors.border }]}>
                              <TouchableOpacity activeOpacity={1} 
                                style={styles.ayahCard}
                                onPress={() => router.push(`/surah/${b.surahId}?ayah=${b.numberInSurah}`)}
                              >
                                <View style={styles.ayahHeader}>
                                  <View style={[styles.numberCircle, { borderColor: colors.textSecondary + '20', backgroundColor: colors.textSecondary + '15' }]}>
                                    <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(b.numberInSurah, i18n.language)}</Text>
                                  </View>
                                  <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
                                    <Text style={[{ color: colors.textSecondary, fontFamily: Fonts.outfit, fontSize: 14 }]}>
                                      {i18n.language === 'bn' ? (surahs.find((s: any) => s.id === b.surahId)?.nameBn || b.surahName) : (surahs.find((s: any) => s.id === b.surahId)?.nameEn || b.surahName)}
                                    </Text>
                                    <Bookmark size={20} color={activeQuranColor} fill={activeQuranColor} />
                                  </View>
                                </View>
    
                                <Text style={[styles.arabicText, { color: colors.text, fontSize: 24, lineHeight: 24 * 1.8 }]} >
                                  {b.arabic}
                                </Text>
    
                                {!!b.translation && (
                                  <Text style={[styles.englishText, { color: colors.textSecondary, fontSize: 16, lineHeight: 16 * 1.5 }]} >
                                    {b.translation}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </ThemeCard>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          }
        }}
      />

      {/* Floating Last Read Pill Removed */}

      {toast && (
        <Reanimated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOutDown.duration(300)}
          style={{
            position: 'absolute',
            bottom: 100,
            alignSelf: 'center',
            backgroundColor: activeQuranColor,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 24,
            zIndex: 100,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}
        >
          <CheckCircle size={18} color="#FFF" />
          <Text style={{ fontFamily: Fonts.outfit, fontSize: 14, color: '#FFF', fontWeight: '500' }}>
            {toast.message}
          </Text>
        </Reanimated.View>
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
  },
  tabBtn: {
    flex: 1,
    paddingBottom: Spacing.one,
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
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
  },
  ayahCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  ayahCard: {
    padding: Spacing.five,
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    fontFamily: Fonts.arabic,
    textAlign: 'right',
    marginBottom: Spacing.three,
  },
  englishText: {
    fontFamily: Fonts.outfit,
    marginTop: Spacing.two,
  }
});
