import ThemeCard from '@/components/ThemeCard';
import PageHeader from '@/components/page-header';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Activity, BookOpen, CheckCircle2, HandCoins, Heart, RotateCcw, X, History } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, AppState, Modal, Dimensions } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import { useQadaStore } from '@/store/qadaStore';
// @ts-ignore
import ConfettiCannon from 'react-native-confetti-cannon';

const DAILY_TASKS = [
  { id: 'fajr', icon: Activity },
  { id: 'dhuhr', icon: Activity },
  { id: 'asr', icon: Activity },
  { id: 'maghrib', icon: Activity },
  { id: 'isha', icon: Activity },
  { id: 'quran', icon: BookOpen },
  { id: 'charity', icon: HandCoins },
  { id: 'istighfar', icon: RotateCcw },
  { id: 'dhikr', icon: Heart },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const getLocalYYYYMMDD = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TaskCard = ({ task, isDone, onToggle, colors, t }: { task: typeof DAILY_TASKS[0], isDone: boolean, onToggle: (id: string) => void, colors: any, t: any }) => {
  const scale = useSharedValue(1);
  const Icon = task.icon;

  useEffect(() => {
    scale.value = withSpring(isDone ? 0.95 : 1, { damping: 12 });
  }, [isDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.taskCardWrapper, animatedStyle]}>
      <ThemeCard
        intensity={isDone ? 70 : 25}
        
        style={[
          styles.taskCardBlur,
          isDone && { borderColor: colors.accent, borderWidth: 1.5 },
          !isDone && { borderColor: colors.border, borderWidth: 1 },
        ]}
      >
        <TouchableOpacity
          style={styles.taskCard}
          activeOpacity={0.75}
          onPress={() => {
            onToggle(task.id);
          }}
        >
          {/* Label — centred and big */}
          <Text
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[
              styles.taskCardLabel,
              { color: isDone ? colors.textSecondary : colors.text },
              isDone && { textDecorationLine: 'line-through' },
            ]}
          >
            {t('tracker.tasks.' + task.id)}
          </Text>

          {/* Tiny icon — bottom-right */}
          <View style={styles.taskCardIcon}>
            <Icon size={12} color={isDone ? colors.accent : colors.textSecondary} />
          </View>

          {/* Check badge — top-right */}
          {isDone && (
            <View style={[styles.taskCardCheck, { backgroundColor: colors.accent + '22' }]}>
              <CheckCircle2 size={12} color={colors.accent} />
            </View>
          )}
        </TouchableOpacity>
      </ThemeCard>
    </Animated.View>
  );
};

