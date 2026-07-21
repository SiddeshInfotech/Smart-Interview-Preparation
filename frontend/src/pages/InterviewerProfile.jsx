import React, { useState, useRef, useEffect } from "react";
import "../styles/CandidateProfile.css";
import {
  LayoutDashboard,
  Brain,
  CalendarDays,
  UserCircle,
  User,
  Briefcase,
  Save,
  Plus,
  Settings,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import api from "../api/axios";

const InterviewerProfile = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // --- Profile form state ---
  const [profile, setProfile] = useState({
    department: "",
    designation: "",
    years_of_experience: 0.0,
    is_available: true,
  });

  // --- Profile picture state ---
  const [profilePicture, setProfilePicture] = useState(null);

  // --- Expertise / Skills state ---
  const [expertise, setExpertise] = useState([]);
  const [newArea, setNewArea] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Refs ---
  const profileRef = useRef(null);
  const experienceRef = useRef(null);
  const expertiseRef = useRef(null);
  const suggestionRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Fetch profile on mount ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/interviewer/profile/");
        const data = response.data;

        setProfile({
          department: data.department || "",
          designation: data.designation || "",
          years_of_experience: data.years_of_experience ? parseFloat(data.years_of_experience) : 0.0,
          is_available: data.is_available !== undefined ? data.is_available : true,
        });

        setProfilePicture(data.profile_picture || null);

        if (data.expertise_area) {
          const areaNames = data.expertise_area.split(",").map((s) => s.trim()).filter(Boolean);
          setExpertise(
            areaNames.map((name, index) => ({
              id: `existing-${Date.now()}-${index}`,
              skill_name: name,
            }))
          );
        }
      } catch (error) {
        console.error("Error loading interviewer profile:", error);
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

  // --- Debounced expertise area suggestions ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (newArea.trim().length >= 1) {
        fetchAreaSuggestions(newArea.trim());
      } else {
        setAreaSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [newArea]);

  // --- Auto-highlight sidebar on scroll using getBoundingClientRect + RAF ---
  useEffect(() => {
    const sections = [
      { ref: profileRef, name: "profile" },
      { ref: experienceRef, name: "experience" },
      { ref: expertiseRef, name: "expertise" },
    ];

    const updateActiveSection = () => {
      if (isProgrammaticScroll) return;

      const scrollY = window.scrollY + 120; // offset for sticky header
      let newActive = "profile";
      let minDistance = Infinity;

      sections.forEach(({ ref, name }) => {
        const el = ref.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const bottom = rect.bottom + window.scrollY;

        if (scrollY >= top && scrollY < bottom) {
          const distance = Math.abs(scrollY - top);
          if (distance < minDistance) {
            minDistance = distance;
            newActive = name;
          }
        }
      });

      setActiveSection((prev) => (prev !== newActive ? newActive : prev));
    };

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener("scroll", handleScroll);
    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, [isProgrammaticScroll]);

  // --- Navigation functions ---
  const scrollToSection = (ref) => {
    if (ref.current) {
      setIsProgrammaticScroll(true);
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        setIsProgrammaticScroll(false);
      }, 700);
    }
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    const refs = {
      profile: profileRef,
      experience: experienceRef,
      expertise: expertiseRef,
    };
    scrollToSection(refs[section]);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // --- Expertise suggestions API ---
  const fetchAreaSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get(`/common/skills/?search=${encodeURIComponent(query)}`);
      setAreaSuggestions(response.data);
      setShowSuggestions(response.data.length > 0);
    } catch (error) {
      console.error("Error fetching expertise suggestions:", error);
      setAreaSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addAreaFromSuggestion = (area) => {
    if (!expertise.some((s) => s.skill_name.toLowerCase() === area.skill_name.toLowerCase())) {
      setExpertise([...expertise, { id: area.id, skill_name: area.skill_name }]);
    }
    setNewArea("");
    setShowSuggestions(false);
  };

  const handleAddArea = (e) => {
    if (e.key === "Enter" && newArea.trim()) {
      const trimmed = newArea.trim();
      const matched = areaSuggestions.find(
        (s) => s.skill_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (matched) {
        addAreaFromSuggestion(matched);
      } else {
        if (!expertise.some((s) => s.skill_name.toLowerCase() === trimmed.toLowerCase())) {
          setExpertise([...expertise, { id: Date.now(), skill_name: trimmed }]);
        }
        setNewArea("");
        setShowSuggestions(false);
      }
    }
  };

  const removeArea = (id) => {
    setExpertise(expertise.filter((s) => s.id !== id));
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
    formData.append("department", profile.department);
    formData.append("designation", profile.designation);
    formData.append("years_of_experience", profile.years_of_experience);
    formData.append("is_available", profile.is_available);
    formData.append("expertise_area", expertise.map((s) => s.skill_name).join(","));

    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
      formData.append("profile_picture", fileInputRef.current.files[0]);
    }

    try {
      const response = await api.put("/interviewer/profile/", formData, {
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

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  return (
    <div className="candidate-profile">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="main-container" style={{ paddingTop: 0 }}>
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="profile-nav">
            <div
              className="nav-item"
              onClick={() => (window.location.href = "/dashboard")}
              style={{ color: "var(--color-primary)", fontWeight: "600" }}
            >
              <LayoutDashboard size={18} /> <span>Back to Dashboard</span>
            </div>
            <div style={{ margin: "4px 0", borderBottom: "1px solid var(--color-border)" }} />
            
            <div
              className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => handleNavClick("profile")}
            >
              <User size={18} /> <span>Personal Info</span>
            </div>
            
            <div
              className={`nav-item ${activeSection === "experience" ? "active" : ""}`}
              onClick={() => handleNavClick("experience")}
            >
              <Briefcase size={18} /> <span>Experience & Status</span>
            </div>
            
            <div
              className={`nav-item ${activeSection === "expertise" ? "active" : ""}`}
              onClick={() => handleNavClick("expertise")}
            >
              <Brain size={18} /> <span>Areas of Expertise</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="content">
          <div className="profile-section" id="profile">
            <div className="section-header">
              <h2>Interviewer Profile Setup</h2>
            </div>

            {/* Personal Info */}
            <div className="personal-info" ref={profileRef}>
              <h3>Personal Information</h3>
              <div className="info-grid-vertical">
                <div className="form-group profile-picture-group">
                  <label>Profile Picture</label>
                  <div className="profile-picture-upload">
                    <div className="profile-pic-wrapper">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="profile-pic-img" />
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

                <div className="form-group">
                  <label>Designation / Role</label>
                  <input
                    type="text"
                    value={profile.designation}
                    onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="QA">QA</option>
                    <option value="Design">Design</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Experience & Status */}
            <div className="education-section" ref={experienceRef}>
              <h3>Experience & Availability</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={profile.years_of_experience}
                    onChange={(e) =>
                      setProfile({ ...profile, years_of_experience: parseFloat(e.target.value) || 0.0 })
                    }
                    placeholder="e.g., 5.0"
                  />
                </div>
                <div className="form-group">
                  <label>Availability Status</label>
                  <select
                    value={profile.is_available ? "true" : "false"}
                    onChange={(e) =>
                      setProfile({ ...profile, is_available: e.target.value === "true" })
                    }
                  >
                    <option value="true">Available for Interviews</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Areas of Expertise */}
            <div className="skills-experience-section" ref={expertiseRef}>
              <h3>Areas of Expertise</h3>
              <div className="skills-container">
                <label>Technical Domains & Technologies</label>
                {expertise.length > 0 && (
                  <div className="skill-tags">
                    {expertise.map((area) => (
                      <span key={area.id} className="skill-tag">
                        {area.skill_name}
                        <button
                          type="button"
                          className="skill-remove"
                          onClick={() => removeArea(area.id)}
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
                    placeholder="Type an expertise area and press Enter or select from suggestions..."
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyDown={handleAddArea}
                    onFocus={() =>
                      newArea.trim().length >= 1 && setShowSuggestions(areaSuggestions.length > 0)
                    }
                  />
                  <Plus size={18} className="skill-input-icon" />
                  {showSuggestions && (
                    <div className="skill-suggestions-dropdown">
                      {loadingSuggestions ? (
                        <div className="suggestion-loading">Loading...</div>
                      ) : (
                        areaSuggestions.map((area) => (
                          <div
                            key={area.id}
                            className="suggestion-item"
                            onClick={() => addAreaFromSuggestion(area)}
                          >
                            <span className="suggestion-name">{area.skill_name}</span>
                            <span className="suggestion-category">{area.category}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div className="suggestions-hint">
                  Suggested: System Design, Backend, AI / ML, Cloud, Frontend, Cyber Security
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="btn-skip"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Skip
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

export default InterviewerProfile;
