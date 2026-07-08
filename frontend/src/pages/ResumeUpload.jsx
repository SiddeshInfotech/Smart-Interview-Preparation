import React, { useState, useRef } from "react";
import "../styles/ResumeUpload.css";

const MAX_SIZE_MB = 10;
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ResumeUpload() {
  const [resumes, setResumes] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb < 0.1 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${mb.toFixed(2)} MB`;
  };

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only PDF or DOCX files are supported.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File is too large. Max size is ${MAX_SIZE_MB}MB.`;
    }
    return "";
  };

  const addFile = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    const newResume = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      active: resumes.length === 0,
    };
    setResumes((prev) => [newResume, ...prev]);
  };

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (file) addFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const setActive = (id) => {
    setResumes((prev) => prev.map((r) => ({ ...r, active: r.id === id })));
  };

  const removeResume = (id) => {
    setResumes((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      if (filtered.length > 0 && !filtered.some((r) => r.active)) {
        filtered[0].active = true;
      }
      return filtered;
    });
  };

  const formatDate = (date) =>
    date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="resume-page">
      <div className="resume-container">
        <h1 className="resume-title">Resume Manager</h1>
        <p className="resume-subtitle">
          Upload the resume you want your AI interviewer to reference. It's used
          to tailor questions to your real experience.
        </p>

        <div
          className={`upload-box ${dragActive ? "drag-active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 12v6M9 15l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="upload-title">Upload resume</p>
          <p className="upload-hint">Drag and drop your PDF or DOCX file here to begin</p>

          <button
            type="button"
            className="browse-btn"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Browse files
          </button>

          <p className="upload-limit">Max size: {MAX_SIZE_MB}MB &middot; PDF or DOCX</p>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {error && <p className="upload-error">{error}</p>}

        {resumes.length > 0 && (
          <div className="resume-list">
            <h2 className="resume-list-title">Your resumes</h2>
            {resumes.map((r) => (
              <div key={r.id} className={`resume-item ${r.active ? "active" : ""}`}>
                <div className="resume-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="resume-item-info">
                  <p className="resume-item-name">{r.name}</p>
                  <p className="resume-item-meta">
                    {formatSize(r.size)} &middot; Uploaded {formatDate(r.uploadedAt)}
                  </p>
                </div>
                {r.active ? (
                  <span className="active-badge">In use</span>
                ) : (
                  <button type="button" className="text-link small" onClick={() => setActive(r.id)}>
                    Use this
                  </button>
                )}
                <button
                  type="button"
                  className="remove-btn"
                  aria-label="Remove resume"
                  onClick={() => removeResume(r.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}