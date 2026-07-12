
import React, { useState, useRef, useEffect } from 'react';
import "../styles/ResumeUpload.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isAddedToProfile, setIsAddedToProfile] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const validExtensions = ['pdf', 'docx'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
      setUploadStatus('❌ Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadStatus('❌ File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setUploadStatus('✅ Selected Successfully');
    setAnalysisResult(null);
    setIsAddedToProfile(false);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  // Browse file handler
  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelect(selectedFile);
  };

  // Remove file handler
  const handleRemoveFile = () => {
    setFile(null);
    setUploadStatus('');
    setAnalysisResult(null);
    setIsAddedToProfile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset/Clear handler
  const handleReset = () => {
    setFile(null);
    setUploadStatus('');
    setAnalysisResult(null);
    setIsLoading(false);
    setIsAddedToProfile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Analyze Resume handler
  const handleAnalyze = () => {
    if (!file) {
      setUploadStatus('⚠️ Please select a file first');
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setAnalysisResult({
        score: 85,
        strengths: [
          'Strong professional summary',
          'Relevant work experience',
          'Quantifiable achievements',
          'Good keyword optimization'
        ],
        improvements: [
          'Add more specific metrics',
          'Include relevant certifications',
          'Expand technical skills section'
        ],
        recommendations: [
          'Tailor your resume for each job application',
          'Use action verbs to describe achievements',
          'Keep the format consistent and professional'
        ]
      });
      setUploadStatus('✅ Analysis Complete!');
    }, 3000);
  };

  // Add to Profile handler
  const handleAddToProfile = () => {
    if (!file) {
      setUploadStatus('⚠️ No resume to add to profile');
      return;
    }
    setIsAddedToProfile(true);
    setUploadStatus('✅ Resume added to profile successfully!');
    
    // You can add API call here to save to profile
    console.log('Adding resume to profile:', file.name);
  };

  return (
    <div className="app-container">
      <div className="main-content">
        {/* Header Section */}
        <div className="header-section">
          <div className="header-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="header-title">Resume Analysis</h1>
          <p className="header-subtitle">
            Upload your resume to receive AI-powered feedback and personalized interview preparation.
          </p>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="drop-zone-content">
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 16L4 17C4 18.6569 5.34315 20 7 20L17 20C18.6569 20 20 18.6569 20 17L20 16" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                style={{ display: 'none' }}
              />
              <div className="file-requirements">
                <span className="req-item">📄 PDF (.pdf)</span>
                <span className="req-item">📂 DOCX (.docx)</span>
                <span className="req-item">📦 Max: 5 MB</span>
              </div>
            </div>
          </div>

          {/* Selected File Details */}
          {file && (
            <div className="file-details-card">
              <div className="file-details-header">
                <div className="file-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <div className="file-meta">
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="file-type">{file.type.includes('pdf') ? 'PDF' : 'DOCX'}</span>
                    <span className={`file-status ${uploadStatus.includes('Success') ? 'success' : ''}`}>
                      {uploadStatus}
                    </span>
                  </div>
                </div>
                <button className="remove-file-btn" onClick={handleRemoveFile}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={handleBrowseClick}>
              Browse File
            </button>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={!file || isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze Resume'
              )}
            </button>
            <button className="btn btn-profile" onClick={handleAddToProfile} disabled={!file || isLoading}>
              {isAddedToProfile ? '✅ Added to Profile' : 'Add to Profile'}
            </button>
            <button className="btn btn-outline" onClick={handleReset}>
              Reset
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="loading-container">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <p className="loading-text">Analyzing Resume... Please wait.</p>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="results-container">
              <div className="score-card">
                <div className="score-circle">
                  <div className="score-number">{analysisResult.score}</div>
                  <div className="score-label">/100</div>
                </div>
                <h3 className="score-title">Resume Score</h3>
              </div>

              <div className="result-grid">
                <div className="result-card strengths">
                  <div className="result-header">
                    <span className="result-icon">💪</span>
                    <h4>Strengths</h4>
                  </div>
                  <ul className="result-list">
                    {analysisResult.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="result-card improvements">
                  <div className="result-header">
                    <span className="result-icon">📈</span>
                    <h4>Areas for Improvement</h4>
                  </div>
                  <ul className="result-list">
                    {analysisResult.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="result-card recommendations full-width">
                  <div className="result-header">
                    <span className="result-icon">🎯</span>
                    <h4>Recommendations</h4>
                  </div>
                  <ul className="result-list">
                    {analysisResult.recommendations.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;