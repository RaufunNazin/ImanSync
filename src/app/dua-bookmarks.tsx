import ThemeCard from '@/components/ThemeCard';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fonts, Spacing, useThemeColors, useActiveColor } from '@/constants/theme';
import PageHeader from '@/components/page-header';
import { ChevronRight, Bookmark, Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFolderStore } from '@/store/folderStore';
import { useLocalSearchParams } from 'expo-router';
import { Folder, MoreVertical, FolderPlus } from 'lucide-react-native';
import { TextInput } from 'react-native-gesture-handler';
import { Modal } from 'react-native';

export default function DuaBookmarksScreen() {
  const colors = useThemeColors();
  const activeColor = useActiveColor();
  const router = useRouter();
  const { t } = useTranslation();

  const { folderId, folderName } = useLocalSearchParams();
  const folderStore = useFolderStore();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Move Bookmark Modal
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [bookmarkToMove, setBookmarkToMove] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      folderStore.initialize();
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

  const filteredBookmarks = bookmarks.filter(b => {
    if (folderId) return b.folderId === folderId;
    return !b.folderId; // root
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      folderStore.addFolder(newFolderName.trim());
      setNewFolderName('');
      setCreateModalVisible(false);
    }
  };

  const moveBookmark = async (targetFolderId: string | null) => {
    if (!bookmarkToMove) return;
    const updated = bookmarks.map(b => b === bookmarkToMove ? { ...b, folderId: targetFolderId } : b);
    setBookmarks(updated);
    await AsyncStorage.setItem('imansync_dua_bookmarks', JSON.stringify(updated));
    setMoveModalVisible(false);
    setBookmarkToMove(null);
  };


  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        titleEn={folderName ? String(folderName) : t('dua.bookmarks', { defaultValue: 'Bookmarks' })} 
        titleAr="" 
        showBack 
        rightElement={
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            {!folderId && (
              <TouchableOpacity activeOpacity={1} onPress={() => setCreateModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FolderPlus size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity activeOpacity={1} onPress={() => router.push('/dua-search?categoryId=bookmarks' as any)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Search size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        }
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">

        <View style={styles.list}>
          {/* Folders (only in root) */}
          {!folderId && folderStore.folders.map(folder => (
            <ThemeCard
              key={folder.id}
              intensity={40}
              
              style={[styles.itemWrapper, { borderColor: colors.border }]}
            >
              <TouchableOpacity activeOpacity={1}
                style={styles.item}
                onPress={() => router.push(`/dua-bookmarks?folderId=${folder.id}&folderName=${encodeURIComponent(folder.name)}` as any)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: activeColor + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Folder size={20} color={activeColor} />
                  </View>
                  <View>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{folder.name}</Text>
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 13, color: colors.textSecondary }}>
                      {bookmarks.filter(b => b.folderId === folder.id).length} {t('dua.savedItems', { defaultValue: 'saved items' })}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </ThemeCard>
          ))}

          {/* Divider if both exist */}
          {!folderId && folderStore.folders.length > 0 && filteredBookmarks.length > 0 && (
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: Spacing.two }} />
          )}

          {filteredBookmarks.map((dua, index) => {
            // we stored the params object directly which has translationEn, translationBn etc.
            // we can render it exactly as it was.
            // However, to keep it simple, we just use the english translation as title
            const title = dua.translationEn || dua.translationBn || "Saved Dua";

            return (
              <ThemeCard
                key={index}
                intensity={40}
                
                style={[styles.itemWrapper, { borderColor: colors.border }]}
              >
                <TouchableOpacity activeOpacity={1}
                  style={styles.item}
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
                  <TouchableOpacity activeOpacity={1} onPress={() => { setBookmarkToMove(dua); setMoveModalVisible(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4 }}>
                    <MoreVertical size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </ThemeCard>
            );
          })}
          
          {(!folderId ? bookmarks.length === 0 && folderStore.folders.length === 0 : filteredBookmarks.length === 0) && (
            <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
              <Bookmark size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.four, fontFamily: Fonts.outfit, fontSize: 16 }}>
                {t('dua.noBookmarks', { defaultValue: "You haven't bookmarked any duas yet." })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Folder Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setCreateModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.four }}>
            <TouchableWithoutFeedback>
              <View style={{ width: '100%', backgroundColor: colors.backgroundElement, borderRadius: 24, padding: Spacing.five, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 18, color: colors.text, marginBottom: Spacing.four }}>
                  {t('dua.createFolder', { defaultValue: 'Create New Folder' })}
                </Text>
                <TextInput
                  style={{ backgroundColor: colors.background, color: colors.text, padding: Spacing.four, borderRadius: 12, fontFamily: Fonts.outfit, fontSize: 16, marginBottom: Spacing.four }}
                  placeholder={t('dua.folderName', { defaultValue: 'Folder Name' })}
                  placeholderTextColor={colors.textSecondary}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: Spacing.three }}>
                  <TouchableOpacity activeOpacity={1} style={{ flex: 1, padding: Spacing.four, alignItems: 'center', borderRadius: 12, backgroundColor: colors.background }} onPress={() => setCreateModalVisible(false)}>
                    <Text style={{ fontFamily: Fonts.outfit, color: colors.text }}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={1} style={{ flex: 1, padding: Spacing.four, alignItems: 'center', borderRadius: 12, backgroundColor: activeColor }} onPress={handleCreateFolder}>
                    <Text style={{ fontFamily: Fonts.outfit, color: '#FFF' }}>{t('common.create', { defaultValue: 'Create' })}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Move Bookmark Modal */}
      <Modal visible={moveModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setMoveModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableWithoutFeedback>
              <View style={{ backgroundColor: colors.backgroundElement, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.five, paddingBottom: 40, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontFamily: Fonts.outfit, fontSize: 18, color: colors.text, marginBottom: Spacing.four }}>
                  {t('dua.moveToFolder', { defaultValue: 'Move to Folder' })}
                </Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity activeOpacity={1} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.three, gap: Spacing.three }} onPress={() => moveBookmark(null)}>
                    <Folder size={20} color={colors.textSecondary} />
                    <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text }}>{t('dua.noFolder', { defaultValue: 'No Folder' })}</Text>
                  </TouchableOpacity>
                  {folderStore.folders.map(folder => (
                    <TouchableOpacity activeOpacity={1} key={folder.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.three, gap: Spacing.three }} onPress={() => moveBookmark(folder.id)}>
                      <Folder size={20} color={activeColor} />
                      <Text style={{ fontFamily: Fonts.outfit, fontSize: 16, color: colors.text }}>{folder.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity activeOpacity={1} style={{ marginTop: Spacing.four, padding: Spacing.four, alignItems: 'center', borderRadius: 12, backgroundColor: colors.background }} onPress={() => setMoveModalVisible(false)}>
                  <Text style={{ fontFamily: Fonts.outfit, color: colors.text }}>{t('common.cancel', { defaultValue: 'Cancel' })}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
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
    padding: Spacing.four,
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
