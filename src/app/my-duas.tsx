import ThemeCard from '@/components/ThemeCard';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { Search, FolderLock, X, AlertTriangle } from 'lucide-react-native';
import {
  loadMyDuas, saveMyDuas, saveMediaFile, UserDua,
  getStorageMode, clearRelinkFlag, initPermanentStorage, migrateDuas, getStorageUri,
} from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddDuaModal from '@/components/add-dua-modal';
import SkeletonBox from '@/components/SkeletonBox';
import { ChevronRight, Image as ImageIcon, Video, Type, Bookmark, Plus, FolderOpen } from 'lucide-react-native';
import PinSheet from '@/components/pin-sheet';

const BANNER_DISMISSED_KEY = 'imansync_storage_banner_dismissed';
const RELINK_NEEDED_KEY    = 'imansync_storage_relink';
const PINNED_DUAS_KEY      = 'imansync_pinned_duas';

export default function MyDuasScreen() {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<UserDua[]>([]);
  const [loading, setLoading] = useState(true);

  // Banner states
  const [showSuggestBanner, setShowSuggestBanner] = useState(false);
  const [showRelinkBanner, setShowRelinkBanner] = useState(false);
  const [relinkLoading, setRelinkLoading] = useState(false);

  const [pinnedDuaIds, setPinnedDuaIds] = useState<string[]>([]);
  const [selectedDua, setSelectedDua] = useState<UserDua | null>(null);
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScrollY = Animated.diffClamp(scrollY, 0, 100);
  const fabTranslateY = clampedScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  const handleAddDua = async (duaData: Omit<UserDua, 'id' | 'createdAt'>) => {
    try {
      let finalMediaUri = duaData.mediaUri;
      if (duaData.mediaUri && duaData.type !== 'text') {
        finalMediaUri = await saveMediaFile(duaData.mediaUri, duaData.mediaUri);
      }
      const newDua: UserDua = {
        ...duaData,
        id: Math.random().toString(36).substring(7),
        createdAt: Date.now(),
        mediaUri: finalMediaUri,
      };
      const allDuas = await loadMyDuas();
      const updated = [newDua, ...allDuas];
      await saveMyDuas(updated);
      loadScreen();
    } catch (e) {
      console.error('Failed to add dua', e);
    }
  };

  useEffect(() => {
    loadScreen();
  }, []);

  const loadScreen = async () => {
    try {
      const [loadedDuas, mode, relinkFlag, bannerDismissed, pinnedVal] = await Promise.all([
        loadMyDuas(),
        getStorageMode(),
        AsyncStorage.getItem(RELINK_NEEDED_KEY),
        AsyncStorage.getItem(BANNER_DISMISSED_KEY),
        AsyncStorage.getItem(PINNED_DUAS_KEY),
      ]);
      setDuas(loadedDuas.sort((a, b) => b.createdAt - a.createdAt));
      setShowRelinkBanner(relinkFlag === 'true');
      setShowSuggestBanner(mode === 'internal' && bannerDismissed !== 'true');
      if (pinnedVal) {
        try { setPinnedDuaIds(JSON.parse(pinnedVal)); } catch (e) { console.error(e); }
      }
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





  const uncategorizedDuas = duas.filter(d => !d.categoryId);


  const renderHeader = () => (
    <View>
      {/* ── Relink Banner ─────────────────────────────────────────────── */}

        {showRelinkBanner && (
          <View style={[styles.banner, styles.bannerRelink, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
            <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
            <Text style={[styles.bannerText, { color: '#B91C1C', flex: 1 }]}>
              {t('dua.relinkStorage')}
            </Text>
            <TouchableOpacity activeOpacity={1}
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
            <TouchableOpacity activeOpacity={1} onPress={dismissSuggestBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

    </View>
  );

  const sortedDuas = [...uncategorizedDuas].sort((a, b) => {
    const aPinned = pinnedDuaIds.includes(a.id.toString()) ? 1 : 0;
    const bPinned = pinnedDuaIds.includes(b.id.toString()) ? 1 : 0;
    return bPinned - aPinned;
  });

  const renderItem = ({ item: dua }: { item: UserDua }) => (
    <TouchableOpacity activeOpacity={1}
      onLongPress={() => {
        setSelectedDua(dua);
        setPinSheetVisible(true);
      }}
      onPress={() => router.push(`/my-dua-detail/${dua.id}` as any)}
    >
      <ThemeCard
        intensity={40}
        
        style={[styles.duaCard, { borderColor: colors.border }]}
      >
        <View style={styles.duaHeader}>
          <View style={styles.duaTitleContainer}>
            {dua.type === 'text' && <Type size={24} color={colors.accent} />}
            {dua.type === 'image' && <ImageIcon size={24} color={colors.accent} />}
            {dua.type === 'video' && <Video size={24} color={colors.accent} />}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {pinnedDuaIds.includes(dua.id.toString()) && (
                  <Bookmark size={14} color={colors.accent} fill={colors.accent} />
                )}
                <Text style={[styles.duaTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {i18n.language === 'bn' ? (dua.titleBn || dua.titleEn || dua.title) : (dua.titleEn || dua.titleBn || dua.title)}
                </Text>
              </View>
              <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.textSecondary }}>
                {dua.type === 'image' ? t('dua.attachmentImage') : dua.type === 'video' ? t('dua.attachmentVideo') : t('dua.attachmentText')}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </View>
      </ThemeCard>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={{ alignItems: 'center', marginTop: 80 }}>
        <FolderOpen size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', fontFamily: Fonts.outfit, fontSize: 16, marginBottom: 24 }}>
          {t('dua.noMyDuas', { defaultValue: 'No custom duas added.' })}
        </Text>
        <TouchableOpacity activeOpacity={1}
          style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontFamily: Fonts.outfit, fontSize: 16, fontWeight: '500' }}>
            {t('dua.addDua', { defaultValue: 'Add Dua' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('dua.myDuas')} 
        titleAr="" 
        showBack 
        rightElement={
          <TouchableOpacity activeOpacity={1} onPress={() => router.push('/dua-search?categoryId=my_duas' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Search size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />
      {loading ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <View style={[styles.list, { gap: Spacing.three, padding: Spacing.four }]}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.duaCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={styles.duaHeader}>
                  <View style={styles.duaTitleContainer}>
                    <SkeletonBox width={24} height={24} borderRadius={4} color={colors.border} />
                    <View style={{ flex: 1 }}>
                      <SkeletonBox width={'70%' as any} height={16} borderRadius={6} color={colors.border} style={{ marginBottom: 4 }} />
                      <SkeletonBox width={'40%' as any} height={13} borderRadius={4} color={colors.border} />
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.border} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Animated.FlatList
          data={sortedDuas}
          keyExtractor={(item: any) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.container}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 100 }} />}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}


      {selectedDua && (
        <PinSheet
          visible={pinSheetVisible}
          title={i18n.language === 'bn' ? (selectedDua.titleBn || selectedDua.titleEn || selectedDua.title || 'Dua') : (selectedDua.titleEn || selectedDua.titleBn || selectedDua.title || 'Dua')}
          isPinned={pinnedDuaIds.includes(selectedDua.id.toString())}
          onClose={() => setPinSheetVisible(false)}
          onTogglePin={async () => {
            const idStr = selectedDua.id.toString();
            let updated;
            if (pinnedDuaIds.includes(idStr)) {
              updated = pinnedDuaIds.filter(id => id !== idStr);
            } else {
              updated = [...pinnedDuaIds, idStr];
            }
            setPinnedDuaIds(updated);
            await AsyncStorage.setItem(PINNED_DUAS_KEY, JSON.stringify(updated));
          }}
          colors={colors}
          isUserCreated={true}
          isDua={true}
          onDelete={async () => {
            const allDuas = await loadMyDuas();
            const updated = allDuas.filter(d => d.id !== selectedDua.id);
            await saveMyDuas(updated);
            loadScreen();
          }}
        />
      )}

      <Animated.View style={[styles.fab, { transform: [{ translateY: fabTranslateY }] }]}>
        <TouchableOpacity activeOpacity={1}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }]}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      <AddDuaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddDua}
        colors={colors}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: Spacing.four },
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
    margin: 0,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
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
