import * as FileSystem from 'expo-file-system/legacy';
const { StorageAccessFramework, EncodingType } = FileSystem;
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';

const STORAGE_KEY = 'deen_my_duas_path';
const FILE_NAME = 'Noor_MyDuas.json';

export interface UserDua {
  id: string;
  title: string;
  arabic?: string;
  transliteration?: string;
  translation: string;
  type: 'text' | 'image' | 'video';
  mediaUri?: string;
  createdAt: number;
}

export async function initStorage(uri?: string): Promise<UserDua[]> {
  if (Platform.OS === 'android') {
    // 1. Try to use hardcoded public directory first to avoid SAF picker
    const hardcodedDir = 'file:///storage/emulated/0/Download/Noor_MyDuas/';
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: "Storage Permission",
          message: "Noor needs access to storage to save your Duas permanently.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        const dirInfo = await FileSystem.getInfoAsync(hardcodedDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(hardcodedDir, { intermediates: true });
        }
        
        await AsyncStorage.setItem(STORAGE_KEY, hardcodedDir);
        
        const fileUri = hardcodedDir + FILE_NAME;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(fileUri);
          return JSON.parse(content) as UserDua[];
        } else {
          await FileSystem.writeAsStringAsync(fileUri, '[]');
          return [];
        }
      }
    } catch (e) {
      console.warn("Direct storage failed, falling back to SAF picker", e);
    }
    
    // 2. Fallback to SAF Picker if direct access fails (e.g. Android 11+ restrictions)
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(uri || undefined);
    if (!permissions.granted) {
      throw new Error('Permission not granted');
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, permissions.directoryUri);
    
    const files = await StorageAccessFramework.readDirectoryAsync(permissions.directoryUri);
    const fileUri = files.find((f: string) => f.endsWith(FILE_NAME));
    
    if (fileUri) {
      const content = await FileSystem.readAsStringAsync(fileUri);
      return JSON.parse(content) as UserDua[];
    } else {
      const newFileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        FILE_NAME,
        'application/json'
      );
      await FileSystem.writeAsStringAsync(newFileUri, '[]');
      return [];
    }
  } else {
    // iOS Fallback
    const dir = FileSystem.documentDirectory + 'Noor_MyDuas/';
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    await AsyncStorage.setItem(STORAGE_KEY, dir);
    
    const fileUri = dir + FILE_NAME;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(fileUri);
      return JSON.parse(content) as UserDua[];
    } else {
      await FileSystem.writeAsStringAsync(fileUri, '[]');
      return [];
    }
  }
}

export async function getStorageUri(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEY);
}

export async function loadMyDuas(): Promise<UserDua[]> {
  const uri = await getStorageUri();
  if (!uri) return [];

  if (uri.startsWith('content://')) {
    try {
      const files = await StorageAccessFramework.readDirectoryAsync(uri);
      const fileUri = files.find((f: string) => f.endsWith(FILE_NAME));
      if (fileUri) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        return JSON.parse(content) as UserDua[];
      }
    } catch (e) {
      console.warn('Failed to load my duas via SAF', e);
    }
  } else {
    try {
      const fileUri = uri + FILE_NAME;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        return JSON.parse(content) as UserDua[];
      }
    } catch (e) {
      console.warn('Failed to load my duas via direct filesystem', e);
    }
  }
  return [];
}

export async function saveMyDuas(duas: UserDua[]): Promise<void> {
  const uri = await getStorageUri();
  if (!uri) throw new Error('Storage not initialized');

  if (uri.startsWith('content://')) {
    const files = await StorageAccessFramework.readDirectoryAsync(uri);
    let fileUri = files.find((f: string) => f.endsWith(FILE_NAME));
    
    if (!fileUri) {
      fileUri = await StorageAccessFramework.createFileAsync(
        uri,
        FILE_NAME,
        'application/json'
      );
    }
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(duas, null, 2));
  } else {
    const fileUri = uri + FILE_NAME;
    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(duas, null, 2));
  }
}

export async function saveMediaFile(sourceUri: string, originalName: string): Promise<string> {
  const dirUri = await getStorageUri();
  if (!dirUri) throw new Error('Storage not initialized');

  const ext = originalName.split('.').pop() || 'jpg';
  const newFileName = `dua_media_${Date.now()}.${ext}`;

  if (dirUri.startsWith('content://')) {
    const mimeType = ext === 'mp4' ? 'video/mp4' : 'image/jpeg';
    const destUri = await StorageAccessFramework.createFileAsync(
      dirUri,
      newFileName,
      mimeType
    );
    
    const base64 = await FileSystem.readAsStringAsync(sourceUri, { encoding: EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(destUri, base64, { encoding: EncodingType.Base64 });
    return newFileName;
  } else {
    const destUri = dirUri + newFileName;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return newFileName;
  }
}

export async function getMediaUri(fileName: string): Promise<string | null> {
  const dirUri = await getStorageUri();
  if (!dirUri) return null;

  if (dirUri.startsWith('content://')) {
    const files = await StorageAccessFramework.readDirectoryAsync(dirUri);
    const fileUri = files.find((f: string) => f.endsWith(fileName));
    return fileUri || null;
  } else {
    return dirUri + fileName;
  }
}
