import React, { useEffect, useRef, useState } from "react";
import { LayoutDashboard, ClipboardList, FileText } from "lucide-react";
import PageNavbar from "../components/PageNavbar.jsx";
import "../styles/ResumeUpload.css";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isAddedToProfile, setIsAddedToProfile] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
  }, []);

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
    setIsAddedToProfile(false);
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
    setIsAddedToProfile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setFile(null);
    setUploadStatus("");
    setAnalysisResult(null);
    setIsLoading(false);
    setIsAddedToProfile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = () => {
    if (!file) {
      setUploadStatus("Please select a file first");
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setIsLoading(false);
      setUploadStatus("Resume ready for analysis");
      setAnalysisResult({
        title: file.name,
        summary: "",
        score: null,
        recommendations: [],
      });
    }, 900);
  };

  const handleAddToProfile = () => {
    if (!file) {
      setUploadStatus("No resume to add to profile");
      return;
    }

    setIsAddedToProfile(true);
    setUploadStatus("Resume added to profile successfully!");
  };

  return (
    <div className="resume-page-wrapper">
      <PageNavbar
        activePath="/resume-upload"
        navItems={[
          { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
          { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
        ]}
        brandLabel="PrepMaster AI"
        brandHref="/dashboard"
      />

      <main className="resume-main-shell">
        <section className="resume-card">
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <div className="upload-icon" aria-hidden="true">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2V8H20" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <div className="file-meta">
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="file-type">{file.type.includes("pdf") ? "PDF" : "DOCX"}</span>
                    <span className={`file-status ${uploadStatus.includes("Success") ? "success" : ""}`}>
                      {uploadStatus}
                    </span>
                  </div>
                </div>
                <button className="remove-file-btn" onClick={handleRemoveFile}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </button>
            <button className="btn btn-profile" onClick={handleAddToProfile} disabled={!file || isLoading}>
              {isAddedToProfile ? "✅ Added to Profile" : "Add to Profile"}
            </button>
            <button className="btn btn-outline" onClick={handleReset}>
              Reset
            </button>
          </div>

          {isLoading && (
            <div className="loading-container">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="loading-text">Analyzing Resume... Please wait.</p>
            </div>
          )}

          {analysisResult ? (
            <div className="results-container">
              <div className="analysis-section-title">
                <h3>Resume Insights</h3>
                <p>Ready to map backend output from resume, profile, and skills data.</p>
              </div>

              <div className="result-grid">
                <section className="result-card result-card--summary">
                  <div className="result-header result-header--left">
                    <span className="result-icon">📄</span>
                    <h4>Resume Summary</h4>
                  </div>
                  <div className="result-body">
                    <div className="analysis-row">
                      <div className="analysis-field">
                        <span className="analysis-field__label">Title</span>
                        <span className="analysis-field__value">{analysisResult.title || "—"}</span>
                      </div>
                      <div className="analysis-field analysis-field--grow">
                        <span className="analysis-field__label">Summary</span>
                        <span className="analysis-field__value">{analysisResult.summary || "—"}</span>
                      </div>
                      <div className="analysis-field analysis-field--narrow">
                        <span className="analysis-field__label">Score</span>
                        <span className="analysis-field__value">{analysisResult.score ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="result-card result-card--profile">
                  <div className="result-header result-header--left">
                    <span className="result-icon">👤</span>
                    <h4>Candidate Profile</h4>
                    <span className="result-header-note">with social platform urls</span>
                  </div>
                  <div className="result-body">
                    <div className="analysis-row analysis-row--wrap">
                      {["Name", "Email", "Role", "Location", "Education", "Experience", "LinkedIn", "GitHub", "Portfolio"].map(
                        (label) => (
                          <div className="analysis-field analysis-field--profile" key={label}>
                            <span className="analysis-field__label">{label}</span>
                            <span className="analysis-field__value">—</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </section>

                <section className="result-card result-card--skills">
                  <div className="result-header result-header--left">
                    <span className="result-icon">✨</span>
                    <h4>Education, Experience and Skill</h4>
                  </div>
                  <div className="result-body">
                    <div className="analysis-row analysis-row--wrap">
                      {["Education", "Experience", "Matched skills", "Missing skills", "Suggested next skills", "Skill category"].map((label) => (
                        <div className="analysis-field analysis-field--skill" key={label}>
                          <span className="analysis-field__label">{label}</span>
                          <span className="analysis-field__value">—</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="result-card result-card--recommendations">
                  <div className="result-header result-header--left">
                    <span className="result-icon">🎯</span>
                    <h4>Recommendation and Suggestions</h4>
                  </div>
                  <div className="result-body">
                    <div className="analysis-row analysis-row--wrap">
                      <div className="analysis-field analysis-field--recommendation">
                        <span className="analysis-field__label">Suggestion 1</span>
                        <span className="analysis-field__value">Will appear after analysis.</span>
                      </div>
                      <div className="analysis-field analysis-field--recommendation">
                        <span className="analysis-field__label">Suggestion 2</span>
                        <span className="analysis-field__value">Will appear after analysis.</span>
                      </div>
                      <div className="analysis-field analysis-field--recommendation">
                        <span className="analysis-field__label">Suggestion 3</span>
                        <span className="analysis-field__value">Will appear after analysis.</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default ResumeUpload;
