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

<<<<<<< Updated upstream
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

  const hasRemoteVideo = remoteVideoTracks.length > 0;
  const remoteParticipants = participants.filter(
    (p) => p.identity !== localParticipant?.localParticipant?.identity
  );
  const hasRemoteParticipant = remoteParticipants.length > 0;

  // Debug logs (remove in production)
  console.log('🔍 LiveVideo Debug:');
  console.log('  Local identity:', localParticipant?.localParticipant?.identity);
  console.log('  All participants:', participants.map(p => p.identity));
  console.log('  Remote participants:', remoteParticipants.map(p => p.identity));
  console.log('  Remote video tracks count:', remoteVideoTracks.length);

=======
// ---- Local-only video (no LiveKit hooks) ----
const LocalOnlyVideo = ({ videoRef, stream, isCameraOn, isMicOn, timer, toggleCamera, toggleMic, handleEndInterview }) => {
>>>>>>> Stashed changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Play error:', e));
    }
  }, [videoRef, stream]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
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
        <div className="video-box interviewer-video">
<<<<<<< Updated upstream
          {hasRemoteVideo ? (
            remoteVideoTracks.map((track) => (
              <VideoTrack key={track.sid} trackRef={track} />
            ))
          ) : (
            <div className="video-placeholder">{placeholderMessage}</div>
          )}
=======
          <div className="placeholder-video"><span>👤 Interviewer</span><p>Waiting for connection…</p></div>
>>>>>>> Stashed changes
          <div className="video-label">👤 Interviewer</div>
          <div className="video-status online">⏳ Connecting</div>
        </div>
<<<<<<< Updated upstream

        {/* Candidate video (local preview) */}
=======
>>>>>>> Stashed changes
        <div className="video-box candidate-video">
          <video ref={videoRef} autoPlay playsInline muted className="video-element" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="video-label">👤 You</div>
        </div>
      </div>
      <div className="interview-info-overlay">
        <div className="footer-duration"><span>⏱️ Duration: {formatTime(timer)}</span></div>
        <div className="footer-controls">
          <button className={`control-btn ${isCameraOn ? 'active' : 'inactive'}`} onClick={toggleCamera}>{isCameraOn ? '📷 On' : '📷 Off'}</button>
          <button className={`control-btn ${isMicOn ? 'active' : 'inactive'}`} onClick={toggleMic}>{isMicOn ? '🎤 On' : '🎤 Off'}</button>
          <button className="control-btn end-call" onClick={handleEndInterview}>📞 End Call</button>
        </div>
        <div className="footer-secure"><span>🔒 Secure Connection</span></div>
      </div>
    </div>
  );
};

// ---- LiveKit video (uses hooks) ----
const LiveKitVideo = ({ videoRef, stream, isCameraOn, isMicOn, timer, toggleCamera, toggleMic, handleEndInterview }) => {
  const localParticipant = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone], { updateOnlyOn: ['participantJoined', 'trackSubscribed'] });
  const remoteTracks = tracks.filter(track => track.participant.identity !== localParticipant?.localParticipant?.identity);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.warn('Play error:', e));
    }
  }, [videoRef, stream]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-call-container">
      <div className="video-grid">
        <div className="video-box interviewer-video">
          {remoteTracks.length > 0 ? remoteTracks.map(track => <VideoTrack key={track.sid} trackRef={track} />) :
            <div className="placeholder-video"><span>👤 Interviewer</span><p>Waiting for interviewer…</p></div>}
          <div className="video-label">👤 Interviewer</div>
          <div className="video-status online">🟢 Online</div>
        </div>
        <div className="video-box candidate-video">
          <video ref={videoRef} autoPlay playsInline muted className="video-element" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div className="video-label">👤 You</div>
        </div>
      </div>
      <div className="interview-info-overlay">
        <div className="footer-duration"><span>⏱️ Duration: {formatTime(timer)}</span></div>
        <div className="footer-controls">
          <button className={`control-btn ${isCameraOn ? 'active' : 'inactive'}`} onClick={toggleCamera}>{isCameraOn ? '📷 On' : '📷 Off'}</button>
          <button className={`control-btn ${isMicOn ? 'active' : 'inactive'}`} onClick={toggleMic}>{isMicOn ? '🎤 On' : '🎤 Off'}</button>
          <button className="control-btn end-call" onClick={handleEndInterview}>📞 End Call</button>
        </div>
        <div className="footer-secure"><span>🔒 Secure Connection</span></div>
      </div>
    </div>
  );
};

