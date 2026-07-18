// InterviewPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import "../styles/InterviewPage.css";

const InterviewPage = () => {
  const [isJoining, setIsJoining] = useState(false);
  const [isInInterview, setIsInInterview] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [eyeOffScreenCount, setEyeOffScreenCount] = useState(0);
  const [showEyeWarning, setShowEyeWarning] = useState(false);
  const [stream, setStream] = useState(null);
  const [timer, setTimer] = useState(0);
  
  const videoRef = useRef(null);
  const interviewerVideoRef = useRef(null);
  const eyeCheckInterval = useRef(null);
  const timerInterval = useRef(null);
  const MAX_SWITCHES = 3;
  const MAX_EYE_OFF = 3;

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // For demo, showing same stream in interviewer video
      if (interviewerVideoRef.current) {
        interviewerVideoRef.current.srcObject = mediaStream;
      }
      
      return true;
    } catch (err) {
      console.error('Camera error:', err);
      alert('Please allow camera and microphone access');
      return false;
    }
  };

  // Start timer
  const startTimer = useCallback(() => {
    timerInterval.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, []);

  // Eye detection simulation
  const startEyeDetection = useCallback(() => {
    if (eyeCheckInterval.current) {
      clearInterval(eyeCheckInterval.current);
    }
    
    eyeCheckInterval.current = setInterval(() => {
      if (!isInInterview) return;
      
      // Simulate eye detection - random for demo
      const isEyeOff = Math.random() < 0.15;
      
      if (isEyeOff) {
        setEyeOffScreenCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_EYE_OFF) {
            setShowEyeWarning(true);
            alert(`⚠️ You looked away from screen! (${newCount}/${MAX_EYE_OFF})`);
            if (newCount >= MAX_EYE_OFF + 2) {
              alert('🚫 Interview terminated! You looked away multiple times.');
              handleEndInterview();
            }
          }
          return newCount;
        });
      } else {
        setEyeOffScreenCount(0);
        setShowEyeWarning(false);
      }
    }, 5000);
  }, [isInInterview]);

  // Tab switch detection
  useEffect(() => {
    if (!isInInterview) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          setShowWarning(true);
          alert(`⚠️ Tab switch detected! (${newCount}/${MAX_SWITCHES})`);
          if (newCount >= MAX_SWITCHES) {
            alert('🚫 Interview terminated! You switched tabs multiple times.');
            handleEndInterview();
          }
          return newCount;
        });
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      alert('❌ Right-click disabled during interview!');
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'u' || e.key === 'U')) || e.key === 'F12') {
        e.preventDefault();
        alert('❌ This action is not allowed!');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInInterview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (eyeCheckInterval.current) {
        clearInterval(eyeCheckInterval.current);
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [stream]);

  const handleJoinInterview = async () => {
    setIsJoining(true);
    const started = await startCamera();
    if (started) {
      setTimeout(() => {
        setIsJoining(false);
        setIsInInterview(true);
        startEyeDetection();
        startTimer();
        alert('✅ You have joined the interview!');
        document.documentElement.requestFullscreen?.();
      }, 2000);
    } else {
      setIsJoining(false);
    }
  };

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (eyeCheckInterval.current) {
        clearInterval(eyeCheckInterval.current);
        eyeCheckInterval.current = null;
      }
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (interviewerVideoRef.current) {
        interviewerVideoRef.current.srcObject = null;
      }
      setIsInInterview(false);
      setTabSwitchCount(0);
      setShowWarning(false);
      setEyeOffScreenCount(0);
      setShowEyeWarning(false);
      setTimer(0);
      document.exitFullscreen?.();
      alert('Interview ended successfully!');
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCameraOn(track.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    }
  };

  // Format timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="interview-container">
      <div className="interview-content">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">🎯</span>
              <span className="logo-text">InterviewConnect</span>
            </div>
          </div>
          <div className="header-right">
            {isInInterview ? (
              <div className="interview-status">
                <span className="status-dot"></span>
                <span className="status-text">🔴 Live Interview</span>
                <button className="end-interview-btn" onClick={handleEndInterview}>
                  End Interview
                </button>
              </div>
            ) : (
              <div className="nav-links">
                <span className="nav-link active">Dashboard</span>
                <span className="nav-link">Interviews</span>
                <span className="nav-link">Resources</span>
              </div>
            )}
          </div>
        </div>

        {/* Warnings */}
        {showWarning && isInInterview && (
          <div className="warning-banner">
            <span>⚠️ Tab Switching Detected! ({tabSwitchCount}/{MAX_SWITCHES})</span>
            <button onClick={() => setShowWarning(false)}>✕</button>
          </div>
        )}
        {showEyeWarning && isInInterview && (
          <div className="warning-banner eye-warning">
            <span>👀 You looked away from screen! ({eyeOffScreenCount}/{MAX_EYE_OFF+2})</span>
            <button onClick={() => setShowEyeWarning(false)}>✕</button>
          </div>
        )}

        {/* Main Content */}
        {!isInInterview ? (
          /* Pre-interview Layout */
          <div className="main-grid">
            <div className="left-section">
              <div className="lobby-card">
                <div className="lobby-header">
                  <h3>Interview Lobby</h3>
                  <div className="live-badge">LIVE PREVIEW</div>
                </div>
                <div className="lobby-preview">
                  <div className="preview-placeholder">
                    <div className="camera-icon">📹</div>
                    <p>Click "Join Interview" to start</p>
                  </div>
                </div>
              </div>

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

            <div className="right-section">
              <div className="ready-card">
                <h2>Ready to join?</h2>
                <p className="ready-subtitle">
                  The interviewers are currently in the room waiting for you to enter.
                </p>

                <div className="device-settings">
                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">🎤</span>
                      <div>
                        <div className="device-name">Microphone</div>
                        <div className="device-detail">MacBook Pro Mic</div>
                      </div>
                    </div>
                    <div className="device-status excellent">✅ Ready</div>
                  </div>

                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">📷</span>
                      <div>
                        <div className="device-name">Camera</div>
                        <div className="device-detail">FaceTime HD Camera</div>
                      </div>
                    </div>
                    <div className="device-status">✅ Ready</div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={handleJoinInterview} disabled={isJoining}>
                    {isJoining ? 'Joining...' : '🚀 Join Interview'}
                  </button>
                </div>

                <div className="security-badge">
                  <span>🔒</span>
                  <span>End-to-end encrypted and secure</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Video Call Layout */
          <div className="video-call-container">
            <div className="video-grid">
              {/* Interviewer Video - Big */}
              <div className="video-box interviewer-video">
                <video
                  ref={interviewerVideoRef}
                  autoPlay
                  playsInline
                  className="video-element"
                />
                <div className="video-label">👤 Interviewer</div>
                <div className="video-status online">🟢 Online</div>
              </div>

              {/* Candidate Video - Small */}
              <div className="video-box candidate-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="video-element"
                />
                <div className="video-label">👤 You</div>
                <div className="video-controls">
                  <button className={`control-btn ${isCameraOn ? 'active' : 'inactive'}`} onClick={toggleCamera}>
                    {isCameraOn ? '📷 On' : '📷 Off'}
                  </button>
                  <button className={`control-btn ${isMicOn ? 'active' : 'inactive'}`} onClick={toggleMic}>
                    {isMicOn ? '🎤 On' : '🎤 Off'}
                  </button>
                  <button className="control-btn end-call" onClick={handleEndInterview}>
                    📞 End Call
                  </button>
                </div>
              </div>
            </div>

            {/* Interview Info Overlay */}
            <div className="interview-info-overlay">
              <div className="info-item">
                <span>⏱️ Duration: {formatTime(timer)}</span>
              </div>
              <div className="info-item">
                <span>👥 Interview in Progress</span>
              </div>
              <div className="info-item">
                <span>🔒 Secure Connection</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`footer ${isInInterview ? 'hidden' : ''}`}>
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
      </div>
    </div>
  );
};

export default InterviewPage;