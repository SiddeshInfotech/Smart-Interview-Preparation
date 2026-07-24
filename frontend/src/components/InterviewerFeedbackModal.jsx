import React, { useState } from 'react';
import api from '../api/axios';
import '../styles/InterviewFeedbackModal.css';

const StarRating = ({ value, onChange, label }) => {
  return (
    <div className="rating-row">
      <span className="rating-label">{label}</span>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            className={`star-btn ${star <= value ? 'filled' : ''}`}
            onClick={() => onChange(star)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

const InterviewerFeedbackModal = ({ schedule, candidateName, onClose, onSubmitSuccess }) => {
  const [technicalSkills, setTechnicalSkills] = useState(4);
  const [communicationSkills, setCommunicationSkills] = useState(4);
  const [problemSolving, setProblemSolving] = useState(4);
  const [softSkills, setSoftSkills] = useState(4);
  const [codeQuality, setCodeQuality] = useState(4);
  const [recommendation, setRecommendation] = useState('Recommend');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const calculateOverallRating = () => {
    const avg = (technicalSkills + communicationSkills + problemSolving + softSkills + codeQuality) / 5;
    return avg.toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const overall = calculateOverallRating();
      const payload = {
        schedule_id: schedule?.id || schedule?.schedule_id,
        candidate: schedule?.candidate_id || schedule?.candidate,
        interviewer: schedule?.interviewer_id || schedule?.interviewer,
        technical_skills: technicalSkills,
        communication_skills: communicationSkills,
        problem_solving: problemSolving,
        soft_skills: softSkills,
        code_quality: codeQuality,
        overall_rating: overall,
        strengths: strengths,
        weaknesses: weaknesses,
        comments: comments,
        recommendation: recommendation,
      };

      await api.post('/interview/submit-feedback/', payload);
      alert('✅ Candidate Interview Feedback submitted successfully!');
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit interview feedback: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal-card">
        <div className="feedback-modal-header">
          <div>
            <h3>📋 Candidate Assessment Review</h3>
            <p className="feedback-modal-subtitle">
              Evaluating candidate: <strong>{candidateName || schedule?.candidate_name || 'Candidate'}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="feedback-modal-body">
          <div className="rating-section">
            <StarRating
              label="Technical Competency"
              value={technicalSkills}
              onChange={setTechnicalSkills}
            />
            <StarRating
              label="Communication & Clarity"
              value={communicationSkills}
              onChange={setCommunicationSkills}
            />
            <StarRating
              label="Problem Solving & Logic"
              value={problemSolving}
              onChange={setProblemSolving}
            />
            <StarRating
              label="Soft Skills & Professionalism"
              value={softSkills}
              onChange={setSoftSkills}
            />
            <StarRating
              label="Code Quality & Architecture"
              value={codeQuality}
              onChange={setCodeQuality}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e0f2fe', padding: '12px 16px', borderRadius: '8px' }}>
            <span style={{ fontWeight: '700', color: '#0369a1' }}>Calculated Overall Score:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0284c7' }}>
              ⭐ {calculateOverallRating()} / 5.0
            </span>
          </div>

          <div className="feedback-field">
            <label>Key Strengths</label>
            <textarea
              placeholder="Highlight candidate's technical and interpersonal strengths..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
            />
          </div>

          <div className="feedback-field">
            <label>Areas for Improvement / Weaknesses</label>
            <textarea
              placeholder="Note areas where candidate can improve..."
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              rows={2}
            />
          </div>

          <div className="feedback-field">
            <label>Detailed Comments & Feedback</label>
            <textarea
              placeholder="Detailed summary feedback..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          <div className="feedback-field">
            <label>Final Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            >
              <option value="Strongly Recommend">🌟 Strongly Recommend</option>
              <option value="Recommend">👍 Recommend</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Do Not Recommend">👎 Do Not Recommend</option>
            </select>
          </div>

          <div className="feedback-modal-footer">
            <button
              type="submit"
              className="btn-submit-feedback"
              disabled={submitting}
            >
              {submitting ? 'Submitting Feedback...' : '✨ Submit Interview Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewerFeedbackModal;
