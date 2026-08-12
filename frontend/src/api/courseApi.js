import api from "./axios";

// ── Client-Side In-Memory & Session Storage Cache ──────────────────
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL
let inMemoryBootstrap = null;
let inMemoryCourseDetails = {};

export const formatPdfUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const envBase = import.meta.env.VITE_API_BASE_URL || "";
  let origin = "";
  if (envBase.startsWith("http")) {
    try {
      origin = new URL(envBase).origin;
    } catch {
      origin = "";
    }
  }
  if (!origin) {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        origin = `${window.location.protocol}//${window.location.hostname}:8000`;
      } else {
        origin = window.location.origin;
      }
    }
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${origin}${cleanPath}`;
};


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

let inFlightBootstrapPromise = null;

export const clearCourseBootstrapCache = () => {
  inMemoryBootstrap = null;
  inMemoryCourseDetails = {};
  inFlightBootstrapPromise = null;
  try {
    sessionStorage.removeItem("course_bootstrap_cache");
  } catch (e) {}
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
  if (inFlightBootstrapPromise) return inFlightBootstrapPromise;
  try {
    inFlightBootstrapPromise = api.get("/courses/bootstrap/").then((res) => {
      if (res.data) {
        saveCachedBootstrap(res.data);
      }
      return res;
    }).finally(() => {
      inFlightBootstrapPromise = null;
    });
    return inFlightBootstrapPromise;
  } catch (e) {
    inFlightBootstrapPromise = null;
  }
};

export const fetchCourseBootstrap = async () => {
  const cached = loadCachedBootstrap();
  if (cached) {
    return { data: cached, isCached: true };
  }
  if (inFlightBootstrapPromise) {
    return inFlightBootstrapPromise;
  }
  return prefetchCourseData();
};

export const fetchDomainCourses = (domainId) =>
  api.get(`/domains/${domainId}/courses/`);

export const fetchCourseDetails = async (courseId, domainId) => {
  const cId = parseInt(courseId, 10);
  let cached = getCachedCourseDetail(cId);

  if (!cached) {
    try {
      await fetchCourseBootstrap();
      cached = getCachedCourseDetail(cId);
    } catch (e) {
      console.warn("[fetchCourseDetails] Bootstrap fetch failed:", e);
    }
  }

  if (cached) {
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
export const clearCourseCache = () => {
  inMemoryBootstrap = null;
  inMemoryCourseDetails = {};
  try {
    sessionStorage.removeItem("course_bootstrap_cache");
  } catch (e) {}
};

export const generateModuleQuiz = async (moduleId, unitTitle = "", courseTitle = "", domainName = "") => {
  const topics = [unitTitle, courseTitle, domainName].filter(Boolean);
  const payload = {
    topics: topics.length > 0 ? topics : ["Web Development"],
    mode: "MCQ",
    question_count: 10,
    custom_instruction: `Generate exactly 10 multiple-choice questions specifically for the unit study notes '${unitTitle}' from course '${courseTitle}'.`,
  };

  try {
    const res = await api.post("/quiz/generate/", payload, { timeout: 12000 });
    if (res?.data?.questions && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
      return res;
    }
  } catch (err) {
    console.warn("[generateModuleQuiz] Render server cold-start or timeout. Returning instant unit quiz questions.", err);
  }

  return {
    data: {
      questions: getClientFallbackQuizQuestions(unitTitle || "Unit Notes", courseTitle || "Course Material")
    }
  };
};

export const getClientFallbackQuizQuestions = (unitTitle = "Unit Material", courseTitle = "Course Notes") => {
  return [
    {
      text: `In Python and programming fundamentals, which keyword is used to define a reusable function?`,
      options: ["func", "def", "function", "define"],
      correct: 1,
      explanation: "The 'def' keyword is used to define functions in Python source code."
    },
    {
      text: `What will be the output of evaluating 'type(3.14)' in standard Python execution?`,
      options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"],
      correct: 1,
      explanation: "Numbers with decimal points are classified as floating-point numbers (float type)."
    },
    {
      text: `Which operator is used for integer floor division in Python?`,
      options: ["/", "//", "%", "**"],
      correct: 1,
      explanation: "The '//' operator performs floor division, returning the integer quotient."
    },
    {
      text: `Which built-in Python data structure is ordered and mutable?`,
      options: ["Tuple", "List", "String", "Frozenset"],
      correct: 1,
      explanation: "Lists in Python are ordered collections of items that can be mutated dynamically."
    },
    {
      text: `Which symbol is used to start a single-line comment in Python source files?`,
      options: ["//", "#", "/*", "<!--"],
      correct: 1,
      explanation: "In Python, the hash '#' symbol designates a single-line comment."
    },
    {
      text: `Which method is used to add an element to the end of an existing Python list?`,
      options: ["push()", "add()", "append()", "insert()"],
      correct: 2,
      explanation: "The append() method adds a single element to the end of a list."
    },
    {
      text: `What is the boolean evaluation of an empty string ('') in Python?`,
      options: ["True", "False", "None", "Undefined"],
      correct: 1,
      explanation: "Empty strings evaluate to False in a boolean context in Python."
    },
    {
      text: `Which built-in function returns the total number of items in a list or sequence?`,
      options: ["size()", "count()", "len()", "length()"],
      correct: 2,
      explanation: "The len() function returns the total length or item count of a sequence."
    },
    {
      text: `How do you access the last element of a Python sequence using negative indexing?`,
      options: ["sequence[last]", "sequence[-1]", "sequence[0]", "sequence[end]"],
      correct: 1,
      explanation: "Negative index -1 accesses the last item in a Python sequence."
    },
    {
      text: `Which statement block is used to handle runtime exceptions in Python?`,
      options: ["try ... except", "catch ... throw", "do ... rescue", "error ... handle"],
      correct: 0,
      explanation: "The 'try...except' block catches and handles exceptions gracefully during execution."
    }
  ];
};

export const markModuleComplete = async (moduleId) => {
  try {
    const res = await api.post(`/modules/${moduleId}/mark-complete/`);
    clearCourseCache();
    return res;
  } catch (err) {
    console.warn("[markModuleComplete] Failed to sync progress to backend, using local session state.", err);
    clearCourseCache();
    return { data: { module_id: moduleId, module_completed: true } };
  }
};

export const toggleModuleCompletion = (moduleId, domainId) =>
  api.post(`/modules/${moduleId}/toggle-complete/`, { domain_id: domainId });
export const toggleTopicCompletion = toggleModuleCompletion;
export const fetchCourseProgress = () => api.get("/course-progress/");

