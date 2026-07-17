import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, UserCircle, Brain } from "lucide-react";
import api from "../api/authAPI";
import NotificationPopup from "./NotificationPopup";
import "../styles/Profile.css";
import "../styles/NotificationPopup.css";

export default function PageNavbar({
  activePath = "/dashboard",
  navItems = [],
  brandLabel = "PrepMaster AI",
  brandHref = "/dashboard",
  brandIcon = <Brain size={28} />,
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    email: "",
    profilePicture: null,
    role: "candidate",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      let name = "User";
      let email = "";
      let profilePic = null;
      let role = "candidate";

      try {
        const authRes = await api.get("/auth/profile/");
        if (authRes.data) {
          name = authRes.data.full_name || name;
          email = authRes.data.email || email;
          role = authRes.data.role || role;
        }
      } catch (error) {
        console.error("Error fetching auth profile:", error);
      }

      try {
        if (role === "interviewer") {
          const intRes = await api.get("/interviewer/profile/");
          if (intRes.data && intRes.data.profile_picture) {
            const pic = intRes.data.profile_picture;
            profilePic = pic.startsWith("http") ? pic : `http://127.0.0.1:8000${pic}`;
          }
        } else {
          const candRes = await api.get("/candidate/profile/");
          if (candRes.data && candRes.data.profile_picture) {
            const pic = candRes.data.profile_picture;
            profilePic = pic.startsWith("http") ? pic : `http://127.0.0.1:8000${pic}`;
          }
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }

      setUserProfile({
        name,
        email,
        profilePicture: profilePic,
        role,
      });
    };

    fetchProfileData();
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
        {navItems.map((item) => {
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
          <button className="icon-btn" type="button" aria-label="Settings">
            <Settings size={19} />
          </button>

          <div className="profile-menu-container" ref={dropdownRef}>
          <button
            type="button"
            className="avatar-btn"
            onClick={() => setProfileMenuOpen((open) => !open)}
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
                <button type="button" className="dropdown-item disabled" disabled>
                  Settings
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