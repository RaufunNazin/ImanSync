import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Video, Type } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserDua } from '@/utils/my-duas-storage';

interface AddDuaModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dua: Omit<UserDua, 'id' | 'createdAt'>) => void;
  colors: any;
}

export default function AddDuaModal({ visible, onClose, onSave, colors }: AddDuaModalProps) {
  const { t } = useTranslation();
  
  const [title, setTitle] = useState('');
  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [translation, setTranslation] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setArabic('');
    setTransliteration('');
    setTranslation('');
    setMediaType('text');
    setMediaUri(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType('image');
    }
  };

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType('video');
    }
  };

  const handleSave = () => {
    if (!title) return;
    
    if (mediaType === 'text' && !translation && !arabic) return;
    if (mediaType !== 'text' && !mediaUri) return;

    onSave({
      title,
      arabic,
      transliteration,
      translation,
      type: mediaType,
      mediaUri: mediaUri || undefined,
    });
    handleClose();
  };

  if (!visible) return null;

  const isValid = title.trim() !== '' && 
    ((mediaType === 'text' && (translation.trim() !== '' || arabic.trim() !== '')) || 
     (mediaType !== 'text' && mediaUri));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{t('dua.addDua')}</Text>
              <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              
              <View style={styles.typeSelector}>
                <TouchableOpacity 
                  style={[styles.typeBtn, mediaType === 'text' && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} 
                  onPress={() => setMediaType('text')}
                >
                  <Type size={18} color={mediaType === 'text' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: mediaType === 'text' ? colors.accent : colors.textSecondary }]}>{t('dua.addText')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.typeBtn, mediaType === 'image' && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} 
                  onPress={pickImage}
                >
                  <ImageIcon size={18} color={mediaType === 'image' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: mediaType === 'image' ? colors.accent : colors.textSecondary }]}>{t('dua.addImage')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.typeBtn, mediaType === 'video' && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} 
                  onPress={pickVideo}
                >
                  <Video size={18} color={mediaType === 'video' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: mediaType === 'video' ? colors.accent : colors.textSecondary }]}>{t('dua.addVideo')}</Text>
                </TouchableOpacity>
              </View>

              {mediaUri && mediaType !== 'text' && (
                <View style={[styles.mediaPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSecondary, fontFamily: Fonts.outfit }}>Media selected ready to save.</Text>
                  <TouchableOpacity onPress={() => { setMediaUri(null); setMediaType('text'); }}>
                    <Text style={{ color: '#EF4444', marginTop: 8, fontFamily: Fonts.outfit }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTitle')} *</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                  placeholder={t('dua.duaTitle')}
                  placeholderTextColor={colors.textSecondary + '88'}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {mediaType === 'text' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaArabic')}</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, fontFamily: Fonts.arabic }]}
                      placeholder="بِسْمِ اللَّهِ..."
                      placeholderTextColor={colors.textSecondary + '88'}
                      value={arabic}
                      onChangeText={setArabic}
                      multiline
                      textAlign="right"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTransliteration')}</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                      placeholder="Bismillah..."
                      placeholderTextColor={colors.textSecondary + '88'}
                      value={transliteration}
                      onChangeText={setTransliteration}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTranslation')}</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                      placeholder="In the name of Allah..."
                      placeholderTextColor={colors.textSecondary + '88'}
                      value={translation}
                      onChangeText={setTranslation}
                      multiline
                    />
                  </View>
                </>
              )}

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: isValid ? colors.accent : colors.border }]} 
                onPress={handleSave}
                disabled={!isValid}
              >
                <Text style={[styles.saveBtnText, { color: isValid ? '#FFF' : colors.textSecondary }]}>{t('dua.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 20,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  typeText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  mediaPreview: {
    padding: Spacing.four,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  input: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: 1,
  },
  saveBtn: {
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
});
