import React, { useState, useEffect, useRef } from "react";
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
  Video,
  User,
  Users,
  Link2,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";
import "../styles/InterviewSchedule.css";
import api from "../api/authAPI";

// ---- Seed data -------------------------------------------------------
const initialInterviews = [
  {
    id: 1,
    candidate: "Rohan Mehta",
    date: "2026-07-18",
    time: "10:30",
    type: "Technical",
    status: "Scheduled",
  },
  {
    id: 2,
    candidate: "Priya Nair",
    date: "2026-07-16",
    time: "15:00",
    type: "HR Round",
    status: "Completed",
  },
  {
    id: 3,
    candidate: "Karan Malhotra",
    date: "2026-07-14",
    time: "12:00",
    type: "Managerial",
    status: "Cancelled",
  },
];

const interviewTypes = ["Technical", "HR Round", "Managerial", "Final Round"];

// ---- Small helpers ----------------------------------------------------
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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

// ---- Navbar (matches existing PrepMaster AI design) --------------------
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
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </nav>

      <div className="navbar__actions">
        <button className="navbar__iconBtn" aria-label="Notifications">
          <Bell size={18} strokeWidth={2} />
        </button>
        <button className="navbar__iconBtn" aria-label="Settings">
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

// ---- Schedule Interview form (with suggestions & profile pictures) --------
function ScheduleForm({ onSchedule }) {
  const [form, setForm] = useState({
    candidate: "",
    candidateId: null,
    date: "",
    time: "",
    type: interviewTypes[0],
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const fetchCandidates = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/candidate/search/?search=${encodeURIComponent(query)}`);
      setSuggestions(res.data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, candidate: val, candidateId: null });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => fetchCandidates(val.trim()), 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (profile) => {
    setForm({
      ...form,
      candidate: profile.full_name,
      candidateId: profile.candidate_id,
    });
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.candidate || !form.date || !form.time) {
      alert("Please fill all required fields.");
      return;
    }
    if (!form.candidateId) {
      alert("Please select a candidate from the suggestions (not a free‑text entry).");
      return;
    }
    onSchedule({
      candidate: form.candidate,
      candidateId: form.candidateId,
      date: form.date,
      time: form.time,
      type: form.type,
      status: "Scheduled",
      id: Date.now(),
    });
    setForm({
      candidate: "",
      candidateId: null,
      date: "",
      time: "",
      type: interviewTypes[0],
    });
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form__grid">
        <label className="field" style={{ position: "relative" }}>
          <span className="field__label">Candidate name</span>
          <input
            className="field__input"
            type="text"
            placeholder="Start typing a candidate name..."
            value={form.candidate}
            onChange={handleCandidateChange}
            onFocus={() => {
              if (form.candidate.trim().length >= 2) {
                fetchCandidates(form.candidate.trim());
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
          />
          {showSuggestions && (
            <div className="suggestion-dropdown">
              {loading && <div className="suggestion-loading">Loading...</div>}
              {!loading && suggestions.length === 0 && (
                <div className="suggestion-empty">No candidates found</div>
              )}
              {!loading &&
                suggestions.map((profile) => (
                  <div
                    key={profile.candidate_id}
                    className="suggestion-item"
                    onMouseDown={() => selectSuggestion(profile)}
                  >
                    {/* Avatar – matches navbar style */}
                    <div
                      className="suggestion-avatar"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {profile.profile_picture ? (
                        <img
                          src={profile.profile_picture}
                          alt={profile.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.textContent = profile.full_name.charAt(0).toUpperCase();
                          }}
                        />
                      ) : (
                        profile.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="suggestion-info">
                      <div className="suggestion-name">{profile.full_name}</div>
                      <div className="suggestion-meta">
                        {profile.education || 'No education'} • {profile.email}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </label>

        <label className="field">
          <span className="field__label">Date</span>
          <input
            className="field__input"
            type="date"
            value={form.date}
            onChange={update("date")}
          />
        </label>

        <label className="field">
          <span className="field__label">Time</span>
          <input
            className="field__input"
            type="time"
            value={form.time}
            onChange={update("time")}
          />
        </label>

        <label className="field">
          <span className="field__label">Interview type</span>
          <select
            className="field__input"
            value={form.type}
            onChange={update("type")}
          >
            {interviewTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
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

// ---- Upcoming Interviews list -------------------------------------------
function InterviewList({ interviews, onSelect }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Scheduled", "Completed", "Cancelled"];

  const filtered =
    filter === "All" ? interviews : interviews.filter((i) => i.status === filter);

  return (
    <div className="card">
      <div className="list__filters">
        {filters.map((f) => (
          <button
            key={f}
            className={`pill ${filter === f ? "pill--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">No interviews in this category yet.</div>
      ) : (
        <div className="list">
          {filtered.map((iv) => (
            <button key={iv.id} className="list__row" onClick={() => onSelect(iv)}>
              <div className="list__main">
                <span className="list__candidate">{iv.candidate}</span>
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

// ---- Interview Details view -------------------------------------------
function InterviewDetails({ interview, onBack, onUpdateStatus }) {
  return (
    <div className="card details">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to Upcoming Interviews
      </button>

      <div className="details__header">
        <div>
          <h2>{interview.candidate}</h2>
          <span className="tag">{interview.type}</span>
        </div>
        <StatusBadge status={interview.status} />
      </div>

      <div className="details__grid">
        <div className="details__item">
          <span className="details__label"><User size={14} /> Candidate</span>
          <span className="details__value">{interview.candidate}</span>
        </div>
        <div className="details__item">
          <span className="details__label"><Calendar size={14} /> Date</span>
          <span className="details__value">{formatDate(interview.date)}</span>
        </div>
        <div className="details__item">
          <span className="details__label"><Clock size={14} /> Time</span>
          <span className="details__value">{interview.time}</span>
        </div>
        {/* Removed interviewer and meeting link fields */}
      </div>

      {interview.status === "Scheduled" && (
        <div className="details__actions">
          <button className="btn btn--success" onClick={() => onUpdateStatus(interview.id, "Completed")}>
            <CheckCircle2 size={16} /> Mark as Completed
          </button>
          <button className="btn btn--danger" onClick={() => onUpdateStatus(interview.id, "Cancelled")}>
            <XCircle size={16} /> Cancel Interview
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Main app shell -----------------------------------------------------
export default function InterviewSchedule({ standalone = false }) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [tab, setTab] = useState("schedule"); // "schedule" | "upcoming" | "details"
  const [selected, setSelected] = useState(null);

  const handleSchedule = (newInterview) => {
    setInterviews([newInterview, ...interviews]);
    setTab("upcoming");
  };

  const handleSelect = (iv) => {
    setSelected(iv);
    setTab("details");
  };

  const handleUpdateStatus = (id, status) => {
    const updated = interviews.map((iv) => (iv.id === id ? { ...iv, status } : iv));
    setInterviews(updated);
    setSelected(updated.find((iv) => iv.id === id));
  };

  return (
    <div className={standalone ? "interview-schedule-standalone" : "page"}>
      {!standalone && <Navbar active="Interview Scheduling" />}

      <main className={standalone ? "" : "page__content"}>
        <div className="page__header">
          <div>
            <h1>Interview Scheduling</h1>
            <p>Schedule, track, and manage candidate interviews in one place.</p>
          </div>
          <button className="btn btn--primary" onClick={() => setTab("schedule")}>
            <Plus size={16} strokeWidth={2.5} />
            New Interview
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tabs__item ${tab === "schedule" ? "tabs__item--active" : ""}`}
            onClick={() => setTab("schedule")}
          >
            Schedule Interview
          </button>
          <button
            className={`tabs__item ${tab === "upcoming" || tab === "details" ? "tabs__item--active" : ""}`}
            onClick={() => setTab("upcoming")}
          >
            Upcoming Interviews
          </button>
        </div>

        {tab === "schedule" && <ScheduleForm onSchedule={handleSchedule} />}
        {tab === "upcoming" && <InterviewList interviews={interviews} onSelect={handleSelect} />}
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