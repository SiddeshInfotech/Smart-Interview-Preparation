// InterviewPage.jsx
import React, { useState } from 'react';
import "../styles/InterviewPage.css";

const InterviewPage = ({ standalone = false }) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);

  const handleJoinInterview = () => {
    setIsJoining(true);
    setTimeout(() => {
      setIsJoining(false);
      alert('Joining interview...');
    }, 2000);
  };

  const handleTestMic = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      alert('Microphone test complete!');
    }, 1500);
  };

  const handleCameraClick = () => {
    setIsCameraFullscreen(!isCameraFullscreen);
    if (!isCameraFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className={standalone ? "interview-standalone" : "interview-container"}>
      <div className="interview-content">
        {!standalone && (
          /* Header */
          <div className="header">
            <div className="header-left">
              <div className="logo">
                <span className="logo-icon">🎯</span>
                <span className="logo-text">InterviewConnect</span>
              </div>
            </div>
            <div className="header-right">
              <div className="nav-links">
                <span className="nav-link active">Dashboard</span>
                <span className="nav-link">Interviews</span>
                <span className="nav-link">Resources</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="main-grid">
          {/* Left Section */}
          <div className={`left-section ${isCameraFullscreen ? 'hidden' : ''}`}>
            {/* Interview Lobby */}
            <div className="lobby-card">
              <div className="lobby-header">
                <h3>Interview Lobby</h3>
                <div className="live-badge">LIVE PREVIEW</div>
              </div>
              <div 
                className="lobby-preview"
                onClick={handleCameraClick}
              >
                <div className="preview-placeholder">
                  <div className="camera-icon">📹</div>
                  <p>Click to view fullscreen</p>
                </div>
              </div>
            </div>

            {/* Upcoming Interview */}
            <div className="upcoming-card">
              <h3>Upcoming Interview</h3>
              <div className="interview-details">
                <div className="detail-item">
                  <span className="detail-label">Position</span>
                  <span className="detail-value">Senior Product Designer</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Candidate</span>
                  <span className="detail-value">Alex Sterling</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scheduled Time</span>
                  <span className="detail-value">2:00 PM – 3:00 PM</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Interviewers</span>
                  <span className="detail-value">Sarah Chen, Marcus Thorne</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className={`right-section ${isCameraFullscreen ? 'fullscreen-mode' : ''}`}>
            <div className={`ready-card ${isCameraFullscreen ? 'fullscreen-card' : ''}`}>
              {!isCameraFullscreen && (
                <>
                  <h2>Ready to join?</h2>
                  <p className="ready-subtitle">
                    The interviewers are currently in the room waiting for you to enter.
                  </p>
                </>
              )}

              {isCameraFullscreen ? (
                <div className="fullscreen-camera-container">
                  <div className="fullscreen-camera">
                    <div className="camera-preview-large">
                      <div className="camera-icon-large">📹</div>
                      <p>Camera Preview</p>
                      <button className="exit-fullscreen-btn" onClick={handleCameraClick}>
                        ✕ Exit Fullscreen
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="device-settings">
                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">🎤</span>
                      <div>
                        <div className="device-name">Microphone</div>
                        <div className="device-detail">MacBook Pro Mic</div>
                      </div>
                    </div>
                    <div className="device-status excellent">Connection: Excellent</div>
                  </div>

                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">📷</span>
                      <div>
                        <div className="device-name">Camera</div>
                        <div className="device-detail">FaceTime HD Camera</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isCameraFullscreen && (
                <>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-primary"
                      onClick={handleJoinInterview}
                      disabled={isJoining}
                    >
                      {isJoining ? 'Joining...' : 'Join Interview'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleTestMic}
                      disabled={isTesting}
                    >
                      {isTesting ? 'Testing...' : 'Test Speakers & Mic'}
                    </button>
                  </div>

                  <div className="security-badge">
                    <span>🔒</span>
                    <span>End-to-end encrypted and secure</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {!standalone && (
          /* Footer */
          <div className={`footer ${isCameraFullscreen ? 'hidden' : ''}`}>
            <div className="footer-content">
              <div className="footer-left">
                <span>© 2024 InterviewConnect. Secure & Encrypted.</span>
              </div>
              <div className="footer-right">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>System Status</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;