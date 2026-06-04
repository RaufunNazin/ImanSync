import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { ChevronRight, Bookmark, Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';

export default function DuaBookmarksScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();
  const { t } = useTranslation();

  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('imansync_dua_bookmarks').then(val => {
        if (val) {
          try {
            setBookmarks(JSON.parse(val));
          } catch (e) {
            console.error('Failed to parse dua bookmarks', e);
            setBookmarks([]);
          }
        }
      });
    }, [])
  );


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={t('dua.bookmarks', { defaultValue: 'Bookmarks' })} 
        titleAr="" 
        showBack 
        rightElement={
          <TouchableOpacity onPress={() => router.push('/dua-search?categoryId=bookmarks' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Search size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">

        <View style={styles.list}>
          {bookmarks.map((dua, index) => {
            // we stored the params object directly which has translationEn, translationBn etc.
            // we can render it exactly as it was.
            // However, to keep it simple, we just use the english translation as title
            const title = dua.translationEn || dua.translationBn || "Saved Dua";

            return (
              <BlurView
                key={index}
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
                      params: dua
                    });
                  }}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={3}>
                      {title}
                    </Text>
                    {!!dua.arabic && (
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
          
          {bookmarks.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
              <Bookmark size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.four, fontFamily: Fonts.outfit, fontSize: 16 }}>
                {t('dua.noBookmarks', { defaultValue: "You haven't bookmarked any duas yet." })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
