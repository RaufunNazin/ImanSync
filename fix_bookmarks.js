const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/dua-bookmarks.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';",
  "import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, TouchableWithoutFeedback } from 'react-native';\nimport AppModal from '@/components/AppModal';"
);

// 1. Create Modal
const oldCreate = `      <Modal visible={createModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableWithoutFeedback onPress={() => setCreateModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('dua.newFolder')}</Text>
                  
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    placeholder={t('dua.folderName')}
                    placeholderTextColor={colors.textSecondary}
                    autoFocus
                  />

                  <View style={styles.modalFooter}>
                    <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setCreateModalVisible(false)}>
                      <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('settings.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: activeColor }]} onPress={handleCreateFolder}>
                      <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{t('dua.save')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>`;

const newCreate = `      <AppModal 
        visible={createModalVisible} 
        onClose={() => setCreateModalVisible(false)} 
        title={t('dua.newFolder')}
        avoidKeyboard
        scrollable={false}
      >
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          value={newFolderName}
          onChangeText={setNewFolderName}
          placeholder={t('dua.folderName')}
          placeholderTextColor={colors.textSecondary}
          autoFocus
        />

        <View style={styles.modalFooter}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setCreateModalVisible(false)}>
            <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('settings.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} style={[styles.modalBtn, { backgroundColor: activeColor }]} onPress={handleCreateFolder}>
            <Text style={[styles.modalBtnText, { color: '#FFF' }]}>{t('dua.save')}</Text>
          </TouchableOpacity>
        </View>
      </AppModal>`;

content = content.replace(oldCreate, newCreate);

// 2. Move Modal
const oldMove = `      <Modal visible={moveModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setMoveModalVisible(false)}>
          <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheetCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />
                
                <Text style={[styles.modalTitle, { color: colors.text, marginBottom: Spacing.four }]}>{t('dua.moveTo')}</Text>

                {folders.map(f => (
                  <TouchableOpacity activeOpacity={1} 
                    key={f.id} 
                    style={[styles.folderRow, { borderBottomColor: colors.border }]}
                    onPress={() => handleMoveBookmark(f.id)}
                  >
                    <Folder size={20} color={colors.textSecondary} />
                    <Text style={[styles.folderRowText, { color: colors.text }]}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>`;

const newMove = `      <AppModal 
        visible={moveModalVisible} 
        onClose={() => setMoveModalVisible(false)} 
        title={t('dua.moveTo')}
      >
        {folders.map(f => (
          <TouchableOpacity activeOpacity={1} 
            key={f.id} 
            style={[styles.folderRow, { borderBottomColor: colors.border }]}
            onPress={() => handleMoveBookmark(f.id)}
          >
            <Folder size={20} color={colors.textSecondary} />
            <Text style={[styles.folderRowText, { color: colors.text }]}>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </AppModal>`;

content = content.replace(oldMove, newMove);

// Clean up styles
content = content.replace(/  modalOverlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  modalCard: \{[\s\S]*?  \},/, "");
content = content.replace(/  sheetCard: \{[\s\S]*?  \},/, "");
content = content.replace(/  modalTitle: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('dua-bookmarks fixed');
