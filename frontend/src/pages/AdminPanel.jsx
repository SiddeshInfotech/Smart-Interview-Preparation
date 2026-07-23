import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "../styles/AdminPanel.css";

// Sub-pages (All 11 Real Django Models)
import AdminDashboard       from "./admin/AdminDashboard";
import AdminUsers           from "./admin/AdminUsers";
import AdminCandidates      from "./admin/AdminCandidates";
import AdminInterviewers    from "./admin/AdminInterviewers";
import AdminAvailability    from "./admin/AdminAvailability";
import AdminInterviews      from "./admin/AdminInterviews";
import AdminFeedback        from "./admin/AdminFeedback";
import AdminSkills          from "./admin/AdminSkills";
import AdminResumes         from "./admin/AdminResumes";
import AdminResumeAnalysis  from "./admin/AdminResumeAnalysis";
import AdminNotifications   from "./admin/AdminNotifications";
import AdminOTPs            from "./admin/AdminOTPs";

// ── Sidebar nav config ─────────────────────────────────────
const NAV = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", path: "/my_admin_panel", icon: <IconGrid /> },
    ],
  },
  {
    section: "User Management",
    items: [
      { label: "Users",          path: "/my_admin_panel/users",          icon: <IconUsers /> },
      { label: "Candidates",     path: "/my_admin_panel/candidates",     icon: <IconPerson /> },
      { label: "Interviewers",   path: "/my_admin_panel/interviewers",   icon: <IconBriefcase /> },
      { label: "Availability",   path: "/my_admin_panel/availabilities", icon: <IconClock /> },
    ],
  },
  {
    section: "Interviews & Feedback",
    items: [
      { label: "Schedules", path: "/my_admin_panel/interviews", icon: <IconCalendar /> },
      { label: "Feedback",  path: "/my_admin_panel/feedback",   icon: <IconStar /> },
    ],
  },
  {
    section: "Resumes & Content",
    items: [
      { label: "Resumes",          path: "/my_admin_panel/resumes",         icon: <IconFile /> },
      { label: "Resume Analysis",  path: "/my_admin_panel/resume-analysis", icon: <IconSearch /> },
      { label: "Skills",           path: "/my_admin_panel/skills",          icon: <IconBook /> },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Notifications", path: "/my_admin_panel/notifications", icon: <IconBell /> },
      { label: "OTP Records",   path: "/my_admin_panel/otps",          icon: <IconShield /> },
    ],
  },
];

// ── Page title map ─────────────────────────────────────────
const PAGE_TITLES = {
  "/my_admin_panel":                 "Dashboard",
  "/my_admin_panel/users":           "Users",
  "/my_admin_panel/candidates":      "Candidate Profiles",
  "/my_admin_panel/interviewers":    "Interviewer Profiles",
  "/my_admin_panel/availabilities":  "Interviewer Availability",
  "/my_admin_panel/interviews":      "Interview Schedules",
  "/my_admin_panel/feedback":        "User Feedback",
  "/my_admin_panel/resumes":         "Resumes",
  "/my_admin_panel/resume-analysis": "Resume Analysis",
  "/my_admin_panel/skills":          "Skills",
  "/my_admin_panel/notifications":   "Notifications",
  "/my_admin_panel/otps":            "OTP Verification",
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("admin_user");
      if (stored) setAdmin(JSON.parse(stored));
    } catch (_) {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    localStorage.removeItem("admin_user");
    navigate("/my_admin_panel/login");
  };

  const currentPath = location.pathname.replace(/\/$/, "") || "/my_admin_panel";
  const pageTitle   = PAGE_TITLES[currentPath] || "Admin Panel";
  const initials    = admin?.full_name
    ? admin.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <div className="admin-shell">
      {/* ── Sidebar ──────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">⚙</div>
          <div>
            <div className="admin-sidebar__title">Admin Panel</div>
            <div className="admin-sidebar__subtitle">PrepMaster AI</div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          {NAV.map((group) => (
            <div key={group.section}>
              <div className="admin-nav__section-label">{group.section}</div>
              {group.items.map((item) => {
                const isActive =
                  item.path === "/my_admin_panel"
                    ? currentPath === "/my_admin_panel"
                    : currentPath.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    className={`admin-nav__link${isActive ? " active" : ""}`}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">{initials}</div>
            <div className="admin-sidebar__user-info">
              <strong>{admin?.full_name || "Admin"}</strong>
              <span>Superuser</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────── */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <div className="admin-topbar__page-title">{pageTitle}</div>
            <div className="admin-topbar__breadcrumb">
              Admin Panel / {pageTitle}
            </div>
          </div>
          <div className="admin-topbar__right">
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
            <Route index element={<AdminDashboard />} />
            <Route path="users"           element={<AdminUsers />} />
            <Route path="candidates"      element={<AdminCandidates />} />
            <Route path="interviewers"    element={<AdminInterviewers />} />
            <Route path="availabilities" element={<AdminAvailability />} />
            <Route path="interviews"      element={<AdminInterviews />} />
            <Route path="feedback"        element={<AdminFeedback />} />
            <Route path="skills"          element={<AdminSkills />} />
            <Route path="resumes"         element={<AdminResumes />} />
            <Route path="resume-analysis" element={<AdminResumeAnalysis />} />
            <Route path="notifications"   element={<AdminNotifications />} />
            <Route path="otps"            element={<AdminOTPs />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

/* ── Inline SVG icon components ───────────────────────────── */
function IconGrid()      { return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/></svg>; }
function IconUsers()     { return <svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M16 4c1.656 0 3 1.344 3 3s-1.344 3-3 3M21 20c0-3.314-1.343-6-3-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconPerson()    { return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/><path d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconBriefcase() { return <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconClock()     { return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconBook()      { return <svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.7"/></svg>; }
function IconCalendar()  { return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconStar()      { return <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
function IconFile()      { return <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconSearch()    { return <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>; }
function IconBell()      { return <svg viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function IconShield()    { return <svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>; }
