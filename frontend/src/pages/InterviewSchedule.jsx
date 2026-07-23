import React, { useState, useEffect } from "react";
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
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// --- Navbar (unchanged) ---
function Navbar({ active }) {
  const navItems = [
    { label: "Dashboard", icon: LayoutGrid },
    { label: "Practice Mode", icon: ClipboardList },
    { label: "Resume Analysis", icon: FileText },
    { label: "Interview Scheduling", icon: CalendarClock },
  ];

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <BrainCircuit size={26} color="#2563eb" strokeWidth={2.2} />
        <span>PrepMaster AI</span>
      </div>

      <nav className="navbar__links">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`navbar__link ${label === active ? "navbar__link--active" : ""}`}
            type="button"
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="navbar__actions">
        <button className="navbar__iconBtn" aria-label="Notifications" type="button">
          <Bell size={18} strokeWidth={2} />
        </button>
        <button className="navbar__iconBtn" aria-label="Settings" type="button">
          <Settings size={18} strokeWidth={2} />
        </button>
        <div className="navbar__profile">
          <span className="navbar__avatar">S</span>
          <span className="navbar__username">Sana</span>
        </div>
      </div>
    </header>
  );
}

// --- Helper to generate time options (00:00 – 23:30) ---
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = String(h).padStart(2, "0");
      const min = String(m).padStart(2, "0");
      times.push(`${hour}:${min}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

// --- ScheduleForm with Search Interviewers button ---
function ScheduleForm({ onSchedule }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [durationFilter, setDurationFilter] = useState("60");
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
            <ClockIcon size={14} className="field__icon" /> Select Start Time
          </span>
          <select
            className="field__input"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            <option value="">Select time</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>

        {/* Duration dropdown */}
        <label className="field">
          <span className="field__label">
            <Hourglass size={14} className="field__icon" /> Duration
          </span>
          <select
            className="field__input"
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
          >
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
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
              <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                Finding available interviewers...
              </div>
            ) : availableInterviewers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>
                No interviewers available for this time slot.
              </div>
            ) : (
              <div className="interviewer-list">
                {availableInterviewers.map((interviewer) => (
                  <div key={interviewer.id} className="interviewer-row">
                    <div className="interviewer-profile-info">
                      <div className="interviewer-pic-container">
                        {interviewer.profilePicture ? (
                          <img src={interviewer.profilePicture} alt={interviewer.name} className="interviewer-pic" />
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

// --- InterviewList (unchanged) ---
function InterviewList({ interviews, onSelectInterview }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Scheduled", "Completed", "Cancelled"];

  const filtered = filter === "All" ? interviews : interviews.filter((i) => i.status === filter);

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
        <div className="empty">No interviews in this category yet.</div>
      ) : (
        <div className="list">
          {filtered.map((iv) => (
            <button
              key={iv.id}
              className="list__row"
              onClick={() => onSelectInterview(iv)}
              type="button"
            >
              <div className="list__main">
                <span className="list__candidate">{iv.interviewer}</span>
                <span className="list__meta">
                  <Calendar size={13} /> {formatDate(iv.date)}
                  <span className="dot" />
                  <Clock size={13} /> {iv.time}
                </span>
              </div>
              <div className="list__side">
                <span className="tag">{iv.type}</span>
                <StatusBadge status={iv.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- InterviewDetails (unchanged) ---
function InterviewDetails({ interview, onBack, onUpdateStatus }) {
  return (
    <div className="card details">
      <button className="back-link" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Back to Upcoming Interviews
      </button>

      <div className="details__header">
        <div>
          <h2>{interview.interviewer}</h2>
          <span className="tag">{interview.type}</span>
        </div>
        <StatusBadge status={interview.status} />
      </div>

      <div className="details__grid">
        <div className="details__item">
          <span className="details__label">
            <User size={14} /> Interviewer
          </span>
          <span className="details__value">{interview.interviewer}</span>
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
          <span className="details__value">{interview.time}</span>
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

// --- Main export (unchanged) ---
export default function InterviewSchedule({
  standalone = false,
  interviews: propInterviews,
  onSchedule: propOnSchedule,
  onSelectInterview: propOnSelectInterview,
}) {
  const [localInterviews, setLocalInterviews] = useState(initialInterviews);
  const interviews = propInterviews || localInterviews;

  const [tab, setTab] = useState("schedule");
  const [selected, setSelected] = useState(null);

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
            <p>Schedule, track, and manage interviews in one place.</p>
          </div>
          <button className="btn btn--primary" onClick={() => setTab("schedule")} type="button">
            <Plus size={16} strokeWidth={2.5} />
            New Interview
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tabs__item ${tab === "schedule" ? "tabs__item--active" : ""}`}
            onClick={() => setTab("schedule")}
            type="button"
          >
            Schedule Interview
          </button>
          <button
            className={`tabs__item ${tab === "upcoming" || tab === "details" ? "tabs__item--active" : ""}`}
            onClick={() => setTab("upcoming")}
            type="button"
          >
            Upcoming Interviews
          </button>
        </div>

        {tab === "schedule" && <ScheduleForm onSchedule={handleSchedule} />}
        {tab === "upcoming" && (
          <InterviewList interviews={interviews} onSelectInterview={handleSelect} />
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