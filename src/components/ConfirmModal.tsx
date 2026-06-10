import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 20,
    marginBottom: 12,
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
