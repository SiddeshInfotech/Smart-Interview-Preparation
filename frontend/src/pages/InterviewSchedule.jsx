import React, { useState, useRef } from "react";
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
} from "lucide-react";
import "../styles/InterviewSchedule.css";
import api from "../api/authAPI";

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

const interviewTypes = ["Technical", "HR Round", "Managerial", "Final Round"];

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

// --- ScheduleForm (UPDATED: generates roomName) ---
function ScheduleForm({ onSchedule }) {
  const [form, setForm] = useState({
    interviewer: "",
    interviewerId: null,
    date: "",
    time: "",
    type: interviewTypes[0],
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const fetchInterviewers = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/interviewer/search/?search=${encodeURIComponent(query)}`);
      setSuggestions(res.data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching interviewers:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewerChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, interviewer: val, interviewerId: null });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchInterviewers(val.trim()), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (profile) => {
    setForm({
      ...form,
      interviewer: profile.full_name,
      interviewerId: profile.interviewer_id,
    });
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.interviewer || !form.date || !form.time) {
      alert("Please fill all required fields.");
      return;
    }
    if (!form.interviewerId) {
      alert("Please select an interviewer from the suggestions (not a free-text entry).");
      return;
    }

    // ✅ Generate a unique room name for LiveKit
    const roomName = `room-${Date.now()}-${crypto.randomUUID()}`;

    const newInterview = {
      ...form,
      roomName, // <-- crucial for joining the lobby
      status: "Scheduled",
      id: Date.now(),
    };

    onSchedule(newInterview);

    setForm({
      interviewer: "",
      interviewerId: null,
      date: "",
      time: "",
      type: interviewTypes[0],
    });
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form__grid">
        <label className="field" style={{ position: "relative" }}>
          <span className="field__label">Interviewer</span>
          <input
            className="field__input"
            type="text"
            placeholder="Start typing an interviewer name..."
            value={form.interviewer}
            onChange={handleInterviewerChange}
            onFocus={() => {
              if (form.interviewer.trim().length >= 2) {
                fetchInterviewers(form.interviewer.trim());
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="suggestion-dropdown">
              {loading && <div className="suggestion-loading">Loading...</div>}
              {!loading && suggestions.length === 0 && (
                <div className="suggestion-empty">No interviewers found</div>
              )}
              {!loading &&
                suggestions.map((profile) => (
                  <div
                    key={profile.interviewer_id}
                    className="suggestion-item"
                    onMouseDown={() => selectSuggestion(profile)}
                  >
                    <div className="suggestion-avatar">
                      {profile.profile_picture ? (
                        <img
                          src={profile.profile_picture}
                          alt={profile.full_name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            const parent = event.currentTarget.parentElement;
                            if (parent) parent.textContent = profile.full_name.charAt(0).toUpperCase();
                          }}
                        />
                      ) : (
                        profile.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">{profile.full_name}</div>
                      <div className="suggestion-meta">
                        {profile.designation || profile.department || "Interviewer"} • {profile.email}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </label>

        <label className="field">
          <span className="field__label">Date</span>
          <input className="field__input" type="date" value={form.date} onChange={update("date")} />
        </label>

        <label className="field">
          <span className="field__label">Time</span>
          <input className="field__input" type="time" value={form.time} onChange={update("time")} />
        </label>

        <label className="field">
          <span className="field__label">Interview type</span>
          <select className="field__input" value={form.type} onChange={update("type")}>
            {interviewTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form__footer">
        <button type="submit" className="btn btn--primary">
          <Plus size={16} strokeWidth={2.5} />
          Schedule Interview
        </button>
      </div>
    </form>
  );
}

// --- InterviewList (UPDATED: calls onSelectInterview) ---
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
              onClick={() => onSelectInterview(iv)} // pass whole interview to parent
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

// --- Main export (UPDATED: accepts props from parent) ---
export default function InterviewSchedule({
  standalone = false,
  interviews: propInterviews,
  onSchedule: propOnSchedule,
  onSelectInterview: propOnSelectInterview,
}) {
  // Use parent-provided interviews if available; otherwise fallback to local state
  const [localInterviews, setLocalInterviews] = useState(initialInterviews);
  const interviews = propInterviews || localInterviews;

  const [tab, setTab] = useState("schedule");
  const [selected, setSelected] = useState(null);

  // Handle scheduling – call parent's callback if available, else update local
  const handleSchedule = (newInterview) => {
    if (propOnSchedule) {
      propOnSchedule(newInterview);
    } else {
      setLocalInterviews([newInterview, ...localInterviews]);
    }
    setTab("upcoming");
  };

  // Handle selecting an interview – call parent's callback if available
  const handleSelect = (iv) => {
    if (propOnSelectInterview) {
      propOnSelectInterview(iv); // parent will switch to lobby
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