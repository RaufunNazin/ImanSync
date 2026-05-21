import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { Plus, Trash2, Play } from 'lucide-react-native';
import { initStorage, loadMyDuas, saveMyDuas, saveMediaFile, UserDua, getMediaUri } from '@/utils/my-duas-storage';
import AddDuaModal from '@/components/add-dua-modal';
import { Video, ResizeMode } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyDuasScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t } = useTranslation();
  const router = useRouter();

  const [duas, setDuas] = useState<UserDua[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      const uri = await AsyncStorage.getItem('deen_my_duas_path');
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

  const renderMedia = (dua: UserDua) => {
    const [localUri, setLocalUri] = useState<string | null>(null);

    useEffect(() => {
      if (dua.mediaUri && dua.type !== 'text') {
        getMediaUri(dua.mediaUri).then(setLocalUri);
      }
    }, [dua]);

    if (!localUri) return null;

    if (dua.type === 'image') {
      return (
        <Image 
          source={{ uri: localUri }} 
          style={styles.mediaPreview} 
          resizeMode="cover"
        />
      );
    }

    if (dua.type === 'video') {
      return (
        <View style={styles.mediaPreview}>
          <Video
            source={{ uri: localUri }}
            style={StyleSheet.absoluteFill}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            isLooping={false}
          />
        </View>
      );
    }

    return null;
  };

  if (needsSetup) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.myDuas')} titleAr="" showBack />
        <View style={styles.centerContainer}>
          <Text style={[styles.setupTitle, { color: colors.text }]}>{t('dua.setupStorage')}</Text>
          <Text style={[styles.setupDesc, { color: colors.textSecondary }]}>
            {Platform.OS === 'android' 
              ? 'We will ask for storage permission to create a "Noor_MyDuas" folder in your Downloads, so your custom duas are never lost even if you reinstall the app.\n\nIf automatic creation fails, you will be asked to select a folder manually.'
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader titleEn={t('dua.myDuas')} titleAr="" showBack />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.list}>
            {duas.map((dua) => (
              <BlurView
                key={dua.id}
                intensity={40}
                tint={colors.glassTint as any}
                style={[styles.duaCard, { borderColor: colors.border }]}
              >
                <View style={styles.duaHeader}>
                  <Text style={[styles.duaTitle, { color: colors.text }]} numberOfLines={1}>
                    {dua.title}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(dua.id)}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {dua.type === 'text' ? (
                  <View style={styles.textDuaContent}>
                    {dua.arabic && (
                      <Text style={[styles.duaArabic, { color: colors.text }]}>{dua.arabic}</Text>
                    )}
                    {dua.transliteration && (
                      <Text style={[styles.duaLatin, { color: colors.textSecondary }]}>{dua.transliteration}</Text>
                    )}
                    <Text style={[styles.duaTranslation, { color: colors.text }]}>{dua.translation}</Text>
                  </View>
                ) : (
                  renderMedia(dua)
                )}
              </BlurView>
            ))}

            {duas.length === 0 && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: Fonts.outfit }}>
                No duas added yet.
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
    padding: Spacing.four,
    paddingTop: 0,
  },
  list: {
    gap: Spacing.four,
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
  },
  duaTitle: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    flex: 1,
  },
  textDuaContent: {
    gap: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
    paddingTop: Spacing.three,
  },
  duaArabic: {
    fontSize: 22,
    textAlign: 'right',
  },
  duaLatin: {
    fontFamily: Fonts.outfit,
    fontSize: 14,
    fontStyle: 'italic',
  },
  duaTranslation: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    lineHeight: 24,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.six,
    right: Spacing.six,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
