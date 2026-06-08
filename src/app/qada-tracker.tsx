import ThemeCard from '@/components/ThemeCard';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Plus, Minus, ArrowLeft, History } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Fonts, Spacing, useThemeColors,  } from '@/constants/theme';
import { useQadaStore, QadaType } from '@/store/qadaStore';
import { formatNumber } from '@/utils/formatNumber';
import Animated, { LinearTransition, FadeIn, FadeOut } from 'react-native-reanimated';

export default function QadaTrackerScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
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
      <ThemeCard intensity={30} style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Text style={[styles.cardTitle, { color: colors.text, minWidth: 70 }]}>{t(labelKey)}</Text>
            <Text style={[styles.cardCount, { color: count > 0 ? colors.highlight : colors.textSecondary }]}>
              {formatNumber(count, i18n.language)}
            </Text>
          </View>

          <Animated.View layout={LinearTransition.springify()} style={[styles.cardActions, { width: 140 }]}>
            {count > 0 && (
              <Animated.View layout={LinearTransition.springify()} entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
                <TouchableOpacity 
                  style={[styles.btn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                  onPress={() => handleUpdate(type, -1)}
                >
                  <Minus size={18} color={colors.text} />
                </TouchableOpacity>
              </Animated.View>
            )}
            <Animated.View layout={LinearTransition.springify()} style={{ flex: count > 0 ? 1 : 2 }}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}
                onPress={() => handleUpdate(type, 1)}
              >
                <Plus size={18} color={colors.accent} />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

        </View>
      </ThemeCard>
    );
  };

  const totalPrayers = qadaStore.fajr + qadaStore.dhuhr + qadaStore.asr + qadaStore.maghrib + qadaStore.isha;

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
        
        <View style={{ flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.six }}>
          <View style={[styles.summaryCard, { flex: 1, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <History size={14} color={colors.highlight} />
              <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
                {t('tracker.prayers', { defaultValue: 'Prayers' })}
              </Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatNumber(totalPrayers, i18n.language)}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { flex: 1, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <History size={14} color={colors.highlight} />
              <Text style={[styles.summaryTitle, { color: colors.textSecondary }]}>
                {t('tracker.fasting', { defaultValue: 'Fasting' })}
              </Text>
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatNumber(qadaStore.fasts, i18n.language)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('tracker.prayers', { defaultValue: 'Prayers' })}
        </Text>

        <View style={{ gap: Spacing.three }}>
          {renderTrackerCard('fajr', 'prayerTimes.fajr')}
          {renderTrackerCard('dhuhr', 'prayerTimes.dhuhr')}
          {renderTrackerCard('asr', 'prayerTimes.asr')}
          {renderTrackerCard('maghrib', 'prayerTimes.maghrib')}
          {renderTrackerCard('isha', 'prayerTimes.isha')}
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
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontFamily: Fonts.outfit,
    fontSize: 48,
    lineHeight: 52,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.three,
    marginLeft: Spacing.one,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  cardCount: {
    fontFamily: Fonts.outfit,
    fontSize: 26,
    lineHeight: 30,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
