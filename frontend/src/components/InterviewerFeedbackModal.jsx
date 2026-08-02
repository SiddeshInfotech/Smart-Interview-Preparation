import React, { useState } from 'react';
import {
  ClipboardCheck,
  UserCheck,
  Star,
  Award,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  X,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import api from '../api/axios';
import '../styles/InterviewFeedbackModal.css';

const StarRating = ({ value, onChange, label }) => {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="rating-row">
      <span className="rating-label">{label}</span>
      <div className="star-rating-container">
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverValue || value);
            return (
              <button
                type="button"
                key={star}
                className={`star-btn ${isFilled ? 'filled' : ''}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHoverValue(star)}
                onMouseLeave={() => setHoverValue(0)}
                title={`${star} / 5`}
              >
                <Star
                  size={20}
                  fill={isFilled ? '#f59e0b' : 'none'}
                  color={isFilled ? '#f59e0b' : '#cbd5e1'}
                />
              </button>
            );
          })}
        </div>
        <span className="rating-score-pill">{value} / 5</span>
      </div>
    </div>
  );
};

const InterviewerFeedbackModal = ({ schedule, candidateName, onClose, onSubmitSuccess }) => {
  const [technicalSkills, setTechnicalSkills] = useState(4);
  const [communicationSkills, setCommunicationSkills] = useState(4);
  const [problemSolving, setProblemSolving] = useState(4);
  const [softSkills, setSoftSkills] = useState(4);
  const [recommendation, setRecommendation] = useState('Recommend');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const calculateOverallRating = () => {
    const avg = (technicalSkills + communicationSkills + problemSolving + softSkills) / 4;
    return avg.toFixed(1);
  };

  const overallScore = calculateOverallRating();

  const getScoreGrade = (scoreStr) => {
    const num = parseFloat(scoreStr);
    if (num >= 4.5) return { text: 'Outstanding', color: '#15803d', bg: '#dcfce7' };
    if (num >= 3.8) return { text: 'Good Candidate', color: '#0369a1', bg: '#e0f2fe' };
    if (num >= 3.0) return { text: 'Average', color: '#b45309', bg: '#fef3c7' };
    return { text: 'Needs Improvement', color: '#b91c1c', bg: '#fee2e2' };
  };

  const grade = getScoreGrade(overallScore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        schedule_id: schedule?.id || schedule?.schedule_id,
        candidate: schedule?.candidate_id || schedule?.candidate,
        interviewer: schedule?.interviewer_id || schedule?.interviewer,
        technical_skills: technicalSkills,
        communication_skills: communicationSkills,
        problem_solving: problemSolving,
        soft_skills: softSkills,
        overall_rating: overallScore,
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
        {/* HEADER */}
        <div className="feedback-modal-header">
          <div className="header-title-group">
            <div className="header-icon-badge">
              <ClipboardCheck size={22} color="#ffffff" />
            </div>
            <div>
              <h3>Candidate Assessment Review</h3>
              <p className="feedback-modal-subtitle">
                <UserCheck size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Evaluating Candidate: <strong>{candidateName || schedule?.candidate_name || 'Candidate'}</strong>
              </p>
            </div>
          </div>
          {onClose && (
            <button type="button" className="close-modal-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          )}
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="feedback-modal-body">
          {/* RATINGS SECTION */}
          <div className="rating-section">
            <h4 className="section-title">
              <Award size={16} color="#2563eb" /> Skill Assessments
            </h4>
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
          </div>

          {/* OVERALL SCORE BANNER */}
          <div className="overall-score-banner">
            <div className="score-banner-left">
              <Sparkles size={20} color="#2563eb" />
              <span className="score-banner-label">Overall Calculated Score:</span>
            </div>
            <div className="score-banner-right">
              <span className="grade-pill" style={{ background: grade.bg, color: grade.color }}>
                {grade.text}
              </span>
              <span className="score-value">
                ⭐ {overallScore} <span className="score-max">/ 5.0</span>
              </span>
            </div>
          </div>

          {/* STRENGTHS */}
          <div className="feedback-field">
            <label className="field-label">
              <TrendingUp size={15} color="#16a34a" /> Key Strengths
            </label>
            <textarea
              className="feedback-textarea"
              placeholder="Highlight candidate's technical capabilities, problem-solving skills, and interpersonal strengths..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
            />
          </div>

          {/* WEAKNESSES */}
          <div className="feedback-field">
            <label className="field-label">
              <TrendingDown size={15} color="#dc2626" /> Areas for Improvement / Weaknesses
            </label>
            <textarea
              className="feedback-textarea"
              placeholder="Note specific areas, edge cases, or concepts where the candidate can improve..."
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              rows={2}
            />
          </div>

          {/* COMMENTS */}
          <div className="feedback-field">
            <label className="field-label">
              <MessageSquare size={15} color="#2563eb" /> Detailed Comments &amp; Assessment Summary
            </label>
            <textarea
              className="feedback-textarea"
              placeholder="Comprehensive summary notes for the hiring team..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* RECOMMENDATION */}
          <div className="feedback-field">
            <label className="field-label">
              <ThumbsUp size={15} color="#2563eb" /> Final Recommendation
            </label>
            <select
              className="feedback-select"
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            >
              <option value="Strongly Recommend">🌟 Strongly Recommend</option>
              <option value="Recommend">👍 Recommend</option>
              <option value="Neutral">😐 Neutral</option>
              <option value="Do Not Recommend">👎 Do Not Recommend</option>
            </select>
          </div>

          {/* FOOTER */}
          <div className="feedback-modal-footer">
            {onClose && (
              <button
                type="button"
                className="btn-cancel-feedback"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-submit-feedback"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="feedback-spinner"></span> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} /> Submit Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewerFeedbackModal;
