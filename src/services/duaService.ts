import { storage } from '@/store/mmkv';



import hisnulEnMappingRaw from '@/data/hisnul_en.json';

// Static mapping for English (to be populated later)
const hisnulEnMapping: Record<string, { translation_en: string }> = hisnulEnMappingRaw || {};

const CACHE_KEY_CATEGORIES = 'hisnul_categories_cache';
const CACHE_KEY_DUAS = 'hisnul_duas_cache';

export interface HisnulCategory {
  id: number;
  name: string;
  dua_count: number;
}

export interface HisnulWord {
  word_id: number;
  arabic: string;
  bn: string;
}

export interface HisnulSegment {
  dua_segment_id: number;
  arabic: string;
  translations: string;
  reference: string;
  words: HisnulWord[];
}

export interface HisnulDua {
  dua_global_id: number;
  book_id: number;
  chap_id: number;
  duaname: string;
  categories: { id: number; name: string }[];
  segments: HisnulSegment[];
}

export interface UnifiedDuaItem {
  id: string; // Unified string ID
  globalId?: number; // From Hisnul API
  name: string;
  arabic: string;
  latin: string; // Not available in Hisnul API, leaving empty
  translationEn: string;
  translationBn: string;
  reference: string;
  source: 'api' | 'user';
  isCustom?: boolean;
  categoryId?: number | string;
  wordByWord?: HisnulWord[];
  transliterationBn?: string;
}

class DuaService {
  private static readonly API_BASE = 'https://dua-api.hisnul.workers.dev/api';

  static getCategoriesSync(): HisnulCategory[] {
    const cached = storage.getString(CACHE_KEY_CATEGORIES);
    return cached ? JSON.parse(cached) : [];
  }

  static async getCategories(signal?: AbortSignal): Promise<HisnulCategory[]> {
    try {
      const cached = storage.getString(CACHE_KEY_CATEGORIES);
      if (cached) {
        return JSON.parse(cached);
      }
      return await this.fetchAndCacheCategories(signal);
    } catch (e: any) {
      if (e.name !== 'AbortError') console.warn('Error fetching categories:', e);
      return [];
    }
  }

  private static async fetchAndCacheCategories(signal?: AbortSignal): Promise<HisnulCategory[]> {
    const res = await fetch(`${this.API_BASE}/categories`, { signal });
    const json = await res.json();
    if (json.success && json.data) {
      storage.set(CACHE_KEY_CATEGORIES, JSON.stringify(json.data));
      return json.data;
    }
    return [];
  }

  static getDuasByCategorySync(categoryId: number): UnifiedDuaItem[] {
    const cacheKey = `${CACHE_KEY_DUAS}_cat_${categoryId}`;
    const cached = storage.getString(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }

  static async getDuasByCategory(categoryId: number, signal?: AbortSignal): Promise<UnifiedDuaItem[]> {
    try {
      const cacheKey = `${CACHE_KEY_DUAS}_cat_${categoryId}`;
      const cached = storage.getString(cacheKey);
      
      if (cached) {
      this.fetchAndCacheCategoryDuas(categoryId, signal).catch(console.warn);
      return JSON.parse(cached);
    }
    return await this.fetchAndCacheCategoryDuas(categoryId, signal);
  } catch (e) {
    console.warn(`Error in getDuasByCategory(${categoryId}):`, e);
    return [];
  }
  }

  private static async fetchAndCacheCategoryDuas(categoryId: number, signal?: AbortSignal): Promise<UnifiedDuaItem[]> {
    // We assume limit=100 is enough for a single category since max dua per category is small
    const res = await fetch(`${this.API_BASE}/categories/${categoryId}/duas?limit=200`, { signal });
    const json = await res.json();
    if (json.success && json.data) {
      const unified = json.data.map(this.mapToUnified);
      storage.set(`${CACHE_KEY_DUAS}_cat_${categoryId}`, JSON.stringify(unified));
      return unified;
    }
    return [];
  }

  static async getDuaById(id: string | number, signal?: AbortSignal): Promise<UnifiedDuaItem | null> {
    try {
      const cacheKey = `${CACHE_KEY_DUAS}_id_${id}`;
      const cached = storage.getString(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UnifiedDuaItem;
      }
      
      const res = await fetch(`${this.API_BASE}/duas/${id}`, { signal });
      const json = await res.json();
      if (json.success && json.data) {
        const unified = this.mapToUnified(json.data);
        storage.set(cacheKey, JSON.stringify(unified));
        return unified;
      }
      return null;
    } catch (e: any) {
      if (e.name !== 'AbortError') console.warn(`Error fetching dua ${id}:`, e);
      return null;
    }
  }

  static async searchNative(query: string, isArabic: boolean, signal?: AbortSignal): Promise<UnifiedDuaItem[]> {
    try {
      const endpoint = isArabic ? '/search/arabic' : '/search';
      const res = await fetch(`${this.API_BASE}${endpoint}?q=${encodeURIComponent(query)}`, { signal });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data.map(this.mapToUnified);
    }
    return [];
  } catch (e: any) {
    if (e.name !== 'AbortError') console.warn('Error in searchNative:', e);
    return [];
  }
  }

