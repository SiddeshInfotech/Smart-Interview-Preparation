// ScorePage.jsx
import React, { useState } from 'react';
import "../styles/ScorePage.css";

const ScorePage = () => {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  return (
    <div className="score-container">
      <div className="score-content">
        {/* Quiz Header */}
        <div className="quiz-header">
          <h1 className="quiz-title">PrepMaster AI</h1>
          <div className="quiz-subtitle">Quiz Completed! Great effort! Here's how everyone performed.</div>
        </div>

        {/* Statistics Cards - Only 3 with text only */}
        <div className="stats-grid">
          <div className="stat-card animate-correct">
            <div className="stat-label">Correct Answers</div>
            <div className="stat-description">Correct answers</div>
          </div>
          <div className="stat-card animate-wrong">
            <div className="stat-label">Wrong Answers</div>
            <div className="stat-description">Wrong answers</div>
          </div>
          <div className="stat-card animate-score">
            <div className="stat-label">Quiz Score (Avg.)</div>
            <div className="stat-description">Average Score</div>
          </div>
        </div>

        {/* Question Summary */}
        <div className="question-summary">
          <h2 className="summary-title">Question Summary</h2>
          <p className="summary-subtitle">See how participants answered each question.</p>
        </div>

        {/* Single Question Block - Only Question 1 */}
        <div className="questions-container">
          <div className="questions-list">
            {/* Question 1 */}
            <div className="question-card">
              <div className="question-header">
                <div className="question-number">Question 1</div>
                <div className="question-text">Question text here</div>
              </div>
              <div className="options-grid">
                <div className="option-item">A Option A</div>
                <div className="option-item correct-option">B Option B ✓</div>
                <div className="option-item">C Option C</div>
                <div className="option-item">D Option D</div>
              </div>
              <div className="question-stats-mini">
                <div className="stat-badge-mini correct-mini">
                  <span>✅ Correct</span>
                  <span>19 (76%)</span>
                </div>
                <div className="stat-badge-mini wrong-mini">
                  <span>❌ Wrong</span>
                  <span>6 (24%)</span>
                </div>
              </div>
              <div className="question-footer">
                <div className="result-indicator correct-result">✅ Correct</div>
                <div className="correct-option-text">Correct Option: <strong>B</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* View Detailed Analysis Button */}
        <div className="analysis-section">
          <button 
            className="analysis-btn"
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
          >
            {showDetailedAnalysis ? 'Hide Detailed Analysis' : 'View Detailed Analysis'}
          </button>

          {showDetailedAnalysis && (
            <div className="detailed-analysis slide-up">
              <h3>Detailed Performance Analysis</h3>
              <div className="analysis-grid">
                <div className="analysis-item fade-in">
                  <span className="analysis-label">Total Questions</span>
                  <span className="analysis-value">1</span>
                </div>
                <div className="analysis-item fade-in delay-1">
                  <span className="analysis-label">Correct Rate</span>
                  <span className="analysis-value">76%</span>
                </div>
                <div className="analysis-item fade-in delay-2">
                  <span className="analysis-label">Wrong Rate</span>
                  <span className="analysis-value">24%</span>
                </div>
                <div className="analysis-item fade-in delay-3">
                  <span className="analysis-label">Performance</span>
                  <span className="analysis-value">👍 Good</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorePage;