// High-Performance PDF Memory & Browser Cache Service
const memoryCache = new Map();
const activeFetches = new Map();
const MAX_CACHE_ENTRIES = 20;

/**
 * Prefetches a PDF from a given URL into memory buffer and browser HTTP cache.
 * Returns a promise resolving to ArrayBuffer or null.
 */
export const prefetchPdf = async (url) => {
  if (!url) return null;

  if (memoryCache.has(url)) {
    return memoryCache.get(url);
  }

  if (activeFetches.has(url)) {
    return activeFetches.get(url);
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        mode: "cors",
        cache: "force-cache",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();

      // LRU Eviction if cache exceeds size
      if (memoryCache.size >= MAX_CACHE_ENTRIES) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
      }

      memoryCache.set(url, buffer);
      return buffer;
    } catch (err) {
      console.warn("Background PDF prefetch notice:", url, err.message);
      return null;
    } finally {
      activeFetches.delete(url);
    }
  })();

  activeFetches.set(url, fetchPromise);
  return fetchPromise;
};

/**
 * Gets cached ArrayBuffer synchronously if already fetched.
 */
export const getCachedPdfBuffer = (url) => {
  return memoryCache.get(url) || null;
};
