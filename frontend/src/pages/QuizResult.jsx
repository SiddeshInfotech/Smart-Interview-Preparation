import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/QuizResult.css";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results;

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

  const {
    correct,
    wrong,
    skipped,
    score,
    percentage,
    passed,
    total,
    questions,
    answers,
    isUnitQuiz,
    moduleId,
    courseId,
    unitTitle,
    courseTitle,
    domainId,
  } = results;

  const optionLabels = ['A', 'B', 'C', 'D'];

  const handleBackToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { state: { domainId } });
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="score-container">
      <div className="score-content">
        {/* Quiz Header */}
        <div className="quiz-header">
          <div className={`quiz-badge ${passed ? 'passed' : 'needs-practice'}`}>
            {passed ? 'UNIT COMPLETED' : 'NEEDS PRACTICE'}
          </div>
          <h1 className="quiz-title">
            {isUnitQuiz ? `Unit Quiz: ${unitTitle || 'Study Material'}` : 'Quiz Results'}
          </h1>
          <div className="quiz-subtitle">
            {isUnitQuiz ? (
              passed ? (
                `🎉 Congratulations! You scored ${correct}/10 correct answers (>= 4/10 required). This unit notes PDF is now marked as COMPLETED!`
              ) : (
                `💪 You scored ${correct}/10. You need at least 4/10 correct answers to mark this unit completed. Review below and try again!`
              )
            ) : (
              passed ? '🎉 Congratulations! You successfully passed the quiz!' : '💪 Great effort! Review your answers below to keep improving.'
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card animate-correct">
            <div className="stat-icon-wrapper correct-bg">✅</div>
            <div className="stat-label">{correct}</div>
            <div className="stat-description">Correct Answers</div>
          </div>
          <div className="stat-card animate-wrong">
            <div className="stat-icon-wrapper wrong-bg">❌</div>
            <div className="stat-label">{wrong}</div>
            <div className="stat-description">Wrong Answers</div>
          </div>
          <div className="stat-card animate-skipped">
            <div className="stat-icon-wrapper skipped-bg">⏭️</div>
            <div className="stat-label">{skipped}</div>
            <div className="stat-description">Skipped Questions</div>
          </div>
          <div className="stat-card animate-score">
            <div className="stat-icon-wrapper score-bg">📊</div>
            <div className="stat-label">{correct}/10</div>
            <div className="stat-description">Score ({percentage.toFixed(0)}%)</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          {isUnitQuiz ? (
            <button className="action-btn dashboard-btn" onClick={handleBackToCourse}>
              📚 Back to Unit Materials
            </button>
          ) : (
            <button className="action-btn retry-btn" onClick={() => navigate('/quiz')}>
              🔄 Retry Quiz
            </button>
          )}
          <button className="action-btn dashboard-btn" onClick={() => navigate('/courses')}>
            🎓 Domain Courses
          </button>
        </div>

        {/* Question Summary Header */}
        <div className="question-summary">
          <h2 className="summary-title">Question Breakdown</h2>
          <p className="summary-subtitle">Detailed review of your selections and correct answers.</p>
        </div>

        {/* Questions List */}
        <div className="questions-container">
          <div className="questions-list">
            {questions.map((q, idx) => {
              const userAns = answers[idx];
              const isSkipped = userAns === null || userAns === -1;
              const selectedOptionIndex = !isSkipped ? userAns : null;
              const isCorrect = userAns === q.correct;

              return (
                <div key={idx} className="question-card">
                  <div className="question-header">
                    <div className="question-number">QUESTION {idx + 1}</div>
                    <div className="question-text">{q.question}</div>
                  </div>

                  {/* Options – Correct in GREEN, Selected Wrong in RED */}
                  <div className="options-grid">
                    {q.options.map((opt, optIdx) => {
                      const isCorrectOption = optIdx === q.correct;
                      const isSelected = selectedOptionIndex === optIdx;

                      let className = 'option-item';
                      let badgeText = '';
                      let badgeClass = '';

                      if (isCorrectOption) {
                        className += ' correct-option';
                        if (isSelected) {
                          badgeText = '✓ Your Answer (Correct)';
                          badgeClass = 'correct-badge';
                        } else {
                          badgeText = '✓ Correct Answer';
                          badgeClass = 'correct-badge';
                        }
                      } else if (isSelected) {
                        className += ' wrong-option';
                        badgeText = '✕ Your Answer (Incorrect)';
                        badgeClass = 'wrong-badge';
                      }

                      return (
                        <div key={optIdx} className={className}>
                          <div className="option-text-wrapper">
                            <span className="option-label-prefix">{optionLabels[optIdx]}.</span>
                            <span className="option-text">{opt}</span>
                          </div>
                          {badgeText && (
                            <span className={`option-status-badge ${badgeClass}`}>
                              {badgeText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats & Result Indicator */}
                  <div className="question-footer">
                    <div className="footer-status-wrapper">
                      {isSkipped ? (
                        <div className="result-indicator skipped-result">
                          ⏭️ Skipped
                        </div>
                      ) : isCorrect ? (
                        <div className="result-indicator correct-result">
                          ✅ Correct
                        </div>
                      ) : (
                        <div className="result-indicator wrong-result">
                          ❌ Incorrect
                        </div>
                      )}
                      <div className="correct-option-text">
                        Correct Answer: <strong>Option {optionLabels[q.correct]}</strong>
                        {!isSkipped && !isCorrect && (
                          <span style={{ marginLeft: '12px', color: '#b91c1c' }}>
                            Your Selection: <strong>Option {optionLabels[selectedOptionIndex]}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="explanation-box">
                      <div className="explanation-header">
                        <span className="explanation-icon">💡</span>
                        <strong>Explanation:</strong>
                      </div>
                      <p className="explanation-content">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;