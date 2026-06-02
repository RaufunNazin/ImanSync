import * as FileSystem from 'expo-file-system/legacy';
const { StorageAccessFramework, EncodingType } = FileSystem;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY       = 'imansync_my_duas_path';
const STORAGE_MODE_KEY  = 'imansync_storage_mode';   // 'internal' | 'permanent'
const RELINK_NEEDED_KEY = 'imansync_storage_relink';  // 'true' | null
const RESTORED_KEY      = 'imansync_storage_restored'; // 'true' | null  (for one-time toast)
const FILE_NAME         = 'ImanSync_MyDuas.json';


// ─── Types ───────────────────────────────────────────────────────────────────
export type StorageMode = 'internal' | 'permanent';

export interface UserDua {
  id: string;
  title: string;
  arabic?: string;
  transliteration?: string;
  translation: string;
  type: 'text' | 'image' | 'video';
  mediaUri?: string;
  categoryId?: string;
  createdAt: number;
}

// ─── Internal helpers ────────────────────────────────────────────────────────
function getInternalDir(): string {
  return (FileSystem.documentDirectory ?? '') + 'imansync/';
}

async function ensureInternalDir(): Promise<void> {
  const dir = getInternalDir();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

async function readJsonFromUri(uri: string): Promise<UserDua[]> {
  try {
    const content = await FileSystem.readAsStringAsync(uri);
    return JSON.parse(content) as UserDua[];
  } catch {
    return [];
  }
}

// ─── Public: get current mode ────────────────────────────────────────────────
export async function getStorageMode(): Promise<StorageMode> {
  const mode = await AsyncStorage.getItem(STORAGE_MODE_KEY);
  return (mode as StorageMode) || 'internal';
}

export async function getStorageUri(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEY);
}

// ─── Public: init internal (default, no permissions) ─────────────────────────
export async function initInternalStorage(): Promise<UserDua[]> {
  await ensureInternalDir();
  const dir = getInternalDir();
  await AsyncStorage.setItem(STORAGE_KEY, dir);
  await AsyncStorage.setItem(STORAGE_MODE_KEY, 'internal');

  const fileUri = dir + FILE_NAME;
  const info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists) {
    return await readJsonFromUri(fileUri);
  }
  await FileSystem.writeAsStringAsync(fileUri, '[]');
  return [];
}

// ─── Public: init permanent storage (SAF, opt-in) ────────────────────────────
// Returns { duas, cancelled } — if user cancelled the picker, cancelled = true.
export async function initPermanentStorage(): Promise<{ duas: UserDua[]; cancelled: boolean }> {
  if (Platform.OS !== 'android') {
    // iOS: fallback to internal; "permanent" on iOS is internal + iCloud backup
    const duas = await initInternalStorage();
    return { duas, cancelled: false };
  }

  try {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      return { duas: [], cancelled: true };
    }

    const directoryUri = permissions.directoryUri;
    await AsyncStorage.setItem(STORAGE_KEY, directoryUri);
    await AsyncStorage.setItem(STORAGE_MODE_KEY, 'permanent');
    await AsyncStorage.removeItem(RELINK_NEEDED_KEY);

    // Read existing file or create new one
    const files = await StorageAccessFramework.readDirectoryAsync(directoryUri);
    const fileUri = files.find((f: string) => f.endsWith(FILE_NAME));

    if (fileUri) {
      const content = await FileSystem.readAsStringAsync(fileUri);
      try {
        return { duas: JSON.parse(content) as UserDua[], cancelled: false };
      } catch {
        return { duas: [], cancelled: false };
      }
    } else {
      const newFileUri = await StorageAccessFramework.createFileAsync(
        directoryUri, FILE_NAME, 'application/json'
      );
      await FileSystem.writeAsStringAsync(newFileUri, '[]');
      return { duas: [], cancelled: false };
    }
  } catch (e) {
    console.warn('Permanent storage setup failed', e);
    throw e;
  }
}

// ─── Public: auto-restore permanent on reinstall ─────────────────────────────
// Called at startup if mode = 'permanent' but path is lost.
// Returns true if successfully restored.
export async function tryAutoRestorePermanent(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  // There's no direct filesystem path to Downloads; we rely on the user having
  // previously granted SAF access. After reinstall that grant is revoked so we
  // cannot auto-restore silently. Flag for the relink banner instead.
  await AsyncStorage.setItem(RELINK_NEEDED_KEY, 'true');
  return false;
}

