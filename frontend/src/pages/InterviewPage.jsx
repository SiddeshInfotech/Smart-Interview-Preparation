// src/pages/InterviewPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useParticipants,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import api from '../api/axios';
import '../styles/InterviewPage.css';
import InterviewerFeedbackModal from '../components/InterviewerFeedbackModal';
import CandidateWaitingModal from '../components/CandidateWaitingModal';


// ---- Child component that uses LiveKit hooks and displays video ----
const LiveVideo = ({
  videoRef,
  stream,
  isCameraOn,
  isMicOn,
  timer,
  toggleCamera,
  toggleMic,
  handleEndInterview,
  role,
  participantName,
  selectedInterview,
}) => {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  const localIdentity = localParticipant?.identity;

  // Synchronize camera state with LiveKit Room track
  useEffect(() => {
    if (localParticipant) {
      localParticipant
        .setCameraEnabled(isCameraOn)
        .catch((err) => console.warn('Camera sync error:', err));
    }
  }, [isCameraOn, localParticipant]);

  // Synchronize microphone state with LiveKit Room track
  useEffect(() => {
    if (localParticipant) {
      localParticipant
        .setMicrophoneEnabled(isMicOn)
        .catch((err) => console.warn('Mic sync error:', err));
    }
  }, [isMicOn, localParticipant]);

  const handleToggleCamera = async () => {
    const nextState = !isCameraOn;
    toggleCamera();
    if (localParticipant) {
      try {
        await localParticipant.setCameraEnabled(nextState);
      } catch (err) {
        console.warn('Set camera enabled error:', err);
      }
    }
  };

  const handleToggleMic = async () => {
    const nextState = !isMicOn;
    toggleMic();
    if (localParticipant) {
      try {
        await localParticipant.setMicrophoneEnabled(nextState);
      } catch (err) {
        console.warn('Set mic enabled error:', err);
      }
    }
  };

  // Filter for remote video tracks
  const remoteVideoTracks = tracks.filter(
    (track) =>
      track.participant.identity !== localIdentity &&
      track.source === Track.Source.Camera
  );

  const hasRemoteVideo = remoteVideoTracks.length > 0;
  const remoteParticipants = participants.filter(
    (p) => p.identity !== localIdentity
  );
  const hasRemoteParticipant = remoteParticipants.length > 0;

  // Opposite user username / name
  const remoteUserObj = remoteParticipants[0];
  const oppositeFallback =
    role === 'candidate'
      ? selectedInterview?.interviewer_username || selectedInterview?.interviewer_name || selectedInterview?.interviewer || 'Interviewer'
      : selectedInterview?.candidate_username || selectedInterview?.candidate_name || selectedInterview?.candidate || 'Candidate';

  const oppositeUserName =
    remoteUserObj?.name || remoteUserObj?.identity || oppositeFallback;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Play error:', e));
    }
  }, [videoRef, stream]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine the placeholder message
  let placeholderMessage = '';
  if (!hasRemoteParticipant) {
    placeholderMessage = '⏳ Waiting for other participant to join...';
  } else if (hasRemoteParticipant && !hasRemoteVideo) {
    placeholderMessage = '🔄 Connecting to video...';
  } else {
    placeholderMessage = '';
  }

  return (
    <div className="video-call-container">
      <div className="video-grid">
        {/* Remote participant video */}
        <div className="video-box interviewer-video">
          {hasRemoteVideo ? (
            remoteVideoTracks.map((track) => (
              <VideoTrack key={track.sid} trackRef={track} />
            ))
          ) : (
            <div className="video-placeholder">{placeholderMessage}</div>
          )}
          <div className="video-label">👤 {oppositeUserName}</div>
          <div className="video-status online">🟢 Online</div>
        </div>

        {/* Local candidate/interviewer video */}
        <div className="video-box candidate-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-element"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isCameraOn ? 'block' : 'none',
            }}
          />
          {!isCameraOn && (
            <div className="video-placeholder">📷 Camera Off</div>
          )}
          <div className="video-label">👤 {participantName || 'You'} (You)</div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="interview-info-overlay">
        <div className="footer-duration">
          <span>⏱️ Duration: {formatTime(timer)}</span>
        </div>
        <div className="footer-controls">
          <button
            className={`control-btn ${isCameraOn ? 'active' : 'inactive'}`}
            onClick={handleToggleCamera}
          >
            {isCameraOn ? '📷 On' : '📷 Off'}
          </button>
          <button
            className={`control-btn ${isMicOn ? 'active' : 'inactive'}`}
            onClick={handleToggleMic}
          >
            {isMicOn ? '🎤 On' : '🎤 Off'}
          </button>
          <button className="control-btn end-call" onClick={handleEndInterview}>
            📞 End Interview
          </button>
        </div>
        <div className="footer-secure">
          <span>🔒 Secure Connection</span>
        </div>
      </div>
    </div>
  );
};

