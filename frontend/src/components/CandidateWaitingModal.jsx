import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import FeedbackResultModal from './FeedbackResultModal';
import '../styles/InterviewFeedbackModal.css';

const CandidateWaitingModal = ({ scheduleId, onClose }) => {
  const [hasFeedback, setHasFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFeedbackStatus = async () => {
    if (!scheduleId) return;
    try {
      const res = await api.get(`/interview/feedback/${scheduleId}/`);
      if (res.data.has_feedback && res.data.feedback) {
        setHasFeedback(true);
        setFeedbackData(res.data.feedback);
      }
    } catch (err) {
      console.warn('Failed to check feedback status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFeedbackStatus();
    // Poll every 4 seconds for interviewer submission
    const interval = setInterval(checkFeedbackStatus, 4000);
    return () => clearInterval(interval);
  }, [scheduleId]);

  if (showResultModal && feedbackData) {
    return (
      <FeedbackResultModal
        feedback={feedbackData}
        onClose={() => {
          setShowResultModal(false);
          if (onClose) onClose();
        }}
      />
    );
  }

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal-card candidate-waiting-card">
        {!hasFeedback ? (
          <div>
            <div className="waiting-pulse-icon">⏳</div>
            <h3 className="waiting-title">Interview Completed</h3>
            <p className="waiting-msg">
              Waiting for interviewer to assess candidate interview skills. Please wait while your detailed feedback review is submitted...
            </p>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              🔄 Status auto-updates in real-time...
            </div>
          </div>
        ) : (
          <div>
            <div className="waiting-pulse-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', animation: 'none' }}>
              ✨
            </div>
            <h3 className="waiting-title">Feedback Assessment Ready!</h3>
            <p className="waiting-msg">
              Your interviewer has completed evaluating your performance and submitted detailed interview feedback.
            </p>
            <button
              className="btn-view-result"
              onClick={() => setShowResultModal(true)}
            >
              📊 View Result
            </button>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Close window
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateWaitingModal;
