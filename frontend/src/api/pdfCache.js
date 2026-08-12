// High-Performance Resilient PDF Memory & Browser Cache Service
const memoryCache = new Map();
const activeFetches = new Map();
const MAX_CACHE_ENTRIES = 40;

/**
 * Validates that an ArrayBuffer actually contains binary PDF data (starts with '%PDF' magic header).
 * Prevents HTML fallback pages (e.g., index.html 404 routes) from corrupting the PDF worker.
 */
export const isValidPdfBuffer = (buffer) => {
  if (!buffer || buffer.byteLength < 4) return false;
  const header = new Uint8Array(buffer, 0, 4);
  return (
    header[0] === 0x25 && // '%' (37)
    header[1] === 0x50 && // 'P' (80)
    header[2] === 0x44 && // 'D' (68)
    header[3] === 0x46    // 'F' (70)
  );
};

/**
 * Generates prioritized candidate URLs for PDF documents based on filename signatures.
 */
export const getFallbackPdfUrls = (url) => {
  if (!url) return [];
  const candidateUrls = [];

  try {
    const filename = url.split("/").pop().split("?")[0];
    if (filename) {
      // 1. Target primary backend media URL if present
      if (url.startsWith("http") || url.startsWith("/")) {
        candidateUrls.push(url);
      }

      // 2. Target specific static folder by filename signature
      if (filename.includes("Django") || filename.startsWith("Unit_1_Django") || filename.startsWith("Unit_5_Django")) {
        candidateUrls.push(`/course_materials/Django_Notes_Topic_PDFs/${filename}`);
      } else if (filename.includes("Intro_and_Installation") || filename.includes("Data_Types_Variables") || filename.startsWith("Unit_01_Intro_Data")) {
        candidateUrls.push(`/course_materials/Python_Notes_Topic_PDFs/${filename}`);
      } else if (filename.startsWith("Unit_") && !filename.includes("Django")) {
        candidateUrls.push(`/course_materials/React_JS_Notes_Split/${filename}`);
      } else {
        candidateUrls.push(`/course_materials/HTML_and_CSS_Topic_PDFs/${filename}`);
      }

      // 3. Fallback to all other static asset folders
      candidateUrls.push(`/course_materials/HTML_and_CSS_Topic_PDFs/${filename}`);
      candidateUrls.push(`/course_materials/React_JS_Notes_Split/${filename}`);
      candidateUrls.push(`/course_materials/Python_Notes_Topic_PDFs/${filename}`);
      candidateUrls.push(`/course_materials/Django_Notes_Topic_PDFs/${filename}`);

      // 4. Relative backend media route
      candidateUrls.push(`/media/course_materials/2026/08/${filename}`);
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  candidateUrls.push(url);
  return Array.from(new Set(candidateUrls));
};

/**
 * Fetches PDF ArrayBuffer directly using native browser fetch API with magic byte verification.
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

        // Reject HTML fallback responses (e.g. index.html)
        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || contentType.includes("text/html")) {
          continue;
        }

        const buffer = await response.arrayBuffer();

        // Verify magic bytes '%PDF'
        if (isValidPdfBuffer(buffer)) {
          // LRU Cache Eviction
          if (memoryCache.size >= MAX_CACHE_ENTRIES) {
            const firstKey = memoryCache.keys().next().value;
            memoryCache.delete(firstKey);
          }
          memoryCache.set(url, buffer);
          memoryCache.set(targetUrl, buffer);
          return buffer;
        }
      } catch (err) {
        // Quietly try next candidate
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
  if (memoryCache.has(url)) {
    const buf = memoryCache.get(url);
    if (isValidPdfBuffer(buf)) return buf;
  }

  const candidateUrls = getFallbackPdfUrls(url);
  for (const targetUrl of candidateUrls) {
    if (memoryCache.has(targetUrl)) {
      const buf = memoryCache.get(targetUrl);
      if (isValidPdfBuffer(buf)) return buf;
    }
  }
  return null;
};
