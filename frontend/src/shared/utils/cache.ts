/**
 * cache.ts
 *
 * A lightweight localStorage cache with a configurable TTL.
 * Used to store Google Civic API responses for 24 hours to minimize API calls.
 */

/** Default TTL: 24 hours in milliseconds */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  /** Unix timestamp (ms) when this entry was stored */
  timestamp: number;
  /** Unix timestamp (ms) when this entry expires */
  expiresAt: number;
}

/**
 * Stores a value in localStorage under the given key with an expiry timestamp.
 *
 * @param key - The cache key
 * @param data - The data to cache (must be JSON-serializable)
 * @param ttlMs - Time-to-live in milliseconds (default: 24 hours)
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    // localStorage may be unavailable (private browsing, quota exceeded)
    console.warn('[Cache] Could not write to localStorage:', err);
  }
}

/**
 * Retrieves a value from localStorage if it exists and has not expired.
 * Automatically removes stale entries.
 *
 * @param key - The cache key
 * @returns The cached value, or null if missing/expired
 */
export function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const entry = JSON.parse(raw) as CacheEntry<T>;

    if (Date.now() > entry.expiresAt) {
      // Entry expired — clean it up
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (err) {
    console.warn('[Cache] Could not read from localStorage:', err);
    return null;
  }
}

/**
 * Removes a specific key from the cache.
 *
 * @param key - The cache key to remove
 */
export function cacheDelete(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[Cache] Could not delete from localStorage:', err);
  }
}

/**
 * Constructs a deterministic cache key for a civic address lookup.
 *
 * @param address - The voter's address string
 * @returns A localStorage key string
 */
export function civicCacheKey(address: string): string {
  // Normalize the address to prevent duplicate cache entries
  return `civic_${address.toLowerCase().trim().replace(/\s+/g, '_')}`;
}
