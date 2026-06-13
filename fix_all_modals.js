const fs = require('fs');

const fixFile = (pathStr, replaceFn) => {
  if (fs.existsSync(pathStr)) {
    let content = fs.readFileSync(pathStr, 'utf8');
    content = replaceFn(content);
    fs.writeFileSync(pathStr, content, 'utf8');
  }
};

// 1. settings.tsx
fixFile('src/app/(tabs)/settings.tsx', (content) => {
  content = content.replace(/<View style=\{\[updateStyles\.iconWrap[\s\S]*?<\/Text>\n\s*<\/TouchableOpacity>\n\s*<\/View>\n\s*<\/AppModal>/, 
  (match) => { return match; } // Actually settings.tsx doesn't have modalHeader, it has updateStyles. closeBtn was missing from updateStyles type.
  );
  // Re-add missing styles to updateStyles or just replace them with inline styles.
  content = content.replace(/updateStyles\.closeBtn/g, "styles.dummyCloseBtn");
  content = content.replace(/updateStyles\.iconWrap/g, "{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }");
  content = content.replace(/updateStyles\.title/g, "{ fontFamily: Fonts.outfit, fontSize: 18, marginBottom: 8, textAlign: 'center' }");
  content = content.replace(/updateStyles\.desc/g, "{ fontFamily: Fonts.outfit, fontSize: 14, textAlign: 'center', marginBottom: 24 }");
  content = content.replace(/updateStyles\.btn/g, "{ paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' }");
  content = content.replace(/updateStyles\.btnText/g, "{ fontFamily: Fonts.outfit, color: '#FFF', fontSize: 16, fontWeight: '500' }");
  return content;
});

// 2. surah/[id].tsx and juz/[id].tsx
const fixQuranSettings = (content) => {
  content = content.replace(/<Modal visible=\{modalVisible\}[\s\S]*?<ScrollView showsVerticalScrollIndicator=\{false\}>/,
  `<AppModal visible={modalVisible} onClose={() => setModalVisible(false)} title={t('quranSettings.title')}>`);
  content = content.replace(/<\/ScrollView>\n\s*<\/View>\n\s*<\/View>\n\s*<\/Modal>/, `</AppModal>`);
  
  // also fix sectionTitle
  content = content.replace(/styles\.sectionTitle/g, "{ fontFamily: Fonts.outfit, fontSize: 14, marginBottom: 8, marginTop: 16 }");
  return content;
};
fixFile('src/app/surah/[id].tsx', fixQuranSettings);
fixFile('src/app/juz/[id].tsx', fixQuranSettings);

// 3. dua-detail.tsx and my-dua-detail/[id].tsx
const fixDuaSettings = (content) => {
  content = content.replace(/<Modal visible=\{settingsVisible\}[\s\S]*?<ScrollView showsVerticalScrollIndicator=\{false\}>/,
  `<AppModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} title={t('quranSettings.title', { defaultValue: 'Reader Settings' })}>`);
  content = content.replace(/<\/ScrollView>\n\s*<\/View>\n\s*<\/View>\n\s*<\/Modal>/, `</AppModal>`);

  content = content.replace(/styles\.sectionTitle/g, "{ fontFamily: Fonts.outfit, fontSize: 14, marginBottom: 8, marginTop: 16 }");
  return content;
};
fixFile('src/app/dua-detail.tsx', fixDuaSettings);
fixFile('src/app/my-dua-detail/[id].tsx', fixDuaSettings);

console.log('Fixed JSX in all files');
