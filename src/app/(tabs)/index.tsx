import PageHeader from '@/components/page-header';
import SkeletonBox from '@/components/SkeletonBox';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useThemeStore } from '@/store/themeStore';
import { useQadaStore } from '@/store/qadaStore';
import { getDistrictName } from '@/utils/districts';
import { formatNumber } from '@/utils/formatNumber';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Book, BookOpen, CalendarDays, Compass, GraduationCap, MapPin, Share2, Brain, History } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

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

interface DailyVerse {
  arabic: string;
  translation: string;
  translationBn: string;
  surahId: number;
  surahDefaultName: string;
  ayahNum: number;
}

interface DailyHadith {
  arabic: string;
  english: string;
  bengali: string;
  reference: string;
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

const formatCountdown = (ms: number): string => {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};




import SpecialTimeCard, { SpecialTime } from '@/components/SpecialTimeCard';
import ThemeCard from '@/components/ThemeCard';

export default function HomeScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const qada = useQadaStore();
  const totalQada = qada.fajr + qada.dhuhr + qada.asr + qada.maghrib + qada.isha + qada.witr;
  
  const qadaBadgeText = t('home.qadaBadge', { 
    count: formatNumber(totalQada.toString(), i18n.language)
  });


  const [currentTime, setCurrentTime] = useState(new Date());
  const [rawTimings, setRawTimings] = useState<Record<string, string>>({});
  const [hijriRaw, setHijriRaw] = useState<{day: string, monthEn: string, monthNumber: number, year: string} | null>(null);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [dailyHadith, setDailyHadith] = useState<DailyHadith | null>(null);
  const [trackerHistory, setTrackerHistory] = useState<Record<string, Record<string, boolean>>>({});
  const prefs = usePreferencesStore();
  const locationCity = prefs.manualCity || prefs.location?.city || 'Dhaka';
  const locationName = getDistrictName(locationCity, i18n.language);

  const hadithRef = useRef(null);

