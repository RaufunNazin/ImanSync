const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/AppModal.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add reanimated import
if (!content.includes('react-native-reanimated')) {
  content = content.replace(/import React from 'react';/, "import React from 'react';\nimport Animated, { SlideInDown } from 'react-native-reanimated';");
}

// 2. Change animationType="slide" to "fade"
content = content.replace(/animationType="slide"/, 'animationType="fade"');

// 3. Change <View style={[styles.modalContainer... to <Animated.View entering={SlideInDown.duration(250)}
content = content.replace(/<View style=\{\[styles\.modalContainer, \{ backgroundColor: colors\.background, borderColor: colors\.border \}\]\}>/, 
  "<Animated.View entering={SlideInDown.duration(250)} style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>");

// 4. Change matching </View> to </Animated.View> for modalContainer
// It's the one before </View>\n    </View> that ends `content`
content = content.replace(/<\/View>\n\s*<\/View>\n\s*\);/, "</Animated.View>\n    </View>\n  );");

// 5. Remove closeBtn background
content = content.replace(/<TouchableOpacity activeOpacity=\{1\} onPress=\{onClose\} style=\{\[styles\.closeBtn, \{ backgroundColor: colors\.backgroundElement \}\]\}>/, 
  "<TouchableOpacity activeOpacity={1} onPress={onClose} style={[styles.closeBtn]}>");

// 6. Adjust staticContent and scrollContent padding to be more like reading preferences
// Reading preferences use `gap: Spacing.four` and default AppModal `paddingHorizontal: 24, paddingBottom: 24`.
// In AppModal.tsx, scrollContent has `paddingHorizontal: 24, paddingBottom: 24`.
// The user said "the settings modals do not have any padding". Let's check settings modals.
// Ah, `SystemAnnouncer` and `settings` modals might not use `contentContainerStyle` padding properly if they are wrapped in standard `View`s inside `staticContent`. But wait, `staticContent` DOES have `paddingHorizontal: 24`.
// Maybe they mean there is no gap between the title and the content?
// In `settings.tsx`:
// <Text style={[{ fontFamily: Fonts.outfit, fontSize: 18, marginBottom: 8, textAlign: 'center' }...
// There is an 8px margin bottom.
// Wait, in the updated `fix_all_modals.js` I replaced `updateStyles.card` stuff but for `AppModal` I didn't add top padding!
// In `AppModal`, `styles.header` has `marginBottom: 24`. If there is no header, the `modalContainer` has the drag handle with `marginBottom: 24`. So there's 24 padding top basically.
// Wait, the reading preferences modals have no `AppModal` title! They pass `title={t('duaSettings.title')}` to `AppModal`.
// And they have `gap: Spacing.four`.
// In `settings.tsx` update modal:
// There is NO TITLE prop passed to `AppModal`.
// So it renders the drag handle, then directly `children`.
// Wait, if no title is passed, does `AppModal` still render the header? No, it checks `(title || headerRight || !hideClose)`.
// `hideClose` is true for update loading modal. So it doesn't render header.
// So there is NO paddingHorizontal applied to the drag handle! The drag handle has `marginBottom: 24` but it is centered.
// The `children` is rendered inside `staticContent`.
// `staticContent` has `paddingHorizontal: 24, paddingBottom: 24`.
// So why does the user say "the settings modals do not have any padding"?
// Oh! In `settings.tsx`:
// <AppModal visible={updateModal.visible} onClose={() => ...} hideClose={updateModal.type === 'loading'} scrollable={false}>
//   <View style={{ alignItems: 'center' }}>
// wait, maybe the update modal has paddingHorizontal 24 but they mean vertical padding?
// "i like the padding and spacing of the reading preferences modal"
// "also the settings modals do not have any padding"
// I will check `settings.tsx` and `SystemAnnouncer.tsx` to add `paddingBottom: 24` or `padding: 24` to their inner views, or just ensure `AppModal` is consistent.
// Let's modify `AppModal.tsx` padding:
// scrollContent: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
// staticContent: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
content = content.replace(/paddingBottom: 24,/g, "paddingBottom: Platform.OS === 'ios' ? 40 : 24,");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed AppModal.tsx');
