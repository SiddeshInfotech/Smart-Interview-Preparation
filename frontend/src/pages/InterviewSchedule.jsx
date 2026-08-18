import React, { useState, useEffect } from "react";
import { formatMediaUrl } from "../api/courseApi";
import {
  BrainCircuit,
  LayoutGrid,
  ClipboardList,
  FileText,
  CalendarClock,
  Bell,
  Settings,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Circle,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Hourglass,
  Briefcase,
  Sparkles,
  Send,
  AlertTriangle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/InterviewSchedule.css";
import api from "../api/axios";
import FeedbackResultModal from "../components/FeedbackResultModal";
import { useAuth } from "../context/AuthContext";

// Fallback domain choices if API fetch is pending
const DEFAULT_DOMAINS = [
  { domain_id: 1, name: "Web Development" },
  { domain_id: 2, name: "Software Testing" },
  { domain_id: 3, name: "Data Analysis" },
  { domain_id: 4, name: "Data Science" },
  { domain_id: 5, name: "Mobile Development" },
  { domain_id: 6, name: "DevOps & Cloud" },
];

// --- Helpers ---
function StatusBadge({ status }) {
  const map = {
    Open: { icon: Circle, className: "badge badge--open" },
    Requested: { icon: Hourglass, className: "badge badge--requested" },
    Scheduled: { icon: Circle, className: "badge badge--scheduled" },
    Completed: { icon: CheckCircle2, className: "badge badge--completed" },
    Cancelled: { icon: XCircle, className: "badge badge--cancelled" },
  };
  const { icon: Icon, className } = map[status] || map.Scheduled;
  return (
    <span className={className}>
      <Icon size={13} strokeWidth={2.5} />
      {status === 'Requested' ? 'Proposal Pending' : status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  const hStr = String(h).padStart(2, "0");
  return `${hStr}:${m} ${period}`;
}

const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour24 = String(h).padStart(2, "0");
      const min = String(m).padStart(2, "0");
      const value = `${hour24}:${min}`;

      const period = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const hour12Str = String(h12).padStart(2, "0");
      const label = `${hour12Str}:${min} ${period}`;

      times.push({ value, label });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

// =========================================================
// 15-MINUTE CANDIDATE INTERVIEW REMINDER BANNER
// =========================================================
function InterviewReminderBanner({ interviews, onJoinLobby }) {
  const [upcomingReminders, setUpcomingReminders] = useState([]);

  useEffect(() => {
    const checkReminders = () => {
      if (!Array.isArray(interviews)) return;
      const now = new Date();

      const reminders = interviews.filter((iv) => {
        if (iv.status !== "Scheduled" || (!iv.date && !iv.scheduled_date) || (!iv.time && !iv.scheduled_time)) return false;
        try {
          const dateVal = iv.date || iv.scheduled_date;
          const timeVal = iv.time || iv.scheduled_time;
          const scheduledTime = new Date(`${dateVal}T${timeVal}`);
          const diffMs = scheduledTime.getTime() - now.getTime();
          const diffMinutes = Math.floor(diffMs / (60 * 1000));
          return diffMinutes >= -5 && diffMinutes <= 15;
        } catch {
          return false;
        }
      });

      setUpcomingReminders(reminders);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [interviews]);

  if (upcomingReminders.length === 0) return null;

  return (
    <div className="interview-reminder-container">
      {upcomingReminders.map((rem) => {
        const dateVal = rem.date || rem.scheduled_date;
        const timeVal = rem.time || rem.scheduled_time;
        const scheduledTime = new Date(`${dateVal}T${timeVal}`);
        const now = new Date();
        const diffMs = scheduledTime.getTime() - now.getTime();
        const minutesLeft = Math.max(0, Math.ceil(diffMs / (60 * 1000)));

        return (
          <div key={rem.id || rem.schedule_id} className="interview-reminder-banner">
            <div className="reminder-content">
              <div className="reminder-icon-badge">
                <Bell className="reminder-bell-icon pulse" size={20} />
              </div>
              <div className="reminder-text-info">
                <h4>
                  ⏰ Upcoming Interview Reminder ({minutesLeft === 0 ? "Starting Now!" : `In ${minutesLeft} minute(s)`})
                </h4>
                <p>
                  Your <strong>{rem.domain_name || rem.domain || "Mock"}</strong> interview session with{" "}
                  <strong>{rem.interviewer || rem.interviewer_name}</strong> is scheduled for{" "}
                  <strong>{formatTime12(timeVal)}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-join-reminder"
              onClick={() => onJoinLobby(rem)}
            >
              <Sparkles size={15} /> Join Interview Lobby Now →
            </button>
          </div>
        );
      })}
    </div>
  );
}

// =========================================================
// INTERVIEWER SCHEDULE FORM (Interviewer Role Only)
// =========================================================
function ScheduleForm({ onSchedule, hasPremium = true }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [durationFilter, setDurationFilter] = useState("60");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [availableDomains, setAvailableDomains] = useState(DEFAULT_DOMAINS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await api.get("/course/domains/");
        const fetched = res.data.results || res.data || [];
        if (Array.isArray(fetched) && fetched.length > 0) {
          setAvailableDomains(fetched);
          setSelectedDomain(fetched[0].domain_id || fetched[0].name);
        } else {
          setSelectedDomain(DEFAULT_DOMAINS[0].domain_id);
        }
      } catch (err) {
        console.warn("Could not fetch domains endpoint, using default choices:", err);
        setSelectedDomain(DEFAULT_DOMAINS[0].domain_id);
      }
    };
    fetchDomains();
  }, []);

  const getLocalDateString = (date) => {
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleCreateSlot = async () => {
    if (!selectedDate || !selectedTime || !selectedDomain) {
      alert("Please fill in Date, Time, and Domain.");
      return;
    }
    const dateStr = getLocalDateString(selectedDate);
    setSubmitting(true);

    try {
      const res = await api.post("/interview/schedule/", {
        scheduled_date: dateStr,
        scheduled_time: selectedTime,
        duration_minutes: parseInt(durationFilter, 10),
        domain: selectedDomain,
      });

      alert("🎉 Interview slot created successfully! Candidates in this domain will now be able to view and apply for your slot.");
      if (onSchedule) onSchedule(res.data);
      setSelectedDate(null);
      setSelectedTime("");
    } catch (err) {
      console.error("Failed to create interview slot", err);
      const errMsg = err.response?.data?.detail || err.response?.data?.domain || err.message;
      alert("Failed to create slot: " + JSON.stringify(errMsg));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedDate && selectedTime && selectedDomain;

  const datePickerStyles = {
    wrapper: "custom-datepicker-wrapper",
    input: "field__input",
    calendar: "custom-datepicker-calendar",
  };

  return (
    <form className="card form" onSubmit={(e) => e.preventDefault()}>
      <div className="form__grid">
        {/* Domain Field */}
        <label className="field">
          <span className="field__label">
            <Briefcase size={14} className="field__icon" /> Select Domain (Interview Category)
          </span>
          <select
            className="field__input"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            <option value="">Select Domain...</option>
            {availableDomains.map((dom) => (
              <option key={dom.domain_id || dom.id || dom.name} value={dom.domain_id || dom.name}>
                {dom.name}
              </option>
            ))}
          </select>
        </label>

        {/* Date Picker */}
        <label className="field">
          <span className="field__label">
            <CalendarIcon size={14} className="field__icon" /> Scheduled Date
          </span>
          <div className={datePickerStyles.wrapper}>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Choose date..."
              className={datePickerStyles.input}
              calendarClassName={datePickerStyles.calendar}
              isClearable
              showPopperArrow={false}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
        </label>

        {/* Time Dropdown */}
        <label className="field">
          <span className="field__label">
            <ClockIcon size={14} className="field__icon" /> Scheduled Start Time
          </span>
          <select
            className="field__input"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            <option value="">Select time</option>
            {TIME_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {/* Duration Dropdown */}
        <label className="field">
          <span className="field__label">
            <Hourglass size={14} className="field__icon" /> Duration
          </span>
          <select
            className="field__input"
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </label>

        {/* Create Slot Action */}
        <div className="field" style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleCreateSlot}
            disabled={!isFormValid || submitting}
            style={{ width: "100%", justifyContent: "center", height: "46px", fontSize: "15px", fontWeight: "600" }}
          >
            {submitting ? "Publishing Slot..." : "🚀 Publish Interview Slot"}
          </button>
        </div>
      </div>
    </form>
  );
}

// =========================================================
// CANDIDATE UNSCHEDULED INTERVIEWS LIST (Candidate Role Only)
// =========================================================
function UnscheduledInterviewsList({ onApplySuccess }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [candidateDomain, setCandidateDomain] = useState("");

  const fetchUnscheduled = async () => {
    setLoading(true);
    try {
      const res = await api.get("/interview/unscheduled/");
      const data = res.data.results || res.data || [];
      setSlots(Array.isArray(data) ? data : []);
      if (res.data.candidate_domain_name) {
        setCandidateDomain(res.data.candidate_domain_name);
      }
    } catch (err) {
      console.error("Failed to fetch unscheduled slots:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnscheduled();
  }, []);

  const handleApply = async (slot) => {
    const schedId = slot.schedule_id || slot.id;
    setApplyingId(schedId);
    try {
      await api.post(`/interview/apply/${schedId}/`);
      alert("✅ Application submitted successfully! The interviewer will review your proposal.");
      fetchUnscheduled();
      if (onApplySuccess) onApplySuccess();
    } catch (err) {
      console.error("Apply error:", err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message;
      alert("Could not apply for interview: " + msg);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="card unscheduled-section">
      {loading ? (
        <div className="empty">Loading available interview slots...</div>
      ) : slots.length === 0 ? (
        <div className="unscheduled-empty-state">
          <p>No available interviews at the moment.</p>
        </div>
      ) : (
        <div className="unscheduled-grid">
          {slots.map((slot) => {
            const schedId = slot.schedule_id || slot.id;
            const isApplying = applyingId === schedId;

            return (
              <div
                key={schedId}
                className="unscheduled-card"
              >
                <div className="unscheduled-card__body">
                  <div className="interviewer-profile-box">
                    <div className="interviewer-avatar">
                      {slot.interviewer_profile_picture ? (
                        <img src={formatMediaUrl(slot.interviewer_profile_picture)} alt={slot.interviewer_name} />
                      ) : (
                        <User size={24} color="#6b7280" />
                      )}
                    </div>
                    <div>
                      <strong className="interviewer-name">{slot.interviewer_name || "Interviewer"}</strong>
                      <span className="interviewer-designation">{slot.interviewer_designation || "Technical Interviewer"}</span>
                    </div>
                  </div>

                  <div className="slot-timing-details">
                    <div className="timing-item">
                      <Calendar size={14} className="icon" />
                      <span>{formatDate(slot.scheduled_date)}</span>
                    </div>
                    <div className="timing-item">
                      <Clock size={14} className="icon" />
                      <span>{formatTime12(slot.scheduled_time)} ({slot.duration_minutes || 60} mins)</span>
                    </div>
                  </div>
                </div>

                <div className="unscheduled-card__footer">
                  <button
                    type="button"
                    className="btn-apply-slot"
                    disabled={isApplying}
                    onClick={() => handleApply(slot)}
                  >
                    <Send size={14} />
                    {isApplying ? "Submitting Proposal..." : "Apply for Interview"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================
// DESCRIPTIVE INTERVIEW LIST (MY INTERVIEWS)
// =========================================================
function InterviewList({ interviews, onSelectInterview, userRole }) {
  const [filter, setFilter] = useState("Scheduled");
  const filters = ["Scheduled", "Requested", "Completed", "Cancelled", "All"];
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [loadingResultId, setLoadingResultId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});

  const safeInterviews = Array.isArray(interviews) ? interviews : [];

  const processedInterviews = safeInterviews.map((iv) => {
    const scheduleId = iv.id || iv.schedule_id;
    const effectiveStatus = statusOverrides[scheduleId]?.status || iv.status;
    const effectiveMeetingLink = statusOverrides[scheduleId]?.meeting_link || iv.meeting_link;
    const effectiveIv = { ...iv, status: effectiveStatus, meeting_link: effectiveMeetingLink };

    const dateVal = effectiveIv.date || effectiveIv.scheduled_date;
    if (dateVal && (effectiveIv.status === "Scheduled" || effectiveIv.status === "Requested" || effectiveIv.status === "Open")) {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        if (todayStr > dateVal) {
          return { ...effectiveIv, status: "Cancelled" };
        }
      } catch (err) {
        console.warn("Date compare error:", err);
      }
    }

    if (effectiveIv.status === "Scheduled" && (effectiveIv.date || effectiveIv.scheduled_date) && (effectiveIv.time || effectiveIv.scheduled_time)) {
      try {
        const dateVal = effectiveIv.date || effectiveIv.scheduled_date;
        const timeVal = effectiveIv.time || effectiveIv.scheduled_time;
        const scheduledTime = new Date(`${dateVal}T${timeVal}`);
        const now = new Date();
        const timeoutMs = 15 * 60 * 1000;
        if (now.getTime() > scheduledTime.getTime() + timeoutMs) {
          return { ...effectiveIv, status: "Cancelled" };
        }
      } catch (err) {
        console.warn("Date parse error:", err);
      }
    }
    return effectiveIv;
  });

  const filtered = filter === "All"
    ? processedInterviews
    : processedInterviews.filter((i) => i.status === filter);

  const handleAccept = async (iv, e) => {
    if (e) e.stopPropagation();
    const scheduleId = iv.id || iv.schedule_id;
    setAcceptingId(scheduleId);
    try {
      await api.post(`/interview/accept/${scheduleId}/`);
      setStatusOverrides((prev) => ({
        ...prev,
        [scheduleId]: { status: "Scheduled", meeting_link: iv.room_name || `room-${scheduleId}` },
      }));
      alert("✅ Interview proposal accepted!");
      window.dispatchEvent(new Event("notificationUpdate"));
    } catch (err) {
      console.error("Failed to accept request:", err);
      alert("Could not accept request.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (iv, e) => {
    if (e) e.stopPropagation();
    const scheduleId = iv.id || iv.schedule_id;
    setDecliningId(scheduleId);
    try {
      await api.post(`/interview/decline/${scheduleId}/`);
      setStatusOverrides((prev) => ({
        ...prev,
        [scheduleId]: { status: "Open", meeting_link: "" },
      }));
      alert("Interview proposal declined and slot re-opened.");
      window.dispatchEvent(new Event("notificationUpdate"));
    } catch (err) {
      console.error("Failed to decline request:", err);
      alert("Could not decline request.");
    } finally {
      setDecliningId(null);
    }
  };

  const handleViewResult = async (iv, e) => {
    if (e) e.stopPropagation();
    const scheduleId = iv.id || iv.schedule_id;
    setLoadingResultId(scheduleId);
    try {
      const res = await api.get(`/interview/feedback/${scheduleId}/`);
      if (res.data.has_feedback && res.data.feedback) {
        setSelectedFeedback(res.data.feedback);
        setShowResultModal(true);
      } else {
        if (userRole === "interviewer") {
          onSelectInterview(iv);
        } else {
          alert("Interview feedback result is not yet available for this session.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
      if (userRole === "interviewer") {
        onSelectInterview(iv);
      } else {
        alert("Could not load feedback results.");
      }
    } finally {
      setLoadingResultId(null);
    }
  };

  return (
    <div className="card">
      <div className="list__filters">
        {filters.map((filterName) => (
          <button
            key={filterName}
            className={`pill ${filter === filterName ? "pill--active" : ""}`}
            onClick={() => setFilter(filterName)}
            type="button"
          >
            {filterName}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No interviews found in this category.</div>
      ) : (
        <div className="descriptive-interview-list">
          {filtered.map((iv, index) => {
            const isMeetingReady = iv.status === "Scheduled" || Boolean(iv.meeting_link || iv.room_name || iv.roomName);
            const candidateUser = iv.candidate_name || iv.candidate_username || iv.candidate || "Open / Unassigned";
            const interviewerUser = iv.interviewer_name || iv.interviewer_username || iv.interviewer || "Interviewer";
            const domName = (iv.domain_name || iv.domain || "").trim();
            const scheduleId = iv.id || iv.schedule_id;
            const isAccepting = acceptingId === scheduleId;
            const isDeclining = decliningId === scheduleId;
            const isPendingProposal = iv.status === "Requested";

            const handleCardClick = () => {
              if (iv.status === "Completed") {
                if (userRole !== "interviewer") {
                  handleViewResult(iv);
                }
              } else if (iv.status === "Scheduled") {
                onSelectInterview(iv);
              } else {
                onSelectInterview(iv);
              }
            };

            return (
              <div
                key={scheduleId || index}
                className="descriptive-interview-card"
                onClick={handleCardClick}
                style={{
                  cursor: (iv.status === "Completed" && userRole === "interviewer") ? "default" : "pointer"
                }}
              >
                <div className="descriptive-card__header">
                  {domName && domName.toLowerCase() !== "general" ? (
                    <span className="domain-tag">
                      <Briefcase size={12} /> {domName}
                    </span>
                  ) : <div />}
                  <div className="descriptive-card__status-wrap">
                    <StatusBadge status={iv.status} />
                  </div>
                </div>

                <div className="descriptive-card__body">
                  <div className="descriptive-info-grid">
                    {userRole === "interviewer" ? (
                      <div className="descriptive-info-item">
                        <User size={15} className="info-icon" />
                        <div>
                          <span className="info-label">Candidate</span>
                          <strong className="info-value">{candidateUser}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="descriptive-info-item">
                        <User size={15} className="info-icon" />
                        <div>
                          <span className="info-label">Interviewer</span>
                          <strong className="info-value">{interviewerUser}</strong>
                        </div>
                      </div>
                    )}

                    <div className="descriptive-info-item">
                      <Calendar size={15} className="info-icon" />
                      <div>
                        <span className="info-label">Scheduled Date</span>
                        <strong className="info-value">{formatDate(iv.date || iv.scheduled_date)}</strong>
                      </div>
                    </div>

                    <div className="descriptive-info-item">
                      <Clock size={15} className="info-icon" />
                      <div>
                        <span className="info-label">Time & Duration</span>
                        <strong className="info-value">
                          {formatTime12(iv.time || iv.scheduled_time)} ({iv.duration_minutes || 60} mins)
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {(iv.status !== "Completed" || userRole !== "interviewer") && (
                  <div className="descriptive-card__footer">
                    <div className="meeting-status">
                      {iv.status === "Completed" ? null : iv.status === "Cancelled" ? (
                        <span className="meeting-badge cancelled badge--cancelled">
                          ❌ Cancelled
                        </span>
                      ) : iv.status === "Requested" ? (
                        <span className="meeting-badge pending">🟡 Proposal Pending Review</span>
                      ) : isMeetingReady ? (
                        <span className="meeting-badge ready">🟢 Meeting Link Ready</span>
                      ) : (
                        <span className="meeting-badge pending">⚪ Slot Published</span>
                      )}
                    </div>

                  {userRole === "interviewer" && isPendingProposal ? (
                    <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn--success"
                        disabled={isAccepting || isDeclining}
                        style={{
                          background: isAccepting ? "#15803d" : "#22c55e",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: "600",
                          fontSize: "12px",
                          cursor: isAccepting || isDeclining ? "wait" : "pointer",
                          opacity: isAccepting || isDeclining ? 0.8 : 1,
                        }}
                        onClick={(e) => handleAccept(iv, e)}
                      >
                        {isAccepting ? "Accepting..." : "Accept Proposal"}
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger"
                        disabled={isAccepting || isDeclining}
                        style={{
                          background: isDeclining ? "#b91c1c" : "#ef4444",
                          color: "#ffffff",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: "600",
                          fontSize: "12px",
                          cursor: isAccepting || isDeclining ? "wait" : "pointer",
                          opacity: isAccepting || isDeclining ? 0.8 : 1,
                        }}
                        onClick={(e) => handleDecline(iv, e)}
                      >
                        {isDeclining ? "Declining..." : "Decline Proposal"}
                      </button>
                    </div>
                  ) : iv.status === "Completed" ? (
                    userRole !== "interviewer" ? (
                      <button
                        className="btn-view-result"
                        type="button"
                        disabled={loadingResultId === scheduleId}
                        style={{
                          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          color: "#ffffff",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "none",
                          fontWeight: "600",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                        }}
                        onClick={(e) => handleViewResult(iv, e)}
                      >
                        {loadingResultId === scheduleId ? "Loading..." : "📊 View Result"}
                      </button>
                    ) : null
                  ) : iv.status === "Scheduled" ? (
                    <button
                      className={`btn-join-session ${!isMeetingReady ? "btn-disabled" : ""}`}
                      type="button"
                      disabled={!isMeetingReady}
                      style={
                        !isMeetingReady
                          ? {
                              opacity: 0.6,
                              cursor: "not-allowed",
                              background: "#94a3b8",
                              color: "#ffffff",
                              boxShadow: "none",
                            }
                          : {}
                      }
                      title={
                        !isMeetingReady
                          ? "Waiting for interviewer acceptance"
                          : "Enter live interview lobby"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMeetingReady) {
                          onSelectInterview(iv);
                        }
                      }}
                    >
                      {isMeetingReady ? "Join Interview →" : "Lobby Disabled (Pending Acceptance)"}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {showResultModal && selectedFeedback && (
        <FeedbackResultModal
          feedback={selectedFeedback}
          onClose={() => {
            setShowResultModal(false);
            setSelectedFeedback(null);
          }}
        />
      )}
    </div>
  );
}

// --- InterviewDetails ---
function InterviewDetails({ interview, onBack, onUpdateStatus, userRole }) {
  const domName = (interview.domain_name || interview.domain || "").trim();
  return (
    <div className="card details">
      <button className="back-link" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Back to Upcoming Interviews
      </button>

      <div className="details__header">
        <div>
          <h2>{userRole === "interviewer" ? (interview.candidate_name || interview.candidate || "Candidate") : (interview.interviewer_name || interview.interviewer || "Interviewer")}</h2>
          {domName && domName.toLowerCase() !== "general" && (
            <span className="tag">{domName}</span>
          )}
        </div>
        <StatusBadge status={interview.status} />
      </div>

      <div className="details__grid">
        {userRole === "interviewer" ? (
          <div className="details__item">
            <span className="details__label">
              <User size={14} /> Candidate
            </span>
            <span className="details__value">{interview.candidate_name || interview.candidate || "Open Slot"}</span>
          </div>
        ) : (
          <div className="details__item">
            <span className="details__label">
              <User size={14} /> Interviewer
            </span>
            <span className="details__value">{interview.interviewer_name || interview.interviewer || "Interviewer"}</span>
          </div>
        )}
        <div className="details__item">
          <span className="details__label">
            <Calendar size={14} /> Date
          </span>
          <span className="details__value">{formatDate(interview.date || interview.scheduled_date)}</span>
        </div>
        <div className="details__item">
          <span className="details__label">
            <Clock size={14} /> Time
          </span>
          <span className="details__value">{interview.time || interview.scheduled_time} ({interview.duration_minutes || 60} mins)</span>
        </div>
      </div>

      {interview.status === "Scheduled" && (
        <div className="details__actions">
          <button
            className="btn btn--success"
            onClick={() => onUpdateStatus(interview.id, "Completed")}
            type="button"
          >
            <CheckCircle2 size={16} /> Mark as Completed
          </button>
          <button
            className="btn btn--danger"
            onClick={() => onUpdateStatus(interview.id, "Cancelled")}
            type="button"
          >
            <XCircle size={16} /> Cancel Interview
          </button>
        </div>
      )}
    </div>
  );
}

// =========================================================
// MAIN EXPORT COMPONENT
// =========================================================
export default function InterviewSchedule({
  standalone = false,
  interviews: propInterviews,
  onSchedule: propOnSchedule,
  onSelectInterview: propOnSelectInterview,
  hasPremium = true,
}) {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || localStorage.getItem("user_role") || "candidate";
  const isInterviewer = userRole === "interviewer";
  const isCandidate = !isInterviewer;

  const [localInterviews, setLocalInterviews] = useState([]);
  const interviews = propInterviews || localInterviews;

  const [tab, setTab] = useState(isInterviewer ? "schedule" : "available");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isInterviewer && tab === "available") {
      setTab("schedule");
    } else if (isCandidate && tab === "schedule") {
      setTab("available");
    }
  }, [isInterviewer, isCandidate, tab]);

  const handleSchedule = (newInterview) => {
    if (propOnSchedule) {
      propOnSchedule(newInterview);
    } else {
      setLocalInterviews([newInterview, ...localInterviews]);
    }
    setTab("my_slots");
  };

  const handleSelect = (iv) => {
    if (propOnSelectInterview) {
      propOnSelectInterview(iv);
    } else {
      setSelected(iv);
      setTab("details");
    }
  };

  const handleUpdateStatus = (id, status) => {
    const updated = interviews.map((iv) =>
      iv.id === id ? { ...iv, status } : iv
    );
    setLocalInterviews(updated);
    setSelected(updated.find((iv) => iv.id === id));
  };

  return (
    <div className={standalone ? "interview-schedule-standalone" : "page"}>
      <main className={standalone ? "" : "page__content"}>
        {/* 15-Minute Countdown Reminder Banner for Candidates */}
        {isCandidate && (
          <InterviewReminderBanner
            interviews={interviews}
            onJoinLobby={handleSelect}
          />
        )}

        <div className="page__header">
          <div>
            <h1>Interview Scheduling</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs">
          {isInterviewer ? (
            <>
              <button
                className={`tabs__item ${tab === "schedule" ? "tabs__item--active" : ""}`}
                onClick={() => setTab("schedule")}
                type="button"
              >
                Schedule New Interview
              </button>
              <button
                className={`tabs__item ${tab === "my_slots" || tab === "details" ? "tabs__item--active" : ""}`}
                onClick={() => setTab("my_slots")}
                type="button"
              >
                My Scheduled Interviews
              </button>
            </>
          ) : (
            <>
              <button
                className={`tabs__item ${tab === "available" ? "tabs__item--active" : ""}`}
                onClick={() => setTab("available")}
                type="button"
              >
                Available Interviews
              </button>
              <button
                className={`tabs__item ${tab === "my_interviews" || tab === "details" ? "tabs__item--active" : ""}`}
                onClick={() => setTab("my_interviews")}
                type="button"
              >
                My Scheduled Interviews
              </button>
            </>
          )}
        </div>

        {/* Tab Contents */}
        {isInterviewer && tab === "schedule" && (
          <ScheduleForm onSchedule={handleSchedule} hasPremium={hasPremium} />
        )}

        {isCandidate && tab === "available" && (
          <UnscheduledInterviewsList onApplySuccess={() => setTab("my_interviews")} />
        )}

        {(tab === "my_slots" || tab === "my_interviews") && (
          <InterviewList
            interviews={interviews}
            onSelectInterview={handleSelect}
            userRole={userRole}
          />
        )}

        {tab === "details" && selected && (
          <InterviewDetails
            interview={selected}
            onBack={() => setTab(isInterviewer ? "my_slots" : "my_interviews")}
            onUpdateStatus={handleUpdateStatus}
            userRole={userRole}
          />
        )}
      </main>
    </div>
  );
}