import i18n from '@/i18n';
import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import { QuietHours, usePreferencesStore } from '../store/preferencesStore';

const PRAYERS_CHANNEL = 'prayers_channel_v3';
const EVENTS_CHANNEL = 'events_channel_v3';
const TASKS_CHANNEL = 'tasks_channel_v3';

// Check if a day is Eid al-Fitr or Eid al-Adha/Tashreeq days (fasting is forbidden)
function isForbiddenFastingDay(hijriDay: number, hijriMonth: number): boolean {
  // Eid al-Fitr: 1st of Shawwal (Month 10)
  if (hijriMonth === 10 && hijriDay === 1) return true;
  // Eid al-Adha & Days of Tashreeq: 10th to 13th of Dhu al-Hijjah (Month 12)
  if (hijriMonth === 12 && hijriDay >= 10 && hijriDay <= 13) return true;
  return false;
}

// Helper to check if a Date is within quiet hours
function isQuietHour(date: Date, qh: QuietHours): boolean {
  if (!qh.enabled) return false;

  const h = date.getHours();
  const m = date.getMinutes();
  const time = h * 60 + m;
  const start = qh.startHour * 60 + qh.startMinute;
  const end = qh.endHour * 60 + qh.endMinute;

  if (start > end) {
    // crosses midnight (e.g. 23:30 to 05:00)
    if (time >= start || time <= end) return true;
  } else {
    if (time >= start && time <= end) return true;
  }
  
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
    sound: 'bird',
  });

  await notifee.createChannel({
    id: EVENTS_CHANNEL,
    name: 'Islamic Events',
    importance: AndroidImportance.DEFAULT,
    sound: 'bird',
  });

  await notifee.createChannel({
    id: TASKS_CHANNEL,
    name: 'Task Reminders',
    importance: AndroidImportance.DEFAULT,
    sound: 'bird',
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
  let lat = state.location?.latitude ?? 23.8103;
  let lon = state.location?.longitude ?? 90.4125;
  let method = state.calcMethod ?? 1;
  let madhab = state.madhab ?? 1;
  let city = state.manualCity || state.location?.city || 'Dhaka';
  let country = 'Bangladesh';
  let isCityBased = !!state.manualCity || !state.location;
  let adj = state.hijriOffset || 0;

  // Preferences now handled by store directly

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  let url = isCityBased 
    ? `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=${country}&method=${method}&school=${madhab}&adj=${adj}`
    : `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${method}&school=${madhab}&adj=${adj}`;

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
          await schedulePrayerDay(dayData.timings, targetDate, i === 0);
        }

        // 2. Events (Jumu'ah, White Days, etc)
        await scheduleEventsDay(dayData, targetDate);

        // 3. Random Tasks (Quran)
        if (state.taskRemindersEnabled) {
          await scheduleTaskDay(targetDate, state.quietHours);
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
        alarmManager: { allowWhileIdle: true },
      };
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.prayerStartTitle', { prayer: current.name }),
        body: i18n.t('notifications.prayerStartBody', { prayer: current.name }),
        android: { showTimestamp: true, channelId: PRAYERS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
        ios: { sound: 'bird.wav', badgeCount: 1 },
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
          alarmManager: { allowWhileIdle: true },
        };
        await notifee.createTriggerNotification({
          title: i18n.t('notifications.prayerEndTitle', { prayer: current.name }),
          body: i18n.t('notifications.prayerEndBody', { nextPrayer: next.name }),
          android: { showTimestamp: true, channelId: PRAYERS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
          ios: { sound: 'bird.wav', badgeCount: 1 },
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
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
        ios: { sound: 'bird.wav', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }

  // Monday/Thursday fasting reminder (schedule evening before)
  const dayOfWeek = targetDate.getDay();
  const hijriMonth = parseInt(dayData.date.hijri.month.number, 10);
  const hijriDay = parseInt(dayData.date.hijri.day, 10);
  const isForbiddenDay = isForbiddenFastingDay(hijriDay, hijriMonth);

  if (!isForbiddenDay && (dayOfWeek === 1 || dayOfWeek === 4)) { // Monday or Thursday
    const triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - 1); // Sunday or Wednesday
    triggerDate.setHours(20, 0, 0, 0); // 8 PM
    if (triggerDate.getTime() > now.getTime()) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.fastingTitle'),
        body: i18n.t('notifications.fastingBody', { day: dayOfWeek === 1 ? 'Monday' : 'Thursday' }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
        ios: { sound: 'bird.wav', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }

  // White Days (13, 14, 15 of Hijri)
  if (!isForbiddenDay && (hijriDay === 13 || hijriDay === 14 || hijriDay === 15)) {
    const triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(19, 30, 0, 0);
    if (triggerDate.getTime() > now.getTime()) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.whiteDaysTitle'),
        body: i18n.t('notifications.whiteDaysBody', { day: hijriDay }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
        ios: { sound: 'bird.wav', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }

  // 1st of the Gregorian Month (Surah Yaseen)
  if (targetDate.getDate() === 1) {
    const hoursToTrigger = [9, 16, 20]; // 9 AM, 4 PM, 8 PM
    for (const hour of hoursToTrigger) {
      const triggerDate = new Date(targetDate);
      triggerDate.setHours(hour, 0, 0, 0);
      if (triggerDate.getTime() > now.getTime()) {
        await notifee.createTriggerNotification({
          title: i18n.t('notifications.yaseenTitle'),
          body: i18n.t('notifications.yaseenBody'),
          android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
          ios: { sound: 'bird.wav', badgeCount: 1 },
        }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
      }
    }
  }
}

async function scheduleTaskDay(targetDate: Date, qh: QuietHours) {
  const now = new Date();
  const triggerDate = getRandomAllowedTime(targetDate, qh);
  
  if (triggerDate.getTime() > now.getTime()) {
    const tasks = [
      { title: 'notifications.taskQuranTitle', body: 'notifications.taskQuranBody1' },
      { title: 'notifications.taskQuranTitle', body: 'notifications.taskQuranBody2' },
      { title: 'notifications.taskQuranTitle', body: 'notifications.taskQuranBody3' },
      { title: 'notifications.taskQuranTitle', body: 'notifications.taskQuranBody4' },
      { title: 'notifications.taskSmileTitle', body: 'notifications.taskSmileBody' },
      { title: 'notifications.taskDuaTitle', body: 'notifications.taskDuaBody' },
      { title: 'notifications.taskDuroodTitle', body: 'notifications.taskDuroodBody' },
      { title: 'notifications.taskIkhlasTitle', body: 'notifications.taskIkhlasBody' },
      { title: 'notifications.taskKindnessTitle', body: 'notifications.taskKindnessBody' },
      { title: 'notifications.taskAlhamdulillahTitle', body: 'notifications.taskAlhamdulillahBody' },
      { title: 'notifications.taskAstaghfirullahTitle', body: 'notifications.taskAstaghfirullahBody' },
      { title: 'notifications.taskCharityTitle', body: 'notifications.taskCharityBody' },
      { title: 'notifications.taskDhikrTitle', body: 'notifications.taskDhikrBody' }
    ];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    await notifee.createTriggerNotification({
      title: i18n.t(task.title),
      body: i18n.t(task.body),
      android: { showTimestamp: true, channelId: TASKS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' },
    }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
  }
}
