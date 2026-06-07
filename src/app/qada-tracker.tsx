import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Plus, Minus, ArrowLeft, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useQadaStore, QadaType } from '@/store/qadaStore';
import { formatNumber } from '@/utils/formatNumber';

export default function QadaTrackerScreen() {
  const { t, i18n } = useTranslation();
  const scheme = useThemeStore(s => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const qadaStore = useQadaStore();

  useEffect(() => {
    qadaStore.initialize();
  }, []);

  const handleUpdate = (type: QadaType, amount: number) => {
    qadaStore.updateQada(type, amount);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderTrackerCard = (type: QadaType, labelKey: string) => {
    const count = qadaStore[type];
    
    return (
      <BlurView intensity={30} tint={colors.glassTint as any} style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t(labelKey)}</Text>
          <Text style={[styles.cardCount, { color: count > 0 ? colors.highlight : colors.textSecondary }]}>
            {formatNumber(count, i18n.language)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            onPress={() => handleUpdate(type, -1)}
            disabled={count === 0}
          >
            <Minus size={20} color={count === 0 ? colors.textSecondary : colors.text} opacity={count === 0 ? 0.3 : 1} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}
            onPress={() => handleUpdate(type, 1)}
          >
            <Plus size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </BlurView>
    );
  };

  const totalPrayers = qadaStore.fajr + qadaStore.dhuhr + qadaStore.asr + qadaStore.maghrib + qadaStore.isha + qadaStore.witr;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('tracker.qadaTitle', { defaultValue: 'Missed Prayers (Qada)' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <History size={32} color={colors.highlight} style={{ marginBottom: Spacing.two }} />
          <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
            {t('tracker.totalMissed', { defaultValue: 'Total Missed Prayers' })}
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatNumber(totalPrayers, i18n.language)}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('tracker.prayers', { defaultValue: 'Prayers' })}
        </Text>

        <View style={styles.grid}>
          <View style={styles.gridCol}>{renderTrackerCard('fajr', 'prayerTimes.fajr')}</View>
          <View style={styles.gridCol}>{renderTrackerCard('dhuhr', 'prayerTimes.dhuhr')}</View>
          <View style={styles.gridCol}>{renderTrackerCard('asr', 'prayerTimes.asr')}</View>
          <View style={styles.gridCol}>{renderTrackerCard('maghrib', 'prayerTimes.maghrib')}</View>
          <View style={styles.gridCol}>{renderTrackerCard('isha', 'prayerTimes.isha')}</View>
          <View style={styles.gridCol}>{renderTrackerCard('witr', 'prayerTimes.witr')}</View>
        </View>

        <View style={{ marginTop: Spacing.four }}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('tracker.fasting', { defaultValue: 'Fasting' })}
          </Text>
          {renderTrackerCard('fasts', 'tracker.missedFasts')}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    padding: Spacing.four,
  },
  summaryCard: {
    alignItems: 'center',
    padding: Spacing.six,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: Spacing.six,
  },
  summaryTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: Fonts.outfit,
    fontSize: 48,
    lineHeight: 56,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.three,
    marginLeft: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridCol: {
    width: '47.5%', // Slightly less than half to account for gap
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: Spacing.four,
  },
  cardTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 4,
  },
  cardCount: {
    fontFamily: Fonts.outfit,
    fontSize: 32,
    lineHeight: 38,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
