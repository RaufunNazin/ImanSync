import { Fonts, Spacing, useThemeColors } from '@/constants/theme';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronRight, X } from 'lucide-react-native';
import { loadMyDuas } from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import curatedDuasData from '@/data/curated-duas.json';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import ThemeCard from '@/components/ThemeCard';
import { 

  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DuaService, { UnifiedDuaItem } from '@/services/duaService';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DuaSearchScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { categoryId, isCustom, categoryName } = useLocalSearchParams<{ categoryId?: string, isCustom?: string, categoryName?: string }>();
  const { t, i18n } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedDuaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const searchWidth = useSharedValue(40); // Starts small like an icon

  useEffect(() => {
    // Expand search bar on mount
    searchWidth.value = withTiming(width - Spacing.four * 2 - 40, { duration: 150 });
    
    // Auto focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(async () => {
        try {
          const q = searchQuery.toLowerCase();
          let results: UnifiedDuaItem[] = [];

          if (categoryId === 'bookmarks') {
            const val = await AsyncStorage.getItem('imansync_dua_bookmarks');
            if (val) {
              const bms = JSON.parse(val);
              const resultsFiltered = bms.filter((dua: any) => {
                const titleEn = (dua.translationEn || '').toLowerCase();
                const titleBn = (dua.translationBn || '').toLowerCase();
                const arabic = (dua.arabic || '').toLowerCase();
                const latin = (dua.latin || '').toLowerCase();
                const transliterationBn = (dua.transliterationBn || '').toLowerCase();
                const name = (dua.name || '').toLowerCase();
                return titleEn.includes(q) || titleBn.includes(q) || arabic.includes(q) || latin.includes(q) || transliterationBn.includes(q) || name.includes(q);
              });
              results = resultsFiltered;
            }
          } else if (categoryId === 'my_duas') {
            const allDuas = await loadMyDuas();
            const uncategorized = allDuas.filter(d => !d.categoryId);
            const mapped: UnifiedDuaItem[] = uncategorized.map(d => ({
              id: d.id,
              name: d.titleBn || d.titleEn || d.title || '',
              arabic: d.arabic || '',
              latin: d.transliterationEn || d.transliteration || '',
              translationEn: d.translationEn || d.translation || '',
              translationBn: d.translationBn || d.translation || '',
              transliterationBn: d.transliterationBn || '',
              reference: '',
              source: 'user',
              isCustom: true,
            }));
            results = mapped.filter(dua => 
              (dua.name || '').toLowerCase().includes(q) ||
              (dua.translationEn || '').toLowerCase().includes(q) ||
              (dua.translationBn || '').toLowerCase().includes(q) ||
              (dua.arabic || '').toLowerCase().includes(q) ||
              (dua.latin || '').toLowerCase().includes(q) ||
              (dua.transliterationBn || '').toLowerCase().includes(q)
            );
          } else if (isCustom === 'true' && categoryId?.startsWith('curated_cat_')) {
            const catKey = categoryId.replace('curated_cat_', '');
            const catData = (curatedDuasData as any[]).find(c => c.id === catKey);
            const duaList = catData ? catData.duas : [];
            const formatted: UnifiedDuaItem[] = duaList.map((d: any) => ({
              id: d.id,
              name: i18n.language === 'bn' ? (d.title_bn || d.title) : (d.title || 'Curated Dua'),
              arabic: d.arabic || '',
              latin: d.transliteration_en || '',
              translationEn: d.translation_en || '',
              translationBn: d.translation_bn || '',
              reference: d.reference || '',
              source: 'user',
              isCustom: true,
            }));
            results = formatted.filter(dua => 
              (dua.name || '').toLowerCase().includes(q) ||
              (dua.translationEn || '').toLowerCase().includes(q) ||
              (dua.translationBn || '').toLowerCase().includes(q) ||
              (dua.arabic || '').toLowerCase().includes(q) ||
              (dua.latin || '').toLowerCase().includes(q) ||
              (dua.transliterationBn || '').toLowerCase().includes(q)
            );
          } else if (isCustom === 'true') {
            const allDuas = await loadMyDuas();
            const categoryDuas = allDuas.filter(d => d.categoryId === categoryId);
            const mapped: UnifiedDuaItem[] = categoryDuas.map(d => ({
              id: d.id,
              name: d.titleBn || d.titleEn || d.title || '',
              arabic: d.arabic || '',
              latin: d.transliterationEn || d.transliteration || '',
              translationEn: d.translationEn || d.translation || '',
              translationBn: d.translationBn || d.translation || '',
              transliterationBn: d.transliterationBn || '',
              reference: '',
              source: 'user',
              isCustom: true,
            }));
            results = mapped.filter(dua => 
              (dua.name || '').toLowerCase().includes(q) ||
              (dua.translationEn || '').toLowerCase().includes(q) ||
              (dua.translationBn || '').toLowerCase().includes(q) ||
              (dua.arabic || '').toLowerCase().includes(q) ||
              (dua.latin || '').toLowerCase().includes(q) ||
              (dua.transliterationBn || '').toLowerCase().includes(q)
            );
          } else if (categoryId) {
            const apiDuas = await DuaService.getDuasByCategory(Number(categoryId));
            results = apiDuas.filter(dua => 
              (dua.name || '').toLowerCase().includes(q) ||
              (dua.translationEn || '').toLowerCase().includes(q) ||
              (dua.translationBn || '').toLowerCase().includes(q) ||
              (dua.arabic || '').toLowerCase().includes(q) ||
              (dua.latin || '').toLowerCase().includes(q) ||
              (dua.transliterationBn || '').toLowerCase().includes(q)
            );
          } else {
            const apiResults = await DuaService.searchHybrid(searchQuery);
            
            const allDuas = await loadMyDuas();
            const mappedCustom: UnifiedDuaItem[] = allDuas.map(d => ({
              id: d.id,
              name: d.titleBn || d.titleEn || d.title || '',
              arabic: d.arabic || '',
              latin: d.transliterationEn || d.transliteration || '',
              translationEn: d.translationEn || d.translation || '',
              translationBn: d.translationBn || d.translation || '',
              transliterationBn: d.transliterationBn || '',
              reference: '',
              source: 'user',
              isCustom: true,
            }));
            
            let bmsMapped: UnifiedDuaItem[] = [];
            const val = await AsyncStorage.getItem('imansync_dua_bookmarks');
            if (val) {
               try { bmsMapped = JSON.parse(val); } catch(e) {}
            }
            
            const customAndBms = [...mappedCustom, ...bmsMapped];
            const uniqueMap = new Map<string, UnifiedDuaItem>();
            customAndBms.forEach(item => uniqueMap.set(item.id.toString(), item));
            
            const localFiltered = Array.from(uniqueMap.values()).filter(dua => 
              (dua.name || '').toLowerCase().includes(q) ||
              (dua.translationEn || '').toLowerCase().includes(q) ||
              (dua.translationBn || '').toLowerCase().includes(q) ||
              (dua.arabic || '').toLowerCase().includes(q) ||
              (dua.latin || '').toLowerCase().includes(q) ||
              (dua.transliterationBn || '').toLowerCase().includes(q)
            );
            
            results = [...localFiltered, ...apiResults];
            const finalMap = new Map<string, UnifiedDuaItem>();
            results.forEach(item => finalMap.set(item.id.toString(), item));
            results = Array.from(finalMap.values());
          }

          setSearchResults(results);
        } catch (err) {
          console.error("Error searching duas:", err);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, categoryId, isCustom]);

  const animatedSearchStyle = useAnimatedStyle(() => {
    return {
      width: searchWidth.value,
    };
  });

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader
        showBack={true}
        onBack={handleBack}
        rightElement={
          <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={
                categoryId === 'my_duas' ? t('duaSettings.searchMyDuas', { defaultValue: 'Search My Duas...' }) :
                categoryId === 'bookmarks' ? t('duaSettings.searchBookmarks', { defaultValue: 'Search Bookmarks...' }) :
                categoryName ? t('duaSettings.searchInCategory', { defaultValue: `Search in ${categoryName}...`, categoryName }) :
                t('duaSettings.searchAllDuas', { defaultValue: 'Search all duas...' })
              }
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity activeOpacity={1} onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          
          <View style={styles.list}>
            {isSearching ? (
              [1, 2, 3].map((key) => (
                <ThemeCard key={key} intensity={40} style={[styles.itemWrapper, { borderColor: colors.border, opacity: 0.5 }]}>
                  <View style={styles.item}>
                    <View style={styles.itemContent}>
                      <View style={{ height: 16, backgroundColor: colors.textSecondary, borderRadius: 4, width: '70%', opacity: 0.3 }} />
                      <View style={{ height: 16, backgroundColor: colors.textSecondary, borderRadius: 4, width: '40%', opacity: 0.3, marginTop: 8 }} />
                      <View style={{ height: 24, backgroundColor: colors.textSecondary, borderRadius: 4, width: '80%', opacity: 0.3, marginTop: 12, alignSelf: 'flex-end' }} />
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                  </View>
                </ThemeCard>
              ))
            ) : (
              searchResults.map(dua => {
                let translation = i18n.language === 'bn' ? dua.translationBn : dua.translationEn;
                if (!translation) translation = dua.name;

                return (
                <View key={dua.id}>
                  <ThemeCard intensity={40} style={[styles.itemWrapper, { borderColor: colors.border }]}>
                    <TouchableOpacity activeOpacity={1}
                      style={styles.item}
                      onPress={() => {
                        router.push({
                          pathname: '/dua-detail',
                          params: { 
                            id: dua.id,
                            categoryName: t('duaSettings.searchPlaceholder', { defaultValue: 'Search Results' }),
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
                  </ThemeCard>
                </View>
              );
            })
            )}
            {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {categoryId ? t('search.noMatchingCategoryDuas', { query: searchQuery, categoryName: categoryName || '' }) : t('search.noMatchingAllDuas', { query: searchQuery })}
              </Text>
            )}
          </View>

          <View style={{ height: Spacing.six + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.outfit,
    fontSize: 16,
    padding: 0,
  },
  container: { 
    paddingVertical: Spacing.four,
  },
  list: {
    flexDirection: 'column',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  emptyText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  itemWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: {
    padding: Spacing.four,
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
