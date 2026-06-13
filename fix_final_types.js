const fs = require('fs');
const path = require('path');

const addImport = (file, importString) => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import AppModal')) {
    content = content.replace(/import React/, `${importString}\nimport React`);
    fs.writeFileSync(file, content, 'utf8');
  }
};

['src/app/juz/[id].tsx', 'src/app/surah/[id].tsx', 'src/app/dua-detail.tsx', 'src/app/my-dua-detail/[id].tsx', 'src/app/(tabs)/settings.tsx'].forEach(f => {
  addImport(path.join(__dirname, f), "import AppModal from '@/components/AppModal';");
});

const removeModalContent = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  // Remove the old Modal leftover JSX
  content = content.replace(/<View style=\{\[styles\.modalContent, \{ backgroundColor: colors\.background, borderColor: colors\.border \}\]\}>\n\s*<View style=\{\{ width: 40, height: 4, backgroundColor: colors\.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing\.four \}\} \/>\n\s*<View style=\{\[styles\.modalHeader, \{ borderBottomColor: colors\.border \}\]\}>\n\s*<Text style=\{\[styles\.modalTitle, \{ color: colors\.text \}\]\}>\{t\('duaSettings\.title'\)\}<\/Text>\n\s*<TouchableOpacity activeOpacity=\{1\} onPress=\{\(\) => setSettingsVisible\(false\)\} style=\{styles\.closeBtn\}>\n\s*<X size=\{24\} color=\{colors\.text\} \/>\n\s*<\/TouchableOpacity>\n\s*<\/View>/g, "");

  content = content.replace(/<View style=\{styles\.modalOverlay\}>\n\s*<TouchableOpacity activeOpacity=\{1\} style=\{StyleSheet\.absoluteFill\} onPress=\{\(\) => setSettingsVisible\(false\)\} \/>/g, "");
  
  // also the AppModal is probably wrapped inside this now
  fs.writeFileSync(file, content, 'utf8');
}

['src/app/dua-detail.tsx', 'src/app/my-dua-detail/[id].tsx'].forEach(f => removeModalContent(path.join(__dirname, f)));

console.log('Fixed imports and residual JSX');
