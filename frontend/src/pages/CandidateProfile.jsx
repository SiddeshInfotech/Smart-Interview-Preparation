import React from "react";
import "../styles/CandidateProfile.css";

export default function CandidateProfile() {
  const coreTech = ["React.js", "TypeScript", "Node.js", "PostgreSQL"];
  const infra = ["AWS", "Docker", "Kubernetes"];

  const timeline = [
    {
      role: "Senior Frontend Architect",
      company: "TechFlow Solutions Inc.",
      period: "2021 — Present (3.2y)",
      bullets: [
        "Architected micro-frontend architecture using React and Module Federation.",
        "Led a team of 8 developers across 3 time zones.",
      ],
      current: true,
    },
    {
      role: "Full Stack Developer",
      company: "Innovate Systems",
      period: "2018 — 2021 (3.0y)",
      bullets: [
        "Developed core API infrastructure handling 2M+ requests daily.",
        "Implemented CI/CD pipelines reducing deployment time by 40%.",
      ],
      current: false,
    },
    {
      role: "Junior Web Developer",
      company: "Startup Labs",
      period: "2016 — 2018 (2.3y)",
      bullets: [],
      current: false,
    },
  ];

  return (
    <div className="candidate-profile-page">
      <header className="cp-navbar">
        <div className="cp-navbar__brand">InterviewAI</div>
        <nav className="cp-navbar__links">
          <a href="/dashboard">Dashboard</a>
          <a href="/practice">Practice</a>
          <a href="/candidates" className="active">Candidates</a>
          <a href="/insights">Insights</a>
        </nav>
        <div className="cp-navbar__actions">
          <button className="btn btn--primary">New Interview</button>
          <div className="avatar">SC</div>
        </div>
      </header>

      <main className="cp-main">
        <div className="cp-header">
          <h1>Resume Intelligence Dashboard</h1>
          <p>
            Transform raw resumes into actionable insights. Our AI parses
            technical skills, experience depth, and career trajectory in
            seconds.
          </p>
        </div>

        <div className="cp-top-grid">
          <div className="card upload-card">
            <div className="upload-card__icon">📄</div>
            <h3>Upload Resume</h3>
            <p>Drag and drop your PDF or DOCX file to begin AI analysis.</p>
            <button className="btn btn--primary">Browse Files</button>
            <span className="upload-card__hint">Max size: 10MB</span>

            <div className="candidate-mini">
              <div className="candidate-mini__avatar">SC</div>
              <div>
                <p className="candidate-mini__name">Sarah Chen</p>
                <p className="candidate-mini__role">Senior Software Engineer</p>
                <div className="candidate-mini__tags">
                  <span className="badge badge--green">Top 5% Match</span>
                  <span className="badge badge--blue">8.5 Yrs Exp</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card skills-card">
            <div className="skills-card__header">
              <h3>🎯 Skill Extraction</h3>
              <span className="badge badge--green">98% Confidence</span>
            </div>

            <p className="skills-card__group-label">
              Core Technologies <span>Expert</span>
            </p>
            <div className="chip-row">
              {coreTech.map((t) => (
                <span className="chip" key={t}>{t}</span>
              ))}
            </div>

            <p className="skills-card__group-label">
              Infrastructure <span>Advanced</span>
            </p>
            <div className="chip-row">
              {infra.map((t) => (
                <span className="chip" key={t}>{t}</span>
              ))}
            </div>

            <p className="skills-card__insight">
              <strong>AI Insight:</strong> Strong focus on Fullstack
              Architecture with distributed systems experience.
            </p>
          </div>

          <div className="card exp-card">
            <h3>📊 Exp. Calibration</h3>
            <div className="exp-row">
              <span>Total Professional Experience</span>
              <strong>8.5 Years</strong>
            </div>
            <div className="progress-bar">
              <div style={{ width: "90%" }} />
            </div>

            <div className="exp-row exp-row--spaced">
              <span>Leadership & Management</span>
              <strong>2.0 Years</strong>
            </div>
            <div className="progress-bar">
              <div style={{ width: "25%" }} />
            </div>

            <div className="exp-stats">
              <div>
                <p className="exp-stats__value">2.8y</p>
                <p className="exp-stats__label">AVG TENURE</p>
              </div>
              <div>
                <p className="exp-stats__value">High</p>
                <p className="exp-stats__label">JOB STABILITY</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card timeline-card">
          <h3>📈 Parsed Career Timeline</h3>
          <div className="timeline">
            {timeline.map((job) => (
              <div className="timeline-item" key={job.role}>
                <span
                  className={`timeline-dot ${job.current ? "timeline-dot--current" : ""}`}
                />
                <div className="timeline-content">
                  <div className="timeline-content__header">
                    <h4>{job.role}</h4>
                    <span>{job.period}</span>
                  </div>
                  <p className="timeline-content__company">{job.company}</p>
                  {job.bullets.length > 0 && (
                    <ul>
                      {job.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}