const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/TimePickerModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix the missing circleY calculation
content = content.replace(
  "  const circleY =\n    <Modal visible={visible} transparent animationType=\"fade\" onRequestClose={onClose}>\n      <TouchableWithoutFeedback onPress={onClose}>\n        <View style={styles.overlay}>\n          <ThemeCard intensity={20} style={StyleSheet.absoluteFill} />\n\n          <TouchableWithoutFeedback>\n            <View\n              style={[\n                styles.container,\n                { backgroundColor: colors.background, borderColor: colors.border },\n              ]}\n            >",
  `  const circleY =
    RADIUS +
    Math.sin((currentAngle - 90) * (Math.PI / 180)) * NUMBER_RADIUS -
    20;

  if (!visible) return null;

  return (
    <AppModal visible={visible} onClose={onClose} title={title} scrollable={false}>
      <View style={[styles.container, { paddingHorizontal: 0, paddingVertical: 0, borderColor: 'transparent', backgroundColor: colors.background }]}>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('TimePickerModal finally fixed');
