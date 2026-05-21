const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.home.tahajjudDesc = "Last Third";
bn.home.tahajjudDesc = "শেষ তৃতীয়াংশ";

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
