// src/pages/InterviewPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import "../styles/InterviewPage.css";

// MediaPipe imports - YEH RAHEGA
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const InterviewPage = () => {
  const [isJoining, setIsJoining] = useState(false);
  const [isInInterview, setIsInInterview] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [isFaceVisible, setIsFaceVisible] = useState(true);
  const [gazeDirection, setGazeDirection] = useState('center');
  const [eyeOffScreenCount, setEyeOffScreenCount] = useState(0);
  const [showEyeWarning, setShowEyeWarning] = useState(false);
  
  const videoRef = useRef(null);
  const interviewerVideoRef = useRef(null);
  const timerInterval = useRef(null);
  const detectionFrameRef = useRef(null);
  const MAX_SWITCHES = 3;
  const MAX_EYE_OFF = 3;

  // Initialize MediaPipe Face Landmarker
  const initializeFaceLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      
      setFaceLandmarker(landmarker);
      return landmarker;
    } catch (err) {
      console.error("MediaPipe initialization error:", err);
      return null;
    }
  };

  // Face and Eye detection using MediaPipe
  const detectFaceAndEyes = useCallback(async (landmarker) => {
    if (!videoRef.current || !landmarker || !isInInterview) return;

    const video = videoRef.current;

    try {
      const result = landmarker.detectForVideo(video, performance.now());

      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        
        // Face verification
        setIsFaceVisible(true);

        // Get eye landmarks
        const leftEye = {
          top: landmarks[159],
          bottom: landmarks[145],
          left: landmarks[33],
          right: landmarks[133]
        };
        
        const rightEye = {
          top: landmarks[386],
          bottom: landmarks[374],
          left: landmarks[362],
          right: landmarks[263]
        };

        // Calculate gaze direction
        const gazeX = (landmarks[468].x + landmarks[473].x) / 2;
        const gazeY = (landmarks[468].y + landmarks[473].y) / 2;
        const gazeZ = (landmarks[468].z + landmarks[473].z) / 2;

        let direction = 'center';
        if (gazeX < 0.4) direction = 'left';
        else if (gazeX > 0.6) direction = 'right';
        else if (gazeY < 0.4) direction = 'up';
        else if (gazeY > 0.6) direction = 'down';
        else if (gazeZ > 0.3) direction = 'away';
        
        setGazeDirection(direction);

        // Check if eyes are looking away
        const isLookingAway = direction === 'away' || direction === 'left' || direction === 'right';
        
        if (isLookingAway) {
          setEyeOffScreenCount(prev => {
            const newCount = prev + 1;
            if (newCount >= MAX_EYE_OFF && !showEyeWarning) {
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
      } else {
        // No face detected
        setIsFaceVisible(false);
        setEyeOffScreenCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_EYE_OFF && !showEyeWarning) {
            setShowEyeWarning(true);
            alert(`⚠️ Face not detected! (${newCount}/${MAX_EYE_OFF})`);
            if (newCount >= MAX_EYE_OFF + 2) {
              alert('🚫 Interview terminated! Face missing multiple times.');
              handleEndInterview();
            }
          }
          return newCount;
        });
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    // Continue detection loop
    if (isInInterview && faceLandmarker) {
      detectionFrameRef.current = requestAnimationFrame(() => {
        detectFaceAndEyes(faceLandmarker);
      });
    }
  }, [isInInterview, faceLandmarker, showEyeWarning]);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
        videoRef.current.play();
      }
      
      if (interviewerVideoRef.current) {
        interviewerVideoRef.current.srcObject = mediaStream;
        await new Promise((resolve) => {
          interviewerVideoRef.current.onloadedmetadata = resolve;
        });
        interviewerVideoRef.current.play();
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
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) || e.key === 'F12') {
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
      }
      if (faceLandmarker) {
        faceLandmarker.close();
      }
    };
  }, [faceLandmarker]);

  const handleJoinInterview = async () => {
    setIsJoining(true);
    
    // Initialize MediaPipe
    const landmarker = await initializeFaceLandmarker();
    if (!landmarker) {
      setIsJoining(false);
      return;
    }
    
    const started = await startCamera();
    if (started) {
      setTimeout(() => {
        setIsJoining(false);
        setIsInInterview(true);
        startTimer();
        alert('✅ You have joined the interview!');
        document.documentElement.requestFullscreen?.();
        
        setTimeout(() => {
          if (videoRef.current && landmarker) {
            detectFaceAndEyes(landmarker);
          }
        }, 1000);
      }, 2000);
    } else {
      setIsJoining(false);
    }
  };

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (interviewerVideoRef.current) {
        interviewerVideoRef.current.srcObject = null;
      }
      if (detectionFrameRef.current) {
        cancelAnimationFrame(detectionFrameRef.current);
      }
      if (faceLandmarker) {
        faceLandmarker.close();
        setFaceLandmarker(null);
      }
      setIsInInterview(false);
      setTabSwitchCount(0);
      setShowWarning(false);
      setTimer(0);
      setEyeOffScreenCount(0);
      setShowEyeWarning(false);
      document.exitFullscreen?.();
      alert('Interview ended successfully!');
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
      }
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    if (videoRef.current && videoRef.current.srcObject) {
      const track = videoRef.current.srcObject.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
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

        {/* Face Status */}
        {isInInterview && (
          <div className="face-status-bar">
            <div className={`face-status ${isFaceVisible ? 'visible' : 'hidden'}`}>
              {isFaceVisible ? '✅ Face Detected' : '❌ Face Not Detected'}
            </div>
            <div className={`gaze-status ${gazeDirection}`}>
              {gazeDirection === 'center' ? '👁️ Looking at Screen' : `👁️ Looking ${gazeDirection}`}
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isInInterview ? (
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
          <div className="video-call-container">
            <div className="video-grid">
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