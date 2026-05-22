import notifee, { TimestampTrigger, TriggerType, AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferencesStore, QuietHours } from '../store/preferencesStore';
import i18n from '@/i18n';

const PRAYERS_CHANNEL = 'prayers_channel';
const EVENTS_CHANNEL = 'events_channel';
const TASKS_CHANNEL = 'tasks_channel';

// Helper to check if a Date is within quiet hours
function isQuietHour(date: Date, qh: QuietHours): boolean {
  const h = date.getHours();
  // Check night rest
  if (qh.nightStart > qh.nightEnd) { // e.g. 23 to 5
    if (h >= qh.nightStart || h < qh.nightEnd) return true;
  } else {
    if (h >= qh.nightStart && h < qh.nightEnd) return true;
  }
  // Check afternoon rest
  if (h >= qh.afternoonStart && h < qh.afternoonEnd) return true;
  
  return false;
}

// Get a random time within the day that is NOT a quiet hour
function getRandomAllowedTime(targetDate: Date, qh: QuietHours): Date {
  const date = new Date(targetDate);
  let attempts = 0;
  while (attempts < 50) {
    // Pick random hour between 6 AM and 10 PM roughly
    const hour = Math.floor(Math.random() * 24);
    const min = Math.floor(Math.random() * 60);
    date.setHours(hour, min, 0, 0);
    
    if (!isQuietHour(date, qh)) {
      return date;
    }
    attempts++;
  }
  // fallback if somehow we can't find one
  date.setHours(12, 0, 0, 0);
  return date;
}

