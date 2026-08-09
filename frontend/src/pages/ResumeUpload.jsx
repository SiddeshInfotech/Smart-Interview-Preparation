import api from "../api/axios";
import React, { useEffect, useRef, useState } from "react";
import {
  FileText,
  User,
  Sparkles,
  Target,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  UploadCloud,
  File,
  ShieldCheck,
  X,
  Award
} from "lucide-react";
import "../styles/ResumeUpload.css";
import { useTheme } from "../context/ThemeContext";

const ResumeUpload = () => {
  const { theme } = useTheme();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showScoreModal, setShowScoreModal] = useState(false);

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);

  const candidateProfile = {
    Name: analysisResult?.candidate_name || "—",
    Email: analysisResult?.email || "—",
    Role: analysisResult?.role || "—",
    Location: analysisResult?.location || "—",
    Education: analysisResult?.education || "—",
    Experience: analysisResult?.experience || "—",
    LinkedIn: analysisResult?.linkedin || "—",
    GitHub: analysisResult?.github || "—",
    Portfolio: analysisResult?.portfolio || "—",
  };

  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
  }, []);

  // Lock page scrolling when analysis result modal popup is open
  useEffect(() => {
    if (showScoreModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showScoreModal]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = ["pdf", "docx"];
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setUploadStatus("Please upload a PDF or DOCX file");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadStatus("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setUploadStatus("Selected Successfully");
    setAnalysisResult(null);
    setShowScoreModal(false);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFileSelect(event.dataTransfer.files[0]);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event) => {
    handleFileSelect(event.target.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadStatus("");
    setAnalysisResult(null);
    setShowScoreModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!file) {
      setUploadStatus("Please select a file first");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const uploadResponse = await api.post("/resume/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadData = uploadResponse.data;
      const id = uploadData.data.resume_id;
      setResumeId(id);

      const savedDomain = localStorage.getItem("candidate_user_domain") || "";
      const analyzeResponse = await api.post("/resume/analyze/", {
        resume_id: id,
        target_domain: savedDomain,
      });

      const analyzeData = analyzeResponse.data;
      console.log("Analyze Result:", analyzeData.data);

      setAnalysisResult(analyzeData.data);
      setUploadStatus("Resume analyzed successfully");
      setShowScoreModal(true);
    } catch (error) {
      console.log("Analyze Error:", error);
      setUploadStatus("Analysis Failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Score Tier Evaluation
  const rawScore = parseInt(analysisResult?.resume_score, 10) || 75;
  const scorePercent = Math.min(100, Math.max(0, rawScore));

  const getScoreTier = (score) => {
    const isDark = theme === "dark";
    if (score >= 80) return { label: "Excellent Match", color: isDark ? "#34d399" : "#10b981", bg: isDark ? "#064e3b" : "#d1fae5" };
    if (score >= 65) return { label: "Strong Candidate", color: isDark ? "#a5b4fc" : "#4f46e5", bg: isDark ? "#312e81" : "#e0e7ff" };
    if (score >= 50) return { label: "Moderate Profile", color: isDark ? "#fbbf24" : "#d97706", bg: isDark ? "#78350f" : "#fef3c7" };
    return { label: "Needs Optimization", color: isDark ? "#f87171" : "#ef4444", bg: isDark ? "#7f1d1d" : "#fee2e2" };
  };

  const scoreTier = getScoreTier(scorePercent);

  // SVG Circular Ring Calculation (Compact radius = 44px)
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  const scrollToInsights = () => {
    setShowScoreModal(false);
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="resume-page-wrapper">
      <main className="resume-main-shell">

        {/* UPLOAD & CONTROLS CONTAINER */}
        <section className="resume-card">
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <div className="upload-icon-circle" aria-hidden="true">
                <UploadCloud size={40} />
              </div>
              <p className="drop-text">Drag and drop your resume here</p>
              <p className="drop-or">or</p>
              <button className="browse-btn" onClick={handleBrowseClick}>
                Browse Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,.docx"
                style={{ display: "none" }}
              />
              <div className="file-requirements">
                <span className="req-item">PDF (.pdf)</span>
                <span className="req-item">DOCX (.docx)</span>
                <span className="req-item">Max: 5 MB</span>
              </div>
            </div>
          </div>

          {file && (
            <div className="file-details-card">
              <div className="file-details-header">
                <div className="file-icon-wrapper">
                  <File size={22} />
                </div>
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <div className="file-meta">
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="file-type">{file.type.includes("pdf") ? "PDF" : "DOCX"}</span>
                    <span
                      className={`file-status ${
                        uploadStatus.includes("success") || uploadStatus.includes("Selected")
                          ? "success"
                          : uploadStatus.toLowerCase().includes("fail") ||
                            uploadStatus.toLowerCase().includes("error") ||
                            uploadStatus.toLowerCase().includes("please") ||
                            uploadStatus.toLowerCase().includes("must")
                          ? "error"
                          : ""
                      }`}
                    >
                      {uploadStatus}
                    </span>
                  </div>
                </div>
                <button className="remove-file-btn" onClick={handleRemoveFile} title="Remove File">
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS ROW */}
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyze Resume
                </>
            </button>
          </div>

          {/* INSIGHTS CARDS */}
          {analysisResult && (
            <div className="ru-results-container" ref={resultsRef}>
              <div className="analysis-section-title">
                <h3>Resume Insights & Breakdown</h3>
                <p>Mapped backend evaluation from resume analysis, candidate profile, and technical skills.</p>
              </div>

              <div className="ru-result-grid">
                
                {/* CARD 1: Summary */}
                <section className="ru-result-card ru-result-card--summary">
                  <div className="ru-result-header">
                    <div className="ru-result-icon-badge summary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4>Resume Summary & Rating</h4>
                      <p className="ru-result-card-sub">Overview of your target designation & resume score</p>
                    </div>
                  </div>
                  <div className="ru-result-body">
                    <div className="analysis-row">
                      <div className="analysis-field">
                        <span className="analysis-field__label">Target Role / Title</span>
                        <span className="analysis-field__value bold-text">{analysisResult.role || "—"}</span>
                      </div>
                      {analysisResult.target_domain && (
                        <div className="analysis-field">
                          <span className="analysis-field__label">Target Domain</span>
                          <span className="analysis-field__value bold-text">{analysisResult.target_domain}</span>
                        </div>
                      )}
                      <div className="analysis-field analysis-field--grow">
                        <span className="analysis-field__label">Executive Summary & Domain Alignment</span>
                        <span className="analysis-field__value">
                          {analysisResult.summary || "—"}
                          {analysisResult.domain_match_feedback && (
                            <div style={{ marginTop: "6px", fontStyle: "italic", fontSize: "12px", opacity: 0.95 }}>
                              <strong>Domain Alignment:</strong> {analysisResult.domain_match_feedback}
                            </div>
                          )}
                        </span>
                      </div>
                      <div className="analysis-field analysis-field--score">
                        <span className="analysis-field__label">Power Score</span>
                        <span className="analysis-field__score-badge" style={{ color: scoreTier.color, background: scoreTier.bg }}>
                          {analysisResult.resume_score ?? "—"} / 100
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* CARD 2: Candidate Profile */}
                <section className="ru-result-card ru-result-card--profile">
                  <div className="ru-result-header">
                    <div className="ru-result-icon-badge profile">
                      <User size={20} />
                    </div>
                    <div>
                      <h4>Candidate Profile</h4>
                      <p className="ru-result-card-sub">Personal credentials and digital platform links</p>
                    </div>
                  </div>
                  <div className="ru-result-body">
                    <div className="analysis-row analysis-row--wrap">
                      {["Name", "Email", "Role", "Location", "Education", "Experience", "LinkedIn", "GitHub", "Portfolio"].map(
                        (label) => (
                          <div className="analysis-field analysis-field--profile" key={label}>
                            <span className="analysis-field__label">{label}</span>
                            <span className="analysis-field__value">
                              {candidateProfile[label] && candidateProfile[label].startsWith("http") ? (
                                <a href={candidateProfile[label]} target="_blank" rel="noreferrer" className="link-preview-text">
                                  {candidateProfile[label]}
                                </a>
                              ) : (
                                candidateProfile[label]
                              )}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </section>

                {/* CARD 3: Education, Experience and Skill */}
                <section className="ru-result-card ru-result-card--skills">
                  <div className="ru-result-header">
                    <div className="ru-result-icon-badge skills">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4>Education, Experience & Skill Breakdown</h4>
                      <p className="ru-result-card-sub">Matched skills and category mapping</p>
                    </div>
                  </div>
                  <div className="ru-result-body">
                    <div className="analysis-row analysis-row--wrap">
                      <div className="analysis-field analysis-field--skill">
                        <span className="analysis-field__label">Education</span>
                        <span className="analysis-field__value">{analysisResult.education || "—"}</span>
                      </div>

                      <div className="analysis-field analysis-field--skill">
                        <span className="analysis-field__label">Experience</span>
                        <span className="analysis-field__value">{analysisResult.experience || "—"}</span>
                      </div>

                      <div className="analysis-field analysis-field--skill">
                        <span className="analysis-field__label">Skill Category</span>
                        <span className="analysis-field__value bold-text">{analysisResult.skill_category || "—"}</span>
                      </div>

                      {/* Matched Skills */}
                      <div className="analysis-field analysis-field--full">
                        <span className="analysis-field__label">Matched Skills</span>
                        <div className="skills-chips-grid">
                          {analysisResult.matched_skills ? (
                            analysisResult.matched_skills.split(",").map((sk, idx) => (
                              <span key={idx} className="skill-chip matched">
                                <CheckCircle2 size={13} /> {sk.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="analysis-field__value">—</span>
                          )}
                        </div>
                      </div>

                      {/* Suggested Skills */}
                      <div className="analysis-field analysis-field--full">
                        <span className="analysis-field__label">Suggested Next Skills to Learn</span>
                        <div className="skills-chips-grid">
                          {analysisResult.suggested_next_skills ? (
                            analysisResult.suggested_next_skills.split(",").map((sk, idx) => (
                              <span key={idx} className="skill-chip suggested">
                                <TrendingUp size={13} /> {sk.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="analysis-field__value">—</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </section>

                {/* CARD 4: Recommendation and Suggestions */}
                <section className="ru-result-card ru-result-card--recommendations">
                  <div className="ru-result-header">
                    <div className="ru-result-icon-badge recommendations">
                      <Target size={20} />
                    </div>
                    <div>
                      <h4>Actionable Recommendations & Next Steps</h4>
                      <p className="ru-result-card-sub">Expert advice to enhance your candidate resume</p>
                    </div>
                  </div>
                  <div className="ru-result-body">
                    <div className="recommendations-list">
                      {analysisResult.suggestion_1 && (
                        <div className="recommendation-item-card">
                          <div className="rec-badge-number">1</div>
                          <div className="rec-text-content">
                            <strong>Project & Deployment Links</strong>
                            <p>{analysisResult.suggestion_1}</p>
                          </div>
                        </div>
                      )}

                      {analysisResult.suggestion_2 && (
                        <div className="recommendation-item-card">
                          <div className="rec-badge-number">2</div>
                          <div className="rec-text-content">
                            <strong>Experience & Impact Framing</strong>
                            <p>{analysisResult.suggestion_2}</p>
                          </div>
                        </div>
                      )}

                      {analysisResult.suggestion_3 && (
                        <div className="recommendation-item-card">
                          <div className="rec-badge-number">3</div>
                          <div className="rec-text-content">
                            <strong>Technical Architecture & Depth</strong>
                            <p>{analysisResult.suggestion_3}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

              </div>
            </div>
          )}

        </section>
      </main>

      {/* COMPACT & SLEEK POPUP MODAL: CIRCULAR SCORE ANALYZER */}
      {showScoreModal && analysisResult && (
        <div className="resume-modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="resume-score-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowScoreModal(false)} title="Close Modal">
              <X size={16} />
            </button>

            <div className="modal-header-icon">
              <Sparkles size={20} />
            </div>

            <h3 className="modal-title">Analysis Complete!</h3>
            <p className="modal-subtitle">AI Evaluation of Candidate Resume:</p>

            {/* PERFECTLY CENTERED SCORE NUMBER INSIDE CIRCLE */}
            <div className="circle-analyzer-container">
              <svg className="circle-analyzer-svg" width="110" height="110" viewBox="0 0 110 110">
                <circle
                  className="circle-bg"
                  cx="55"
                  cy="55"
                  r={radius}
                  strokeWidth="8"
                />
                <circle
                  className="circle-progress"
                  cx="55"
                  cy="55"
                  r={radius}
                  strokeWidth="8"
                  stroke={scoreTier.color}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="circle-analyzer-center">
                <span className="circle-score-number" style={{ color: scoreTier.color }}>
                  {scorePercent}%
                </span>
              </div>
            </div>

            {/* TIER BADGE */}
            <div className="score-tier-badge" style={{ background: scoreTier.bg, color: scoreTier.color }}>
              <Award size={14} />
              <span>{scoreTier.label}</span>
            </div>

            {/* DOMAIN RELEVANCE & ACTIVE STATUS BANNER */}
            {analysisResult.target_domain && (
              <div
                className="domain-relevance-banner"
                style={{
                  margin: "12px 0 4px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  textAlign: "left",
                  background: analysisResult.domain_match_status
                    ? theme === "dark" ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5"
                    : theme === "dark" ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                  border: `1px solid ${
                    analysisResult.domain_match_status
                      ? theme === "dark" ? "#059669" : "#10b981"
                      : theme === "dark" ? "#dc2626" : "#ef4444"
                  }`,
                  color: analysisResult.domain_match_status
                    ? theme === "dark" ? "#34d399" : "#047857"
                    : theme === "dark" ? "#f87171" : "#b91c1c",
                }}
              >
                <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                  🎯 Target Domain: {analysisResult.target_domain}
                </div>
                <div style={{ fontSize: "11px", lineHeight: "1.4", opacity: 0.9 }}>
                  {analysisResult.domain_match_feedback ||
                    (analysisResult.domain_match_status
                      ? "Resume skills & projects match candidate's selected domain."
                      : "Resume content does not align with chosen target domain.")}
                </div>
              </div>
            )}

            {/* METRICS GRID */}
            <div className="modal-metrics-grid">
              <div className="modal-metric-card">
                <ShieldCheck size={16} className="metric-icon" />
                <span className="metric-val">{analysisResult.matched_skills ? analysisResult.matched_skills.split(",").length : 0}</span>
                <span className="metric-lbl">Matched Skills</span>
              </div>

              <div className="modal-metric-card">
                <TrendingUp size={16} className="metric-icon" />
                <span className="metric-val">{scorePercent >= 70 ? "High" : "Medium"}</span>
                <span className="metric-lbl">Impact Rating</span>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="modal-actions-row">
              <button className="btn btn-primary modal-btn" onClick={scrollToInsights}>
                <span>View Full Insights</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeUpload;