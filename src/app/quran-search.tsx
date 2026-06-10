import ThemeCard from '@/components/ThemeCard';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import { fetchOnce } from '@/utils/fetchWithCache';
import { storage } from '@/store/mmkv';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
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

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Surah {
  id: number;
  name: string;
  nameAr: string;
  verses: number;
  type: string;
}

export default function QuranSearchScreen() {

  const colors = useThemeColors();
  const isDark = colors.background === '#0c1618';
  const activeQuranColor = isDark ? colors.accent : colors.highlight;
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [surahs, setSurahs] = useState<Surah[]>(() => {
    const cached = storage.getString('quran_surahs_list');
    return cached ? JSON.parse(cached) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const searchWidth = useSharedValue(40); // Starts small like an icon

  useEffect(() => {
    // Expand search bar on mount
    searchWidth.value = withTiming(width - Spacing.four * 2 - 40, { duration: 150 });
    
    // Auto focus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    fetchOnce({
      key: 'quran_surahs_list',
      onStart: () => {
      },
      fetcher: async () => {
        const res = await fetch('https://api.alquran.cloud/v1/surah');
        const json = await res.json();
        return json.data.map((item: any) => ({
          id: item.number,
          name: item.englishName,
          nameAr: item.name,
          verses: item.numberOfAyahs,
          type: item.revelationType,
        }));
      },
      onData: (data) => {
        if (data) {
          setSurahs(data);
        }
      },
      onError: (err) => {
        console.error("Error fetching surahs:", err);
      }
    });
  }, []);

  const animatedSearchStyle = useAnimatedStyle(() => {
    return {
      width: searchWidth.value,
    };
  });

  const handleBack = () => {
    router.back();
  };

  const filteredSurahs = surahs.filter(s => {
    if (!searchQuery) return false; // Only show results if there's a query
    const q = searchQuery.toLowerCase();
    const translatedName = t('surahNames.' + s.id, { defaultValue: s.name }).toLowerCase();
    return (
      s.name.toLowerCase().includes(q) || 
      s.nameAr.toLowerCase().includes(q) || 
      translatedName.includes(q) ||
      String(s.id).includes(q)
    );
  });

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
              placeholder={t('quran.searchPlaceholder', { defaultValue: 'Search Surah Name...' })}
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
          
          <View style={styles.listContainer}>
              {searchQuery.length > 0 && filteredSurahs.length === 0 ? (
                 <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                   {t('search.noMatchingQuran', { query: searchQuery })}
                 </Text>
              ) : (
                filteredSurahs.map((surah) => (
                  <Animated.View entering={FadeIn.duration(300)} key={surah.id}>
                    <ThemeCard intensity={30}  style={[styles.surahRowWrapper, { borderColor: colors.border }]}>
                      <TouchableOpacity activeOpacity={1} 
                        style={styles.surahRow}
                        onPress={() => router.push(`/surah/${surah.id}`)}
                      >
                        <View style={styles.surahLeft}>
                          <View style={[styles.numberBox, { borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.numberText, { color: colors.textSecondary }]}>{formatNumber(surah.id, i18n.language)}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.surahNameEn, { color: colors.text }]}>{t('surahNames.' + surah.id, { defaultValue: surah.name })}</Text>
                            <Text style={[styles.surahMeta, { color: colors.textSecondary }]}>
                              {t('quran.' + surah.type, { defaultValue: surah.type })} • {t('surah.verses', { count: formatNumber(surah.verses, i18n.language) })}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={[styles.surahNameAr, { color: activeQuranColor }]}>{surah.nameAr}</Text>
                      </TouchableOpacity>
                    </ThemeCard>
                  </Animated.View>
                ))
              )}
            </View>
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
    padding: Spacing.four
  },
  listContainer: {
    gap: Spacing.three,
  },
  emptyText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  surahRowWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  surahRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  numberBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: Fonts.outfit,
    fontSize: 11,
  },
  surahNameEn: {
    fontFamily: Fonts.outfit,
    fontSize: 15,
    marginBottom: 2,
  },
  surahMeta: {
    fontFamily: Fonts.outfit,
    fontSize: 12,
  },
  surahNameAr: {
    fontFamily: Fonts.arabic,
    fontSize: 20,
    marginLeft: Spacing.two,
  },
});
