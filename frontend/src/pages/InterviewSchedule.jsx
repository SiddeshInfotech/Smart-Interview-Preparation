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
import TimeSlotScheduler from "../components/TimeSlotScheduler";
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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [durationFilter, setDurationFilter] = useState("any");
  const [hasSearched, setHasSearched] = useState(false);

  // Reset slots when date changes
  useEffect(() => {
    setSlots([]);
    setSelectedSlot(null);
    setHasSearched(false);
  }, [selectedDate]);

  // Search for interviewers
  const handleSearch = async () => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split("T")[0];
    setLoadingSlots(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/interviewer/available-slots/?date=${dateStr}`);
      setSlots(res.data);
      setSelectedSlot(null);
    } catch (err) {
      console.error("Failed to fetch slots", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Filter slots locally (by time and duration)
  const filteredSlots = slots.filter((slot) => {
    const start = new Date(slot.start_time);
    const slotStartMinutes = start.getHours() * 60 + start.getMinutes();

    if (selectedTime) {
      const [h, m] = selectedTime.split(":").map(Number);
      const filterMinutes = h * 60 + m;
      if (slotStartMinutes < filterMinutes) return false;
    }

    if (durationFilter !== "any") {
      const duration = (new Date(slot.end_time) - start) / 60000;
      const target = parseInt(durationFilter);
      if (duration !== target) return false;
    }
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }
    onSchedule({ availability_id: selectedSlot.availability_id });
    // Reset
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setSelectedTime("");
    setDurationFilter("any");
    setHasSearched(false);
  };

  // Determine if search button should be enabled
  const isSearchEnabled = selectedDate && selectedTime !== "" && durationFilter !== "any";

  const datePickerStyles = {
    wrapper: "custom-datepicker-wrapper",
    input: "field__input",
    calendar: "custom-datepicker-calendar",
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
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

        {/* Time dropdown */}
        <label className="field">
          <span className="field__label">
            <ClockIcon size={14} className="field__icon" /> Start at or after
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
            <option value="any">Any</option>
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </label>

        {/* Search button – spans full width */}
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

        {/* Slot list – only shown after search */}
        {hasSearched && (
          <div className="field slots-section" style={{ gridColumn: "1 / -1" }}>
            <span className="field__label">
              <CalendarClock size={14} className="field__icon" /> Available Slots
              {filteredSlots.length !== slots.length && slots.length > 0 && (
                <span style={{ fontSize: "0.8rem", color: "#6b7280", marginLeft: "8px" }}>
                  ({filteredSlots.length} of {slots.length})
                </span>
              )}
            </span>
            <TimeSlotScheduler
              slots={filteredSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              loading={loadingSlots}
            />
            {filteredSlots.length > 0 && (
              <div className="form__footer" style={{ marginTop: "16px" }}>
                <button type="submit" className="btn btn--primary" disabled={!selectedSlot}>
                  <CalendarPlus size={16} strokeWidth={2.5} />
                  Schedule Interview
                </button>
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