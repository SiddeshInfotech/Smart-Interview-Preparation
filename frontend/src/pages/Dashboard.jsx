import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import "../styles/Dashboard.css";
import PageNavbar from "../components/PageNavbar.jsx";


export default function Dashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: "Sessions Completed", value: "24", change: "+12%" },
    { label: "Average Score", value: "88.4%", change: "+4.5" },
    { label: "Upcoming Mock", value: "Google Prep", change: "Next: 2h 40m" },
  ];

  const skills = [
    { name: "Technical Knowledge", score: 88 },
    { name: "Soft Skills & Delivery", score: 95 },
    { name: "System Architecture", score: 74 },
  ];

  const activity = [
    {
      title: "Completed Mock Interview",
      desc: "Tech Lead Role - Google Prep",
      time: "2 hours ago",
      color: "blue",
    },
    {
      title: "Feedback Received",
      desc: "New insights available for 'STAR Method' session.",
      time: "Yesterday",
      color: "green",
    },
    {
      title: "Module Started",
      desc: "Dynamic Programming Deep Dive",
      time: "2 days ago",
      color: "gray",
    },
  ];

  const modules = [
    { title: "Behavioral Basics", status: "Completed", locked: false },
    { title: "Data Structures", status: "75% In Progress", locked: false },
    { title: "System Design Adv.", status: "Locked", locked: true },
  ];

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
    { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
    { to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> },
  ];

  return (
    <div className="candidate-dashboard">
      <PageNavbar activePath="/dashboard" navItems={navItems} />

      {/* Main page content container */}
      <div className="dashboard-page-container">
        <main className="dashboard-content-wrapper">
          {/* Header */}
          <header className="content-header-simple">
            <h2>Candidate Dashboard</h2>
            <p className="welcome-text">Welcome back, Alex Rivera</p>
          </header>

          {/* Stats Cards Row */}
          <div className="stat-row">
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-card__header">
                  <span className="stat-card__label">{s.label}</span>
                  <span className="stat-card__change">
                    <TrendingUp size={12} style={{ marginRight: 2 }} />
                    {s.change}
                  </span>
                </div>
                <div className="stat-card__value">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Grid Area */}
          <div className="dashboard-grid">
            {/* Interview Readiness Card */}
            <div className="card readiness-card">
              <div className="readiness-card__header">
                <h3>Interview Readiness</h3>
                <span className="readiness-card__score">92%</span>
              </div>
              <p className="readiness-card__sub">
                Based on recent performance across 8 metrics
              </p>

              <div className="skills-list">
                {skills.map((skill) => (
                  <div className="skill-row" key={skill.name}>
                    <div className="skill-row__labels">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-score">{skill.score}/100</span>
                    </div>
                    <div className="progress-bar" role="progressbar" aria-valuenow={skill.score} aria-valuemin="0" aria-valuemax="100">
                      <div
                        className="progress-fill"
                        style={{ width: `${skill.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ai-suggestion">
                <strong>✦ AI Coach Suggestion</strong>
                <p>
                  Alex is showing exceptional confidence in soft skills.
                  Focusing the next 3 sessions on "Scalable Architectures"
                  will push readiness to 98%.
                </p>
              </div>
            </div>

            {/* Activity Log Card */}
            <div className="card activity-card">
              <div className="activity-card__header">
                <h3>Activity Log</h3>
                <button className="btn-link" onClick={() => navigate("/quiz")}>
                  View All
                </button>
              </div>
              <div className="activity-list">
                {activity.map((a, idx) => (
                  <div className="activity-item" key={idx}>
                    <span className={`activity-dot dot--${a.color}`} />
                    <div className="activity-item-content">
                      <p className="activity-item__title">{a.title}</p>
                      <p className="activity-item__desc">{a.desc}</p>
                      <p className="activity-item__time">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="dashboard-grid dashboard-grid--bottom">
            {/* Course Modules Card */}
            <div className="card modules-card">
              <h3>Course Modules</h3>
              <div className="modules-row">
                {modules.map((m) => (
                  <div
                    className={`module-tile ${m.locked ? "module-tile--locked" : ""}`}
                    key={m.title}
                  >
                    <span className="module-tile__icon">
                      {m.locked ? "🔒" : "✅"}
                    </span>
                    <p className="module-tile__title">{m.title}</p>
                    <p className="module-tile__status">{m.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Call-to-Action Card */}
            <div className="card priority-card">
              <div className="priority-card-badge">High Priority</div>
              <h3>Meta Design Mock</h3>
              <p>
                Senior Product Designer Track - Focus on Product Sense &
                Strategy.
              </p>
              <p className="priority-card__time">🎙 Tomorrow, 10:00 AM</p>
              <button
                className="btn-primary btn-block"
                onClick={() => navigate("/quiz")}
              >
                Prepare Now
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
