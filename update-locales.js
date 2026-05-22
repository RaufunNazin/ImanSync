const fs = require('fs');

function updateEn() {
  const file = './src/i18n/locales/en.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.learn.ch1_title = "Chapter 1: The Alphabet";
  data.learn.ch1_desc = "Learn the 29 letters of the Arabic alphabet";
  data.learn.ch5_title = "Chapter 5: Reading Practice";
  data.learn.ch5_desc = "Practice reading short verses word by word";
  
  data.home.qibla = "Qibla Compass";
  data.home.names = "99 Names of Allah";
  data.home.suhurDesc = "Fasting begins";
  data.home.restrict1Desc = "15 mins after Sunrise";
  data.home.restrict2Desc = "10 mins before Dhuhr";
  data.home.restrict3Desc = "15 mins before Maghrib";
  
  data.quranSettings.title = "Reading Preferences";
  data.quranSettings.displayOptions = "Display Preferences";
  
  data.tracker.progress = "Today's Deeds";
  data.tracker.prayMore = "Complete more deeds to close the ring!";
  
  data.dua.myDuasDesc = "Your personal collection";
  data.dua.setupStorageDesc = "Choose a folder to save your personal duas. This folder will not be deleted even if you uninstall the app.";

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function updateBn() {
  const file = './src/i18n/locales/bn.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  data.learn.title = "কুরআন শিক্ষা";
  data.learn.ch1_desc = "২৯টি মৌলিক আরবি অক্ষর চিনে নিন";
  data.learn.ch2_title = "অধ্যায় ২: হারাকাত";
  data.learn.ch2_desc = "যবর, যের ও পেশের ব্যবহার শিখুন";
  data.learn.ch3_title = "অধ্যায় ৩: তানবীন";
  data.learn.ch3_desc = "দুই যবর, দুই যের ও দুই পেশের ব্যবহার শিখুন";
  data.learn.ch4_desc = "যযম ও তাশদীদ যুক্ত অক্ষর পড়া শিখুন";
  data.learn.ch5_title = "অধ্যায় ৫: পড়া শুরু করি";
  data.learn.ch5_desc = "ছোট ছোট সূরাগুলো শব্দে-শব্দে পড়ার অনুশীলন করুন";
  data.learn.ch6_title = "অধ্যায় ৬: মাদ্দ (টেনে পড়া)";
  data.learn.ch6_desc = "কুরআনের শব্দগুলো টেনে পড়ার নিয়ম শিখুন";
  data.learn.ch7_desc = "কুরআনে বারবার ব্যবহৃত শব্দগুলো জেনে নিন";
  data.learn.ch8_desc = "আরবি হরফগুলো কতটুকু শিখলেন যাচাই করুন";
  
  data.home.titleEn = "ইমান সিঙ্ক";
  data.home.quickActions = "প্রয়োজনীয় ফিচার";
  data.home.qibla = "কিবলা কম্পাস";
  data.home.names = "আল্লাহর ৯৯টি নাম";
  data.home.duas = "প্রয়োজনীয় দোয়া";
  data.home.specialTimes = "বিশেষ সময়সূচি";
  data.home.suhurDesc = "রোজা শুরু";
  data.home.restrict1Desc = "সূর্যোদয়ের পর ১৫ মিনিট পর্যন্ত";
  data.home.restrict2Desc = "যোহরের ওয়াক্ত শুরুর ১০ মিনিট আগ পর্যন্ত";
  data.home.restrict3Desc = "মাগরিবের ওয়াক্ত শুরুর ১৫ মিনিট আগ পর্যন্ত";
  
  data.quran.searchPlaceholder = "যেকোনো সূরা বা আয়াত খুঁজুন...";
  data.quran.tabBookmarks = "বুকমার্ক";
  data.quran.continue = "পড়া চালিয়ে যান";
  data.quran.Meccan = "মক্কায় অবতীর্ণ";
  data.quran.Medinan = "মদীনায় অবতীর্ণ";
  data.quran.playingJuz = "প্লেলিস্ট (আরও {{count}}টি বাকি)";
  
  data.quranSettings.title = "পড়ার সেটিংস";
  data.quranSettings.displayOptions = "প্রদর্শন অপশন";
  
  data.tracker.progress = "আজকের আমল";
  data.tracker.prayMore = "বৃত্তটি পূরণ করতে আরও আমল করুন!";
  data.tracker.chartMsg_30 = "কিছুটা ধীর গতি। ছোট ছোট আমলগুলো বাড়িয়ে দিন।";
  
  data.dua.myDuasDesc = "আপনার সংগ্রহ করা দোয়াগুলো";
  data.dua.category_distress = "বিপদ ও দুশ্চিন্তা";
  data.dua.setupStorageDesc = "আপনার ব্যক্তিগত দোয়াগুলো সংরক্ষণের জন্য একটি ফোল্ডার বেছে নিন। অ্যাপ আনইনস্টল করলেও এই ফোল্ডারটি মুছে যাবে না।";
  data.dua.addText = "দোয়া লিখুন";
  
  data.qibla.align = "সঠিক দিক পেতে ফোনটি সমান্তরাল রাখুন";
  
  data.stories.titleEn = "শানে নুযূল";
  data.stories.discover = "প্রেক্ষাপট জানুন";
  data.stories.body = "আমরা প্রতিটি সূরার ঐতিহাসিক প্রেক্ষাপট (শানে নুযূল) অনুবাদ ও যাচাই করছি।";
  data.stories.authenticDesc = "নির্ভরযোগ্য আলেমদের গ্রন্থ থেকে সংগৃহীত।";
  data.stories.deeperDesc = "আয়াতগুলো কেন এবং কখন নাযিল হয়েছিল তা জানুন।";

  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

updateEn();
updateBn();
console.log('JSON updated successfully!');
