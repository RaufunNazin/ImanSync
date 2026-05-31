import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkMinus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PinSheetProps {
  visible: boolean;
  categoryName: string;
  isPinned: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  colors: any;
}

export default function PinSheet({
  visible,
  categoryName,
  isPinned,
  onClose,
  onTogglePin,
  colors,
}: PinSheetProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              
              <Text style={[styles.title, { color: colors.text }]}>{categoryName}</Text>
              
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.card }]}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onTogglePin();
                  onClose();
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: isPinned ? colors.red + '22' : colors.accent + '22' }]}>
                  {isPinned ? (
                    <BookmarkMinus size={20} color={colors.red} />
                  ) : (
                    <Bookmark size={20} color={colors.accent} />
                  )}
                </View>
                <Text style={[styles.actionText, { color: isPinned ? colors.red : colors.text }]}>
                  {isPinned ? t('dua.unpin') : t('dua.pin')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing.five,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
    marginBottom: Spacing.five,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    gap: Spacing.four,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
});
