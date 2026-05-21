const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.quranSettings.translations = "Translations";
en.quranSettings.enTrans = "English Translation";
en.quranSettings.bnTrans = "Bangla Translation";
en.quranSettings.translit = "Transliteration";
en.quranSettings.enTranslit = "English Transliteration";

bn.quranSettings.translations = "অনুবাদসমূহ";
bn.quranSettings.enTrans = "ইংরেজি অনুবাদ";
bn.quranSettings.bnTrans = "বাংলা অনুবাদ";
bn.quranSettings.translit = "উচ্চারণ";
bn.quranSettings.enTranslit = "ইংরেজি উচ্চারণ";

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