function formatDate(dateStr) {
  if (!dateStr) return "Today";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime12(timeStr) {
  if (!timeStr) return "Scheduled Time";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  const hStr = String(h).padStart(2, "0");
  return `${hStr}:${m} ${period}`;
}

// ---- Main InterviewPage component ----
const InterviewPage = ({
  standalone = false,
  roomName,
  identity,
  participantName,
  role = 'participant',
  selectedInterview = null,
  onBack = null,
}) => {
  // ---- LiveKit states ----
  const [token, setToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  // ---- Device detection states ----
  const [micDeviceName, setMicDeviceName] = useState("Default Microphone");
  const [cameraDeviceName, setCameraDeviceName] = useState("Default Camera");

  useEffect(() => {
    const detectDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInput = devices.find((d) => d.kind === "audioinput" && d.label);
          const videoInput = devices.find((d) => d.kind === "videoinput" && d.label);
          if (audioInput) setMicDeviceName(audioInput.label);
          if (videoInput) setCameraDeviceName(videoInput.label);
        }
      } catch (err) {
        console.warn("Could not enumerate devices:", err);
      }
    };
    detectDevices();
  }, []);

  // ---- UI states ----
  const [isJoining, setIsJoining] = useState(false);
  const [isInInterview, setIsInInterview] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);
  const [showInterviewerFeedbackModal, setShowInterviewerFeedbackModal] = useState(false);
  const [showCandidateWaitingModal, setShowCandidateWaitingModal] = useState(false);


  // ---- Tab/eye tracking ----
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showEyeWarning, setShowEyeWarning] = useState(false);
  const [eyeOffScreenCount, setEyeOffScreenCount] = useState(0);
  const MAX_SWITCHES = 3;
  const MAX_EYE_OFF = 3;

  // ---- MediaPipe ----
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [isFaceVisible, setIsFaceVisible] = useState(true);
  const [gazeDirection, setGazeDirection] = useState('center');
  const videoRef = useRef(null);
  const localStreamRef = useRef(null);
  const detectionFrameRef = useRef(null);
  const isEndingRef = useRef(false); // to prevent multiple alerts
  const isDetectionReady = useRef(false); // cooldown flag

  // ---- Start camera for preview & detection ----
  const startLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return stream;
    } catch (err) {
      console.error('Camera error:', err);
      alert('Please allow camera and microphone access.');
      return null;
    }
  };

  // ---- Initialize MediaPipe ----
  const initializeFaceLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      setFaceLandmarker(landmarker);
      return landmarker;
    } catch (err) {
      console.error('MediaPipe init error:', err);
      return null;
    }
  };

  // ---- Face detection loop ----
  const detectFaceAndEyes = useCallback(
    async (landmarker) => {
      // Only run if interview is active and not ending
      if (!isInInterview || isEndingRef.current) return;

      const video = videoRef.current;
      if (!video || !video.srcObject || video.paused || video.ended) {
        // If video is not ready, just continue the loop
        if (isInInterview && !isEndingRef.current) {
          detectionFrameRef.current = requestAnimationFrame(() =>
            detectFaceAndEyes(landmarker)
          );
        }
        return;
      }

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          setIsFaceVisible(true);

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

          const isLookingAway = direction === 'away' || direction === 'left' || direction === 'right';
          if (isLookingAway) {
            // Only increment if detection is ready (cooldown passed) and not ending
            if (isDetectionReady.current && !isEndingRef.current) {
              setEyeOffScreenCount((prev) => {
                const newCount = prev + 1;
                if (newCount >= MAX_EYE_OFF && !showEyeWarning && isInInterview && !isEndingRef.current) {
                  setShowEyeWarning(true);
                  alert(`⚠️ You looked away! (${newCount}/${MAX_EYE_OFF})`);
                  if (newCount >= MAX_EYE_OFF + 2) {
                    alert('🚫 Interview terminated for looking away.');
                    handleEndInterview();
                  }
                }
                return newCount;
              });
            }
          } else {
            setEyeOffScreenCount(0);
            setShowEyeWarning(false);
          }
        } else {
          // No face – similar logic with cooldown
          if (isDetectionReady.current && !isEndingRef.current) {
            setIsFaceVisible(false);
            setEyeOffScreenCount((prev) => {
              const newCount = prev + 1;
              if (newCount >= MAX_EYE_OFF && !showEyeWarning && isInInterview && !isEndingRef.current) {
                setShowEyeWarning(true);
                alert(`⚠️ Face not detected! (${newCount}/${MAX_EYE_OFF})`);
                if (newCount >= MAX_EYE_OFF + 2) {
                  alert('🚫 Interview terminated: face missing.');
                  handleEndInterview();
                }
              }
              return newCount;
            });
          }
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      // Continue loop if still active
      if (isInInterview && !isEndingRef.current && faceLandmarker) {
        detectionFrameRef.current = requestAnimationFrame(() =>
          detectFaceAndEyes(faceLandmarker)
        );
      }
    },
    [isInInterview, faceLandmarker, showEyeWarning]
  );

  // ---- Timer ----
  useEffect(() => {
    if (isInInterview) {
      timerInterval.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      clearInterval(timerInterval.current);
    }
    return () => clearInterval(timerInterval.current);
  }, [isInInterview]);

  // ---- Tab switch detection ----
  useEffect(() => {
    if (!isInInterview) return;
    // Tab switching restrictions strictly apply ONLY to candidate role!
    if (role !== 'candidate') return;

    const handleVisibilityChange = () => {
      if (document.hidden && isInInterview && !isEndingRef.current) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_SWITCHES) {
            alert(`🚫 Interview terminated immediately due to excessive tab switches (${newCount}/${MAX_SWITCHES}).`);
            handleEndInterview();
          } else {
            setShowWarning(true);
            alert(`⚠️ Tab switch detected! (${newCount}/${MAX_SWITCHES}). If you switch tabs ${MAX_SWITCHES - newCount} more time(s), your interview will end immediately.`);
          }
          return newCount;
        });
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        alert('❌ Action disabled during candidate interview.');
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
  }, [isInInterview, role]);

  // ---- Join interview ----
  const handleJoinInterview = async () => {
    if (!roomName || !identity) {
      alert('Missing room or identity information.');
      return;
    }
    setIsJoining(true);
    try {
      // 1. Request Browser Fullscreen Mode
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => console.warn('Fullscreen error:', err));
      }
      // 1. Start local camera
      const stream = await startLocalCamera();
      if (!stream) {
        setIsJoining(false);
        return;
      }

      // 2. Initialize MediaPipe
      const landmarker = await initializeFaceLandmarker();
      if (!landmarker) {
        setIsJoining(false);
        return;
      }

      // 3. Fetch LiveKit token
      const res = await api.post('/interview/livekit-token/', {
        room_name: roomName,
        identity: identity,
        name: participantName || identity,
        role: role,
      });
      setToken(res.data.token);
      setIsConnected(true);
      setIsInInterview(true);
      setTimer(0);
      // Reset counters
      setEyeOffScreenCount(0);
      setShowEyeWarning(false);
      setTabSwitchCount(0);
      setShowWarning(false);
      isEndingRef.current = false;
      // Set detection ready after a cooldown (2 seconds) to avoid false triggers
      isDetectionReady.current = false;
      setTimeout(() => {
        isDetectionReady.current = true;
      }, 3000);
      alert('✅ You have joined the interview!');

      // 4. Start detection loop after video element is ready
      setTimeout(() => {
        if (videoRef.current && landmarker) {
          detectFaceAndEyes(landmarker);
        }
      }, 1500);
    } catch (err) {
      console.error('Join error:', err);
      alert('Could not join the interview. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // ---- End interview ----
  const handleEndInterview = async () => {
    if (isEndingRef.current) return; // prevent double execution
    isEndingRef.current = true;
    if (!window.confirm('Are you sure you want to end the interview?')) {
      isEndingRef.current = false;
      return;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (detectionFrameRef.current) cancelAnimationFrame(detectionFrameRef.current);
    if (faceLandmarker) {
      faceLandmarker.close();
      setFaceLandmarker(null);
    }
    setIsInInterview(false);
    setIsConnected(false);
    setToken(null);
    setTabSwitchCount(0);
    setShowWarning(false);
    setTimer(0);
    setEyeOffScreenCount(0);
    setShowEyeWarning(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(console.warn);
    }

    const scheduleId = selectedInterview?.id || selectedInterview?.schedule_id;

    if (role === 'interviewer') {
      try {
        await api.post('/interview/end-session/', {
          schedule_id: scheduleId,
          room_name: roomName,
        });
      } catch (err) {
        console.warn('Failed to notify end-session:', err);
      }
      setShowInterviewerFeedbackModal(true);
    } else {
      setShowCandidateWaitingModal(true);
    }
  };


  // ---- Toggle camera & mic ----
  const toggleCamera = () => {
    setIsCameraOn((prev) => {
      const nextState = !prev;
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = nextState;
      }
      return nextState;
    });
  };

  const toggleMic = () => {
    setIsMicOn((prev) => {
      const nextState = !prev;
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = nextState;
      }
      return nextState;
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ---- Render ----
  return (
    <div className="interview-container">
      <div className="interview-content">
        {showWarning && isInInterview && (
          <div className="warning-banner">
            <span>⚠️ Tab Switching Detected! ({tabSwitchCount}/{MAX_SWITCHES})</span>
            <button onClick={() => setShowWarning(false)}>✕</button>
          </div>
        )}
        {showEyeWarning && isInInterview && (
          <div className="warning-banner eye-warning">
            <span>👀 Looked away! ({eyeOffScreenCount}/{MAX_EYE_OFF + 2})</span>
            <button onClick={() => setShowEyeWarning(false)}>✕</button>
          </div>
        )}

        {isInInterview && (
          <div className="face-status-bar">
            <div className={`face-status ${isFaceVisible ? 'visible' : 'hidden'}`}>
              {isFaceVisible ? '✅ Face Detected' : '❌ Face Not Detected'}
            </div>
            <div className={`gaze-status ${gazeDirection}`}>
              {gazeDirection === 'center'
                ? '👁️ Looking at Screen'
                : `👁️ Looking ${gazeDirection}`}
            </div>
          </div>
        )}

        {!isInInterview ? (
          // ---- LOBBY ----
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0,
                }}
              >
                ← Back to Upcoming Interviews
              </button>
            )}
            <div className="main-grid">
            <div className="left-section">
              <div className="lobby-card">
                <div className="lobby-header">
                  <h3>Interview Lobby</h3>
                  <div className="live-badge">LIVE PREVIEW</div>
                </div>
                <div className="lobby-preview">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="video-element"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
              <div className="upcoming-card">
                <h3>Interview Session Details</h3>
                <div className="interview-details">
                  <div className="detail-item">
                    <span className="detail-label">Room / Session</span>
                    <span className="detail-value">{selectedInterview?.roomName || roomName || "room_101"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Candidate</span>
                    <span className="detail-value">
                      {selectedInterview?.candidate_name || selectedInterview?.candidate_username || selectedInterview?.candidate || (role === 'candidate' ? participantName : "Candidate")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Interviewer</span>
                    <span className="detail-value">
                      {selectedInterview?.interviewer_name || selectedInterview?.interviewer_username || selectedInterview?.interviewer || (role === 'interviewer' ? participantName : "Interviewer")}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Scheduled Time</span>
                    <span className="detail-value">
                      {selectedInterview?.date ? formatDate(selectedInterview.date) : "Today"},{" "}
                      {selectedInterview?.time ? formatTime12(selectedInterview.time) : "Live Session"} ({selectedInterview?.duration_minutes || 60} mins)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="right-section">
              <div className="ready-card">
                <h2>Ready to join?</h2>
                <p className="ready-subtitle">
                  Check your camera and microphone preview before joining the room.
                </p>
                <div className="device-settings">
                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">🎤</span>
                      <div>
                        <div className="device-name">Microphone</div>
                        <div className="device-detail">{micDeviceName}</div>
                      </div>
                    </div>
                    <div className="device-status excellent">✅ Ready</div>
                  </div>
                  <div className="device-item">
                    <div className="device-info">
                      <span className="device-icon">📷</span>
                      <div>
                        <div className="device-name">Camera</div>
                        <div className="device-detail">{cameraDeviceName}</div>
                      </div>
                    </div>
                    <div className="device-status">✅ Ready</div>
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleJoinInterview}
                    disabled={isJoining}
                  >
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
          </div>
        ) : (
          // ---- LIVE INTERVIEW FULLSCREEN OVERLAY ----
          <div className="livekit-fullscreen-overlay">
            <LiveKitRoom
              serverUrl={serverUrl}
              token={token}
              connect={isConnected}
              video={isCameraOn}
              audio={isMicOn}
              onDisconnected={() => {
                setIsConnected(false);
                if (isInInterview && !isEndingRef.current) {
                  handleEndInterview();
                }
              }}
              className="livekit-room-container"
            >
              <RoomAudioRenderer />
              <LiveVideo
                videoRef={videoRef}
                stream={localStreamRef.current}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                timer={timer}
                toggleCamera={toggleCamera}
                toggleMic={toggleMic}
                handleEndInterview={handleEndInterview}
                role={role}
                participantName={participantName}
                selectedInterview={selectedInterview}
              />
            </LiveKitRoom>
          </div>
        )}

        {showInterviewerFeedbackModal && (
          <InterviewerFeedbackModal
            schedule={selectedInterview}
            candidateName={selectedInterview?.candidate_name || selectedInterview?.candidate}
            onClose={() => setShowInterviewerFeedbackModal(false)}
            onSubmitSuccess={() => {
              setShowInterviewerFeedbackModal(false);
              if (onBack) onBack();
            }}
          />
        )}

        {showCandidateWaitingModal && (
          <CandidateWaitingModal
            scheduleId={selectedInterview?.id || selectedInterview?.schedule_id}
            onClose={() => {
              setShowCandidateWaitingModal(false);
              if (onBack) onBack();
            }}
          />
        )}
      </div>
    </div>
  );
};


export default InterviewPage;