import ThemeCard from '@/components/ThemeCard';
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, useThemeColors } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react-native';

import DuaService, { UnifiedDuaItem } from '@/services/duaService';
import { loadMyDuas, saveMyDuas, saveMediaFile, UserDua } from '@/utils/my-duas-storage';
import curatedDuasData from '@/data/curated-duas.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddDuaModal from '@/components/add-dua-modal';
import { Bookmark, Plus, FolderOpen, Search } from 'lucide-react-native';
import PinSheet from '@/components/pin-sheet';

const PINNED_DUAS_KEY = 'imansync_pinned_duas';
export default function DuaCategoryScreen() {
  const { id, name, isCustom } = useLocalSearchParams<{ id: string; name: string; isCustom?: string }>();
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<UnifiedDuaItem[]>(() => {
    if (isCustom !== 'true') {
      return DuaService.getDuasByCategorySync(Number(id));
    }
    return [];
  });

  const [pinnedDuaIds, setPinnedDuaIds] = useState<string[]>([]);
  const [selectedDua, setSelectedDua] = useState<UnifiedDuaItem | null>(null);
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScrollY = Animated.diffClamp(scrollY, 0, 100);
  const fabTranslateY = clampedScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  const handleAddDua = async (duaData: Omit<UserDua, 'id' | 'createdAt'>) => {
    try {
      let finalMediaUri = duaData.mediaUri;
      if (duaData.mediaUri && duaData.type !== 'text') {
        finalMediaUri = await saveMediaFile(duaData.mediaUri, duaData.mediaUri);
      }
      const newDua: UserDua = {
        ...duaData,
        id: Math.random().toString(36).substring(7),
        createdAt: Date.now(),
        mediaUri: finalMediaUri,
      };
      const allDuas = await loadMyDuas();
      const updated = [newDua, ...allDuas];
      await saveMyDuas(updated);
      loadData();
    } catch (e) {
      console.error('Failed to add dua', e);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(PINNED_DUAS_KEY).then((val) => {
      if (val) {
        try {
          setPinnedDuaIds(JSON.parse(val));
        } catch (e) {
          console.error('Failed to parse pinned duas', e);
        }
      }
    });
  }, []);

  const loadData = () => {
    if (isCustom === 'true') {
      if (id.startsWith('curated_cat_')) {
        const categoryKey = id.replace('curated_cat_', '');
        const categoryData = (curatedDuasData as any[]).find(c => c.id === categoryKey);
        const duaList = categoryData ? categoryData.duas : [];
        const formatted = duaList.map((d: any) => ({
          id: d.id,
          name: i18n.language === 'bn' ? (d.title_bn || d.title) : (d.title || 'Curated Dua'),
          arabic: d.arabic || '',
          latin: d.transliteration_en || '',
          translationEn: d.translation_en || '',
          translationBn: d.translation_bn || '',
          transliterationBn: d.transliteration_bn || '',
          reference: d.reference || '',
          source: d.reference || '',
          isCustom: true,
          image: d.image || undefined,
        }));
        setDuas(formatted);

      } else {
        loadMyDuas()
          .then((allCustom) => {
            const categoryDuas = allCustom.filter(d => d.categoryId === id).map(d => ({
              id: d.id,
              name: d.titleBn || d.titleEn || d.title || '',
              arabic: d.arabic || '',
              latin: d.transliterationEn || d.transliteration || '',
              translationEn: d.translationEn || d.translation || '',
              translationBn: d.translationBn || d.translation || '',
              transliterationBn: d.transliterationBn || '',
              reference: '',
              source: 'user' as const,
              isCustom: true,
            }));
            setDuas(categoryDuas);
          })
          .catch(console.error);
      }
    } else {
      DuaService.getDuasByCategory(Number(id))
        .then((data) => {
          setDuas(data);
        })
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    loadData();
  }, [id, isCustom]);

  const sortedDuas = [...duas].sort((a, b) => {
    const aPinned = pinnedDuaIds.includes(a.id.toString()) ? 1 : 0;
    const bPinned = pinnedDuaIds.includes(b.id.toString()) ? 1 : 0;
    return bPinned - aPinned;
  });

  const renderItem = ({ item: dua }: { item: UnifiedDuaItem }) => {
    const title = dua.name;
    return (
      <ThemeCard
        intensity={40}
        
        style={[styles.itemWrapper, { borderColor: colors.border }]}
      >
        <TouchableOpacity activeOpacity={1}
          style={styles.item}
          onLongPress={() => {
            setSelectedDua(dua);
            setPinSheetVisible(true);
          }}
          onPress={() => {
            router.push({
              pathname: '/dua-detail',
              params: { 
                id: dua.id,
                categoryName: name,
                duaName: title,
                arabic: dua.arabic,
                latin: dua.latin || '',
                translationEn: dua.translationEn,
                translationBn: dua.translationBn,
                transliterationBn: (dua as any).transliterationBn || '',
                source: dua.source || '',
                image: (dua as any).image || '',
              }
            });
          }}
        >
          <View style={styles.itemContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {pinnedDuaIds.includes(dua.id.toString()) && (
                <Bookmark size={14} color={colors.accent} fill={colors.accent} />
              )}
              <Text style={[styles.itemTitle, { color: colors.text, flex: 1 }]} numberOfLines={3}>
                {title}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </ThemeCard>
    );
  };

  const renderEmpty = () => {
    
    return (
      <View style={{ alignItems: 'center', marginTop: 80 }}>
        <FolderOpen size={48} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
        <Text style={{ color: colors.textSecondary, textAlign: 'center', fontFamily: Fonts.outfit, fontSize: 16, marginBottom: 24 }}>
          {t('dua.noDuasCategory', { defaultValue: 'No duas found in this category.' })}
        </Text>
        {isCustom === 'true' && !id.startsWith('curated_cat_') && (
          <TouchableOpacity activeOpacity={1}
            style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontFamily: Fonts.outfit, fontSize: 16, fontWeight: '500' }}>
              {t('dua.addDua', { defaultValue: 'Add Dua' })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={name} 
        titleAr={t('dua.titleAr')} 
        showBack 
        rightElement={
          <TouchableOpacity activeOpacity={1} onPress={() => router.push({ pathname: '/dua-search', params: { categoryId: id, isCustom: isCustom || 'false', categoryName: name } })} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Search size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />
      

        <Animated.FlatList
          data={sortedDuas}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.container}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />


      {selectedDua && (
        <PinSheet
          visible={pinSheetVisible}
          title={selectedDua.name || 'Dua'}
          isPinned={pinnedDuaIds.includes(selectedDua.id.toString())}
          onClose={() => setPinSheetVisible(false)}
          onTogglePin={async () => {
            const idStr = selectedDua.id.toString();
            let updated;
            if (pinnedDuaIds.includes(idStr)) {
              updated = pinnedDuaIds.filter(id => id !== idStr);
            } else {
              updated = [...pinnedDuaIds, idStr];
            }
            setPinnedDuaIds(updated);
            await AsyncStorage.setItem(PINNED_DUAS_KEY, JSON.stringify(updated));
          }}
          colors={colors}
          isUserCreated={isCustom === 'true' && !id.startsWith('curated_cat_')}
          isDua={true}
          onDelete={async () => {
            const allDuas = await loadMyDuas();
            const updated = allDuas.filter(d => d.id.toString() !== selectedDua.id.toString());
            await saveMyDuas(updated);
            loadData();
          }}
        />
      )}

      {isCustom === 'true' && !id.startsWith('curated_cat_') && (
        <>
          <Animated.View style={[styles.fab, { transform: [{ translateY: fabTranslateY }] }]}>
            <TouchableOpacity activeOpacity={1}
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.accent, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          <AddDuaModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSave={handleAddDua}
            colors={colors}
            initialData={{ categoryId: id } as any}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
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
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 10,
  },
});
