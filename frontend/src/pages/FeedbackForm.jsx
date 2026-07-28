import React, { useState } from "react";
import { 
  CheckCircle2, 
  Sparkles, 
  User, 
  Mail, 
  Smile, 
  Video, 
  Lightbulb, 
  ThumbsUp, 
  MessageSquare,
  Send,
  ShieldCheck,
  Zap,
  Award
} from "lucide-react";
import "../styles/FeedbackForm.css";
import { submitFeedback } from "../api/feedbackAPI";

const RATING_OPTIONS = [
  { label: "Excellent", emoji: "🌟", color: "#10b981", bg: "#dcfce7" },
  { label: "Good", emoji: "👍", color: "#3b82f6", bg: "#dbeafe" },
  { label: "Average", emoji: "😐", color: "#f59e0b", bg: "#fef3c7" },
  { label: "Poor", emoji: "🙁", color: "#ef4444", bg: "#fee2e2" }
];

const FeedbackForm = () => { 

  const [feedback, setFeedback] = useState({ 
    name: "",
    email: "",
    overall_experience: "",
    mock_interview: "",
    suggestions: "",
    recommend: "",
    recommendation_reason: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e) => {
    setFeedback({
      ...feedback,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectOption = (name, value) => {
    setFeedback({
      ...feedback,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      const response = await submitFeedback(feedback);
      console.log("Feedback Response:", response.data);

      setFeedback({
        name: "",
        email: "",
        overall_experience: "",
        mock_interview: "",
        suggestions: "",
        recommend: "",
        recommendation_reason: ""
      });

      setShowSuccessPopup(true);
    } catch (error) {
      console.log(
        "Feedback Error:",
        error.response?.data || error.message
      );
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-page">
      {/* Background Ambient Glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      <div className="feedback-container">

        <div className="feedback-header">
          <div className="feedback-badge-pill">
            <Sparkles size={14} /> Candidate Voice & Insights
          </div>
          <h1>
            <span className="feedback-gradient-title">Portal Feedback</span>
          </h1>
          <p>
            Share your experience with PrepMaster AI and help us shape the future of smart interview preparation.
          </p>
          <div className="feedback-header-line" />
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          {/* Two column fields */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <User size={16} className="label-icon" /> Full Name
              </label>
              <div className="input-with-icon">
                <input
                  type="text"
                  name="name"
                  value={feedback.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} className="label-icon" /> Email Address
              </label>
              <div className="input-with-icon">
                <input
                  type="email"
                  name="email"
                  value={feedback.email}
                  onChange={handleChange}
                  placeholder="e.g. alex@example.com"
                />
              </div>
            </div>
          </div>

          {/* Rating Option Cards */}
          <div className="form-group">
            <label>
              <Smile size={16} className="label-icon" /> Overall Platform Experience
            </label>
            <div className="rating-pills-grid">
              {RATING_OPTIONS.map((opt) => {
                const isSelected = feedback.overall_experience === opt.label;
                return (
                  <button
                    type="button"
                    key={opt.label}
                    className={`rating-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption("overall_experience", opt.label)}
                  >
                    <span className="pill-emoji">{opt.emoji}</span>
                    <span className="pill-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side by side Text Areas on Wide Desktop */}
          <div className="form-row form-row-2col">
            <div className="form-group">
              <label>
                <Video size={16} className="label-icon" /> Mock Interview & Code Arena Experience
              </label>
              <textarea
                name="mock_interview"
                value={feedback.mock_interview}
                onChange={handleChange}
                placeholder="Tell us how the mock interviews, AI feedback, or live code arena worked for you..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>
                <Lightbulb size={16} className="label-icon" /> Ideas & Suggestions for Improvement
              </label>
              <textarea
                name="suggestions"
                value={feedback.suggestions}
                onChange={handleChange}
                placeholder="What features or tools would make your preparation even more effective?"
                rows="4"
              />
            </div>
          </div>

          {/* Recommendation Options */}
          <div className="form-group">
            <label>
              <ThumbsUp size={16} className="label-icon" /> Would you recommend PrepMaster AI to candidates?
            </label>
            <div className="recommend-cards-row">
              <button
                type="button"
                className={`recommend-card ${feedback.recommend === "Yes" ? 'selected-yes' : ''}`}
                onClick={() => handleSelectOption("recommend", "Yes")}
              >
                <span className="rec-icon">🚀</span>
                <div>
                  <strong>Yes, Absolutely!</strong>
                  <span>I'd recommend it to peers</span>
                </div>
              </button>

              <button
                type="button"
                className={`recommend-card ${feedback.recommend === "No" ? 'selected-no' : ''}`}
                onClick={() => handleSelectOption("recommend", "No")}
              >
                <span className="rec-icon">🤔</span>
                <div>
                  <strong>Needs Improvement</strong>
                  <span>I have specific feedback</span>
                </div>
              </button>
            </div>
          </div>

          {/* Recommendation Reason */}
          {feedback.recommend && (
            <div className="form-group animated-field">
              <label>
                <MessageSquare size={16} className="label-icon" />
                {feedback.recommend === "Yes"
                  ? "What stood out most to you?"
                  : "What can we do to make it better?"}
              </label>
              <textarea
                name="recommendation_reason"
                value={feedback.recommendation_reason}
                onChange={handleChange}
                placeholder={
                  feedback.recommend === "Yes"
                    ? "Share why you'd recommend PrepMaster AI..."
                    : "Let us know how we can earn your recommendation..."
                }
                rows="3"
              />
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`submit-btn ${submitting ? 'submitting' : ''}`}
            disabled={submitting}
          >
            {submitting ? (
              <span className="feedback-loading-wrapper">
                <span className="feedback-spinner" /> Submitting Feedback...
              </span>
            ) : (
              <span className="submit-content">
                <Send size={18} /> Submit Feedback
              </span>
            )}
          </button>
        </form>

        {/* Trust & Guarantee Bar */}
        <div className="feedback-trust-bar">
          <div className="trust-item">
            <Zap size={15} /> Quick 1-Min Feedback
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <ShieldCheck size={15} /> Encrypted & Confidential
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <Award size={15} /> Powering Candidate Success
          </div>
        </div>

      </div>

      {/* SUCCESS POPUP MODAL */}
      {showSuccessPopup && (
        <div className="feedback-popup-overlay" onClick={() => setShowSuccessPopup(false)}>
          <div className="feedback-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon-wrapper">
              <CheckCircle2 size={40} color="#10b981" />
            </div>
            <h3>Feedback Submitted!</h3>
            <p>Thank you for taking the time to share your feedback with PrepMaster AI. Your insights help us continuously improve our portal!</p>
            <button className="popup-close-btn" onClick={() => setShowSuccessPopup(false)}>
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );

};

export default FeedbackForm;
