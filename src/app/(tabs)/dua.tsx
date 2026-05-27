import DuaCard from '@/components/dua-card';
import PageHeader from '@/components/page-header';
import PinSheet from '@/components/pin-sheet';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import duasBn from '@/data/duas_bn.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ChevronRight, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TextInput, GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import SkeletonBox from '@/components/SkeletonBox';

interface Category {
  id: string;
  name: string;
  description: string;
  count: number;
}

const PIN_STORAGE_KEY = 'imansync_dua_pins';

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
  const [allDuas, setAllDuas] = useState<any[]>([]);
  const [fetchingAll, setFetchingAll] = useState(false);

  // Pin Sheet State
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

    // Fetch categories
    fetch('https://ummahapi.com/api/duas/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.categories) {
          setCategories(data.data.categories);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0 && allDuas.length === 0 && !fetchingAll) {
      setFetchingAll(true);
      fetch('https://ummahapi.com/api/duas')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.duas) {
            setAllDuas(data.data.duas);
          }
        })
        .catch(err => console.error("Error fetching all duas:", err))
        .finally(() => setFetchingAll(false));
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
      params: { id: cat.id, name: getCategoryName(cat) }
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
  const filteredDuas = allDuas.filter(dua => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    
    let bnTranslation = '';
    let bnTransliteration = '';
    const bnData = (duasBn as any)[dua.id.toString()];
    if (bnData) {
      bnTranslation = bnData.translation || '';
      bnTransliteration = bnData.transliteration || '';
    }

    return (
      (dua.translation && dua.translation.toLowerCase().includes(q)) ||
      (bnTranslation && bnTranslation.toLowerCase().includes(q)) ||
      (dua.latin && dua.latin.toLowerCase().includes(q)) ||
      (bnTransliteration && bnTransliteration.toLowerCase().includes(q)) ||
      (dua.arabic && dua.arabic.includes(q))
    );
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.titleEn')} titleAr={t('dua.titleAr')} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

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
              let translation = dua.translation;
              let bnTransliteration = '';
              const bnData = (duasBn as any)[dua.id.toString()];
              if (i18n.language === 'bn' && bnData && bnData.translation) {
                translation = bnData.translation;
              }

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
                          latin: dua.latin,
                          translationEn: dua.translation,
                          translationBn: bnData?.translation || '',
                          transliterationBn: bnData?.transliteration || '',
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
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: Spacing.three }]}>{t('dua.pinned')}</Text>
                <View style={{ height: 110 }}>
                  <DraggableFlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={pinnedCategories}
                    onDragEnd={({ data }) => {
                      const newIds = data.map(c => c.id);
                      setPinnedIds(newIds);
                      AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(newIds));
                    }}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.pinnedScroll}
                    renderItem={({ item, drag, isActive }) => (
                      <ScaleDecorator>
                        <TouchableOpacity
                          onLongPress={drag}
                          disabled={isActive}
                          activeOpacity={1}
                          style={{ width: 160, opacity: isActive ? 0.7 : 1 }}
                        >
                          <DuaCard
                            id={item.id}
                            name={getCategoryName(item)}
                            description={getCategoryDesc(item)}
                            count={item.count}
                            isPinned={true}
                            colors={colors}
                            onPress={() => handleCategoryPress(item)}
                            onLongPress={drag}
                          />
                        </TouchableOpacity>
                      </ScaleDecorator>
                    )}
                  />
                </View>
              </View>
            )}

        {/* Main Grid Section */}
        <View style={[styles.section, { paddingHorizontal: Spacing.four }]}>

          
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
      <View style={{ height: 100 }} />
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
    </GestureHandlerRootView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.four * 2 - Spacing.three) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingTop: 0,
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
