const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ConfirmModal.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Modal, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';",
  "import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';\nimport AppModal from './AppModal';");

const newComponent = `
  if (!visible) return null;

  return (
    <AppModal visible={visible} onClose={onCancel} title={title}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity activeOpacity={1} 
          style={[styles.btn, { backgroundColor: colors.backgroundElement }]} 
          onPress={onCancel}
        >
          <Text style={[styles.btnText, { color: colors.text }]}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={1} 
          style={[styles.btn, { backgroundColor: confirmColor }]} 
          onPress={onConfirm}
        >
          <Text style={[styles.btnText, { color: '#FFF' }]}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </AppModal>
  );
}`;

content = content.replace(/  if \(\!visible\) return null;[\s\S]*?  \);\n\}/, newComponent);

content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  container: \{[\s\S]*?  \},/, "");
content = content.replace(/  title: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('ConfirmModal fixed');
