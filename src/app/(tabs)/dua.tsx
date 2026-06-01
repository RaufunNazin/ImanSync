import DuaCard from '@/components/dua-card';
import PageHeader from '@/components/page-header';
import PinSheet from '@/components/pin-sheet';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ChevronRight, FolderLock, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DuaService, { UnifiedDuaItem } from '@/services/duaService';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddDuaModal from '@/components/add-dua-modal';
import { loadMyDuas, saveMyDuas, saveMediaFile, UserDua } from '@/utils/my-duas-storage';
import { Plus } from 'lucide-react-native';

import { TextInput, GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import SkeletonBox from '@/components/SkeletonBox';
import { getStorageMode, loadCustomCategories } from '@/utils/my-duas-storage';

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
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedDuaItem[]>([]);
  const [fetchingAll, setFetchingAll] = useState(false);

  // Pin Sheet State
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Permanent storage suggestion banner
  const [showSuggestBanner, setShowSuggestBanner] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);


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

    // Check storage mode for banner
    Promise.all([getStorageMode(), AsyncStorage.getItem(BANNER_DISMISSED_KEY)]).then(([mode, dismissed]) => {
      if (mode === 'internal' && dismissed !== 'true') setShowSuggestBanner(true);
    });

    // Fetch categories
    Promise.all([
      DuaService.getCategories(),
      loadCustomCategories(),
      loadMyDuas()
    ])
    .then(([apiCats, customCats, userDuas]) => {
      let cats: Category[] = [];
      if (apiCats && apiCats.length > 0) {
        cats = apiCats.map(c => ({
          id: c.id.toString(),
          name: c.name,
          description: '', // Desc can be added later or pulled from i18n
          count: c.dua_count
        }));
      }
      if (customCats && customCats.length > 0) {
        const formattedCustoms = customCats.map(c => ({
          id: c.id,
          name: c.name,
          description: t('dua.customCategoryDesc', { defaultValue: 'My Custom Category' }),
          count: userDuas.filter(d => d.categoryId === c.id).length,
          isCustom: true
        }));
        cats = [...cats, ...formattedCustoms];
      }
      setCategories(cats);
    })
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        setFetchingAll(true);
        DuaService.searchHybrid(searchQuery)
          .then(results => setSearchResults(results))
          .catch(err => console.error("Error searching duas:", err))
          .finally(() => setFetchingAll(false));
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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

  // Filter global duas
  const filteredDuas = searchResults;


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
      // Optional: Navigate to My Duas or show a toast
    } catch (e) {
      console.error('Failed to add dua', e);
    }
  };

  const dismissSuggestBanner = async () => {
    setShowSuggestBanner(false);
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.titleEn')} titleAr={t('dua.titleAr')} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">

        {/* Permanent Storage Suggestion Banner */}
        {showSuggestBanner && (
          <TouchableOpacity 
            style={[styles.banner, { borderColor: colors.highlight + '60', backgroundColor: colors.highlight + '15' }]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/settings', params: { highlight: 'storage' } })}
          >
            <FolderLock size={18} color={colors.highlight} style={{ flexShrink: 0 }} />
            <Text style={[styles.bannerText, { color: colors.text, flex: 1 }]}>
              {t('dua.suggestPermanentStorage')}
            </Text>
            <TouchableOpacity onPress={dismissSuggestBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Global Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('duaSettings.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery.length > 0 ? (
          <View style={styles.list}>
            {fetchingAll ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
            ) : filteredDuas.map(dua => {
              let translation = i18n.language === 'bn' ? dua.translationBn : dua.translationEn;
              if (!translation) translation = dua.name;

              return (
                <View key={dua.id} style={[styles.itemWrapper, { borderColor: colors.border, backgroundColor: colors.glassTint === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                  <TouchableOpacity
                    style={styles.item}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: '/dua-detail',
                        params: { 
                          id: dua.id,
                          categoryName: t('duaSettings.searchPlaceholder'), // Or generic title
                          arabic: dua.arabic,
                          latin: dua.latin || '',
                          translationEn: dua.translationEn,
                          translationBn: dua.translationBn,
                          transliterationBn: '',
                          source: dua.source || '',
                        }
                      });
                    }}
                  >
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={3}>
                        {translation}
                      </Text>
                      {dua.arabic && (
                        <Text style={[styles.itemArabic, { color: colors.textSecondary }]} numberOfLines={2}>
                          {dua.arabic}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {filteredDuas.length === 0 && !fetchingAll && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Fonts.outfit }}>
                No matching duas found.
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedCategories.length > 0 && (
              <View style={[styles.section, { paddingLeft: Spacing.four }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginVertical: Spacing.one }]}>{t('dua.pinned')}</Text>
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.pinnedScroll}
                  >
                    {pinnedCategories.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
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
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

        {/* Main Grid Section */}
        <View style={[styles.section, { padding: Spacing.four }]}>

          
          <View style={styles.grid}>
            {/* My Duas Tile - Always First */}
            <View style={styles.gridItem}>
              <DuaCard
                id="my_duas"
                name={t('dua.myDuas')}
                description={t('dua.myDuasDesc')}
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
                colors={colors}
                onPress={handleBookmarksPress}
              />
            </View>

            {loading ? (
              [...Array(4)].map((_, i) => (
                <View key={i} style={[styles.gridItem]}>
                  <View style={[{ height: 90, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundElement, padding: 16, justifyContent: 'space-between' }]}>
                    <SkeletonBox width={110} height={16} borderRadius={8} color={colors.border} />
                    <SkeletonBox width={70} height={11} borderRadius={5} color={colors.border} />
                  </View>
                </View>
              ))
            ) : (
              unpinnedCategories.map(cat => (
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
              ))
            )}
          </View>
        </View>
        </>
      )}
      </ScrollView>

      {/* Pin Action Sheet */}
      {selectedCategory && (
        <PinSheet
          visible={pinSheetVisible}
          categoryName={getCategoryName(selectedCategory)}
          isPinned={pinnedIds.includes(selectedCategory.id)}
          onClose={() => setPinSheetVisible(false)}
          onTogglePin={togglePin}
          colors={colors}
        />
      )}
      </SafeAreaView>
    
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <AddDuaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddDua}
        colors={colors}
      />

    </GestureHandlerRootView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.four * 2 - Spacing.three) / 2;

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
    paddingTop: 0,
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
  },
  sectionTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.6,
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
