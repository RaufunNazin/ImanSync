import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/themeStore';
import { QURAN_CURRICULUM, LessonItem } from '@/data/quran-curriculum';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LessonPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();
  const router = useRouter();
  const { playAudio } = useAudioPlayer();

  const [completed, setCompleted] = useState(false);
  const [tappedItems, setTappedItems] = useState<Set<string>>(new Set());

  // Flashcard & Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Find lesson
  let activeLesson = null;
  for (const chapter of QURAN_CURRICULUM) {
    const found = chapter.lessons.find(l => l.id === id);
    if (found) {
      activeLesson = found;
      break;
    }
  }

  // Quiz Options Logic
  const quizOptions = useMemo(() => {
    if (!activeLesson || activeLesson.type !== 'quiz' || !activeLesson.items) return [];
    const target = activeLesson.items[currentIndex];
    const others = activeLesson.items.filter(i => i.id !== target.id);
    // Shuffle others and take up to 3
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [target, ...shuffledOthers].sort(() => 0.5 - Math.random());
    return options;
  }, [activeLesson, currentIndex]);

  useEffect(() => {
    if (activeLesson && activeLesson.items) {
      if (tappedItems.size >= activeLesson.items.length && activeLesson.items.length > 0) {
        if (!completed) {
          setCompleted(true);
          markAsComplete();
        }
      }
    }
  }, [tappedItems, currentIndex]);

  const markAsComplete = async () => {
    try {
      const val = await AsyncStorage.getItem('imansync_learn_progress');
      const progress = val ? JSON.parse(val) : [];
      if (!progress.includes(id)) {
        progress.push(id);
        await AsyncStorage.setItem('imansync_learn_progress', JSON.stringify(progress));
      }
    } catch(e) {}
  };

  const handleGridPress = (item: LessonItem) => {
    if (item.audioUrl) playAudio(item.audioUrl);
    setTappedItems(prev => new Set(prev).add(item.id));
  };

  const handleNextSequential = () => {
    if (activeLesson?.items && currentIndex < activeLesson.items.length - 1) {
      setTappedItems(prev => new Set(prev).add(activeLesson.items![currentIndex].id));
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setSelectedAnswer(null);
    } else if (activeLesson?.items && currentIndex === activeLesson.items.length - 1) {
      setTappedItems(prev => new Set(prev).add(activeLesson.items![currentIndex].id));
    }
  };

  const handlePrevSequential = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
      setSelectedAnswer(null);
    }
  };

  const handleQuizAnswer = (item: LessonItem) => {
    if (selectedAnswer) return; // already answered
    const target = activeLesson!.items![currentIndex];
    setSelectedAnswer(item.id);
    if (item.id === target.id) {
      // Correct!
      setTimeout(() => {
        handleNextSequential();
      }, 1000);
    } else {
      // Wrong - let them try again after a delay
      setTimeout(() => {
        setSelectedAnswer(null);
      }, 1000);
    }
  };

  if (!activeLesson) return null;

  const progress = activeLesson.items ? 
    (activeLesson.type === 'grid' ? (tappedItems.size / activeLesson.items.length) : (currentIndex / activeLesson.items.length)) * 100 : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t(activeLesson.titleKey)} 
        titleAr="دَرْس" 
        showBack 
      />

      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
        <View style={[styles.progressBarFill, { backgroundColor: colors.highlight, width: `${progress}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* GRID UI */}
        {activeLesson.type === 'grid' && (
          <View style={styles.grid}>
            {activeLesson.items?.map(item => {
              const isTapped = tappedItems.has(item.id);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.gridItem, 
                    { backgroundColor: isTapped ? colors.highlight + '20' : colors.backgroundElement, borderColor: isTapped ? colors.highlight : colors.border }
                  ]}
                  onPress={() => handleGridPress(item)}
                >
                  <Text style={[styles.arabicText, { color: colors.text }]}>{item.arabic}</Text>
                  <Text style={[styles.translitText, { color: colors.textSecondary }]}>{item.transliteration}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* FLASHCARD UI */}
        {activeLesson.type === 'flashcard' && activeLesson.items && (
          <View style={styles.sequentialContainer}>
            <TouchableOpacity 
              style={[styles.flashcard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              onPress={() => {
                setFlipped(!flipped);
                if (!flipped && activeLesson!.items![currentIndex].audioUrl) {
                  playAudio(activeLesson!.items![currentIndex].audioUrl);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.flashcardArabic, { color: colors.text }]}>
                {activeLesson.items[currentIndex].arabic}
              </Text>
              
              {flipped ? (
                <Text style={[styles.flashcardTranslit, { color: colors.highlight }]}>
                  {activeLesson.items[currentIndex].transliteration}
                </Text>
              ) : (
                <Text style={[styles.tapToFlip, { color: colors.textSecondary }]}>
                  Tap to flip
                </Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.controls}>
              <TouchableOpacity onPress={handlePrevSequential} style={[styles.controlBtn, { backgroundColor: colors.border }]}>
                <ChevronLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextSequential} style={[styles.controlBtn, { backgroundColor: colors.highlight }]}>
                <ChevronRight size={24} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QUIZ UI */}
        {activeLesson.type === 'quiz' && activeLesson.items && (
          <View style={styles.sequentialContainer}>
            <TouchableOpacity 
              style={[styles.audioBtn, { backgroundColor: colors.highlight + '20', borderColor: colors.highlight }]}
              onPress={() => playAudio(activeLesson!.items![currentIndex].audioUrl)}
            >
              <Volume2 size={48} color={colors.highlight} />
              <Text style={[styles.tapToListen, { color: colors.highlight }]}>Tap to Listen</Text>
            </TouchableOpacity>

            <View style={styles.quizOptions}>
              {quizOptions.map(opt => {
                const isTarget = opt.id === activeLesson!.items![currentIndex].id;
                const isSelected = selectedAnswer === opt.id;
                
                let bgColor: string = colors.backgroundElement;
                let borderColor: string = colors.border;
                
                if (isSelected) {
                  bgColor = isTarget ? '#4CAF5030' : '#F4433630';
                  borderColor = isTarget ? '#4CAF50' : '#F44336';
                }

                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.quizOptBtn, { backgroundColor: bgColor, borderColor }]}
                    onPress={() => handleQuizAnswer(opt)}
                  >
                    <Text style={[styles.quizOptText, { color: colors.text }]}>{opt.arabic}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      {completed && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={[styles.completeBtn, { backgroundColor: colors.highlight }]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/quran-learn');
              }
            }}
          >
            <Check size={20} color={colors.background} />
            <Text style={[styles.completeBtnText, { color: colors.background }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  progressBarBg: {
    height: 4,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  container: {
    padding: Spacing.four,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'center',
  },
  gridItem: {
    width: (width - (Spacing.four * 2) - (Spacing.three * 2)) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    fontFamily: Fonts.arabic,
    fontSize: 40,
    marginTop: -10, // Slight nudge up to perfectly balance the diacritics
  },
  translitText: {
    position: 'absolute',
    bottom: 10,
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  // Sequential Styles (Flashcards & Quiz)
  sequentialContainer: {
    alignItems: 'center',
    marginTop: Spacing.six,
  },
  flashcard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
  },
  flashcardArabic: {
    fontFamily: Fonts.arabic,
    fontSize: 72,
    marginBottom: Spacing.four,
  },
  flashcardTranslit: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
    fontWeight: '600',
  },
  tapToFlip: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.six,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quiz Styles
  audioBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.six,
  },
  tapToListen: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  quizOptions: {
    width: '100%',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: Spacing.four,
    justifyContent: 'center',
  },
  quizOptBtn: {
    width: '45%',
    aspectRatio: 1.5,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizOptText: {
    fontFamily: Fonts.arabic,
    fontSize: 42,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
    borderTopWidth: 1,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  completeBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
  }
});