// ─── Public: check & handle startup state ────────────────────────────────────
// Call this from _layout.tsx. Returns { relinkNeeded, justRestored }.
export async function initStorageOnStartup(): Promise<{ relinkNeeded: boolean; justRestored: boolean }> {
  const mode = await getStorageMode();
  const path = await getStorageUri();
  const relinkFlag = await AsyncStorage.getItem(RELINK_NEEDED_KEY);
  const restoredFlag = await AsyncStorage.getItem(RESTORED_KEY);

  if (!path) {
    if (mode === 'permanent') {
      // Reinstall scenario: try to auto-restore
      const restored = await tryAutoRestorePermanent();
      if (restored) {
        await AsyncStorage.setItem(RESTORED_KEY, 'true');
        return { relinkNeeded: false, justRestored: true };
      }
      return { relinkNeeded: true, justRestored: false };
    } else {
      // First launch: silently init internal
      await initInternalStorage();
      return { relinkNeeded: false, justRestored: false };
    }
  }

  // Path exists — check if it still works
  if (mode === 'permanent' && path.startsWith('content://')) {
    try {
      await StorageAccessFramework.readDirectoryAsync(path);
      // Permission still valid
      if (relinkFlag) await AsyncStorage.removeItem(RELINK_NEEDED_KEY);
      // If we previously flagged as restored, clear that flag and return justRestored once
      if (restoredFlag) {
        await AsyncStorage.removeItem(RESTORED_KEY);
        return { relinkNeeded: false, justRestored: true };
      }
    } catch {
      // Permission revoked
      await AsyncStorage.setItem(RELINK_NEEDED_KEY, 'true');
      await AsyncStorage.removeItem(STORAGE_KEY);
      return { relinkNeeded: true, justRestored: false };
    }
  }

  return { relinkNeeded: relinkFlag === 'true', justRestored: false };
}

// ─── Public: clear relink flag (after user dismisses banner) ─────────────────
export async function clearRelinkFlag(): Promise<void> {
  await AsyncStorage.removeItem(RELINK_NEEDED_KEY);
}

// ─── Public: load duas ───────────────────────────────────────────────────────
export async function loadMyDuas(): Promise<UserDua[]> {
  const uri = await getStorageUri();
  const mode = await getStorageMode();
  if (!uri) return [];

  if (mode === 'permanent' && uri.startsWith('content://')) {
    try {
      const files = await StorageAccessFramework.readDirectoryAsync(uri);
      const fileUri = files.find((f: string) => f.endsWith(FILE_NAME));
      if (fileUri) return await readJsonFromUri(fileUri);
    } catch (e) {
      console.warn('Failed to load duas via SAF', e);
      // Permission may have been revoked
      await AsyncStorage.setItem(RELINK_NEEDED_KEY, 'true');
    }
    return [];
  }

  // Internal (or permanent on iOS)
  try {
    const fileUri = uri + FILE_NAME;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) return await readJsonFromUri(fileUri);
  } catch (e) {
    console.warn('Failed to load duas via filesystem', e);
  }
  return [];
}

// ─── Public: save duas ───────────────────────────────────────────────────────
export async function saveMyDuas(duas: UserDua[]): Promise<void> {
  const uri = await getStorageUri();
  const mode = await getStorageMode();
  if (!uri) throw new Error('Storage not initialized');

  const content = JSON.stringify(duas, null, 2);

  if (mode === 'permanent' && uri.startsWith('content://')) {
    const files = await StorageAccessFramework.readDirectoryAsync(uri);
    let fileUri = files.find((f: string) => f.endsWith(FILE_NAME));

    let existingLength = 0;
    if (!fileUri) {
      fileUri = await StorageAccessFramework.createFileAsync(uri, FILE_NAME, 'application/json');
    } else {
      try {
        const old = await FileSystem.readAsStringAsync(fileUri);
        existingLength = old.length;
      } catch {}
    }
    // Pad to overwrite old content (Android SAF truncation workaround)
    const paddedContent = content.padEnd(existingLength, ' ');
    await FileSystem.writeAsStringAsync(fileUri, paddedContent);
  } else {
    const fileUri = uri + FILE_NAME;
    await FileSystem.writeAsStringAsync(fileUri, content);
  }
}

