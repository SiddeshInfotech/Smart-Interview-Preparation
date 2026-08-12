// High-Performance PDF Memory & Browser Cache Service
const memoryCache = new Map();
const activeFetches = new Map();
const MAX_CACHE_ENTRIES = 25;

/**
 * Generates reliable fallback candidate URLs for PDF documents if primary cloud URL returns 404.
 */
export const getFallbackPdfUrls = (url) => {
  if (!url) return [];
  const candidateUrls = [url];

  try {
    const filename = url.split("/").pop().split("?")[0];
    if (filename) {
      // 1. Static Frontend CDN / Public asset paths (100% guaranteed uptime on Vercel/Render static bundle)
      candidateUrls.push(`/course_materials/HTML_and_CSS_Topic_PDFs/${filename}`);
      candidateUrls.push(`/course_materials/React_JS_Notes_Split/${filename}`);

      // 2. Relative static fallback
      candidateUrls.push(`/media/course_materials/2026/08/${filename}`);
    }
  } catch (e) {
    // Ignore URL parse error
  }

  return Array.from(new Set(candidateUrls));
};

/**
 * Prefetches a PDF from a given URL (or its fallbacks) into memory buffer and browser HTTP cache.
 * Returns a promise resolving to ArrayBuffer or null.
 */
export const prefetchPdf = async (url) => {
  if (!url) return null;

  const candidateUrls = getFallbackPdfUrls(url);

  for (const targetUrl of candidateUrls) {
    if (memoryCache.has(targetUrl)) {
      return memoryCache.get(targetUrl);
    }

    if (activeFetches.has(targetUrl)) {
      return activeFetches.get(targetUrl);
    }
  }

  const primaryUrl = candidateUrls[0];

  const fetchPromise = (async () => {
    for (const targetUrl of candidateUrls) {
      try {
        const response = await fetch(targetUrl, {
          mode: "cors",
          cache: "force-cache",
        });
        if (!response.ok) continue; // Try next fallback if 404

        const buffer = await response.arrayBuffer();

        // LRU Eviction if cache exceeds size
        if (memoryCache.size >= MAX_CACHE_ENTRIES) {
          const firstKey = memoryCache.keys().next().value;
          memoryCache.delete(firstKey);
        }

        memoryCache.set(targetUrl, buffer);
        memoryCache.set(primaryUrl, buffer);
        return buffer;
      } catch (err) {
        // Try next fallback
      }
    }
    return null;
  })();

  activeFetches.set(primaryUrl, fetchPromise);
  return fetchPromise;
};

/**
 * Gets cached ArrayBuffer synchronously if already fetched.
 */
export const getCachedPdfBuffer = (url) => {
  if (!url) return null;
  const candidateUrls = getFallbackPdfUrls(url);
  for (const targetUrl of candidateUrls) {
    if (memoryCache.has(targetUrl)) {
      return memoryCache.get(targetUrl);
    }
  }
  return null;
};
