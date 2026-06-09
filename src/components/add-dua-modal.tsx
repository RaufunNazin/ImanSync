import React, { useState, useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Video, Type, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserDua, loadCustomCategories, saveCustomCategories, CustomCategory } from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'imansync_dua_draft';

interface AddDuaModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dua: Omit<UserDua, 'id' | 'createdAt'>) => void;
  initialData?: UserDua | null;
  colors: any;
}

export default function AddDuaModal({ visible, onClose, onSave, initialData, colors }: AddDuaModalProps) {
  const { t, i18n } = useTranslation();
  
  const [titleBn, setTitleBn] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [activeTab, setActiveTab] = useState<'en' | 'bn'>(i18n.language === 'bn' ? 'bn' : 'en');
  const [arabic, setArabic] = useState('');
  const [transliterationBn, setTransliterationBn] = useState('');
  const [transliterationEn, setTransliterationEn] = useState('');
  const [translationBn, setTranslationBn] = useState('');
  const [translationEn, setTranslationEn] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const titleRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && initialData) {
      setTitleBn(initialData.titleBn || initialData.title || '');
      setTitleEn(initialData.titleEn || initialData.title || '');
      setArabic(initialData.arabic || '');
      setTransliterationBn(initialData.transliterationBn || initialData.transliteration || '');
      setTransliterationEn(initialData.transliterationEn || '');
      setTranslationBn(initialData.translationBn || initialData.translation || '');
      setTranslationEn(initialData.translationEn || '');
      setMediaType(initialData.type);
      setMediaUri(initialData.mediaUri || null);
      setSelectedCategoryId(initialData.categoryId || null);
      loadCustomCategories().then(setCategories);
    } else if (visible) {
      // Load draft if no initialData
      AsyncStorage.getItem(DRAFT_KEY).then(draft => {
        if (draft) {
          try {
            const data = JSON.parse(draft);
            setTitleBn(data.titleBn || '');
            setTitleEn(data.titleEn || '');
            setArabic(data.arabic || '');
            setTransliterationBn(data.transliterationBn || '');
            setTransliterationEn(data.transliterationEn || '');
            setTranslationBn(data.translationBn || '');
            setTranslationEn(data.translationEn || '');
            setMediaType(data.type || 'text');
            setMediaUri(data.mediaUri || null);
            setSelectedCategoryId(data.categoryId || null);
          } catch (e) {
            console.error('Failed to parse draft', e);
          }
        } else {
          reset();
        }
      });
      setActiveTab(i18n.language === 'bn' ? 'bn' : 'en');
      loadCustomCategories().then(setCategories);
    }
  }, [visible, initialData, i18n.language]);

  // Auto-save draft effect
  useEffect(() => {
    if (visible && !initialData) {
      const draft = {
        titleBn, titleEn, arabic, transliterationBn, transliterationEn, translationBn, translationEn, type: mediaType, mediaUri, categoryId: selectedCategoryId
      };
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(console.error);
    }
  }, [titleBn, titleEn, arabic, transliterationBn, transliterationEn, translationBn, translationEn, mediaType, mediaUri, selectedCategoryId, visible, initialData]);

  const reset = () => {
    setTitleBn('');
    setTitleEn('');
    setArabic('');
    setTransliterationBn('');
    setTransliterationEn('');
    setTranslationBn('');
    setTranslationEn('');
    setMediaType('text');
    setMediaUri(null);
    setSelectedCategoryId(null);
    setIsCreatingCategory(false);
    setNewCategoryName('');
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
      setTimeout(() => titleRef.current?.focus(), 100);
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
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCat: CustomCategory = {
      id: Math.random().toString(36).substring(7),
      name: newCategoryName.trim(),
      createdAt: Date.now()
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    await saveCustomCategories(updated);
    setSelectedCategoryId(newCat.id);
    setIsCreatingCategory(false);
    setNewCategoryName('');
  };

  const handleSave = () => {
    if (!titleBn.trim() && !titleEn.trim()) return;
    if (mediaType === 'text' && !translationBn && !translationEn && !arabic) return;
    if (mediaType !== 'text' && !mediaUri) return;

    onSave({
      titleBn: titleBn.trim(),
      titleEn: titleEn.trim(),
      arabic,
      transliterationBn,
      transliterationEn,
      translationBn,
      translationEn,
      type: mediaType,
      mediaUri: mediaUri || undefined,
      categoryId: selectedCategoryId || undefined,
    });
    if (!initialData) AsyncStorage.removeItem(DRAFT_KEY);
    reset(); // Clear state so draft is not immediately overwritten before unmount
    onClose();
  };

  if (!visible) return null;

  const isValid = (titleBn.trim() !== '' || titleEn.trim() !== '') && 
    ((mediaType === 'text' && (translationBn.trim() !== '' || translationEn.trim() !== '' || arabic.trim() !== '')) || 
     (mediaType !== 'text' && mediaUri));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior="padding"
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four }} />
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{initialData ? t('dua.editDua', {defaultValue: 'Edit Dua'}) : t('dua.addDua')}</Text>
              <TouchableOpacity activeOpacity={1} onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="none">
              <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.tabBtn, activeTab === 'en' && { backgroundColor: colors.accent }]}
                  onPress={() => setActiveTab('en')}
                >
                  <Text style={[styles.tabText, { color: activeTab === 'en' ? '#FFF' : colors.textSecondary }]}>{t('quranSettings.enTrans', { defaultValue: 'English' })}</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={1}
                  style={[styles.tabBtn, activeTab === 'bn' && { backgroundColor: colors.accent }]}
                  onPress={() => setActiveTab('bn')}
                >
                  <Text style={[styles.tabText, { color: activeTab === 'bn' ? '#FFF' : colors.textSecondary }]}>{t('quranSettings.bnTrans', { defaultValue: 'Bangla' })}</Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'en' ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTitle', {defaultValue: 'Title'})} (English) *</Text>
                  <TextInput
                    ref={titleRef}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                    placeholder={t('dua.duaTitle', {defaultValue: 'Title'})}
                    placeholderTextColor={colors.textSecondary + '88'}
                    value={titleEn}
                    onChangeText={setTitleEn}
                  />
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTitle', {defaultValue: 'Title'})} (বাংলা) *</Text>
                  <TextInput
                    ref={titleRef}
                    style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                    placeholder={t('dua.duaTitle', {defaultValue: 'Title'})}
                    placeholderTextColor={colors.textSecondary + '88'}
                    value={titleBn}
                    onChangeText={setTitleBn}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.selectCategory', { defaultValue: 'Select Category' })}</Text>
                
                {isCreatingCategory ? (
                  <View style={{ gap: 8 }}>
                    <TextInput
                      style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                      placeholder={t('dua.categoryName', { defaultValue: 'Category Name' })}
                      placeholderTextColor={colors.textSecondary + '88'}
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                    />
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                      <TouchableOpacity activeOpacity={1} style={[styles.createBtn, { paddingVertical: 10, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={() => setIsCreatingCategory(false)}>
                        <Text style={{ color: colors.text, fontFamily: Fonts.outfit }}>{t('dua.cancel', { defaultValue: 'Cancel' })}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity activeOpacity={1} style={[styles.createBtn, { paddingVertical: 10, backgroundColor: colors.accent }]} onPress={handleCreateCategory}>
                        <Text style={{ color: '#FFF', fontFamily: Fonts.outfit }}>{t('dua.createCategoryBtn', { defaultValue: 'Create' })}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <TouchableOpacity activeOpacity={1} 
                      style={[styles.catBadge, !selectedCategoryId && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}
                      onPress={() => setSelectedCategoryId(null)}
                    >
                      <Text style={[styles.catBadgeText, { color: !selectedCategoryId ? colors.accent : colors.textSecondary }]}>{t('dua.myDuas')}</Text>
                    </TouchableOpacity>
                    {categories.map(c => (
                      <TouchableOpacity activeOpacity={1} 
                        key={c.id}
                        style={[styles.catBadge, selectedCategoryId === c.id && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]}
                        onPress={() => setSelectedCategoryId(c.id)}
                      >
                        <Text style={[styles.catBadgeText, { color: selectedCategoryId === c.id ? colors.accent : colors.textSecondary }]}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity activeOpacity={1} 
                      style={[styles.catBadge, { borderStyle: 'dashed', borderColor: colors.textSecondary }]}
                      onPress={() => setIsCreatingCategory(true)}
                    >
                      <Plus size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.catBadgeText, { color: colors.textSecondary }]}>{t('dua.createNewCategory', { defaultValue: 'New' })}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.typeSelector}>
                <TouchableOpacity activeOpacity={1} 
                  style={[styles.typeBtn, mediaType === 'text' && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} 
                  onPress={() => setMediaType('text')}
                >
                  <Type size={18} color={mediaType === 'text' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: mediaType === 'text' ? colors.accent : colors.textSecondary }]}>{t('dua.typeText', { defaultValue: 'Text' })}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity activeOpacity={1} 
                  style={[styles.typeBtn, mediaType === 'image' && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} 
                  onPress={pickImage}
                >
                  <ImageIcon size={18} color={mediaType === 'image' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: mediaType === 'image' ? colors.accent : colors.textSecondary }]}>{t('dua.typeImage', { defaultValue: 'Image' })}</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={1} 
                  style={[styles.typeBtn, mediaType === 'video' && { backgroundColor: colors.accent + '22', borderColor: colors.accent }]} 
                  onPress={pickVideo}
                >
                  <Video size={18} color={mediaType === 'video' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.typeText, { color: mediaType === 'video' ? colors.accent : colors.textSecondary }]}>{t('dua.typeVideo', { defaultValue: 'Video' })}</Text>
                </TouchableOpacity>
              </View>

              {mediaType === 'text' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaArabic')}</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, fontFamily: Fonts.arabic }]}
                      placeholder={t("myDuas.arabicPlaceholder", { defaultValue: "بِسْمِ اللَّهِ..." })}
                      placeholderTextColor={colors.textSecondary + '88'}
                      value={arabic}
                      onChangeText={setArabic}
                      multiline
                      textAlign="right"
                    />
                  </View>

                  {activeTab === 'bn' ? (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTranslationBn', {defaultValue: 'Bangla Translation'})}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                          placeholder={t("myDuas.bnTranslationPlaceholder", { defaultValue: "বাংলা অনুবাদ..." })}
                          placeholderTextColor={colors.textSecondary + '88'}
                          value={translationBn}
                          onChangeText={setTranslationBn}
                          multiline
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTransliterationBn', {defaultValue: 'Bangla Transliteration'})}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                          placeholder={t("myDuas.bnTransliterationPlaceholder", { defaultValue: "বাংলা উচ্চারণ..." })}
                          placeholderTextColor={colors.textSecondary + '88'}
                          value={transliterationBn}
                          onChangeText={setTransliterationBn}
                          multiline
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTranslationEn', {defaultValue: 'English Translation'})}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                          placeholder={t("myDuas.enTranslationPlaceholder", { defaultValue: "English Translation..." })}
                          placeholderTextColor={colors.textSecondary + '88'}
                          value={translationEn}
                          onChangeText={setTranslationEn}
                          multiline
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dua.duaTransliterationEn', {defaultValue: 'English Transliteration'})}</Text>
                        <TextInput
                          style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
                          placeholder={t("myDuas.enTransliterationPlaceholder", { defaultValue: "English Transliteration..." })}
                          placeholderTextColor={colors.textSecondary + '88'}
                          value={transliterationEn}
                          onChangeText={setTransliterationEn}
                          multiline
                        />
                      </View>
                    </>
                  )}
                </>
              )}

              {mediaUri && mediaType !== 'text' && (
                <View style={[styles.mediaPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {mediaType === 'image' ? (
                    <Image source={{ uri: mediaUri }} style={{ width: '100%', height: 200, borderRadius: 8 }} resizeMode="contain" />
                  ) : (
                    <View style={{ width: '100%', height: 150, backgroundColor: colors.backgroundElement, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                       <Video size={48} color={colors.textSecondary} />
                    </View>
                  )}
                  <TouchableOpacity activeOpacity={1} onPress={() => { setMediaUri(null); setMediaType('text'); }}>
                    <Text style={{ color: '#EF4444', marginTop: 12, fontFamily: Fonts.outfit }}>{t('dua.removeMedia', { defaultValue: 'Remove' })}</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity activeOpacity={1} 
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: Spacing.four,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    marginBottom: Spacing.five,
  },
  title: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
  },
  closeBtn: {
    padding: Spacing.two,
  },
  content: {
    paddingHorizontal: Spacing.five,
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: Spacing.four,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    fontWeight: '600',
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
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
    paddingBottom: Platform.OS === 'ios' ? Spacing.six : Spacing.five,
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
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catBadgeText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
  },
  createBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  }
});
