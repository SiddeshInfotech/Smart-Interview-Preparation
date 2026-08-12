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

export const clearCourseBootstrapCache = () => {
  inMemoryBootstrap = null;
  inMemoryCourseDetails = {};
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
      text: `What is a core concept or key topic covered in '${unitTitle}'?`,
      options: [
        `Syntax, fundamentals, and core concepts of ${unitTitle}`,
        "Unrelated legacy operating system protocols",
        "Deprecating dynamic data types without boundaries",
        "Bypassing application execution pipelines"
      ],
      correct: 0,
      explanation: `In '${unitTitle}', understanding the core syntax, fundamentals, and structure is essential for mastering ${courseTitle}.`
    },
    {
      text: `Which of the following represents a recommended best practice when working with ${unitTitle}?`,
      options: [
        "Skipping input validation and error handling",
        `Writing modular, well-structured code adhering to ${unitTitle} standards`,
        "Hardcoding configuration parameters into binary files",
        "Disabling compiler warnings and logging diagnostics"
      ],
      correct: 1,
      explanation: `Writing clean, modular code with clear structure ensures long-term maintainability when studying ${unitTitle}.`
    },
    {
      text: `What is the primary benefit of breaking study materials down into units like '${unitTitle}'?`,
      options: [
        "Increasing global variable mutation rate",
        "Improving learning retention through structured, topic-focused mastery",
        "Disabling automated unit testing suites",
        "Preventing version control repository tracking"
      ],
      correct: 1,
      explanation: "Topic-focused units allow candidates to master specific domains step-by-step before assessing overall performance."
    },
    {
      text: `When applying concepts from '${unitTitle}', how should exceptional cases or errors be handled?`,
      options: [
        "By ignoring failure notifications completely",
        "By catching exceptions gracefully and logging informative diagnostics",
        "By terminating system execution without state cleanup",
        "By suppressing runtime log output"
      ],
      correct: 1,
      explanation: "Proper error handling prevents system crashes, preserves application state, and improves user experience."
    },
    {
      text: `Which statement accurately describes effective implementation in ${courseTitle}?`,
      options: [
        "All components must be contained within a single file",
        "Components should be decoupled, reusable, and clearly specified",
        "Testing should only take place after final deployment",
        "Data structures must remain unvalidated"
      ],
      correct: 1,
      explanation: "Decoupled and reusable components allow faster feature iteration and simplified debugging."
    },
    {
      text: `What role does verification play after completing a unit like '${unitTitle}'?`,
      options: [
        "Slowing down system compilation steps",
        "Confirming topic understanding and identifying areas for review",
        "Deleting historical progress logs",
        "Bypassing domain skill checks"
      ],
      correct: 1,
      explanation: "Quizzes verify candidate comprehension and reinforce knowledge retention before moving to subsequent units."
    },
    {
      text: `How does structured study of ${unitTitle} contribute to overall technical interview performance?`,
      options: [
        "It builds foundational knowledge required for problem-solving under pressure",
        "It restricts candidate responses to memorized definitions",
        "It eliminates the need for practical coding exercises",
        "It lowers candidate confidence"
      ],
      correct: 0,
      explanation: "A solid grasp of unit fundamentals enables candidates to explain architectural choices clearly during technical interviews."
    },
    {
      text: `Which of the following is crucial when managing data structures in ${unitTitle}?`,
      options: [
        "Enforcing type consistency, immutability where appropriate, and clean access patterns",
        "Allowing arbitrary global mutations from nested functions",
        "Removing schema validation rules",
        "Relying solely on implicit string coercion"
      ],
      correct: 0,
      explanation: "Clean data patterns prevent state corruption and reduce runtime bugs."
    },
    {
      text: `What is an important optimization consideration for applications built with ${courseTitle}?`,
      options: [
        "Minimizing redundant computations, I/O operations, and network roundtrips",
        "Increasing memory allocations arbitrarily",
        "Removing cache control headers",
        "Disabling asynchronous request processing"
      ],
      correct: 0,
      explanation: "Optimizing I/O, database access, and network requests produces fast, responsive user experiences."
    },
    {
      text: `What is the passing score requirement for completing the unit quiz on '${unitTitle}'?`,
      options: [
        "1 out of 10 questions correct",
        "At least 4 out of 10 questions correct (40%)",
        "10 out of 10 questions correct (100%)",
        "No passing threshold required"
      ],
      correct: 1,
      explanation: "Scoring at least 4 out of 10 correct answers (40%) marks the unit notes as completed and displays the Completed badge."
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

