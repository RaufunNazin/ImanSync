const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src', 'i18n', 'locales', 'en.json');
const bnPath = path.join(__dirname, 'src', 'i18n', 'locales', 'bn.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const bn = JSON.parse(fs.readFileSync(bnPath, 'utf8'));

// Updates for 'quran'
en.quran.dailyGoal = "Daily Reading Goal";
en.quran.streak = "Day Streak";
en.quran.pages = "Pages";
en.quran.goalMet = "Goal Met!";

bn.quran.dailyGoal = "দৈনিক পাঠের লক্ষ্য";
bn.quran.streak = "দিনের ধারা (Streak)";
bn.quran.pages = "পৃষ্ঠা";
bn.quran.goalMet = "লক্ষ্য অর্জিত!";

// Updates for 'home'
en.home.hadithOfTheDay = "Hadith of the Day";
en.home.trivia = "Islamic Trivia";

bn.home.hadithOfTheDay = "আজকের হাদিস";
bn.home.trivia = "ইসলামিক কুইজ";

// Updates for 'tracker'
en.tracker.qadaTitle = "Missed Prayers (Qada)";
en.tracker.qadaDesc = "Track and make up your missed prayers and fasts.";
en.tracker.totalMissed = "Total Missed Prayers";
en.tracker.prayers = "Prayers";
en.tracker.fasting = "Fasting";
en.tracker.missedFasts = "Missed Fasts";

bn.tracker.qadaTitle = "কাযা নামাজ";
bn.tracker.qadaDesc = "আপনার ছুটে যাওয়া নামাজ এবং রোজা ট্র্যাক করুন এবং আদায় করুন।";
bn.tracker.totalMissed = "মোট ছুটে যাওয়া নামাজ";
bn.tracker.prayers = "নামাজসমূহ";
bn.tracker.fasting = "রোজা";
bn.tracker.missedFasts = "ছুটে যাওয়া রোজা";

// Updates for 'dua'
en.dua.createFolder = "Create New Folder";
en.dua.folderName = "Folder Name";
en.dua.moveToFolder = "Move to Folder";
en.dua.noFolder = "No Folder";
en.dua.savedItems = "saved items";
en.dua.addSuccess = "Dua added successfully";
en.dua.addError = "Failed to add dua";
en.dua.customCategoryDesc = "Custom Category";

bn.dua.createFolder = "নতুন ফোল্ডার তৈরি করুন";
bn.dua.folderName = "ফোল্ডারের নাম";
bn.dua.moveToFolder = "ফোল্ডারে সরান";
bn.dua.noFolder = "কোন ফোল্ডার নেই";
bn.dua.savedItems = "সংরক্ষিত দোয়া";
bn.dua.addSuccess = "দোয়া সফলভাবে যোগ করা হয়েছে";
bn.dua.addError = "দোয়া যোগ করতে ব্যর্থ";
bn.dua.customCategoryDesc = "কাস্টম ক্যাটাগরি";

// Updates for 'trivia'
en.trivia = {
  title: "Islamic Trivia",
  quizCompleted: "Quiz Completed!",
  perfectScore: "Perfect! Excellent knowledge! MashaAllah!",
  goodScore: "Good job! Keep learning!",
  lowScore: "A great opportunity to learn more!",
  playAgain: "Play Again",
  questionOf: "Question {{current}} of {{total}}",
  score: "Score: {{score}}",
  finish: "Finish",
  nextQuestion: "Next Question"
};

bn.trivia = {
  title: "ইসলামিক কুইজ",
  quizCompleted: "কুইজ সম্পন্ন হয়েছে!",
  perfectScore: "দুর্দান্ত! চমৎকার জ্ঞান! মাশাআল্লাহ!",
  goodScore: "ভালো করেছেন! শিখতে থাকুন!",
  lowScore: "আরও শেখার একটি দুর্দান্ত সুযোগ!",
  playAgain: "আবার খেলুন",
  questionOf: "প্রশ্ন {{total}} এর মধ্যে {{current}}",
  score: "স্কোর: {{score}}",
  finish: "শেষ করুন",
  nextQuestion: "পরবর্তী প্রশ্ন"
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2));

console.log('Translations updated.');
