const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/pin-sheet.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Modal, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';",
  "import { StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput } from 'react-native';\nimport AppModal from './AppModal';"
);

// 1. Bottom Sheet for Options
const oldSheet = `      <Modal visible={visible && !isRenaming} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />
                
                <View style={styles.header}>
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                  <TouchableOpacity activeOpacity={1} onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsList}>
                  {options.map((opt) => (
                    <TouchableOpacity activeOpacity={1}
                      key={opt.id}
                      style={styles.optionRow}
                      onPress={() => {
                        if (opt.id === 'rename') {
                          setIsRenaming(true);
                        } else {
                          onClose();
                          setTimeout(opt.onPress, 300);
                        }
                      }}
                    >
                      <View style={[styles.iconBox, { backgroundColor: opt.iconBgColor || colors.backgroundElement }]}>
                        {opt.icon}
                      </View>
                      <Text style={[styles.optionLabel, { color: opt.labelColor || colors.text }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>`;

const newSheet = `      <AppModal visible={visible && !isRenaming} onClose={onClose} title={title}>
        <View style={styles.optionsList}>
          {options.map((opt) => (
            <TouchableOpacity activeOpacity={1}
              key={opt.id}
              style={styles.optionRow}
              onPress={() => {
                if (opt.id === 'rename') {
                  setIsRenaming(true);
                } else {
                  onClose();
                  setTimeout(opt.onPress, 300);
                }
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: opt.iconBgColor || colors.backgroundElement }]}>
                {opt.icon}
              </View>
              <Text style={[styles.optionLabel, { color: opt.labelColor || colors.text }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppModal>`;

content = content.replace(oldSheet, newSheet);

// 2. Rename Modal
const oldRename = `      {/* Rename Modal */}
      <Modal visible={visible && isRenaming} transparent animationType="fade" onRequestClose={() => setIsRenaming(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableWithoutFeedback onPress={() => setIsRenaming(false)}>
            <View style={styles.overlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.renameModal, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.title, { color: colors.text, marginBottom: 16 }]}>{t('dua.renameFolder')}</Text>
                  
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder={t('dua.folderName')}
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />

                  <View style={styles.renameFooter}>
                    <TouchableOpacity activeOpacity={1} style={[styles.renameBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setIsRenaming(false)}>
                      <Text style={[styles.renameBtnText, { color: colors.textSecondary }]}>{t('settings.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={1} style={[styles.renameBtn, { backgroundColor: colors.accent }]} onPress={handleRenameSave}>
                      <Text style={[styles.renameBtnText, { color: '#FFF' }]}>{t('dua.save')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>`;

const newRename = `      {/* Rename Modal */}
      <AppModal 
        visible={visible && isRenaming} 
        onClose={() => setIsRenaming(false)} 
        title={t('dua.renameFolder')}
        avoidKeyboard
        scrollable={false}
      >
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          value={newName}
          onChangeText={setNewName}
          placeholder={t('dua.folderName')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />

        <View style={styles.renameFooter}>
          <TouchableOpacity activeOpacity={1} style={[styles.renameBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setIsRenaming(false)}>
            <Text style={[styles.renameBtnText, { color: colors.textSecondary }]}>{t('settings.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} style={[styles.renameBtn, { backgroundColor: colors.accent }]} onPress={handleRenameSave}>
            <Text style={[styles.renameBtnText, { color: '#FFF' }]}>{t('dua.save')}</Text>
          </TouchableOpacity>
        </View>
      </AppModal>`;

content = content.replace(oldRename, newRename);

// Clean up styles
content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  sheet: \{[\s\S]*?  \},/, "");
content = content.replace(/  renameModal: \{[\s\S]*?  \},/, "");
content = content.replace(/  header: \{[\s\S]*?  \},/, "");
content = content.replace(/  title: \{[\s\S]*?  \},/, "");
content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('pin-sheet fixed');
