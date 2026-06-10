import { storage } from '@/store/mmkv';

export interface CacheOptions {
  key: string;
  fetcher: () => Promise<any>;
  onData: (data: any) => void;
  onStart?: (isCached: boolean) => void;
  onError?: (err: any) => void;
}

/**
 * Stale-While-Revalidate pattern.
 * Instantly returns cached data if available, then fetches new data in the background.
 */
export const fetchSWR = async ({ key, fetcher, onData, onStart, onError }: CacheOptions) => {
  try {
    const cached = storage.getString(key);
    if (onStart) onStart(!!cached);
    
    if (cached) {
      onData(JSON.parse(cached));
    }

    // Always fetch in background to revalidate
    const freshData = await fetcher();
    storage.set(key, JSON.stringify(freshData));
    onData(freshData);
  } catch (err) {
    if (onError) onError(err);
    else console.error(`fetchSWR error for key ${key}:`, err);
  }
};

/**
 * Fetch-Once pattern.
 * Instantly returns cached data if available. If cached, it DOES NOT fetch again.
 * If not cached, it fetches, caches, and returns.
 */
export const fetchOnce = async ({ key, fetcher, onData, onStart, onError }: CacheOptions) => {
  try {
    const cached = storage.getString(key);
    if (onStart) onStart(!!cached);

    if (cached) {
      onData(JSON.parse(cached));
      return; // Do not revalidate since data is static
    }

    const freshData = await fetcher();
    storage.set(key, JSON.stringify(freshData));
    onData(freshData);
  } catch (err) {
    if (onError) onError(err);
    else console.error(`fetchOnce error for key ${key}:`, err);
  }
};
