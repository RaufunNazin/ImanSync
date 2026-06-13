const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ActionSheet.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { Modal, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback, ScrollView } from 'react-native';",
  "import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';\nimport AppModal from './AppModal';"
);

const oldReturn = `  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                      onClose();
                      setTimeout(opt.onPress, 300);
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
    </Modal>
  );`;

const newReturn = `  return (
    <AppModal visible={visible} onClose={onClose} title={title}>
      <View style={styles.optionsList}>
        {options.map((opt) => (
          <TouchableOpacity activeOpacity={1}
            key={opt.id}
            style={styles.optionRow}
            onPress={() => {
              onClose();
              setTimeout(opt.onPress, 300);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: opt.iconBgColor || colors.backgroundElement }]}>
              {opt.icon}
            </View>
            <Text style={[styles.optionLabel, { color: opt.labelColor || colors.text }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </AppModal>
  );`;

content = content.replace(oldReturn, newReturn);

// Clean up styles
content = content.replace(/  overlay: \{[\s\S]*?  \},/, "");
content = content.replace(/  sheet: \{[\s\S]*?  \},/, "");
content = content.replace(/  header: \{[\s\S]*?  \},/, "");
content = content.replace(/  title: \{[\s\S]*?  \},/, "");
content = content.replace(/  closeBtn: \{[\s\S]*?  \},/, "");

fs.writeFileSync(file, content, 'utf8');
console.log('ActionSheet fixed');