// ---- Main InterviewPage ----
const InterviewPage = ({
  standalone = false,
  roomName: propRoomName,
  identity: propIdentity,
  participantName,
  role = 'participant',
}) => {
  const searchParams = new URLSearchParams(window.location.search);
  const queryRoom = searchParams.get('roomName');
  const queryIdentity = searchParams.get('identity');
  const roomName = propRoomName || queryRoom || 'demo-room';
  const identity = propIdentity || queryIdentity || `candidate-${Date.now()}`;

  const [token, setToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useLiveKit, setUseLiveKit] = useState(false);
  const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

  const [isJoining, setIsJoining] = useState(false);
  const [isInInterview, setIsInInterview] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [timer, setTimer] = useState(0);
  const timerInterval = useRef(null);

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const MAX_SWITCHES = 3;

  const [awayWarningsCount, setAwayWarningsCount] = useState(0);
  const [showAwayWarning, setShowAwayWarning] = useState(false);
  const MAX_AWAY_WARNINGS = 3;
  const AWAY_THRESHOLD_SECONDS = 5;
  const lookingAwayStartTime = useRef(null);
  const hasWarnedForCurrentAway = useRef(false);

  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [isFaceVisible, setIsFaceVisible] = useState(true);
  const [gazeDirection, setGazeDirection] = useState('center');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const localStreamRef = useRef(null);
  const detectionFrameRef = useRef(null);
  const isEndingRef = useRef(false); // to prevent multiple alerts
  const isDetectionReady = useRef(false); // cooldown flag

  useEffect(() => {
    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        localStreamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch (err) { console.warn('Preview camera not available:', err); }
    };
    startPreview();
    return () => { if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop()); };
  }, []);

  const initializeFaceLandmarker = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      setFaceLandmarker(landmarker);
      return landmarker;
    } catch (err) { console.error('MediaPipe init error:', err); return null; }
  };

  const drawLandmarks = (landmarks, canvas, video) => {
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#00FF00';
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 1;
    for (const lm of landmarks) {
      const x = lm.x * width;
      const y = lm.y * height;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

<<<<<<< Updated upstream
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
=======
  const detectFaceAndEyes = useCallback(async (landmarker) => {
    if (!videoRef.current || !landmarker || !isInInterview) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    try {
      const result = landmarker.detectForVideo(video, performance.now());
      let lookingAway = false;
      if (result.faceLandmarks && result.faceLandmarks.length > 0) {
        const landmarks = result.faceLandmarks[0];
        setIsFaceVisible(true);
        if (canvas) drawLandmarks(landmarks, canvas, video);
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
        lookingAway = direction !== 'center';
      } else {
        setIsFaceVisible(false);
        if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
        lookingAway = true;
      }

      if (lookingAway) {
        if (lookingAwayStartTime.current === null) lookingAwayStartTime.current = Date.now();
        const elapsed = (Date.now() - lookingAwayStartTime.current) / 1000;
        if (elapsed >= AWAY_THRESHOLD_SECONDS && !hasWarnedForCurrentAway.current) {
          setShowAwayWarning(true);
          setAwayWarningsCount(prev => {
            const newCount = prev + 1;
            if (newCount >= MAX_AWAY_WARNINGS) {
              alert(`🚫 You have looked away ${newCount} times. Interview terminated.`);
              handleEndInterview();
            }
            return newCount;
          });
          hasWarnedForCurrentAway.current = true;
>>>>>>> Stashed changes
        }
      } else {
        lookingAwayStartTime.current = null;
        hasWarnedForCurrentAway.current = false;
        setShowAwayWarning(false);
      }
<<<<<<< Updated upstream

      // Continue loop if still active
      if (isInInterview && !isEndingRef.current && faceLandmarker) {
        detectionFrameRef.current = requestAnimationFrame(() =>
          detectFaceAndEyes(faceLandmarker)
        );
      }
    },
    [isInInterview, faceLandmarker, showEyeWarning]
  );
=======
    } catch (err) { console.error('Detection error:', err); }
    if (isInInterview && faceLandmarker) {
      detectionFrameRef.current = requestAnimationFrame(() => detectFaceAndEyes(faceLandmarker));
    }
  }, [isInInterview, faceLandmarker]);
