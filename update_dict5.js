const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

// home 
en.home = en.home || {};
en.home.suhur = "Suhur Ends";
en.home.suhurDesc = "Fajr begins";
en.home.tahajjud = "Tahajjud";
en.home.tahajjudDesc = "Last third of night";
en.home.iftar = "Iftar";
en.home.iftarDesc = "Maghrib begins";

en.home.restrict1 = "After Fajr until Sunrise";
en.home.restrict1Desc = "Fajr → Sunrise";
en.home.restrict2 = "Around Solar Noon";
en.home.restrict2Desc = "~15 min before & after Dhuhr starts";
en.home.restrict3 = "After Asr until Sunset";
en.home.restrict3Desc = "Asr → Sunset";
en.home.next = "Next";

bn.home = bn.home || {};
bn.home.suhur = "সাহরি শেষ";
bn.home.suhurDesc = "ফজর শুরু";
bn.home.tahajjud = "তাহাজ্জুদ";
bn.home.tahajjudDesc = "রাতের শেষ তৃতীয়াংশ";
bn.home.iftar = "ইফতার";
bn.home.iftarDesc = "মাগরিব শুরু";

bn.home.restrict1 = "ফজরের পর থেকে সূর্যোদয় পর্যন্ত";
bn.home.restrict1Desc = "ফজর → সূর্যোদয়";
bn.home.restrict2 = "ঠিক দুপুরের সময়";
bn.home.restrict2Desc = "যোহরের ১৫ মিনিট আগে ও পরে";
bn.home.restrict3 = "আসরের পর থেকে সূর্যাস্ত পর্যন্ত";
bn.home.restrict3Desc = "আসর → সূর্যাস্ত";
bn.home.next = "পরবর্তী";

// tracker
en.tracker = en.tracker || {};
en.tracker.checklist = "Daily Checklist";
en.tracker.daily = "Daily";
en.tracker.weekly = "Weekly";
en.tracker.monthly = "Monthly";
en.tracker.tasksCompleted = "{{count}} of {{total}} tasks completed";
en.tracker.trackingCons = "Tracking your consistency";
en.tracker.msg1 = "Masha'Allah! A complete day.";
en.tracker.msg2 = "Alhamdulillah, keep going!";
en.tracker.msg3 = "Every small step counts towards Allah.";

en.tracker.tasks = {
  fajr: "Fajr Prayer",
  dhuhr: "Dhuhr Prayer",
  asr: "Asr Prayer",
  maghrib: "Maghrib Prayer",
  isha: "Isha Prayer",
  quran: "Quran Reading (Min. 1 page)",
  charity: "Sadaqah / Charity",
  fasting: "Fasting (Optional)",
  dhikr: "Morning & Evening Adhkar"
};

bn.tracker = bn.tracker || {};
bn.tracker.checklist = "প্রতিদিনের চেকলিস্ট";
bn.tracker.daily = "দৈনিক";
bn.tracker.weekly = "সাপ্তাহিক";
bn.tracker.monthly = "মাসিক";
bn.tracker.tasksCompleted = "{{total}} টির মধ্যে {{count}} টি কাজ সম্পন্ন";
bn.tracker.trackingCons = "আপনার ধারাবাহিকতা ট্র্যাক করা হচ্ছে";
bn.tracker.msg1 = "মাশাআল্লাহ! একটি সম্পূর্ণ দিন।";
bn.tracker.msg2 = "আলহামদুলিল্লাহ, চালিয়ে যান!";
bn.tracker.msg3 = "প্রতিটি ছোট পদক্ষেপ আল্লাহর দিকে নিয়ে যায়।";

bn.tracker.tasks = {
  fajr: "ফজর নামাজ",
  dhuhr: "যোহর নামাজ",
  asr: "আসর নামাজ",
  maghrib: "মাগরিব নামাজ",
  isha: "ইশা নামাজ",
  quran: "কুরআন তিলাওয়াত (অন্তত ১ পৃষ্ঠা)",
  charity: "সদকা / দান",
  fasting: "রোজা (ঐচ্ছিক)",
  dhikr: "সকাল ও সন্ধ্যার জিকির"
};

// dua
en.dua = en.dua || {};
en.dua.morning = "Morning";
en.dua.evening = "Evening";
en.dua.protection = "Protection";
en.dua.travel = "Travel";
en.dua.zikr = "Zikr & Tasbeeh";
en.dua.tap = "Tap the screen to count";
en.dua.completed = "Completed!";
en.dua.reset = "Reset";

bn.dua = bn.dua || {};
bn.dua.morning = "সকাল";
bn.dua.evening = "সন্ধ্যা";
bn.dua.protection = "নিরাপত্তা";
bn.dua.travel = "ভ্রমণ";
bn.dua.zikr = "জিকির ও তাসবীহ";
bn.dua.tap = "গণনার জন্য স্ক্রিনে ট্যাপ করুন";
bn.dua.completed = "সম্পন্ন হয়েছে!";
bn.dua.reset = "রিসেট";

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
