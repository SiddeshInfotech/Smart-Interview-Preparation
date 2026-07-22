// src/pages/InterviewPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import api from '../api/axios';
import '../styles/InterviewPage.css';

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
}) => {
  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.Microphone],
    { updateOnlyOn: ['participantJoined', 'trackSubscribed'] }
  );

  // Filter for remote video tracks
  const remoteVideoTracks = tracks.filter(
    (track) =>
      track.participant.identity !== localParticipant?.localParticipant?.identity &&
      track.source === Track.Source.Camera
  );

  // Remote participants (excluding local)
  const remoteParticipants = participants.filter(
    (p) => p.identity !== localParticipant?.localParticipant?.identity
  );

  const hasRemoteVideo = remoteVideoTracks.length > 0;
  const hasRemoteParticipant = remoteParticipants.length > 0;

  // ---- Debug logs (remove in production) ----
  console.log('🔍 LiveVideo Debug:');
  console.log('  Local identity:', localParticipant?.localParticipant?.identity);
  console.log('  All participants:', participants.map(p => p.identity));
  console.log('  Remote participants:', remoteParticipants.map(p => p.identity));
  console.log('  Remote video tracks count:', remoteVideoTracks.length);

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
        {/* Interviewer video (remote) */}
        <div className="video-box interviewer-video">
          {hasRemoteVideo ? (
            remoteVideoTracks.map((track) => (
              <VideoTrack key={track.sid} trackRef={track} />
            ))
          ) : (
            <div className="video-placeholder">
              {placeholderMessage}
            </div>
          )}
          <div className="video-label">👤 Interviewer</div>
          <div className="video-status online">🟢 Online</div>
        </div>

        {/* Candidate video (local preview) */}
        <div className="video-box candidate-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="video-element"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="video-label">👤 You</div>
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
            onClick={toggleCamera}
          >
            {isCameraOn ? '📷 On' : '📷 Off'}
          </button>
          <button
            className={`control-btn ${isMicOn ? 'active' : 'inactive'}`}
            onClick={toggleMic}
          >
            {isMicOn ? '🎤 On' : '🎤 Off'}
          </button>
          <button className="control-btn end-call" onClick={handleEndInterview}>
            📞 End Call
          </button>
        </div>
        <div className="footer-secure">
          <span>🔒 Secure Connection</span>
        </div>
      </div>
    </div>
  );
};

// ---- Main InterviewPage component ----
const InterviewPage = ({
  standalone = false,
  roomName,
  identity,
  participantName,
  role = 'participant',
}) => {
  // ---- LiveKit states ----
  const [token, setToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  // ---- UI states ----
  const [isJoining, setIsJoining] = useState(false);
  const [isInInterview, setIsInInterview] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);

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
      if (!videoRef.current || !landmarker || !isInInterview) return;
      const video = videoRef.current;
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
            setEyeOffScreenCount((prev) => {
              const newCount = prev + 1;
              if (newCount >= MAX_EYE_OFF && !showEyeWarning) {
                setShowEyeWarning(true);
                alert(`⚠️ You looked away! (${newCount}/${MAX_EYE_OFF})`);
                if (newCount >= MAX_EYE_OFF + 2) {
                  alert('🚫 Interview terminated for looking away.');
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
          setIsFaceVisible(false);
          setEyeOffScreenCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= MAX_EYE_OFF && !showEyeWarning) {
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
      } catch (err) {
        console.error('Detection error:', err);
      }
      if (isInInterview && faceLandmarker) {
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
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          setShowWarning(true);
          alert(`⚠️ Tab switch! (${newCount}/${MAX_SWITCHES})`);
          if (newCount >= MAX_SWITCHES) {
            alert('🚫 Interview terminated due to tab switches.');
            handleEndInterview();
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
        alert('❌ Action disabled during interview.');
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

  // ---- Join interview ----
  const handleJoinInterview = async () => {
    if (!roomName || !identity) {
      alert('Missing room or identity information.');
      return;
    }
    setIsJoining(true);
    try {
      // 1. Start local camera (stream stored in localStreamRef)
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
      alert('✅ You have joined the interview!');

      // 4. Start detection loop after video element is ready
      setTimeout(() => {
        if (videoRef.current && landmarker) {
          detectFaceAndEyes(landmarker);
        }
      }, 1000);
    } catch (err) {
      console.error('Join error:', err);
      alert('Could not join the interview. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // ---- End interview ----
  const handleEndInterview = () => {
    if (!window.confirm('Are you sure you want to end the interview?')) return;
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
    // Only exit fullscreen if actually in fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(console.warn);
    }
    alert('Interview ended.');
  };

  // ---- Toggle camera (affects preview and LiveKit) ----
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isCameraOn;
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    // The child component will handle the LiveKit track
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
        ) : (
          // ---- LIVE INTERVIEW ----
          <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={isConnected}
            video={true}
            audio={true}
            onDisconnected={() => {
              setIsConnected(false);
              if (isInInterview) handleEndInterview();
            }}
            className="livekit-room-container"
          >
            <LiveVideo
              videoRef={videoRef}
              stream={localStreamRef.current}
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              timer={timer}
              toggleCamera={toggleCamera}
              toggleMic={toggleMic}
              handleEndInterview={handleEndInterview}
            />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;