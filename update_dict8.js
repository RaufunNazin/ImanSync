const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.tracker.progress = "Today's Sincerity";
en.tracker.weeklyOverview = "This Week";

bn.tracker.progress = "আজকের নিষ্ঠা";
bn.tracker.weeklyOverview = "এই সপ্তাহে";

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
