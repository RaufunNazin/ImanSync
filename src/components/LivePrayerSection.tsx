import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import ThemeCard from '@/components/ThemeCard';
import SpecialTimeCard, { SpecialTime } from '@/components/SpecialTimeCard';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';
import { useTrackerHistoryStore } from '@/store/trackerHistoryStore';
import AnimatedReanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import HeroCountdown from '@/components/HeroCountdown';

// ── Types ────────────────────────────────────────────────────────────────────
interface PrayerEntry {
  id: string;
  name: string;
  time: string;
  date: Date;
  status: 'past' | 'current' | 'next' | 'future';
}

interface RestrictedTime {
  labelKey: string;
  time: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatAMPM = (date: Date, lang: string = 'en'): string => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? ' PM' : ' AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${String(minutes).padStart(2, '0')}`;
  return formatNumber(timeStr, lang) + ampm;
};

const parseTime = (timeStr: string, baseDate: Date): Date => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
};

export default React.memo(function LivePrayerSection({ rawTimings, hijriRaw }: { rawTimings: Record<string, string>, hijriRaw: any }) {
  const colors = useThemeColors();
  const activeColor = colors.background === '#0c1618' ? colors.accent : colors.highlight;
  const { t, i18n } = useTranslation();

  const trackerHistoryStore = useTrackerHistoryStore();
  const trackerHistory = trackerHistoryStore.history;
  const todayStr = getLocalYYYYMMDD();
  const todayTasks = trackerHistory[todayStr] || {};

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Throttle parent re-renders to roughly the start of every minute.
    let timerId: NodeJS.Timeout;
    let isMounted = true;
    
    const scheduleNext = () => {
      if (!isMounted) return;
      const now = new Date();
      const delay = 60000 - (now.getTime() % 60000);
      
      timerId = setTimeout(() => {
        if (!isMounted) return;
        setCurrentTime(new Date());
        scheduleNext();
      }, delay);
    };
    
    scheduleNext();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setCurrentTime(new Date());
    });
    
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      sub.remove();
    };
  }, []);

  const togglePrayerTask = (prayerId: string) => {
    const currentDayStr = getLocalYYYYMMDD();
    trackerHistoryStore.toggleTask(currentDayStr, prayerId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const fardPrayers: PrayerEntry[] = useMemo(() => {
    if (!rawTimings.Fajr) return [];
    const keys = [
      { id: 'fajr', key: 'Fajr' },
      { id: 'sunrise', key: 'Sunrise' },
      { id: 'dhuhr', key: 'Dhuhr' },
      { id: 'asr', key: 'Asr' },
      { id: 'maghrib', key: 'Maghrib' },
      { id: 'isha', key: 'Isha' },
    ];
    return keys.map((p) => ({
      id: p.id,
      name: t(`prayerTimes.${p.id}`),
      time: formatAMPM(parseTime(rawTimings[p.key as keyof typeof rawTimings], today), i18n.language),
      date: parseTime(rawTimings[p.key as keyof typeof rawTimings], today),
      status: 'future' as const,
    }));
  }, [rawTimings, today, t, i18n.language]);

  const { currentPrayer, nextPrayer, prayersWithStatus, progressPercent } =
    useMemo(() => {
      if (fardPrayers.length === 0) {
        return {
          currentPrayer: { id: '', name: t('home.loading'), time: '', date: new Date() },
          nextPrayer: { id: '', name: t('home.loading'), time: '', date: new Date() },
          timeToNextMs: 0,
          prayersWithStatus: [],
          progressPercent: 0,
        };
      }

      const now = currentTime.getTime();
      let currentIdx = -1;
      let nextIdx = -1;

      for (let i = 0; i < fardPrayers.length; i++) {
        if (fardPrayers[i].date.getTime() <= now) {
          currentIdx = i;
        } else if (nextIdx === -1) {
          nextIdx = i;
          break;
        }
      }

      let curP = currentIdx >= 0 ? fardPrayers[currentIdx] : fardPrayers[fardPrayers.length - 1];
      let nxtP = nextIdx >= 0 ? fardPrayers[nextIdx] : fardPrayers[0];

      let nxtDate =
        nextIdx >= 0
          ? nxtP.date
          : new Date(fardPrayers[0].date.getTime() + 24 * 3600000);

      if (curP.id === 'sunrise') {
        curP = { ...curP, id: 'dhuha', name: t('prayerTimes.dhuha') };
      } else if (curP.id === 'isha') {
        if (rawTimings.Maghrib && rawTimings.Fajr) {
          const isAfterMidnightDay = currentIdx === -1;
          const maghribDate = parseTime(rawTimings.Maghrib, today);
          if (isAfterMidnightDay) {
            maghribDate.setDate(maghribDate.getDate() - 1);
          }
          
          const fajrDate = parseTime(rawTimings.Fajr, today);
          const nextFajr = isAfterMidnightDay ? fajrDate : new Date(fajrDate.getTime() + 24 * 3600000);
          
          const nightDuration = nextFajr.getTime() - maghribDate.getTime();
          const tahajjudDate = new Date(maghribDate.getTime() + (nightDuration * 2 / 3));
          
          if (now >= tahajjudDate.getTime()) {
            curP = { ...curP, id: 'tahajjud', name: t('prayerTimes.tahajjud'), date: tahajjudDate };
          } else {
            nxtP = { 
              id: 'tahajjud', 
              name: t('prayerTimes.tahajjud'), 
              time: formatAMPM(tahajjudDate, i18n.language), 
              date: tahajjudDate, 
              status: 'next' 
            };
            nxtDate = tahajjudDate;
          }
        }
      }

      const timeToNextMs = Math.max(0, nxtDate.getTime() - now);

      const prayersWithStatus: PrayerEntry[] = fardPrayers.map((p, i) => {
        let status: PrayerEntry['status'] = 'future';
        if (i < currentIdx) status = 'past';
        else if (i === currentIdx) status = 'current';
        else if (i === nextIdx) status = 'next';
        return { ...p, status };
      });

      let curStartDate = curP.date.getTime();
      if (curStartDate > now) {
        curStartDate -= 24 * 3600000;
      }
      const totalDuration = nxtDate.getTime() - curStartDate;
      const elapsed = now - curStartDate;
      const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

      return { currentPrayer: curP, nextPrayer: nxtP, timeToNextMs, prayersWithStatus, progressPercent };
    }, [fardPrayers, currentTime]);

  const timelineProgress = useMemo(() => {
    if (fardPrayers.length === 0) return { left: 0, width: 0, currentTimelineIndex: 0 };
    const timelinePrayers = fardPrayers.filter(p => p.id !== 'sunrise');
    const sunrisePrayer = fardPrayers.find(p => p.id === 'sunrise');
    if (timelinePrayers.length < 5) return { left: 0, width: 0, currentTimelineIndex: 0 };
    
    const now = currentTime.getTime();
    const fajrTime = timelinePrayers[0].date.getTime();
    const ishaTime = timelinePrayers[4].date.getTime();
    
    if (now < fajrTime || now >= ishaTime) {
      return { left: 100, width: 0, currentTimelineIndex: 4 }; // Isha
    }
    
    let currentIdx = -1;
    for (let i = 0; i < timelinePrayers.length - 1; i++) {
      if (now >= timelinePrayers[i].date.getTime() && now < timelinePrayers[i+1].date.getTime()) {
        currentIdx = i;
        break;
      }
    }
    
    if (currentIdx === -1) return { left: 100, width: 0, currentTimelineIndex: 4 };
    
    const segmentStart = timelinePrayers[currentIdx].date.getTime();
    let segmentEnd = timelinePrayers[currentIdx+1].date.getTime();

    if (currentIdx === 0 && sunrisePrayer) {
       segmentEnd = sunrisePrayer.date.getTime();
    }

    let segmentProgress = 0;
    if (now >= segmentEnd) {
       segmentProgress = 1;
    } else {
       segmentProgress = (now - segmentStart) / (segmentEnd - segmentStart);
    }
    
    segmentProgress = Math.max(0, segmentProgress);
    
    return {
      left: currentIdx * 25,
      width: segmentProgress * 25,
      currentTimelineIndex: currentIdx
    };
  }, [fardPrayers, currentTime]);

  const isCurrentPrayerDone = !!todayTasks[currentPrayer?.id];

  const specialTimes: SpecialTime[] = useMemo(() => {
    if (!rawTimings.Fajr || !rawTimings.Maghrib) return [];
    
    const now = currentTime.getTime();
    const fajrDate = parseTime(rawTimings.Fajr, today);
    const maghribDate = parseTime(rawTimings.Maghrib, today);

    const todaySuhurDate = new Date(fajrDate.getTime() - 1 * 60000);
    let suhurDate = todaySuhurDate;
    if (now > suhurDate.getTime()) {
      suhurDate = new Date(suhurDate.getTime());
      suhurDate.setDate(suhurDate.getDate() + 1);
    }
    
    let iftarDate = new Date(maghribDate.getTime() + 1 * 60000);
    if (now > iftarDate.getTime()) {
      iftarDate = new Date(iftarDate.getTime());
      iftarDate.setDate(iftarDate.getDate() + 1);
    }

    let relevantMaghrib: Date;
    let relevantFajr: Date;
    
    if (now < fajrDate.getTime()) {
      relevantMaghrib = new Date(maghribDate.getTime());
      relevantMaghrib.setDate(relevantMaghrib.getDate() - 1);
      relevantFajr = fajrDate;
    } else {
      relevantMaghrib = maghribDate;
      relevantFajr = new Date(fajrDate.getTime());
      relevantFajr.setDate(relevantFajr.getDate() + 1);
    }
    
    const nightDuration = relevantFajr.getTime() - relevantMaghrib.getTime();
    const tahajjudDate = new Date(relevantMaghrib.getTime() + (nightDuration * 2 / 3));

    let hideSahri = false;
    let hideIftar = false;
    
    if (hijriRaw) {
      const hDay = parseInt(hijriRaw.day, 10);
      const hMonth = hijriRaw.monthNumber;
      
      const isEidDay = (hMonth === 10 && hDay === 1) || (hMonth === 12 && hDay >= 10 && hDay <= 13);
      const isDayBeforeEid = (hMonth === 9 && (hDay === 29 || hDay === 30)) || (hMonth === 12 && hDay === 9);

      if (isEidDay) {
        hideIftar = true; 
      }
      
      if (isDayBeforeEid && now > todaySuhurDate.getTime()) {
        hideSahri = true; 
      }
    }

    return [
      {
        label: t('home.suhur'),
        time: hideSahri ? '--:--' : formatAMPM(suhurDate, i18n.language),
        date: hideSahri ? null : suhurDate,
      },
      {
        label: t('home.iftar'),
        time: hideIftar ? '--:--' : formatAMPM(iftarDate, i18n.language),
        date: hideIftar ? null : iftarDate,
      },
      {
        label: t('home.tahajjud'),
        time: formatAMPM(tahajjudDate, i18n.language),
        date: tahajjudDate,
      },
    ];
  }, [rawTimings, today, t, i18n.language, hijriRaw, currentTime]);

  const restrictedTimes: RestrictedTime[] = useMemo(() => {
    if (!rawTimings.Sunrise || !rawTimings.Sunset || !rawTimings.Dhuhr) return [];
    
    const sunriseDate = parseTime(rawTimings.Sunrise, today);
    const sunriseEnd = new Date(sunriseDate.getTime() + 15 * 60000);
    
    const dhuhrDate = parseTime(rawTimings.Dhuhr, today);
    const zawaalStart = new Date(dhuhrDate.getTime() - 10 * 60000);
    
    const sunsetDate = parseTime(rawTimings.Sunset, today);
    const paleStart = new Date(sunsetDate.getTime() - 15 * 60000);

    return [
      {
        labelKey: 'restrict1',
        time: `${formatAMPM(sunriseDate, i18n.language)} - ${formatAMPM(sunriseEnd, i18n.language)}`,
      },
      {
        labelKey: 'restrict2',
        time: `${formatAMPM(zawaalStart, i18n.language)} - ${formatAMPM(dhuhrDate, i18n.language)}`,
      },
      {
        labelKey: 'restrict3',
        time: `${formatAMPM(paleStart, i18n.language)} - ${formatAMPM(sunsetDate, i18n.language)}`,
      },
    ];
  }, [rawTimings, today, t, i18n.language]);

  const isMakruh = useMemo(() => {
    if (!rawTimings.Sunrise || !rawTimings.Sunset || !rawTimings.Dhuhr) return false;
    const n = currentTime.getTime();

    const sunriseDate = parseTime(rawTimings.Sunrise, today);
    const sunriseEnd = new Date(sunriseDate.getTime() + 15 * 60000);
    if (n >= sunriseDate.getTime() && n <= sunriseEnd.getTime()) return true;

    const dhuhrDate = parseTime(rawTimings.Dhuhr, today);
    const zawaalStart = new Date(dhuhrDate.getTime() - 10 * 60000);
    if (n >= zawaalStart.getTime() && n <= dhuhrDate.getTime()) return true;

    const sunsetDate = parseTime(rawTimings.Sunset, today);
    const paleStart = new Date(sunsetDate.getTime() - 15 * 60000);
    if (n >= paleStart.getTime() && n <= sunsetDate.getTime()) return true;

    return false;
  }, [rawTimings, today, currentTime]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isCurrentPrayerDone ? 1 : 0, { duration: 600 }),
  }));

  const animatedRedGlowStyle = useAnimatedStyle(() => ({
    opacity: withTiming((isMakruh && !isCurrentPrayerDone) ? 1 : 0, { duration: 600 }),
  }));

  return (
    <>
      <TouchableOpacity activeOpacity={1}
        onPress={() => prayersWithStatus.length > 0 ? togglePrayerTask(currentPrayer.id) : undefined}
        style={styles.section}
      >
        <ThemeCard intensity={30} style={[styles.heroCard, { borderColor: colors.border, paddingVertical: 20, paddingHorizontal: 24, overflow: 'hidden', marginBottom: 0 }]}>
          <AnimatedReanimated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, animatedGlowStyle]}>
            <LinearGradient
              colors={[activeColor + '30', activeColor + '08', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%' }}
            />
          </AnimatedReanimated.View>

          <AnimatedReanimated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, animatedRedGlowStyle]}>
            <LinearGradient
              colors={[colors.error + '30', colors.error + '08', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%' }}
            />
          </AnimatedReanimated.View>

          <View style={{ position: 'absolute', top: 10, right: 14 }}>
            <Text style={{ fontFamily: Fonts.outfit, fontSize: 9, color: isCurrentPrayerDone ? activeColor : colors.textSecondary, opacity: 0.7 }}>
              {isCurrentPrayerDone ? t('home.prayerDone') : t('home.tapToMark')}
            </Text>
          </View>

          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 40 }}>
            <HeroCountdown 
              targetDate={nextPrayer.date} 
              activeColor={activeColor} 
              isMakruh={isMakruh} 
              isCurrentPrayerDone={isCurrentPrayerDone} 
              errorColor={colors.error} 
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, marginTop: 32 }}>
            <View>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                {currentPrayer.name}
              </Text>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                {currentPrayer.time.replace(/ AM| PM/g, '')}
                {currentPrayer.time.includes(' AM') && <Text style={{ fontSize: 8 }}> AM</Text>}
                {currentPrayer.time.includes(' PM') && <Text style={{ fontSize: 8 }}> PM</Text>}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                {nextPrayer.name}
              </Text>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                {nextPrayer.time.replace(/ AM| PM/g, '')}
                {nextPrayer.time.includes(' AM') && <Text style={{ fontSize: 8 }}> AM</Text>}
                {nextPrayer.time.includes(' PM') && <Text style={{ fontSize: 8 }}> PM</Text>}
              </Text>
            </View>
          </View>

          <AnimatedProgressBar
            progress={prayersWithStatus.length > 0 ? progressPercent : 0}
            color={progressPercent < 50 ? activeColor : progressPercent < 75 ? colors.accent : colors.error}
            trackColor={colors.border}
            height={4}
            duration={800}
          />
        </ThemeCard>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('home.prayerTimesGroup')}</Text>

        {prayersWithStatus.length > 0 ? (
          <ThemeCard intensity={30} style={[styles.timelineCard, { borderColor: colors.border }]}>
            <View style={{ position: 'relative', width: '100%', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
                {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer, index) => {
                  const isCurrent = index === timelineProgress.currentTimelineIndex;
                  return (
                    <View key={`name-${prayer.id}`} style={{ width: '20%', alignItems: 'center' }}>
                      <Text style={[styles.timelineName, { marginBottom: 0, color: isCurrent ? (colors.background === '#0c1618' ? '#FFFFFF' : '#000000') : colors.text, opacity: isCurrent ? 1 : 0.5 }]}>
                        {prayer.name}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ position: 'relative', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, zIndex: 2 }}>
                <View style={{ position: 'absolute', left: '10%', right: '10%', height: 2, backgroundColor: colors.textSecondary + '30', borderRadius: 1, zIndex: 0 }} />
                <View style={{ position: 'absolute', left: '10%', right: '10%', height: 2, borderRadius: 1, zIndex: 1 }}>
                  <Animated.View style={{ position: 'absolute', left: `${timelineProgress.left}%`, height: '100%', backgroundColor: activeColor, borderRadius: 1, width: `${timelineProgress.width}%` }} />
                </View>
                {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer, index) => {
                  const isCurrent = index === timelineProgress.currentTimelineIndex;
                  let dotStyle: any = { backgroundColor: colors.textSecondary + '50' };
                  if (isCurrent) {
                    dotStyle = { backgroundColor: activeColor };
                  }
                  return (
                    <View key={`dot-${prayer.id}`} style={{ width: '20%', alignItems: 'center', zIndex: 2, elevation: 2 }}>
                      <View style={[styles.timelineDot, { backgroundColor: colors.background, position: 'absolute' }]} />
                      <View style={[styles.timelineDot, dotStyle]} />
                    </View>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer, index) => {
                  const isCurrent = index === timelineProgress.currentTimelineIndex;
                  return (
                    <View key={`time-${prayer.id}`} style={{ width: '20%', alignItems: 'center' }}>
                      <Text style={[styles.timelineTime, { color: isCurrent ? (colors.background === '#0c1618' ? '#FFFFFF' : '#000000') : colors.text, opacity: isCurrent ? 1 : 0.5 }]}>
                        {formatNumber(prayer.time.replace(/ AM| PM/g, ''), i18n.language)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ThemeCard>
        ) : null}

        {specialTimes.length > 0 ? (
          <View style={{ marginTop: Spacing.three }}>
            <Text style={[styles.subSectionLabelOuter, { color: colors.textSecondary }]}>{t('home.specialTimes')}</Text>
            <View style={styles.specialGrid}>
              {specialTimes.map((item) => (
                <SpecialTimeCard key={item.label} item={item} colors={colors} activeColor={activeColor} i18nLanguage={i18n.language} styles={styles} t={t} />
              ))}
            </View>
          </View>
        ) : null}

        {restrictedTimes.length > 0 && (
          <View style={{ marginTop: Spacing.three }}>
            <Text style={[styles.subSectionLabelOuter, { color: colors.textSecondary }]}>{t('home.restrictedTimes')}</Text>
            <View style={styles.restrictedOuter}>
              {restrictedTimes.map((rt) => (
                <ThemeCard key={rt.labelKey} style={styles.restrictedCard}>
                  <View style={styles.restrictedNameCol}>
                    <Text style={[styles.restrictedLabel, { color: colors.text }]}>
                      {t('home.' + rt.labelKey)}
                    </Text>
                  </View>
                  <View style={[styles.restrictedDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.restrictedTimeCol}>
                    <Text style={[styles.restrictedTime, { color: colors.error }]}>
                      {formatNumber(rt.time, i18n.language)}
                    </Text>
                  </View>
                </ThemeCard>
              ))}
            </View>
          </View>
        )}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  heroCard: {
    borderRadius: 24,
    minHeight: 180,
  },
  heroCountdown: {
    fontFamily: Fonts.outfit,
  },
  timelineCard: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
  },
  timelineName: {
    fontFamily: Fonts.outfit,
    fontSize: 11,
  },
  timelineTime: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subSectionLabelOuter: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  specialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  restrictedOuter: {
    gap: Spacing.two,
  },
  restrictedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
  },
  restrictedNameCol: {
    flex: 1,
  },
  restrictedLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  restrictedDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: Spacing.three,
  },
  restrictedTimeCol: {
    flex: 2,
    alignItems: 'flex-end',
  },
  restrictedTime: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
});
