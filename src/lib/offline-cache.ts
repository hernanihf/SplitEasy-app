import { getItem, setItem } from '@/lib/storage';

// Last-known-good snapshot of a screen's data, so it has something to show
// when a live fetch fails offline instead of a bare error message.
type CacheEntry<T> = { data: T; cachedAt: number };

const keyFor = (key: string) => `spliteasy.cache.${key}`;

export async function cacheData<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
  await setItem(keyFor(key), JSON.stringify(entry));
}

export async function getCachedData<T>(key: string): Promise<CacheEntry<T> | null> {
  const raw = await getItem(keyFor(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}
