const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/juz/[id].tsx');
let content = fs.readFileSync(file, 'utf8');

// remove weird empty lines and fix the ending of StyleSheet.create
content = content.replace(/  \/\/ Modal Styles[\s\S]*?  settingRow: \{/, "  // Modal Styles\n  settingRow: {");

fs.writeFileSync(file, content, 'utf8');
console.log('juz styles fixed');
