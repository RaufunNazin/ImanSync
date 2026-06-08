const fs = require('fs');

const enJson = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
console.log(enJson['trivia']);
