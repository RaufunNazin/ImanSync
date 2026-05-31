import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import SkeletonBox from '@/components/SkeletonBox';
import DuaService, { UnifiedDuaItem } from '@/services/duaService';
import { loadMyDuas } from '@/utils/my-duas-storage';

interface DuaItem {
  id: number;
  category: number;
  arabic: string;
  latin: string;
  translation: string;
  notes: string | null;
  fawaid: string | null;
  source: string;
}

export default function DuaCategoryScreen() {
  const { id, name, isCustom } = useLocalSearchParams<{ id: string; name: string; isCustom?: string }>();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<UnifiedDuaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCustom === 'true') {
      loadMyDuas()
        .then((allCustom) => {
          const categoryDuas = allCustom.filter(d => d.categoryId === id).map(d => ({
            id: d.id,
            name: d.title,
            arabic: d.arabic || '',
            latin: d.transliteration || '',
            translationEn: d.translation || '',
            translationBn: d.translation || '',
            reference: '',
            source: 'user' as const,
            isCustom: true,
          }));
          setDuas(categoryDuas);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      DuaService.getDuasByCategory(Number(id))
        .then((data) => {
          setDuas(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id, isCustom]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={name} titleAr={t('dua.titleAr')} showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {loading ? (
          <View style={[styles.list, { marginTop: 8 }]}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={[styles.itemWrapper, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={[styles.item]}>
                  <View style={[styles.itemContent]}>
                    <SkeletonBox width={'85%' as any} height={16} borderRadius={8} color={colors.border} />
                    <SkeletonBox width={'60%' as any} height={13} borderRadius={6} color={colors.border} />
                    <View style={{ gap: 8, alignItems: 'flex-end', marginTop: 8 }}>
                      <SkeletonBox width={'75%' as any} height={18} borderRadius={8} color={colors.border} />
                      <SkeletonBox width={'50%' as any} height={18} borderRadius={8} color={colors.border} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {duas.map((dua) => {
              // Apply Bangla translation if available and language is bn
              let translation = i18n.language === 'bn' ? dua.translationBn : dua.translationEn;
              if (!translation) translation = dua.name;

              return (
                <BlurView
                  key={dua.id}
                  intensity={40}
                  tint={colors.glassTint as any}
                  style={[styles.itemWrapper, { borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.item}
                    activeOpacity={0.7}
                    onPress={() => {
                      router.push({
                        pathname: '/dua-detail',
                        params: { 
                          id: dua.id,
                          categoryName: name,
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
                </BlurView>
              );
            })}
            
            {duas.length === 0 && !loading && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Fonts.outfit }}>
                {t('dua.noDuasCategory', { defaultValue: 'No duas found in this category.' })}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    paddingTop: 0,
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
