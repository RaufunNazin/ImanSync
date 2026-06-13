const fs = require('fs');
const path = require('path');

const addImport = (file, importString) => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import AppModal')) {
    content = content.replace(/import React/, `${importString}\nimport React`);
    fs.writeFileSync(file, content, 'utf8');
  }
};

const files = [
  'src/components/ActionSheet.tsx',
  'src/components/pin-sheet.tsx',
  'src/components/SystemAnnouncer.tsx',
  'src/components/TimePickerModal.tsx'
];

files.forEach(f => {
  addImport(path.join(__dirname, f), "import AppModal from './AppModal';");
});

// Fix SystemAnnouncer.tsx any type
let saFile = path.join(__dirname, 'src/components/SystemAnnouncer.tsx');
let saContent = fs.readFileSync(saFile, 'utf8');
saContent = saContent.replace(/changelog && getLocalizedText\(changelog\)\.map\(\(line, i\) => \(/g, "changelog && getLocalizedText(changelog).map((line: string, i: number) => (");
fs.writeFileSync(saFile, saContent, 'utf8');

console.log('Fixed imports and types');
