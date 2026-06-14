import React, { useState, useMemo, useEffect } from 'react';
import ThemeCard from '@/components/ThemeCard';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { Target, Edit3, X, Plus, Minus, History, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { useReadingStore } from '@/store/readingStore';
import { formatNumber } from '@/utils/formatNumber';
import PageHeader from '@/components/page-header';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';

const generatePastDays = (days: number) => {
  const arr = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    arr.push(getLocalYYYYMMDD(d));
  }
  return arr;
};

export default function QuranTrackerScreen() {
  const colors = useThemeColors();
  const isDark = colors.background === '#0c1618';
  const activeQuranColor = isDark ? colors.accent : colors.highlight;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const readingStore = useReadingStore();

  const todayStr = getLocalYYYYMMDD();
  const pagesReadToday = readingStore.historyLog[todayStr] || 0;
  const isGoalMet = pagesReadToday >= readingStore.dailyGoalPages;

  const [noteText, setNoteText] = useState(readingStore.notesLog[todayStr] || '');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [historyModalDate, setHistoryModalDate] = useState<string | null>(null);

  const saveNote = () => {
    readingStore.setNote(todayStr, noteText.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleGoalChange = (delta: number) => {
    const newGoal = Math.max(1, readingStore.dailyGoalPages + delta);
    readingStore.setDailyGoal(newGoal);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    readingStore.initialize();
  }, []);

  const past30Days = useMemo(() => generatePastDays(30), [todayStr]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('quran.trackerTitle', { defaultValue: 'Reading Tracker' })} showBack onBack={() => router.back()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Progress Overview Card */}
          <ThemeCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                <Target size={20} color={isGoalMet ? colors.highlight : activeQuranColor} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('quran.todayProgress', { defaultValue: "Today's Progress" })}</Text>
              </View>
              {isGoalMet && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.highlight + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <CheckCircle2 size={14} color={colors.highlight} />
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.highlight, fontWeight: '600' }}>{t('quran.goalMet', { defaultValue: 'Goal Met' })}</Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(pagesReadToday, i18n.language)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('quran.pagesRead', { defaultValue: 'Pages Read' })}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.textSecondary + '20' }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: activeQuranColor }]}>{formatNumber(readingStore.currentStreak, i18n.language)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('quran.currentStreak', { defaultValue: 'Current Streak' })}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.textSecondary + '20' }]} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(readingStore.longestStreak, i18n.language)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('quran.longestStreak', { defaultValue: 'Longest Streak' })}</Text>
              </View>
            </View>

            <View style={styles.quickAddRow}>
              <TouchableOpacity activeOpacity={1} 
                style={[styles.quickAddBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.textSecondary + '20', borderWidth: 1, paddingHorizontal: 24 }]}
                onPress={() => {
                  if (pagesReadToday > 0) readingStore.addPagesRead(-1);
                }}
              >
                <Minus size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1} 
                style={[styles.quickAddBtn, { backgroundColor: isGoalMet ? colors.highlight + '22' : activeQuranColor + '22', flex: 2, borderColor: isGoalMet ? colors.highlight : activeQuranColor, borderWidth: 1 }]}
                onPress={() => {
                  readingStore.addPagesRead(1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Plus size={20} color={isGoalMet ? colors.highlight : activeQuranColor} />
                <Text style={[styles.quickAddText, { color: isGoalMet ? colors.highlight : activeQuranColor }]}>{t('quran.addPage', { defaultValue: 'Add Page' })}</Text>
              </TouchableOpacity>
            </View>
          </ThemeCard>

          {/* Goal Customization */}
          <ThemeCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('quran.dailyGoal', { defaultValue: 'Daily Goal' })}</Text>
              <TouchableOpacity activeOpacity={1} onPress={() => setIsEditingGoal(!isEditingGoal)}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 14, color: activeQuranColor, fontWeight: '600' }}>
                  {isEditingGoal ? t('common.done', { defaultValue: 'Done' }) : t('common.edit', { defaultValue: 'Edit' })}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.textSecondary }}>
                {t('quran.targetPages', { count: formatNumber(readingStore.dailyGoalPages, i18n.language), defaultValue: `${readingStore.dailyGoalPages} Pages / Day` })}
              </Text>
              
              {isEditingGoal && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                  <TouchableOpacity activeOpacity={1} onPress={() => handleGoalChange(-1)} style={[styles.goalBtn, { backgroundColor: colors.backgroundElement, borderWidth: 1, borderColor: colors.textSecondary + '20' }]}>
                    <Minus size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 18, color: colors.text, fontWeight: '600', width: 24, textAlign: 'center' }}>
                    {formatNumber(readingStore.dailyGoalPages, i18n.language)}
                  </Text>
                  <TouchableOpacity activeOpacity={1} onPress={() => handleGoalChange(1)} style={[styles.goalBtn, { backgroundColor: activeQuranColor }]}>
                    <Plus size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ThemeCard>

          {/* Daily Reflection / Notes */}
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('quran.dailyReflection', { defaultValue: "Today's Reflection" })}</Text>
            <ThemeCard  style={styles.noteContainer}>
              <TextInput
                style={[styles.noteInput, { color: colors.text }]}
                placeholder={t('quran.writeNote', { defaultValue: 'Write down what you learned or felt today...' })}
                placeholderTextColor={colors.textSecondary + '88'}
                multiline
                value={noteText}
                onChangeText={setNoteText}
                onBlur={saveNote}
                textAlignVertical="top"
              />
            </ThemeCard>
          </View>

          {/* Reading History (Heatmap) */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three }}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>{t('quran.history', { defaultValue: 'Reading History (30 Days)' })}</Text>
              <History size={16} color={colors.textSecondary} />
            </View>
            
            <ThemeCard style={styles.card}>
              <View style={styles.heatmapGrid}>
                {past30Days.map((dateStr) => {
                  const pages = readingStore.historyLog[dateStr] || 0;
                  const hasNote = !!readingStore.notesLog[dateStr];
                  const safeGoal = Number(readingStore.dailyGoalPages) || 3;
                  let bgColor: string = colors.textSecondary + '30';
                  let opacity = 1;
                  
                  if (pages > 0) {
                    bgColor = pages >= safeGoal ? colors.highlight : activeQuranColor;
                    opacity = pages >= safeGoal ? 1 : 0.6;
                  }

                  return (
                    <TouchableOpacity activeOpacity={1}
                      key={dateStr}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setHistoryModalDate(dateStr);
                      }}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: bgColor, opacity }
                      ]}
                    >
                      {hasNote && <View style={[styles.noteDot, { backgroundColor: pages > 0 ? '#FFF' : activeQuranColor }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.four, gap: Spacing.two }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary }}>{t('common.less', { defaultValue: 'Less' })}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[0.3, 0.5, 0.7, 1].map((op, idx) => (
                    <View key={idx} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: colors.highlight, opacity: op }} />
                  ))}
                </View>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary }}>{t('common.more', { defaultValue: 'More' })}</Text>
              </View>
            </ThemeCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* History Detail Modal */}
      {historyModalDate && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setHistoryModalDate(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setHistoryModalDate(null)}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            
            <ThemeCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {new Date(historyModalDate).toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity activeOpacity={1} onPress={() => setHistoryModalDate(null)} style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', marginVertical: Spacing.four }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 48, color: colors.highlight, fontWeight: '700' }}>
                  {formatNumber(readingStore.historyLog[historyModalDate] || 0, i18n.language)}
                </Text>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.textSecondary, marginTop: 4 }}>
                  {t('quran.pagesRead', { defaultValue: 'Pages Read' })}
                </Text>
              </View>

              {readingStore.notesLog[historyModalDate] ? (
                <View style={{ marginTop: Spacing.two }}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('quran.reflection', { defaultValue: 'Reflection' })}</Text>
                  <View style={{ backgroundColor: colors.backgroundElement, padding: Spacing.four, borderRadius: 16, borderWidth: 1, borderColor: colors.textSecondary + '20' }}>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 15, color: colors.text, lineHeight: 22 }}>
                      {readingStore.notesLog[historyModalDate]}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', marginTop: Spacing.two, padding: Spacing.four }}>
                  <Edit3 size={24} color={colors.textSecondary} opacity={0.5} style={{ marginBottom: Spacing.two }} />
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                    {t('quran.noNotes', { defaultValue: 'No reflections recorded for this day.' })}
                  </Text>
                </View>
              )}
            </ThemeCard>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: Spacing.four, flexDirection: 'column', gap: Spacing.four },
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  cardTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Fonts.outfit,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: '60%',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: Spacing.two,
  },
  quickAddText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '600',
  },
  goalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
    marginBottom: Spacing.three,
    marginLeft: Spacing.one,
  },
  noteContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
    minHeight: 120,
  },
  noteInput: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  heatmapCell: {
    width: Math.floor((Dimensions.get('window').width - 100) / 7),
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalCard: { padding: Spacing.four, borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontFamily: Fonts.outfit, fontSize: 18, textTransform: 'capitalize' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
