import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/CandidateProfile.css";
import {
  User,
  GraduationCap,
  Briefcase,
  Globe,
  Save,
  Edit3,
  Menu,
  X,
  Plus,
  CalendarDays,
  MapPin,
  Mail,
  UserCircle,
  Camera,
  Sparkles,
  Lock,
  ShieldCheck,
  Check,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
  LayoutDashboard
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Custom GitHub Icon Component
const GitHubIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.62.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

// Custom LinkedIn Icon Component
const LinkedInIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const CandidateProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();

  // Mode State: Read-Only by default when opened from dashboard; editable during setup or when user clicks Edit
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isProgrammaticScroll = useRef(false);

  // --- Profile Form State (Synchronous Cache Hydration for Instant 0ms Load) ---
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_candidate_profile");
      if (cached) {
        const data = JSON.parse(cached);
        return {
          full_name: data.full_name || userProfile?.full_name || userProfile?.name || "",
          email: data.email || userProfile?.email || "",
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
          gender: data.gender || "",
          location: data.location || "",
          education: data.education || "",
          experience_years: Math.round(data.experience_years || 0),
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          portfolio_url: data.portfolio_url || "",
        };
      }
    } catch (e) { }
    return {
      full_name: userProfile?.full_name || userProfile?.name || "",
      email: userProfile?.email || "",
      date_of_birth: null,
      gender: "",
      location: "",
      education: "",
      experience_years: 0,
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
    };
  });

  // --- Profile Picture State ---
  const [profilePicture, setProfilePicture] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_candidate_profile");
      if (cached) return JSON.parse(cached).profile_picture || null;
    } catch (e) { }
    return null;
  });

  // --- Skills State ---
  const [skills, setSkills] = useState(() => {
    try {
      const cached = localStorage.getItem("cached_candidate_profile");
      if (cached) {
        const data = JSON.parse(cached);
        if (data.skills) {
          const skillNames = typeof data.skills === "string"
            ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : Array.isArray(data.skills) ? data.skills : [];
          return skillNames.map((name, index) => ({
            id: `cached-${index}`,
            skill_name: typeof name === "string" ? name : name.skill_name || name,
          }));
        }
      }
    } catch (e) { }
    return [];
  });
  const [newSkill, setNewSkill] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // --- UI Feedback States ---
  const [loading, setLoading] = useState(() => !localStorage.getItem("cached_candidate_profile"));
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  // --- Popular Quick Skill Recommendations ---
  const popularSkills = [
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "Docker",
    "AWS",
    "System Design",
    "PostgreSQL",
    "GraphQL",
    "TailwindCSS"
  ];

  // --- Degree Suggestions ---
  const degreeSuggestions = [
    "Bachelor of Computer Applications (BCA)",
    "Bachelor of Technology (B.Tech) - Computer Science",
    "Bachelor of Engineering (BE)",
    "Master of Computer Applications (MCA)",
    "Master of Technology (M.Tech)",
    "B.Sc Computer Science",
    "Diploma in Computer Engineering"
  ];

  // --- Section Refs ---
  const mainContentRef = useRef(null);
  const profileRef = useRef(null);
  const educationRef = useRef(null);
  const skillsExperienceRef = useRef(null);
  const digitalPresenceRef = useRef(null);
  const suggestionRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Fetch Profile Data on Mount ---
  useEffect(() => {
    const fetchProfile = async () => {
      // Check query param e.g. ?mode=setup (registration flow)
      const isSetupMode = searchParams.get("mode") === "setup";

      // Hydrate from cache immediately to avoid loading spinner
      try {
        const cached = localStorage.getItem("cached_candidate_profile");
        if (cached) {
          const data = JSON.parse(cached);
          setProfile({
            full_name: data.full_name || userProfile?.full_name || userProfile?.name || "",
            email: data.email || userProfile?.email || "",
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
            gender: data.gender || "",
            location: data.location || "",
            education: data.education || "",
            experience_years: Math.round(data.experience_years || 0),
            linkedin_url: data.linkedin_url || "",
            github_url: data.github_url || "",
            portfolio_url: data.portfolio_url || "",
          });
          setProfilePicture(data.profile_picture || null);
          if (data.skills) {
            const skillNames = typeof data.skills === "string"
              ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : Array.isArray(data.skills) ? data.skills : [];
            setSkills(
              skillNames.map((name, index) => ({
                id: `existing-${Date.now()}-${index}`,
                skill_name: typeof name === "string" ? name : name.skill_name || name,
              }))
            );
          }
          setLoading(false); // Show cached data immediately
        }
      } catch (cacheErr) {
        // Cache parse failed — will still fetch from API
      }

      try {
        const response = await api.get("/candidate/profile/");
        const data = response.data;
        localStorage.setItem("cached_candidate_profile", JSON.stringify(data));

        // Always populate profile state with fetched data
        setProfile({
          full_name: data.full_name || userProfile?.full_name || userProfile?.name || "",
          email: data.email || userProfile?.email || "",
          date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
          gender: data.gender || "",
          location: data.location || "",
          education: data.education || "",
          experience_years: Math.round(data.experience_years || 0),
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          portfolio_url: data.portfolio_url || "",
        });
        setProfilePicture(data.profile_picture || null);

        if (data.skills) {
          const skillNames = typeof data.skills === "string"
            ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : Array.isArray(data.skills) ? data.skills : [];
          setSkills(
            skillNames.map((name, index) => ({
              id: `existing-${Date.now()}-${index}`,
              skill_name: typeof name === "string" ? name : name.skill_name || name,
            }))
          );
        }

        if (isSetupMode) {
          setIsEditing(true); // 1st Time Registration Setup -> Write mode
        } else {
          setIsEditing(false); // View Profile -> Read-Only mode by default
        }
      } catch (error) {
        console.error("Error loading candidate profile:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, searchParams]);


  // --- Auto Active Highlight via Scroll Observer ---
  useEffect(() => {
    const observerOptions = {
      root: mainContentRef.current,
      rootMargin: "-15% 0px -50% 0px",
      threshold: 0.1,
    };

    const sectionRefs = [
      { id: "profile", ref: profileRef },
      { id: "education", ref: educationRef },
      { id: "skillsExperience", ref: skillsExperienceRef },
      { id: "digitalPresence", ref: digitalPresenceRef },
    ];

    const observer = new IntersectionObserver((entries) => {
      if (isProgrammaticScroll.current) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const found = sectionRefs.find((item) => item.ref.current === entry.target);
          if (found) {
            setActiveSection(found.id);
          }
        }
      });
    }, observerOptions);

    sectionRefs.forEach((item) => {
      if (item.ref.current) {
        observer.observe(item.ref.current);
      }
    });

    return () => observer.disconnect();
  }, [loading]);

  // --- Smooth Scroll Navigation ---
  const handleNavClick = (sectionId, ref) => {
    setActiveSection(sectionId);
    isProgrammaticScroll.current = true;
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 800);

    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // --- Close Suggestions on Click Outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Debounced Skill Search API ---
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

  const fetchSkillSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get(`/common/skills/?search=${encodeURIComponent(query)}`);
      setSkillSuggestions(response.data);
      setShowSuggestions(response.data.length > 0);
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
      setSkillSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addSkillFromSuggestion = (skillName) => {
    if (!isEditing) return;
    const name = typeof skillName === "string" ? skillName : skillName.skill_name;
    if (!skills.some((s) => s.skill_name.toLowerCase() === name.toLowerCase())) {
      setSkills([...skills, { id: Date.now() + Math.random(), skill_name: name }]);
    }
    setNewSkill("");
    setShowSuggestions(false);
  };

  const handleAddSkillKey = (e) => {
    if (!isEditing) return;
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      const trimmed = newSkill.trim();
      const matched = skillSuggestions.find(
        (s) => s.skill_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (matched) {
        addSkillFromSuggestion(matched.skill_name);
      } else {
        addSkillFromSuggestion(trimmed);
      }
    }
  };

  const removeSkill = (id) => {
    if (!isEditing) return;
    setSkills(skills.filter((s) => s.id !== id));
  };

  // --- File Selection for Profile Picture ---
  const handleFileChange = (e) => {
    if (!isEditing) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePicture(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Save Profile with Mandatory Validation ---
  const handleSaveProfile = async () => {
    setValidationError("");

    // Validate Mandatory Fields: Name, Email, Date of Birth, Location, Education
    const missing = [];
    if (!profile.full_name && !userProfile?.name) missing.push("Name");
    if (!profile.email && !userProfile?.email) missing.push("Email");
    if (!profile.date_of_birth) missing.push("Date of Birth");
    if (!profile.location || !profile.location.trim()) missing.push("Location");
    if (!profile.education || !profile.education.trim()) missing.push("Education");

    if (missing.length > 0) {
      setValidationError(`Mandatory fields required: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append(
      "date_of_birth",
      profile.date_of_birth ? profile.date_of_birth.toISOString().split("T")[0] : ""
    );
    formData.append("gender", profile.gender);
    formData.append("location", profile.location.trim());
    formData.append("education", profile.education.trim());
    formData.append("experience_years", Math.round(profile.experience_years || 0));
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
      localStorage.setItem("cached_candidate_profile", JSON.stringify(response.data));
      setProfilePicture(response.data.profile_picture || profilePicture);

      setToastMessage("Candidate profile updated successfully!");
      setShowSuccessToast(true);
      setIsEditing(false); // Switch to Read-Only format after saving
      setTimeout(() => setShowSuccessToast(false), 4000);

      const isSetupMode = searchParams.get("mode") === "setup";
      if (isSetupMode) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Save candidate profile error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
      } else {
        alert("Error saving profile: " + (error.response?.data?.detail || error.message));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="cp-loading-screen">
        <div className="cp-spinner"></div>
        <p className="cp-loading-text">Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div className="candidate-profile-page">
      {/* Mobile Top Navbar with Menu Toggle */}
      <header className="cp-mobile-header">
        <button className="cp-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="cp-mobile-title">PrepMaster Profile</span>
        <div className="cp-mobile-header-right">
          <button
            className="cp-mobile-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            title="Go to Dashboard"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          {isEditing ? (
            <button className="cp-quick-save-btn" onClick={handleSaveProfile} disabled={saving}>
              <Save size={16} />
            </button>
          ) : (
            <button className="cp-quick-save-btn" onClick={() => setIsEditing(true)}>
              <Edit3 size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <div className="cp-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="cp-layout-container">
        {/* Left Navigation Sidebar */}
        <aside className={`cp-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="cp-sidebar-brand" onClick={() => navigate("/dashboard")} title="Go to Dashboard" style={{ cursor: "pointer" }}>
            <div className="cp-brand-icon">
              <Sparkles size={20} />
            </div>
            <div className="cp-brand-text">
              <span className="cp-brand-title">PrepMaster</span>
              <span className="cp-brand-subtitle">Candidate Profile</span>
            </div>
          </div>

          <div className="cp-sidebar-nav">
            <div className="cp-nav-divider">
              <span>PROFILE NAVIGATION</span>
            </div>

            {/* Dashboard Navigation Option - Positioned directly above Personal Information */}
            <div
              className="cp-nav-item cp-dashboard-nav-item"
              onClick={() => navigate("/dashboard")}
              title="Return to main dashboard"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
              <ArrowUpRight size={16} className="cp-nav-arrow" />
            </div>

            {/* Navigation Menu Items */}
            <div
              className={`cp-nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => handleNavClick("profile", profileRef)}
            >
              <User size={18} />
              <span>Personal Information</span>
              {activeSection === "profile" && <ChevronRight size={16} className="cp-nav-arrow" />}
            </div>

            <div
              className={`cp-nav-item ${activeSection === "education" ? "active" : ""}`}
              onClick={() => handleNavClick("education", educationRef)}
            >
              <GraduationCap size={18} />
              <span>Education</span>
              {activeSection === "education" && <ChevronRight size={16} className="cp-nav-arrow" />}
            </div>

            <div
              className={`cp-nav-item ${activeSection === "skillsExperience" ? "active" : ""}`}
              onClick={() => handleNavClick("skillsExperience", skillsExperienceRef)}
            >
              <Briefcase size={18} />
              <span>Skills & Experience</span>
              {activeSection === "skillsExperience" && <ChevronRight size={16} className="cp-nav-arrow" />}
            </div>

            <div
              className={`cp-nav-item ${activeSection === "digitalPresence" ? "active" : ""}`}
              onClick={() => handleNavClick("digitalPresence", digitalPresenceRef)}
            >
              <Globe size={18} />
              <span>Digital Presence</span>
              {activeSection === "digitalPresence" && <ChevronRight size={16} className="cp-nav-arrow" />}
            </div>
          </div>

          {/* Mode Indicator Card in Sidebar */}
          <div className="cp-sidebar-mode-card">
            <div className="cp-mode-badge-wrapper">
              <span className={`cp-mode-dot ${isEditing ? "editing" : "readonly"}`}></span>
              <span className="cp-mode-title">
                {isEditing ? "Editing Mode" : "Read-Only Mode"}
              </span>
            </div>
            <p className="cp-mode-hint">
              {isEditing
                ? "Make your updates and click Save Profile at the bottom."
                : "Click Edit Profile at the bottom to update details."}
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="cp-main-content" ref={mainContentRef}>
          <div className="cp-content-wrapper">

            {/* Toast Success Notification */}
            {showSuccessToast && (
              <div className="cp-toast-notification">
                <CheckCircle2 size={20} className="cp-toast-icon" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Mandatory Validation Error Alert */}
            {validationError && (
              <div className="cp-error-notification">
                <AlertCircle size={20} className="cp-error-icon" />
                <span>{validationError}</span>
              </div>
            )}

            {/* SECTION 1: Personal Information */}
            <section className="cp-card-section" id="profile" ref={profileRef}>
              <div className="cp-card-header">
                <div className="cp-card-header-icon profile">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="cp-card-title">Personal Information</h2>
                  <p className="cp-card-subtitle">Manage your account details and contact information</p>
                </div>
              </div>

              <div className="cp-card-body">
                {/* Profile Picture Upload Section */}
                <div className="cp-avatar-upload-area">
                  <div className="cp-avatar-container">
                    <div className="cp-avatar-ring">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Candidate Profile" className="cp-avatar-image" />
                      ) : (
                        <div className="cp-avatar-placeholder">
                          <UserCircle size={68} />
                          <span className="cp-avatar-placeholder-text">Profile</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label htmlFor="cp-avatar-input" className="cp-avatar-camera-badge" title="Change Avatar">
                        <Camera size={16} />
                      </label>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="cp-avatar-actions">
                      <input
                        type="file"
                        accept="image/*"
                        id="cp-avatar-input"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                      <label htmlFor="cp-avatar-input" className="cp-btn-secondary">
                        <Camera size={16} />
                        <span>{profilePicture ? "Change Picture" : "Upload Picture"}</span>
                      </label>

                      {profilePicture && (
                        <button
                          type="button"
                          className="cp-btn-text-danger"
                          onClick={() => setProfilePicture(null)}
                        >
                          <Trash2 size={15} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="cp-field-hint">Profile photo saved</span>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="cp-form-grid">
                  {/* Name (Mandatory & Locked) */}
                  <div className="cp-field-group">
                    <label className="cp-label">
                      <span>Full Name <span className="cp-required-star">*</span></span>
                      <span className="cp-locked-badge"><Lock size={12} /> Locked</span>
                    </label>
                    <div className="cp-input-wrapper disabled">
                      <User size={18} className="cp-input-icon" />
                      <input
                        type="text"
                        value={profile.full_name || userProfile?.name || ""}
                        disabled
                        className="cp-input disabled"
                      />
                      <Lock size={15} className="cp-lock-icon" />
                    </div>
                  </div>

                  {/* Email (Mandatory & Locked) */}
                  <div className="cp-field-group">
                    <label className="cp-label">
                      <span>Email Address <span className="cp-required-star">*</span></span>
                      <span className="cp-locked-badge"><Lock size={12} /> Locked</span>
                    </label>
                    <div className="cp-input-wrapper disabled">
                      <Mail size={18} className="cp-input-icon" />
                      <input
                        type="text"
                        value={profile.email || userProfile?.email || ""}
                        disabled
                        className="cp-input disabled"
                      />
                      <Lock size={15} className="cp-lock-icon" />
                    </div>
                  </div>

                  {/* Date of Birth (Mandatory) */}
                  <div className="cp-field-group">
                    <label className="cp-label">
                      <span>Date of Birth <span className="cp-required-star">*</span></span>
                    </label>
                    <div className="cp-input-wrapper">
                      <CalendarDays size={18} className="cp-input-icon" />
                      <DatePicker
                        selected={profile.date_of_birth}
                        onChange={(date) => isEditing && setProfile({ ...profile, date_of_birth: date })}
                        disabled={!isEditing}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select Date of Birth (MM/DD/YYYY)"
                        className={`cp-input cp-datepicker-input ${!isEditing ? "readonly" : ""}`}
                        wrapperClassName="cp-datepicker-wrapper"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={35}
                        scrollableYearDropdown
                        maxDate={new Date()}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="cp-field-group">
                    <label className="cp-label">Gender</label>
                    <div className="cp-input-wrapper">
                      <UserCircle size={18} className="cp-input-icon" />
                      <select
                        className={`cp-select ${!isEditing ? "readonly" : ""}`}
                        value={profile.gender}
                        disabled={!isEditing}
                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      >
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other / Non-Binary</option>
                        <option value="N">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Location (Mandatory) */}
                  <div className="cp-field-group full-span">
                    <label className="cp-label">
                      <span>Location <span className="cp-required-star">*</span></span>
                    </label>
                    <div className="cp-input-wrapper">
                      <MapPin size={18} className="cp-input-icon" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="e.g., Dhule, Maharashtra, India"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Education & Experience */}
            <section className="cp-card-section" id="education" ref={educationRef}>
              <div className="cp-card-header">
                <div className="cp-card-header-icon education">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h2 className="cp-card-title">Education & Experience</h2>
                  <p className="cp-card-subtitle">Highlight your qualifications and work experience</p>
                </div>
              </div>

              <div className="cp-card-body">
                <div className="cp-form-grid">
                  {/* Highest Degree (Mandatory) */}
                  <div className="cp-field-group full-span">
                    <label className="cp-label">
                      <span>Highest Degree / Qualification <span className="cp-required-star">*</span></span>
                    </label>
                    <div className="cp-input-wrapper">
                      <GraduationCap size={18} className="cp-input-icon" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.education}
                        onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                        placeholder="e.g., Bachelor of Computer Applications (BCA), 2022–2025"
                      />
                    </div>
                    {/* Degree Suggestions Pills (Only when editing) */}
                    {isEditing && (
                      <div className="cp-quick-suggestions-pills">
                        <span className="cp-pills-label">Quick Suggestions:</span>
                        {degreeSuggestions.map((deg, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="cp-pill-btn"
                            onClick={() => setProfile({ ...profile, education: deg })}
                          >
                            + {deg.split(" ")[0]} {deg.split("(")[1] ? `(${deg.split("(")[1]}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Experience Years - ROUND INTEGER */}
                  <div className="cp-field-group full-span">
                    <label className="cp-label">Total Years of Experience (Round Figure)</label>
                    <div className="cp-input-wrapper">
                      <Briefcase size={18} className="cp-input-icon" />
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="50"
                        disabled={!isEditing}
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.experience_years}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            experience_years: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        placeholder="e.g., 2"
                      />
                      <span className="cp-input-suffix">Years</span>
                    </div>

                    {/* Quick Integer Experience Badges */}
                    {isEditing && (
                      <div className="cp-quick-suggestions-pills">
                        {[0, 1, 2, 3, 5].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            className={`cp-pill-btn ${profile.experience_years === yr ? "active" : ""}`}
                            onClick={() => setProfile({ ...profile, experience_years: yr })}
                          >
                            {yr === 0 ? "Fresher (0 yrs)" : `${yr}+ Years`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Skills & Experience */}
            <section className="cp-card-section" id="skillsExperience" ref={skillsExperienceRef}>
              <div className="cp-card-header">
                <div className="cp-card-header-icon skills">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="cp-card-title">Skills & Experience</h2>
                  <p className="cp-card-subtitle">Technical skills and specialized area highlights</p>
                </div>
              </div>

              <div className="cp-card-body">
                <div className="cp-skills-manager">
                  <div className="cp-skills-header-row">
                    <label className="cp-label">Technical Skills</label>
                    <span className="cp-skills-count-badge">{skills.length} Skills</span>
                  </div>

                  {/* Active Skill Chips */}
                  <div className="cp-skills-chips-wrapper">
                    {skills.length === 0 ? (
                      <div className="cp-empty-skills-msg">
                        {isEditing
                          ? "No skills added yet. Type below or pick from recommendations."
                          : "No skills specified yet."}
                      </div>
                    ) : (
                      skills.map((skill) => (
                        <div key={skill.id} className="cp-skill-chip">
                          <span>{skill.skill_name}</span>
                          {isEditing && (
                            <button
                              type="button"
                              className="cp-skill-remove-btn"
                              onClick={() => removeSkill(skill.id)}
                              title="Remove skill"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Skill Input Textfield (Always Rendered on Page) */}
                  <div className="cp-skill-input-container" ref={suggestionRef}>
                    <div className="cp-input-wrapper">
                      <Plus size={18} className="cp-input-icon" />
                      <input
                        type="text"
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        disabled={!isEditing}
                        placeholder={
                          isEditing
                            ? "Type a skill (e.g. React, Python) and press Enter..."
                            : "Click 'Edit Profile' below to add or edit skills..."
                        }
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleAddSkillKey}
                        onFocus={() =>
                          isEditing && newSkill.trim().length >= 1 && setShowSuggestions(skillSuggestions.length > 0)
                        }
                      />
                    </div>

                    {isEditing && showSuggestions && (
                      <div className="cp-suggestions-dropdown">
                        {loadingSuggestions ? (
                          <div className="cp-suggestion-loading">Searching skills...</div>
                        ) : (
                          skillSuggestions.map((s) => (
                            <div
                              key={s.id}
                              className="cp-suggestion-item"
                              onClick={() => addSkillFromSuggestion(s.skill_name)}
                            >
                              <span className="cp-suggestion-name">{s.skill_name}</span>
                              {s.category && <span className="cp-suggestion-cat">{s.category}</span>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Popular Skills Suggestions */}
                  <div className="cp-popular-skills-section">
                    <span className="cp-pills-label">Suggested Skills:</span>
                    <div className="cp-popular-pills-grid">
                      {popularSkills.map((popSkill, idx) => {
                        const isAdded = skills.some(
                          (s) => s.skill_name.toLowerCase() === popSkill.toLowerCase()
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`cp-pill-btn ${isAdded ? "added" : ""}`}
                            onClick={() => isEditing && addSkillFromSuggestion(popSkill)}
                            disabled={!isEditing || isAdded}
                          >
                            {isAdded ? <Check size={12} /> : <Plus size={12} />}
                            <span>{popSkill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Digital Presence */}
            <section className="cp-card-section" id="digitalPresence" ref={digitalPresenceRef}>
              <div className="cp-card-header">
                <div className="cp-card-header-icon digital">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="cp-card-title">Digital Presence</h2>
                  <p className="cp-card-subtitle">Connect your LinkedIn, GitHub, and Personal Portfolio</p>
                </div>
              </div>

              <div className="cp-card-body">
                <div className="cp-form-grid">
                  {/* LinkedIn */}
                  <div className="cp-field-group full-span">
                    <label className="cp-label">LinkedIn Profile URL</label>
                    <div className="cp-input-wrapper">
                      <LinkedInIcon size={18} className="cp-input-icon linkedin" />
                      <input
                        type="url"
                        disabled={!isEditing}
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.linkedin_url}
                        onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                        placeholder="https://www.linkedin.com/in/kimayanitinpatil"
                      />
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cp-link-preview-btn"
                          title="Open Link"
                        >
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="cp-field-group full-span">
                    <label className="cp-label">GitHub Profile URL</label>
                    <div className="cp-input-wrapper">
                      <GitHubIcon size={18} className="cp-input-icon github" />
                      <input
                        type="url"
                        disabled={!isEditing}
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.github_url}
                        onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                        placeholder="https://github.com/kimayanitinpatil"
                      />
                      {profile.github_url && (
                        <a
                          href={profile.github_url.startsWith("http") ? profile.github_url : `https://${profile.github_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cp-link-preview-btn"
                          title="Open Link"
                        >
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="cp-field-group full-span">
                    <label className="cp-label">Portfolio Website URL</label>
                    <div className="cp-input-wrapper">
                      <Globe size={18} className="cp-input-icon portfolio" />
                      <input
                        type="url"
                        disabled={!isEditing}
                        className={`cp-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.portfolio_url}
                        onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                        placeholder="https://kimayanitinpatil.dev"
                      />
                      {profile.portfolio_url && (
                        <a
                          href={profile.portfolio_url.startsWith("http") ? profile.portfolio_url : `https://${profile.portfolio_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cp-link-preview-btn"
                          title="Open Link"
                        >
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Action Footer Panel - Toggle between Read-Only and Save Modes */}
            <div className="cp-bottom-bar">
              <div className="cp-bottom-bar-info">
                {isEditing ? (
                  <span className="cp-save-status editing">
                    <Sparkles size={16} className="cp-status-icon" /> Make changes and click Save Profile
                  </span>
                ) : (
                  <span className="cp-save-status readonly">
                    <ShieldCheck size={16} className="cp-status-icon" /> Profile shown in Read-Only format
                  </span>
                )}
              </div>

              <div className="cp-bottom-bar-actions">
                {isEditing ? (
                  <button
                    type="button"
                    className="cp-btn-primary"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>{saving ? "Saving Profile..." : "Save Profile"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cp-btn-primary edit-mode-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={18} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateProfile;