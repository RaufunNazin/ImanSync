import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Modal } from 'react-native';
import { Trash2, Edit2 } from 'lucide-react-native';
import { saveMyDuas } from '@/utils/my-duas-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/page-header';
import { loadMyDuas, UserDua, getMediaUri } from '@/utils/my-duas-storage';

import { useVideoPlayer, VideoView } from 'expo-video';
import AddDuaModal from '@/components/add-dua-modal';

export default function MyDuaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useThemeStore((s) => s.theme);
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { t, i18n } = useTranslation();
  const router = useRouter();
  
  const [dua, setDua] = useState<UserDua | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imageRatio, setImageRatio] = useState(1);

  const handleDelete = async () => {
    const duas = await loadMyDuas();
    const updated = duas.filter(d => d.id !== id);
    await saveMyDuas(updated);
    router.back();
  };


  useEffect(() => {
    const fetchDua = async () => {
      const duas = await loadMyDuas();
      const found = duas.find(d => d.id === id);
      if (found) {
        setDua(found);
        if (found.mediaUri && found.type !== 'text') {
          const uri = await getMediaUri(found.mediaUri);
          setLocalUri(uri);
          if (found.type === 'image' && uri) {
            Image.getSize(uri, (w, h) => setImageRatio(w / h), () => setImageRatio(1));
          }
        }
      }
      setLoading(false);
    };
    fetchDua();
  }, [id]);

  const player = useVideoPlayer(localUri, player => {
    player.loop = true;
    player.pause();
  });

  const handleUpdate = async (updatedData: Omit<UserDua, 'id' | 'createdAt'>) => {
    if (!dua) return;
    
    // We already handled media saving inside add-dua-modal? Actually add-dua-modal doesn't save media, it passes mediaUri.
    // Wait, the parent component (dua.tsx) saves media. So we should do it here too!
    // But since the add-dua-modal passes back `mediaUri`, we need to save it if it's new.
    let finalMediaUri = updatedData.mediaUri;
    
    // If it's a new media (starts with file:// rather than our app dir), save it.
    // Or simpler: in add-dua-modal, mediaUri is whatever ImagePicker returned.
    if (updatedData.mediaUri && updatedData.mediaUri !== dua.mediaUri && updatedData.type !== 'text') {
      const { saveMediaFile } = await import('@/utils/my-duas-storage');
      finalMediaUri = await saveMediaFile(updatedData.mediaUri, updatedData.mediaUri);
    }

    const updatedDua: UserDua = {
      ...updatedData,
      id: dua.id,
      createdAt: dua.createdAt,
      mediaUri: finalMediaUri,
    };

    const duas = await loadMyDuas();
    const newDuas = duas.map(d => d.id === dua.id ? updatedDua : d);
    await saveMyDuas(newDuas);
    
    setDua(updatedDua);
    if (updatedDua.mediaUri && updatedDua.type !== 'text') {
      const uri = await getMediaUri(updatedDua.mediaUri);
      setLocalUri(uri);
      if (updatedDua.type === 'image' && uri) {
        Image.getSize(uri, (w, h) => setImageRatio(w / h), () => setImageRatio(1));
      }
    } else {
      setLocalUri(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.loading', { defaultValue: 'Loading...' })} titleAr="" showBack />
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!dua) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <PageHeader titleEn={t('dua.notFound', { defaultValue: 'Not Found' })} titleAr="" showBack />
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>{t('dua.notFound', { defaultValue: 'Dua not found.' })}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={i18n.language === 'bn' ? (dua.titleBn || dua.titleEn || dua.title || '') : (dua.titleEn || dua.titleBn || dua.title || '')} 
        titleAr="" 
        showBack 
        rightElement={
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8, flexShrink: 0 }}>
            <TouchableOpacity 
              onPress={() => setShowEditModal(true)} 
              style={[styles.actionBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            >
              <Edit2 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowDeleteModal(true)} 
              style={[styles.actionBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        } 
      />
      
      <ScrollView contentContainerStyle={styles.container}>
        {dua.type === 'text' && (
          <View style={[styles.card, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            {dua.arabic && (
              <Text style={[styles.arabic, { color: colors.text }]}>{dua.arabic}</Text>
            )}
            
            {/* localized logic */}
            {i18n.language === 'bn' ? (
              <>
                {dua.transliterationBn && <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{dua.transliterationBn}</Text>}
                {dua.translationBn && <Text style={[styles.translation, { color: colors.text }]}>{dua.translationBn}</Text>}
                
                {dua.transliterationEn && <Text style={[styles.transliteration, { color: colors.textSecondary, marginTop: Spacing.four }]}>{dua.transliterationEn}</Text>}
                {dua.translationEn && <Text style={[styles.translation, { color: colors.text }]}>{dua.translationEn}</Text>}
              </>
            ) : (
              <>
                {dua.transliterationEn && <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{dua.transliterationEn}</Text>}
                {dua.translationEn && <Text style={[styles.translation, { color: colors.text }]}>{dua.translationEn}</Text>}
                
                {dua.transliterationBn && <Text style={[styles.transliteration, { color: colors.textSecondary, marginTop: Spacing.four }]}>{dua.transliterationBn}</Text>}
                {dua.translationBn && <Text style={[styles.translation, { color: colors.text }]}>{dua.translationBn}</Text>}
              </>
            )}
            
            {/* Fallback for legacy items */}
            {dua.transliteration && !dua.transliterationEn && !dua.transliterationBn && (
              <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{dua.transliteration}</Text>
            )}
            {dua.translation && !dua.translationEn && !dua.translationBn && (
              <Text style={[styles.translation, { color: colors.text }]}>{dua.translation}</Text>
            )}
          </View>
        )}

        {dua.type === 'image' && localUri && (
          <View style={[styles.mediaCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Image 
              source={{ uri: localUri }} 
              style={[styles.imageFull, { aspectRatio: imageRatio }]} 
              resizeMode="contain"
            />
          </View>
        )}

        {dua.type === 'video' && localUri && (
          <View style={[styles.mediaCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
            <VideoView 
              player={player} 
              style={styles.videoFull} 
            />
          </View>
        )}
      
      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: colors.background, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontFamily: Fonts.outfit, fontSize: 20, color: colors.text, marginBottom: 12 }}>{t('dua.deleteConfirmTitle')}</Text>
            <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.textSecondary, marginBottom: 24, lineHeight: 24 }}>{t('dua.deleteConfirmMsg')}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.backgroundElement, alignItems: 'center' }} onPress={() => setShowDeleteModal(false)}>
                <Text style={{ fontFamily: Fonts.outfit, color: colors.text }}>{t('dua.deleteConfirmNo')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' }} onPress={handleDelete}>
                <Text style={{ fontFamily: Fonts.outfit, color: '#FFF' }}>{t('dua.deleteConfirmYes')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddDuaModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdate}
        initialData={dua}
        colors={colors}
      />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  mediaCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  imageFull: {
    width: '100%',
  },
  videoFull: {
    width: '100%',
    aspectRatio: 16/9,
  },

  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
  },
  notFound: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  arabic: {
    fontFamily: Fonts.arabic,
    fontSize: 32,
    textAlign: 'right',
    includeFontPadding: false,
    lineHeight: 50,
  },
  transliteration: {
    fontFamily: Fonts.outfit,
    fontSize: 16,
    fontStyle: 'italic',
  },
  translation: {
    fontFamily: Fonts.outfit,
    fontSize: 18,
    lineHeight: 28,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  video: {
    width: '100%',
    height: 300,
  },
});
