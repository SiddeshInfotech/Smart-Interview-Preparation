import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import api from "../api/authAPI";
import "../styles/QuizResult.css";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;

  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const {
  correct = 0,
  wrong = 0,
  skipped = 0,
  score = 0,
  percentage = 0,
  passed = false,
  total = 0,
  questions = [],
  answers = [],
} = results || {};
const saveCalled = useRef(false);
useEffect(() => {
  if (!results || saveCalled.current) return;

  saveCalled.current = true;
  console.log("SAVE RESULT EFFECT RUN");


  const saveResult = async () => {
    try {
      await api.post("/quiz/save-result/", {
        total_questions: total,
        correct_answers: correct,
        wrong_answers: wrong,
        skipped_answers: skipped,
        score: percentage,
      });

      console.log("Quiz result saved successfully.");
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  saveResult();
}, [results, total, correct, wrong, skipped, percentage]);

  if (!results) {
    return (
      <div className="score-container">
        <div className="score-content">
          <div className="quiz-header">
            <h1 className="quiz-title">No Results Found</h1>
            <p className="quiz-subtitle">Please complete a quiz first.</p>
            <button className="analysis-btn" onClick={() => navigate('/quiz')} style={{ marginTop: '20px' }}>
              Go to Quiz Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="score-container">
      <div className="score-content">
        {/* Quiz Header */}
        <div className="quiz-header">
          <h1 className="quiz-title">PrepMaster AI</h1>
          <div className="quiz-subtitle">
            {passed ? '🎉 Congratulations! You passed the quiz!' : '💪 Great effort! Keep practicing to improve.'}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card animate-correct">
            <div className="stat-label">{correct}</div>
            <div className="stat-description">✅ Correct Answers</div>
          </div>
          <div className="stat-card animate-wrong">
            <div className="stat-label">{wrong}</div>
            <div className="stat-description">❌ Wrong Answers</div>
          </div>
          <div className="stat-card animate-score">
            <div className="stat-label">{percentage.toFixed(0)}%</div>
            <div className="stat-description">📊 Score</div>
          </div>
        </div>

        {/* Question Summary */}
        <div className="question-summary">
          <h2 className="summary-title">Question Summary</h2>
          <p className="summary-subtitle">Review your answers and see the correct ones.</p>
        </div>

        {/* Questions List */}
        <div className="questions-container">
          <div className="questions-list">
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isSkipped = userAns === null || userAns === -1;
              const selectedOptionIndex = userAns !== null && userAns !== -1 ? userAns : null;
              const isCorrect = userAns === q.correct;

              return (
                <div key={idx} className="question-card">
                  <div className="question-header">
                    <div className="question-number">Question {idx + 1}</div>
                    <div className="question-text">{q.question}</div>
                  </div>

                  {/* Options – show correct in green, user's wrong in red */}
                  <div className="options-grid">
                    {q.options.map((opt, optIdx) => {
                      const isCorrectOption = optIdx === q.correct;
                      const isSelected = selectedOptionIndex === optIdx;

                      let className = 'option-item';
                      // Correct option always gets green
                      if (isCorrectOption) {
                        className += ' correct-option';
                      }
                      // If user selected a wrong option, it gets red
                      if (isSelected && !isCorrect) {
                        className += ' wrong-option';
                      }

                      return (
                        <div key={optIdx} className={className}>
                          {optionLabels[optIdx]}. {opt}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats & Result */}
                  <div className="question-footer">
                    {isSkipped ? (
                      <div className="result-indicator skipped-result">⏭️ Skipped</div>
                    ) : isCorrect ? (
                      <div className="result-indicator correct-result">✅ Correct</div>
                    ) : (
                      <div className="result-indicator wrong-result">❌ Wrong</div>
                    )}
                    <div className="correct-option-text">
                      Correct Option: <strong>{optionLabels[q.correct]}</strong>
                    </div>
                  </div>

                  {!isSkipped && (
                    <div className="explanation-box">
                      <strong>💡 Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Analysis Button */}
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
                  <span className="analysis-value">{total}</span>
                </div>
                <div className="analysis-item fade-in delay-1">
                  <span className="analysis-label">Correct Rate</span>
                  <span className="analysis-value">{((correct / total) * 100).toFixed(0)}%</span>
                </div>
                <div className="analysis-item fade-in delay-2">
                  <span className="analysis-label">Wrong Rate</span>
                  <span className="analysis-value">{((wrong / total) * 100).toFixed(0)}%</span>
                </div>
                <div className="analysis-item fade-in delay-3">
                  <span className="analysis-label">Skipped</span>
                  <span className="analysis-value">{skipped}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="analysis-btn" onClick={() => navigate('/quiz')} style={{ background: '#64748b', boxShadow: 'none' }}>
            🔄 Retry Quiz
          </button>
          <button className="analysis-btn" onClick={() => navigate('/dashboard')}>
            🏠 Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;