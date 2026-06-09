import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView } from 'react-native';
import { Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkMinus, Trash2, Edit3 } from 'lucide-react-native';



import ActionSheet, { ActionOption } from './ActionSheet';
import ConfirmModal from './ConfirmModal';

interface PinSheetProps {
  visible: boolean;
  title: string;
  isPinned: boolean;
  onClose: () => void;
  onTogglePin: () => void;
  colors: any;
  isUserCreated?: boolean;
  isDua?: boolean;
  onDelete?: () => void;
  showRename?: boolean;
  onRename?: (newName: string) => void;
}

export default function PinSheet({
  visible,
  title,
  isPinned,
  onClose,
  onTogglePin,
  colors,
  isUserCreated,
  isDua,
  onDelete,
  showRename,
  onRename,
}: PinSheetProps) {
  const { t } = useTranslation();
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState(title);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setIsRenaming(false);
      setShowDeleteModal(false);
      setNewName(title);
    }
  }, [visible, title]);

  useEffect(() => {
    if (isRenaming) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isRenaming]);

  if (!visible) return null;

  const actionOptions: ActionOption[] = [
    {
      id: 'pin',
      icon: isPinned ? <BookmarkMinus size={20} color={colors.accent} /> : <Bookmark size={20} color={colors.accent} />,
      label: isPinned ? t('dua.unpin') : t('dua.pin'),
      iconBgColor: colors.accent + '22',
      onPress: onTogglePin,
    }
  ];

  if (showRename) {
    actionOptions.push({
      id: 'rename',
      icon: <Edit3 size={20} color={colors.textSecondary} />,
      label: t('dua.renameCategory', { defaultValue: 'Rename' }),
      iconBgColor: colors.textSecondary + '22',
      onPress: () => setIsRenaming(true),
      closeOnPress: false,
    });
  }

  if (isUserCreated) {
    actionOptions.push({
      id: 'delete',
      icon: <Trash2 size={20} color="#EF4444" />,
      label: isDua ? t('dua.deleteDua', { defaultValue: 'Delete Dua' }) : t('dua.deleteCategory', { defaultValue: 'Delete Category' }),
      iconBgColor: '#EF444422',
      labelColor: '#EF4444',
      onPress: () => setShowDeleteModal(true),
      closeOnPress: false,
    });
  }

  return (
    <>
      <ActionSheet
        visible={visible && !isRenaming && !showDeleteModal}
        title={title}
        options={actionOptions}
        onClose={onClose}
        colors={colors}
      />
      
      <ConfirmModal
        visible={showDeleteModal}
        title={isDua ? t('dua.deleteDuaTitle', { defaultValue: 'Delete Dua' }) : t('dua.deleteCategoryTitle', { defaultValue: 'Delete Category' })}
        message={isDua ? t('dua.deleteDuaDesc', { defaultValue: 'Are you sure you want to delete this dua?' }) : t('dua.deleteCategoryDesc', { defaultValue: 'Are you sure you want to delete this category? Associated duas will be moved to My Duas.' })}
        confirmText={t('dua.delete', { defaultValue: 'Delete' })}
        cancelText={t('dua.cancel', { defaultValue: 'Cancel' })}
        onConfirm={() => {
          if (onDelete) onDelete();
          setShowDeleteModal(false);
          onClose();
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          onClose();
        }}
        colors={colors}
      />

      {isRenaming && (
        <Modal visible={visible && isRenaming} transparent animationType="fade" onRequestClose={() => setIsRenaming(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.overlay} onPress={() => setIsRenaming(false)}>
          <KeyboardAvoidingView behavior="padding" style={{ width: '100%' }}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>{t('dua.renameCategory', { defaultValue: 'Rename' })}</Text>
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                    value={newName}
                    onChangeText={setNewName}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <View style={{ flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four }}>
                    <TouchableOpacity activeOpacity={1}
                      style={[styles.btn, { backgroundColor: colors.card, flex: 1 }]}
                      onPress={() => {
                        setIsRenaming(false);
                        onClose();
                      }}
                    >
                      <Text style={[styles.btnText, { color: colors.text }]}>{t('dua.cancel', { defaultValue: 'Cancel' })}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={1}
                      style={[styles.btn, { backgroundColor: colors.accent, flex: 1 }]}
                      onPress={() => {
                        if (newName.trim() && onRename) {
                          onRename(newName.trim());
                        }
                        onClose();
                      }}
                    >
                      <Text style={[styles.btnText, { color: '#FFF' }]}>{t('dua.save', { defaultValue: 'Save' })}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
        </Modal>
      )}
    </>
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
  input: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.four,
  },
  btn: {
    padding: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontWeight: '500',
  }
});
