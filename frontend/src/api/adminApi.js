// src/api/adminApi.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const adminApi = axios.create({ baseURL });

// Attach admin JWT token to every request
adminApi.interceptors.request.use((config) => {
  // Admin login endpoint does not need a token
  if (config.url?.includes("/admin_panel/login/")) return config;

  const token = localStorage.getItem("admin_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ────────────────────────────────────────────────────
export const adminLogin = (data) => adminApi.post("/admin_panel/login/", data);

// ── Stats ───────────────────────────────────────────────────
export const getAdminStats = () => adminApi.get("/admin_panel/stats/");

// ── Users ───────────────────────────────────────────────────
export const getUsers        = ()        => adminApi.get("/admin_panel/users/");
export const getUser         = (id)      => adminApi.get(`/admin_panel/users/${id}/`);
export const createUser      = (data)    => adminApi.post("/admin_panel/users/", data);
export const updateUser      = (id, data)=> adminApi.put(`/admin_panel/users/${id}/`, data);
export const deleteUser      = (id)      => adminApi.delete(`/admin_panel/users/${id}/`);

// ── Candidate Profiles ──────────────────────────────────────
export const getCandidates      = ()        => adminApi.get("/admin_panel/candidate-profiles/");
export const getCandidate       = (id)      => adminApi.get(`/admin_panel/candidate-profiles/${id}/`);
export const createCandidate    = (data)    => adminApi.post("/admin_panel/candidate-profiles/", data);
export const updateCandidate    = (id, data)=> adminApi.put(`/admin_panel/candidate-profiles/${id}/`, data);
export const deleteCandidate    = (id)      => adminApi.delete(`/admin_panel/candidate-profiles/${id}/`);

// ── Interviewer Profiles ────────────────────────────────────
export const getInterviewers    = ()        => adminApi.get("/admin_panel/interviewer-profiles/");
export const getInterviewer     = (id)      => adminApi.get(`/admin_panel/interviewer-profiles/${id}/`);
export const createInterviewer  = (data)    => adminApi.post("/admin_panel/interviewer-profiles/", data);
export const updateInterviewer  = (id, data)=> adminApi.put(`/admin_panel/interviewer-profiles/${id}/`, data);
export const deleteInterviewer  = (id)      => adminApi.delete(`/admin_panel/interviewer-profiles/${id}/`);

// ── Question Bank ───────────────────────────────────────────
export const getQuestions    = ()        => adminApi.get("/admin_panel/questions/");
export const getQuestion     = (id)      => adminApi.get(`/admin_panel/questions/${id}/`);
export const createQuestion  = (data)    => adminApi.post("/admin_panel/questions/", data);
export const updateQuestion  = (id, data)=> adminApi.put(`/admin_panel/questions/${id}/`, data);
export const deleteQuestion  = (id)      => adminApi.delete(`/admin_panel/questions/${id}/`);

// ── Interview Schedules ─────────────────────────────────────
export const getInterviews    = ()        => adminApi.get("/admin_panel/interviews/");
export const getInterview     = (id)      => adminApi.get(`/admin_panel/interviews/${id}/`);
export const createInterview  = (data)    => adminApi.post("/admin_panel/interviews/", data);
export const updateInterview  = (id, data)=> adminApi.put(`/admin_panel/interviews/${id}/`, data);
export const deleteInterview  = (id)      => adminApi.delete(`/admin_panel/interviews/${id}/`);

// ── Interview Sessions ──────────────────────────────────────
export const getSessions    = ()        => adminApi.get("/admin_panel/sessions/");
export const getSession     = (id)      => adminApi.get(`/admin_panel/sessions/${id}/`);
export const createSession  = (data)    => adminApi.post("/admin_panel/sessions/", data);
export const updateSession  = (id, data)=> adminApi.put(`/admin_panel/sessions/${id}/`, data);
export const deleteSession  = (id)      => adminApi.delete(`/admin_panel/sessions/${id}/`);

// ── Interview Feedback ──────────────────────────────────────
export const getFeedbacks    = ()        => adminApi.get("/admin_panel/feedback/");
export const getFeedback     = (id)      => adminApi.get(`/admin_panel/feedback/${id}/`);
export const createFeedback  = (data)    => adminApi.post("/admin_panel/feedback/", data);
export const updateFeedback  = (id, data)=> adminApi.put(`/admin_panel/feedback/${id}/`, data);
export const deleteFeedback  = (id)      => adminApi.delete(`/admin_panel/feedback/${id}/`);

// ── Performance Analytics ───────────────────────────────────
export const getAnalytics    = ()        => adminApi.get("/admin_panel/analytics/");
export const getAnalytic     = (id)      => adminApi.get(`/admin_panel/analytics/${id}/`);
export const createAnalytic  = (data)    => adminApi.post("/admin_panel/analytics/", data);
export const updateAnalytic  = (id, data)=> adminApi.put(`/admin_panel/analytics/${id}/`, data);
export const deleteAnalytic  = (id)      => adminApi.delete(`/admin_panel/analytics/${id}/`);

// ── Resumes ─────────────────────────────────────────────────
export const getResumes    = ()        => adminApi.get("/admin_panel/resumes/");
export const getResume     = (id)      => adminApi.get(`/admin_panel/resumes/${id}/`);
export const createResume  = (data)    => adminApi.post("/admin_panel/resumes/", data);
export const updateResume  = (id, data)=> adminApi.put(`/admin_panel/resumes/${id}/`, data);
export const deleteResume  = (id)      => adminApi.delete(`/admin_panel/resumes/${id}/`);

// ── Resume Analysis ─────────────────────────────────────────
export const getResumeAnalyses   = ()        => adminApi.get("/admin_panel/resume-analysis/");
export const getResumeAnalysis   = (id)      => adminApi.get(`/admin_panel/resume-analysis/${id}/`);
export const createResumeAnalysis= (data)    => adminApi.post("/admin_panel/resume-analysis/", data);
export const updateResumeAnalysis= (id, data)=> adminApi.put(`/admin_panel/resume-analysis/${id}/`, data);
export const deleteResumeAnalysis= (id)      => adminApi.delete(`/admin_panel/resume-analysis/${id}/`);

// ── Session Questions ───────────────────────────────────────
export const getSessionQuestions    = ()        => adminApi.get("/admin_panel/session-questions/");
export const getSessionQuestion     = (id)      => adminApi.get(`/admin_panel/session-questions/${id}/`);
export const createSessionQuestion  = (data)    => adminApi.post("/admin_panel/session-questions/", data);
export const updateSessionQuestion  = (id, data)=> adminApi.put(`/admin_panel/session-questions/${id}/`, data);
export const deleteSessionQuestion  = (id)      => adminApi.delete(`/admin_panel/session-questions/${id}/`);

// ── Coding Submissions ──────────────────────────────────────
export const getSubmissions    = ()        => adminApi.get("/admin_panel/submissions/");
export const getSubmission     = (id)      => adminApi.get(`/admin_panel/submissions/${id}/`);
export const createSubmission  = (data)    => adminApi.post("/admin_panel/submissions/", data);
export const updateSubmission  = (id, data)=> adminApi.put(`/admin_panel/submissions/${id}/`, data);
export const deleteSubmission  = (id)      => adminApi.delete(`/admin_panel/submissions/${id}/`);

// ── Notifications ───────────────────────────────────────────
export const getNotifications    = ()        => adminApi.get("/admin_panel/notifications/");
export const getNotification     = (id)      => adminApi.get(`/admin_panel/notifications/${id}/`);
export const createNotification  = (data)    => adminApi.post("/admin_panel/notifications/", data);
export const updateNotification  = (id, data)=> adminApi.put(`/admin_panel/notifications/${id}/`, data);
export const deleteNotification  = (id)      => adminApi.delete(`/admin_panel/notifications/${id}/`);

// ── OTP Verification ────────────────────────────────────────
export const getOtps    = ()        => adminApi.get("/admin_panel/otps/");
export const getOtp     = (id)      => adminApi.get(`/admin_panel/otps/${id}/`);
export const createOtp  = (data)    => adminApi.post("/admin_panel/otps/", data);
export const updateOtp  = (id, data)=> adminApi.put(`/admin_panel/otps/${id}/`, data);
export const deleteOtp  = (id)      => adminApi.delete(`/admin_panel/otps/${id}/`);

export default adminApi;
