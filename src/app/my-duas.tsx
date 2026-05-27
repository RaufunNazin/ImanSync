import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { Plus, Trash2, Play, Search } from 'lucide-react-native';
import { initStorage, loadMyDuas, saveMyDuas, saveMediaFile, UserDua, getMediaUri } from '@/utils/my-duas-storage';
import AddDuaModal from '@/components/add-dua-modal';

import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '@/store/themeStore';

import { ChevronRight, Image as ImageIcon, Video, Type } from 'lucide-react-native';

export default function MyDuasScreen() {
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<UserDua[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      const uri = await AsyncStorage.getItem('imansync_my_duas_path');
      if (!uri) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }
      
      const loadedDuas = await loadMyDuas();
      setDuas(loadedDuas.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error(e);
      setNeedsSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSetupLoading(true);
    try {
      if (Platform.OS === 'android') {
        // Will prompt StorageAccessFramework picker in initStorage
        const initialDuas = await initStorage(''); 
        setDuas(initialDuas);
        setNeedsSetup(false);
      } else {
        // iOS requires user to pick a folder using document picker or we fallback to documentDirectory
        // The plan says we ask user to pick folder.
        // Wait, expo-document-picker doesn't let you pick a *directory* on iOS to write to.
        // It picks files.
        // For iOS, we will just fallback to documentDirectory, which is handled in initStorage('').
        const initialDuas = await initStorage(''); 
        setDuas(initialDuas);
        setNeedsSetup(false);
      }
    } catch (e) {
      console.error('Setup failed', e);
    } finally {
      setSetupLoading(false);
    }
  };

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

      const updated = [newDua, ...duas];
      setDuas(updated);
      await saveMyDuas(updated);
    } catch (e) {
      console.error('Failed to add dua', e);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = duas.filter(d => d.id !== id);
    setDuas(updated);
    await saveMyDuas(updated);
  };



  if (needsSetup) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.myDuas')} titleAr="" showBack />
        <View style={styles.centerContainer}>
          <Text style={[styles.setupTitle, { color: colors.text }]}>{t('dua.setupStorage')}</Text>
          <Text style={[styles.setupDesc, { color: colors.textSecondary }]}>
            {Platform.OS === 'android' 
              ? 'We will ask for storage permission to create a "ImanSync_MyDuas" folder in your Downloads, so your custom duas are never lost even if you reinstall the app.\n\nIf automatic creation fails, you will be asked to select a folder manually.'
              : t('dua.setupStorageDesc')}
          </Text>
          <TouchableOpacity 
            style={[styles.setupBtn, { backgroundColor: colors.accent }]}
            onPress={handleSetup}
            disabled={setupLoading}
          >
            {setupLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.setupBtnText}>
                {Platform.OS === 'android' ? 'Enable Storage' : t('dua.chooseFolder')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filteredDuas = duas.filter(dua => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = (dua.title || '').toLowerCase();
    const translation = (dua.translation || '').toLowerCase();
    const arabic = (dua.arabic || '').toLowerCase();
    const transliteration = (dua.transliteration || '').toLowerCase();
    return title.includes(q) || translation.includes(q) || arabic.includes(q) || transliteration.includes(q);
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('dua.myDuas')} titleAr="" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('duaSettings.searchPlaceholder', { defaultValue: 'Search by name, translation...' })}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {filteredDuas.map((dua) => (
              <TouchableOpacity
                key={dua.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/my-dua-detail/${dua.id}` as any)}
              >
                <BlurView
                  intensity={40}
                  tint={colors.glassTint as any}
                  style={[styles.duaCard, { borderColor: colors.border }]}
                >
                  <View style={styles.duaHeader}>
                    <View style={styles.duaTitleContainer}>
                      {dua.type === 'text' && <Type size={16} color={colors.accent} />}
                      {dua.type === 'image' && <ImageIcon size={16} color={colors.accent} />}
                      {dua.type === 'video' && <Video size={16} color={colors.accent} />}
                      <Text style={[styles.duaTitle, { color: colors.text }]} numberOfLines={1}>
                        {dua.title}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                      <TouchableOpacity onPress={() => handleDelete(dua.id)}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <ChevronRight size={20} color={colors.textSecondary} />
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}

            {filteredDuas.length === 0 && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Fonts.outfit }}>
                {t('dua.noMyDuas', { defaultValue: 'No custom duas added.' })}
              </Text>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB to Add */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <AddDuaModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSave={handleAddDua}
        colors={colors}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.six,
    gap: Spacing.four,
  },
  setupTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 24,
  },
  setupDesc: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  setupBtn: {
    paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    marginTop: Spacing.four,
  },
  setupBtnText: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    color: '#FFF',
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
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  duaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  duaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  duaTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  duaTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    flex: 1,
  },

  fab: {
    position: 'absolute',
    bottom: Spacing.four,
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.3)',
    elevation: 5,
  },
});
