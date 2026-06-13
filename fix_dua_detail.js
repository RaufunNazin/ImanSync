const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    "import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';",
    "import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';\nimport AppModal from '@/components/AppModal';"
  );

  const oldModal = `  const renderSettingsModal = () => (
    <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={() => setSettingsVisible(false)} />
        <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.textSecondary + '20' }]}>
          <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four }} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('quranSettings.title', { defaultValue: 'Reader Settings' })}</Text>
            <TouchableOpacity activeOpacity={1} onPress={() => setSettingsVisible(false)} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>`;

  const newModal = `  const renderSettingsModal = () => (
    <AppModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} title={t('quranSettings.title', { defaultValue: 'Reader Settings' })}>`;

  content = content.replace(oldModal, newModal);

  const oldEnd = `          </ScrollView>
        </View>
      </View>
    </Modal>
  );`;

  const newEnd = `    </AppModal>
  );`;

  content = content.replace(oldEnd, newEnd);

  // Clean styles
  content = content.replace(/  modalOverlay: \{[\s\S]*?  \},/, "");
  content = content.replace(/  modalContent: \{[\s\S]*?  \},/, "");
  content = content.replace(/  modalHeader: \{[\s\S]*?  \},/, "");
  content = content.replace(/  modalTitle: \{[\s\S]*?  \},/, "");
  content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(filePath + ' fixed');
}

processFile(path.join(__dirname, 'src/app/dua-detail.tsx'));
processFile(path.join(__dirname, 'src/app/my-dua-detail/[id].tsx'));

