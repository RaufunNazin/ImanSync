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

  const hijriFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const prayerTimes = new PrayerTimes(coords, date, params);

    const hijriStr = hijriFormatter.format(date); // e.g. "Muharram 14, 1446 AH"
    const parts = hijriStr.replace(' AH', '').split(' ');
    // e.g. ["Muharram", "14,", "1446"]
    const hijriMonthEn = parts[0];
    const hijriDay = parts[1].replace(',', '');
    const hijriYear = parts[2];

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
          month: { number: 1, en: hijriMonthEn, ar: hijriMonthEn },
          year: hijriYear,
          weekday: { en: date.toLocaleString('en-US', { weekday: 'long' }), ar: '' },
          holidays: []
        }
      }
    });
  }

  return calendarData;
};
