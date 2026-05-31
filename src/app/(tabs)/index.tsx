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
  View
} from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeStore } from '@/store/themeStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import SkeletonBox from '@/components/SkeletonBox';

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
  const ampm = hours >= 12 ? ' PM' : ' AM';
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${String(minutes).padStart(2, '0')}${ampm}`;
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
  const [hijriRaw, setHijriRaw] = useState<{day: string, monthEn: string, monthNumber: number, year: string} | null>(null);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const prefs = usePreferencesStore();
  const locationCity = prefs.manualCity || prefs.location?.city || 'Dhaka';
  const locationName = getDistrictName(locationCity, i18n.language);

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch prayer times
  useEffect(() => {
    let lat = prefs.location?.latitude ?? 23.8103;
    let lon = prefs.location?.longitude ?? 90.4125;
    let method = prefs.calcMethod ?? 1;
    let madhab = prefs.madhab ?? 1;
    let isCityBased = !!prefs.manualCity || !prefs.location;
    let city = prefs.manualCity || prefs.location?.city || 'Dhaka';
    let country = 'Bangladesh';
    let adj = prefs.hijriOffset || 0;
    
    let url = isCityBased 
      ? `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method}&school=${madhab}&adj=${adj}`
      : `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}&school=${madhab}&adj=${adj}`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setRawTimings(json.data.timings);
          const hj = json.data.date.hijri;
          setHijriRaw({day: hj.day, monthEn: hj.month.en, monthNumber: hj.month.number, year: hj.year});
        }
      })
      .catch((e) => console.error('Prayer fetch error:', e));
  }, [prefs.calcMethod, prefs.madhab, prefs.location]);

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
    if (!rawTimings.Fajr || !rawTimings.Maghrib) return [];
    
    // Calculate Suhur: 1 min before Fajr
    const fajrDate = parseTime(rawTimings.Fajr, today);
    const suhurDate = new Date(fajrDate.getTime() - 1 * 60000);
    
    // Calculate Tahajjud (Last third of the night): Maghrib to tomorrow's Fajr
    const maghribDate = parseTime(rawTimings.Maghrib, today);
    const tomorrowFajr = new Date(fajrDate.getTime() + 24 * 3600000);
    const nightDuration = tomorrowFajr.getTime() - maghribDate.getTime();
    const tahajjudDate = new Date(maghribDate.getTime() + (nightDuration * 2 / 3));

    let hideSahri = false;
    let hideIftar = false;
    
    if (hijriRaw) {
      const hDay = parseInt(hijriRaw.day, 10);
      const hMonth = hijriRaw.monthNumber;
      
      const isEidDay = (hMonth === 10 && hDay === 1) || (hMonth === 12 && hDay >= 10 && hDay <= 13);
      const isDayBeforeEid = (hMonth === 9 && (hDay === 29 || hDay === 30)) || (hMonth === 12 && hDay === 9);

      if (isEidDay) {
        hideIftar = true; // Eid day: show sahri (for next day/custom fasting), hide iftar
      }
      
      if (isDayBeforeEid && new Date().getTime() > suhurDate.getTime()) {
        hideSahri = true; // Day before Eid: hide sahri ONLY AFTER the morning fast has started
      }
    }
    
    // Add 1 minute padding to Iftar (Maghrib + 1)
    const iftarDate = new Date(maghribDate.getTime() + 1 * 60000);

    return [
      {
        label: t('home.suhur'),
        sublabel: t('home.suhurDesc'),
        time: hideSahri ? '--:--' : formatAMPM(suhurDate, i18n.language),
        Icon: Moon,
      },
      {
        label: t('home.iftar'),
        sublabel: t('home.iftarDesc'),
        time: hideIftar ? '--:--' : formatAMPM(iftarDate, i18n.language),
        Icon: Sunset,
      },
      {
        label: t('home.tahajjud'),
        sublabel: t('home.tahajjudDesc'),
        time: formatAMPM(tahajjudDate, i18n.language),
        Icon: Star,
      },
    ];
  }, [rawTimings, today, t, i18n.language, hijriRaw]);

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

  const hijriDisplay = useMemo(() => {
    if (!hijriRaw) return '';
    const HIJRI_MONTHS = [
      'muharram', 'safar', 'rabi_al-awwal', 'rabi_al-thani', 
      'jumada_al-awwal', 'jumada_al-thani', 'rajab', 'sha\'ban', 
      'ramadan', 'shawwal', 'dhu_al-qi\'dah', 'dhu_al-hijjah'
    ];
    const monthKey = `hijri.${HIJRI_MONTHS[hijriRaw.monthNumber - 1]}`;
    const month = t(monthKey, { defaultValue: hijriRaw.monthEn });
    const suffix = t('hijri.ah', { defaultValue: 'AH' });
    
    let displayDay = parseInt(hijriRaw.day, 10) + (prefs.hijriOffset || 0);
    // basic bounds
    if (displayDay < 1) displayDay = 1;
    if (displayDay > 30) displayDay = 30;

    return `${formatNumber(displayDay.toString(), i18n.language)} ${month} ${formatNumber(hijriRaw.year, i18n.language)} ${suffix}`;
  }, [hijriRaw, t, i18n.language, prefs.hijriOffset]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        titleEn="ImanSync"
        titleAr={t('home.titleAr')}
        icon={require('../../../assets/images/zoomed-icon.png')}
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
          {hijriDisplay ? (
            <Text style={[styles.hijriLabel, { color: colors.textSecondary }]}>
              {hijriDisplay}
            </Text>
          ) : (
            <SkeletonBox width={180} height={14} borderRadius={7} style={{ marginTop: 4 }} color={colors.border} />
          )}
        </View>


        {/* ── Current Prayer Card (compact) ────────────────────── */}
        {prayersWithStatus.length > 0 ? (
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
                          textAlign: idx === displayCountdown.length - 1 ? 'right' : 'center'
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
        ) : (
          <View style={[styles.heroCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement, borderWidth: 1, borderRadius: 24, padding: 20 }]}>
            <View style={styles.heroRow}>
              <View style={styles.heroLeft}>
                <SkeletonBox width={60} height={12} borderRadius={6} color={colors.border} />
                <SkeletonBox width={100} height={22} borderRadius={8} style={{ marginTop: 8 }} color={colors.border} />
                <SkeletonBox width={70} height={12} borderRadius={6} style={{ marginTop: 6 }} color={colors.border} />
              </View>
              <View style={[styles.heroRight, { alignItems: 'flex-end' }]}>
                <SkeletonBox width={80} height={12} borderRadius={6} color={colors.border} />
                <SkeletonBox width={120} height={28} borderRadius={8} style={{ marginTop: 8 }} color={colors.border} />
                <SkeletonBox width={80} height={10} borderRadius={5} style={{ marginTop: 6 }} color={colors.border} />
              </View>
            </View>
          </View>
        )}

        {/* ── Quick Actions (Unified Toolbar Layout) ──────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('home.quickActions')}</Text>
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

        {/* ── Prayer Times Group ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('home.prayerTimesGroup')}</Text>

          {/* Today's Prayers — Horizontal 5-Point Timeline */}
          {prayersWithStatus.length > 0 ? (
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
                      <View style={styles.timelineDotRow}>
                        <View
                          style={[
                            styles.timelineConnectorLeft,
                            { backgroundColor: isFirst ? 'transparent' : lineColor },
                          ]}
                        />
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
                        <View
                          style={[
                            styles.timelineConnectorRight,
                            { backgroundColor: isLast ? 'transparent' : lineColor },
                          ]}
                        />
                      </View>
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
                    </View>
                  );
                })}
              </View>
            </BlurView>
          ) : (
            <View style={[styles.timelineCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement, borderWidth: 1, borderRadius: 20, padding: 20 }]}>
              <View style={styles.timelineRow}>
                {[0,1,2,3,4].map(i => (
                  <View key={i} style={[styles.timelineCol, { alignItems: 'center' }]}>
                    <SkeletonBox width={38} height={12} borderRadius={6} color={colors.border} />
                    <View style={[styles.timelineDotRow, { marginVertical: 8 }]}>
                      <SkeletonBox width={'100%' as any} height={2} borderRadius={1} color={colors.border} style={{ flex: 1 }} />
                      <SkeletonBox width={10} height={10} borderRadius={5} color={colors.border} style={{ marginHorizontal: 2 }} />
                      <SkeletonBox width={'100%' as any} height={2} borderRadius={1} color={colors.border} style={{ flex: 1 }} />
                    </View>
                    <SkeletonBox width={44} height={10} borderRadius={5} color={colors.border} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Suhur · Iftar · Tahajjud */}
          {specialTimes.length > 0 ? (
            <View style={{ marginTop: Spacing.three }}>
              <Text style={[styles.subSectionLabelOuter, { color: colors.textSecondary }]}>{t('home.specialTimes')}</Text>
              <View style={styles.specialGrid}>
                {specialTimes.map((item) => (
                  <BlurView
                    key={item.label}
                    intensity={30}
                    tint={colors.glassTint as any}
                    style={[styles.specialCard, { borderColor: colors.border }]}
                  >
                    <View style={styles.specialCardInner}>
                      <View>
                        <Text style={[styles.specialLabel, { color: colors.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.specialSublabel, { color: colors.textSecondary }]}>
                          {item.sublabel}
                        </Text>
                      </View>
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
          ) : (
            <View style={{ marginTop: Spacing.three }}>
              <View style={styles.specialGrid}>
                {[0,1,2].map(i => (
                  <View key={i} style={[styles.specialCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 20 }]}>
                    <View style={[styles.specialCardInner, { justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14 }]}>
                      <SkeletonBox width={64} height={14} borderRadius={7} color={colors.border} />
                      <SkeletonBox width={40} height={10} borderRadius={5} style={{ marginTop: 6 }} color={colors.border} />
                      <SkeletonBox width={52} height={18} borderRadius={8} style={{ marginTop: 12 }} color={colors.border} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Restricted Prayer Times */}
          {restrictedTimes.length > 0 && (
            <View style={{ marginTop: Spacing.three }}>
              <Text style={[styles.subSectionLabelOuter, { color: colors.textSecondary }]}>{t('home.restrictedTimes')}</Text>
              <View style={styles.restrictedOuter}>
                {restrictedTimes.map((rt) => (
                  <BlurView
                    key={rt.labelKey}
                    intensity={30}
                    tint={colors.glassTint as any}
                    style={[styles.restrictedCard, { borderColor: 'rgba(220,80,60,0.2)' }]}
                  >
                    <View style={styles.restrictedNameCol}>
                      <Text style={[styles.restrictedLabel, { color: colors.text }]}>
                        {t('home.' + rt.labelKey)}
                      </Text>
                    </View>
                    <View style={styles.restrictedDivider} />
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
        </View>


        {/* ── Daily Inspiration ─────────────────────────────────── */}
        {dailyVerse ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
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
        ) : (
          <View>
            <SkeletonBox width={160} height={18} borderRadius={8} style={{ marginBottom: 12 }} color={colors.border} />
            <View style={[styles.inspirationCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 24, padding: 28 }]}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <SkeletonBox width={40} height={40} borderRadius={20} color={colors.border} />
                <SkeletonBox width={200} height={18} borderRadius={8} color={colors.border} />
                <SkeletonBox width={260} height={18} borderRadius={8} color={colors.border} />
                <SkeletonBox width={180} height={18} borderRadius={8} color={colors.border} />
                <SkeletonBox width={240} height={14} borderRadius={7} color={colors.border} style={{ marginTop: 4 }} />
                <SkeletonBox width={200} height={14} borderRadius={7} color={colors.border} />
                <SkeletonBox width={120} height={12} borderRadius={6} color={colors.border} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingVertical: Spacing.three,
    paddingHorizontal: 20,
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
    fontSize: 32,
    lineHeight: 47.5,
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
    fontSize: 10,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
  },
  subSectionLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  subSectionLabelOuter: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
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
