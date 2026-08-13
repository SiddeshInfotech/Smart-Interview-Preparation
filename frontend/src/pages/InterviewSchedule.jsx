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
  CalendarPlus,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/InterviewSchedule.css";
import api from "../api/axios";

// Fallback seed data (only used if no `interviews` prop is provided)
const initialInterviews = [
  {
    id: 1,
    interviewer: "Asha Patel",
    date: "2026-07-18",
    time: "10:30",
    type: "Technical",
    status: "Scheduled",
    roomName: "demo-room-1",
  },
  {
    id: 2,
    interviewer: "Rahul Verma",
    date: "2026-07-16",
    time: "15:00",
    type: "HR Round",
    status: "Completed",
    roomName: "demo-room-2",
  },
  {
    id: 3,
    interviewer: "Neha Singh",
    date: "2026-07-14",
    time: "12:00",
    type: "Managerial",
    status: "Cancelled",
    roomName: "demo-room-3",
  },
];

// --- Helpers ---
function StatusBadge({ status }) {
  const map = {
    Scheduled: { icon: Circle, className: "badge badge--scheduled" },
    Completed: { icon: CheckCircle2, className: "badge badge--completed" },
    Cancelled: { icon: XCircle, className: "badge badge--cancelled" },
  };
  const { icon: Icon, className } = map[status] || map.Scheduled;
  return (
    <span className={className}>
      <Icon size={13} strokeWidth={2.5} />
      {status}
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

// --- Helper to generate time options in 12-hour AM/PM format ---
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

// --- ScheduleForm with Search Interviewers button ---
function ScheduleForm({ onSchedule, hasPremium = true }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  // Free users are locked to 30 min; premium users default to 60 min
  const [durationFilter, setDurationFilter] = useState(hasPremium ? "60" : "30");
  const [hasSearched, setHasSearched] = useState(false);
  const [submittingRequestId, setSubmittingRequestId] = useState(null);

  // Reset slots when inputs change
  useEffect(() => {
    setSlots([]);
    setHasSearched(false);
  }, [selectedDate, selectedTime, durationFilter]);

  // Convert time string "HH:MM" or "HH:MM:SS" to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const getLocalDateString = (date) => {
    if (!date) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Search for interviewers
  const handleSearch = async () => {
    if (!selectedDate) return;
    const dateStr = getLocalDateString(selectedDate);
    setLoadingSlots(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/interviewer/available-slots/?date=${dateStr}`);
      setSlots(res.data);
    } catch (err) {
      console.error("Failed to fetch slots", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Filter slots locally (by start time and duration)
  const durationMin = parseInt(durationFilter, 10) || 0;
  const candStart = timeToMinutes(selectedTime);
  const candEnd = candStart + durationMin;

  const filteredSlots = slots.filter((slot) => {
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    return candStart >= slotStart && candEnd <= slotEnd;
  });

  // Deduplicate interviewers
  const availableInterviewers = [];
  const seen = new Set();
  filteredSlots.forEach((slot) => {
    if (!seen.has(slot.interviewer)) {
      seen.add(slot.interviewer);
      availableInterviewers.push({
        id: slot.interviewer,
        name: slot.interviewer_name || "Interviewer",
        designation: slot.interviewer_designation || "",
        email: slot.interviewer_email || "",
        profilePicture: slot.interviewer_profile_picture || null,
      });
    }
  });

  const handleSendRequest = async (interviewer) => {
    if (!selectedDate || !selectedTime || !durationFilter) return;
    const dateStr = getLocalDateString(selectedDate);
    setSubmittingRequestId(interviewer.id);
    try {
      const res = await api.post("/interview/schedule/", {
        interviewer: interviewer.id,
        scheduled_date: dateStr,
        scheduled_time: selectedTime,
        duration_minutes: durationMin,
      });
      alert(`Interview request sent successfully to ${interviewer.name}!`);
      // Pass the raw response to the parent (which will transform it)
      onSchedule(res.data);
    } catch (err) {
      console.error("Failed to send request", err);
      alert("Failed to send interview request: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSubmittingRequestId(null);
    }
  };

  // Determine if search button should be enabled
  const isSearchEnabled = selectedDate && selectedTime !== "" && durationFilter !== "";

  const datePickerStyles = {
    wrapper: "custom-datepicker-wrapper",
    input: "field__input",
    calendar: "custom-datepicker-calendar",
  };

  return (
    <form className="card form" onSubmit={(e) => e.preventDefault()}>
      <div className="form__grid">
        {/* Date Picker */}
        <label className="field">
          <span className="field__label">
            <CalendarIcon size={14} className="field__icon" /> Select Date
          </span>
          <div className={datePickerStyles.wrapper}>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Choose a date..."
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

        {/* Time slot selection dropdown */}
        <label className="field">
          <span className="field__label">
            <ClockIcon size={14} className="field__icon" /> Select Time
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

        {/* Duration dropdown */}
        <label className="field">
          <span className="field__label">
            <Hourglass size={14} className="field__icon" /> Duration
            {!hasPremium && (
              <span style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
                background: '#fef3c7',
                color: '#92400e',
                padding: '2px 7px',
                borderRadius: 20,
                letterSpacing: '0.3px',
              }}>Free plan</span>
            )}
          </span>
          {hasPremium ? (
            <select
              className="field__input"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
            >
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          ) : (
            <select
              className="field__input"
              value="30"
              disabled
              title="Upgrade to Premium for sessions up to 90 minutes"
              style={{ cursor: 'not-allowed', opacity: 0.7 }}
            >
              <option value="30">30 min (max on Free plan)</option>
            </select>
          )}
        </label>

        {/* Search button */}
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSearch}
            disabled={!isSearchEnabled || loadingSlots}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loadingSlots ? "Searching..." : "🔍 Search Interviewers"}
          </button>
        </div>

        {/* Available Interviewers list – only shown after search */}
        {hasSearched && (
          <div className="field slots-section" style={{ gridColumn: "1 / -1" }}>
            <span className="field__label">
              <CalendarClock size={14} className="field__icon" /> Available Interviewers
            </span>
            {loadingSlots ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                Finding available interviewers...
              </div>
            ) : availableInterviewers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                No interviewers available for this time slot.
              </div>
            ) : (
              <div className="interviewer-list">
                {availableInterviewers.map((interviewer) => (
                  <div key={interviewer.id} className="interviewer-row">
                    <div className="interviewer-profile-info">
                      <div className="interviewer-pic-container">
                        {interviewer.profilePicture ? (
                          <img src={formatMediaUrl(interviewer.profilePicture)} alt={interviewer.name} className="interviewer-pic" />
                        ) : (
                          <User size={30} color="#9ca3af" />
                        )}
                      </div>
                      <div className="interviewer-details">
                        <span className="interviewer-username">{interviewer.name}</span>
                        <span className="interviewer-email">{interviewer.email}</span>
                      </div>
                    </div>
                    <div className="interviewer-actions">
                      <a
                        href={`/interviewer-profile?interviewer_id=${interviewer.id}`}
                        className="btn-see-details"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        See more details
                      </a>
                      <button
                        type="button"
                        className="btn-send-request"
                        disabled={submittingRequestId === interviewer.id}
                        onClick={() => handleSendRequest(interviewer)}
                      >
                        {submittingRequestId === interviewer.id ? "Sending..." : "Send request"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

import FeedbackResultModal from "../components/FeedbackResultModal";
import { useAuth } from "../context/AuthContext";

// --- Descriptive InterviewList ---
function InterviewList({ interviews, onSelectInterview, userRole }) {
  const [filter, setFilter] = useState("Scheduled");
  const filters = ["Scheduled", "Completed", "Cancelled", "All"];
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [loadingResultId, setLoadingResultId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  // Optimistic UI: track status overrides to trigger re-renders without mutating props
  const [statusOverrides, setStatusOverrides] = useState({});

  const safeInterviews = Array.isArray(interviews) ? interviews : [];

  // Check 15m timeout auto cancellation
  const processedInterviews = safeInterviews.map((iv) => {
    const scheduleId = iv.id || iv.schedule_id;
    // Apply optimistic status overrides
    const effectiveStatus = statusOverrides[scheduleId]?.status || iv.status;
    const effectiveMeetingLink = statusOverrides[scheduleId]?.meeting_link || iv.meeting_link;
    const effectiveIv = { ...iv, status: effectiveStatus, meeting_link: effectiveMeetingLink };

    if (effectiveIv.status === "Scheduled" && effectiveIv.date && effectiveIv.time) {
      try {
        const scheduledTime = new Date(`${effectiveIv.date}T${effectiveIv.time}`);
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
      // Optimistic UI update via React state (not direct mutation)
      setStatusOverrides((prev) => ({
        ...prev,
        [scheduleId]: { status: "Scheduled", meeting_link: iv.room_name || `room-${scheduleId}` },
      }));
      // Trigger notification refresh
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
      // Optimistic UI update via React state (not direct mutation)
      setStatusOverrides((prev) => ({
        ...prev,
        [scheduleId]: { status: "Cancelled", meeting_link: iv.meeting_link },
      }));
      // Trigger notification refresh
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
            const isMeetingReady = Boolean(iv.meeting_link);
            const candidateUser = iv.candidate_username || iv.candidate_name || iv.candidate || "candidate";
            const interviewerUser = iv.interviewer_username || iv.interviewer_name || iv.interviewer || "interviewer";
            const scheduleId = iv.id || iv.schedule_id;
            const isAccepting = acceptingId === scheduleId;
            const isDeclining = decliningId === scheduleId;

            const handleCardClick = () => {
              if (iv.status === "Completed") {
                handleViewResult(iv);
              } else if (iv.status === "Scheduled") {
                if (isMeetingReady) {
                  onSelectInterview(iv);
                }
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
                  cursor: iv.status === "Scheduled" && !isMeetingReady ? "default" : "pointer"
                }}
              >
                <div className="descriptive-card__header">
                  <div className="descriptive-card__status-wrap">
                    <StatusBadge status={iv.status} />
                  </div>
                </div>

                <div className="descriptive-card__body">
                  <div className="descriptive-info-grid">
                    <div className="descriptive-info-item">
                      <User size={15} className="info-icon" />
                      <div>
                        <span className="info-label">Candidate</span>
                        <strong className="info-value">{candidateUser}</strong>
                      </div>
                    </div>

                    <div className="descriptive-info-item">
                      <User size={15} className="info-icon" />
                      <div>
                        <span className="info-label">Interviewer</span>
                        <strong className="info-value">{interviewerUser}</strong>
                      </div>
                    </div>

                    <div className="descriptive-info-item">
                      <Calendar size={15} className="info-icon" />
                      <div>
                        <span className="info-label">Scheduled Date</span>
                        <strong className="info-value">{formatDate(iv.date)}</strong>
                      </div>
                    </div>

                    <div className="descriptive-info-item">
                      <Clock size={15} className="info-icon" />
                      <div>
                        <span className="info-label">Time & Duration</span>
                        <strong className="info-value">
                          {formatTime12(iv.time)} ({iv.duration_minutes || 60} mins)
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="descriptive-card__footer">
                  <div className="meeting-status">
                    {iv.status === "Completed" ? (
                      <span className="meeting-badge ready badge--completed">
                        ✅ Interview Completed
                      </span>
                    ) : iv.status === "Cancelled" ? (
                      <span className="meeting-badge cancelled badge--cancelled">
                        ❌ Cancelled
                      </span>
                    ) : isMeetingReady ? (
                      <span className="meeting-badge ready">🟢 Meeting Link Ready</span>
                    ) : (
                      <span className="meeting-badge pending">🟡 Pending Acceptance</span>
                    )}
                  </div>

                  {userRole === "interviewer" && iv.status !== "Completed" && iv.status !== "Cancelled" && !isMeetingReady ? (
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
                        {isAccepting ? "Accepting..." : "Accept"}
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
                        {isDeclining ? "Declining..." : "Decline"}
                      </button>
                    </div>
                  ) : iv.status === "Completed" ? (
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
                          ? "Waiting for interviewer to accept the interview request"
                          : "View and join the live interview lobby"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMeetingReady) {
                          onSelectInterview(iv);
                        }
                      }}
                    >
                      {isMeetingReady ? "View & Join Lobby →" : "Lobby Disabled (Pending Acceptance)"}
                    </button>
                  ) : (
                    <button className="btn-join-session" type="button" onClick={() => onSelectInterview(iv)}>
                      View Details →
                    </button>
                  )}
                </div>
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
function InterviewDetails({ interview, onBack, onUpdateStatus }) {
  return (
    <div className="card details">
      <button className="back-link" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Back to Upcoming Interviews
      </button>

      <div className="details__header">
        <div>
          <h2>{interview.interviewer}</h2>
          <span className="tag">{interview.type || "Interview"}</span>
        </div>
        <StatusBadge status={interview.status} />
      </div>

      <div className="details__grid">
        <div className="details__item">
          <span className="details__label">
            <User size={14} /> Candidate
          </span>
          <span className="details__value">{interview.candidate || "Candidate"}</span>
        </div>
        <div className="details__item">
          <span className="details__label">
            <User size={14} /> Interviewer
          </span>
          <span className="details__value">{interview.interviewer || "Interviewer"}</span>
        </div>
        <div className="details__item">
          <span className="details__label">
            <Calendar size={14} /> Date
          </span>
          <span className="details__value">{formatDate(interview.date)}</span>
        </div>
        <div className="details__item">
          <span className="details__label">
            <Clock size={14} /> Time
          </span>
          <span className="details__value">{interview.time} ({interview.duration_minutes || 60} mins)</span>
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

// --- Main export ---
export default function InterviewSchedule({
  standalone = false,
  interviews: propInterviews,
  onSchedule: propOnSchedule,
  onSelectInterview: propOnSelectInterview,
  hasPremium = true,
}) {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || localStorage.getItem("user_role") || "candidate";
  const isCandidate = userRole === "candidate";

  const [localInterviews, setLocalInterviews] = useState(initialInterviews);
  const interviews = propInterviews || localInterviews;

  // Interviewers only have access to "upcoming" tab
  const [tab, setTab] = useState(isCandidate ? "schedule" : "upcoming");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isCandidate && tab === "schedule") {
      setTab("upcoming");
    }
  }, [isCandidate, tab]);

  const handleSchedule = (newInterview) => {
    if (propOnSchedule) {
      propOnSchedule(newInterview);
    } else {
      setLocalInterviews([newInterview, ...localInterviews]);
    }
    setTab("upcoming");
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
      {!standalone && <Navbar active="Interview Scheduling" />}

      <main className={standalone ? "" : "page__content"}>
        <div className="page__header">
          <div>
            <h1>Interview Scheduling</h1>
            <p>
              {isCandidate
                ? "Request and track upcoming mock interview sessions."
                : "View and manage scheduled candidate interviews."}
            </p>
          </div>
        </div>

        <div className="tabs">
          {isCandidate && (
            <button
              className={`tabs__item ${tab === "schedule" ? "tabs__item--active" : ""}`}
              onClick={() => setTab("schedule")}
              type="button"
            >
              Schedule Interview
            </button>
          )}
          <button
            className={`tabs__item ${tab === "upcoming" || tab === "details" ? "tabs__item--active" : ""}`}
            onClick={() => setTab("upcoming")}
            type="button"
          >
            Upcoming Interviews
          </button>
        </div>

        {isCandidate && tab === "schedule" && <ScheduleForm onSchedule={handleSchedule} hasPremium={hasPremium} />}
        {tab === "upcoming" && (
          <InterviewList
            interviews={interviews}
            onSelectInterview={handleSelect}
            userRole={userRole}
          />
        )}
        {tab === "details" && selected && (
          <InterviewDetails
            interview={selected}
            onBack={() => setTab("upcoming")}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </main>
    </div>
  );
}