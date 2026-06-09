import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle, Brain, RefreshCw, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring, withTiming, runOnJS, useSharedValue, FadeInDown } from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';

import { Fonts, Spacing, useThemeColors, useThemeStyles } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/utils/formatNumber';
import triviaData from '@/data/trivia.json';

const { width } = Dimensions.get('window');

// Shuffle array utility
function shuffle(array: any[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TriviaScreen() {
  const colors = useThemeColors();
  const themeStyles = useThemeStyles();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cardOffset = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  // Initialize quiz with random questions
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const shuffled = shuffle(triviaData).slice(0, 20);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsFinished(false);
    cardOffset.value = 0;
    cardOpacity.value = 1;
  };

  const handleOptionPress = (index: number) => {
    if (selectedOption !== null) return; // Prevent double taps
    
    setSelectedOption(index);
    const isCorrect = index === questions[currentIndex].correctIndex;
    
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cardOffset.value = withTiming(-width, { duration: 300 }, () => {
      runOnJS(advanceState)();
    });
  };

  const advanceState = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      cardOffset.value = width;
      cardOffset.value = withSpring(0, { damping: 30, stiffness: 120 });
    } else {
      setIsFinished(true);
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardOffset.value }],
    opacity: cardOpacity.value,
  }));

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={1} onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('trivia.title', { defaultValue: 'Islamic Trivia' })}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {isFinished ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.resultContainer}>
            <Brain size={64} color={colors.textSecondary} style={{ marginBottom: Spacing.four }} />
            <Text style={[styles.resultTitle, { color: colors.text }]}>{t('trivia.quizCompleted', { defaultValue: 'Quiz Completed!' })}</Text>
            <Text style={[styles.resultScore, { color: colors.highlight }]}>
              {formatNumber(score, i18n.language)} / {formatNumber(questions.length, i18n.language)}
            </Text>
            
            <View style={[styles.resultMsgBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Text style={[styles.resultMsg, { color: colors.textSecondary }]}>
                {score === questions.length ? t('trivia.perfectScore', { defaultValue: "Perfect! Excellent knowledge! MashaAllah!" }) : 
                 score >= questions.length / 2 ? t('trivia.goodScore', { defaultValue: "Good job! Keep learning!" }) : 
                 t('trivia.lowScore', { defaultValue: "A great opportunity to learn more!" })}
              </Text>
            </View>

            <TouchableOpacity activeOpacity={1} 
              style={[styles.retryBtn, { backgroundColor: colors.accent }]}
              onPress={startNewGame}
            >
              <RefreshCw size={20} color="#FFF" />
              <Text style={styles.retryText}>{t('trivia.playAgain', { defaultValue: 'Play Again' })}</Text>
            </TouchableOpacity>

            {score === questions.length && (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <ConfettiCannon count={100} origin={{x: width/2, y: -20}} fallSpeed={2500} fadeOut autoStart />
              </View>
            )}
          </Animated.View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Progress Bar */}
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>{t('trivia.questionOf', { current: formatNumber(currentIndex + 1, i18n.language), total: formatNumber(questions.length, i18n.language), defaultValue: `Question ${currentIndex + 1} of ${questions.length}` })}</Text>
              <Text style={[styles.scoreText, { color: colors.highlight }]}>{t('trivia.score', { score: formatNumber(score, i18n.language), defaultValue: `Score: ${score}` })}</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: `${((currentIndex) / questions.length) * 100}%` }]} />
            </View>

            <Animated.View style={[styles.card, themeStyles.cardShadow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }, animatedCardStyle]}>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {isBn && currentQ.question_bn ? currentQ.question_bn : currentQ.question}
              </Text>

              <View style={styles.optionsList}>
                {(isBn && currentQ.options_bn ? currentQ.options_bn : currentQ.options).map((opt: string, idx: number) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === currentQ.correctIndex;
                  const showCorrect = selectedOption !== null && isCorrectAnswer;
                  const showWrong = isSelected && !isCorrectAnswer;

                  return (
                    <TouchableOpacity activeOpacity={1}
                      key={idx}
                      disabled={selectedOption !== null}
                      onPress={() => handleOptionPress(idx)}
                      style={[
                        styles.optionBtn,
                        { borderColor: colors.border, backgroundColor: colors.background },
                        showCorrect && { borderColor: '#4caf50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
                        showWrong && { borderColor: '#f44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                      ]}
                    >
                      <Text style={[styles.optionText, { color: colors.text }, showCorrect && { color: '#4caf50', fontWeight: '600' }, showWrong && { color: '#f44336' }]}>
                        {opt}
                      </Text>
                      {showCorrect && <CheckCircle2 size={20} color="#4caf50" />}
                      {showWrong && <XCircle size={20} color="#f44336" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedOption !== null && (
                <Animated.View entering={FadeInDown.duration(300)} style={[styles.explanationBox, { backgroundColor: colors.textSecondary + '10', borderColor: colors.textSecondary + '20' }]}>
                  <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                    {isBn && currentQ.explanation_bn ? currentQ.explanation_bn : currentQ.explanation}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>

            {selectedOption !== null && (
              <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.footer}>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.nextBtn, { backgroundColor: colors.highlight, width: 64, height: 64, borderRadius: 32, alignSelf: 'flex-end', justifyContent: 'center' }]}
                  onPress={nextQuestion}
                >
                  <ArrowRight size={28} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
      </View>
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
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontFamily: Fonts.outfit, fontSize: 18, fontWeight: '600' },
  container: { flex: 1, padding: Spacing.four },
  
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.two },
  progressText: { fontFamily: Fonts.outfit, fontSize: 14 },
  scoreText: { fontFamily: Fonts.outfit, fontSize: 14, fontWeight: '600' },
  progressBarBg: { height: 6, borderRadius: 3, marginBottom: Spacing.six, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  card: {
    borderRadius: 24,
    padding: Spacing.five,
    borderWidth: 1,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    elevation: 4,
  },
  questionText: { fontFamily: Fonts.outfit, fontSize: 22, lineHeight: 32, marginBottom: Spacing.six, textAlign: 'center' },
  optionsList: { gap: Spacing.three },
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionText: { fontFamily: Fonts.outfit, fontSize: 16, flex: 1, marginRight: Spacing.three },
  explanationBox: {
    marginTop: Spacing.five,
    padding: Spacing.four,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationText: { fontFamily: Fonts.outfit, fontSize: 14, lineHeight: 20 },

  footer: { marginTop: 'auto', paddingTop: Spacing.four },
  nextBtn: {
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextText: { fontFamily: Fonts.outfit, fontSize: 18, color: '#FFF', fontWeight: '600' },

  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  resultTitle: { fontFamily: Fonts.outfit, fontSize: 28, fontWeight: '600', marginBottom: Spacing.two },
  resultScore: { fontFamily: Fonts.outfit, fontSize: 48, fontWeight: '700', marginBottom: Spacing.five },
  resultMsgBox: { padding: Spacing.five, borderRadius: 20, borderWidth: 1, width: '100%', alignItems: 'center', marginBottom: Spacing.six },
  resultMsg: { fontFamily: Fonts.outfit, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.six,
    borderRadius: 20,
  },
  retryText: { fontFamily: Fonts.outfit, fontSize: 18, color: '#FFF', fontWeight: '600' },
});