  const shareHadith = async () => {
    try {
      if (hadithRef.current) {
        const uri = await (hadithRef.current as any).capture();
        await Sharing.shareAsync(uri, { dialogTitle: 'Share Hadith' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Load tracker history
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('imansync_tracker_history').then(val => {
        if (val) {
          try { setTrackerHistory(JSON.parse(val)); } catch (e) {}
        }
      });
    }, [])
  );

  const todayStr = getLocalYYYYMMDD();
  const todayTasks = trackerHistory[todayStr] || {};

  const togglePrayerTask = (prayerId: string) => {
    const currentDayStr = getLocalYYYYMMDD();
    setTrackerHistory(prev => {
      const todayData = prev[currentDayStr] || {};
      const nextToday = { ...todayData, [prayerId]: !todayData[prayerId] };
      const nextHistory = { ...prev, [currentDayStr]: nextToday };
      AsyncStorage.setItem('imansync_tracker_history', JSON.stringify(nextHistory)).catch(console.error);
      return nextHistory;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };



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

  // Fetch a random daily Hadith from Bukhari
  useEffect(() => {
    const todayStr = getLocalYYYYMMDD();
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hadithNum = (Math.abs(hash) % 7563) + 1; // Sahih al-Bukhari has ~7563 hadiths

    Promise.all([
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-bukhari/${hadithNum}.json`).then((r) => r.json()),
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${hadithNum}.json`).then((r) => r.json()),
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-bukhari/${hadithNum}.json`).then((r) => r.json()),
    ])
      .then(([arJson, enJson, bnJson]) => {
        if (arJson.hadiths?.[0] && enJson.hadiths?.[0] && bnJson.hadiths?.[0]) {
          setDailyHadith({
            arabic: arJson.hadiths[0].text,
            english: enJson.hadiths[0].text,
            bengali: bnJson.hadiths[0].text,
            reference: `Sahih al-Bukhari ${hadithNum}`
          });
        }
      })
      .catch((e) => console.error('Hadith fetch error:', e));
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

  const { currentPrayer, nextPrayer, timeToNextMs, prayersWithStatus, progressPercent } =
    useMemo(() => {
      if (fardPrayers.length === 0) {
        return {
          currentPrayer: { id: '', name: t('home.loading'), time: '' },
          nextPrayer: { id: '', name: t('home.loading'), time: '' },
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

      // After Isha — current is Isha, next is tomorrow's Fajr
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
    if (fardPrayers.length === 0) return { left: 0, width: 0 };
    const timelinePrayers = fardPrayers.filter(p => p.id !== 'sunrise');
    if (timelinePrayers.length < 5) return { left: 0, width: 0 };
    
    const now = currentTime.getTime();
    const fajrTime = timelinePrayers[0].date.getTime();
    const ishaTime = timelinePrayers[4].date.getTime();
    
    if (now <= fajrTime) return { left: 0, width: 0 };
    if (now >= ishaTime) return { left: 100, width: 0 };
    
    let currentIdx = -1;
    for (let i = 0; i < timelinePrayers.length - 1; i++) {
      if (now >= timelinePrayers[i].date.getTime() && now < timelinePrayers[i+1].date.getTime()) {
        currentIdx = i;
        break;
      }
    }
    
    if (currentIdx === -1) return { left: 100, width: 0 };
    
    const segmentStart = timelinePrayers[currentIdx].date.getTime();
    const segmentEnd = timelinePrayers[currentIdx+1].date.getTime();
    const segmentProgress = (now - segmentStart) / (segmentEnd - segmentStart);
    
    return {
      left: currentIdx * 25,
      width: segmentProgress * 25
    };
  }, [fardPrayers, currentTime]);

  const countdownStr = useMemo(() => formatCountdown(timeToNextMs), [timeToNextMs]);
  const displayCountdown = formatNumber(countdownStr, i18n.language);
  const isCurrentPrayerDone = !!todayTasks[currentPrayer?.id];

  // Special times: Suhur (Imsak), Iftar (Maghrib), Tahajjud (Lastthird)
  const specialTimes: SpecialTime[] = useMemo(() => {
    if (!rawTimings.Fajr || !rawTimings.Maghrib) return [];
    
    const now = currentTime.getTime();
    const fajrDate = parseTime(rawTimings.Fajr, today);
    const maghribDate = parseTime(rawTimings.Maghrib, today);

    // Calculate Suhur: 1 min before Fajr
    const todaySuhurDate = new Date(fajrDate.getTime() - 1 * 60000);
    let suhurDate = todaySuhurDate;
    if (now > suhurDate.getTime()) {
      suhurDate = new Date(suhurDate.getTime() + 24 * 3600000);
    }
    
    // Add 1 minute padding to Iftar (Maghrib + 1)
    let iftarDate = new Date(maghribDate.getTime() + 1 * 60000);
    if (now > iftarDate.getTime()) {
      iftarDate = new Date(iftarDate.getTime() + 24 * 3600000);
    }

    // Calculate Tahajjud (Last third of the night)
    let relevantMaghrib: Date;
    let relevantFajr: Date;
    
    if (now < fajrDate.getTime()) {
      relevantMaghrib = new Date(maghribDate.getTime() - 24 * 3600000);
      relevantFajr = fajrDate;
    } else {
      relevantMaghrib = maghribDate;
      relevantFajr = new Date(fajrDate.getTime() + 24 * 3600000);
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
        hideIftar = true; // Eid day: show sahri (for next day/custom fasting), hide iftar
      }
      
      if (isDayBeforeEid && now > todaySuhurDate.getTime()) {
        hideSahri = true; // Day before Eid: hide sahri ONLY AFTER the morning fast has started
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        titleEn="ImanSync"
        icon={require('../../../assets/images/zoomed-icon.png')}
        rightElement={
          <TouchableOpacity activeOpacity={1}
            onPress={() => router.push('/(tabs)/settings?highlight=location')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.backgroundElement,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MapPin size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary }} numberOfLines={1}>
              {locationName}
            </Text>
          </TouchableOpacity>
        }
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
          <TouchableOpacity activeOpacity={1} onPress={() => router.push('/calendar' as any)} disabled={!hijriDisplay}>
            <SkeletonBox loaded={!!hijriDisplay} width={180} height={14} borderRadius={7} color={colors.border}>
              <Text style={[styles.hijriLabel, { color: colors.textSecondary }]}>
                {hijriDisplay}
              </Text>
            </SkeletonBox>
          </TouchableOpacity>
        </View>


        {/* ── Current Prayer Card ────────────────────── */}
        <TouchableOpacity activeOpacity={1}
            onPress={() => prayersWithStatus.length > 0 ? togglePrayerTask(currentPrayer.id) : undefined}
            style={{ marginBottom: Spacing.four }}
          >
            <ThemeCard intensity={30} style={[styles.heroCard, { borderColor: colors.border, paddingVertical: 20, paddingHorizontal: 24, overflow: 'hidden', marginBottom: 0 }]}
            >
              {/* Animated green glow from top-left when prayer is marked done */}
              <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, animatedGlowStyle]}>
                <LinearGradient
                  colors={[colors.highlight + '30', colors.highlight + '08', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Animated.View>

              {/* Animated red glow when it's Makruh time and not done */}
              <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, animatedRedGlowStyle]}>
                <LinearGradient
                  colors={['#dc604030', '#dc604008', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Animated.View>

              {/* Tiny text indicator — top right */}
              <View style={{ position: 'absolute', top: 10, right: 14 }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 9, color: isCurrentPrayerDone ? colors.highlight : colors.textSecondary, opacity: 0.7 }}>
                  {isCurrentPrayerDone ? t('home.prayerDone') : t('home.tapToMark')}
                </Text>
              </View>

              {/* Centered Countdown */}
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 36 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                  {displayCountdown.split('').map((char, idx) => (
                    <Text 
                      key={idx} 
                      style={[
                        styles.heroCountdown, 
                        { 
                          color: (isMakruh && !isCurrentPrayerDone) ? '#dc6040' : (scheme === 'dark' ? colors.accent : colors.highlight),
                          fontSize: 36,
                          width: char === ':' || char === ' ' ? 14 : 22,
                          textAlign: 'center',
                          fontWeight: 'normal'
                        }
                      ]}
                    >
                      {char}
                    </Text>
                  ))}
                </View>
              </View>

              {/* Current + Next prayer labels above progress bar */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, marginTop: 32 }}>
                <View>
                  <SkeletonBox loaded={prayersWithStatus.length > 0} width={60} height={14} borderRadius={6} color={colors.border} style={{ marginBottom: 2 }}>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {currentPrayer.name}
                    </Text>
                  </SkeletonBox>
                  <SkeletonBox loaded={prayersWithStatus.length > 0} width={45} height={16} borderRadius={5} color={colors.border} style={{ marginTop: 2 }}>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                      {currentPrayer.time}
                    </Text>
                  </SkeletonBox>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <SkeletonBox loaded={prayersWithStatus.length > 0} width={60} height={14} borderRadius={6} color={colors.border} style={{ marginBottom: 2 }}>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {nextPrayer.name}
                    </Text>
                  </SkeletonBox>
                  <SkeletonBox loaded={prayersWithStatus.length > 0} width={45} height={16} borderRadius={5} color={colors.border} style={{ marginTop: 2 }}>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>
                      {nextPrayer.time}
                    </Text>
                  </SkeletonBox>
                </View>
              </View>

              {/* Full-width Dynamic Progress Bar */}
              <AnimatedProgressBar
                progress={prayersWithStatus.length > 0 ? progressPercent : 0}
                color={progressPercent < 50 ? colors.highlight : progressPercent < 75 ? colors.accent : '#dc6040'}
                trackColor={colors.border}
                height={4}
                duration={800}
              />
            </ThemeCard>
          </TouchableOpacity>

        {/* ── Quick Actions (2x2 Grid) ──────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('home.quickActions')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <ThemeCard intensity={40} style={[styles.actionItemCard, { borderColor: colors.border }]}>
              <TouchableOpacity activeOpacity={1}
                style={styles.actionItemBlur} 
                onPress={() => router.push('/qibla')}
              >
                <Compass size={20} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.qibla')}</Text>
              </TouchableOpacity>
            </ThemeCard>
            
            <ThemeCard intensity={40} style={[styles.actionItemCard, { borderColor: colors.border }]}>
              <TouchableOpacity activeOpacity={1}
                style={styles.actionItemBlur} 
                onPress={() => router.push('/names')}
              >
                <Book size={20} color={colors.highlight} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.names')}</Text>
              </TouchableOpacity>
            </ThemeCard>
            
            <ThemeCard intensity={40} style={[styles.actionItemCard, { borderColor: colors.border }]}>
              <TouchableOpacity activeOpacity={1}
                style={styles.actionItemBlur} 
                onPress={() => router.push('/quran-learn' as any)}
              >
                <GraduationCap size={20} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.learnQuran')}</Text>
              </TouchableOpacity>
            </ThemeCard>

            <ThemeCard intensity={40} style={[styles.actionItemCard, { borderColor: colors.border }]}>
              <TouchableOpacity activeOpacity={1}
                style={styles.actionItemBlur} 
                onPress={() => router.push('/calendar' as any)}
              >
                <CalendarDays size={20} color={colors.highlight} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('calendar.titleEn', { defaultValue: 'Islamic Calendar' })}</Text>
              </TouchableOpacity>
            </ThemeCard>

            <ThemeCard intensity={40} style={[styles.actionItemCard, { borderColor: colors.border }]}>
              <TouchableOpacity activeOpacity={1}
                style={styles.actionItemBlur} 
                onPress={() => router.push('/trivia' as any)}
              >
                <Brain size={20} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.trivia', { defaultValue: 'Islamic Trivia' })}</Text>
              </TouchableOpacity>
            </ThemeCard>

            <ThemeCard intensity={40} style={[styles.actionItemCard, { borderColor: totalQada > 0 ? colors.error + '40' : colors.border }]}>
              <TouchableOpacity activeOpacity={1}
                style={[styles.actionItemBlur, totalQada > 0 && { backgroundColor: colors.error + '10' }]}
                onPress={() => router.push('/qada-tracker' as any)}
              >
                {totalQada > 0 ? (
                  <>
                    <History size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>{qadaBadgeText}</Text>
                  </>
                ) : (
                  <>
                    <History size={20} color={colors.highlight} />
                    <Text style={[styles.actionText, { color: colors.text }]}>{t('tracker.qadaTitle', { defaultValue: 'Qada Tracker' })}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ThemeCard>
          </View>
        </View>

        {/* ── Prayer Times Group ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('home.prayerTimesGroup')}</Text>

          {/* Today's Prayers — Horizontal 5-Point Timeline */}
          {prayersWithStatus.length > 0 ? (
            <ThemeCard intensity={30} style={[styles.timelineCard, { borderColor: colors.border }]}
            >
              <View style={{ position: 'relative', width: '100%', alignItems: 'center' }}>
                {/* Row 1: Names */}
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
                  {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer) => {
                    const isCurrent = prayer.status === 'current';
                    return (
                      <View key={`name-${prayer.id}`} style={{ width: '20%', alignItems: 'center' }}>
                        <Text style={[styles.timelineName, { marginBottom: 0, color: isCurrent ? colors.highlight : colors.text, opacity: isCurrent ? 1 : 0.5 }]}>
                          {prayer.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Row 2: Dots & Lines */}
                <View style={{ position: 'relative', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, zIndex: 2 }}>
                  <View style={{ position: 'absolute', left: '10%', right: '10%', height: 2, backgroundColor: '#2d2d2dff', borderRadius: 1, zIndex: 0 }} />
                  <View style={{ position: 'absolute', left: '10%', right: '10%', height: 2, borderRadius: 1, zIndex: 1 }}>
                    <Animated.View style={{ position: 'absolute', left: `${timelineProgress.left}%`, height: '100%', backgroundColor: colors.highlight, borderRadius: 1, width: `${timelineProgress.width}%` }} />
                  </View>
                  {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer) => {
                    const isCurrent = prayer.status === 'current';
                    let dotStyle: any = { backgroundColor: '#2d2d2dff' };
                    if (isCurrent) {
                      dotStyle = { backgroundColor: colors.highlight };
                    }
                    return (
                      <View key={`dot-${prayer.id}`} style={{ width: '20%', alignItems: 'center' }}>
                        <View style={[styles.timelineDot, dotStyle]} />
                      </View>
                    );
                  })}
                </View>

                {/* Row 3: Times */}
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                  {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer) => {
                    const isCurrent = prayer.status === 'current';
                    return (
                      <View key={`time-${prayer.id}`} style={{ width: '20%', alignItems: 'center' }}>
                        <Text style={[styles.timelineTime, { color: isCurrent ? colors.highlight : colors.text, opacity: 1 }]}>
                          {formatNumber(prayer.time, i18n.language)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ThemeCard>
          ) : null}
          {prayersWithStatus.length === 0 && (
            <ThemeCard intensity={30} style={[styles.timelineCard, { borderColor: colors.border }]}>
              <View style={{ position: 'relative', width: '100%', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
                  {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map((_, i) => (
                    <View key={`name-skel-${i}`} style={{ width: '20%', alignItems: 'center' }}>
                      <SkeletonBox width={38} height={20} borderRadius={6} color={colors.border} loaded={false} />
                    </View>
                  ))}
                </View>
                <View style={{ position: 'relative', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, zIndex: 2 }}>
                  <View style={{ position: 'absolute', left: '10%', right: '10%', height: 2, backgroundColor: colors.background, borderRadius: 1, zIndex: 0 }} />
                  {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map((_, i) => (
                    <View key={`dot-skel-${i}`} style={{ width: '20%', alignItems: 'center' }}>
                      <View style={[styles.timelineDot, { backgroundColor: colors.background }]} />
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                  {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map((_, i) => (
                    <View key={`time-skel-${i}`} style={{ width: '20%', alignItems: 'center' }}>
                      <SkeletonBox width={44} height={20} borderRadius={5} color={colors.border} loaded={false} />
                    </View>
                  ))}
                </View>
              </View>
            </ThemeCard>
          )}

          {/* Suhur · Iftar · Tahajjud */}
          {specialTimes.length > 0 ? (
            <View style={{ marginTop: Spacing.three }}>
              <Text style={[styles.subSectionLabelOuter, { color: colors.textSecondary }]}>{t('home.specialTimes')}</Text>
              <View style={styles.specialGrid}>
                {specialTimes.map((item) => (
                  <SpecialTimeCard key={item.label} item={item} colors={colors} i18nLanguage={i18n.language} styles={styles} t={t} />
                ))}
              </View>
            </View>
          ) : null}
          {specialTimes.length === 0 && (
            <View style={{ marginTop: Spacing.three }}>
              <Text style={[styles.subSectionLabelOuter, { color: colors.textSecondary }]}>{t('home.specialTimes')}</Text>
              <View style={styles.specialGrid}>
                {['Suhur','Iftar','Tahajjud'].map((label, i) => (
                  <ThemeCard key={i} style={[styles.specialCard]}>
                    <View style={[styles.specialCardInner, { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }]}>
                      <SkeletonBox width={70} height={42} borderRadius={6} color={colors.border} style={{ marginBottom: 4 }} loaded={false} />
                      <Text style={{ fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
                    </View>
                  </ThemeCard>
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
                  <ThemeCard key={rt.labelKey} intensity={30} style={[styles.restrictedCard, { borderColor: 'rgba(220,80,60,0.2)' }]}>
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
                  </ThemeCard>
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
            <ThemeCard intensity={20} style={[styles.inspirationCard, { borderColor: colors.border }]}>
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
            </ThemeCard>
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('home.dailyInspiration')}
            </Text>
            <ThemeCard style={[styles.inspirationCard, { borderColor: colors.border, paddingHorizontal: Spacing.four, paddingVertical: Spacing.six }]}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <SkeletonBox width={24} height={24} borderRadius={12} color={colors.border} loaded={false} />
                <SkeletonBox width={200} height={32} borderRadius={8} color={colors.border} loaded={false} />
                <SkeletonBox width={260} height={32} borderRadius={8} color={colors.border} loaded={false} />
                <SkeletonBox width={180} height={32} borderRadius={8} color={colors.border} loaded={false} />
                <SkeletonBox width={240} height={20} borderRadius={7} color={colors.border} style={{ marginTop: 4 }} loaded={false} />
                <SkeletonBox width={200} height={20} borderRadius={7} color={colors.border} loaded={false} />
                <SkeletonBox width={120} height={16} borderRadius={6} color={colors.border} style={{ marginTop: 4 }} loaded={false} />
              </View>
            </ThemeCard>
          </View>
        )}

        {/* ── Hadith of the Day ─────────────────────────────────── */}
        <View style={{ marginTop: Spacing.four }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two }}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
              {t('home.hadithOfTheDay', { defaultValue: 'Hadith of the Day' })}
            </Text>
            <TouchableOpacity activeOpacity={1} onPress={shareHadith} style={{ padding: 4 }}>
              <Share2 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {dailyHadith ? (
            <ViewShot ref={hadithRef} options={{ format: 'png', quality: 1 }}>
              <ThemeCard intensity={20} style={[styles.inspirationCard, { borderColor: colors.border, padding: Spacing.six }]}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.four, lineHeight: 24 }}>
                    "{i18n.language === 'bn' ? dailyHadith.bengali : dailyHadith.english}"
                  </Text>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.accent, marginTop: 4 }}>
                    — {dailyHadith.reference}
                  </Text>
                </View>
              </ThemeCard>
            </ViewShot>
          ) : (
            <ThemeCard style={[styles.inspirationCard, { borderColor: colors.border, paddingHorizontal: Spacing.four, paddingVertical: Spacing.six }]}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <SkeletonBox width={260} height={24} borderRadius={8} color={colors.border} loaded={false} />
                <SkeletonBox width={220} height={24} borderRadius={8} color={colors.border} loaded={false} />
                <SkeletonBox width={150} height={24} borderRadius={8} color={colors.border} loaded={false} />
                <SkeletonBox width={100} height={16} borderRadius={6} color={colors.border} style={{ marginTop: 8 }} loaded={false} />
              </View>
            </ThemeCard>
          )}
        </View>

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
  },

  // Greeting
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
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
    height: 15,
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
    fontSize: 15,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  timelineTime: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
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
    fontSize: 15,
    textAlign: 'right',
  },

  // Quick actions (2x2 Grid Layout)
  actionItemCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 1,
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
