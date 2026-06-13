const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/(tabs)/settings.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { ActivityIndicator, Alert, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';",
  "import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';\nimport AppModal from '@/components/AppModal';"
);

// Update Modal
const oldUpdate = `      {/* Update Modal */}
      {updateModal && (
        <Modal visible={updateModal.visible} transparent animationType="fade" onRequestClose={() => updateModal.type !== 'loading' && setUpdateModal(null)}>
          <TouchableWithoutFeedback onPress={() => updateModal.type !== 'loading' && setUpdateModal(null)}>
            <View style={updateStyles.overlay}>
              <TouchableWithoutFeedback>
                <View style={[updateStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {updateModal.type !== 'loading' && (
                    <TouchableOpacity activeOpacity={1} style={[updateStyles.closeBtn, { backgroundColor: colors.backgroundElement }]} onPress={() => setUpdateModal(null)}>
                      <X size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  
                  <View style={[updateStyles.iconWrap, { backgroundColor: updateModal.type === 'success' ? colors.accent + '20' : updateModal.type === 'error' ? colors.error + '20' : activeColor + '20' }]}>
                    {updateModal.type === 'success' ? (
                      <CheckCircle size={32} color={colors.accent} />
                    ) : updateModal.type === 'error' ? (
                      <AlertCircle size={32} color={colors.error} />
                    ) : (
                      <ActivityIndicator size="large" color={activeColor} />
                    )}
                  </View>
                  
                  <Text style={[updateStyles.title, { color: colors.text }]}>{updateModal.title}</Text>
                  <Text style={[updateStyles.desc, { color: colors.textSecondary }]}>{updateModal.message}</Text>
                  
                  {updateModal.type !== 'loading' && (
                    <TouchableOpacity activeOpacity={1} style={[updateStyles.btn, { backgroundColor: updateModal.type === 'success' ? colors.accent : colors.error }]} onPress={() => setUpdateModal(null)}>
                      <Text style={updateStyles.btnText}>{t('system.gotIt', 'Got It')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}`;

const newUpdate = `      {/* Update Modal */}
      {updateModal && (
        <AppModal 
          visible={updateModal.visible} 
          onClose={() => updateModal.type !== 'loading' && setUpdateModal(null)}
          hideClose={updateModal.type === 'loading'}
          scrollable={false}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={[updateStyles.iconWrap, { backgroundColor: updateModal.type === 'success' ? colors.accent + '20' : updateModal.type === 'error' ? colors.error + '20' : activeColor + '20' }]}>
              {updateModal.type === 'success' ? (
                <CheckCircle size={32} color={colors.accent} />
              ) : updateModal.type === 'error' ? (
                <AlertCircle size={32} color={colors.error} />
              ) : (
                <ActivityIndicator size="large" color={activeColor} />
              )}
            </View>
            
            <Text style={[updateStyles.title, { color: colors.text }]}>{updateModal.title}</Text>
            <Text style={[updateStyles.desc, { color: colors.textSecondary }]}>{updateModal.message}</Text>
            
            {updateModal.type !== 'loading' && (
              <TouchableOpacity activeOpacity={1} style={[updateStyles.btn, { backgroundColor: updateModal.type === 'success' ? colors.accent : colors.error }]} onPress={() => setUpdateModal(null)}>
                <Text style={updateStyles.btnText}>{t('system.gotIt', 'Got It')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </AppModal>
      )}`;

content = content.replace(oldUpdate, newUpdate);

// Storage Confirm Modal
const oldStorage = `      {/* Storage Confirm Modal */}
      {storageConfirmModal && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setStorageConfirmModal(null)}>
          <TouchableWithoutFeedback onPress={() => setStorageConfirmModal(null)}>
            <View style={updateStyles.overlay}>
              <TouchableWithoutFeedback>
                <View style={[updateStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity activeOpacity={1}
                    style={[updateStyles.closeBtn, { backgroundColor: colors.backgroundElement }]}
                    onPress={() => setStorageConfirmModal(null)}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <View style={[updateStyles.iconWrap, { backgroundColor: colors.textSecondary + '20' }]}>
                    <FolderLock size={32} color={colors.textSecondary} />
                  </View>

                  <Text style={[updateStyles.title, { color: colors.text }]}>
                    {storageConfirmModal === 'enable'
                      ? t('settings.permanentStorageOn')
                      : t('settings.permanentStorageOff')}
                  </Text>
                  <Text style={[updateStyles.desc, { color: colors.textSecondary }]}>
                    {storageConfirmModal === 'enable'
                      ? t('settings.permanentStorageOnDesc')
                      : t('settings.permanentStorageOffDesc')}
                  </Text>

                  <TouchableOpacity activeOpacity={1}
                    style={[updateStyles.btn, { backgroundColor: storageConfirmModal === 'enable' ? activeColor : colors.error }]}
                    onPress={confirmStorageChange}
                  >
                    <Text style={updateStyles.btnText}>
                      {storageConfirmModal === 'enable'
                        ? t('settings.permanentStorageConfirmEnable')
                        : t('settings.permanentStorageConfirmDisable')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={1}
                    style={[updateStyles.btn, { backgroundColor: colors.backgroundElement, marginTop: 8 }]}
                    onPress={() => setStorageConfirmModal(null)}
                  >
                    <Text style={[updateStyles.btnText, { color: colors.textSecondary }]}>
                      {t('settings.cancel')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}`;

const newStorage = `      {/* Storage Confirm Modal */}
      {storageConfirmModal && (
        <AppModal visible={true} onClose={() => setStorageConfirmModal(null)} scrollable={false}>
          <View style={{ alignItems: 'center' }}>
            <View style={[updateStyles.iconWrap, { backgroundColor: colors.textSecondary + '20' }]}>
              <FolderLock size={32} color={colors.textSecondary} />
            </View>

            <Text style={[updateStyles.title, { color: colors.text }]}>
              {storageConfirmModal === 'enable'
                ? t('settings.permanentStorageOn')
                : t('settings.permanentStorageOff')}
            </Text>
            <Text style={[updateStyles.desc, { color: colors.textSecondary }]}>
              {storageConfirmModal === 'enable'
                ? t('settings.permanentStorageOnDesc')
                : t('settings.permanentStorageOffDesc')}
            </Text>

            <TouchableOpacity activeOpacity={1}
              style={[updateStyles.btn, { backgroundColor: storageConfirmModal === 'enable' ? activeColor : colors.error }]}
              onPress={confirmStorageChange}
            >
              <Text style={updateStyles.btnText}>
                {storageConfirmModal === 'enable'
                  ? t('settings.permanentStorageConfirmEnable')
                  : t('settings.permanentStorageConfirmDisable')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={1}
              style={[updateStyles.btn, { backgroundColor: colors.backgroundElement, marginTop: 8 }]}
              onPress={() => setStorageConfirmModal(null)}
            >
              <Text style={[updateStyles.btnText, { color: colors.textSecondary }]}>
                {t('settings.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </AppModal>
      )}`;

content = content.replace(oldStorage, newStorage);

// Remove updateStyles overlay, card, closeBtn
content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  card: \{[\s\S]*?  \},/, "");
content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('settings.tsx fixed');
