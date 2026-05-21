const fs = require('fs');

const en = require('./src/i18n/locales/en.json');
const bn = require('./src/i18n/locales/bn.json');

en.dua.tasbeehCounter = "Tasbeeh Counter";
en.dua.cycleGoal = "Cycle: {{cycle}}/3 • Goal: 33";

bn.dua.tasbeehCounter = "তাসবীহ কাউন্টার";
bn.dua.cycleGoal = "চক্র: {{cycle}}/৩ • লক্ষ্য: ৩৩";

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bn, null, 2));
