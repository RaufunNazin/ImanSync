import DuaCard from '@/components/dua-card';
import PageHeader from '@/components/page-header';
import PinSheet from '@/components/pin-sheet';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { FolderLock, Search, X, CheckCircle2, AlertCircle, Plus } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DuaService from '@/services/duaService';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Animated as RNAnimated, ScrollView } from 'react-native';
import AddDuaModal from '@/components/add-dua-modal';
import { loadMyDuas, saveMyDuas, saveMediaFile, UserDua } from '@/utils/my-duas-storage';


import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonBox from '@/components/SkeletonBox';
import ThemeCard from '@/components/ThemeCard';
import { getStorageMode, loadCustomCategories, saveCustomCategories } from '@/utils/my-duas-storage';
import { usePreferencesStore } from '@/store/preferencesStore';
import curatedDuasData from '@/data/curated-duas.json';

interface Category {
  id: string;
  name: string;
  description: string;
  count: number;
  isCustom?: boolean;
}

const PIN_STORAGE_KEY    = 'imansync_dua_pins';
const BANNER_DISMISSED_KEY = 'imansync_storage_banner_dismissed';

export default function DuaScreen() {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [myDuasCount, setMyDuasCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const prefs = usePreferencesStore();

  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const clampedScrollY = RNAnimated.diffClamp(scrollY, 0, 100);
  const fabTranslateY = clampedScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });


  // Pin Sheet State
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Permanent storage suggestion banner
  const [showSuggestBanner, setShowSuggestBanner] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };


  const loadScreenData = () => {
    Promise.all([
      DuaService.getCategories(),
      loadCustomCategories(),
      loadMyDuas(),
      AsyncStorage.getItem('imansync_dua_bookmarks')
    ])
    .then(([apiCats, customCats, userDuas, bookmarksStr]) => {
      const uncategorizedCount = userDuas.filter((d: any) => !d.categoryId).length;
      setMyDuasCount(uncategorizedCount);
      let bCount = 0;
      if (bookmarksStr) {
        try { bCount = JSON.parse(bookmarksStr).length; } catch (e) {}
      }
      setBookmarksCount(bCount);

      let cats: Category[] = [];

      if (customCats && customCats.length > 0) {
        const formattedCustoms = customCats.map(c => ({
          id: c.id,
          name: c.name,
          description: t('dua.customCategoryDesc', { defaultValue: 'My Custom Category' }),
          count: userDuas.filter(d => d.categoryId === c.id).length,
          isCustom: true,
          isUserCreated: true
        }));
        cats = [...cats, ...formattedCustoms];
      }

      if (prefs.showCuratedDuas) {
        const curatedCats = (curatedDuasData as any[]).map((cat) => {
          return {
            id: `curated_cat_${cat.id}`,
            name: i18n.language === 'bn' ? cat.category_bn : cat.category_en,
            description: t('dua.customCategoryDesc', { defaultValue: 'Curated Category' }),
            count: cat.duas.length,
            isCustom: true
          };
        });
        cats = [...cats, ...curatedCats];
      }

      if (apiCats && apiCats.length > 0) {
        const formattedApiCats = apiCats.map(c => ({
          id: c.id.toString(),
          name: c.name,
          description: '', // Desc can be added later or pulled from i18n
          count: c.dua_count
        }));
        cats = [...cats, ...formattedApiCats];
      }

      setCategories(cats);
    })
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load pins
    AsyncStorage.getItem(PIN_STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setPinnedIds(JSON.parse(val));
        } catch (e) {
          console.error('Failed to parse pinned duas', e);
          setPinnedIds([]);
        }
      }
    });
  }, []);

  const checkStorageState = async () => {
    try {
      const mode = await getStorageMode();
      const dismissed = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
      if (mode === 'internal' && dismissed !== 'true') {
        setShowSuggestBanner(true);
      }
    } catch (error) {
      console.log('Error checking storage state:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadScreenData();
      checkStorageState();
    }, [prefs.showCuratedDuas])
  );

  const togglePin = async () => {
    if (!selectedCategory) return;
    
    let updated;
    if (pinnedIds.includes(selectedCategory.id)) {
      updated = pinnedIds.filter(id => id !== selectedCategory.id);
    } else {
      updated = [...pinnedIds, selectedCategory.id];
      // Keep max 6 pins
      if (updated.length > 6) updated.shift();
    }
    
    setPinnedIds(updated);
    await AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(updated));
  };

  const openPinSheet = (cat: Category) => {
    setSelectedCategory(cat);
    setPinSheetVisible(true);
  };

  const handleCategoryPress = (cat: Category) => {
    router.push({
      pathname: '/dua-category',
      params: { id: cat.id, name: getCategoryName(cat), isCustom: cat.isCustom ? 'true' : 'false' }
    });
  };

  const handleMyDuasPress = () => {
    router.push('/my-duas');
  };

  const handleBookmarksPress = () => {
    router.push('/dua-bookmarks');
  };

  const getCategoryName = (cat: Category) => {
    const key = `dua.category_${cat.id}`;
    const translated = t(key);
    // fallback if translation key is missing
    return translated === key ? cat.name : translated;
  };

  const getCategoryDesc = (cat: Category) => {
    const key = `dua.categoryDesc_${cat.id}`;
    const translated = t(key);
    return translated === key ? cat.description : translated;
  };

  const pinnedCategories = pinnedIds
    .map(id => categories.find(c => c.id === id))
    .filter(Boolean) as Category[];
    
  const unpinnedCategories = categories.filter(c => !pinnedIds.includes(c.id));



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
      const duas = await loadMyDuas();
      const updated = [newDua, ...duas];
      await saveMyDuas(updated);
      loadScreenData(); // Reload categories to show the new count or newly created category
      showToast(t('dua.addSuccess'), 'success');
    } catch (e) {
      console.error('Failed to add dua', e);
      showToast(t('dua.addError'), 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // 1. Remove category from storage
      const customCats = await loadCustomCategories();
      const updatedCats = customCats.filter(c => c.id !== categoryId);
      await saveCustomCategories(updatedCats);

      // 2. Move associated Duas to "My Duas" (remove categoryId)
      const userDuas = await loadMyDuas();
      const updatedDuas = userDuas.map(d => {
        if (d.categoryId === categoryId) {
          const { categoryId: _, ...rest } = d; // Remove categoryId
          return rest as UserDua;
        }
        return d;
      });
      await saveMyDuas(updatedDuas);

      // 3. Remove from pinned if pinned
      if (pinnedIds.includes(categoryId)) {
        const newPins = pinnedIds.filter(id => id !== categoryId);
        setPinnedIds(newPins);
        await AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(newPins));
      }

      // 4. Reload screen
      loadScreenData();
      showToast(t('dua.categoryDeleted', { defaultValue: 'Category deleted' }), 'success');
    } catch (e) {
      console.error('Failed to delete category', e);
      showToast(t('dua.categoryDeleteError', { defaultValue: 'Failed to delete category' }), 'error');
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      const customCats = await loadCustomCategories();
      const updatedCats = customCats.map(c => 
        c.id === categoryId ? { ...c, name: newName } : c
      );
      await saveCustomCategories(updatedCats);
      loadScreenData();
      showToast(t('dua.categoryRenamed', { defaultValue: 'Category renamed' }), 'success');
    } catch (e) {
      console.error('Failed to rename category', e);
      showToast(t('dua.categoryRenameError', { defaultValue: 'Failed to rename category' }), 'error');
    }
  };

  const dismissSuggestBanner = async () => {
    setShowSuggestBanner(false);
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader 
          titleEn={t('dua.titleEn')} 
          rightElement={
            <TouchableOpacity activeOpacity={1} onPress={() => router.push('/dua-search' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Search size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          }
        />
      
      <RNAnimated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.container}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag" 
        keyboardShouldPersistTaps="handled"
      >

        {/* Permanent Storage Suggestion Banner */}
        {showSuggestBanner && (
          <TouchableOpacity activeOpacity={1} 
            style={[styles.banner, { borderColor: colors.textSecondary + '20', backgroundColor: colors.textSecondary + '10' }]}
            onPress={() => router.push({ pathname: '/settings', params: { highlight: 'storage' } })}
          >
            <FolderLock size={18} color={colors.textSecondary} style={{ flexShrink: 0 }} />
            <Text style={[styles.bannerText, { color: colors.text, flex: 1 }]}>
              {t('dua.suggestPermanentStorage')}
            </Text>
            <TouchableOpacity activeOpacity={1} onPress={dismissSuggestBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Main Content */}
        <View style={{ flex: 1 }}>
          {/* Pinned Section */}
            {(pinnedCategories.length > 0 || (loading && pinnedIds.length > 0)) && (
              <View style={[styles.section, { paddingLeft: Spacing.four }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginVertical: Spacing.one }]}>{t('dua.pinned')}</Text>
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pinnedScroll}
                  >
                    {loading ? (
                      pinnedIds.map((_, i) => (
                        <View key={`pin-skel-${i}`} style={{ width: 160 }}>
                          <ThemeCard style={{ minHeight: 70, borderRadius: 20, padding: Spacing.two, paddingVertical: Spacing.two, alignItems: 'center', justifyContent: 'center' }}>
                            <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 8 }}>
                              <SkeletonBox width={110} height={20} borderRadius={8} color={colors.border} loaded={false} />
                              <SkeletonBox width={70} height={16} borderRadius={6} color={colors.border} loaded={false} />
                            </View>
                          </ThemeCard>
                        </View>
                      ))
                    ) : (
                      pinnedCategories.map((item) => (
                        <TouchableOpacity activeOpacity={1}
                          key={item.id}
                          style={{ width: 160 }}
                          onPress={() => handleCategoryPress(item)}
                          onLongPress={() => {
                            setSelectedCategory(item);
                            setPinSheetVisible(true);
                          }}
                        >
                          <DuaCard
                            id={item.id.toString()}
                            name={getCategoryName(item)}
                            description={getCategoryDesc(item)}
                            count={item.count}
                            isPinned={true}
                            isCustom={item.isCustom}
                            colors={colors}
                            onPress={() => handleCategoryPress(item)}
                            onLongPress={() => {
                              setSelectedCategory(item);
                              setPinSheetVisible(true);
                            }}
                          />
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            )}

        {/* Main Grid Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.four }]}>
          <View style={styles.grid}>
            {loading ? (
              [...Array(20)].map((_, i) => (
                <View key={i} style={[styles.gridItem]}>
                  <ThemeCard style={{ minHeight: 70, borderRadius: 20, padding: Spacing.two, paddingVertical: Spacing.two, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 8 }}>
                      <SkeletonBox width={110} height={20} borderRadius={8} color={colors.border} loaded={false} />
                      <SkeletonBox width={70} height={16} borderRadius={6} color={colors.border} loaded={false} />
                    </View>
                  </ThemeCard>
                </View>
              ))
            ) : (
              <>
                {/* My Duas Tile - Always First */}
                <View style={styles.gridItem}>
                  <DuaCard
                    id="my_duas"
                    name={t('dua.myDuas')}
                    description={t('dua.myDuasDesc')}
                    count={myDuasCount}
                    isMyDuas={true}
                    colors={colors}
                    onPress={handleMyDuasPress}
                  />
                </View>

                {/* Bookmarks Tile - Always Second */}
                <View style={styles.gridItem}>
                  <DuaCard
                    id="bookmarks"
                    name={t('dua.bookmarks')}
                    description={t('dua.bookmarksDesc')}
                    count={bookmarksCount}
                    colors={colors}
                    onPress={handleBookmarksPress}
                  />
                </View>

                {unpinnedCategories.map(cat => (
                  <View key={cat.id} style={styles.gridItem}>
                    <DuaCard
                      id={cat.id}
                      name={getCategoryName(cat)}
                      description={getCategoryDesc(cat)}
                      count={cat.count}
                      isCustom={cat.isCustom}
                      colors={colors}
                      onPress={() => handleCategoryPress(cat)}
                      onLongPress={() => openPinSheet(cat)}
                    />
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
        </View>
      </RNAnimated.ScrollView>

        {/* Pin Action Sheet */}
        {selectedCategory && (
          <PinSheet
            visible={pinSheetVisible}
            title={getCategoryName(selectedCategory)}
            isPinned={pinnedIds.includes(selectedCategory.id)}
            onClose={() => setPinSheetVisible(false)}
            onTogglePin={togglePin}
            colors={colors}
            isUserCreated={(selectedCategory as any).isUserCreated}
            onDelete={() => handleDeleteCategory(selectedCategory.id)}
            showRename={(selectedCategory as any).isUserCreated}
            onRename={(newName) => handleRenameCategory(selectedCategory.id, newName)}
          />
        )}
      </SafeAreaView>
    
      <RNAnimated.View style={[styles.fab, { transform: [{ translateY: fabTranslateY }] }]}>
        <TouchableOpacity activeOpacity={1}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }]}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </RNAnimated.View>

      <AddDuaModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          loadScreenData();
        }}
        onSave={handleAddDua}
        colors={colors}
      />

      {toast && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOutDown.duration(300)}
          style={{
            position: 'absolute',
            bottom: 100,
            alignSelf: 'center',
            backgroundColor: toast.type === 'success' ? colors.highlight : '#EF4444',
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 24,
            zIndex: 100,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} color="#FFF" /> : <AlertCircle size={18} color="#FFF" />}
          <Text style={{ fontFamily: Fonts.outfit, fontSize: 14, color: '#FFF', fontWeight: '500' }}>
            {toast.message}
          </Text>
        </Animated.View>
      )}

    </GestureHandlerRootView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = Math.floor((width - Spacing.four * 2 - Spacing.three) / 2);

const styles = StyleSheet.create({

  fab: {
    position: 'absolute',
    bottom: Spacing.two + 20,
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  safeArea: {
    flex: 1,
  },
  container: {
    paddingVertical: Spacing.four,
  },
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
  bannerText: {
    fontFamily: Fonts.outfit,
    fontSize: 13,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.outfit,
    fontSize: 16,
    padding: 0,
  },
  section: {
    marginBottom: 0,
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
  pinnedScroll: {
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  gridItem: {
    width: cardWidth,
  },
  list: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  itemWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    padding: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  itemContent: {
    flex: 1,
    gap: Spacing.three,
  },
  itemTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
  },
  itemArabic: {
    fontFamily: Fonts.arabic,
    fontSize: 18,
    textAlign: 'right',
  },
});
