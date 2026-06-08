const fs = require('fs');

const bnJson = JSON.parse(fs.readFileSync('src/i18n/locales/bn.json', 'utf8'));
console.log(bnJson['trivia']);
