import React, { useState, useRef, useEffect } from "react";
import "../styles/CandidateProfile.css";
import {
  LayoutDashboard,
  Brain,
  UserCircle,
  User,
  Briefcase,
  Save,
  Plus,
  Clock,
  X,
} from "lucide-react";
import api from "../api/axios";

// --- Helper to generate 30‑min interval time options ---
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = String(h).padStart(2, "0");
      const min = String(m).padStart(2, "0");
      const ampm = h < 12 ? "AM" : "PM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${String(displayHour).padStart(2, "0")}:${min} ${ampm}`;
      times.push({ value: `${hour}:${min}`, label });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

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
  });

  // --- Profile picture state ---
  const [profilePicture, setProfilePicture] = useState(null);

  // --- Expertise / Skills state ---
  const [expertise, setExpertise] = useState([]);
  const [newArea, setNewArea] = useState("");
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // --- Time slots state ---
  const [slots, setSlots] = useState([]);
  const [slotStartTime, setSlotStartTime] = useState("");
  const [slotEndTime, setSlotEndTime] = useState("");
  const [slotError, setSlotError] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // --- UI state ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Refs ---
  const profileRef = useRef(null);
  const experienceRef = useRef(null);
  const expertiseRef = useRef(null);
  const slotsRef = useRef(null);
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

  // --- Fetch time slots on mount ---
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await api.get("/interviewer/availability/");
        // ✅ FIX: Ensure we always set an array
        setSlots(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching slots:", error);
        setSlots([]); // fallback
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
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

  // --- Auto-highlight sidebar on scroll ---
  useEffect(() => {
    const sections = [
      { ref: profileRef, name: "profile" },
      { ref: experienceRef, name: "experience" },
      { ref: expertiseRef, name: "expertise" },
      { ref: slotsRef, name: "slots" },
    ];

    const updateActiveSection = () => {
      if (isProgrammaticScroll) return;
      const scrollY = window.scrollY + 120;
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
      slots: slotsRef,
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

  // --- Helper: format time for display ---
  const formatSlotTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- Time slots functions ---
  const handleAddSlot = async () => {
    setSlotError("");

    if (!slotStartTime || !slotEndTime) {
      setSlotError("Please select both start and end times.");
      return;
    }

    // Convert JavaScript day to Django day (Monday=0)
    let day_of_week = new Date().getDay(); // 0=Sunday, 6=Saturday
    if (day_of_week === 0) {
      day_of_week = 6; // Sunday -> 6
    } else {
      day_of_week = day_of_week - 1; // shift
    }

    // Validate that end time is after start time (basic check)
    const startParts = slotStartTime.split(":").map(Number);
    const endParts = slotEndTime.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    if (endMinutes <= startMinutes) {
      setSlotError("End time must be after start time.");
      return;
    }

    setAddingSlot(true);
    try {
      const response = await api.post("/interviewer/availability/", {
        day_of_week: day_of_week,
        start_time: slotStartTime,      // "HH:MM"
        end_time: slotEndTime,
        status: "available",
      });
      setSlots([...slots, response.data]);
      setSlotStartTime("");
      setSlotEndTime("");
      setSlotError("");
      setTimeout(() => slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (error) {
      console.error("Error adding slot:", error);
      let errorMsg = "Failed to add slot. Please check for overlaps.";
      if (error.response?.data) {
        errorMsg =
          error.response.data.non_field_errors?.[0] ||
          error.response.data.detail ||
          JSON.stringify(error.response.data);
      }
      setSlotError(errorMsg);
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    setDeletingSlotId(id);
    try {
      await api.delete(`/interviewer/availability/${id}/`);
      setSlots(slots.filter((slot) => slot.availability_id !== id));
    } catch (error) {
      console.error("Error deleting slot:", error);
      alert("Failed to delete slot. Please try again.");
    } finally {
      setDeletingSlotId(null);
    }
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

  // --- Save profile ---
  const handleSaveProfile = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("department", profile.department);
    formData.append("designation", profile.designation);
    formData.append("years_of_experience", profile.years_of_experience);
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
              <Briefcase size={18} /> <span>Experience</span>
            </div>

            <div
              className={`nav-item ${activeSection === "expertise" ? "active" : ""}`}
              onClick={() => handleNavClick("expertise")}
            >
              <Brain size={18} /> <span>Expertise</span>
            </div>

            <div
              className={`nav-item ${activeSection === "slots" ? "active" : ""}`}
              onClick={() => handleNavClick("slots")}
            >
              <Clock size={18} /> <span>Time Slots</span>
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

            {/* Experience */}
            <div className="education-section" ref={experienceRef}>
              <h3>Experience</h3>
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

            {/* Time Slots – restructured: slots tags above form */}
            <div className="education-section" ref={slotsRef}>
              <h3>Your Availability Slots</h3>

              {/* ✅ FIX: Guard against non-array slots */}
              {loadingSlots ? (
                <div className="slots-loading">Loading slots...</div>
              ) : Array.isArray(slots) && slots.length > 0 ? (
                <div className="skill-tags" style={{ marginBottom: "16px" }}>
                  {slots.map((slot) => {
                    const isDeleting = deletingSlotId === slot.availability_id;
                    return (
                      <span key={slot.availability_id} className="skill-tag">
                        {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
                        <button
                          type="button"
                          className="skill-remove"
                          onClick={() => handleDeleteSlot(slot.availability_id)}
                          disabled={isDeleting}
                          title="Delete Slot"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : null}

              {/* Add slot form */}
              <div className="slot-add-form">
                <div
                  className="form-row"
                  style={{
                    display: "flex",
                    gap: "16px",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                  }}
                >
                  {/* Start time dropdown */}
                  <div className="form-group" style={{ flex: "1 1 180px", minWidth: "160px" }}>
                    <label>
                      <Clock size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                      Start Time
                    </label>
                    <select
                      value={slotStartTime}
                      onChange={(e) => {
                        setSlotStartTime(e.target.value);
                        setSlotEndTime("");
                        setSlotError("");
                      }}
                    >
                      <option value="">Select start</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* End time dropdown */}
                  <div className="form-group" style={{ flex: "1 1 180px", minWidth: "160px" }}>
                    <label>
                      <Clock size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                      End Time
                    </label>
                    <select
                      value={slotEndTime}
                      disabled={!slotStartTime}
                      onChange={(e) => {
                        setSlotEndTime(e.target.value);
                        setSlotError("");
                      }}
                    >
                      <option value="">
                        {slotStartTime ? "Select end" : "Select start first"}
                      </option>
                      {TIME_OPTIONS.filter((t) => t.value > slotStartTime).map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Add button – now using proper button classes */}
                  <div className="form-group slot-add-btn-wrapper" style={{ flex: "none" }}>
                    <button
                      className="btn btn--primary btn-add-slot"
                      onClick={handleAddSlot}
                      disabled={addingSlot || !slotStartTime || !slotEndTime}
                      type="button"
                    >
                      <Plus size={16} />
                      {addingSlot ? "Adding..." : "Add Slot"}
                    </button>
                  </div>
                </div>

                {/* Inline validation error */}
                {slotError && (
                  <div
                    className="slot-error-msg"
                    style={{
                      marginTop: "10px",
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      color: "#dc2626",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <X size={15} style={{ flexShrink: 0 }} />
                    {slotError}
                  </div>
                )}
              </div>

              {/* Empty message – shown at the bottom when no slots exist */}
              {!loadingSlots && Array.isArray(slots) && slots.length === 0 && (
                <div className="suggestions-hint empty-slots-message" style={{ marginTop: "16px" }}>
                  No slots added yet.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-skip" onClick={() => (window.location.href = "/dashboard")}>
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