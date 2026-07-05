import React, { useState, useRef, useCallback } from "react";
import "../styles/ResumeUpload.css";

// ---- Mock data the "AI" returns after it finishes "parsing" the resume ----
// Replace this with the real response from your backend / parsing API.
const MOCK_PARSED_RESULT = {
  candidateName: "Sarah Chen",
  candidateTitle: "Senior Software Engineer",
  matchLabel: "Top 5% Match",
  yearsExperience: "8.5 Yrs Exp",
  confidence: 98,
  coreTechnologies: [
    { name: "React.js", level: "Expert" },
    { name: "TypeScript", level: "Expert" },
    { name: "Node.js", level: "Expert" },
  ],
  infrastructure: [
    { name: "AWS", level: "Advanced" },
    { name: "Docker", level: "Advanced" },
    { name: "Kubernetes", level: "Advanced" },
  ],
  aiInsight:
    "Strong focus on fullstack architecture with distributed systems experience.",
  totalExperienceYears: 8.5,
  leadershipYears: 2.0,
  avgTenure: "2.8y",
  jobStability: "High",
  timeline: [
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
  ],
};

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = [".pdf", ".docx"];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUpload() {
  const [status, setStatus] = useState("idle"); // idle | dragging | uploading | parsing | done | error
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (candidate) => {
    const lower = candidate.name.toLowerCase();
    const isAcceptedType = ACCEPTED_TYPES.some((ext) => lower.endsWith(ext));
    if (!isAcceptedType) {
      return "That file type isn't supported. Upload a PDF or DOCX file.";
    }
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      return `That file is too large. Keep it under ${MAX_SIZE_MB}MB.`;
    }
    return null;
  };

  const startProcessing = useCallback((candidate) => {
    const validationError = validateFile(candidate);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }

    setError("");
    setFile(candidate);
    setStatus("uploading");
    setProgress(0);
    setResult(null);

    // Simulated upload progress. Swap this block for a real upload call,
    // e.g. an XHR/fetch with onUploadProgress, or an SDK call to your parser.
    let pct = 0;
    const uploadTimer = setInterval(() => {
      pct += Math.random() * 22 + 8;
      if (pct >= 100) {
        pct = 100;
        clearInterval(uploadTimer);
        setProgress(100);
        setStatus("parsing");
        // Simulated AI parsing delay before results arrive.
        setTimeout(() => {
          setResult(MOCK_PARSED_RESULT);
          setStatus("done");
        }, 1400);
      } else {
        setProgress(pct);
      }
    }, 220);
  }, []);

  const handleFileInput = (e) => {
    const candidate = e.target.files?.[0];
    if (candidate) startProcessing(candidate);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setStatus((s) => (s === "dragging" ? "idle" : s));
    const candidate = e.dataTransfer.files?.[0];
    if (candidate) startProcessing(candidate);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (status === "idle" || status === "error") setStatus("dragging");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (status === "dragging") setStatus("idle");
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isBusy = status === "uploading" || status === "parsing";

  return (
    <div className="ri-page">
      <header className="ri-header">
        <span className="ri-eyebrow">✦ AI-POWERED PARSING</span>
        <h1 className="ri-title">
          Resume <span className="ri-accent">Intelligence</span> Dashboard
        </h1>
        <p className="ri-subtitle">
          Transform raw resumes into actionable insights. Our AI parses technical
          skills, experience depth, and career trajectory in seconds.
        </p>
      </header>

      <div className="ri-grid">
        {/* ---------------- Upload card ---------------- */}
        <section className="ri-card ri-upload-card">
          <div
            className={`ri-dropzone ${status === "dragging" ? "is-dragging" : ""} ${
              status === "error" ? "is-error" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isBusy && inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isBusy) {
                inputRef.current?.click();
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="ri-hidden-input"
              onChange={handleFileInput}
              disabled={isBusy}
            />

            {status !== "uploading" && status !== "parsing" && (
              <>
                <div className="ri-upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                    <path
                      d="M12 16V4m0 0L7 9m5-5l5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="ri-upload-heading">
                  {status === "done" ? "Upload another resume" : "Upload Resume"}
                </h3>
                <p className="ri-upload-copy">
                  Drag and drop your PDF or DOCX file here to begin AI analysis.
                </p>
                <button
                  type="button"
                  className="ri-btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
                <span className="ri-upload-hint">Max size {MAX_SIZE_MB}MB</span>
              </>
            )}

            {isBusy && (
              <div className="ri-processing">
                <div className="ri-file-row">
                  <span className="ri-file-icon" aria-hidden="true">
                    📄
                  </span>
                  <div>
                    <div className="ri-file-name">{file?.name}</div>
                    <div className="ri-file-meta">
                      {file ? formatBytes(file.size) : ""}
                    </div>
                  </div>
                </div>
                <div className="ri-progress-track">
                  <div
                    className="ri-progress-fill"
                    style={{ width: `${status === "parsing" ? 100 : progress}%` }}
                  />
                </div>
                <p className="ri-progress-label">
                  {status === "uploading"
                    ? `Uploading… ${Math.min(100, Math.round(progress))}%`
                    : "Analyzing resume with AI…"}
                </p>
              </div>
            )}
          </div>

          {status === "error" && <p className="ri-error-text">{error}</p>}

          {result && (
            <div className="ri-candidate-row">
              <div className="ri-avatar" aria-hidden="true">
                {result.candidateName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="ri-candidate-name">{result.candidateName}</div>
                <div className="ri-candidate-title">{result.candidateTitle}</div>
              </div>
              <div className="ri-candidate-tags">
                <span className="ri-tag ri-tag-match">{result.matchLabel}</span>
                <span className="ri-tag ri-tag-exp">{result.yearsExperience}</span>
              </div>
              <button className="ri-link-btn" onClick={reset}>
                Replace
              </button>
            </div>
          )}
        </section>

        {/* ---------------- Skill extraction card ---------------- */}
        <section className="ri-card">
          <div className="ri-card-header">
            <h3>
              <span className="ri-card-icon ri-card-icon--green" aria-hidden="true">◎</span> Skill
              Extraction
            </h3>
            {result && (
              <span className="ri-badge ri-badge-success">
                {result.confidence}% Confidence
              </span>
            )}
          </div>

          {!result && <EmptyState text="Upload a resume to extract skills." />}

          {result && (
            <>
              <SkillGroup title="Core Technologies" items={result.coreTechnologies} />
              <SkillGroup title="Infrastructure" items={result.infrastructure} />
              <p className="ri-insight">
                <strong>AI Insight:</strong> {result.aiInsight}
              </p>
            </>
          )}
        </section>

        {/* ---------------- Experience calibration card ---------------- */}
        <section className="ri-card">
          <div className="ri-card-header">
            <h3>
              <span className="ri-card-icon ri-card-icon--purple" aria-hidden="true">▦</span> Exp.
              Calibration
            </h3>
          </div>

          {!result && <EmptyState text="Experience metrics will appear here." />}

          {result && (
            <>
              <MetricBar
                label="Total Professional Experience"
                value={`${result.totalExperienceYears} Years`}
                percent={100}
              />
              <MetricBar
                label="Leadership & Management"
                value={`${result.leadershipYears} Years`}
                percent={(result.leadershipYears / result.totalExperienceYears) * 100}
              />
              <div className="ri-metric-footer">
                <div>
                  <div className="ri-metric-number">{result.avgTenure}</div>
                  <div className="ri-metric-caption">AVG TENURE</div>
                </div>
                <div>
                  <div className="ri-metric-number">{result.jobStability}</div>
                  <div className="ri-metric-caption">JOB STABILITY</div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* ---------------- Parsed career timeline ---------------- */}
        <section className="ri-card ri-timeline-card">
          <div className="ri-card-header">
            <h3>
              <span className="ri-card-icon" aria-hidden="true">〜</span> Parsed
              Career Timeline
            </h3>
          </div>

          {!result && <EmptyState text="Career history will be parsed after upload." />}

          {result && (
            <ol className="ri-timeline">
              {result.timeline.map((job, i) => (
                <li className="ri-timeline-item" key={i}>
                  <span
                    className={`ri-timeline-dot ${job.current ? "is-current" : ""}`}
                    aria-hidden="true"
                  />
                  <div className="ri-timeline-content">
                    <div className="ri-timeline-top">
                      <span className="ri-timeline-role">{job.role}</span>
                      <span className="ri-timeline-period">{job.period}</span>
                    </div>
                    <div className="ri-timeline-company">{job.company}</div>
                    {job.bullets.length > 0 && (
                      <ul className="ri-timeline-bullets">
                        {job.bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function SkillGroup({ title, items }) {
  return (
    <div className="ri-skill-group">
      <div className="ri-skill-group-title">{title}</div>
      <div className="ri-skill-chips">
        {items.map((item) => (
          <span className="ri-chip" key={item.name}>
            {item.name}
          </span>
        ))}
      </div>
      <div className="ri-skill-level">{items[0]?.level}</div>
    </div>
  );
}

function MetricBar({ label, value, percent }) {
  return (
    <div className="ri-metric-bar-row">
      <div className="ri-metric-bar-top">
        <span>{label}</span>
        <span className="ri-metric-bar-value">{value}</span>
      </div>
      <div className="ri-bar-track">
        <div className="ri-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="ri-empty">{text}</p>;
}