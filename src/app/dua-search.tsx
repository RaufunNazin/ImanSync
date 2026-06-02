import { Colors, Fonts, Spacing } from '@/constants/theme';

import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
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
import { useThemeStore } from '@/store/themeStore';
import DuaService, { UnifiedDuaItem } from '@/services/duaService';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DuaSearchScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
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
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        
        <Animated.View style={[styles.searchContainer, animatedSearchStyle]}>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('duaSettings.searchPlaceholder', { defaultValue: 'Search Duas' })}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </Animated.View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          
          <View style={styles.list}>
            {fetchingAll ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
            ) : searchResults.map(dua => {
              let translation = i18n.language === 'bn' ? dua.translationBn : dua.translationEn;
              if (!translation) translation = dua.name;

              return (
                <Animated.View entering={FadeIn.duration(300)} key={dua.id}>
                  <View style={[styles.itemWrapper, { borderColor: colors.border, backgroundColor: colors.glassTint === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                    <TouchableOpacity
                      style={styles.item}
                      activeOpacity={0.7}
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
                </Animated.View>
              );
            })}
            {searchQuery.length > 0 && searchResults.length === 0 && !fetchingAll && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No matching duas found for "{searchQuery}"
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
    paddingTop: 0
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
