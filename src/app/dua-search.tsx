import { Fonts, Spacing, useThemeColors } from '@/constants/theme';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { loadMyDuas } from '@/utils/my-duas-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import curatedDuasData from '@/data/curated-duas.json';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ActivityIndicator, 
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
  const [fetchingAll, setFetchingAll] = useState(false);
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
      const delayDebounceFn = setTimeout(async () => {
        setFetchingAll(true);
        try {
          const q = searchQuery.toLowerCase();
          let results: UnifiedDuaItem[] = [];

          if (categoryId === 'bookmarks') {
            const val = await AsyncStorage.getItem('imansync_dua_bookmarks');
            if (val) {
              const bms = JSON.parse(val);
              results = bms.filter((dua: any) => {
                const titleEn = (dua.translationEn || '').toLowerCase();
                const titleBn = (dua.translationBn || '').toLowerCase();
                const arabic = (dua.arabic || '').toLowerCase();
                return titleEn.includes(q) || titleBn.includes(q) || arabic.includes(q);
              });
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
              (dua.arabic || '').toLowerCase().includes(q)
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
              (dua.arabic || '').toLowerCase().includes(q)
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
              (dua.arabic || '').toLowerCase().includes(q)
            );
          } else if (categoryId) {
            const apiDuas = await DuaService.getDuasByCategory(Number(categoryId));
            results = apiDuas.filter(dua => 
              (dua.name || '').toLowerCase().includes(q) ||
              (dua.translationEn || '').toLowerCase().includes(q) ||
              (dua.translationBn || '').toLowerCase().includes(q) ||
              (dua.arabic || '').toLowerCase().includes(q)
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
              (dua.arabic || '').toLowerCase().includes(q)
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
          setFetchingAll(false);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity activeOpacity={1} onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={
              categoryId === 'my_duas' ? t('duaSettings.searchMyDuas', { defaultValue: 'Search My Duas' }) :
              categoryId === 'bookmarks' ? t('duaSettings.searchBookmarks', { defaultValue: 'Search Bookmarks' }) :
              categoryName ? t('duaSettings.searchCategory', { defaultValue: `Search in ${categoryName}` }) :
              t('duaSettings.searchPlaceholder', { defaultValue: 'Search Duas' })
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
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          
          <View style={styles.list}>
            {fetchingAll ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
            ) : searchResults.map(dua => {
              let translation = i18n.language === 'bn' ? dua.translationBn : dua.translationEn;
              if (!translation) translation = dua.name;

              return (
                <View key={dua.id}>
                  <View style={[styles.itemWrapper, { borderColor: colors.border, backgroundColor: colors.glassTint === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
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
                  </View>
                </View>
              );
            })}
            {searchQuery.length > 0 && searchResults.length === 0 && !fetchingAll && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('search.noMatchingDuas', { query: searchQuery })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    height: 51,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.four,
  },
  backBtn: {
    marginRight: Spacing.three,
  },
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
      },
  list: {
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
