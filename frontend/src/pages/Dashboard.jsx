import React from "react";
import "../styles/Dashboard.css";

export default function Dashboard() {
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

  return (
    <div className="dashboard-page">
      <header className="dashboard-navbar">
        <div className="dashboard-navbar__brand">InterviewAI</div>
        <nav className="dashboard-navbar__links">
          <a href="/dashboard" className="active">Dashboard</a>
          <a href="/practice">Practice</a>
          <a href="/candidates">Candidates</a>
          <a href="/insights">Insights</a>
        </nav>
        <div className="dashboard-navbar__actions">
          <input
            type="text"
            className="dashboard-search"
            placeholder="Search candidates..."
          />
          <button className="icon-btn" aria-label="Notifications">🔔</button>
          <button className="icon-btn" aria-label="Settings">⚙️</button>
          <button className="btn btn--primary">New Interview</button>
          <div className="avatar">AR</div>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="profile-card">
          <div className="profile-card__avatar">AR</div>
          <h2>Alex Rivera</h2>
          <p className="profile-card__role">Senior Product Designer</p>
          <div className="profile-card__badges">
            <span className="badge badge--green">In Review</span>
            <span className="badge badge--blue">Expert Level</span>
          </div>
          <ul className="profile-card__meta">
            <li>📧 alex.rivera@design.io</li>
            <li>📍 San Francisco, CA</li>
            <li>📅 Joined Sep 2023</li>
          </ul>
          <button className="btn btn--outline btn--block">📄 View Resume</button>

          <div className="profile-card__section">
            <h3>Skills & Competencies</h3>
            <div className="chip-row">
              <span className="chip">System Design</span>
              <span className="chip">React.js</span>
              <span className="chip">Figma</span>
              <span className="chip">Team Leadership</span>
              <span className="chip">Agile</span>
              <span className="chip">Public Speaking</span>
            </div>
          </div>

          <div className="profile-card__section">
            <h3>Interests</h3>
            <div className="interest-row">
              <span>AI Ethics</span>
              <div className="mini-bar"><div style={{ width: "80%" }} /></div>
            </div>
            <div className="interest-row">
              <span>Edge Computing</span>
              <div className="mini-bar"><div style={{ width: "55%" }} /></div>
            </div>
          </div>
        </aside>

        <section className="dashboard-content">
          <div className="stat-row">
            {stats.map((s) => (
              <div className="stat-card" key={s.label}>
                <span className="stat-card__change">{s.change}</span>
                <div className="stat-card__value">{s.value}</div>
                <div className="stat-card__label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="card readiness-card">
              <div className="readiness-card__header">
                <h3>Interview Readiness</h3>
                <span className="readiness-card__score">92%</span>
              </div>
              <p className="readiness-card__sub">
                Based on recent performance across 8 metrics
              </p>
              {skills.map((skill) => (
                <div className="skill-row" key={skill.name}>
                  <div className="skill-row__labels">
                    <span>{skill.name}</span>
                    <span>{skill.score}/100</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ width: `${skill.score}%` }} />
                  </div>
                </div>
              ))}
              <div className="ai-suggestion">
                <strong>✦ AI Coach Suggestion</strong>
                <p>
                  Alex is showing exceptional confidence in soft skills.
                  Focusing the next 3 sessions on "Scalable Architectures"
                  will push readiness to 98%.
                </p>
              </div>
            </div>

            <div className="card activity-card">
              <div className="activity-card__header">
                <h3>Activity Log</h3>
                <a href="/activity">View All</a>
              </div>
              {activity.map((a) => (
                <div className="activity-item" key={a.title}>
                  <span className={`activity-dot dot--${a.color}`} />
                  <div>
                    <p className="activity-item__title">{a.title}</p>
                    <p className="activity-item__desc">{a.desc}</p>
                    <p className="activity-item__time">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-grid dashboard-grid--bottom">
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

            <div className="priority-card">
              <span className="priority-card__tag">High Priority</span>
              <h3>Meta Design Mock</h3>
              <p>
                Senior Product Designer Track - Focus on Product Sense &
                Strategy.
              </p>
              <p className="priority-card__time">🎙 Tomorrow, 10:00 AM</p>
              <button className="btn btn--primary btn--block">Prepare Now</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}