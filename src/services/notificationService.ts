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
  return hours + ':' + String(minutes).padStart(2, '0') + ampm;
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
          await schedulePrayerDay(dayData.timings, targetDate, i === 0, state.quietHours);
        }

        // 2. Events (Jumu'ah, White Days, etc)
        await scheduleEventsDay(dayData, targetDate, state.quietHours);

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

async function schedulePrayerDay(timings: any, targetDate: Date, _isToday: boolean, quietHours: QuietHours) {
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
    
    // Start notification
    if (prayerTime.getTime() > now.getTime() && !isQuietHour(prayerTime, quietHours)) {
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

      await notifee.createTriggerNotification({
        title: i18n.t(titleKey, { prayer: current.name, endTime: endTimeFormatted }),
        android: { showTimestamp: true, channelId: PRAYERS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
        ios: { sound: 'bird.wav', badgeCount: 1 },
      }, trigger);
    }

    // Ending Warning (15 mins before NEXT prayer, except Isha and Fajr)
    if (i < prayers.length - 1 && current.id !== 'fajr' && current.id !== 'isha') {
      const next = prayers[i + 1];
      const nextTime = parseTimeString(next.time, targetDate);
      const warningTime = new Date(nextTime.getTime() - 15 * 60000);
      
      if (warningTime.getTime() > now.getTime() && !isQuietHour(warningTime, quietHours)) {
        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: warningTime.getTime(),
          alarmManager: { allowWhileIdle: true },
        };
        await notifee.createTriggerNotification({
          title: i18n.t('notifications.prayerEndTitle', { currentPrayer: current.name }),
          android: { showTimestamp: true, channelId: PRAYERS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
          ios: { sound: 'bird.wav', badgeCount: 1 },
        }, trigger);
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
        ios: { sound: 'bird.wav', badgeCount: 1 },
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
        ios: { sound: 'bird.wav', badgeCount: 1 },
      }, { type: TriggerType.TIMESTAMP, timestamp: sahriTrigger.getTime(), alarmManager: { allowWhileIdle: true } });
    }
    
    // Iftar Reminder: 5 mins before Iftar time starts
    const iftarTrigger = new Date(iftarTime.getTime() - 5 * 60000);
    if (iftarTrigger.getTime() > now.getTime() && !isQuietHour(iftarTrigger, quietHours)) {
      notifee.createTriggerNotification({
        title: i18n.t('notifications.iftarReminderTitle', { defaultValue: 'Iftar Reminder' }),
        body: i18n.t('notifications.iftarReminderBody', { time: formatAMPM(iftarTime), defaultValue: 'Iftar starts exactly at ' + formatAMPM(iftarTime) }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c', pressAction: { id: 'default' } },
        ios: { sound: 'bird.wav', badgeCount: 1 },
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
        body: i18n.t('notifications.fastingBody', { day: dayOfWeek === 1 ? 'Monday' : 'Thursday' }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
        ios: { sound: 'bird.wav', badgeCount: 1 },
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
        body: i18n.t('notifications.whiteDaysBody', { day: hijriDay }),
        android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
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
      if (triggerDate.getTime() > now.getTime() && !isQuietHour(triggerDate, quietHours)) {
        await notifee.createTriggerNotification({
          title: i18n.t('notifications.yaseenTitle'),
          body: i18n.t('notifications.yaseenBody'),
          android: { showTimestamp: true, channelId: EVENTS_CHANNEL, smallIcon: 'notification_icon', color: '#4c956c' , pressAction: { id: 'default' } },
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
    }, { type: TriggerType.TIMESTAMP, timestamp: triggerDate.getTime(), alarmManager: { allowWhileIdle: true } });
  }
}
