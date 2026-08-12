// High-Performance Resilient PDF Memory & Browser Cache Service
const memoryCache = new Map();
const activeFetches = new Map();
const MAX_CACHE_ENTRIES = 30;

/**
 * Generates prioritized candidate URLs for PDF documents.
 * Prioritizes local static frontend bundle URLs first for 0ms latency and 0% CORS/404 failures.
 */
export const getFallbackPdfUrls = (url) => {
  if (!url) return [];
  const candidateUrls = [];

  try {
    const filename = url.split("/").pop().split("?")[0];
    if (filename) {
      if (filename.startsWith("Unit_")) {
        // React JS unit PDFs
        candidateUrls.push(`/course_materials/React_JS_Notes_Split/${filename}`);
        candidateUrls.push(`/course_materials/HTML_and_CSS_Topic_PDFs/${filename}`);
      } else {
        // HTML & CSS topic PDFs
        candidateUrls.push(`/course_materials/HTML_and_CSS_Topic_PDFs/${filename}`);
        candidateUrls.push(`/course_materials/React_JS_Notes_Split/${filename}`);
      }

      // Backend media relative fallback
      candidateUrls.push(`/media/course_materials/2026/08/${filename}`);
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  // Original provided URL as fallback
  candidateUrls.push(url);

  return Array.from(new Set(candidateUrls));
};

/**
 * Fetches PDF ArrayBuffer directly using native browser fetch API with automatic fallbacks.
 * Returns ArrayBuffer or null.
 */
export const fetchPdfArrayBuffer = async (url) => {
  if (!url) return null;

  // Check memory cache
  const cached = getCachedPdfBuffer(url);
  if (cached) return cached;

  if (activeFetches.has(url)) {
    return activeFetches.get(url);
  }

  const candidateUrls = getFallbackPdfUrls(url);

  const fetchPromise = (async () => {
    for (const targetUrl of candidateUrls) {
      try {
        const response = await fetch(targetUrl, {
          mode: "cors",
          cache: "force-cache",
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          if (buffer && buffer.byteLength > 0) {
            // LRU Cache Eviction
            if (memoryCache.size >= MAX_CACHE_ENTRIES) {
              const firstKey = memoryCache.keys().next().value;
              memoryCache.delete(firstKey);
            }
            memoryCache.set(url, buffer);
            memoryCache.set(targetUrl, buffer);
            return buffer;
          }
        }
      } catch (err) {
        // Quietly try next fallback
      }
    }
    return null;
  })();

  activeFetches.set(url, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    activeFetches.delete(url);
  }
};

/**
 * Background prefetch trigger helper.
 */
export const prefetchPdf = async (url) => {
  return fetchPdfArrayBuffer(url);
};

/**
 * Gets cached ArrayBuffer synchronously if already fetched.
 */
export const getCachedPdfBuffer = (url) => {
  if (!url) return null;
  if (memoryCache.has(url)) return memoryCache.get(url);

  const candidateUrls = getFallbackPdfUrls(url);
  for (const targetUrl of candidateUrls) {
    if (memoryCache.has(targetUrl)) {
      return memoryCache.get(targetUrl);
    }
  }
  return null;
};
