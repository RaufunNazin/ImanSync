const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';",
    "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback, TextInput, Alert } from 'react-native';\nimport AppModal from '@/components/AppModal';"
  );

  const oldModal = `      {/* History Edit Modal */}
      {historyModalDate && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setHistoryModalDate(null)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={() => setHistoryModalDate(null)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('tracker.editHistory', 'Edit History')}</Text>
                    <Text style={[styles.modalSub, { color: colors.textSecondary }]}>{historyModalDate}</Text>
                    
                    <TextInput
                      style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                      keyboardType="numeric"
                      value={editValue}
                      onChangeText={setEditValue}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                    />

                    <View style={styles.modalFooter}>
                      <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setHistoryModalDate(null)}>
                        <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('settings.cancel', 'Cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleSaveHistory}>
                        <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{t('dua.save', 'Save')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      )}`;

  const newModal = `      {/* History Edit Modal */}
      {historyModalDate && (
        <AppModal 
          visible={true} 
          onClose={() => setHistoryModalDate(null)} 
          title={t('tracker.editHistory', 'Edit History')}
          avoidKeyboard
          scrollable={false}
        >
          <Text style={[styles.modalSub, { color: colors.textSecondary, marginBottom: 16 }]}>{historyModalDate}</Text>
          
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            keyboardType="numeric"
            value={editValue}
            onChangeText={setEditValue}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setHistoryModalDate(null)}>
              <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('settings.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleSaveHistory}>
              <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{t('dua.save', 'Save')}</Text>
            </TouchableOpacity>
          </View>
        </AppModal>
      )}`;

  content = content.replace(oldModal, newModal);

  // clean styles
  content = content.replace(/  modalOverlay: \{[\s\S]*?  \},/, "");
  content = content.replace(/  modalCard: \{[\s\S]*?  \},/, "");
  content = content.replace(/  modalTitle: \{[\s\S]*?  \},/, "");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(filePath + ' fixed');
}

processFile(path.join(__dirname, 'src/app/(tabs)/tracker.tsx'));
processFile(path.join(__dirname, 'src/app/quran-tracker.tsx'));
