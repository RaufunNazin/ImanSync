const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/OptionsModal.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import {\n  Modal,\n  View,\n  Text,\n  TouchableOpacity,\n  StyleSheet,\n  TouchableWithoutFeedback,\n  ScrollView,\n  TextInput,\n} from 'react-native';",
  "import {\n  View,\n  Text,\n  TouchableOpacity,\n  StyleSheet,\n  ScrollView,\n  TextInput,\n} from 'react-native';\nimport AppModal from './AppModal';"
);

const oldComponentStart = `  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24, marginTop: 24 }} />
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.closeBtn}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>`;

const newComponentStart = `  return (
    <AppModal visible={visible} onClose={onClose} title={title} scrollable={false} contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 0 }}>`;

content = content.replace(oldComponentStart, newComponentStart);

const oldComponentEnd = `              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );`;

const newComponentEnd = `              )}
    </AppModal>
  );`;

content = content.replace(oldComponentEnd, newComponentEnd);

// Remove unused styles
content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  modalContainer: \{[\s\S]*?  \},/, "");
content = content.replace(/  header: \{[\s\S]*?  \},/, "");
content = content.replace(/  title: \{[\s\S]*?  \},/, "");
content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('OptionsModal fixed');
