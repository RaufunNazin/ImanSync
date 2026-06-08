import PageHeader from '@/components/page-header';
import SkeletonBox from '@/components/SkeletonBox';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useThemeStore } from '@/store/themeStore';
import { getDistrictName } from '@/utils/districts';
import { formatNumber } from '@/utils/formatNumber';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
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
import Animated, { useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
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

interface SpecialTime {
  label: string;
  time: string;
  date: Date | null;
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




// ── Component ────────────────────────────────────────────────────────────────

function SpecialTimeCard({ item, colors, i18nLanguage, styles, t }: { item: SpecialTime, colors: any, i18nLanguage: string, styles: any, t: any }) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [remainingStr, setRemainingStr] = useState('');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (showCountdown && item.date && item.time !== '--:--') {
      const update = () => {
        const diff = item.date!.getTime() - Date.now();
        if (diff <= 0) {
          setRemainingStr(formatNumber(t('home.timeRemainingMinsOnly', { minutes: '00' }), i18nLanguage));
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          if (h > 0) {
            setRemainingStr(formatNumber(t('home.timeRemaining', { hours: h.toString().padStart(2, '0'), minutes: m.toString().padStart(2, '0') }), i18nLanguage));
          } else {
            setRemainingStr(formatNumber(t('home.timeRemainingMinsOnly', { minutes: m.toString().padStart(2, '0') }), i18nLanguage));
          }
        }
      };
      update();
      interval = setInterval(update, 1000);

      timeout = setTimeout(() => {
        setShowCountdown(false);
      }, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [showCountdown, item.date?.getTime(), item.time, i18nLanguage, t]);

  return (
    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={() => {
      if (item.date && item.time !== '--:--') {
        setShowCountdown(true);
      }
    }}>
      <BlurView
        intensity={30}
        tint={colors.glassTint as any}
        style={[styles.specialCard, { borderColor: colors.border }]}
      >
        {/* Subtle tap cue */}
        {!showCountdown && item.date && item.time !== '--:--' && (
          <View style={{ position: 'absolute', top: 6, right: 7, opacity: 0.3 }}>
            <Text style={{ fontFamily: Fonts.outfit, fontSize: 8, color: colors.textSecondary }}>⏱</Text>
          </View>
        )}
        <View style={[styles.specialCardInner, { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }]}>
          <View style={{ height: 42, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            {showCountdown ? (
              <Animated.Text key="countdown" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ position: 'absolute', fontFamily: Fonts.outfit, fontSize: 16, lineHeight: 20, color: colors.highlight, textAlign: 'center' }}>
                {remainingStr}
              </Animated.Text>
            ) : (
              <Animated.Text key="time" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={{ position: 'absolute', fontFamily: Fonts.outfit, fontSize: 20, color: colors.accent, textAlign: 'center' }}>
                {formatNumber(item.time, i18nLanguage).split(/( AM| PM)/).map((part, index) => 
                  (part === ' AM' || part === ' PM') ? 
                    <Text key={index} style={{ fontSize: 11, fontWeight: '500' }}>{part}</Text> : 
                    part
                )}
              </Animated.Text>
            )}
          </View>
          <Text style={{ fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
            {showCountdown ? t('home.timeLeft') : item.label}
          </Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation();

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
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${hadithNum}.json`).then((r) => r.json()),
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-bukhari/${hadithNum}.json`).then((r) => r.json()),
    ])
      .then(([enJson, bnJson]) => {
        if (enJson.hadiths?.[0] && bnJson.hadiths?.[0]) {
          setDailyHadith({
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
          <TouchableOpacity
            activeOpacity={0.7}
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
          {hijriDisplay ? (
            <TouchableOpacity onPress={() => router.push('/calendar' as any)}>
              <Text style={[styles.hijriLabel, { color: colors.textSecondary }]}>
                {hijriDisplay}
              </Text>
            </TouchableOpacity>
          ) : (
            <SkeletonBox width={180} height={14} borderRadius={7} color={colors.border} />
          )}
        </View>


        {/* ── Current Prayer Card ────────────────────── */}
        {prayersWithStatus.length > 0 ? (
          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={() => togglePrayerTask(currentPrayer.id)}
            style={{ marginBottom: Spacing.four }}
          >
            <BlurView
              intensity={30}
              tint={colors.glassTint as any}
              style={[styles.heroCard, { borderColor: colors.border, paddingVertical: 20, paddingHorizontal: 24, overflow: 'hidden', marginBottom: 0 }]}
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
              <View style={{ alignItems: 'center', marginBottom: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <View>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {currentPrayer.name}
                  </Text>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                    {currentPrayer.time}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {nextPrayer.name}
                  </Text>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>
                    {nextPrayer.time}
                  </Text>
                </View>
              </View>

              {/* Full-width Dynamic Progress Bar */}
              <View style={{ width: '100%' }}>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: progressPercent < 50 ? colors.highlight : progressPercent < 75 ? colors.accent : '#dc6040', borderRadius: 2 }} />
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        ) : (
          <View style={[styles.heroCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement, borderWidth: 1, paddingVertical: 20, paddingHorizontal: 24, overflow: 'hidden', marginBottom: Spacing.four }]}>
            <SkeletonBox width={150} height={32} borderRadius={8} color={colors.border} style={{ alignSelf: 'center', marginBottom: 2 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.four }}>
              <View>
                <SkeletonBox width={60} height={12} borderRadius={6} color={colors.border} style={{ marginBottom: 2 }} />
                <SkeletonBox width={45} height={14} borderRadius={5} color={colors.border} style={{ marginTop: 2 }} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <SkeletonBox width={60} height={12} borderRadius={6} color={colors.border} style={{ marginBottom: 2 }} />
                <SkeletonBox width={45} height={14} borderRadius={5} color={colors.border} style={{ marginTop: 2 }} />
              </View>
            </View>
            <View style={{ width: '100%' }}>
              <SkeletonBox width={'100%' as any} height={4} borderRadius={2} color={colors.border} />
            </View>
          </View>
        )}

        {/* ── Quick Actions (2x2 Grid) ──────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('home.quickActions')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.actionItemCard, { borderColor: colors.border }]} 
              onPress={() => router.push('/qibla')}
            >
              <BlurView intensity={40} tint={colors.glassTint as any} style={styles.actionItemBlur}>
                <Compass size={20} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.qibla')}</Text>
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.actionItemCard, { borderColor: colors.border }]} 
              onPress={() => router.push('/names')}
            >
              <BlurView intensity={40} tint={colors.glassTint as any} style={styles.actionItemBlur}>
                <Book size={20} color={colors.highlight} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.names')}</Text>
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.actionItemCard, { borderColor: colors.border }]} 
              onPress={() => router.push('/quran-learn' as any)}
            >
              <BlurView intensity={40} tint={colors.glassTint as any} style={styles.actionItemBlur}>
                <GraduationCap size={20} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.learnQuran')}</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.actionItemCard, { borderColor: colors.border }]} 
              onPress={() => router.push('/calendar' as any)}
            >
              <BlurView intensity={40} tint={colors.glassTint as any} style={styles.actionItemBlur}>
                <CalendarDays size={20} color={colors.highlight} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('calendar.titleEn', { defaultValue: 'Islamic Calendar' })}</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.actionItemCard, { borderColor: colors.border }]} 
              onPress={() => router.push('/trivia' as any)}
            >
              <BlurView intensity={40} tint={colors.glassTint as any} style={styles.actionItemBlur}>
                <Brain size={20} color={colors.accent} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('home.trivia', { defaultValue: 'Islamic Trivia' })}</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.actionItemCard, { borderColor: colors.border }]} 
              onPress={() => router.push('/qada-tracker' as any)}
            >
              <BlurView intensity={40} tint={colors.glassTint as any} style={styles.actionItemBlur}>
                <History size={20} color={colors.highlight} />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('tracker.qadaTitle', { defaultValue: 'Qada Tracker' })}</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
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
                {prayersWithStatus.filter(p => p.id !== 'sunrise').map((prayer, index, arr) => {
                  const isCurrent = prayer.status === 'current';
                  const isNext = prayer.status === 'next';
                  const isPast = prayer.status === 'past';
                  const isFirst = index === 0;
                  const isLast = index === arr.length - 1;
                  const dotColor = isCurrent
                    ? colors.highlight
                    : isNext
                    ? 'transparent'
                    : isPast
                    ? colors.textSecondary
                    : colors.border;
                  const leftLineColor = (isPast || isCurrent) ? colors.highlight + '88' : colors.border;
                  const rightLineColor = (isPast || isCurrent) ? colors.highlight + '88' : colors.border;

                  return (
                    <View key={prayer.id} style={styles.timelineCol}>
                      <Text
                        style={[
                          styles.timelineName,
                          {
                            color: isCurrent
                              ? colors.highlight
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
                            { backgroundColor: isFirst ? 'transparent' : leftLineColor },
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
                            { backgroundColor: isLast ? 'transparent' : rightLineColor },
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
                  <SpecialTimeCard key={item.label} item={item} colors={colors} i18nLanguage={i18n.language} styles={styles} t={t} />
                ))}
              </View>
            </View>
          ) : (
            <View style={{ marginTop: Spacing.three }}>
              <View style={styles.specialGrid}>
                {[0,1,2].map(i => (
                  <View key={i} style={[styles.specialCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 20 }]}>
                    <View style={[styles.specialCardInner, { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }]}>
                      <SkeletonBox width={70} height={20} borderRadius={6} color={colors.border} style={{ marginBottom: 4 }} />
                      <SkeletonBox width={45} height={10} borderRadius={5} color={colors.border} />
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
            <SkeletonBox width={160} height={15} borderRadius={8} style={{ marginBottom: 12 }} color={colors.border} />
            <View style={[styles.inspirationCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 24, paddingHorizontal: Spacing.four, paddingVertical: Spacing.six }]}>
              <View style={{ alignItems: 'center', gap: 12 }}>
                <SkeletonBox width={40} height={40} borderRadius={20} color={colors.border} />
                <SkeletonBox width={200} height={24} borderRadius={8} color={colors.border} />
                <SkeletonBox width={260} height={24} borderRadius={8} color={colors.border} />
                <SkeletonBox width={180} height={24} borderRadius={8} color={colors.border} />
                <SkeletonBox width={240} height={14} borderRadius={7} color={colors.border} style={{ marginTop: 4 }} />
                <SkeletonBox width={200} height={14} borderRadius={7} color={colors.border} />
                <SkeletonBox width={120} height={12} borderRadius={6} color={colors.border} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        )}

        {/* ── Hadith of the Day ─────────────────────────────────── */}
        <View style={{ marginTop: Spacing.four, marginBottom: Spacing.six }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two }}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>
              {t('home.hadithOfTheDay', { defaultValue: 'Hadith of the Day' })}
            </Text>
            <TouchableOpacity onPress={shareHadith} style={{ padding: 4 }}>
              <Share2 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {dailyHadith ? (
            <ViewShot ref={hadithRef} options={{ format: 'png', quality: 1 }}>
              <BlurView intensity={20} tint={colors.glassTint as any} style={[styles.inspirationCard, { borderColor: colors.border, padding: Spacing.six, backgroundColor: colors.backgroundElement }]}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.four, lineHeight: 24 }}>
                    "{i18n.language === 'bn' ? dailyHadith.bengali : dailyHadith.english}"
                  </Text>
                  <Text style={{ fontFamily: Fonts.outfit, fontSize: 11, color: colors.accent, marginTop: 4 }}>
                    — {dailyHadith.reference}
                  </Text>
                </View>
              </BlurView>
            </ViewShot>
          ) : (
            <View>
              <View style={[styles.inspirationCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, borderWidth: 1, borderRadius: 24, paddingHorizontal: Spacing.four, paddingVertical: Spacing.six }]}>
                <View style={{ alignItems: 'center', gap: 12 }}>
                  <SkeletonBox width={260} height={20} borderRadius={8} color={colors.border} />
                  <SkeletonBox width={220} height={20} borderRadius={8} color={colors.border} />
                  <SkeletonBox width={150} height={20} borderRadius={8} color={colors.border} />
                  <SkeletonBox width={100} height={12} borderRadius={6} color={colors.border} style={{ marginTop: 8 }} />
                </View>
              </View>
            </View>
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
    paddingTop: 0,
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
