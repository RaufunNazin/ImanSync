const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.home.suhur = "Suhur";
en.home.suhurDesc = "Ends at Imsak";
en.home.iftar = "Iftar";
en.home.iftarDesc = "Begins at Maghrib";
en.home.tahajjud = "Tahajjud";
en.home.tahajjudDesc = "Last third of night";

bn.home.suhur = "সাহরি";
bn.home.suhurDesc = "ইমসাখে শেষ";
bn.home.iftar = "ইফতার";
bn.home.iftarDesc = "মাগরিবে শুরু";
bn.home.tahajjud = "তাহাজ্জুদ";
bn.home.tahajjudDesc = "রাতের শেষ তৃতীয়াংশ";

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
