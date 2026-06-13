const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/add-dua-modal.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableWithoutFeedback } from 'react-native';",
  "import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';\nimport AppModal from './AppModal';"
);

const oldReturn = `  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior="padding"
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four }} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{initialData ? t('dua.editDua', {defaultValue: 'Edit Dua'}) : t('dua.addDua')}</Text>
              <TouchableOpacity activeOpacity={1} onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">`;

const newReturn = `  return (
    <AppModal 
      visible={visible} 
      onClose={handleClose} 
      title={initialData ? t('dua.editDua', {defaultValue: 'Edit Dua'}) : t('dua.addDua')}
      avoidKeyboard
      footer={
        <TouchableOpacity activeOpacity={1} 
          style={[styles.saveBtn, { backgroundColor: activeColor, opacity: isValid ? 1 : 0.5 }]} 
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={[styles.saveBtnText, { color: '#FFF' }]}>{t('dua.save')}</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>`;

content = content.replace(oldReturn, newReturn);

const oldEnd = `            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity activeOpacity={1} 
                style={[styles.saveBtn, { backgroundColor: activeColor, opacity: isValid ? 1 : 0.5 }]} 
                onPress={handleSave}
                disabled={!isValid}
              >
                <Text style={[styles.saveBtnText, { color: '#FFF' }]}>{t('dua.save')}</Text>
              </TouchableOpacity>
              </View>
              </View>
          </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );`;

const newEnd = `      </View>
    </AppModal>
  );`;

content = content.replace(oldEnd, newEnd);

// clean styles
content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  modal: \{[\s\S]*?  \},/, "");
content = content.replace(/  header: \{[\s\S]*?  \},/, "");
content = content.replace(/  title: \{[\s\S]*?  \},/, "");
content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");
content = content.replace(/  footer: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('add-dua-modal fixed');
