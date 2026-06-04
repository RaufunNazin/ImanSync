import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { Trash2, Edit2, Bookmark, Settings2, Minus, Plus, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { saveMyDuas } from '@/utils/my-duas-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { loadMyDuas, UserDua, getMediaUri } from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { useVideoPlayer, VideoView } from 'expo-video';
import AddDuaModal from '@/components/add-dua-modal';
import ActionSheet from '@/components/ActionSheet';
import ConfirmModal from '@/components/ConfirmModal';

interface DuaSettings {
  showEnTrans: boolean;
  showBnTrans: boolean;
  showEnTranslit: boolean;
  showBnTranslit: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  translitFontSize: number;
}

const DEFAULT_SETTINGS: DuaSettings = {
  showEnTrans: true,
  showBnTrans: true,
  showEnTranslit: true,
  showBnTranslit: true,
  arabicFontSize: 20,
  translationFontSize: 16,
  translitFontSize: 16,
};

export default function MyDuaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();
  
  const [dua, setDua] = useState<UserDua | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imageRatio, setImageRatio] = useState(1);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);

  const [settings, setSettings] = useState<DuaSettings>(() => ({
    ...DEFAULT_SETTINGS,
    showEnTrans: i18n.language === 'en',
    showBnTrans: i18n.language === 'bn',
    showEnTranslit: i18n.language === 'en',
    showBnTranslit: i18n.language === 'bn',
  }));
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  const handleDelete = async () => {
    const duas = await loadMyDuas();
    const updated = duas.filter(d => d.id !== id);
    await saveMyDuas(updated);
    router.back();
  };

  useEffect(() => {
    const fetchDua = async () => {
      const duas = await loadMyDuas();
      const found = duas.find(d => d.id === id);
      if (found) {
        setDua(found);
        if (found.mediaUri && found.type !== 'text') {
          const uri = await getMediaUri(found.mediaUri);
          setLocalUri(uri);
          if (found.type === 'image' && uri) {
            Image.getSize(uri, (w, h) => setImageRatio(w / h), () => setImageRatio(1));
          }
        }
      }
      setLoading(false);
    };
    fetchDua();

    AsyncStorage.getItem('imansync_dua_settings').then(val => {
      if (val) {
        try { setSettings(prev => ({ ...prev, ...JSON.parse(val) })); } catch (e) { console.error('Corrupted dua settings', e); }
      }
    }).catch(e => console.error(e));

    AsyncStorage.getItem('imansync_dua_bookmarks').then(val => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          setBookmarks(parsed);
          setIsBookmarked(parsed.some((b: any) => b.id.toString() === id.toString()));
        } catch (e) {
          console.error('Corrupted dua bookmarks', e);
        }
      }
    });
  }, [id]);

  const toggleBookmark = async () => {
    if (!dua) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let updated = [...bookmarks];
    if (isBookmarked) {
      updated = updated.filter(b => b.id.toString() !== id.toString());
    } else {
      updated.push({
        id: dua.id,
        categoryName: i18n.language === 'bn' ? (dua.titleBn || dua.titleEn || dua.title || '') : (dua.titleEn || dua.titleBn || dua.title || ''),
        arabic: dua.arabic || '',
        latin: dua.transliterationEn || dua.transliteration || '',
        translationEn: dua.translationEn || dua.translation || '',
        translationBn: dua.translationBn || dua.translation || '',
        transliterationBn: dua.transliterationBn || '',
        source: 'user',
        image: dua.mediaUri || '',
        isCustom: true
      });
    }
    setBookmarks(updated);
    setIsBookmarked(!isBookmarked);
    await AsyncStorage.setItem('imansync_dua_bookmarks', JSON.stringify(updated));
  };

  const updateSetting = (key: keyof DuaSettings, val: any) => {
    setSettings(prev => {
      const next = { ...prev, [key]: val };
      AsyncStorage.setItem('imansync_dua_settings', JSON.stringify(next));
      return next;
    });
  };

  const player = useVideoPlayer(localUri, player => {
    player.loop = true;
    player.pause();
  });

  const handleUpdate = async (updatedData: Omit<UserDua, 'id' | 'createdAt'>) => {
    if (!dua) return;
    let finalMediaUri = updatedData.mediaUri;
    if (updatedData.mediaUri && updatedData.mediaUri !== dua.mediaUri && updatedData.type !== 'text') {
      const { saveMediaFile } = await import('@/utils/my-duas-storage');
      finalMediaUri = await saveMediaFile(updatedData.mediaUri, updatedData.mediaUri);
    }
    const updatedDua: UserDua = {
      ...updatedData,
      id: dua.id,
      createdAt: dua.createdAt,
      mediaUri: finalMediaUri,
    };
    const duas = await loadMyDuas();
    const newDuas = duas.map(d => d.id === dua.id ? updatedDua : d);
    await saveMyDuas(newDuas);
    setDua(updatedDua);
    if (updatedDua.mediaUri && updatedDua.type !== 'text') {
      const uri = await getMediaUri(updatedDua.mediaUri);
      setLocalUri(uri);
      if (updatedDua.type === 'image' && uri) {
        Image.getSize(uri, (w, h) => setImageRatio(w / h), () => setImageRatio(1));
      }
    } else {
      setLocalUri(null);
    }
  };

  const isBanglaMode = i18n.language === 'bn';

  const renderSizeControl = (label: string, value: number, onChange: (val: number) => void) => (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.sizeControls}>
        <TouchableOpacity 
          style={[styles.sizeBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(Math.max(12, value - 2)); }}
        >
          <Minus size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.sizeValue, { color: colors.text }]}>{value}</Text>
        <TouchableOpacity 
          style={[styles.sizeBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(Math.min(48, value + 2)); }}
        >
          <Plus size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderToggle = (label: string, value: boolean, onChange: (val: boolean) => void) => (
    <View style={styles.settingRow}>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.toggleWrap, value ? { backgroundColor: colors.highlight } : { backgroundColor: colors.border }]}
        activeOpacity={0.8}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(!value); }}
      >
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </TouchableOpacity>
    </View>
  );

  const renderSettingsModal = () => (
    <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four }} />
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('duaSettings.title')}</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.closeBtn}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.four }}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('duaSettings.textSizes')}</Text>
                
                {renderSizeControl(t('duaSettings.arabicFont'), settings.arabicFontSize, v => updateSetting('arabicFontSize', v))}
                {renderSizeControl(t('duaSettings.translationFont'), settings.translationFontSize, v => updateSetting('translationFontSize', v))}
                {renderSizeControl(t('duaSettings.translitFont'), settings.translitFontSize, v => updateSetting('translitFontSize', v))}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('duaSettings.translations')}</Text>
                {renderToggle(t('duaSettings.enTrans'), settings.showEnTrans, v => updateSetting('showEnTrans', v))}
                {isBanglaMode && renderToggle(t('duaSettings.bnTrans'), settings.showBnTrans, v => updateSetting('showBnTrans', v))}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('duaSettings.translit')}</Text>
                {renderToggle(t('duaSettings.enTranslit'), settings.showEnTranslit, v => updateSetting('showEnTranslit', v))}
                {isBanglaMode && renderToggle(t('duaSettings.bnTranslit'), settings.showBnTranslit, v => updateSetting('showBnTranslit', v))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.loading', { defaultValue: 'Loading...' })} titleAr="" showBack />
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!dua) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.notFound', { defaultValue: 'Not Found' })} titleAr="" showBack />
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>{t('dua.notFound', { defaultValue: 'Dua not found.' })}</Text>
      </SafeAreaView>
    );
  }

  const showArabic = !!dua.arabic;
  const showBnTranslit = isBanglaMode && settings.showBnTranslit && (!!dua.transliterationBn || !!dua.transliteration);
  const showEnTranslit = settings.showEnTranslit && (!!dua.transliterationEn || !!dua.transliteration);
  const showBnTrans = isBanglaMode && settings.showBnTrans && (!!dua.translationBn || !!dua.translation);
  const showEnTrans = settings.showEnTrans && (!!dua.translationEn || !!dua.translation);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={i18n.language === 'bn' ? (dua.titleBn || dua.titleEn || dua.title || '') : (dua.titleEn || dua.titleBn || dua.title || '')} 
        titleAr="" 
        showBack 
        rightElement={
          <View style={{ flexDirection: 'row', gap: Spacing.two, marginLeft: Spacing.two }}>
            <TouchableOpacity 
              style={[styles.settingsIconBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]} 
              onPress={toggleBookmark}
            >
              <Bookmark size={16} color={isBookmarked ? colors.accent : colors.textSecondary} fill={isBookmarked ? colors.accent : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingsIconBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]} 
              onPress={() => setSettingsVisible(true)}
            >
              <Settings2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        } 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <TouchableOpacity activeOpacity={0.9} onLongPress={() => setShowOptionsSheet(true)} delayLongPress={300}>
          {dua.type === 'text' && (
            <BlurView intensity={40} tint={colors.glassTint as any} style={[styles.card, { borderColor: colors.border }]}>
              {showArabic && (
                <View style={styles.section}>
                  <Text style={[styles.arabic, { color: colors.text, fontSize: settings.arabicFontSize, lineHeight: settings.arabicFontSize * 1.6 }]}>{dua.arabic}</Text>
                </View>
              )}

              {/* Transliterations */}
              {showBnTranslit && (
                <View style={[styles.section, { borderTopWidth: showArabic ? 1 : 0, borderTopColor: colors.border + '55', paddingTop: showArabic ? Spacing.four : 0 }]}>
                  <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.bnTranslit')}</Text>
                  <Text style={[styles.latin, { color: colors.textSecondary, fontSize: settings.translitFontSize, lineHeight: settings.translitFontSize * 1.5 }]}>{dua.transliterationBn || dua.transliteration}</Text>
                </View>
              )}

              {showEnTranslit && (
                <View style={[styles.section, { borderTopWidth: (showArabic || showBnTranslit) ? 1 : 0, borderTopColor: colors.border + '55', paddingTop: (showArabic || showBnTranslit) ? Spacing.four : 0 }]}>
                  <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.enTranslit')}</Text>
                  <Text style={[styles.latin, { color: colors.textSecondary, fontSize: settings.translitFontSize, lineHeight: settings.translitFontSize * 1.5 }]}>{dua.transliterationEn || dua.transliteration}</Text>
                </View>
              )}

              {/* Translations */}
              {showBnTrans && (
                <View style={[styles.section, { borderTopWidth: (showArabic || showBnTranslit || showEnTranslit) ? 1 : 0, borderTopColor: colors.border + '55', paddingTop: (showArabic || showBnTranslit || showEnTranslit) ? Spacing.four : 0 }]}>
                  <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.bnTrans')}</Text>
                  <Text style={[styles.translation, { color: colors.text, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>{(dua.translationBn || dua.translation || '').replace(/\\n/g, '\n')}</Text>
                </View>
              )}

              {showEnTrans && (
                <View style={[styles.section, { borderTopWidth: (showArabic || showBnTranslit || showEnTranslit || showBnTrans) ? 1 : 0, borderTopColor: colors.border + '55', paddingTop: (showArabic || showBnTranslit || showEnTranslit || showBnTrans) ? Spacing.four : 0 }]}>
                  <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.enTrans')}</Text>
                  <Text style={[styles.translation, { color: colors.text, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>{(dua.translationEn || dua.translation || '').replace(/\\n/g, '\n')}</Text>
                </View>
              )}
            </BlurView>
          )}

          {dua.type === 'image' && localUri && (
            <View style={[styles.mediaCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Image 
                source={{ uri: localUri }} 
                style={[styles.imageFull, { aspectRatio: imageRatio }]} 
                resizeMode="contain"
              />
            </View>
          )}

          {dua.type === 'video' && localUri && (
            <View style={[styles.mediaCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
              <VideoView 
                player={player} 
                style={styles.videoFull} 
              />
            </View>
          )}
        </TouchableOpacity>
      
      <ConfirmModal
        visible={showDeleteModal}
        title={t('dua.deleteDuaTitle', { defaultValue: 'Delete Dua' })}
        message={t('dua.deleteDuaDesc', { defaultValue: 'Are you sure you want to delete this dua?' })}
        confirmText={t('dua.delete', { defaultValue: 'Delete' })}
        cancelText={t('dua.cancel', { defaultValue: 'Cancel' })}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        colors={colors}
      />

      <ActionSheet
        visible={showOptionsSheet}
        title={t('dua.options', { defaultValue: 'Options' })}
        onClose={() => setShowOptionsSheet(false)}
        colors={colors}
        options={[
          {
            id: 'edit',
            icon: <Edit2 size={20} color={colors.textSecondary} />,
            label: t('dua.editDua', { defaultValue: 'Edit Dua' }),
            iconBgColor: colors.textSecondary + '22',
            onPress: () => {
              setShowOptionsSheet(false);
              setShowEditModal(true);
            }
          },
          {
            id: 'delete',
            icon: <Trash2 size={20} color="#EF4444" />,
            label: t('dua.deleteDua', { defaultValue: 'Delete Dua' }),
            iconBgColor: '#EF444422',
            labelColor: '#EF4444',
            onPress: () => {
              setShowOptionsSheet(false);
              setShowDeleteModal(true);
            }
          }
        ]}
      />

      <AddDuaModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
        initialData={dua}
        colors={colors}
      />

      </ScrollView>
      {renderSettingsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    paddingTop: 0,
  },
  settingsIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    overflow: 'hidden',
  },
  section: {
    gap: Spacing.two,
  },
  arabic: {
    fontFamily: Fonts.arabic,
    textAlign: 'right',
  },
  latin: {
    fontFamily: Fonts.outfit,
    fontStyle: 'italic',
  },
  translation: {
    fontFamily: Fonts.outfit,
  },
  languageTag: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  mediaCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  imageFull: {
    width: '100%',
  },
  videoFull: {
    width: '100%',
    aspectRatio: 16/9,
  },

  // Modal Styles for Reader Settings
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    padding: Spacing.five,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  modalTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
  },
  closeBtn: {
    padding: Spacing.two,
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
    height: 15,
    marginBottom: Spacing.two,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  settingLabel: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  sizeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeValue: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  toggleWrap: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.2)',
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },

  // Options Sheet Styles
  sheetOverlay: {
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
  sheetTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  sheetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    gap: Spacing.four,
    padding: 12,
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  }
});
