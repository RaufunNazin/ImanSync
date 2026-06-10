import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

const formatTime = (date: Date) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} (BST)`;
  return timeStr;
};

export const generateLocalCalendar = (
  year: number,
  month: number, // 1-indexed
  latitude: number,
  longitude: number,
  methodId: number,
  madhabId: number
) => {
  const coords = new Coordinates(latitude, longitude);
  let params = CalculationMethod.Karachi(); // Default
  if (methodId === 2) params = CalculationMethod.NorthAmerica();
  else if (methodId === 3) params = CalculationMethod.MuslimWorldLeague();

  if (madhabId === 1) {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const calendarData = [];

  const HIJRI_MONTHS_EN = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];

  const { toHijri } = require('hijri-date/lib/safe');

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const prayerTimes = new PrayerTimes(coords, date, params);

    const hDate = toHijri(date);
    const hijriMonthEn = HIJRI_MONTHS_EN[hDate.getMonth() - 1] || 'Muharram';
    const hijriDay = hDate.getDate().toString();
    const hijriYear = hDate.getFullYear().toString();

    const gregorianDate = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;

    calendarData.push({
      timings: {
        Fajr: formatTime(prayerTimes.fajr),
        Sunrise: formatTime(prayerTimes.sunrise),
        Dhuhr: formatTime(prayerTimes.dhuhr),
        Asr: formatTime(prayerTimes.asr),
        Sunset: formatTime(prayerTimes.maghrib), // approximation
        Maghrib: formatTime(prayerTimes.maghrib),
        Isha: formatTime(prayerTimes.isha),
        Imsak: formatTime(new Date(prayerTimes.fajr.getTime() - 10 * 60000)), // 10 mins before fajr
        Midnight: '00:00', // unused in UI
      },
      date: {
        readable: date.toDateString(),
        timestamp: date.getTime().toString(),
        gregorian: {
          date: gregorianDate,
          day: String(day).padStart(2, '0'),
          month: { number: month, en: date.toLocaleString('en-US', { month: 'long' }) },
          year: String(year),
          weekday: { en: date.toLocaleString('en-US', { weekday: 'long' }) }
        },
        hijri: {
          date: `${hijriDay}-${hijriMonthEn}-${hijriYear}`,
          day: hijriDay,
          month: { number: hDate.getMonth(), en: hijriMonthEn, ar: hijriMonthEn },
          year: hijriYear,
          weekday: { en: date.toLocaleString('en-US', { weekday: 'long' }), ar: '' },
          holidays: []
        }
      }
    });
  }

  return calendarData;
};
