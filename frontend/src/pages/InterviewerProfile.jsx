import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/InterviewerProfile.css";
import {
  User,
  Briefcase,
  Globe,
  Save,
  Edit3,
  Menu,
  X,
  Plus,
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
  Building2,
  Award,
  Clock,
  ArrowLeft,
  LayoutDashboard
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// --- Helper to generate 30‑min interval time options ---
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const hStr = String(hour).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");
      const timeVal = `${hStr}:${mStr}`;
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMin = String(min).padStart(2, "0");
      const label = `${displayHour}:${displayMin} ${ampm}`;
      options.push({ value: timeVal, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const DAYS_OF_WEEK = [
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
];

const formatSlotTime = (timeString) => {
  if (!timeString) return "";
  let date = new Date(timeString);
  if (isNaN(date.getTime())) {
    date = new Date(`2000-01-01T${timeString}`);
  }
  if (isNaN(date.getTime())) {
    const parts = String(timeString).split(":");
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        const displayMin = String(m).padStart(2, "0");
        return `${String(displayHour).padStart(2, "0")}:${displayMin} ${ampm}`;
      }
    }
    return timeString;
  }
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


// Custom GitHub Icon Component
const GitHubIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.62.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

// Custom LinkedIn Icon Component
const LinkedInIcon = ({ size = 18, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InterviewerProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  
  // --- Ownership & Permission Check ---
  const targetInterviewerId = searchParams.get("interviewer_id") || searchParams.get("id");
  const userRole = localStorage.getItem("user_role") || userProfile?.role;
  // Candidates or users viewing another interviewer's profile are PERMANENTLY restricted to Read-Only
  const canEdit = !targetInterviewerId && userRole === "interviewer";

  // State: Default Read-Only format when viewed from profile icon; Editable when registration setup or Edit clicked
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isProgrammaticScroll = useRef(false);

  // --- Interviewer Profile State ---
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    designation: "",
    company: "",
    department: "",
    years_of_experience: 0, // Integer round figure
    linkedin_url: "",
    github_url: "",
    website_url: "",
  });

  // --- Profile Picture State ---
  const [profilePicture, setProfilePicture] = useState(null);

  // --- Expertise / Topics State ---
  const [expertise, setExpertise] = useState([]);
  const [newTopic, setNewTopic] = useState("");

  // --- UI Feedback States ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  // --- Popular Interview Topics ---
  const popularTopics = [
    "System Design & Architecture",
    "Data Structures & Algorithms",
    "Frontend Development (React/TS)",
    "Backend Systems (Node/Python)",
    "Cloud & DevOps (AWS/Docker)",
    "Object-Oriented Programming",
    "Database Engineering (SQL/NoSQL)",
    "Behavioral & Leadership"
  ];

  // --- Time Slots State ---
  const [slots, setSlots] = useState([]);
  const [slotStartTime, setSlotStartTime] = useState("");
  const [slotEndTime, setSlotEndTime] = useState("");
  const [slotDayOfWeek, setSlotDayOfWeek] = useState("");
  const [slotError, setSlotError] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // --- Section Refs ---
  const mainContentRef = useRef(null);
  const profileRef = useRef(null);
  const backgroundRef = useRef(null);
  const expertiseRef = useRef(null);
  const slotsRef = useRef(null);
  const digitalPresenceRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Fetch Profile Data on Mount ---
  useEffect(() => {
    const fetchProfile = async () => {
      const isSetupMode = searchParams.get("mode") === "setup";

      try {
        const endpoint = targetInterviewerId
          ? `/interviewer/profile/${targetInterviewerId}/`
          : "/interviewer/profile/";
        const response = await api.get(endpoint);
        const data = response.data;

        if (!targetInterviewerId) {
          localStorage.setItem("cached_interviewer_profile", JSON.stringify(data));
        }

        // Always populate profile state with fetched data
        setProfile({
          full_name: data.full_name || userProfile?.full_name || userProfile?.name || "",
          email: data.email || userProfile?.email || "",
          designation: data.designation || "",
          company: data.company || "",
          department: data.department || "",
          years_of_experience: Math.round(data.years_of_experience || data.experience_years || 0),
          linkedin_url: data.linkedin_url || "",
          github_url: data.github_url || "",
          website_url: data.website_url || data.portfolio_url || "",
        });
        setProfilePicture(data.profile_picture || null);

        const rawExp = data.expertise_area || data.expertise;
        if (rawExp) {
          const expArray = typeof rawExp === "string"
            ? rawExp.split(",").map((s) => s.trim()).filter(Boolean)
            : Array.isArray(rawExp) ? rawExp : [];
          setExpertise(expArray.map((name, idx) => ({ id: `exp-${Date.now()}-${idx}`, name })));
        }

        if (isSetupMode && canEdit) {
          setIsEditing(true); // 1st Time Registration Setup -> Write mode
        } else {
          setIsEditing(false); // View Profile -> Read-Only mode by default
        }
      } catch (error) {
        console.error("Error fetching interviewer profile:", error);
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
  }, [navigate, searchParams, userProfile, targetInterviewerId, canEdit]);

  // --- Fetch Availability Time Slots on Mount ---
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const endpoint = targetInterviewerId
          ? `/interviewer/availability/${targetInterviewerId}/available/`
          : "/interviewer/availability/";
        const response = await api.get(endpoint);
        setSlots(response.data);
      } catch (error) {
        console.error("Error fetching availability slots:", error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [targetInterviewerId]);


  // --- Scroll Observer for Active Sidebar Highlighting ---
  useEffect(() => {
    const observerOptions = {
      root: mainContentRef.current,
      rootMargin: "-15% 0px -50% 0px",
      threshold: 0.1,
    };

    const sectionRefs = [
      { id: "profile", ref: profileRef },
      { id: "background", ref: backgroundRef },
      { id: "expertise", ref: expertiseRef },
      { id: "slots", ref: slotsRef },
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

  // --- Availability Time Slot Handlers ---
  const handleAddSlot = async () => {
    if (!canEdit || !isEditing) return;
    setSlotError("");
    if (slotDayOfWeek === "" || !slotStartTime || !slotEndTime) {
      setSlotError("Please select Day of Week, Start Time, and End Time.");
      return;
    }

    const dayVal = parseInt(slotDayOfWeek, 10);
    const startParts = slotStartTime.split(":").map(Number);
    const endParts = slotEndTime.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    if (endMinutes <= startMinutes) {
      setSlotError("End time must be strictly after start time.");
      return;
    }

    setAddingSlot(true);
    try {
      const response = await api.post("/interviewer/availability/", {
        day_of_week: dayVal,
        start_time: slotStartTime,
        end_time: slotEndTime,
      });
      setSlots((prev) => [...prev, response.data]);
      setSlotStartTime("");
      setSlotEndTime("");
      setSlotDayOfWeek("");
      setSlotError("");
    } catch (error) {
      console.error("Error adding availability slot:", error);
      let errorMsg = "Failed to add slot. Please check for overlaps.";
      if (error.response?.data) {
        errorMsg =
          error.response.data.non_field_errors?.[0] ||
          error.response.data.detail ||
          error.response.data.start_time?.[0] ||
          error.response.data.end_time?.[0] ||
          (typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data));
      }
      setSlotError(errorMsg);
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!canEdit || !isEditing) return;
    if (!window.confirm("Are you sure you want to delete this availability slot?")) return;
    setDeletingSlotId(id);
    try {
      await api.delete(`/interviewer/availability/${id}/`);
      setSlots((prev) => prev.filter((slot) => slot.availability_id !== id));
    } catch (error) {
      console.error("Error deleting availability slot:", error);
      alert("Failed to delete slot. Please try again.");
    } finally {
      setDeletingSlotId(null);
    }
  };

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

  // --- Expertise Topic Handlers ---
  const addExpertiseTopic = (topicName) => {
    if (!canEdit || !isEditing) return;
    const name = typeof topicName === "string" ? topicName.trim() : newTopic.trim();
    if (name && !expertise.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setExpertise([...expertise, { id: Date.now() + Math.random(), name }]);
    }
    setNewTopic("");
  };

  const handleTopicKeyDown = (e) => {
    if (!canEdit || !isEditing) return;
    if (e.key === "Enter" && newTopic.trim()) {
      e.preventDefault();
      addExpertiseTopic(newTopic.trim());
    }
  };

  const removeExpertiseTopic = (id) => {
    if (!canEdit || !isEditing) return;
    setExpertise(expertise.filter((t) => t.id !== id));
  };

  // --- Profile Picture File Selection ---
  const handleFileChange = (e) => {
    if (!canEdit || !isEditing) return;
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePicture(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Save Interviewer Profile with Mandatory Field Validation ---
  const handleSaveProfile = async () => {
    if (!canEdit || !isEditing) return;
    setValidationError("");


    // Validate Mandatory Fields: Name (*), Email (*), Designation (*), Company (*), Years of Experience (*)
    const missing = [];
    if (!profile.full_name && !userProfile?.name) missing.push("Name");
    if (!profile.email && !userProfile?.email) missing.push("Email");
    if (!profile.designation || !profile.designation.trim()) missing.push("Designation / Title");
    if (!profile.company || !profile.company.trim()) missing.push("Company / Organization");
    if (profile.years_of_experience === undefined || profile.years_of_experience === null || profile.years_of_experience < 0) {
      missing.push("Years of Experience");
    }

    if (missing.length > 0) {
      setValidationError(`Mandatory fields required: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("designation", profile.designation.trim());
    formData.append("company", profile.company.trim());
    formData.append("department", profile.department.trim());
    formData.append("years_of_experience", Math.round(profile.years_of_experience || 0));
    formData.append("expertise", expertise.map((t) => t.name).join(","));
    formData.append("linkedin_url", profile.linkedin_url);
    formData.append("github_url", profile.github_url);
    formData.append("website_url", profile.website_url);

    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
      formData.append("profile_picture", fileInputRef.current.files[0]);
    }

    try {
      const response = await api.put("/interviewer/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      localStorage.setItem("cached_interviewer_profile", JSON.stringify(response.data));
      setProfilePicture(response.data.profile_picture || profilePicture);

      setToastMessage("Interviewer profile updated successfully!");
      setShowSuccessToast(true);
      setIsEditing(false); // Switch back to Read-Only format
      setTimeout(() => setShowSuccessToast(false), 4000);

      const isSetupMode = searchParams.get("mode") === "setup";
      if (isSetupMode) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving interviewer profile:", error);
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
      <div className="ip-loading-screen">
        <div className="ip-spinner"></div>
        <p className="ip-loading-text">Loading interviewer profile...</p>
      </div>
    );
  }

  return (
    <div className="interviewer-profile-page">
      {/* Mobile Top Header */}
      <header className="ip-mobile-header">
        <button className="ip-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="ip-mobile-title">PrepMasterAI Profile</span>
        <div className="ip-mobile-header-right">
          <button
            className="ip-mobile-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            title="Go to Dashboard"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
          {canEdit && (
            isEditing ? (
              <button className="ip-quick-save-btn" onClick={handleSaveProfile} disabled={saving}>
                <Save size={16} />
              </button>
            ) : (
              <button className="ip-quick-save-btn" onClick={() => setIsEditing(true)}>
                <Edit3 size={16} />
              </button>
            )
          )}
        </div>
      </header>

      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <div className="ip-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="ip-layout-container">
        {/* Left Navigation Sidebar */}
        <aside className={`ip-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="ip-sidebar-brand" onClick={() => navigate("/dashboard")} title="Go to Dashboard" style={{ cursor: "pointer" }}>
            <div className="ip-brand-icon">
              <Sparkles size={20} />
            </div>
            <div className="ip-brand-text">
              <span className="ip-brand-title">PrepMasterAI</span>
              <span className="ip-brand-subtitle">Interviewer Profile</span>
            </div>
          </div>

          <div className="ip-sidebar-nav">
            <div className="ip-nav-divider">
              <span>PROFILE NAVIGATION</span>
            </div>

            {/* Dashboard Navigation Option - Positioned directly above Personal Information */}
            <div
              className="ip-nav-item ip-dashboard-nav-item"
              onClick={() => navigate("/dashboard")}
              title="Return to main dashboard"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
              <ArrowUpRight size={16} className="ip-nav-arrow" />
            </div>

            {/* Menu Items */}
            <div
              className={`ip-nav-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => handleNavClick("profile", profileRef)}
            >
              <User size={18} />
              <span>Personal Information</span>
              {activeSection === "profile" && <ChevronRight size={16} className="ip-nav-arrow" />}
            </div>

            <div
              className={`ip-nav-item ${activeSection === "background" ? "active" : ""}`}
              onClick={() => handleNavClick("background", backgroundRef)}
            >
              <Briefcase size={18} />
              <span>Professional Background</span>
              {activeSection === "background" && <ChevronRight size={16} className="ip-nav-arrow" />}
            </div>

            <div
              className={`ip-nav-item ${activeSection === "expertise" ? "active" : ""}`}
              onClick={() => handleNavClick("expertise", expertiseRef)}
            >
              <Sparkles size={18} />
              <span>Interview Expertise</span>
              {activeSection === "expertise" && <ChevronRight size={16} className="ip-nav-arrow" />}
            </div>

            <div
              className={`ip-nav-item ${activeSection === "slots" ? "active" : ""}`}
              onClick={() => handleNavClick("slots", slotsRef)}
            >
              <Clock size={18} />
              <span>Availability Slots</span>
              {activeSection === "slots" && <ChevronRight size={16} className="ip-nav-arrow" />}
            </div>

            <div
              className={`ip-nav-item ${activeSection === "digitalPresence" ? "active" : ""}`}
              onClick={() => handleNavClick("digitalPresence", digitalPresenceRef)}
            >
              <Globe size={18} />
              <span>Digital Presence</span>
              {activeSection === "digitalPresence" && <ChevronRight size={16} className="ip-nav-arrow" />}
            </div>

          </div>

          {/* Mode Card */}
          <div className="ip-sidebar-mode-card">
            <div className="ip-mode-badge-wrapper">
              <span className={`ip-mode-dot ${canEdit && isEditing ? "editing" : "readonly"}`}></span>
              <span className="ip-mode-title">
                {canEdit ? (isEditing ? "Editing Mode" : "Read-Only Mode") : "Read-Only Profile"}
              </span>
            </div>
            <p className="ip-mode-hint">
              {canEdit
                ? isEditing
                  ? "Make your updates and click Save Profile at the bottom."
                  : "Click Edit Profile at the bottom to update details."
                : "Viewing interviewer details in read-only format."}
            </p>
          </div>
        </aside>


        {/* Main Content Panel */}
        <main className="ip-main-content" ref={mainContentRef}>
          <div className="ip-content-wrapper">

            {/* Success Toast */}
            {showSuccessToast && (
              <div className="ip-toast-notification">
                <CheckCircle2 size={20} />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* Validation Error Toast */}
            {validationError && (
              <div className="ip-error-notification">
                <AlertCircle size={20} />
                <span>{validationError}</span>
              </div>
            )}

            {/* SECTION 1: Personal Information */}
            <section className="ip-card-section" id="profile" ref={profileRef}>
              <div className="ip-card-header">
                <div className="ip-card-header-icon profile">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="ip-card-title">Personal Information</h2>
                  <p className="ip-card-subtitle">Manage your account identity and avatar photo</p>
                </div>
              </div>

              <div className="ip-card-body">
                {/* Profile Picture Upload Zone */}
                <div className="ip-avatar-upload-area">
                  <div className="ip-avatar-container">
                    <div className="ip-avatar-ring">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Interviewer Profile" className="ip-avatar-image" />
                      ) : (
                        <div className="ip-avatar-placeholder">
                          <UserCircle size={68} />
                          <span className="ip-avatar-placeholder-text">Interviewer</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label htmlFor="ip-avatar-input" className="ip-avatar-camera-badge" title="Change Avatar">
                        <Camera size={16} />
                      </label>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="ip-avatar-actions">
                      <input
                        type="file"
                        accept="image/*"
                        id="ip-avatar-input"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                      <label htmlFor="ip-avatar-input" className="ip-btn-secondary">
                        <Camera size={16} />
                        <span>{profilePicture ? "Change Picture" : "Upload Picture"}</span>
                      </label>

                      {profilePicture && (
                        <button
                          type="button"
                          className="ip-btn-text-danger"
                          onClick={() => setProfilePicture(null)}
                        >
                          <Trash2 size={15} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="ip-field-hint">Profile photo saved</span>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="ip-form-grid">
                  {/* Name (Mandatory & Locked) */}
                  <div className="ip-field-group">
                    <label className="ip-label">
                      <span>Full Name <span className="ip-required-star">*</span></span>
                      <span className="ip-locked-badge"><Lock size={12} /> Locked</span>
                    </label>
                    <div className="ip-input-wrapper disabled">
                      <User size={18} className="ip-input-icon" />
                      <input
                        type="text"
                        value={profile.full_name || userProfile?.name || ""}
                        disabled
                        className="ip-input disabled"
                      />
                      <Lock size={15} className="ip-lock-icon" />
                    </div>
                  </div>

                  {/* Email (Mandatory & Locked) */}
                  <div className="ip-field-group">
                    <label className="ip-label">
                      <span>Email Address <span className="ip-required-star">*</span></span>
                      <span className="ip-locked-badge"><Lock size={12} /> Locked</span>
                    </label>
                    <div className="ip-input-wrapper disabled">
                      <Mail size={18} className="ip-input-icon" />
                      <input
                        type="text"
                        value={profile.email || userProfile?.email || ""}
                        disabled
                        className="ip-input disabled"
                      />
                      <Lock size={15} className="ip-lock-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Professional Background */}
            <section className="ip-card-section" id="background" ref={backgroundRef}>
              <div className="ip-card-header">
                <div className="ip-card-header-icon background">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h2 className="ip-card-title">Professional Background</h2>
                  <p className="ip-card-subtitle">Highlight your job designation, company, and industry experience</p>
                </div>
              </div>

              <div className="ip-card-body">
                <div className="ip-form-grid">
                  {/* Designation / Title (Mandatory) */}
                  <div className="ip-field-group">
                    <label className="ip-label">
                      <span>Designation / Title <span className="ip-required-star">*</span></span>
                    </label>
                    <div className="ip-input-wrapper">
                      <Briefcase size={18} className="ip-input-icon" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.designation}
                        onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                        placeholder="e.g., Senior Software Engineer"
                      />
                    </div>
                  </div>

                  {/* Company / Organization (Mandatory) */}
                  <div className="ip-field-group">
                    <label className="ip-label">
                      <span>Company / Organization <span className="ip-required-star">*</span></span>
                    </label>
                    <div className="ip-input-wrapper">
                      <Building2 size={18} className="ip-input-icon" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        placeholder="e.g., Google / Microsoft / PrepMasterAI"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="ip-field-group">
                    <label className="ip-label">Department / Domain</label>
                    <div className="ip-input-wrapper">
                      <Award size={18} className="ip-input-icon" />
                      <input
                        type="text"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.department}
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        placeholder="e.g., Software Engineering / AI & ML"
                      />
                    </div>
                  </div>

                  {/* Years of Experience (Mandatory - Round Integer) */}
                  <div className="ip-field-group">
                    <label className="ip-label">
                      <span>Years of Experience <span className="ip-required-star">*</span></span>
                    </label>
                    <div className="ip-input-wrapper">
                      <Briefcase size={18} className="ip-input-icon" />
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="50"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.years_of_experience}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            years_of_experience: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        placeholder="e.g., 5"
                      />
                      <span className="ip-input-suffix">Years</span>
                    </div>

                    {isEditing && (
                      <div className="ip-quick-suggestions-pills">
                        {[1, 3, 5, 8, 10].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            className={`ip-pill-btn ${profile.years_of_experience === yr ? "active" : ""}`}
                            onClick={() => setProfile({ ...profile, years_of_experience: yr })}
                          >
                            {yr}+ Years
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Interview Expertise */}
            <section className="ip-card-section" id="expertise" ref={expertiseRef}>
              <div className="ip-card-header">
                <div className="ip-card-header-icon expertise">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="ip-card-title">Interview Expertise</h2>
                  <p className="ip-card-subtitle">Technical topics and domains you conduct interviews for</p>
                </div>
              </div>

              <div className="ip-card-body">
                <div className="ip-expertise-manager">
                  <div className="ip-expertise-header-row">
                    <label className="ip-label">Interview Topics & Tech Stack</label>
                    <span className="ip-expertise-count-badge">{expertise.length} Topics</span>
                  </div>

                  {/* Active Expertise Chips */}
                  <div className="ip-expertise-chips-wrapper">
                    {expertise.length === 0 ? (
                      <div className="ip-empty-expertise-msg">
                        {isEditing
                          ? "No topics added yet. Type below or pick from recommended interview topics."
                          : "No interview topics specified yet."}
                      </div>
                    ) : (
                      expertise.map((item) => (
                        <div key={item.id} className="ip-expertise-chip">
                          <span>{item.name}</span>
                          {isEditing && (
                            <button
                              type="button"
                              className="ip-expertise-remove-btn"
                              onClick={() => removeExpertiseTopic(item.id)}
                              title="Remove topic"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Always Visible Input Textfield */}
                  <div className="ip-expertise-input-container">
                    <div className="ip-input-wrapper">
                      <Plus size={18} className="ip-input-icon" />
                      <input
                        type="text"
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        disabled={!isEditing}
                        placeholder={
                          isEditing
                            ? "Type an interview topic (e.g. System Design) and press Enter..."
                            : "Click 'Edit Profile' below to add or edit interview topics..."
                        }
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyDown={handleTopicKeyDown}
                      />
                    </div>
                  </div>

                  {/* Recommended Interview Topics */}
                  <div className="ip-popular-expertise-section">
                    <span className="ip-pills-label">Suggested Interview Topics:</span>
                    <div className="ip-popular-pills-grid">
                      {popularTopics.map((popTopic, idx) => {
                        const isAdded = expertise.some(
                          (t) => t.name.toLowerCase() === popTopic.toLowerCase()
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`ip-pill-btn ${isAdded ? "added" : ""}`}
                            onClick={() => isEditing && addExpertiseTopic(popTopic)}
                            disabled={!isEditing || isAdded}
                          >
                            {isAdded ? <Check size={12} /> : <Plus size={12} />}
                            <span>{popTopic}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Availability Time Slots */}
            <section className="ip-card-section" id="slots" ref={slotsRef}>

              <div className="ip-card-header">
                <div className="ip-card-header-icon slots">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="ip-card-title">Availability Time Slots</h2>
                  <p className="ip-card-subtitle">Set up weekly recurring availability for candidate interviews</p>
                </div>
              </div>

              <div className="ip-card-body">
                <div className="ip-expertise-manager">
                  <div className="ip-expertise-header-row">
                    <label className="ip-label">Configured Time Slots</label>
                    <span className="ip-expertise-count-badge slots-badge">{slots.length} Slots</span>
                  </div>

                  {/* Active Availability Slots Chips */}
                  <div className="ip-slots-chips-wrapper">
                    {loadingSlots ? (
                      <div className="ip-empty-expertise-msg">Loading availability slots...</div>
                    ) : slots.length === 0 ? (
                      <div className="ip-empty-expertise-msg">
                        {isEditing
                          ? "No availability slots added yet. Select Day of Week, Start Time, and End Time below to add slots."
                          : "No availability slots configured."}
                      </div>
                    ) : (
                      slots.map((slot) => {
                        const isDeleting = deletingSlotId === slot.availability_id;
                        const dayLabel = slot.day_label || DAYS_OF_WEEK.find((d) => String(d.value) === String(slot.day_of_week))?.label || "Day";
                        return (
                          <div key={slot.availability_id} className="ip-slot-chip">
                            <span className="ip-slot-day">{dayLabel}:</span>
                            <span className="ip-slot-time">
                              {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
                            </span>
                            {isEditing && (
                              <button
                                type="button"
                                className="ip-expertise-remove-btn"
                                onClick={() => handleDeleteSlot(slot.availability_id)}
                                disabled={isDeleting}
                                title="Delete Slot"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Slot Form */}
                  <div className="ip-slot-add-form">
                    <div className="ip-slot-inputs-grid">
                      <div className="ip-field-group">
                        <label className="ip-label">Day of Week</label>
                        <div className="ip-input-wrapper">
                          <select
                            disabled={!isEditing}
                            className={`ip-input ip-select ${!isEditing ? "readonly" : ""}`}
                            value={slotDayOfWeek}
                            onChange={(e) => {
                              setSlotDayOfWeek(e.target.value);
                              setSlotError("");
                            }}
                          >
                            <option value="">Select Day</option>
                            {DAYS_OF_WEEK.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ip-field-group">
                        <label className="ip-label">Start Time</label>
                        <div className="ip-input-wrapper">
                          <select
                            disabled={!isEditing}
                            className={`ip-input ip-select ${!isEditing ? "readonly" : ""}`}
                            value={slotStartTime}
                            onChange={(e) => {
                              setSlotStartTime(e.target.value);
                              setSlotEndTime("");
                              setSlotError("");
                            }}
                          >
                            <option value="">Start Time</option>
                            {TIME_OPTIONS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="ip-field-group">
                        <label className="ip-label">End Time</label>
                        <div className="ip-input-wrapper">
                          <select
                            disabled={!isEditing}
                            className={`ip-input ip-select ${!isEditing ? "readonly" : ""}`}
                            value={slotEndTime}
                            onChange={(e) => {
                              setSlotEndTime(e.target.value);
                              setSlotError("");
                            }}
                          >
                            <option value="">End Time</option>
                            {TIME_OPTIONS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="ip-field-group ip-slot-btn-group">
                          <button
                            type="button"
                            className="ip-btn-primary ip-add-slot-btn"
                            onClick={handleAddSlot}
                            disabled={addingSlot || !slotDayOfWeek || !slotStartTime || !slotEndTime}
                          >
                            <Plus size={16} />
                            <span>{addingSlot ? "Adding..." : "Add Slot"}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Slot Validation Error */}
                    {slotError && (
                      <div className="ip-error-notification" style={{ marginTop: "12px" }}>
                        <AlertCircle size={18} />
                        <span>{slotError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Digital Presence */}
            <section className="ip-card-section" id="digitalPresence" ref={digitalPresenceRef}>

              <div className="ip-card-header">
                <div className="ip-card-header-icon digital">
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className="ip-card-title">Digital Presence</h2>
                  <p className="ip-card-subtitle">Connect your professional LinkedIn, GitHub, or Website</p>
                </div>
              </div>

              <div className="ip-card-body">
                <div className="ip-form-grid">
                  {/* LinkedIn */}
                  <div className="ip-field-group full-span">
                    <label className="ip-label">LinkedIn Profile URL</label>
                    <div className="ip-input-wrapper">
                      <LinkedInIcon size={18} className="ip-input-icon linkedin" />
                      <input
                        type="url"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.linkedin_url}
                        onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                        placeholder="https://www.linkedin.com/in/interviewer"
                      />
                      {profile.linkedin_url && (
                        <a
                          href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ip-link-preview-btn"
                          title="Open Link"
                        >
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="ip-field-group full-span">
                    <label className="ip-label">GitHub Profile URL</label>
                    <div className="ip-input-wrapper">
                      <GitHubIcon size={18} className="ip-input-icon github" />
                      <input
                        type="url"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.github_url}
                        onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                        placeholder="https://github.com/interviewer"
                      />
                      {profile.github_url && (
                        <a
                          href={profile.github_url.startsWith("http") ? profile.github_url : `https://${profile.github_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ip-link-preview-btn"
                          title="Open Link"
                        >
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Website */}
                  <div className="ip-field-group full-span">
                    <label className="ip-label">Personal / Company Website URL</label>
                    <div className="ip-input-wrapper">
                      <Globe size={18} className="ip-input-icon portfolio" />
                      <input
                        type="url"
                        disabled={!isEditing}
                        className={`ip-input ${!isEditing ? "readonly" : ""}`}
                        value={profile.website_url}
                        onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                        placeholder="https://interviewer.dev"
                      />
                      {profile.website_url && (
                        <a
                          href={profile.website_url.startsWith("http") ? profile.website_url : `https://${profile.website_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ip-link-preview-btn"
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

            {/* Bottom Action Footer Panel */}
            <div className="ip-bottom-bar">
              <div className="ip-bottom-bar-info">
                {canEdit && isEditing ? (
                  <span className="ip-save-status editing">
                    <Sparkles size={16} className="ip-status-icon" /> Make changes and click Save Profile
                  </span>
                ) : canEdit ? (
                  <span className="ip-save-status readonly">
                    <ShieldCheck size={16} className="ip-status-icon" /> Profile shown in Read-Only format
                  </span>
                ) : (
                  <span className="ip-save-status readonly">
                    <ShieldCheck size={16} className="ip-status-icon" /> Viewing Interviewer Profile (Read-Only)
                  </span>
                )}
              </div>

              <div className="ip-bottom-bar-actions">
                {!canEdit ? (
                  <button
                    type="button"
                    className="ip-btn-primary edit-mode-btn"
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Scheduling</span>
                  </button>
                ) : isEditing ? (
                  <button
                    type="button"
                    className="ip-btn-primary"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    <Save size={18} />
                    <span>{saving ? "Saving Profile..." : "Save Profile"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ip-btn-primary edit-mode-btn"
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

export default InterviewerProfile;