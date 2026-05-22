const fs = require('fs');

function updateLocales() {
  const enPath = './src/i18n/locales/en.json';
  const bnPath = './src/i18n/locales/bn.json';
  
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const bnData = JSON.parse(fs.readFileSync(bnPath, 'utf8'));
  
  // Settings keys
  enData.settings.notificationsTitle = "Notifications Settings";
  bnData.settings.notificationsTitle = "নোটিফিকেশন সেটিংস";
  
  enData.settings.masterToggle = "Master Toggle";
  bnData.settings.masterToggle = "সকল নোটিফিকেশন";
  
  enData.settings.prayerAlerts = "Prayer Alerts";
  bnData.settings.prayerAlerts = "নামাজের এলার্ট";
  
  enData.settings.dailyReminders = "Daily Reminders";
  bnData.settings.dailyReminders = "দৈনিক রিমাইন্ডার";
  
  enData.settings.quietHours = "Quiet Hours";
  bnData.settings.quietHours = "নীরব সময় (Do Not Disturb)";
  
  // Notification strings
  enData.notifications = {
    prayerStartTitle: "Time for {{prayer}}",
    prayerStartBody: "The time for {{prayer}} prayer has begun.",
    prayerEndTitle: "{{prayer}} is ending soon",
    prayerEndBody: "Only 15 minutes left until {{nextPrayer}}. Please pray if you haven't!",
    jumuahTitle: "Jumu'ah is arriving",
    jumuahBody: "Don't forget to recite Surah Al-Kahf tonight or tomorrow!",
    fastingTitle: "Sunnah Fasting Tomorrow",
    fastingBody: "Tomorrow is {{day}}. Gain rewards by fasting!",
    whiteDaysTitle: "Ayyam al-Bidh (White Days)",
    whiteDaysBody: "Tomorrow is the {{day}}th of the Islamic month. A great day to fast!",
    taskQuranTitle: "Daily Quran Reminder",
    taskQuranBody1: "Take 5 minutes to read a page of the Quran.",
    taskQuranBody2: "Have you recited any Quran today?",
    taskQuranBody3: "Nourish your soul with a few verses of the Quran.",
    taskQuranBody4: "A quick reminder to do your daily Quran reading."
  };
  
  bnData.notifications = {
    prayerStartTitle: "{{prayer}} এর সময় হয়েছে",
    prayerStartBody: "{{prayer}} নামাজের ওয়াক্ত শুরু হয়েছে।",
    prayerEndTitle: "{{prayer}} এর সময় শেষ হচ্ছে",
    prayerEndBody: "{{nextPrayer}} এর আর মাত্র ১৫ মিনিট বাকি। এখনো না পড়ে থাকলে পড়ে নিন!",
    jumuahTitle: "জুম্মা আসছে",
    jumuahBody: "আজ রাতে বা আগামীকাল সূরা কাহাফ তিলাওয়াত করতে ভুলবেন না!",
    fastingTitle: "আগামীকাল সুন্নাহ রোজা",
    fastingBody: "আগামীকাল {{day}}। রোজা রেখে সওয়াব অর্জন করুন!",
    whiteDaysTitle: "আইয়ামুল বীজ (হিজরি মাসের ১৩, ১৪, ১৫ তারিখ)",
    whiteDaysBody: "আগামীকাল হিজরি মাসের {{day}} তারিখ। রোজা রাখার একটি চমৎকার দিন!",
    taskQuranTitle: "দৈনন্দিন কুরআন রিমাইন্ডার",
    taskQuranBody1: "কুরআনের একটি পৃষ্ঠা পড়ার জন্য ৫ মিনিট সময় বের করুন।",
    taskQuranBody2: "আজ কি একটু কুরআন তিলাওয়াত করেছেন?",
    taskQuranBody3: "কুরআনের কয়েকটি আয়াত পড়ে আপনার হৃদয়কে প্রশান্ত করুন।",
    taskQuranBody4: "আপনার প্রতিদিনের কুরআন পড়ার একটি ছোট্ট রিমাইন্ডার।"
  };

  fs.writeFileSync(enPath, JSON.stringify(enData, null, 2) + '\n');
  fs.writeFileSync(bnPath, JSON.stringify(bnData, null, 2) + '\n');
}

updateLocales();
console.log('Translations updated successfully!');
