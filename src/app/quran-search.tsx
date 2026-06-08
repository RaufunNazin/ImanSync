import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import { formatNumber } from '@/utils/formatNumber';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
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
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle,
  useSharedValue,
  withTiming
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
  const scheme = useThemeStore((s) => s.theme);
  const colors = useThemeColors();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
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

    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          const formatted = json.data.map((item: any) => ({
            id: item.number,
            name: item.englishName,
            nameAr: item.name,
            verses: item.numberOfAyahs,
            type: item.revelationType,
          }));
          setSurahs(formatted);
        }
      })
      .catch(err => console.error("Error fetching surahs:", err))
      .finally(() => setLoading(false));
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
    return (
      s.name.toLowerCase().includes(q) || 
      s.nameAr.toLowerCase().includes(q) || 
      String(s.id).includes(q)
    );
  });

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
            placeholder={t('quran.searchPlaceholder', { defaultValue: 'Search Surah' })}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
          
          {loading && searchQuery.length > 0 ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.listContainer}>
              {searchQuery.length > 0 && filteredSurahs.length === 0 ? (
                 <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                   No results found for "{searchQuery}"
                 </Text>
              ) : (
                filteredSurahs.map((surah) => (
                  <Animated.View entering={FadeIn.duration(300)} key={surah.id}>
                    <BlurView intensity={30} tint={colors.glassTint as any} style={[styles.surahRowWrapper, { borderColor: colors.border }]}>
                      <TouchableOpacity 
                        style={styles.surahRow} 
                        activeOpacity={0.7}
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
                        
                        <Text style={[styles.surahNameAr, { color: scheme === 'dark' ? colors.accent : colors.highlight }]}>{surah.nameAr}</Text>
                      </TouchableOpacity>
                    </BlurView>
                  </Animated.View>
                ))
              )}
            </View>
          )}

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
    padding: Spacing.four,
    paddingTop: 0
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
