import i18n from '@/i18n';
import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import { formatNumber } from '@/utils/formatNumber';
import { QuietHours, usePreferencesStore } from '../store/preferencesStore';
import { Platform } from 'react-native';

const PRAYERS_START_CHANNEL = 'prayers_start_channel_v5';
const PRAYERS_END_CHANNEL = 'prayers_end_channel_v5';
const EVENTS_CHANNEL = 'events_channel_v5';
const TASKS_CHANNEL = 'tasks_channel_v5';

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
    const hour = Math.floor(Math.random() * 16) + 6;
    const min = Math.floor(Math.random() * 60);
    date.setHours(hour, min, 0, 0);
    
    if (!isQuietHour(date, qh)) {
      return date;
    }
    attempts++;
  }
  // fallback if somehow we can't find one randomly, find the first available hour
  for (let h = 0; h < 24; h++) {
    date.setHours(h, 0, 0, 0);
    if (!isQuietHour(date, qh)) {
      return date;
    }
  }
  // If the user literally blocked all 24 hours, just default to 12 PM
  date.setHours(12, 0, 0, 0);
  return date;
}

function parseTimeString(timeStr: string, date: Date): Date {
  const clean = timeStr.split(' ')[0]; // remove " (EST)" if present
  const [h, m] = clean.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatAMPM(date: Date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? ' PM' : ' AM';
  hours = hours % 12 || 12;
  const hoursFormatted = formatNumber(hours, i18n.language);
  const minutesFormatted = formatNumber(String(minutes).padStart(2, '0'), i18n.language);
  return `${hoursFormatted}:${minutesFormatted} ${ampm}`;
}

export async function setupChannels() {
  await notifee.requestPermission();
  
  await notifee.createChannel({
    id: PRAYERS_START_CHANNEL,
    name: 'Prayer Start Alerts',
    importance: AndroidImportance.HIGH,
    sound: 'bird',
  });

  await notifee.createChannel({
    id: PRAYERS_END_CHANNEL,
    name: 'Prayer End Alerts',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await notifee.createChannel({
    id: EVENTS_CHANNEL,
    name: 'Islamic Events',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await notifee.createChannel({
    id: TASKS_CHANNEL,
    name: 'Task Reminders',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

let isScheduling = false;
let pendingSchedule = false;

export async function scheduleAllNotifications() {
  if (isScheduling) {
    pendingSchedule = true;
    return;
  }
  isScheduling = true;

  try {
    do {
      pendingSchedule = false;
      await performScheduling();
    } while (pendingSchedule);
  } finally {
    isScheduling = false;
  }
}

async function performScheduling() {
  const state = usePreferencesStore.getState();
  if (!state.notificationsEnabled) {
    await notifee.cancelTriggerNotifications();
    return;
  }

  await setupChannels();
  
  // Clear existing to avoid duplicates
  await notifee.cancelTriggerNotifications();

  // Fetch location & method for ALADHAN API
  let lat = state.location?.latitude ?? 23.8103;
  let lon = state.location?.longitude ?? 90.4125;
  let method = state.calcMethod ?? 1;
  let madhab = state.madhab ?? 1;

  // Preferences now handled by store directly

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  // Generate current month's calendar locally
  const { generateLocalCalendar } = require('../utils/localCalendar');
  let currentMonthData = generateLocalCalendar(year, month, lat, lon, method, madhab);
  
  const today = now.getDate();
  const maxDaysToSchedule = Platform.OS === 'ios' ? 5 : 7;
  
  // Schedule for the next days
  let daysToSchedule = currentMonthData.filter((d: any) => {
    const dayNum = parseInt(d.date.gregorian.day, 10);
    return dayNum >= today && dayNum < today + maxDaysToSchedule;
  });

  // If less than required days left in the month, generate next month's data
  if (daysToSchedule.length < maxDaysToSchedule) {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    
    try {
      const nextMonthData = generateLocalCalendar(nextYear, nextMonth, lat, lon, method, madhab);
      const needed = maxDaysToSchedule - daysToSchedule.length;
      const extraDays = nextMonthData.slice(0, needed);
      daysToSchedule = [...daysToSchedule, ...extraDays];
    } catch (nextErr) {
      console.error('Failed to generate next month data for notifications', nextErr);
    }
  }

  for (let i = 0; i < daysToSchedule.length; i++) {
    const dayData = daysToSchedule[i];
    const dayNum = parseInt(dayData.date.gregorian.day, 10);
    const monthNum = parseInt(dayData.date.gregorian.month.number, 10);
    const yearNum = parseInt(dayData.date.gregorian.year, 10);
    const targetDate = new Date(yearNum, monthNum - 1, dayNum);
        
        // 1. Prayer Alerts
        await schedulePrayerDay(dayData.timings, targetDate, i === 0, state.quietHours, {
          fajr: { start: state.fajrStartAlert, end: state.fajrEndAlert },
          dhuhr: { start: state.dhuhrStartAlert, end: state.dhuhrEndAlert },
          asr: { start: state.asrStartAlert, end: state.asrEndAlert },
          maghrib: { start: state.maghribStartAlert, end: state.maghribEndAlert },
          isha: { start: state.ishaStartAlert, end: state.ishaEndAlert },
        });

        // 2. Events (Jumu'ah, White Days, etc)
        await scheduleEventsDay(dayData, targetDate, state.quietHours);

        // 3. Random Tasks (Quran)
        if (state.taskRemindersEnabled) {
          await scheduleTaskDay(targetDate, state.quietHours);
        }
    }
  }

async function schedulePrayerDay(timings: any, targetDate: Date, _isToday: boolean, quietHours: QuietHours, alerts: { [key: string]: { start: boolean, end: boolean } }) {
  const prayers = [
    { id: 'fajr', name: i18n.t('prayerTimes.fajr'), time: timings.Fajr },
    { id: 'dhuhr', name: i18n.t('prayerTimes.dhuhr'), time: timings.Dhuhr },
    { id: 'asr', name: i18n.t('prayerTimes.asr'), time: timings.Asr },
    { id: 'maghrib', name: i18n.t('prayerTimes.maghrib'), time: timings.Maghrib },
    { id: 'isha', name: i18n.t('prayerTimes.isha'), time: timings.Isha },
  ];

  const now = new Date();

  for (let i = 0; i < prayers.length; i++) {
    const current = prayers[i];
    const prayerTime = parseTimeString(current.time, targetDate);
    
    const currentAlerts = alerts[current.id] || { start: false, end: false };
    
    // Start notification
    if (currentAlerts.start && prayerTime.getTime() > now.getTime() && !isQuietHour(prayerTime, quietHours)) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        alarmManager: { allowWhileIdle: true },
      };
      
      let endTimeStr = '';
      if (current.id === 'fajr') endTimeStr = timings.Sunrise;
      else if (current.id === 'dhuhr') endTimeStr = timings.Asr;
      else if (current.id === 'asr') endTimeStr = timings.Maghrib;
      else if (current.id === 'maghrib') endTimeStr = timings.Isha;
      else if (current.id === 'isha') endTimeStr = timings.Midnight;

      const endTimeFormatted = endTimeStr ? formatAMPM(parseTimeString(endTimeStr, targetDate)) : '';

      const titleKey = current.id === 'isha' ? 'notifications.ishaStartTitle' : 'notifications.prayerStartTitle';
      const bodyKey = current.id === 'isha' ? 'notifications.ishaStartBody' : 'notifications.prayerStartBody';

      await notifee.createTriggerNotification({
        title: i18n.t(titleKey, { prayer: current.name }),
        body: i18n.t(bodyKey, { endTime: endTimeFormatted }),
        android: { showTimestamp: true, channelId: PRAYERS_START_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
        ios: { sound: 'bird.wav', badgeCount: 1 },
      }, trigger);
    }

    // Ending Warning (15 mins before next boundary)
    if (currentAlerts.end) {
      let nextTimeStr = '';
      if (current.id === 'fajr') nextTimeStr = timings.Sunrise;
      else if (current.id === 'isha') nextTimeStr = timings.Midnight;
      else nextTimeStr = prayers[i + 1]?.time;

      if (nextTimeStr) {
        let nextTime = parseTimeString(nextTimeStr, targetDate);
        if (nextTime.getTime() < prayerTime.getTime()) {
          nextTime = new Date(nextTime.getTime());
          nextTime.setDate(nextTime.getDate() + 1);
        }
        const warningTime = new Date(nextTime.getTime() - 15 * 60000);
        
        if (warningTime.getTime() > now.getTime() && !isQuietHour(warningTime, quietHours)) {
          const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: warningTime.getTime(),
            alarmManager: { allowWhileIdle: true },
          };
          await notifee.createTriggerNotification({
            title: i18n.t('notifications.prayerEndTitle', { currentPrayer: current.name }),
            android: { showTimestamp: true, channelId: PRAYERS_END_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
            ios: { sound: 'default', badgeCount: 1 },
          }, trigger);
        }
      }
    }
  }
}

async function scheduleEventsDay(dayData: any, targetDate: Date, quietHours: QuietHours) {
  const now = new Date();
  const dayOfWeek = targetDate.getDay();
  const hijriMonth = parseInt(dayData.date.hijri.month.number, 10);
  const hijriDay = parseInt(dayData.date.hijri.day, 10);
  const isForbiddenDay = isForbiddenFastingDay(hijriDay, hijriMonth);
  
  // Thursday evening reminder for Surah Kahf
  if (targetDate.getDay() === 4) { // Thursday
    const triggerDate = new Date(targetDate);
    triggerDate.setHours(18, 0, 0, 0); // 6 PM Thursday
    if (triggerDate.getTime() > now.getTime() && !isQuietHour(triggerDate, quietHours)) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.jumuahTitle'),
        body: i18n.t('notifications.jumuahBody'),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
        ios: { sound: 'default', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }


  // Ramadan Daily Reminders (Sahri & Iftar)
  if (hijriMonth === 9) {
    // We only schedule Sahri if it's NOT the morning of Eid.
    // If today is NOT the last day of Ramadan (meaning tomorrow is still Ramadan), schedule Sahri for tomorrow?
    // Wait, scheduleEventsDay runs for EACH day of the next 7 days.
    // So for a given day in Ramadan:
    
    // Sahri time = Fajr - 1 min
    const fajrTime = dayData.timings.Fajr.split(' ')[0];
    const [fh, fm] = fajrTime.split(':').map(Number);
    const fajrDate = new Date(targetDate);
    fajrDate.setHours(fh, fm, 0, 0);
    const sahriTime = new Date(fajrDate.getTime() - 1 * 60000);
    
    // Iftar time = Maghrib + 1 min
    const maghribTime = dayData.timings.Maghrib.split(' ')[0];
    const [mh, mm] = maghribTime.split(':').map(Number);
    const maghribDate = new Date(targetDate);
    maghribDate.setHours(mh, mm, 0, 0);
    const iftarTime = new Date(maghribDate.getTime() + 1 * 60000);
    

    // Sahri Reminder: 10 mins before Sahri time ends
    // ONLY if it's not Eid morning. Actually if hijriMonth===9, it's Ramadan.
    // But wait, the API might say 30th Ramadan, but it could be Eid. We just rely on API calendar.
    const sahriTrigger = new Date(sahriTime.getTime() - 10 * 60000);
    if (sahriTrigger.getTime() > now.getTime()) {
      notifee.createTriggerNotification({
        title: i18n.t('notifications.sahriReminderTitle', { defaultValue: 'Sahri Reminder' }),
        body: i18n.t('notifications.sahriReminderBody', { time: formatAMPM(sahriTime), defaultValue: 'Sahri ends exactly at ' + formatAMPM(sahriTime) }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c', pressAction: { id: 'default' } },
        ios: { sound: 'default', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: sahriTrigger.getTime(), alarmManager: { allowWhileIdle: true } });
    }
    
    // Iftar Reminder: 5 mins before Iftar time starts
    const iftarTrigger = new Date(iftarTime.getTime() - 5 * 60000);
    if (iftarTrigger.getTime() > now.getTime() && !isQuietHour(iftarTrigger, quietHours)) {
      notifee.createTriggerNotification({
        title: i18n.t('notifications.iftarReminderTitle', { defaultValue: 'Iftar Reminder' }),
        body: i18n.t('notifications.iftarReminderBody', { time: formatAMPM(iftarTime), defaultValue: 'Iftar starts exactly at ' + formatAMPM(iftarTime) }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c', pressAction: { id: 'default' } },
        ios: { sound: 'default', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: iftarTrigger.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }

  // Monday/Thursday fasting reminder (schedule evening before)
  if (!isForbiddenDay && (dayOfWeek === 1 || dayOfWeek === 4)) { // Monday or Thursday
    const triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - 1); // Sunday or Wednesday
    triggerDate.setHours(20, 0, 0, 0); // 8 PM
    if (triggerDate.getTime() > now.getTime() && !isQuietHour(triggerDate, quietHours)) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.fastingTitle'),
        body: i18n.t('notifications.fastingBody', { day: i18n.t(dayOfWeek === 1 ? 'days.monday' : 'days.thursday') }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
        ios: { sound: 'default', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }

  // White Days (13, 14, 15 of Hijri)
  if (!isForbiddenDay && (hijriDay === 13 || hijriDay === 14 || hijriDay === 15)) {
    const triggerDate = new Date(targetDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(19, 30, 0, 0);
    if (triggerDate.getTime() > now.getTime() && !isQuietHour(triggerDate, quietHours)) {
      await notifee.createTriggerNotification({
        title: i18n.t('notifications.whiteDaysTitle'),
        body: i18n.t('notifications.whiteDaysBody', { day: formatNumber(hijriDay, i18n.language) }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
        ios: { sound: 'default', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
    }
  }

  // 1st of the Gregorian Month (Surah Yaseen)
  if (targetDate.getDate() === 1) {
    const hoursToTrigger = [9, 16, 20]; // 9 AM, 4 PM, 8 PM
    for (const hour of hoursToTrigger) {
      const triggerDate = new Date(targetDate);
      triggerDate.setHours(hour, 0, 0, 0);
      if (triggerDate.getTime() > now.getTime() && !isQuietHour(triggerDate, quietHours)) {
        await notifee.createTriggerNotification({
          title: i18n.t('notifications.yaseenTitle'),
          body: i18n.t('notifications.yaseenBody'),
          android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
          ios: { sound: 'default', badgeCount: 1 },
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
      { title: 'notifications.taskQuranTitle', body: 'notifications.taskQuranBody5' },
      
      { title: 'notifications.taskSmileTitle', body: 'notifications.taskSmileBody1' },
      { title: 'notifications.taskSmileTitle', body: 'notifications.taskSmileBody2' },
      { title: 'notifications.taskSmileTitle', body: 'notifications.taskSmileBody3' },
      
      { title: 'notifications.taskDuaTitle', body: 'notifications.taskDuaBody1' },
      { title: 'notifications.taskDuaTitle', body: 'notifications.taskDuaBody2' },
      { title: 'notifications.taskDuaTitle', body: 'notifications.taskDuaBody3' },
      
      { title: 'notifications.taskDuroodTitle', body: 'notifications.taskDuroodBody1' },
      { title: 'notifications.taskDuroodTitle', body: 'notifications.taskDuroodBody2' },
      { title: 'notifications.taskDuroodTitle', body: 'notifications.taskDuroodBody3' },
      
      { title: 'notifications.taskKindnessTitle', body: 'notifications.taskKindnessBody1' },
      { title: 'notifications.taskKindnessTitle', body: 'notifications.taskKindnessBody2' },
      { title: 'notifications.taskKindnessTitle', body: 'notifications.taskKindnessBody3' },
      
      { title: 'notifications.taskAlhamdulillahTitle', body: 'notifications.taskAlhamdulillahBody1' },
      { title: 'notifications.taskAlhamdulillahTitle', body: 'notifications.taskAlhamdulillahBody2' },
      { title: 'notifications.taskAlhamdulillahTitle', body: 'notifications.taskAlhamdulillahBody3' },
      
      { title: 'notifications.taskAstaghfirullahTitle', body: 'notifications.taskAstaghfirullahBody1' },
      { title: 'notifications.taskAstaghfirullahTitle', body: 'notifications.taskAstaghfirullahBody2' },
      { title: 'notifications.taskAstaghfirullahTitle', body: 'notifications.taskAstaghfirullahBody3' },
      
      { title: 'notifications.taskCharityTitle', body: 'notifications.taskCharityBody1' },
      { title: 'notifications.taskCharityTitle', body: 'notifications.taskCharityBody2' },
      { title: 'notifications.taskCharityTitle', body: 'notifications.taskCharityBody3' },
      
      { title: 'notifications.taskParentsTitle', body: 'notifications.taskParentsBody1' },
      { title: 'notifications.taskParentsTitle', body: 'notifications.taskParentsBody2' },
      { title: 'notifications.taskParentsTitle', body: 'notifications.taskParentsBody3' },
      
      { title: 'notifications.taskSickTitle', body: 'notifications.taskSickBody1' },
      { title: 'notifications.taskSickTitle', body: 'notifications.taskSickBody2' },
      
      { title: 'notifications.taskNightTitle', body: 'notifications.taskNightBody1' },
      { title: 'notifications.taskNightTitle', body: 'notifications.taskNightBody2' }
    ];
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    await notifee.createTriggerNotification({
      title: i18n.t(task.title),
      body: i18n.t(task.body),
      android: { showTimestamp: true, channelId: TASKS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
      ios: { sound: 'default', badgeCount: 1 },
    }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
  }
}
