import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { getDistrictName } from '@/utils/districts';
import { formatNumber } from '@/utils/formatNumber';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Book, BookOpen, Compass, GraduationCap, MapPin, Moon, RotateCcw, Star, Sunset } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeStore } from '@/store/themeStore';

// ── Types ────────────────────────────────────────────────────────────────────
interface PrayerEntry {
  id: string;
  name: string;
  time: string;
  date: Date;
  status: 'past' | 'current' | 'next' | 'future';
}

interface SpecialTime {
  label: string;
  sublabel: string;
  time: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
}

interface RestrictedTime {
  labelKey: string;
  time: string;
}

interface DailyVerse {
  arabic: string;
  translation: string;
  translationBn: string;
  surahId: number;
  surahDefaultName: string;
  ayahNum: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatAMPM = (date: Date, lang: string = 'en'): string => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  return formatNumber(timeStr, lang);
};

const parseTime = (timeStr: string, baseDate: Date): Date => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
};

const formatCountdown = (ms: number): string => {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// The three forbidden/restricted prayer windows
const RESTRICTED_WINDOWS = [
  { labelKey: 'restrict1', noteKey: 'restrict1Desc' },
  { labelKey: 'restrict2', noteKey: 'restrict2Desc' },
  { labelKey: 'restrict3', noteKey: 'restrict3Desc' },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme ?? 'light'];
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [rawTimings, setRawTimings] = useState<Record<string, string>>({});
  const [hijriDate, setHijriDate] = useState('');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [locationCity, setLocationCity] = useState('Dhaka');
  const locationName = getDistrictName(locationCity, i18n.language);

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch prayer times
  useEffect(() => {
    AsyncStorage.multiGet(['imansync_location', 'imansync_calc_method']).then(values => {
      let lat = 23.8103;
      let lon = 90.4125;
      let method = 1; // 1 = Karachi, 2 = ISNA, 3 = MWL
      let isCityBased = true;
      let city = 'Dhaka';
      let country = 'Bangladesh';
      
      values.forEach(([key, value]) => {
        if (value && key === 'imansync_location') {
          try {
             let loc = JSON.parse(value);
             lat = loc.latitude;
             lon = loc.longitude;
             city = loc.city;
             isCityBased = false;
          } catch(e){}
        }
        if (value && key === 'imansync_calc_method') {
           method = parseInt(value, 10);
        }
      });

      setLocationCity(city);

      let url = isCityBased 
        ? `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}`
        : `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}`;

      fetch(url)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setRawTimings(json.data.timings);
            const hj = json.data.date.hijri;
            setHijriDate(`${hj.day} ${hj.month.en} ${hj.year} AH`);
          }
        })
        .catch((e) => console.error('Prayer fetch error:', e));
    });
  }, []);

  // Fetch a random Quran verse (Arabic + English)
  useEffect(() => {
    const randomAyah = Math.floor(Math.random() * 6236) + 1;
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${randomAyah}/ar.alafasy`).then(
        (r) => r.json()
      ),
      fetch(
        `https://api.alquran.cloud/v1/ayah/${randomAyah}/en.asad`
      ).then((r) => r.json()),
      fetch(
        `https://api.alquran.cloud/v1/ayah/${randomAyah}/bn.bengali`
      ).then((r) => r.json()),
    ])
      .then(([arJson, enJson, bnJson]) => {
        if (arJson.data && enJson.data && bnJson.data) {
          setDailyVerse({
            arabic: arJson.data.text,
            translation: `"${enJson.data.text}"`,
            translationBn: `"${bnJson.data.text}"`,
            surahId: enJson.data.surah.number,
            surahDefaultName: enJson.data.surah.englishName,
            ayahNum: enJson.data.numberInSurah,
          });
        }
      })
      .catch((e) => console.error('Verse fetch error:', e));
  }, []);

  // Derive prayer states from raw timings
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const fardPrayers: PrayerEntry[] = useMemo(() => {
    if (!rawTimings.Fajr) return [];
    const keys = [
      { id: 'fajr', key: 'Fajr' },
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

  const { currentPrayer, nextPrayer, timeToNextMs, prayersWithStatus } =
    useMemo(() => {
      if (fardPrayers.length === 0) {
        return {
          currentPrayer: { name: t('home.loading'), time: '' },
          nextPrayer: { name: t('home.loading'), time: '' },
          timeToNextMs: 0,
          prayersWithStatus: [],
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

      // After Isha — current is Isha, next is tomorrow's Fajr
      const curP =
        currentIdx >= 0 ? fardPrayers[currentIdx] : fardPrayers[fardPrayers.length - 1];
      const nxtP = nextIdx >= 0 ? fardPrayers[nextIdx] : fardPrayers[0];

      const nxtDate =
        nextIdx >= 0
          ? nxtP.date
          : new Date(fardPrayers[0].date.getTime() + 24 * 3600000);

      const timeToNextMs = Math.max(0, nxtDate.getTime() - now);

      const prayersWithStatus: PrayerEntry[] = fardPrayers.map((p, i) => {
        let status: PrayerEntry['status'] = 'future';
        if (i < currentIdx) status = 'past';
        else if (i === currentIdx) status = 'current';
        else if (i === nextIdx) status = 'next';
        return { ...p, status };
      });

      return { currentPrayer: curP, nextPrayer: nxtP, timeToNextMs, prayersWithStatus };
    }, [fardPrayers, currentTime]);

  const countdownStr = useMemo(() => formatCountdown(timeToNextMs), [timeToNextMs]);
  const displayCountdown = formatNumber(countdownStr, i18n.language);

  // Special times: Suhur (Imsak), Iftar (Maghrib), Tahajjud (Lastthird)
  const specialTimes: SpecialTime[] = useMemo(() => {
    if (!rawTimings.Imsak) return [];
    return [
      {
        label: t('home.suhur'),
        sublabel: t('home.suhurDesc'),
        time: formatAMPM(parseTime(rawTimings.Imsak, today), i18n.language),
        Icon: Moon,
      },
      {
        label: t('home.iftar'),
        sublabel: t('home.iftarDesc'),
        time: formatAMPM(parseTime(rawTimings.Maghrib, today), i18n.language),
        Icon: Sunset,
      },
      {
        label: t('home.tahajjud'),
        sublabel: t('home.tahajjudDesc'),
        time: formatAMPM(parseTime(rawTimings.Lastthird, today), i18n.language),
        Icon: Star,
      },
    ];
  }, [rawTimings, today, t, i18n.language]);

  // Restricted times
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
        time: `${formatAMPM(sunriseDate, i18n.language)} – ${formatAMPM(sunriseEnd, i18n.language)}`,
      },
      {
        labelKey: 'restrict2',
        time: `${formatAMPM(zawaalStart, i18n.language)} – ${formatAMPM(dhuhrDate, i18n.language)}`,
      },
      {
        labelKey: 'restrict3',
        time: `${formatAMPM(paleStart, i18n.language)} – ${formatAMPM(sunsetDate, i18n.language)}`,
      },
    ];
  }, [rawTimings, today, t, i18n.language]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        titleEn="ImanSync"
        titleAr={t('home.titleAr')}
        icon={require('../../../assets/images/android-icon-foreground.png')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* ── Greeting ────────────────────────────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={[styles.arabicGreeting, { color: colors.accent }]}>
            {t('home.greeting')}
          </Text>
          {hijriDate ? (
            <Text style={[styles.hijriLabel, { color: colors.textSecondary }]}>
              {formatNumber(hijriDate, i18n.language)}
            </Text>
          ) : null}
        </View>


        {/* ── Current Prayer Card (compact) ────────────────────── */}
        {prayersWithStatus.length > 0 && (
          <BlurView
            intensity={50}
            tint={colors.glassTint as any}
            style={[styles.heroCard, { borderColor: colors.border }]}
          >
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
                  {t('home.currentPrayer')}
                </Text>
                <Text style={[styles.heroPrayerName, { color: colors.text }]}>
                  {currentPrayer.name}
                </Text>
                <Text style={[styles.heroTime, { color: colors.textSecondary }]}>
                  {currentPrayer.time}
                </Text>
              </View>
              <View style={styles.heroRight}>
                <Text style={[styles.heroNextLabel, { color: colors.textSecondary }]}>
                  {t('home.next')} · {nextPrayer.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {displayCountdown.split('').map((char, idx) => (
                    <Text 
                      key={idx} 
                      style={[
                        styles.heroCountdown, 
                        { 
                          color: colors.accent,
                          width: char === ':' || char === ' ' ? 12 : 22,
                          textAlign: 'center'
                        }
                      ]}
                    >
                      {char}
                    </Text>
                  ))}
                </View>
                <View style={styles.locationRow}>
                  <MapPin size={12} color={colors.textSecondary} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {locationName}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        )}

        {/* ── Today's Prayers — Horizontal 5-Point Timeline ──── */}
        {prayersWithStatus.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.todaysPrayers')}
            </Text>
            <BlurView
              intensity={30}
              tint={colors.glassTint as any}
              style={[styles.timelineCard, { borderColor: colors.border }]}
            >
              <View style={styles.timelineRow}>
                {prayersWithStatus.map((prayer, index) => {
                  const isCurrent = prayer.status === 'current';
                  const isNext = prayer.status === 'next';
                  const isPast = prayer.status === 'past';
                  const isFirst = index === 0;
                  const isLast = index === prayersWithStatus.length - 1;
                  const dotColor = isCurrent
                    ? colors.highlight
                    : isNext
                    ? 'transparent'
                    : isPast
                    ? colors.textSecondary
                    : colors.border;
                  const lineColor = isPast
                    ? colors.highlight + '88'
                    : colors.border;

                  return (
                    <View key={prayer.id} style={styles.timelineCol}>
                      {/* Prayer name on top */}
                      <Text
                        style={[
                          styles.timelineName,
                          {
                            color: isCurrent
                              ? colors.highlight
                              : isNext
                              ? colors.text
                              : colors.textSecondary,
                            opacity: isPast ? 0.55 : 1,
                          },
                        ]}
                      >
                        {prayer.name}
                      </Text>

                      {/* Dot + horizontal connectors */}
                      <View style={styles.timelineDotRow}>
                        {/* Left connector */}
                        <View
                          style={[
                            styles.timelineConnectorLeft,
                            { backgroundColor: isFirst ? 'transparent' : lineColor },
                          ]}
                        />
                        {/* Dot */}
                        <View
                          style={[
                            styles.timelineDot,
                            { backgroundColor: dotColor },
                            isCurrent && { transform: [{ scale: 1.3 }] },
                            isNext && {
                              borderColor: colors.highlight,
                              borderWidth: 2,
                            },
                          ]}
                        />
                        {/* Right connector */}
                        <View
                          style={[
                            styles.timelineConnectorRight,
                            { backgroundColor: isLast ? 'transparent' : lineColor },
                          ]}
                        />
                      </View>

                      {/* Time below */}
                      <Text
                        style={[
                          styles.timelineTime,
                          {
                            color: isCurrent ? colors.highlight : colors.textSecondary,
                            opacity: isPast ? 0.5 : 1,
                          },
                        ]}
                      >
                        {formatNumber(prayer.time, i18n.language)}
                      </Text>

                      {/* Next badge */}
                      {isNext && (
                        <View
                          style={[
                            styles.nextBadge,
                            { backgroundColor: colors.highlight + '22' },
                          ]}
                        >
                          <Text style={[styles.nextBadgeText, { color: colors.highlight }]}>
                            {t('home.next')}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </BlurView>
          </View>
        )}

        {/* ── Quick Actions (Unified Toolbar Layout) ────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.quickActions')}</Text>
          <BlurView intensity={40} tint={colors.glassTint as any} style={[styles.quickActionBar, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/qibla')}>
              <Compass size={24} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.text }]}>{t('home.qibla')}</Text>
            </TouchableOpacity>
            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/names')}>
              <Book size={24} color={colors.highlight} />
              <Text style={[styles.actionText, { color: colors.text }]}>{t('home.names')}</Text>
            </TouchableOpacity>
            <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/quran-learn' as any)}>
              <GraduationCap size={24} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.text }]}>{t('home.learnQuran')}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* ── Suhur · Iftar · Tahajjud ─────────────────────────── */}
        {specialTimes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.specialTimes')}
            </Text>
            <View style={styles.specialGrid}>
              {specialTimes.map((item) => (
                <BlurView
                  key={item.label}
                  intensity={30}
                  tint={colors.glassTint as any}
                  style={[styles.specialCard, { borderColor: colors.border }]}
                >
                  <View style={styles.specialCardInner}>
                    {/* Top: name + sublabel */}
                    <View>
                      <Text style={[styles.specialLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.specialSublabel, { color: colors.textSecondary }]}>
                        {item.sublabel}
                      </Text>
                    </View>
                    {/* Bottom: time left + icon right */}
                    <View style={styles.specialBottom}>
                      <Text style={[styles.specialTime, { color: colors.highlight }]}>
                        {formatNumber(item.time, i18n.language)}
                      </Text>
                      <item.Icon size={16} color={colors.textSecondary} />
                    </View>
                  </View>
                </BlurView>
              ))}
            </View>
          </View>
        )}

        {/* ── Restricted Prayer Times ──────────────────────────── */}
        {restrictedTimes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.restrictedTimes')}
            </Text>
            <View style={styles.restrictedOuter}>
              {restrictedTimes.map((rt) => (
                <BlurView
                  key={rt.labelKey}
                  intensity={30}
                  tint={colors.glassTint as any}
                  style={[styles.restrictedCard, { borderColor: 'rgba(220,80,60,0.2)' }]}
                >
                  {/* 1/3 — short name */}
                  <View style={styles.restrictedNameCol}>
                    <Text style={[styles.restrictedLabel, { color: colors.text }]}>
                      {t('home.' + rt.labelKey)}
                    </Text>
                  </View>
                  {/* divider */}
                  <View style={styles.restrictedDivider} />
                  {/* 2/3 — time range */}
                  <View style={styles.restrictedTimeCol}>
                    <Text style={[styles.restrictedTime, { color: '#dc6040' }]}>
                      {formatNumber(rt.time, i18n.language)}
                    </Text>
                  </View>
                </BlurView>
              ))}
            </View>
          </View>
        )}

        {/* ── Daily Inspiration ─────────────────────────────────── */}
        {dailyVerse && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.dailyInspiration')}
            </Text>
            <BlurView intensity={20} tint={colors.glassTint as any} style={[styles.inspirationCard, { borderColor: colors.border }]}>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.quoteIconContainer}>
                  <BookOpen size={24} color={colors.accent} />
                </View>
                <Text style={[styles.inspirationArabic, { color: colors.highlight }]}>
                  {dailyVerse.arabic}
                </Text>
                {i18n.language !== 'bn' && (
                  <Text style={[styles.inspirationEnglish, { color: colors.text }]}>
                    {dailyVerse.translation}
                  </Text>
                )}
                {i18n.language === 'bn' && (
                  <Text style={[styles.inspirationBangla, { color: colors.textSecondary }]}>
                    {dailyVerse.translationBn}
                  </Text>
                )}
                <Text style={[styles.inspirationRef, { color: colors.accent }]}>
                  — {t('surahNames.' + dailyVerse.surahId, { defaultValue: dailyVerse.surahDefaultName })} {formatNumber(dailyVerse.surahId, i18n.language)}:{formatNumber(dailyVerse.ayahNum, i18n.language)}
                </Text>
              </View>
            </BlurView>
          </View>
        )}
      </ScrollView>

      {/* ── Floating Tasbeeh Counter ──────────────────────────────── */}
      <TasbeehFAB colors={colors} t={t} i18n={i18n} />
    </SafeAreaView>
  );
}

// ── Tasbeeh FAB ──────────────────────────────────────────────────────────────
const TASBEEH_CYCLE = ['Subhanallah', 'Alhamdulillah', 'Allahu Akbar'];
const TASBEEH_GOAL = 33;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function TasbeehFAB({ colors, t, i18n }: { colors: any; t: any; i18n: any }) {
  const [count, setCount] = useState(0);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [showLabel, setShowLabel] = useState(false);
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const size = 60;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);
  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * animatedProgress.value) / TASBEEH_GOAL,
  }));

  const scale = useSharedValue(1);
  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 18, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    });
    const next = count + 1;
    if (next > TASBEEH_GOAL) {
      const nextCycle = (cycleIndex + 1) % TASBEEH_CYCLE.length;
      setCycleIndex(nextCycle);
      setCount(1);
      animatedProgress.value = 0;
      animatedProgress.value = withTiming(1, { duration: 300 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowLabel(true);
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
      labelTimerRef.current = setTimeout(() => setShowLabel(false), 1800);
    } else {
      setCount(next);
      animatedProgress.value = withTiming(next, { duration: 250 });
      if (next === TASBEEH_GOAL) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowLabel(true);
        if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
        labelTimerRef.current = setTimeout(() => setShowLabel(false), 1800);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
    setCycleIndex(0);
    animatedProgress.value = withTiming(0, { duration: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLabel(false);
  };

  const progressFraction = count / TASBEEH_GOAL;
  const ringColor =
    progressFraction >= 1 ? colors.accent
    : progressFraction >= 0.6 ? colors.highlight
    : colors.textSecondary;

  return (
    <View style={fabStyles.container} pointerEvents="box-none">
      {showLabel && (
        <BlurView
          intensity={60}
          tint={colors.glassTint as any}
          style={[fabStyles.label, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
        >
          <Text style={[fabStyles.labelText, { color: colors.accent }]}>
            {TASBEEH_CYCLE[cycleIndex]} ✓
          </Text>
          <Text style={[fabStyles.labelSub, { color: colors.textSecondary }]}>
            {t('dua.cycleGoal', { cycle: formatNumber(cycleIndex + 1, i18n.language) })}
          </Text>
        </BlurView>
      )}

      <View style={fabStyles.row}>
        {count > 0 && (
          <TouchableOpacity
            onPress={handleReset}
            style={[fabStyles.reset, { backgroundColor: colors.background + 'CC', borderColor: colors.border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RotateCcw size={13} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <Animated.View style={animatedScale}>
          <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={fabStyles.button}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
                fill={colors.backgroundElement}
              />
              <G transform={`rotate(-90, ${size / 2}, ${size / 2})`}>
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={ringColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  animatedProps={animatedCircleProps}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
            <BlurView intensity={70} tint={colors.glassTint as any} style={[fabStyles.inner, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[fabStyles.count, { color: colors.text }]}>
                {formatNumber(count, i18n.language)}
              </Text>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const FAB_BOTTOM = Spacing.two + 20;

const fabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: FAB_BOTTOM,
    right: 20,
    alignItems: 'flex-end',
    gap: 8,
    zIndex: 10,
  },
  label: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
  },
  labelSub: {
    fontFamily: Fonts.outfit,
    fontSize: 11,
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reset: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  count: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
  },
});

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    paddingTop: 0,
  },

  // Greeting
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  arabicGreeting: {
    fontFamily: Fonts.arabic,
    fontSize: 16,
    lineHeight: 24,
  },
  hijriLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
  },


  // Hero Card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    padding: Spacing.three,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroPrayerName: {
    fontFamily: Fonts.outfit,
    fontSize: 28,
    lineHeight: 34,
  },
  heroTime: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    marginTop: 2,
  },
  heroRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  heroNextLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    marginBottom: 4,
  },
  heroCountdown: {
    fontFamily: Fonts.outfit,
    fontSize: 32,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontFamily: Fonts.outfit,
    fontSize: 11,
  },

  // Section
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    marginBottom: Spacing.two,
  },

  // Timeline (horizontal)
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  // Each prayer column
  timelineCol: {
    flex: 1,
    alignItems: 'center',
  },
  timelineName: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    marginBottom: 6,
  },
  timelineDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 6,
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: 'rgba(150,150,150,0.3)',
    zIndex: 1,
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  timelineConnectorLeft: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  timelineConnectorRight: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  timelineTime: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  nextBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  nextBadgeText: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
  },

  // Special times
  specialGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  specialCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.two,
    minHeight: 100,
  },
  specialCardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  specialLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
  },
  specialSublabel: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  specialBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  specialTime: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  specialIcon: {
    // reserved — icon now rendered via lucide component
  },

  // Restricted times
  restrictedOuter: {
    gap: Spacing.two,
  },
  restrictedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    gap: 12,
  },
  restrictedNameCol: {
    flex: 1,
  },
  restrictedLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    lineHeight: 18,
  },
  restrictedDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(220,96,64,0.3)',
  },
  restrictedTimeCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  restrictedTime: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    textAlign: 'right',
  },

  // Quick actions (Unified Toolbar)
  quickActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
  actionDivider: {
    width: 1,
    height: '60%',
    opacity: 0.5,
  },
  actionText: {
    fontFamily: Fonts.outfit,
    marginTop: Spacing.one,
    fontSize: 13,
  },

  // Daily inspiration card
  inspirationCard: {
    borderRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteIconContainer: {
    marginBottom: Spacing.four,
    opacity: 0.8,
  },
  inspirationArabic: {
    fontFamily: Fonts.arabic,
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing.four,
  },
  inspirationEnglish: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: Spacing.two,
  },
  inspirationBangla: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.four,
  },
  inspirationRef: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    fontWeight: '600',
  },
});
