import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import "../styles/AdminPanel.css";

import { fetchModels } from "../api/adminApiDynamic";

// Dynamic pages
import AdminDashboardNew from "./admin/AdminDashboardNew";
import DynamicModelPage from "./admin/DynamicModelPage";
import GlobalSearch from "./admin/GlobalSearch";

// Model icon mapping for dynamic sidebar
const MODEL_ICONS = {
  user: <IconUsers />,
  candidate_profile: <IconPerson />,
  interviewer_profile: <IconBriefcase />,
  intervieweravailability: <IconClock />,
  interviewschedule: <IconCalendar />,
  feedback: <IconStar />,
  skill: <IconBook />,
  resume: <IconFile />,
  resumeanalysis: <IconSearch />,
  notification: <IconBell />,
  otpverification: <IconShield />,
  interviewfeedbackreview: <IconStar />,
  codingsubmission: <IconBook />,
  codingquestion: <IconBook />,
  quizperformance: <IconStar />,
  usercredit: <IconStar />,
};

// Legacy path mapping to appLabel / modelName for backward compatibility
const LEGACY_PATH_MAP = {
  "users": "authentication/user",
  "candidates": "candidate/candidate_profile",
  "interviewers": "interviewer/interviewer_profile",
  "availabilities": "interviewer/intervieweravailability",
  "user-credits": "authentication/usercredit",
  "interviews": "interview/interviewschedule",
  "feedback": "feedback/feedback",
  "interview-feedback-reviews": "interview/interviewfeedbackreview",
  "coding-questions": "coding/codingquestion",
  "coding-submissions": "coding/codingsubmission",
  "quiz-performances": "quiz/quizperformance",
  "skills": "common/skill",
  "resumes": "resume/resume",
  "resume-analysis": "resume/resumeanalysis",
  "notifications": "notifications/notification",
  "otps": "authentication/otpverification",
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [admin, setAdmin] = useState(null);
  const [modelsGrouped, setModelsGrouped] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load admin user details
  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setAdmin(JSON.parse(stored));
    } catch (_) {}
  }, []);

  // Fetch dynamic model registry
  useEffect(() => {
    fetchModels()
      .then((res) => setModelsGrouped(res.data?.data || []))
      .catch(() => setModelsGrouped([]))
      .finally(() => setLoadingModels(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    navigate("/my_admin_panel/login");
  };

  const currentPath = location.pathname.replace(/\/$/, "") || "/my_admin_panel";
  const initials = admin?.full_name
    ? admin.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  // Compute breadcrumb title
  const getPageTitle = () => {
    if (currentPath === "/my_admin_panel") return "Dashboard";
    const parts = currentPath.replace("/my_admin_panel/", "").split("/");
    if (parts.length >= 2) {
      const modelName = parts[1];
      return modelName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    const legacyTarget = LEGACY_PATH_MAP[parts[0]];
    if (legacyTarget) {
      const targetModel = legacyTarget.split("/")[1];
      return targetModel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return "Admin Panel";
  };

  return (
    <div className="admin-shell">
      {/* ── Mobile Sidebar Backdrop ──────────────── */}
      <div
        className={`admin-sidebar-backdrop ${mobileSidebarOpen ? "visible" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────── */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">⚙</div>
          <div>
            <div className="admin-sidebar__title">Django Admin Wrapper</div>
            <div className="admin-sidebar__subtitle">PrepMaster Dynamic</div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {/* Dashboard static link */}
          <button
            className={`admin-nav__link ${currentPath === "/my_admin_panel" ? "active" : ""}`}
            onClick={() => {
              navigate("/my_admin_panel");
              setMobileSidebarOpen(false);
            }}
          >
            <IconGrid />
            Dashboard
          </button>

          {/* Dynamic Model Groups */}
          {loadingModels ? (
            <div style={{ padding: "12px 10px" }}>
              <div className="admin-skeleton admin-skeleton--text" style={{ width: "60%", marginBottom: 8 }} />
              <div className="admin-skeleton admin-skeleton--text" style={{ width: "80%", marginBottom: 8 }} />
              <div className="admin-skeleton admin-skeleton--text" style={{ width: "70%" }} />
            </div>
          ) : (
            modelsGrouped.map((group) => (
              <div key={group.app_label}>
                <div className="admin-nav__section-label">{group.display_name}</div>
                {group.models.map((model) => {
                  const targetPath = `/my_admin_panel/${model.app_label}/${model.model_name}`;
                  const isActive = currentPath.startsWith(targetPath);
                  const icon = MODEL_ICONS[model.model_name] || <IconBook />;

                  return (
                    <button
                      key={`${model.app_label}-${model.model_name}`}
                      className={`admin-nav__link ${isActive ? "active" : ""}`}
                      onClick={() => {
                        navigate(targetPath);
                        setMobileSidebarOpen(false);
                      }}
                    >
                      {icon}
                      <span>{model.verbose_name_plural}</span>
                      <span className="admin-nav__link-count">{model.count ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{initials}</div>
            <div className="admin-sidebar__user-info">
              <strong>{admin?.full_name || "Admin User"}</strong>
              <span>Superuser</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              className="admin-hamburger"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle navigation"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="admin-topbar__left">
              <div className="admin-topbar__page-title">{getPageTitle()}</div>
              <div className="admin-topbar__breadcrumb">Admin Panel / {getPageTitle()}</div>
            </div>
          </div>

          <div className="admin-topbar__right">
            <button
              id="admin-global-search-btn"
              className="admin-search-trigger"
              onClick={() => setIsSearchOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span>Search models…</span>
              <kbd>Ctrl+K</kbd>
            </button>

            <span className="admin-topbar__badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              </svg>
              Live
            </span>
          </div>
        </header>

        <div className="admin-content">
          <Routes>
            <Route index element={<AdminDashboardNew />} />
            
            {/* Dynamic model routes */}
            <Route path=":appLabel/:modelName/*" element={<DynamicModelPage />} />

            {/* Backward-compatible redirects for old slug routes */}
            {Object.entries(LEGACY_PATH_MAP).map(([legacySlug, target]) => (
              <Route
                key={legacySlug}
                path={`${legacySlug}/*`}
                element={<Navigate to={`/my_admin_panel/${target}`} replace />}
              />
            ))}
          </Routes>
        </div>
      </div>

      {/* ── Global Search Command Palette ─────── */}
      <GlobalSearch
        modelsGrouped={modelsGrouped}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

/* ── Inline SVG Icon Components ───────────────────────────── */
function IconGrid() { return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/></svg>; }
function IconUsers() { return <svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M16 4c1.656 0 3 1.344 3 3s-1.344 3-3 3M21 20c0-3.314-1.343-6-3-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconPerson() { return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconBriefcase() { return <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconBook() { return <svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.7"/></svg>; }
function IconCalendar() { return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconStar() { return <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
function IconFile() { return <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconSearch() { return <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconBell() { return <svg viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconShield() { return <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
