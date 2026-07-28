import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, UserCircle, Brain, LayoutDashboard, ClipboardList, FileText, CalendarClock, HelpCircle } from "lucide-react";
import NotificationPopup from "./NotificationPopup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import "../styles/NotificationPopup.css";

export default function PageNavbar({
  activePath = "/dashboard",
  navItems = [],
  brandLabel = "PrepMaster AI",
  brandHref = "/dashboard",
  brandIcon = <Brain size={28} />,
}) {
  const defaultNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
    { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
    { to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> },
  ];

  const itemsToRender = navItems && navItems.length > 0 ? navItems : defaultNavItems;
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch usage data when dropdown opens (free users only)
  const fetchUsage = useCallback(async () => {
    try {
      const res = await api.get("/auth/usage/");
      setUsageData(res.data);
    } catch (err) {
      console.warn("Could not fetch usage data", err);
    }
  }, []);

  const handleToggleDropdown = () => {
    setProfileMenuOpen((open) => {
      if (!open) fetchUsage();
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
        <button className="navbar-brand" onClick={() => navigate(brandHref)} type="button">
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

                {/* Usage progress bars — free users only */}
                {usageData && !usageData.has_premium && (
                  <div className="usage-bars-section">
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
                          style={{ width: `${(usageData.quiz.used / usageData.quiz.limit) * 100}%` }}
                        />
                      </div>
                    </div>
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
                          style={{ width: `${(usageData.coding.used / usageData.coding.limit) * 100}%` }}
                        />
                      </div>
                    </div>
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
