import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { getLocalYYYYMMDD } from '@/utils/dateUtils';
import { storage } from '@/store/mmkv';
import { districtCoords } from '@/utils/districts';
import { getBanglaDate } from '@/utils/banglaCalendar';

export interface WidgetData {
  currentTime: Date;
  hijri: { day: string; monthEn: string; monthNumber: number; year: string } | null;
  banglaDate: { day: number; monthName: string; year: number } | null;
  prayersWithStatus: any[];
  currentPrayer: any;
  nextPrayer: any;
  timeToNextMs: number;
  progressPercent: number;
  specialTimes: any[];
  trackerData: Record<string, boolean>;
  isDarkTheme: boolean;
  lang: string;
}

export const getWidgetData = (lang: string = 'bn'): WidgetData => {
  const prefsStr = storage.getString('preferences-storage');
  let prefs = prefsStr ? JSON.parse(prefsStr).state : {};
  if (!prefs) prefs = {};

  const themeStr = storage.getString('theme-storage');
  let theme = themeStr ? JSON.parse(themeStr).state : {};
  let isDarkTheme = theme?.colorScheme === 'dark';

  let lat = prefs.location?.latitude;
  let lon = prefs.location?.longitude;
  let city = prefs.manualCity || prefs.location?.city || 'Dhaka';
  let isCityBased = !!prefs.manualCity || !prefs.location;
  
  if (isCityBased && districtCoords[city]) {
    lat = districtCoords[city].lat;
    lon = districtCoords[city].lon;
  }
  
  if (!lat || !lon) {
    lat = 23.8103;
    lon = 90.4125;
  }

  let method = prefs.calcMethod ?? 1;
  let madhab = prefs.madhab ?? 1;

  let params = CalculationMethod.Karachi();
  if (method === 2) params = CalculationMethod.NorthAmerica();
  if (method === 3) params = CalculationMethod.MuslimWorldLeague();
  
  params.madhab = madhab === 1 ? Madhab.Hanafi : Madhab.Shafi;

  const date = new Date();
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  const coordinates = new Coordinates(lat, lon);
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const formatTimeStr = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  
  const rawTimings = {
    Fajr: formatTimeStr(prayerTimes.fajr),
    Sunrise: formatTimeStr(prayerTimes.sunrise),
    Dhuhr: formatTimeStr(prayerTimes.dhuhr),
    Asr: formatTimeStr(prayerTimes.asr),
    Sunset: formatTimeStr(prayerTimes.maghrib),
    Maghrib: formatTimeStr(prayerTimes.maghrib),
    Isha: formatTimeStr(prayerTimes.isha),
  };

  let hijri = null;
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic', {day: 'numeric', month: 'numeric', year: 'numeric'}).formatToParts(date);
    const hDay = parts.find(p => p.type === 'day')?.value || '1';
    const hMonth = parts.find(p => p.type === 'month')?.value || '1';
    const hYear = parts.find(p => p.type === 'year')?.value || '1445';
    
    const HIJRI_MONTHS = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 
      'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
    ];
    
    let monthNum = parseInt(hMonth, 10);
    if (isNaN(monthNum)) monthNum = 1;
    
    let adj = prefs.hijriOffset || 0;
    let finalDay = parseInt(hDay, 10) + adj;
    
    hijri = {
      day: String(finalDay),
      monthEn: HIJRI_MONTHS[monthNum - 1] || 'Muharram',
      monthNumber: monthNum,
      year: hYear.replace(' AH', '')
    };
  } catch (e) {}

  const banglaDate = getBanglaDate(date, prefs.banglaOffset || 0);

  const parseTime = (timeStr: string, baseDate: Date): Date => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const formatAMPM = (date: Date): string => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
    return `${hours}:${String(minutes).padStart(2, '0')}${ampm}`;
  };

  const fardPrayers = [
    { id: 'fajr', key: 'Fajr', name: 'Fajr' },
    { id: 'sunrise', key: 'Sunrise', name: 'Sunrise' },
    { id: 'dhuhr', key: 'Dhuhr', name: 'Dhuhr' },
    { id: 'asr', key: 'Asr', name: 'Asr' },
    { id: 'maghrib', key: 'Maghrib', name: 'Maghrib' },
    { id: 'isha', key: 'Isha', name: 'Isha' },
  ].map((p) => ({
    id: p.id,
    name: p.name,
    time: formatAMPM(parseTime(rawTimings[p.key as keyof typeof rawTimings], today)),
    date: parseTime(rawTimings[p.key as keyof typeof rawTimings], today),
    status: 'future'
  }));

  const now = date.getTime();
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

  let curP: any = currentIdx >= 0 ? fardPrayers[currentIdx] : fardPrayers[fardPrayers.length - 1];
  let nxtP: any = nextIdx >= 0 ? fardPrayers[nextIdx] : fardPrayers[0];
  let nxtDate = nextIdx >= 0 ? nxtP.date : new Date(fardPrayers[0].date.getTime() + 24 * 3600000);

  if (curP.id === 'sunrise') {
    curP = { ...curP, id: 'dhuha', name: 'Dhuha' };
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
        curP = { ...curP, id: 'tahajjud', name: 'Tahajjud', date: tahajjudDate };
      } else {
        nxtP = { id: 'tahajjud', name: 'Tahajjud', time: formatAMPM(tahajjudDate), date: tahajjudDate, status: 'next' };
        nxtDate = tahajjudDate;
      }
    }
  }

  const timeToNextMs = Math.max(0, nxtDate.getTime() - now);

  const prayersWithStatus = fardPrayers.map((p, i) => {
    let status = 'future';
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

  // Special Times
  const fajrDate = parseTime(rawTimings.Fajr, today);
  const maghribDate = parseTime(rawTimings.Maghrib, today);

  const todaySuhurDate = new Date(fajrDate.getTime() - 1 * 60000);
  let suhurDate = todaySuhurDate;
  if (now > suhurDate.getTime()) suhurDate = new Date(suhurDate.getTime() + 24 * 3600000);
  
  let iftarDate = new Date(maghribDate.getTime() + 1 * 60000);
  if (now > iftarDate.getTime()) iftarDate = new Date(iftarDate.getTime() + 24 * 3600000);

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
  
  if (hijri) {
    const hDay = parseInt(hijri.day, 10);
    const hMonth = hijri.monthNumber;
    const isEidDay = (hMonth === 10 && hDay === 1) || (hMonth === 12 && hDay >= 10 && hDay <= 13);
    const isDayBeforeEid = (hMonth === 9 && (hDay === 29 || hDay === 30)) || (hMonth === 12 && hDay === 9);
    if (isEidDay) hideIftar = true;
    if (isDayBeforeEid && now > todaySuhurDate.getTime()) hideSahri = true;
  }

  const specialTimes = [
    { label: 'Suhur', id: 'suhur', time: hideSahri ? '--:--' : formatAMPM(suhurDate), date: hideSahri ? null : suhurDate },
    { label: 'Iftar', id: 'iftar', time: hideIftar ? '--:--' : formatAMPM(iftarDate), date: hideIftar ? null : iftarDate },
    { label: 'Tahajjud', id: 'tahajjud', time: formatAMPM(tahajjudDate), date: tahajjudDate },
  ];

  // Tracker Data
  const todayStr = getLocalYYYYMMDD();
  const historyStr = storage.getString('tracker-history-storage');
  let historyData: Record<string, any> = {};
  if (historyStr) {
    try {
      historyData = JSON.parse(historyStr).state?.history || {};
    } catch(e) {}
  }
  const trackerData = historyData[todayStr] || {};

  return {
    currentTime: date,
    hijri,
    banglaDate,
    prayersWithStatus,
    currentPrayer: curP,
    nextPrayer: nxtP,
    timeToNextMs,
    progressPercent,
    specialTimes,
    trackerData,
    isDarkTheme,
    lang
  };
};
