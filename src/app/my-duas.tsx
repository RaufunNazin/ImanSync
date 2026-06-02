import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { Search, FolderLock, X, AlertTriangle } from 'lucide-react-native';
import {
  loadMyDuas, UserDua,
  getStorageMode, clearRelinkFlag, initPermanentStorage, migrateDuas, getStorageUri,
} from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';
import { ChevronRight, Image as ImageIcon, Video, Type } from 'lucide-react-native';

const BANNER_DISMISSED_KEY = 'imansync_storage_banner_dismissed';
const RELINK_NEEDED_KEY    = 'imansync_storage_relink';

export default function MyDuasScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<UserDua[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Banner states
  const [showSuggestBanner, setShowSuggestBanner] = useState(false);
  const [showRelinkBanner, setShowRelinkBanner] = useState(false);
  const [relinkLoading, setRelinkLoading] = useState(false);

  useEffect(() => {
    loadScreen();
  }, []);

  const loadScreen = async () => {
    try {
      const [loadedDuas, mode, relinkFlag, bannerDismissed] = await Promise.all([
        loadMyDuas(),
        getStorageMode(),
        AsyncStorage.getItem(RELINK_NEEDED_KEY),
        AsyncStorage.getItem(BANNER_DISMISSED_KEY),
      ]);
      setDuas(loadedDuas.sort((a, b) => b.createdAt - a.createdAt));
      setShowRelinkBanner(relinkFlag === 'true');
      setShowSuggestBanner(mode === 'internal' && bannerDismissed !== 'true');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestBanner = async () => {
    setShowSuggestBanner(false);
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  const handleRelink = async () => {
    setRelinkLoading(true);
    try {
      const result = await initPermanentStorage();
      if (!result.cancelled) {
        // Migrate any internal duas into the new permanent location
        const newUri = await getStorageUri();
        if (newUri) await migrateDuas('to_permanent', newUri);
        await clearRelinkFlag();
        setShowRelinkBanner(false);
        setShowSuggestBanner(false);
        // Reload duas from new location
        const updated = await loadMyDuas();
        setDuas(updated.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (e) {
      console.error('Relink failed', e);
    } finally {
      setRelinkLoading(false);
    }
  };





  const filteredDuas = duas.filter(dua => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (dua.title || '').toLowerCase().includes(q) ||
      (dua.titleBn || '').toLowerCase().includes(q) ||
      (dua.titleEn || '').toLowerCase().includes(q) ||
      (dua.translation || '').toLowerCase().includes(q) ||
      (dua.translationBn || '').toLowerCase().includes(q) ||
      (dua.translationEn || '').toLowerCase().includes(q) ||
      (dua.arabic || '').toLowerCase().includes(q) ||
      (dua.transliteration || '').toLowerCase().includes(q) ||
      (dua.transliterationBn || '').toLowerCase().includes(q) ||
      (dua.transliterationEn || '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('dua.myDuas')} titleAr="" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Relink Banner ─────────────────────────────────────────────── */}
        {showRelinkBanner && (
          <View style={[styles.banner, styles.bannerRelink, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
            <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <Text style={[styles.bannerText, { color: '#B91C1C', flex: 1 }]}>
              {t('dua.relinkStorage')}
            </Text>
            <TouchableOpacity
              style={[styles.bannerBtn, { backgroundColor: '#EF4444' }]}
              onPress={handleRelink}
              disabled={relinkLoading}
            >
              {relinkLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.bannerBtnText}>{t('dua.relinkStorageBtn')}</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Suggestion Banner ─────────────────────────────────────────── */}
        {!showRelinkBanner && showSuggestBanner && (
          <View style={[styles.banner, { borderColor: colors.highlight + '60', backgroundColor: colors.highlight + '15' }]}>
            <FolderLock size={18} color={colors.highlight} style={{ flexShrink: 0 }} />
            <Text style={[styles.bannerText, { color: colors.text, flex: 1 }]}>
              {t('dua.suggestPermanentStorage')}
            </Text>
            <TouchableOpacity onPress={dismissSuggestBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Search ────────────────────────────────────────────────────── */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('duaSettings.searchPlaceholder', { defaultValue: 'Search by name, translation...' })}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {filteredDuas.map((dua) => (
              <TouchableOpacity
                key={dua.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/my-dua-detail/${dua.id}` as any)}
              >
                <BlurView
                  intensity={40}
                  tint={colors.glassTint as any}
                  style={[styles.duaCard, { borderColor: colors.border }]}
                >
                  <View style={styles.duaHeader}>
                    <View style={styles.duaTitleContainer}>
                      {dua.type === 'text' && <Type size={24} color={colors.accent} />}
                      {dua.type === 'image' && <ImageIcon size={24} color={colors.accent} />}
                      {dua.type === 'video' && <Video size={24} color={colors.accent} />}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.duaTitle, { color: colors.text }]} numberOfLines={1}>
                          {i18n.language === 'bn' ? (dua.titleBn || dua.titleEn || dua.title) : (dua.titleEn || dua.titleBn || dua.title)}
                        </Text>
                        <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.textSecondary }}>
                          {dua.type === 'image' ? t('dua.attachmentImage') : dua.type === 'video' ? t('dua.attachmentVideo') : t('dua.attachmentText')}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}

            {filteredDuas.length === 0 && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Fonts.outfit }}>
                {t('dua.noMyDuas', { defaultValue: 'No custom duas added.' })}
              </Text>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingTop: 0 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerRelink: {},
  bannerText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    lineHeight: 18,
  },
  bannerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexShrink: 0,
  },
  bannerBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.outfit,
    fontSize: 16,
    padding: 0,
  },
  list: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  duaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  duaTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  duaTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});
