const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.quranSettings = {
  "title": "Reading Settings",
  "textSizes": "Text Sizes",
  "arabicFont": "Arabic Font",
  "translationFont": "Translation Font",
  "translitFont": "Transliteration Font",
  "displayOptions": "Display Options",
  "showTranslation": "Show Translation",
  "showTranslit": "Show Transliteration"
};

bn.quranSettings = {
  "title": "পড়ার সেটিংস",
  "textSizes": "টেক্সট সাইজ",
  "arabicFont": "আরবি ফন্ট",
  "translationFont": "অনুবাদ ফন্ট",
  "translitFont": "উচ্চারণ ফন্ট",
  "displayOptions": "প্রদর্শন অপশন",
  "showTranslation": "অনুবাদ দেখান",
  "showTranslit": "উচ্চারণ দেখান"
};

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
console.log('Dictionaries updated');
