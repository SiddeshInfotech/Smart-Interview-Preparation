import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const adminApi = axios.create({ baseURL });

// Attach admin JWT token to every request
adminApi.interceptors.request.use((config) => {
  if (config.url?.includes("/admin_panel/login/")) return config;

  const token = localStorage.getItem("admin_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 responses automatically (except during initial login call)
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginReq = error.config?.url?.includes("/admin_panel/login/");
    if (
      !isLoginReq &&
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
      localStorage.removeItem("admin_user");
      if (!window.location.pathname.includes("/my_admin_panel/login")) {
        window.location.href = "/my_admin_panel/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth & Stats ────────────────────────────────────────────
export const adminLogin = (data) => adminApi.post("/admin_panel/login/", data);
export const getAdminStats = () => adminApi.get("/admin_panel/stats/");

// ── 1. Users ────────────────────────────────────────────────
export const getUsers        = ()        => adminApi.get("/admin_panel/users/");
export const getUser         = (id)      => adminApi.get(`/admin_panel/users/${id}/`);
export const createUser      = (data)    => adminApi.post("/admin_panel/users/", data);
export const updateUser      = (id, data)=> adminApi.put(`/admin_panel/users/${id}/`, data);
export const deleteUser      = (id)      => adminApi.delete(`/admin_panel/users/${id}/`);

// ── 2. Candidate Profiles ───────────────────────────────────
export const getCandidates      = ()        => adminApi.get("/admin_panel/candidate-profiles/");
export const getCandidate       = (id)      => adminApi.get(`/admin_panel/candidate-profiles/${id}/`);
export const createCandidate    = (data)    => adminApi.post("/admin_panel/candidate-profiles/", data);
export const updateCandidate    = (id, data)=> adminApi.put(`/admin_panel/candidate-profiles/${id}/`, data);
export const deleteCandidate    = (id)      => adminApi.delete(`/admin_panel/candidate-profiles/${id}/`);

// ── 3. Interviewer Profiles ─────────────────────────────────
export const getInterviewers    = ()        => adminApi.get("/admin_panel/interviewer-profiles/");
export const getInterviewer     = (id)      => adminApi.get(`/admin_panel/interviewer-profiles/${id}/`);
export const createInterviewer  = (data)    => adminApi.post("/admin_panel/interviewer-profiles/", data);
export const updateInterviewer  = (id, data)=> adminApi.put(`/admin_panel/interviewer-profiles/${id}/`, data);
export const deleteInterviewer  = (id)      => adminApi.delete(`/admin_panel/interviewer-profiles/${id}/`);

// ── 4. Interviewer Availability ──────────────────────────────
export const getAvailabilities   = ()        => adminApi.get("/admin_panel/availabilities/");
export const getAvailability    = (id)      => adminApi.get(`/admin_panel/availabilities/${id}/`);
export const createAvailability = (data)    => adminApi.post("/admin_panel/availabilities/", data);
export const updateAvailability = (id, data)=> adminApi.put(`/admin_panel/availabilities/${id}/`, data);
export const deleteAvailability = (id)      => adminApi.delete(`/admin_panel/availabilities/${id}/`);

// ── 5. Interview Schedules ──────────────────────────────────
export const getInterviews    = ()        => adminApi.get("/admin_panel/interviews/");
export const getInterview     = (id)      => adminApi.get(`/admin_panel/interviews/${id}/`);
export const createInterview  = (data)    => adminApi.post("/admin_panel/interviews/", data);
export const updateInterview  = (id, data)=> adminApi.put(`/admin_panel/interviews/${id}/`, data);
export const deleteInterview  = (id)      => adminApi.delete(`/admin_panel/interviews/${id}/`);

// ── 6. Feedback ─────────────────────────────────────────────
export const getFeedbacks    = ()        => adminApi.get("/admin_panel/feedback/");
export const getFeedback     = (id)      => adminApi.get(`/admin_panel/feedback/${id}/`);
export const createFeedback  = (data)    => adminApi.post("/admin_panel/feedback/", data);
export const updateFeedback  = (id, data)=> adminApi.put(`/admin_panel/feedback/${id}/`, data);
export const deleteFeedback  = (id)      => adminApi.delete(`/admin_panel/feedback/${id}/`);

// ── 7. Skills ───────────────────────────────────────────────
export const getSkills        = ()        => adminApi.get("/admin_panel/skills/");
export const getSkill         = (id)      => adminApi.get(`/admin_panel/skills/${id}/`);
export const createSkill      = (data)    => adminApi.post("/admin_panel/skills/", data);
export const updateSkill      = (id, data)=> adminApi.put(`/admin_panel/skills/${id}/`, data);
export const deleteSkill      = (id)      => adminApi.delete(`/admin_panel/skills/${id}/`);

// ── 8. Resumes ──────────────────────────────────────────────
export const getResumes    = ()        => adminApi.get("/admin_panel/resumes/");
export const getResume     = (id)      => adminApi.get(`/admin_panel/resumes/${id}/`);
export const createResume  = (data)    => adminApi.post("/admin_panel/resumes/", data);
export const updateResume  = (id, data)=> adminApi.put(`/admin_panel/resumes/${id}/`, data);
export const deleteResume  = (id)      => adminApi.delete(`/admin_panel/resumes/${id}/`);

// ── 9. Resume Analysis ──────────────────────────────────────
export const getResumeAnalyses   = ()        => adminApi.get("/admin_panel/resume-analysis/");
export const getResumeAnalysis   = (id)      => adminApi.get(`/admin_panel/resume-analysis/${id}/`);
export const createResumeAnalysis= (data)    => adminApi.post("/admin_panel/resume-analysis/", data);
export const updateResumeAnalysis= (id, data)=> adminApi.put(`/admin_panel/resume-analysis/${id}/`, data);
export const deleteResumeAnalysis= (id)      => adminApi.delete(`/admin_panel/resume-analysis/${id}/`);

// ── 10. Notifications ───────────────────────────────────────
export const getNotifications    = ()        => adminApi.get("/admin_panel/notifications/");
export const getNotification     = (id)      => adminApi.get(`/admin_panel/notifications/${id}/`);
export const createNotification  = (data)    => adminApi.post("/admin_panel/notifications/", data);
export const updateNotification  = (id, data)=> adminApi.put(`/admin_panel/notifications/${id}/`, data);
export const deleteNotification  = (id)      => adminApi.delete(`/admin_panel/notifications/${id}/`);

// ── 11. OTP Verification ────────────────────────────────────
export const getOtps    = ()        => adminApi.get("/admin_panel/otps/");
export const getOtp     = (id)      => adminApi.get(`/admin_panel/otps/${id}/`);
export const createOtp  = (data)    => adminApi.post("/admin_panel/otps/", data);
export const updateOtp  = (id, data)=> adminApi.put(`/admin_panel/otps/${id}/`, data);
export const deleteOtp  = (id)      => adminApi.delete(`/admin_panel/otps/${id}/`);

// ── 12. Interview Feedback Reviews ─────────────────────────
export const getInterviewFeedbackReviews    = ()        => adminApi.get("/admin_panel/interview-feedback-reviews/");
export const getInterviewFeedbackReview     = (id)      => adminApi.get(`/admin_panel/interview-feedback-reviews/${id}/`);
export const createInterviewFeedbackReview  = (data)    => adminApi.post("/admin_panel/interview-feedback-reviews/", data);
export const updateInterviewFeedbackReview  = (id, data)=> adminApi.put(`/admin_panel/interview-feedback-reviews/${id}/`, data);
export const deleteInterviewFeedbackReview  = (id, data)=> adminApi.delete(`/admin_panel/interview-feedback-reviews/${id}/`);

// ── 13. Coding Submissions ─────────────────────────────────
export const getCodingSubmissions    = ()        => adminApi.get("/admin_panel/coding-submissions/");
export const getCodingSubmission     = (id)      => adminApi.get(`/admin_panel/coding-submissions/${id}/`);
export const createCodingSubmission  = (data)    => adminApi.post("/admin_panel/coding-submissions/", data);
export const updateCodingSubmission  = (id, data)=> adminApi.put(`/admin_panel/coding-submissions/${id}/`, data);
export const deleteCodingSubmission  = (id)      => adminApi.delete(`/admin_panel/coding-submissions/${id}/`);

// ── 14. Coding Questions ───────────────────────────────────
export const getCodingQuestions      = ()        => adminApi.get("/admin_panel/coding-questions/");
export const getCodingQuestion       = (id)      => adminApi.get(`/admin_panel/coding-questions/${id}/`);
export const createCodingQuestion    = (data)    => adminApi.post("/admin_panel/coding-questions/", data);
export const updateCodingQuestion    = (id, data)=> adminApi.put(`/admin_panel/coding-questions/${id}/`, data);
export const deleteCodingQuestion    = (id)      => adminApi.delete(`/admin_panel/coding-questions/${id}/`);

// ── 15. Quiz Performances ─────────────────────────────────
export const getQuizPerformances    = ()        => adminApi.get("/admin_panel/quiz-performances/");
export const getQuizPerformance     = (id)      => adminApi.get(`/admin_panel/quiz-performances/${id}/`);
export const createQuizPerformance  = (data)    => adminApi.post("/admin_panel/quiz-performances/", data);
export const updateQuizPerformance  = (id, data)=> adminApi.put(`/admin_panel/quiz-performances/${id}/`, data);
export const deleteQuizPerformance  = (id)      => adminApi.delete(`/admin_panel/quiz-performances/${id}/`);

// ── 16. User Credits ──────────────────────────────────────
export const getUserCredits    = ()        => adminApi.get("/admin_panel/user-credits/");
export const getUserCredit     = (id)      => adminApi.get(`/admin_panel/user-credits/${id}/`);
export const createUserCredit  = (data)    => adminApi.post("/admin_panel/user-credits/", data);
export const updateUserCredit  = (id, data)=> adminApi.put(`/admin_panel/user-credits/${id}/`, data);
export const deleteUserCredit  = (id)      => adminApi.delete(`/admin_panel/user-credits/${id}/`);

export default adminApi;

