import React from 'react';
import '../styles/InterviewFeedbackModal.css';

const FeedbackResultModal = ({ feedback, onClose }) => {
  if (!feedback) return null;

  const getRecommendationClass = (rec) => {
    switch (rec) {
      case 'Strongly Recommend':
        return 'strongly-recommend';
      case 'Recommend':
        return 'recommend';
      case 'Neutral':
        return 'neutral';
      case 'Do Not Recommend':
        return 'do-not-recommend';
      default:
        return 'recommend';
    }
  };

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal-card">
        <div className="feedback-modal-header">
          <div>
            <h3>🏆 Interview Assessment Result</h3>
            <p className="feedback-modal-subtitle">
              Detailed performance feedback and skill evaluation review
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '1.4rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div className="feedback-modal-body">
          <div className="result-score-badge">
            <div className="score-box">
              <div className="score-number">⭐ {feedback.overall_rating} / 5.0</div>
              <div className="score-title">Overall Score</div>
            </div>
            <div className="score-box">
              <span className={`recommendation-tag ${getRecommendationClass(feedback.recommendation)}`}>
                {feedback.recommendation}
              </span>
              <div className="score-title" style={{ marginTop: '6px' }}>Recommendation</div>
            </div>
          </div>

          <div className="rating-section">
            <div className="rating-row">
              <span className="rating-label">Technical Competency</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{feedback.technical_skills} / 5 ★</span>
            </div>
            <div className="rating-row">
              <span className="rating-label">Communication & Clarity</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{feedback.communication_skills} / 5 ★</span>
            </div>
            <div className="rating-row">
              <span className="rating-label">Problem Solving & Logic</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{feedback.problem_solving} / 5 ★</span>
            </div>
            <div className="rating-row">
              <span className="rating-label">Soft Skills & Professionalism</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{feedback.soft_skills} / 5 ★</span>
            </div>
            <div className="rating-row">
              <span className="rating-label">Code Quality & Architecture</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{feedback.code_quality} / 5 ★</span>
            </div>
          </div>

          {feedback.strengths && (
            <div className="feedback-field">
              <label>Key Strengths</label>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155' }}>
                {feedback.strengths}
              </div>
            </div>
          )}

          {feedback.weaknesses && (
            <div className="feedback-field">
              <label>Areas for Improvement</label>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155' }}>
                {feedback.weaknesses}
              </div>
            </div>
          )}

          {feedback.comments && (
            <div className="feedback-field">
              <label>Interviewer Comments</label>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155' }}>
                {feedback.comments}
              </div>
            </div>
          )}
        </div>

        <div className="feedback-modal-footer">
          <button
            type="button"
            className="btn-submit-feedback"
            onClick={onClose}
          >
            Close Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackResultModal;
