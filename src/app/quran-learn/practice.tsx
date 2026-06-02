import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react-native';
import { parseTajweed } from '@/utils/tajweedParser';
import { TajweedLegendItems } from '@/constants/tajweed';
import { useThemeStore } from '@/store/themeStore';

interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  translation: { text: string };
  transliteration: { text: string };
  text_uthmani: string;
  text_uthmani_tajweed: string;
}

export default function QuranLearnScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const { surahId = '1', ayahId = '1' } = useLocalSearchParams<{ surahId: string, ayahId: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  
  const [currentSurahId] = useState(parseInt(surahId, 10) || 1);
  const [currentAyah, setCurrentAyah] = useState(parseInt(ayahId, 10) || 1);
  const [ayahAudioUrl, setAyahAudioUrl] = useState<string | null>(null);
  
  const { playAudio } = useAudioPlayer();
  const { i18n } = useTranslation();

  const fetchAyah = async (sId: number, aId: number) => {
    setLoading(true);
    setSelectedWord(null);
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${sId}:${aId}?language=${i18n.language}&words=true&word_fields=text_uthmani,text_uthmani_tajweed,audio_url&audio=1`);
      const json = await res.json();
      if (json.verse && json.verse.words) {
        setWords(json.verse.words);
      }
      if (json.verse && json.verse.audio && json.verse.audio.url) {
        setAyahAudioUrl(json.verse.audio.url);
      } else {
        setAyahAudioUrl(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAyah(currentSurahId, currentAyah);
  }, [currentSurahId, currentAyah, i18n.language]);

  const handleWordPress = (word: Word) => {
    setSelectedWord(word);
    let audioUrl = null;
    if (word.audio_url) {
      audioUrl = word.audio_url.startsWith('http') 
        ? word.audio_url 
        : `https://audio.qurancdn.com/${word.audio_url}`;
    }
    playAudio(audioUrl, word.text_uthmani);
  };

  const goNext = () => {
    setCurrentAyah(prev => prev + 1);
  };

  const goPrev = () => {
    if (currentAyah > 1) {
      setCurrentAyah(prev => prev - 1);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={`Surah ${currentSurahId} : ${currentAyah}`} 
        titleAr="تَعَلُّم" 
        showBack 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Helper Banner */}
        <BlurView intensity={40} tint={colors.glassTint as any} style={[styles.banner, { borderColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => {
              if (ayahAudioUrl) {
                const fullUrl = ayahAudioUrl.startsWith('//') ? `https:${ayahAudioUrl}` : ayahAudioUrl;
                playAudio(fullUrl);
              }
            }}
            style={[styles.playAyahBtn, { backgroundColor: colors.highlight }]}
          >
            <Volume2 size={24} color={colors.background} />
          </TouchableOpacity>
          <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
            {i18n.language === 'bn' 
              ? 'উচ্চারণ ও অর্থ জানতে যেকোনো আরবি শব্দের উপর ট্যাপ করুন। অথবা সম্পূর্ণ আয়াত শুনতে প্লে বাটনে চাপুন।' 
              : 'Tap on any Arabic word to hear its pronunciation. Or press Play to hear the full Ayah.'}
          </Text>
        </BlurView>

        {/* Tajweed Legend */}
        <View 
          style={[styles.legendContainer, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}
        >
          {TajweedLegendItems.map(item => (
            <View key={item.id} style={[styles.legendItem, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
              <View style={[styles.legendColorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {i18n.language === 'bn' ? item.labelBn : item.labelEn}
              </Text>
            </View>
          ))}
        </View>

        {/* Translation Box */}
        <View style={{ minHeight: 80, marginBottom: Spacing.three }}>
          {selectedWord ? (
            <BlurView intensity={50} tint={colors.glassTint as any} style={[styles.translationBox, { borderColor: colors.accent }]}>
              <Text style={[styles.selectedArabic, { color: colors.highlight }]}>
                {selectedWord.text_uthmani}
              </Text>
              <Text style={[styles.selectedTranslit, { color: colors.textSecondary }]}>
                {selectedWord.transliteration?.text || ''}
              </Text>
              <Text style={[styles.selectedTranslation, { color: colors.text }]}>
                {selectedWord.translation?.text || ''}
              </Text>
            </BlurView>
          ) : (
            <View style={[styles.translationBoxPlaceholder, { borderColor: colors.border }]} />
          )}
        </View>

        {/* Word by Word Flow */}
        <View style={styles.wordsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40, alignSelf: 'center' }} />
          ) : (
            words.map((word) => {
              const isSelected = selectedWord?.id === word.id;
              
              if (word.char_type_name === 'end') {
                return (
                  <View key={word.id} style={styles.ayahEndMark}>
                    <Text style={[styles.ayahEndText, { color: colors.textSecondary }]}>{word.text_uthmani}</Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={word.id}
                  style={[
                    styles.wordWrap,
                    isSelected && { backgroundColor: colors.accent + '22', borderColor: colors.accent }
                  ]}
                  onPress={() => handleWordPress(word)}
                >
                  <Text style={{ textAlign: 'right' }}>
                    {parseTajweed(word.text_uthmani_tajweed || word.text_uthmani, [styles.wordArabic, { color: colors.text }])}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Footer Nav */}
      <View style={[styles.footerNav, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.navBtn} onPress={goPrev} disabled={currentAyah === 1}>
          <ChevronLeft size={24} color={currentAyah === 1 ? colors.border : colors.text} />
          <Text style={[styles.navBtnText, { color: currentAyah === 1 ? colors.border : colors.text }]}>Prev</Text>
        </TouchableOpacity>
        
        <Text style={[styles.navCenter, { color: colors.textSecondary }]}>
          Ayah {currentAyah}
        </Text>
        
        <TouchableOpacity style={styles.navBtn} onPress={goNext}>
          <Text style={[styles.navBtnText, { color: colors.text }]}>Next</Text>
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: Spacing.four,
    paddingBottom: 100, // Room for footer
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.three,
    gap: Spacing.three,
  },
  playAyahBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  legendContainer: {
    marginBottom: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontFamily: Fonts.outfit,
    fontSize: 11,
  },
  translationBox: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationBoxPlaceholder: {
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  selectedArabic: {
    fontFamily: Fonts.arabic,
    fontSize: 26,
    marginBottom: Spacing.one,
  },
  selectedTranslit: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginBottom: Spacing.one,
  },
  selectedTranslation: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    textAlign: 'center',
  },
  wordsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  wordWrap: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wordArabic: {
    fontFamily: Fonts.arabic,
    fontSize: 36,
    lineHeight: 50,
    includeFontPadding: false,
  },
  ayahEndMark: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  ayahEndText: {
    fontFamily: Fonts.arabic,
    fontSize: 24,
  },
  footerNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  navCenter: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  }
});
