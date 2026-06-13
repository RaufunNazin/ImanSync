const fs = require('fs');
const path = require('path');

// TimePickerModal.tsx
let f1 = path.join(__dirname, 'src/components/TimePickerModal.tsx');
let c1 = fs.readFileSync(f1, 'utf8');

c1 = c1.replace(
  /<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>\n\s*<TouchableWithoutFeedback onPress={onClose}>\n\s*<View style=\{styles\.overlay\}>\n\s*<ThemeCard intensity=\{20\} style=\{StyleSheet\.absoluteFill\} \/>\n\n\s*<TouchableWithoutFeedback>\n\s*<View\n\s*style=\{\[\n\s*styles\.container,\n\s*\{ backgroundColor: colors\.background, borderColor: colors\.border \},\n\s*\]\}\n\s*>/g,
  `<AppModal visible={visible} onClose={onClose} title={title} scrollable={false}>\n      <View style={[styles.container, { paddingHorizontal: 0, paddingVertical: 0, borderColor: 'transparent', backgroundColor: colors.background }]}>`
);

c1 = c1.replace(
  /<\/View>\n\s*<\/TouchableWithoutFeedback>\n\s*<\/View>\n\s*<\/TouchableWithoutFeedback>\n\s*<\/Modal>/g,
  `      </View>\n    </AppModal>`
);

fs.writeFileSync(f1, c1, 'utf8');

// juz/[id].tsx
let f2 = path.join(__dirname, 'src/app/juz/[id].tsx');
let c2 = fs.readFileSync(f2, 'utf8');

c2 = c2.replace(
  /<Modal visible={modalVisible} transparent animationType="slide" onRequestClose=\{\(\) => setModalVisible\(false\)\}>\n\s*<View style=\{styles\.modalOverlay\}>\n\s*<TouchableOpacity activeOpacity=\{1\} style=\{StyleSheet\.absoluteFill\} onPress=\{\(\) => setModalVisible\(false\)\} \/>\n\s*<View \n\s*style=\{\[styles\.modalContent, \{ backgroundColor: colors\.background, borderColor: colors\.textSecondary \+ '20' \}\]\}\n\s*>\n\s*<View style=\{\{ width: 40, height: 4, backgroundColor: colors\.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing\.four \}\} \/>\n\s*<View style=\{styles\.modalHeader\}>\n\s*<Text style=\{\[styles\.modalTitle, \{ color: colors\.text \}\]\}>\{t\('quranSettings\.title'\)\}<\/Text>\n\s*<TouchableOpacity activeOpacity=\{1\} onPress=\{\(\) => setModalVisible\(false\)\} style=\{styles\.closeBtn\}>\n\s*<X size=\{24\} color=\{colors\.text\} \/>\n\s*<\/TouchableOpacity>\n\s*<\/View>\n\n\s*<ScrollView showsVerticalScrollIndicator=\{false\}>/g,
  `<AppModal visible={modalVisible} onClose={() => setModalVisible(false)} title={t('quranSettings.title')}>`
);

c2 = c2.replace(
  /<\/ScrollView>\n\s*<\/View>\n\s*<\/View>\n\s*<\/Modal>/g,
  `    </AppModal>`
);

fs.writeFileSync(f2, c2, 'utf8');
console.log('Fixed final');
