const fs = require('fs');
const path = 'src/i18n/locales/bn.json';
const bnJson = JSON.parse(fs.readFileSync(path, 'utf8'));

// Update quran section
if (!bnJson.quran) bnJson.quran = {};
Object.assign(bnJson.quran, {
  addPage: "পৃষ্ঠা যোগ করুন",
  bookmarkedAyahs: "বুকমার্ক করা আয়াত",
  bookmarkedJuz: "বুকমার্ক করা পারা",
  bookmarkedSurahs: "বুকমার্ক করা সূরা",
  currentStreak: "বর্তমান ধারাবাহিকতা",
  dailyReflection: "আজকের উপলব্ধি",
  history: "পড়ার ইতিহাস (৩০ দিন)",
  juzBookmarked: "পারা বুকমার্ক করা হয়েছে",
  juzBookmarkRemoved: "পারা বুকমার্ক সরানো হয়েছে",
  longestStreak: "দীর্ঘতম ধারাবাহিকতা",
  noNotes: "এই দিনের জন্য কোন উপলব্ধি রেকর্ড করা নেই।",
  pagesRead: "পৃষ্ঠা পড়া হয়েছে",
  reflection: "উপলব্ধি",
  surahBookmarked: "সূরা বুকমার্ক করা হয়েছে",
  surahBookmarkRemoved: "সূরা বুকমার্ক সরানো হয়েছে",
  targetPages: "প্রতিদিন {{count}} পৃষ্ঠা",
  todayProgress: "আজকের অগ্রগতি",
  trackerTitle: "পড়ার ট্র্যাকার",
  writeNote: "আজ যা শিখেছেন বা অনুভব করেছেন তা লিখুন..."
});

// Update common section
if (!bnJson.common) bnJson.common = {};
Object.assign(bnJson.common, {
  less: "কম",
  more: "বেশি"
});

// Update dua section
if (!bnJson.dua) bnJson.dua = {};
Object.assign(bnJson.dua, {
  retry: "পুনরায় চেষ্টা করুন",
  prev: "পূর্ববর্তী"
});

// Update tracker section
if (!bnJson.tracker) bnJson.tracker = {};
Object.assign(bnJson.tracker, {
  kazaChip: "{{namaj}} ওয়াক্ত"
});

fs.writeFileSync(path, JSON.stringify(bnJson, null, 2));
console.log("Updated bn.json");
