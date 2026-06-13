import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppModal from './AppModal';
import { Fonts } from '@/constants/theme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  colors: any;
  confirmColor?: string;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  colors,
  confirmColor = colors?.error,
}: ConfirmModalProps) {

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
}

const styles = StyleSheet.create({
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.outfit,
  },
});