  static async searchHybrid(query: string, signal?: AbortSignal): Promise<UnifiedDuaItem[]> {
    if (!query) return [];
    
    const isArabicOrBengali = /[\u0600-\u06FF\u0980-\u09FF]/.test(query);
    const isArabic = /[\u0600-\u06FF]/.test(query);
    
    if (isArabicOrBengali) {
      return this.searchNative(query, isArabic, signal);
    } else {
      // English search
      const q = query.toLowerCase();
      const matchingIds = Object.keys(hisnulEnMapping).filter(id => 
        hisnulEnMapping[id].translation_en.toLowerCase().includes(q)
      );
      
      const targetIds = matchingIds.slice(0, 20);
      const results: (UnifiedDuaItem | null)[] = [];
      const chunkSize = 5;

      for (let i = 0; i < targetIds.length; i += chunkSize) {
        const chunk = targetIds.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async (id) => {
            const cacheKey = `${CACHE_KEY_DUAS}_id_${id}`;
            const cached = storage.getString(cacheKey);
            if (cached) return JSON.parse(cached) as UnifiedDuaItem;
            
            try {
              const res = await fetch(`${this.API_BASE}/duas/${id}`, { signal });
              const json = await res.json();
              if (json.success && json.data) {
                const unified = this.mapToUnified(json.data);
                storage.set(cacheKey, JSON.stringify(unified));
                return unified;
              }
            } catch(e) {
              console.warn(`Error fetching dua ${id}:`, e);
            }
            return null;
          })
        );
        results.push(...chunkResults);
      }
      
      return results.filter(Boolean) as UnifiedDuaItem[];
    }
  }

  static mapToUnified(d: HisnulDua): UnifiedDuaItem {
    const firstSeg = d.segments && d.segments.length > 0 ? d.segments[0] : null;
    
    // Attempt to pull English translation from local mapping
    const enTrans = hisnulEnMapping[d.dua_global_id]?.translation_en || '';

    // Join all segment arabic texts if there are multiple, or just take first
    const arabicFull = d.segments?.map(s => s.arabic).join('\n\n') || '';
    const bnFull = d.segments?.map(s => s.translations).join('\n\n') || '';
    const reference = d.segments?.map(s => s.reference).filter(Boolean).join(' | ') || '';

    return {
      id: d.dua_global_id.toString(),
      globalId: d.dua_global_id,
      name: d.duaname,
      arabic: arabicFull || (firstSeg?.arabic || ''),
      latin: '',
      translationEn: enTrans,
      translationBn: bnFull || (firstSeg?.translations || ''),
      reference: reference || (firstSeg?.reference || ''),
      source: 'api',
      categoryId: d.categories && d.categories.length > 0 ? d.categories[0].id : undefined,
      wordByWord: firstSeg?.words || []
    };
  }
}

export default DuaService;
