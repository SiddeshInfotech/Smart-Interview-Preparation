import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, UserCircle, Brain, LayoutDashboard, ClipboardList, FileText, CalendarClock, HelpCircle, BookOpen } from "lucide-react";
import NotificationPopup from "./NotificationPopup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import "../styles/NotificationPopup.css";

export default function PageNavbar({
  activePath = "/dashboard",
  navItems = [],
  brandLabel = "PrepMaster",
  brandHref = "/dashboard",
  brandIcon = <Brain size={28} />,
}) {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const defaultNavItems = userProfile?.role === "interviewer"
    ? [{ to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> }]
    : [
        { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
        { to: "/courses", label: "Courses", icon: <BookOpen size={18} /> },
        { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
        { to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> },
      ];

  const itemsToRender = navItems && navItems.length > 0 ? navItems : defaultNavItems;
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [usageData, setUsageData] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_user_usage");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const isInterviewer = userProfile?.role === "interviewer";
  const effectiveBrandHref = isInterviewer ? "/interview" : brandHref;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch usage data and sync to localStorage cache (Candidates only)
  const fetchUsage = useCallback(async () => {
    if (isInterviewer) return;
    try {
      const res = await api.get("/auth/usage/");
      setUsageData(res.data);
      localStorage.setItem("cached_user_usage", JSON.stringify(res.data));
    } catch (err) {
      console.warn("Could not fetch usage data", err);
    }
  }, [isInterviewer]);

  // Pre-fetch usage on mount and listen for real-time usage updates
  useEffect(() => {
    const syncUsage = () => {
      try {
        const cached = localStorage.getItem("cached_user_usage");
        if (cached) {
          setUsageData(JSON.parse(cached));
          return true;
        }
      } catch (e) {}
      return false;
    };

    if (!isInterviewer) {
      const hasCached = syncUsage();
      if (!hasCached) {
        fetchUsage();
      }
    }

    const handleUsageUpdate = () => {
      const synced = syncUsage();
      if (!synced && !isInterviewer) {
        fetchUsage();
      }
    };

    window.addEventListener("usageUpdate", handleUsageUpdate);
    return () => {
      window.removeEventListener("usageUpdate", handleUsageUpdate);
    };
  }, [fetchUsage, isInterviewer]);

  const handleToggleDropdown = () => {
    setProfileMenuOpen((open) => {
      if (!open && !isInterviewer) {
        try {
          const cached = localStorage.getItem("cached_user_usage");
          if (cached) {
            setUsageData(JSON.parse(cached));
          } else if (!usageData) {
            fetchUsage();
          }
        } catch (e) {
          if (!usageData) fetchUsage();
        }
      }
      return !open;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="top-navbar">
      <div className="navbar-container">
        <button className="navbar-brand" onClick={() => navigate(effectiveBrandHref)} type="button">
          {brandIcon}
          <span className="logo-text">{brandLabel}</span>
        </button>

        <nav className="navbar-links" aria-label="Main Navigation">
          {itemsToRender.map((item) => {
            const isActive = activePath === item.to;
            return (
              <button
                key={item.to}
                type="button"
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.to)}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="navbar-actions">
          <NotificationPopup />
          <button
            className="icon-btn theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <div className="profile-menu-container" ref={dropdownRef}>
            <button
              type="button"
              className="avatar-btn"
              onClick={handleToggleDropdown}
              aria-label="User account options"
              aria-expanded={profileMenuOpen}
            >
              <span className="avatar-inner">
                {userProfile.profilePicture ? (
                  <img src={userProfile.profilePicture} alt="Profile" />
                ) : (
                  <UserCircle size={18} />
                )}
              </span>
              <span>{userProfile.name.split(" ")[0]}</span>
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown-box">
                <div className="dropdown-user-info">
                  <strong>{userProfile.name}</strong>
                  <span>{userProfile.email}</span>
                </div>

                {/* Usage progress bars — candidate users */}
                {!isInterviewer && usageData && usageData.quiz && (
                  <div className="usage-bars-section">
                    {usageData.has_premium ? (
                      <div className="premium-badge-info" style={{ padding: '8px 12px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textAlign: 'center', margin: '4px 0' }}>
                        ⭐ Premium Plan (Unlimited Access)
                      </div>
                    ) : (
                      <>
                        <div className="usage-bar-row">
                          <div className="usage-bar-header">
                            <span className="usage-bar-label">🧠 Quiz</span>
                            <span className="usage-bar-count">
                              {usageData.quiz.remaining}/{usageData.quiz.limit} left
                            </span>
                          </div>
                          <div className="usage-bar-track">
                            <div
                              className="usage-bar-fill usage-bar-fill--quiz"
                              style={{ width: `${Math.min(100, Math.max(0, (usageData.quiz.remaining / usageData.quiz.limit) * 100))}%` }}
                            />
                          </div>
                        </div>
                        {usageData.coding && (
                          <div className="usage-bar-row">
                            <div className="usage-bar-header">
                              <span className="usage-bar-label">💻 Coding</span>
                              <span className="usage-bar-count">
                                {usageData.coding.remaining}/{usageData.coding.limit} left
                              </span>
                            </div>
                            <div className="usage-bar-track">
                              <div
                                className="usage-bar-fill usage-bar-fill--coding"
                                style={{ width: `${Math.min(100, Math.max(0, (usageData.coding.remaining / usageData.coding.limit) * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {usageData.resume && (
                          <div className="usage-bar-row">
                            <div className="usage-bar-header">
                              <span className="usage-bar-label">📄 Resume Analysis</span>
                              <span className="usage-bar-count">
                                {usageData.resume.remaining}/{usageData.resume.limit} left
                              </span>
                            </div>
                            <div className="usage-bar-track">
                              <div
                                className="usage-bar-fill usage-bar-fill--resume"
                                style={{ width: `${Math.min(100, Math.max(0, (usageData.resume.remaining / usageData.resume.limit) * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    if (userProfile.role === "interviewer") {
                      navigate("/interviewer-profile");
                    } else {
                      navigate("/candidate-profile");
                    }
                  }}
                >
                  View Profile
                </button>
                {/* Feedback button - icon and text aligned */}
                <button
                  type="button"
                  className="dropdown-item"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/feedback-form");
                  }}
                >
                  <HelpCircle size={16} />
                  <span>Feedback</span>
                </button>
                <div className="dropdown-divider" />
                <button
                  type="button"
                  className="dropdown-item logout"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
