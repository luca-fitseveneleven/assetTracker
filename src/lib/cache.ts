/**
 * In-memory caching layer with TTL expiration.
 *
 * Public API:
 *  - `cache.get(key)`                      — retrieve a cached value
 *  - `cache.set(key, value, ttlSeconds)`   — store a value with TTL
 *  - `cache.del(key)`                      — delete a single key
 *  - `cache.invalidatePattern(prefix)`     — delete all keys matching a prefix
 *  - `cached(key, fetcher, ttlMs)`         — fetch-through helper (backward compatible)
 *  - `invalidateCache(key)`                — delete a single key (alias)
 *  - `invalidateCacheByPrefix(prefix)`     — delete keys by prefix (alias)
 *  - `clearCache()`                        — remove all cached entries
 */

// ---------------------------------------------------------------------------
// Cache backend
// ---------------------------------------------------------------------------

interface MemoryEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

class MemoryCacheBackend {
  private store = new Map<string, MemoryEntry>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as MemoryEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

const backend = new MemoryCacheBackend();

// ---------------------------------------------------------------------------
// Public cache object
// ---------------------------------------------------------------------------

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    return backend.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    backend.set(key, value, ttlSeconds);
  },

  async del(key: string): Promise<void> {
    backend.del(key);
  },

  async invalidatePattern(prefix: string): Promise<void> {
    backend.invalidatePattern(prefix);
  },

  async clear(): Promise<void> {
    backend.clear();
  },
};

// ---------------------------------------------------------------------------
// Backward-compatible helpers (used by data.ts and API routes)
// ---------------------------------------------------------------------------

/**
 * Get or set cached data with TTL.
 * @param key    Cache key
 * @param fetcher Async function to fetch data on cache miss
 * @param ttlMs  Time to live in milliseconds (default 5 minutes)
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000,
): Promise<T> {
  const existing = backend.get<T>(key);
  if (existing !== null) {
    return existing;
  }

  const data = await fetcher();
  const ttlSeconds = Math.max(1, Math.round(ttlMs / 1000));
  backend.set(key, data, ttlSeconds);
  return data;
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  backend.del(key);
}

/**
 * Invalidate all cache keys matching a prefix.
 */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  backend.invalidatePattern(prefix);
}

/**
 * Clear entire cache.
 */
export async function clearCache(): Promise<void> {
  backend.clear();
}

/**
 * Cache invalidation guide for API routes:
 *
 * When an API route modifies reference data (create, update, or delete),
 * call invalidateCache() with the appropriate key after the successful
 * database operation.
 *
 * Cache keys used by reference data functions in src/lib/data.ts:
 *   - "status_types"   -> invalidate after modifying statusType records
 *   - "categories"     -> invalidate after modifying assetCategoryType records
 *   - "manufacturers"  -> invalidate after modifying manufacturer records
 *   - "models"         -> invalidate after modifying model records
 *   - "locations"      -> invalidate after modifying location records
 *   - "suppliers"      -> invalidate after modifying supplier records
 *   - "users"          -> invalidate after modifying user records
 *
 * Example usage in an API route:
 *
 *   import { invalidateCache } from "@/lib/cache";
 *
 *   // After a successful create/update/delete:
 *   await prisma.statusType.create({ data: { ... } });
 *   await invalidateCache("status_types");
 */
