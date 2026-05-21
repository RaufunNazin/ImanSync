import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { ChevronRight } from 'lucide-react-native';
import duasBn from '@/data/duas_bn.json';

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
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<DuaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://ummahapi.com/api/duas/category/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.duas) {
          setDuas(data.data.duas);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={name} titleAr={t('dua.titleAr')} showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {duas.map((dua) => {
              // Apply Bangla translation if available and language is bn
              let translation = dua.translation;
              let bnTransliteration = '';
              const bnData = (duasBn as any)[dua.id.toString()];
              
              if (i18n.language === 'bn') {
                if (bnData && bnData.translation) {
                  translation = bnData.translation;
                }
              }

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
                </BlurView>
              );
            })}
            
            {duas.length === 0 && !loading && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Fonts.outfit }}>
                No duas found in this category.
              </Text>
            )}
          </View>
        )}
        <View style={{ height: Spacing.six }} />
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