// ─── Public: migrate between modes ───────────────────────────────────────────
// direction: 'to_permanent' | 'to_internal'
// When moving to permanent, initPermanentStorage() must have already been called
// so that STORAGE_KEY already points to the new permanent directory.
// This function copies the internal duas into the new location (or vice-versa)
// and clears the source file.
export async function migrateDuas(
  direction: 'to_permanent' | 'to_internal',
  permanentUri: string
): Promise<void> {
  const internalDir = getInternalDir();
  const internalFile = internalDir + FILE_NAME;

  if (direction === 'to_permanent') {
    // Read from internal, write to permanent
    let duas: UserDua[] = [];
    try {
      const info = await FileSystem.getInfoAsync(internalFile);
      if (info.exists) {
        duas = await readJsonFromUri(internalFile);
      }
    } catch {}

    const content = JSON.stringify(duas, null, 2);

    if (permanentUri.startsWith('content://')) {
      const files = await StorageAccessFramework.readDirectoryAsync(permanentUri);
      let fileUri = files.find((f: string) => f.endsWith(FILE_NAME));
      let existingLength = 0;
      if (!fileUri) {
        fileUri = await StorageAccessFramework.createFileAsync(permanentUri, FILE_NAME, 'application/json');
      } else {
        try { existingLength = (await FileSystem.readAsStringAsync(fileUri)).length; } catch {}
      }
      await FileSystem.writeAsStringAsync(fileUri, content.padEnd(existingLength, ' '));
    } else {
      await FileSystem.writeAsStringAsync(permanentUri + FILE_NAME, content);
    }

    // Delete internal file after successful migration
    try {
      const info = await FileSystem.getInfoAsync(internalFile);
      if (info.exists) await FileSystem.deleteAsync(internalFile);
    } catch {}
  } else {
    // to_internal: read from permanent, write to internal
    let duas: UserDua[] = [];
    if (permanentUri.startsWith('content://')) {
      try {
        const files = await StorageAccessFramework.readDirectoryAsync(permanentUri);
        const fileUri = files.find((f: string) => f.endsWith(FILE_NAME));
        if (fileUri) duas = await readJsonFromUri(fileUri);
      } catch {}
    } else {
      try { duas = await readJsonFromUri(permanentUri + FILE_NAME); } catch {}
    }

    await ensureInternalDir();
    await FileSystem.writeAsStringAsync(internalFile, JSON.stringify(duas, null, 2));
    // Leave permanent folder intact (per user decision)
  }
}

// ─── Public: switch to internal mode ─────────────────────────────────────────
export async function switchToInternalMode(): Promise<UserDua[]> {
  const currentUri = await getStorageUri();
  const currentMode = await getStorageMode();

  // Migrate first if coming from permanent
  if (currentMode === 'permanent' && currentUri) {
    await migrateDuas('to_internal', currentUri);
  }

  await ensureInternalDir();
  const dir = getInternalDir();
  await AsyncStorage.setItem(STORAGE_KEY, dir);
  await AsyncStorage.setItem(STORAGE_MODE_KEY, 'internal');
  await AsyncStorage.removeItem(RELINK_NEEDED_KEY);

  return await readJsonFromUri(dir + FILE_NAME);
}

// ─── Legacy: kept for compatibility ─────────────────────────────────────────
/** @deprecated Use initInternalStorage / initPermanentStorage instead */
export async function initStorage(_uri?: string): Promise<UserDua[]> {
  return await initInternalStorage();
}

// ─── Public: save media file ─────────────────────────────────────────────────
export async function saveMediaFile(sourceUri: string, originalName: string): Promise<string> {
  const dirUri = await getStorageUri();
  const mode = await getStorageMode();
  if (!dirUri) throw new Error('Storage not initialized');

  const ext = originalName.split('.').pop() || 'jpg';
  const newFileName = `dua_media_${Date.now()}.${ext}`;

  if (mode === 'permanent' && dirUri.startsWith('content://')) {
    const mimeType = ext === 'mp4' ? 'video/mp4' : 'image/jpeg';
    const destUri = await StorageAccessFramework.createFileAsync(dirUri, newFileName, mimeType);
    const base64 = await FileSystem.readAsStringAsync(sourceUri, { encoding: EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(destUri, base64, { encoding: EncodingType.Base64 });
    return newFileName;
  } else {
    const destUri = dirUri + newFileName;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return newFileName;
  }
}

// ─── Public: get media URI ───────────────────────────────────────────────────
export async function getMediaUri(fileName: string): Promise<string | null> {
  const dirUri = await getStorageUri();
  const mode = await getStorageMode();
  if (!dirUri) return null;

  if (mode === 'permanent' && dirUri.startsWith('content://')) {
    try {
      const files = await StorageAccessFramework.readDirectoryAsync(dirUri);
      const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
      const fileUri = files.find((f: string) => {
        const name = decodeURIComponent(f).split('/').pop() || '';
        return name === fileName || name.startsWith(baseName);
      });
      return fileUri || null;
    } catch {
      return null;
    }
  }
  return dirUri + fileName;
}

export interface CustomCategory {
  id: string;
  name: string;
  createdAt: number;
}

const CATEGORIES_KEY = 'imansync_custom_categories';

export async function loadCustomCategories(): Promise<CustomCategory[]> {
  try {
    const val = await AsyncStorage.getItem(CATEGORIES_KEY);
    if (val) return JSON.parse(val);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
  await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}
