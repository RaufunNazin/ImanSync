import React from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Fonts, useThemeColors } from '@/constants/theme';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  avoidKeyboard?: boolean;
  scrollable?: boolean;
  contentContainerStyle?: any;
  hideClose?: boolean;
}

export default function AppModal({
  visible,
  onClose,
  title,
  children,
  headerRight,
  footer,
  avoidKeyboard = false,
  scrollable = true,
  contentContainerStyle,
  hideClose = false,
}: AppModalProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.overlay, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(250)} style={[styles.modalContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12, marginTop: 12 }} />
        
        {(title || headerRight || !hideClose) && (
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title || ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {headerRight}
              {!hideClose && (
                <TouchableOpacity activeOpacity={1} onPress={onClose} style={[styles.closeBtn]}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {scrollable ? (
          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: footer ? 16 : 24 }, contentContainerStyle]} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flexShrink: 1 }, styles.staticContent, { paddingBottom: footer ? 16 : 24 }, contentContainerStyle]}>
            {children}
          </View>
        )}

        {footer && (
          <View style={[styles.footer]}>
            {footer}
          </View>
        )}
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      hardwareAccelerated={true}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView 
          style={{ flex: 1, margin: 0, padding: 0 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -insets.bottom : 0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    margin: 0,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderRadius: 32,
    borderWidth: 1,
    maxHeight: '90%',
    width: '100%',
    flexShrink: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    flex: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  staticContent: {
    paddingHorizontal: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
