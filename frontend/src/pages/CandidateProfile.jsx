import React, { useState, useRef, useEffect } from "react";
import "../styles/CandidateProfile.css";
import {
  LayoutDashboard,
  Brain,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  User,
  GraduationCap,
  Briefcase,
  Save,
  Menu,
  X,
  Globe,
  Plus,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/authAPI";   // <-- IMPORT THE AXIOS INSTANCE

const CandidateProfile = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Profile form state ---
  const [profile, setProfile] = useState({
    date_of_birth: null,
    gender: "",
    location: "",
    education: "",
    experience_years: 0,
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  // --- Profile picture state ---
  const [profilePicture, setProfilePicture] = useState(null);

  // --- Skills state ---
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Refs ---
  const profileRef = useRef(null);
  const educationRef = useRef(null);
  const skillsExperienceRef = useRef(null);
  const digitalPresenceRef = useRef(null);
  const suggestionRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Fetch profile on mount ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/candidate/profile/");
        const data = response.data;

        setProfile({
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
          gender: data.gender || "",
          location: data.location || "",
          education: data.education || "",
          experience_years: data.experience_years || 0,
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          portfolio_url: data.portfolio_url || "",
        });

        setProfilePicture(data.profile_picture || null);

        if (data.skills) {
          const skillNames = data.skills.split(",").map((s) => s.trim()).filter(Boolean);
          setSkills(
            skillNames.map((name, index) => ({
              id: `existing-${Date.now()}-${index}`,
              skill_name: name,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- Resize handler for sidebar ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 769) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Click outside to close suggestions ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Debounced skill suggestions ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (newSkill.trim().length >= 1) {
        fetchSkillSuggestions(newSkill.trim());
      } else {
        setSkillSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [newSkill]);

  // --- Navigation functions ---
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    const refs = {
      profile: profileRef,
      education: educationRef,
      skillsExperience: skillsExperienceRef,
      digitalPresence: digitalPresenceRef,
    };
    scrollToSection(refs[section]);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // --- Skill suggestions API (using axios) ---
  const fetchSkillSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get(`/common/skills/?search=${encodeURIComponent(query)}`);
      setSkillSuggestions(response.data);
      setShowSuggestions(response.data.length > 0);
    } catch (error) {
      console.error("Error fetching skills:", error);
      setSkillSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addSkillFromSuggestion = (skill) => {
    if (!skills.some((s) => s.skill_name.toLowerCase() === skill.skill_name.toLowerCase())) {
      setSkills([...skills, { id: skill.id, skill_name: skill.skill_name }]);
    }
    setNewSkill("");
    setShowSuggestions(false);
  };

  const handleAddSkill = (e) => {
    if (e.key === "Enter" && newSkill.trim()) {
      const trimmed = newSkill.trim();
      const matched = skillSuggestions.find(
        (s) => s.skill_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (matched) {
        addSkillFromSuggestion(matched);
      } else {
        if (!skills.some((s) => s.skill_name.toLowerCase() === trimmed.toLowerCase())) {
          setSkills([...skills, { id: Date.now(), skill_name: trimmed }]);
        }
        setNewSkill("");
        setShowSuggestions(false);
      }
    }
  };

  const removeSkill = (id) => {
    setSkills(skills.filter((s) => s.id !== id));
  };

  // --- Handle file selection (preview) ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePicture(ev.target.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // --- Save profile (using axios) ---
  const handleSaveProfile = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("date_of_birth", profile.date_of_birth ? profile.date_of_birth.toISOString().split("T")[0] : "");
    formData.append("gender", profile.gender);
    formData.append("location", profile.location);
    formData.append("education", profile.education);
    formData.append("experience_years", profile.experience_years);
    formData.append("skills", skills.map((s) => s.skill_name).join(","));
    formData.append("linkedin_url", profile.linkedin_url);
    formData.append("github_url", profile.github_url);
    formData.append("portfolio_url", profile.portfolio_url);

    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
      formData.append("profile_picture", fileInputRef.current.files[0]);
    }

    try {
      const response = await api.put("/candidate/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Profile updated successfully!");
      setProfilePicture(response.data.profile_picture || null);
    } catch (error) {
      console.error("Save error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      } else {
        alert("Error: " + JSON.stringify(error.response?.data || error.message));
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Show loading while fetching ---
  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  return (
    <div className="candidate-profile">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <Brain size={28} />
            <span>PrepMaster AI</span>
          </div>
        </div>
        <nav className="nav-menu">
          <a className="nav-link active">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a className="nav-link">
            <Brain size={18} /> Practice
          </a>
          <a className="nav-link">
            <CalendarDays size={18} /> Sessions
          </a>
          <a className="nav-link">
            <BarChart3 size={18} /> Insights
          </a>
        </nav>
        <div className="header-right">
          <button className="header-icon"><Bell size={19} /></button>
          <button className="header-icon"><Settings size={19} /></button>
          <div className="profile-avatar">
            <UserCircle size={22} />
            <span>John</span>
          </div>
        </div>
      </header>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="profile-nav">
            <div
              className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => handleNavClick("profile")}
            >
              <User size={18} /> <span>Personal Information</span>
            </div>
            <div
              className={`nav-item ${activeSection === "education" ? "active" : ""}`}
              onClick={() => handleNavClick("education")}
            >
              <GraduationCap size={18} /> <span>Education</span>
            </div>
            <div
              className={`nav-item ${activeSection === "skillsExperience" ? "active" : ""}`}
              onClick={() => handleNavClick("skillsExperience")}
            >
              <Briefcase size={18} /> <span>Skills & Experience</span>
            </div>
            <div
              className={`nav-item ${activeSection === "digitalPresence" ? "active" : ""}`}
              onClick={() => handleNavClick("digitalPresence")}
            >
              <Globe size={18} /> <span>Digital Presence</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="content">
          <div ref={profileRef} className="profile-section" id="profile">
            <div className="section-header">
              <h2>Profile Setup</h2>
            </div>

            {/* Personal Information */}
            <div className="personal-info">
              <h3>Personal Information</h3>
              <div className="info-grid-vertical">
                {/* Profile Picture – centered with conditional label */}
                <div className="form-group profile-picture-group">
                  <label>Profile Picture</label>
                  <div className="profile-picture-upload">
                    <div className="profile-pic-wrapper">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="profile-pic-img"
                        />
                      ) : (
                        <UserCircle size={56} className="default-avatar" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      id="profile-pic-input"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <label htmlFor="profile-pic-input" className="profile-pic-label">
                      {profilePicture ? "Change Picture" : "Upload Picture"}
                    </label>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="form-group">
                  <label>Date of Birth</label>
                  <div className="date-input-wrapper">
                    <DatePicker
                      selected={profile.date_of_birth}
                      onChange={(date) => setProfile({ ...profile, date_of_birth: date })}
                      dateFormat="MM/dd/yyyy"
                      placeholderText="mm/dd/yyyy"
                      className="custom-datepicker-input"
                      wrapperClassName="custom-datepicker-wrapper"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={15}
                      scrollableYearDropdown
                      maxDate={new Date()}
                    />
                    <CalendarDays size={18} className="date-input-icon" />
                  </div>
                </div>

                {/* Gender */}
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>

                {/* Location */}
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Education & Experience */}
            <div ref={educationRef} className="education-section">
              <h3>Education & Experience</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Highest Degree / Education</label>
                  <input
                    type="text"
                    value={profile.education}
                    onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                    placeholder="e.g., Bachelor of Computer Engineering"
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={profile.experience_years}
                    onChange={(e) =>
                      setProfile({ ...profile, experience_years: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="e.g., 2.5"
                  />
                </div>
              </div>
            </div>

            {/* Skills – with autocomplete */}
            <div ref={skillsExperienceRef} className="skills-experience-section">
              <h3>Skills</h3>
              <div className="skills-container">
                <label>Technical Skills</label>
                {skills.length > 0 && (
                  <div className="skill-tags">
                    {skills.map((skill) => (
                      <span key={skill.id} className="skill-tag">
                        {skill.skill_name}
                        <button
                          type="button"
                          className="skill-remove"
                          onClick={() => removeSkill(skill.id)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="skill-input-wrapper" ref={suggestionRef}>
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter or select from suggestions..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleAddSkill}
                    onFocus={() =>
                      newSkill.trim().length >= 1 && setShowSuggestions(skillSuggestions.length > 0)
                    }
                  />
                  <Plus size={18} className="skill-input-icon" />
                  {showSuggestions && (
                    <div className="skill-suggestions-dropdown">
                      {loadingSuggestions ? (
                        <div className="suggestion-loading">Loading...</div>
                      ) : (
                        skillSuggestions.map((skill) => (
                          <div
                            key={skill.id}
                            className="suggestion-item"
                            onClick={() => addSkillFromSuggestion(skill)}
                          >
                            <span className="suggestion-name">{skill.skill_name}</span>
                            <span className="suggestion-category">{skill.category}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="suggestions-hint">
                  Suggested: Docker, AWS, System Design, TypeScript
                </div>
              </div>
            </div>

            {/* Digital Presence */}
            <div ref={digitalPresenceRef} className="digital-presence">
              <h3>Digital Presence</h3>
              <div className="form-group full-width">
                <label>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={profile.linkedin_url}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  placeholder="linkedin.com/in/username"
                />
              </div>
              <div className="form-group full-width">
                <label>GitHub URL</label>
                <input
                  type="url"
                  value={profile.github_url}
                  onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                  placeholder="github.com/username"
                />
              </div>
              <div className="form-group full-width">
                <label>Portfolio URL</label>
                <input
                  type="url"
                  value={profile.portfolio_url}
                  onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-back" onClick={() => (window.location.href = "/dashboard")}>
                Back to Dashboard
              </button>
              <button className="btn-cancel" onClick={() => window.location.reload()}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                <Save size={17} />
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateProfile;