import PageHeader from '@/components/page-header';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { Bookmark, BookOpen, Minus, Plus, Settings2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';

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
  arabicFontSize: 28,
  translationFontSize: 18,
  translitFontSize: 16,
};

export default function DuaDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    categoryName: string;
    arabic: string;
    latin: string; // English Transliteration
    translationEn: string;
    translationBn: string;
    transliterationBn: string;
    source: string;
  }>();
  
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();

  const [settings, setSettings] = useState<DuaSettings>(DEFAULT_SETTINGS);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
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
          setIsBookmarked(parsed.some((b: any) => b.id.toString() === params.id.toString()));
        } catch (e) {
          console.error('Corrupted dua bookmarks', e);
        }
      }
    });
  }, [params.id]);

  const toggleBookmark = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let updated = [...bookmarks];
    if (isBookmarked) {
      updated = updated.filter(b => b.id.toString() !== params.id.toString());
    } else {
      updated.push({ ...params }); // Save the entire params object so we can render it instantly
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

  const isBanglaMode = i18n.language === 'bn';

  // Helper for font size controls
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
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('duaSettings.title')}</Text>
                <TouchableOpacity onPress={() => setSettingsVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <PageHeader titleEn={params.categoryName || 'Dua Detail'} titleAr="" showBack />
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <TouchableOpacity 
            style={[styles.settingsIconBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]} 
            onPress={toggleBookmark}
          >
            <Bookmark size={20} color={isBookmarked ? colors.accent : colors.textSecondary} fill={isBookmarked ? colors.accent : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingsIconBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]} 
            onPress={() => setSettingsVisible(true)}
          >
            <Settings2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        
        <BlurView intensity={40} tint={colors.glassTint as any} style={[styles.card, { borderColor: colors.border }]}>
          
          {params.arabic && (
            <View style={styles.section}>
              <Text style={[styles.arabic, { color: colors.text, fontSize: settings.arabicFontSize, lineHeight: settings.arabicFontSize * 1.6 }]}>{params.arabic}</Text>
            </View>
          )}

          {/* Transliterations */}
          {(settings.showEnTranslit && params.latin) && (
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + '55', paddingTop: Spacing.four }]}>
              <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.enTranslit')}</Text>
              <Text style={[styles.latin, { color: colors.textSecondary, fontSize: settings.translitFontSize, lineHeight: settings.translitFontSize * 1.5 }]}>{params.latin}</Text>
            </View>
          )}

          {(isBanglaMode && settings.showBnTranslit && params.transliterationBn) && (
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + '55', paddingTop: Spacing.four }]}>
              <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.bnTranslit')}</Text>
              <Text style={[styles.latin, { color: colors.textSecondary, fontSize: settings.translitFontSize, lineHeight: settings.translitFontSize * 1.5 }]}>{params.transliterationBn}</Text>
            </View>
          )}

          {/* Translations */}
          {(settings.showEnTrans && params.translationEn) && (
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + '55', paddingTop: Spacing.four }]}>
              <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.enTrans')}</Text>
              <Text style={[styles.translation, { color: colors.text, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>{params.translationEn}</Text>
            </View>
          )}

          {(isBanglaMode && settings.showBnTrans && params.translationBn) && (
            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + '55', paddingTop: Spacing.four }]}>
              <Text style={[styles.languageTag, { color: colors.textSecondary }]}>{t('duaSettings.bnTrans')}</Text>
              <Text style={[styles.translation, { color: colors.text, fontSize: settings.translationFontSize, lineHeight: settings.translationFontSize * 1.5 }]}>{params.translationBn}</Text>
            </View>
          )}

          {/* Source */}
          {params.source && (
            <View style={[styles.sourceBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <BookOpen size={16} color={colors.accent} />
              <Text style={[styles.sourceText, { color: colors.textSecondary }]}>{t('dua.source')}: {params.source}</Text>
            </View>
          )}

        </BlurView>
      </ScrollView>

      {renderSettingsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: Spacing.four,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  container: {
    padding: Spacing.four,
    paddingTop: 0,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.six,
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
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  sourceText: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    flex: 1,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
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
});
