import api from "./axios";

let inMemoryDashboardCache = null;
let inFlightDashboardPromise = null;

const STORAGE_KEY = "cached_dashboard_bootstrap";

/**
 * Retrieves cached dashboard data from in-memory cache or sessionStorage
 * for instant 0ms first-paint rendering on login.
 */
export const getCachedDashboardData = () => {
  if (inMemoryDashboardCache) return inMemoryDashboardCache;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        inMemoryDashboardCache = parsed.data;
        return inMemoryDashboardCache;
      }
    }
  } catch (e) {
    console.warn("[dashboardApi] Failed to parse cached dashboard data:", e);
  }
  return null;
};

/**
 * Saves dashboard data into memory and sessionStorage.
 */
export const saveCachedDashboardData = (data) => {
  if (!data) return;
  inMemoryDashboardCache = data;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch (e) {
    console.warn("[dashboardApi] Failed to save dashboard cache:", e);
  }
};

/**
 * Clears cached dashboard data to force a fresh fetch.
 */
export const clearDashboardCache = () => {
  inMemoryDashboardCache = null;
  inFlightDashboardPromise = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
};

/**
 * Fetches Dashboard Bootstrap data with in-flight request deduplication.
 * Prevents duplicate HTTP requests when React components double-mount.
 */
export const fetchDashboardBootstrap = async (force = false) => {
  const cached = getCachedDashboardData();

  if (cached && !force) {
    // Perform background revalidation if no request is in-flight
    if (!inFlightDashboardPromise) {
      inFlightDashboardPromise = api
        .get("/dashboard/bootstrap/")
        .then((res) => {
          if (res.data) saveCachedDashboardData(res.data);
          return res.data;
        })
        .catch((err) => {
          console.warn("[dashboardApi] Background refresh warning:", err);
          return cached;
        })
        .finally(() => {
          inFlightDashboardPromise = null;
        });
    }
    return cached;
  }

  if (inFlightDashboardPromise) {
    return inFlightDashboardPromise;
  }

  inFlightDashboardPromise = api
    .get("/dashboard/bootstrap/")
    .then((res) => {
      if (res.data) saveCachedDashboardData(res.data);
      return res.data;
    })
    .catch((err) => {
      console.warn("[dashboardApi] Fetch error:", err);
      throw err;
    })
    .finally(() => {
      inFlightDashboardPromise = null;
    });

  return inFlightDashboardPromise;
};

/**
 * Helper to trigger dashboard refresh when candidate completes quiz, coding, or interview.
 */
export const notifyDashboardActivityCompleted = () => {
  clearDashboardCache();
  window.dispatchEvent(new Event("dashboardUpdate"));
};
