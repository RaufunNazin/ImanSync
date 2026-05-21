import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { BlurView } from 'expo-blur';
import { ChevronRight, Bookmark } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

export default function DuaBookmarksScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('deen_dua_bookmarks').then(val => {
        if (val) {
          setBookmarks(JSON.parse(val));
        }
      });
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn="Bookmarks" titleAr="" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
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
          
          {bookmarks.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
              <Bookmark size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.four, fontFamily: Fonts.outfit, fontSize: 16 }}>
                You haven't bookmarked any duas yet.
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
    fontSize: 18,
    textAlign: 'right',
  },
});
