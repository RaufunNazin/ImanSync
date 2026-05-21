import DuaCard from '@/components/dua-card';
import PageHeader from '@/components/page-header';
import PinSheet from '@/components/pin-sheet';
import { BottomTabInset, Colors, Fonts, Spacing } from '@/constants/theme';
import duasBn from '@/data/duas_bn.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ChevronRight, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Category {
  id: string;
  name: string;
  description: string;
  count: number;
}

const PIN_STORAGE_KEY = 'deen_dua_pins';

export default function DuaScreen() {
  const scheme = useColorScheme();
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
      if (val) setPinnedIds(JSON.parse(val));
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

  const pinnedCategories = categories.filter(c => pinnedIds.includes(c.id));
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
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dua.pinned')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedScroll}>
              {pinnedCategories.map(cat => (
                <View key={cat.id} style={{ width: 160 }}>
                  <DuaCard
                    id={cat.id}
                    name={getCategoryName(cat)}
                    description={getCategoryDesc(cat)}
                    count={cat.count}
                    isPinned={true}
                    colors={colors}
                    onPress={() => handleCategoryPress(cat)}
                    onLongPress={() => openPinSheet(cat)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Grid Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dua.categories')}</Text>
          
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
              <ActivityIndicator size="large" color={colors.accent} style={{ alignSelf: 'center', margin: 40 }} />
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

        <View style={{ height: BottomTabInset + Spacing.six }} />
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
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.four * 2 - Spacing.three) / 2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    paddingTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 22,
    marginVertical: Spacing.three,
  },
  pinnedScroll: {
    gap: Spacing.three,
  },
  grid: {
    flexDirection: 'column',
    gap: Spacing.three,
  },
  gridItem: {
    width: '100%',
  },
  list: {
    gap: Spacing.three,
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