// Convert "04:30" (24h) to a Date object on a specific day
function parseTimeString(timeStr: string, date: Date): Date {
  const clean = timeStr.split(' ')[0]; // remove " (EST)" if present
  const [h, m] = clean.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function setupChannels() {
  await notifee.requestPermission();
  
  await notifee.createChannel({
    id: PRAYERS_CHANNEL,
    name: 'Prayer Alerts',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: EVENTS_CHANNEL,
    name: 'Islamic Events',
    importance: AndroidImportance.DEFAULT,
  });

  await notifee.createChannel({
    id: TASKS_CHANNEL,
    name: 'Task Reminders',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function scheduleAllNotifications() {
  const state = usePreferencesStore.getState();
  if (!state.notificationsEnabled) {
    await notifee.cancelAllNotifications();
    return;
  }

  await setupChannels();
  
  // Clear existing to avoid duplicates
  await notifee.cancelAllNotifications();

  // Fetch location & method for ALADHAN API
  let lat = 23.8103;
  let lon = 90.4125;
  let method = 1;
  let city = 'Dhaka';
  let country = 'Bangladesh';
  let isCityBased = true;

  const locVal = await AsyncStorage.getItem('imansync_location');
  const methVal = await AsyncStorage.getItem('imansync_calc_method');
  
  if (locVal) {
    try {
      let loc = JSON.parse(locVal);
      lat = loc.latitude;
      lon = loc.longitude;
      city = loc.city;
      isCityBased = false;
    } catch(e){}
  }
  if (methVal) {
    method = parseInt(methVal, 10);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  let url = isCityBased 
    ? `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=${country}&method=${method}`
    : `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${method}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      const today = now.getDate();
      
      // We will schedule for the next 7 days in the current month
      const daysToSchedule = json.data.filter((d: any) => {
        const dayNum = parseInt(d.date.gregorian.day, 10);
        return dayNum >= today && dayNum < today + 7;
      });

      for (let i = 0; i < daysToSchedule.length; i++) {
        const dayData = daysToSchedule[i];
        const dayNum = parseInt(dayData.date.gregorian.day, 10);
        const targetDate = new Date(year, month - 1, dayNum);
        
        // 1. Prayer Alerts
        if (state.prayerAlertsEnabled) {
          schedulePrayerDay(dayData.timings, targetDate, i === 0);
        }

        // 2. Events (Jumu'ah, White Days, etc)
        scheduleEventsDay(dayData, targetDate);

        // 3. Random Tasks (Quran)
        if (state.taskRemindersEnabled) {
          scheduleTaskDay(targetDate, state.quietHours);
        }
      }
    }
  } catch (e) {
    console.error('Failed to schedule notifications', e);
  }
}

async function schedulePrayerDay(timings: any, targetDate: Date, isToday: boolean) {
  const prayers = [
    { id: 'fajr', name: 'Fajr', time: timings.Fajr },
    { id: 'dhuhr', name: 'Dhuhr', time: timings.Dhuhr },
    { id: 'asr', name: 'Asr', time: timings.Asr },
    { id: 'maghrib', name: 'Maghrib', time: timings.Maghrib },
    { id: 'isha', name: 'Isha', time: timings.Isha },
  ];

  const now = new Date();

  for (let i = 0; i < prayers.length; i++) {
    const current = prayers[i];
    const prayerTime = parseTimeString(current.time, targetDate);
    
    // Start notification
    if (prayerTime.getTime() > now.getTime()) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
      };
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.prayerStartTitle', { prayer: current.name }),
        body: i18n.t('notifications.prayerStartBody', { prayer: current.name }),
        android: { channelId: PRAYERS_CHANNEL },
      }, trigger);
    }

    // Ending Warning (15 mins before NEXT prayer, except Isha)
    if (i < prayers.length - 1) {
      const next = prayers[i + 1];
      const nextTime = parseTimeString(next.time, targetDate);
      const warningTime = new Date(nextTime.getTime() - 15 * 60000);
      
      if (warningTime.getTime() > now.getTime()) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: warningTime.getTime(),
        };
        await notifee.createTriggerNotification({
          title: i18n.t('notifications.prayerEndTitle', { prayer: current.name }),
          body: i18n.t('notifications.prayerEndBody', { nextPrayer: next.name }),
          android: { channelId: PRAYERS_CHANNEL },
        }, trigger);
      }
    }
  }
}

async function scheduleEventsDay(dayData: any, targetDate: Date) {
  const now = new Date();
  
  // Thursday evening reminder for Surah Kahf
  if (targetDate.getDay() === 4) { // Thursday
    const triggerDate = new Date(targetDate);
    triggerDate.setHours(18, 0, 0, 0); // 6 PM Thursday
    if (triggerDate.getTime() > now.getTime()) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.jumuahTitle'),
        body: i18n.t('notifications.jumuahBody'),
        android: { channelId: EVENTS_CHANNEL },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() });
    }
  }

  // Monday/Thursday fasting reminder (schedule evening before)
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 1 || dayOfWeek === 4) { // Monday or Thursday
    const triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - 1); // Sunday or Wednesday
    triggerDate.setHours(20, 0, 0, 0); // 8 PM
    if (triggerDate.getTime() > now.getTime()) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.fastingTitle'),
        body: i18n.t('notifications.fastingBody', { day: dayOfWeek === 1 ? 'Monday' : 'Thursday' }),
        android: { channelId: EVENTS_CHANNEL },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() });
    }
  }

  // White Days (13, 14, 15 of Hijri)
  const hijriDay = parseInt(dayData.date.hijri.day, 10);
  if (hijriDay === 13 || hijriDay === 14 || hijriDay === 15) {
    const triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(19, 30, 0, 0);
    if (triggerDate.getTime() > now.getTime()) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.whiteDaysTitle'),
        body: i18n.t('notifications.whiteDaysBody', { day: hijriDay }),
        android: { channelId: EVENTS_CHANNEL },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() });
    }
  }
}

async function scheduleTaskDay(targetDate: Date, qh: QuietHours) {
  const now = new Date();
  const triggerDate = getRandomAllowedTime(targetDate, qh);
  
  if (triggerDate.getTime() > now.getTime()) {
    const messageKeys = [
      'notifications.taskQuranBody1',
      'notifications.taskQuranBody2',
      'notifications.taskQuranBody3',
      'notifications.taskQuranBody4',
    ];
    const msgKey = messageKeys[Math.floor(Math.random() * messageKeys.length)];
    
    await notifee.createTriggerNotification({
      title: i18n.t('notifications.taskQuranTitle'),
      body: i18n.t(msgKey),
      android: { channelId: TASKS_CHANNEL },
    }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime() });
  }
}