export default function TrackerScreen() {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [history, setHistory] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  const [todayStr, setTodayStr] = useState(getLocalYYYYMMDD());

  // New features state
  const [showConfetti, setShowConfetti] = useState(false);
  const [historyModalDate, setHistoryModalDate] = useState<string | null>(null);

  const qadaStore = useQadaStore();

  useEffect(() => {
    qadaStore.initialize();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setTodayStr(getLocalYYYYMMDD());
      }
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('imansync_tracker_history').then(val => {
        if (val) {
          try {
            setHistory(JSON.parse(val));
          } catch (e) {
            console.error('Corrupted tracker history, resetting', e);
            setHistory({});
          }
        } else {
          AsyncStorage.getItem('imansync_tracker_tasks').then(oldVal => {
            if (oldVal) {
              try {
                const parsed = JSON.parse(oldVal);
                setHistory({ [todayStr]: parsed });
                AsyncStorage.setItem('imansync_tracker_history', JSON.stringify({ [todayStr]: parsed })).catch(console.error);
              } catch (e) {
                console.error('Corrupted legacy tracker data, ignoring', e);
              }
            }
          });
        }
      }).catch(err => console.error('Error loading history', err))
        .finally(() => setLoading(false));
    }, [todayStr])
  );

  const toggleTask = (id: string) => {
    const currentDayStr = getLocalYYYYMMDD();
    setHistory(prev => {
      const todayData = prev[currentDayStr] || {};
      const wasCompletedCount = DAILY_TASKS.filter(t => todayData[t.id]).length;

      const nextToday = { ...todayData, [id]: !todayData[id] };
      const nextHistory = { ...prev, [currentDayStr]: nextToday };
      AsyncStorage.setItem('imansync_tracker_history', JSON.stringify(nextHistory)).catch(console.error);

      const newCompletedCount = DAILY_TASKS.filter(t => nextToday[t.id]).length;

      if (newCompletedCount === DAILY_TASKS.length && wasCompletedCount !== DAILY_TASKS.length) {
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
        setShowConfetti(true);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return nextHistory;
    });
  };

  const completedTasks = history[todayStr] || {};
  const completedCount = DAILY_TASKS.filter(t => completedTasks[t.id]).length;
  const progressPercentage = Math.round((completedCount / DAILY_TASKS.length) * 100) || 0;

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

  const getChartData = (days: number) => {
    const pastDays = generatePastDays(days);
    const bars = pastDays.map(dateStr => {
      const dayTasks = history[dateStr] || {};
      const cCount = DAILY_TASKS.filter(t => dayTasks[t.id]).length;
      return Math.round((cCount / DAILY_TASKS.length) * 100) || 0;
    });
    const avg = bars.length ? Math.round(bars.reduce((a, b) => a + b, 0) / days) : 0;
    return { pastDays, bars, avg };
  };

  const weeklyData = useMemo(() => getChartData(7), [history, todayStr]);
  const monthlyData = useMemo(() => getChartData(30), [history, todayStr]);

  const displayPercentage = activeTab === 'Daily' ? progressPercentage : activeTab === 'Weekly' ? weeklyData.avg : monthlyData.avg;

  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withTiming(displayPercentage, { duration: 600 });
  }, [displayPercentage]);

  const radius = 28;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference - (circumference * animatedProgress.value) / 100,
    };
  });

  const renderDaily = () => (
    <View style={styles.gridSection}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('tracker.checklist')}</Text>
      <View style={styles.taskGrid}>
        {DAILY_TASKS.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isDone={!!completedTasks[task.id]}
            onToggle={toggleTask}
            colors={colors}
            t={t}
          />
        ))}
      </View>
    </View>
  );

  const getChartDescMsg = (avg: number) => {
    const formattedAvg = formatNumber(avg.toFixed(0), i18n.language);
    if (avg === 100) return t('tracker.chartMsg_100', { avg: formattedAvg });
    if (avg >= 80) return t('tracker.chartMsg_99', { avg: formattedAvg });
    if (avg >= 60) return t('tracker.chartMsg_80', { avg: formattedAvg });
    if (avg >= 30) return t('tracker.chartMsg_60', { avg: formattedAvg });
    if (avg > 0) return t('tracker.chartMsg_30', { avg: formattedAvg });
    return t('tracker.chartMsg_0', { avg: formattedAvg });
  };

  const renderRealChart = (days: number, title: string, chartData: any) => {
    const { pastDays, bars, avg } = chartData;

    return (
      <View style={styles.gridSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.four }]}>
          {t('tracker.consistency', { title })}
        </Text>
        <ThemeCard intensity={40}  style={[styles.chartCard, { borderColor: colors.border }]}>
          <View style={styles.chartContainer}>
            {bars.map((val: number, i: number) => (
              <TouchableOpacity
                key={i}
                style={[styles.chartBarWrapper, { justifyContent: 'flex-end' }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setHistoryModalDate(pastDays[i]);
                }}
              >
                <AnimatedProgressBar
                  progress={loading ? 0 : Math.max(val, val > 0 ? 2 : 0)}
                  color={val === 100 ? colors.accent : val > 0 ? colors.highlight : colors.border}
                  trackColor="transparent"
                  height={undefined as any}
                  duration={800}
                  style={{ width: '100%', flex: 1, borderRadius: 4, transform: [{ rotate: '180deg' }] }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.heatmapGrid, days === 7 ? styles.heatmapWeekly : styles.heatmapMonthly]}>
            {bars.map((val: number, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  Haptics.selectionAsync();
                  setHistoryModalDate(pastDays[i]);
                }}
                style={[
                  styles.heatmapCell,
                  days === 7 && styles.heatmapCellWeekly,
                  {
                    backgroundColor: val === 100 ? colors.accent : val > 0 ? colors.highlight : colors.border,
                    opacity: val === 100 ? 1 : val > 0 ? 0.6 : 0.3
                  }
                ]}
              />
            ))}
          </View>

          <Text style={[styles.chartDesc, { color: colors.textSecondary }]}>
            {getChartDescMsg(avg)}
          </Text>
          <Text style={[styles.chartDesc, { color: colors.textSecondary, fontSize: 11, opacity: 0.6, marginTop: 8 }]}>
            {t('tracker.clickBarsHint', { defaultValue: 'Click on the bars to view daily details' })}
          </Text>
        </ThemeCard>
      </View>
    );
  };

  const getEncouragementMsg = (percent: number) => {
    if (percent === 100) return t('tracker.msg_100');
    if (percent >= 80) return t('tracker.msg_99');
    if (percent >= 60) return t('tracker.msg_80');
    if (percent >= 40) return t('tracker.msg_60');
    if (percent >= 20) return t('tracker.msg_40');
    if (percent > 0) return t('tracker.msg_20');
    return t('tracker.msg_0');
  };

  const totalKazaNamaj = qadaStore.fajr + qadaStore.dhuhr + qadaStore.asr + qadaStore.maghrib + qadaStore.isha + qadaStore.witr;

  const isKazaFree = totalKazaNamaj === 0;
  const chipColor = isKazaFree ? colors.textSecondary : '#ef4444';
  const chipBg = isKazaFree ? 'transparent' : '#ef444422';
  const chipBorder = isKazaFree ? colors.border : '#ef4444';

  const kazaChip = (
    <TouchableOpacity 
      activeOpacity={0.7}
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: chipBg, 
        paddingHorizontal: 10, 
        paddingVertical: 5, 
        borderRadius: 14, 
        borderWidth: 1, 
        borderColor: chipBorder 
      }}
      onPress={() => {
        Haptics.selectionAsync();
        router.push('/qada-tracker' as any);
      }}
    >
      <History size={12} color={chipColor} style={{ marginRight: 4 }} />
      <Text style={{ 
        fontFamily: Fonts.outfit, 
        fontSize: 12, 
        color: chipColor, 
        fontWeight: '600' 
      }}>
        {t('tracker.kazaChip', { namaj: formatNumber(totalKazaNamaj, i18n.language), defaultValue: `${formatNumber(totalKazaNamaj, i18n.language)} N` })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('tracker.titleEn')} titleAr={t('tracker.titleAr')} rightElement={kazaChip} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          {['Daily', 'Weekly', 'Monthly'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: colors.highlight }]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab as any);
              }}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.highlight : colors.textSecondary }]}>{t('tracker.' + tab.toLowerCase())}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <>
            <ThemeCard intensity={50}  style={[styles.progressCard, { borderColor: colors.border }]}>
              <View style={styles.progressHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.progressTitle, { color: colors.text }]}>
                    {activeTab === 'Daily' ? t('tracker.progress') : activeTab === 'Weekly' ? t('tracker.weeklyOverview') : t('tracker.monthly')}
                  </Text>
                  <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                    {activeTab === 'Daily'
                      ? i18n.language === 'bn' ? `${formatNumber(completedCount, 'bn')}/${formatNumber(DAILY_TASKS.length, 'bn')} কাজ সম্পন্ন` : `${completedCount}/${DAILY_TASKS.length} tasks done`
                      : t('tracker.consistency', { title: activeTab === 'Weekly' ? t('tracker.weekly') : t('tracker.monthly') })}
                  </Text>
                </View>

                <View style={styles.progressCircleContainer}>
                  <Svg width={64} height={64} viewBox="0 0 64 64" style={[styles.svgAbsolute, { transform: [{ rotate: '-90deg' }] }]}>
                    <Circle cx={32} cy={32} r={radius} stroke={colors.textSecondary} strokeOpacity={0.15} strokeWidth={strokeWidth} fill="none" />
                    <AnimatedCircle
                      cx={32}
                      cy={32}
                      r={radius}
                      stroke={colors.accent}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      animatedProps={animatedCircleProps}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <View style={styles.progressTextContainer}>
                    <Text style={[styles.progressText, { color: colors.accent }]}>
                      {formatNumber(displayPercentage, i18n.language)}%
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.encouragement, { color: colors.accent }]}>
                {getEncouragementMsg(displayPercentage)}
              </Text>
            </ThemeCard>


            {activeTab === 'Daily' && renderDaily()}
            {activeTab === 'Weekly' && renderRealChart(7, t('tracker.weekly'), weeklyData)}
            {activeTab === 'Monthly' && renderRealChart(30, t('tracker.monthly'), monthlyData)}
        </>
        </ScrollView>

      {/* Interactive History Modal */}
      {historyModalDate && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setHistoryModalDate(null)}>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setHistoryModalDate(null)}>
              <ThemeCard intensity={30} style={StyleSheet.absoluteFill} />
            </TouchableOpacity>
            <ThemeCard intensity={80} style={[styles.modalCard, { borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {new Date(historyModalDate).toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => setHistoryModalDate(null)} style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.5 }} showsVerticalScrollIndicator={false}>
                {DAILY_TASKS.map(task => {
                  const isDone = history[historyModalDate]?.[task.id];
                  const Icon = task.icon;
                  return (
                    <View key={task.id} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.historyRowLeft}>
                        <Icon size={18} color={isDone ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.historyRowText, { color: isDone ? colors.text : colors.textSecondary }]}>
                          {t('tracker.tasks.' + task.id)}
                        </Text>
                      </View>
                      {isDone ? (
                        <CheckCircle2 size={18} color={colors.accent} />
                      ) : (
                        <View style={[styles.historyEmptyCircle, { borderColor: colors.border }]} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </ThemeCard>
          </View>
        </Modal>
      )}

      {/* Visual Reward Layer */}
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon
            count={120}
            origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3000}
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: Spacing.four, paddingTop: 0 },
  tabsContainer: { flexDirection: 'row', marginBottom: Spacing.two, borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingBottom: 8, alignItems: 'center' },
  tabText: { fontFamily: Fonts.outfit, fontSize: 16 },
  progressCard: { padding: Spacing.five, borderRadius: 24, marginBottom: Spacing.three, overflow: 'hidden', borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  progressTitle: { fontFamily: Fonts.outfit, fontSize: 22, marginBottom: 4 },
  progressSubtitle: { fontFamily: Fonts.outfit, fontSize: 14 },
  progressCircleContainer: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  svgAbsolute: { position: 'absolute' },
  progressTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  progressText: { fontFamily: Fonts.outfit, fontSize: 15 },
  encouragement: { fontFamily: Fonts.outfit, fontSize: 14, fontStyle: 'italic', marginTop: Spacing.two },
  sectionTitle: { fontFamily: Fonts.outfit, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.6, marginBottom: Spacing.two, height: 15 },
  gridSection: { flex: 1 },
  taskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  taskCardWrapper: { width: '31%', aspectRatio: 1 },
  taskCardBlur: { borderRadius: 18, overflow: 'hidden', flex: 1 },
  taskCard: { flex: 1, padding: 10, alignItems: 'center', justifyContent: 'center' },
  taskCardIcon: { position: 'absolute', bottom: 8, right: 8, width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  taskCardLabel: { fontFamily: Fonts.outfit, fontSize: 14, flexShrink: 1, textAlign: 'center', marginBottom: 16 },
  taskCardCheck: { position: 'absolute', top: 6, right: 6, borderRadius: 6, padding: 2 },
  chartCard: { padding: Spacing.four, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  chartContainer: { flexDirection: 'row', height: 150, alignItems: 'flex-end', justifyContent: 'space-between' },
  chartBarWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end', paddingHorizontal: 2 },
  chartBar: { borderRadius: 4, width: '100%' },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: Spacing.four, marginTop: Spacing.four },
  heatmapWeekly: { gap: 12 },
  heatmapMonthly: { gap: 6 },
  heatmapCell: { width: 14, height: 14, borderRadius: 4 },
  heatmapCellWeekly: { width: 24, height: 24, borderRadius: 8 },
  chartDesc: { fontFamily: Fonts.outfit, fontSize: 14, textAlign: 'center' },

  // Modal Styles
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: Spacing.four },
  modalCard: { padding: Spacing.five, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
  modalTitle: { fontFamily: Fonts.outfit, fontSize: 18, textTransform: 'capitalize' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  historyRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyRowText: { fontFamily: Fonts.outfit, fontSize: 15 },
  historyEmptyCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, opacity: 0.5 }
});
