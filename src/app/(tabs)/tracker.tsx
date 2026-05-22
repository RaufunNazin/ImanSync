import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Activity, BookOpen, CheckCircle2, HandCoins, Heart, Moon } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useThemeStore } from '@/store/themeStore';

const DAILY_TASKS = [
  { id: 'fajr', icon: Activity },
  { id: 'dhuhr', icon: Activity },
  { id: 'asr', icon: Activity },
  { id: 'maghrib', icon: Activity },
  { id: 'isha', icon: Activity },
  { id: 'quran', icon: BookOpen },
  { id: 'charity', icon: HandCoins },
  { id: 'fasting', icon: Moon },
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
      <BlurView
        intensity={isDone ? 70 : 25}
        tint={colors.glassTint as any}
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      </BlurView>
    </Animated.View>
  );
};

export default function TrackerScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [history, setHistory] = useState<Record<string, Record<string, boolean>>>({});
  
  const todayStr = useMemo(() => getLocalYYYYMMDD(), []);

  useEffect(() => {
    AsyncStorage.getItem('deen_tracker_history').then(val => {
      if (val) {
        setHistory(JSON.parse(val));
      } else {
        // Migration from old logic if exists
        AsyncStorage.getItem('deen_tracker_tasks').then(oldVal => {
          if (oldVal) {
            const parsed = JSON.parse(oldVal);
            setHistory({ [todayStr]: parsed });
            AsyncStorage.setItem('deen_tracker_history', JSON.stringify({ [todayStr]: parsed }));
          }
        });
      }
    }).catch(err => console.error("Error loading history", err));
  }, [todayStr]);

  const toggleTask = (id: string) => {
    setHistory(prev => {
      const todayData = prev[todayStr] || {};
      const nextToday = { ...todayData, [id]: !todayData[id] };
      const nextHistory = { ...prev, [todayStr]: nextToday };
      AsyncStorage.setItem('deen_tracker_history', JSON.stringify(nextHistory));
      
      // If completed 100% just now, do a heavy haptic
      const newCompletedCount = Object.values(nextToday).filter(Boolean).length;
      if (newCompletedCount === DAILY_TASKS.length) {
        setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
      }
      
      return nextHistory;
    });
  };

  const completedTasks = history[todayStr] || {};
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercentage = Math.round((completedCount / DAILY_TASKS.length) * 100) || 0;

  // Animated Circular Progress
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withTiming(progressPercentage, { duration: 600 });
  }, [progressPercentage]);

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
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('tracker.checklist')}</Text>
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

  const getChartDescMsg = (avg: number) => {
    const formattedAvg = formatNumber(avg.toFixed(0), i18n.language);
    if (avg === 100) return t('tracker.chartMsg_100', { avg: formattedAvg });
    if (avg >= 80) return t('tracker.chartMsg_99', { avg: formattedAvg });
    if (avg >= 60) return t('tracker.chartMsg_80', { avg: formattedAvg });
    if (avg >= 30) return t('tracker.chartMsg_60', { avg: formattedAvg });
    if (avg > 0) return t('tracker.chartMsg_30', { avg: formattedAvg });
    return t('tracker.chartMsg_0', { avg: formattedAvg });
  };

  const renderRealChart = (days: number, title: string) => {
    const pastDays = generatePastDays(days);
    const bars = pastDays.map(dateStr => {
      const dayTasks = history[dateStr] || {};
      const cCount = Object.values(dayTasks).filter(Boolean).length;
      return Math.round((cCount / DAILY_TASKS.length) * 100) || 0;
    });

    const avg = bars.reduce((a, b) => a + b, 0) / days;

    return (
      <View style={styles.gridSection}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.four }]}>
          {t('tracker.consistency', { title })}
        </Text>
        <BlurView intensity={40} tint={colors.glassTint as any} style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {bars.map((val, i) => (
              <View key={i} style={styles.chartBarWrapper}>
                <View style={[
                  styles.chartBar, 
                  { 
                    height: `${Math.max(val, 2)}%`, 
                    backgroundColor: val === 100 ? colors.accent : val > 0 ? colors.highlight : colors.border 
                  }
                ]} />
              </View>
            ))}
          </View>
          
          {/* Calendar Heatmap Grid */}
          <View style={[styles.heatmapGrid, days === 7 ? styles.heatmapWeekly : styles.heatmapMonthly]}>
            {bars.map((val, i) => (
              <View 
                key={i} 
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
        </BlurView>
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('tracker.titleEn')} titleAr={t('tracker.titleAr')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        {/* Segmented Control */}
        <BlurView intensity={30} tint={colors.glassTint as any} style={styles.segmentContainer}>
          {['Daily', 'Weekly', 'Monthly'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.segmentTab, activeTab === tab && { backgroundColor: colors.highlight }]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab as any);
              }}
            >
              <Text style={[styles.segmentText, activeTab === tab && { color: '#FFF' }]}>{t('tracker.' + tab.toLowerCase())}</Text>
            </TouchableOpacity>
          ))}
        </BlurView>

        {/* Visual Progress Card */}
        <BlurView intensity={50} tint={colors.glassTint as any} style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                {activeTab === 'Daily' ? t('tracker.progress') : activeTab === 'Weekly' ? t('tracker.weeklyOverview') : t('tracker.monthly')}
              </Text>
              <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
                {activeTab === 'Daily' ? t('tracker.tasksCompleted', { 
                  count: formatNumber(completedCount, i18n.language), 
                  total: formatNumber(DAILY_TASKS.length, i18n.language) 
                }) : t('tracker.trackingCons')}
              </Text>
            </View>
            
            {activeTab === 'Daily' && (
              <View style={styles.progressCircleContainer}>
                <Svg width={64} height={64} viewBox="0 0 64 64" style={[styles.svgAbsolute, { transform: [{ rotate: '-90deg' }] }]}>
                  <Circle
                    cx={32}
                    cy={32}
                    r={radius}
                    stroke={colors.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
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
                    {formatNumber(progressPercentage, i18n.language)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
          
          <Text style={[styles.encouragement, { color: colors.accent }]}>
            {getEncouragementMsg(progressPercentage)}
          </Text>
        </BlurView>

        {activeTab === 'Daily' && renderDaily()}
        {activeTab === 'Weekly' && renderRealChart(7, t('tracker.weekly'))}
        {activeTab === 'Monthly' && renderRealChart(30, t('tracker.monthly'))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  container: { 
    padding: Spacing.four,
    paddingTop: 0,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    marginBottom: Spacing.three,
    overflow: 'hidden',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  segmentText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    color: '#94A3B8',
  },
  progressCard: {
    padding: Spacing.five,
    borderRadius: 24,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  progressTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 22,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  progressCircleContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgAbsolute: {
    position: 'absolute',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
  },
  encouragement: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    marginBottom: Spacing.two,
  },
  gridSection: {
    flex: 1,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  taskCardWrapper: {
    width: '31%',
    aspectRatio: 1,
  },
  taskCardBlur: {
    borderRadius: 18,
    overflow: 'hidden',
    flex: 1,
  },
  taskCard: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCardIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCardLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'center',
    marginBottom: 16, // leave room for the icon
  },
  taskCardCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 6,
    padding: 2,
  },
  chartCard: {
    padding: Spacing.four,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBarWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  chartBar: {
    borderRadius: 4,
    width: '100%',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.four,
    marginTop: Spacing.four,
  },
  heatmapWeekly: {
    gap: 12,
  },
  heatmapMonthly: {
    gap: 6,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  heatmapCellWeekly: {
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  chartDesc: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    textAlign: 'center',
  }
});
