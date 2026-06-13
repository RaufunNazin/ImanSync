import AppModal from './AppModal';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export interface ActionOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  iconBgColor?: string;
  labelColor?: string;
  closeOnPress?: boolean;
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
    <AppModal visible={visible} onClose={onClose} title={title} scrollable={false}>
      <View style={{ paddingTop: Spacing.two }}>
        <View style={[styles.actionsContainer, { gap: 20 }]}>
          {options.map((opt) => (
            <TouchableOpacity activeOpacity={1}
              key={opt.id}
              style={[
                styles.actionBtn
              ]}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch (e) {}
                opt.onPress();
                if (opt.closeOnPress !== false) {
                  onClose();
                }
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
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  actionsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
});
