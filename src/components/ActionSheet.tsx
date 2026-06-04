import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView } from 'react-native';
import { Fonts, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface ActionOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  iconBgColor?: string;
  labelColor?: string;
}

interface ActionSheetProps {
  visible: boolean;
  title: string;
  options: ActionOption[];
  onClose: () => void;
  colors: any;
}

export default function ActionSheet({
  visible,
  title,
  options,
  onClose,
  colors,
}: ActionSheetProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior="padding" style={{ width: '100%' }}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              
              {options.map((opt, i) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.actionBtn, { backgroundColor: colors.backgroundElement, marginTop: i > 0 ? Spacing.three : 0 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch (e) {}
                    opt.onPress();
                    onClose();
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: opt.iconBgColor || colors.textSecondary + '22' }]}>
                    {opt.icon}
                  </View>
                  <Text style={[styles.actionText, { color: opt.labelColor || colors.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
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
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    gap: Spacing.four,
    padding: 12,
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
