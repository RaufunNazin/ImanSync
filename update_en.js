const fs = require('fs');
const path = 'src/i18n/locales/en.json';
const enJson = JSON.parse(fs.readFileSync(path, 'utf8'));

// Update quran section
if (!enJson.quran) enJson.quran = {};
Object.assign(enJson.quran, {
  addPage: "Add Page",
  bookmarkedAyahs: "Bookmarked Ayahs",
  bookmarkedJuz: "Bookmarked Juz",
  bookmarkedSurahs: "Bookmarked Surahs",
  currentStreak: "Current Streak",
  dailyReflection: "Today's Reflection",
  history: "Reading History (30 Days)",
  juzBookmarked: "Juz bookmarked",
  juzBookmarkRemoved: "Juz bookmark removed",
  longestStreak: "Longest Streak",
  noNotes: "No reflections recorded for this day.",
  pagesRead: "Pages Read",
  reflection: "Reflection",
  surahBookmarked: "Surah bookmarked",
  surahBookmarkRemoved: "Surah bookmark removed",
  targetPages: "{{count}} Pages / Day",
  todayProgress: "Today's Progress",
  trackerTitle: "Reading Tracker",
  writeNote: "Write down what you learned or felt today..."
});

// Update common section
if (!enJson.common) enJson.common = {};
Object.assign(enJson.common, {
  less: "Less",
  more: "More"
});

// Update dua section
if (!enJson.dua) enJson.dua = {};
Object.assign(enJson.dua, {
  retry: "Retry",
  prev: "Prev"
});

// Update tracker section
if (!enJson.tracker) enJson.tracker = {};
Object.assign(enJson.tracker, {
  kazaChip: "{{namaj}} N"
});

fs.writeFileSync(path, JSON.stringify(enJson, null, 2));
console.log("Updated en.json");
