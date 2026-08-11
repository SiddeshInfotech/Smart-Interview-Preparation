import api from "./axios";

// ── Client-Side In-Memory & Session Storage Cache ──────────────────
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
let inMemoryBootstrap = null;
let inMemoryCourseDetails = {};

const loadCachedBootstrap = () => {
  if (inMemoryBootstrap) return inMemoryBootstrap;
  try {
    const raw = sessionStorage.getItem("course_bootstrap_cache");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        inMemoryBootstrap = parsed.data;
        if (parsed.data?.courses) {
          parsed.data.courses.forEach((c) => {
            inMemoryCourseDetails[c.course_id] = c;
          });
        }
        return inMemoryBootstrap;
      }
    }
  } catch (e) {
    console.warn("Failed to parse course cache:", e);
  }
  return null;
};

const saveCachedBootstrap = (data) => {
  inMemoryBootstrap = data;
  try {
    sessionStorage.setItem(
      "course_bootstrap_cache",
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (e) {}

  if (data?.courses) {
    data.courses.forEach((c) => {
      inMemoryCourseDetails[c.course_id] = c;
    });
  }
};

export const getCachedBootstrapData = () => loadCachedBootstrap();

export const getCachedCourseDetail = (courseId) => {
  const cId = parseInt(courseId, 10);
  if (inMemoryCourseDetails[cId]) return inMemoryCourseDetails[cId];
  const bootstrap = loadCachedBootstrap();
  if (bootstrap?.courses) {
    const found = bootstrap.courses.find((c) => c.course_id === cId);
    if (found) {
      inMemoryCourseDetails[cId] = found;
      return found;
    }
  }
  return null;
};

export const prefetchCourseData = async () => {
  try {
    const res = await api.get("/courses/bootstrap/");
    if (res.data) {
      saveCachedBootstrap(res.data);
    }
  } catch (e) {
    // Background fetch - silent catch
  }
};

export const fetchCourseBootstrap = async () => {
  const cached = loadCachedBootstrap();
  if (cached) {
    // Return cached immediately (0ms delay) and refresh in background (SWR)
    prefetchCourseData();
    return { data: cached, isCached: true };
  }
  const res = await api.get("/courses/bootstrap/");
  if (res.data) {
    saveCachedBootstrap(res.data);
  }
  return res;
};

export const fetchDomainCourses = (domainId) =>
  api.get(`/domains/${domainId}/courses/`);

export const fetchCourseDetails = async (courseId, domainId) => {
  const cId = parseInt(courseId, 10);
  const cached = getCachedCourseDetail(cId);
  if (cached) {
    // Background revalidation
    api
      .get(`/courses/${cId}/`, {
        params: domainId ? { domain_id: domainId } : {},
      })
      .then((res) => {
        if (res.data) {
          inMemoryCourseDetails[cId] = res.data;
        }
      })
      .catch(() => {});
    return { data: cached, isCached: true };
  }

  const res = await api.get(`/courses/${cId}/`, {
    params: domainId ? { domain_id: domainId } : {},
  });
  if (res.data) {
    inMemoryCourseDetails[cId] = res.data;
  }
  return res;
};

export const switchActiveDomain = async (domainId) => {
  const res = await api.put("/profile/active-domain/", { domain_id: domainId });
  if (res.data?.active_domain && res.data?.courses) {
    const cached = loadCachedBootstrap() || {};
    const updatedBootstrap = {
      ...cached,
      active_domain: res.data.active_domain,
      courses: res.data.courses,
    };
    saveCachedBootstrap(updatedBootstrap);
  }
  return res;
};

export const fetchAvailableDomains = () => api.get("/domains/");
export const fetchActiveDomain = () => api.get("/profile/active-domain/");
export const fetchCourseModules = (courseId, domainId) =>
  api.get(`/courses/${courseId}/modules/`, {
    params: domainId ? { domain_id: domainId } : {},
  });
export const toggleModuleCompletion = (moduleId, domainId) =>
  api.post(`/modules/${moduleId}/toggle-complete/`, { domain_id: domainId });
export const toggleTopicCompletion = toggleModuleCompletion;
export const fetchCourseProgress = () => api.get("/course-progress/");
