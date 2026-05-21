const fs = require('fs');

const enUi = require('./src/i18n/locales/en.json');
const bnUi = require('./ui_bn.json');

const namesEn = require('./names_en.json');
const namesBn = require('./names_bn.json');

enUi.namesList = namesEn;
bnUi.namesList = namesBn;

fs.writeFileSync('./src/i18n/locales/en.json', JSON.stringify(enUi, null, 2));
fs.writeFileSync('./src/i18n/locales/bn.json', JSON.stringify(bnUi, null, 2));
console.log('Merged successfully');