>>>>>>> Stashed changes

  useEffect(() => {
    if (isInInterview) {
      timerInterval.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else { clearInterval(timerInterval.current); }
    return () => clearInterval(timerInterval.current);
  }, [isInInterview]);

  useEffect(() => {
    if (!isInInterview) return;
    const handleVisibilityChange = () => {
<<<<<<< Updated upstream
      if (document.hidden && isInInterview && !isEndingRef.current) {
        setTabSwitchCount((prev) => {
=======
      if (document.hidden) {
        setTabSwitchCount(prev => {
>>>>>>> Stashed changes
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
    const handleContextMenu = e => e.preventDefault();
    const handleKeyDown = e => {
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) || e.key === 'F12') {
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

  const handleJoinInterview = async () => {
    setIsJoining(true);
    try {
<<<<<<< Updated upstream
      // 1. Start local camera
      const stream = await startLocalCamera();
      if (!stream) {
        setIsJoining(false);
        return;
=======
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
        localStreamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
>>>>>>> Stashed changes
      }
      const landmarker = await initializeFaceLandmarker();
      if (!landmarker) { setIsJoining(false); return; }

      try {
        const res = await api.post('/interview/livekit-token/', { room_name: roomName, identity, name: participantName || identity, role });
        setToken(res.data.token);
        setIsConnected(true);
        setUseLiveKit(true);
      } catch (tokenError) {
        console.warn('Token fetch failed, proceeding in local-only mode:', tokenError);
        setUseLiveKit(false);
      }
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
      setTimeout(() => {
<<<<<<< Updated upstream
        if (videoRef.current && landmarker) {
          detectFaceAndEyes(landmarker);
        }
      }, 1500);
=======
        if (videoRef.current && landmarker) detectFaceAndEyes(landmarker);
      }, 1000);
>>>>>>> Stashed changes
    } catch (err) {
      console.error('Join error:', err);
      alert('Could not join the interview. Please try again.');
    } finally { setIsJoining(false); }
  };

  const handleEndInterview = () => {
<<<<<<< Updated upstream
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
=======
    if (!window.confirm('Are you sure you want to end the interview?')) return;
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
>>>>>>> Stashed changes
    if (videoRef.current) videoRef.current.srcObject = null;
    if (detectionFrameRef.current) cancelAnimationFrame(detectionFrameRef.current);
    if (faceLandmarker) { faceLandmarker.close(); setFaceLandmarker(null); }
    setIsInInterview(false);
    setIsConnected(false);
    setUseLiveKit(false);
    setToken(null);
    setTabSwitchCount(0);
    setShowWarning(false);
    setTimer(0);
<<<<<<< Updated upstream
    setEyeOffScreenCount(0);
    setShowEyeWarning(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(console.warn);
    }
    alert('Interview ended.');
  };

  // ---- Toggle camera ----
=======
    setAwayWarningsCount(0);
    setShowAwayWarning(false);
    lookingAwayStartTime.current = null;
    hasWarnedForCurrentAway.current = false;
    document.exitFullscreen?.();
    alert('Interview ended.');
  };

>>>>>>> Stashed changes
  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isCameraOn;
    }
  };
<<<<<<< Updated upstream

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
=======
  const toggleMic = () => setIsMicOn(!isMicOn);
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
>>>>>>> Stashed changes
  };

  return (
    <div className="interview-container">
      <div className="interview-content">
        {showWarning && isInInterview && (
          <div style={{ background: 'red', color: 'white', padding: '10px', margin: '10px', borderRadius: '5px' }}>
            <span>⚠️ Tab Switching Detected! ({tabSwitchCount}/{MAX_SWITCHES})</span>
            <button onClick={() => setShowWarning(false)} style={{ marginLeft: '10px', background: 'white', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {showAwayWarning && isInInterview && (
          <div style={{ background: 'orange', color: 'black', padding: '10px', margin: '10px', borderRadius: '5px' }}>
            <span>👀 You have been looking away for more than {AWAY_THRESHOLD_SECONDS} seconds! (Warning {awayWarningsCount}/{MAX_AWAY_WARNINGS})</span>
            <button onClick={() => setShowAwayWarning(false)} style={{ marginLeft: '10px', background: 'white', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        {isInInterview && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '10px', background: '#f0f0f0' }}>
            <span>{isFaceVisible ? '✅ Face Detected' : '❌ Face Not Detected'}</span>
            <span>{gazeDirection === 'center' ? '👁️ Looking at Screen' : `👁️ Looking ${gazeDirection}`}</span>
          </div>
        )}
        {!isInInterview ? (
          <div className="main-grid">
            <div className="left-section">
              <div className="lobby-card">
                <div className="lobby-header"><h3>Interview Lobby</h3><div className="live-badge">LIVE PREVIEW</div></div>
                <div className="lobby-preview" style={{ position: 'relative' }}>
                  <video ref={videoRef} autoPlay playsInline muted className="video-element" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                </div>
              </div>
              <div className="upcoming-card">
                <h3>Upcoming Interview</h3>
                <div className="interview-details">
                  <div className="detail-item"><span className="detail-label">Position</span><span className="detail-value">Senior Product Designer</span></div>
                  <div className="detail-item"><span className="detail-label">Candidate</span><span className="detail-value">Alex Sterling</span></div>
                  <div className="detail-item"><span className="detail-label">Scheduled Time</span><span className="detail-value">2:00 PM – 3:00 PM</span></div>
                  <div className="detail-item"><span className="detail-label">Interviewers</span><span className="detail-value">Sarah Chen, Marcus Thorne</span></div>
                </div>
              </div>
            </div>
            <div className="right-section">
              <div className="ready-card">
                <h2>Ready to join?</h2>
                <p className="ready-subtitle">The interviewers are currently in the room waiting for you to enter.</p>
                <div className="device-settings">
                  <div className="device-item"><div className="device-info"><span className="device-icon">🎤</span><div><div className="device-name">Microphone</div><div className="device-detail">MacBook Pro Mic</div></div></div><div className="device-status excellent">✅ Ready</div></div>
                  <div className="device-item"><div className="device-info"><span className="device-icon">📷</span><div><div className="device-name">Camera</div><div className="device-detail">FaceTime HD Camera</div></div></div><div className="device-status">✅ Ready</div></div>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={handleJoinInterview} disabled={isJoining}>{isJoining ? 'Joining...' : '🚀 Join Interview'}</button>
                </div>
                <div className="security-badge"><span>🔒</span><span>End-to-end encrypted and secure</span></div>
              </div>
            </div>
          </div>
        ) : (
<<<<<<< Updated upstream
          // ---- LIVE INTERVIEW ----
          <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={isConnected}
            video={true}
            audio={true}
            onDisconnected={() => {
              setIsConnected(false);
              if (isInInterview && !isEndingRef.current) {
                handleEndInterview();
              }
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
=======
          useLiveKit && token ? (
            <LiveKitRoom serverUrl={serverUrl} token={token} connect={isConnected} video={true} audio={true} onDisconnected={() => { setIsConnected(false); if (isInInterview) handleEndInterview(); }} className="livekit-room-container">
              <LiveKitVideo videoRef={videoRef} stream={localStreamRef.current} isCameraOn={isCameraOn} isMicOn={isMicOn} timer={timer} toggleCamera={toggleCamera} toggleMic={toggleMic} handleEndInterview={handleEndInterview} />
            </LiveKitRoom>
          ) : (
            <LocalOnlyVideo videoRef={videoRef} stream={localStreamRef.current} isCameraOn={isCameraOn} isMicOn={isMicOn} timer={timer} toggleCamera={toggleCamera} toggleMic={toggleMic} handleEndInterview={handleEndInterview} />
          )
>>>>>>> Stashed changes
        )}
      </div>
    </div>
  );
};

export default InterviewPage;