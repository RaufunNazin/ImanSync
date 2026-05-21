const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.stories = {
  "titleEn": "Stories & Context",
  "titleAr": "سياق السور",
  "discover": "Discover the Origins",
  "body": "We are currently translating and verifying authentic historical contexts (Asbab Al-Nuzul) for each Surah.",
  "authentic": "Authentic Translations",
  "authenticDesc": "Sourced from trusted historical scholars.",
  "deeper": "Deeper Understanding",
  "deeperDesc": "Learn why and when verses were revealed.",
  "return": "Return to Quran"
};

bn.stories = {
  "titleEn": "ঘটনা ও প্রেক্ষাপট",
  "titleAr": "سياق السور",
  "discover": "উৎস আবিষ্কার করুন",
  "body": "আমরা বর্তমানে প্রতিটি সূরার প্রামাণিক ঐতিহাসিক প্রেক্ষাপট (আসাবান নুযুল) অনুবাদ ও যাচাই করছি।",
  "authentic": "প্রামাণিক অনুবাদ",
  "authenticDesc": "নির্ভরযোগ্য ঐতিহাসিক আলেমদের থেকে সংগৃহীত।",
  "deeper": "গভীর উপলব্ধি",
  "deeperDesc": "আয়াত কেন এবং কখন নাযিল হয়েছিল তা জানুন।",
  "return": "কুরআনে ফিরে যান"
};

en.surah = {
  "verses": "{{count}} Verses"
};

bn.surah = {
  "verses": "{{count}} আয়াত"
};

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
