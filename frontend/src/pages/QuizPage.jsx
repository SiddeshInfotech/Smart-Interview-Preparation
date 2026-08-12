import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Send
} from "lucide-react";
import api from "../api/axios";
import { markModuleComplete } from "../api/courseApi";
import "../styles/QuizPage.css";

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isUnitQuiz = location.state?.isUnitQuiz || false;
  const moduleId = location.state?.moduleId || null;
  const courseId = location.state?.courseId || null;
  const unitTitle = location.state?.unitTitle || "";
  const courseTitle = location.state?.courseTitle || "";
  const domainId = location.state?.domainId || null;

  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load questions
  useEffect(() => {
    const questions = location.state?.questions;
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const formatted = questions.map((q, idx) => {
        let questionStr = "";
        if (typeof q === "string") {
          questionStr = q;
        } else if (typeof q === "object" && q !== null) {
          questionStr = q.text || q.question || q.question_text || q.prompt || q.statement || q.title || q.problem || q.q || q.content || "";
        }
        
        let opts = [];
        if (Array.isArray(q.options) && q.options.length > 0) {
          opts = q.options;
        } else if (Array.isArray(q.choices)) {
          opts = q.choices;
        } else if (Array.isArray(q.answers)) {
          opts = q.answers;
        }

        return {
          id: idx + 1,
          question: questionStr || `Question ${idx + 1}`,
          options: opts,
          correct: typeof q.correct === "number" ? q.correct : 0,
          hint: q.hint || "Think about the core concepts and fundamental rules.",
          explanation: q.explanation || "No explanation provided."
        };
      });
      setQuizData(formatted);
      setUserAnswers(new Array(formatted.length).fill(null));
      setLoading(false);
    } else {
      navigate("/quiz", { 
        state: { error: "No quiz questions found. Please generate a quiz first." }
      });
    }
  }, [location, navigate]);

  // Reset panel on question change
  useEffect(() => {
    setShowPanel(false);
  }, [currentQuestion]);

  const totalQuestions = quizData.length;

  const handleOptionClick = (index) => {
    if (isSubmitting) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = index;
    setUserAnswers(newAnswers);
  };

  const togglePanel = () => {
    setShowPanel(prev => !prev);
  };

  const jumpToQuestion = (targetIndex) => {
    if (targetIndex < 0 || targetIndex >= totalQuestions || isSubmitting || targetIndex === currentQuestion) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentQuestion(targetIndex);
      const targetAns = userAnswers[targetIndex];
      if (targetAns !== null && targetAns !== -1) {
        setSelectedOption(targetAns);
        setIsAnswered(true);
      } else {
        setSelectedOption(null);
        setIsAnswered(false);
      }
      setShowPanel(false);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        const nextIdx = currentQuestion + 1;
        setCurrentQuestion(nextIdx);
        const nextAns = userAnswers[nextIdx];
        if (nextAns !== null && nextAns !== -1) {
          setSelectedOption(nextAns);
          setIsAnswered(true);
        } else {
          setSelectedOption(null);
          setIsAnswered(false);
        }
        setShowPanel(false);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        const prevIdx = currentQuestion - 1;
        setCurrentQuestion(prevIdx);
        const prevAns = userAnswers[prevIdx];
        if (prevAns !== null && prevAns !== -1) {
          setSelectedOption(prevAns);
          setIsAnswered(true);
        } else {
          setSelectedOption(null);
          setIsAnswered(false);
        }
        setShowPanel(false);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSkip = () => {
    const newAnswers = [...userAnswers];
    if (newAnswers[currentQuestion] === null) {
      newAnswers[currentQuestion] = -1;
      setUserAnswers(newAnswers);
    }
    
    if (currentQuestion < totalQuestions - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        const nextIdx = currentQuestion + 1;
        setCurrentQuestion(nextIdx);
        const nextAns = userAnswers[nextIdx];
        if (nextAns !== null && nextAns !== -1) {
          setSelectedOption(nextAns);
          setIsAnswered(true);
        } else {
          setSelectedOption(null);
          setIsAnswered(false);
        }
        setShowPanel(false);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting || totalQuestions === 0) return;
    setIsSubmitting(true);

    let correct = 0, wrong = 0, skipped = 0;
    quizData.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (ans === null || ans === -1) skipped++;
      else if (ans === q.correct) correct++;
      else wrong++;
    });
    const percentage = (correct / totalQuestions) * 100;
    // Score >= 4 out of 10 passes unit quiz
    const passed = correct >= 4;

    if (isUnitQuiz && moduleId && passed) {
      try {
        await markModuleComplete(moduleId);
      } catch (err) {
        console.warn("Could not mark module as complete:", err);
      }
    }

    const resultsData = { 
      correct, 
      wrong, 
      skipped, 
      score: correct, 
      percentage, 
      passed, 
      total: totalQuestions,
      questions: quizData,
      answers: userAnswers,
      isUnitQuiz,
      moduleId,
      courseId,
      unitTitle,
      courseTitle,
      domainId,
    };

    try {
      await api.post('/quiz/save-result/', {
        total_questions: totalQuestions,
        correct_answers: correct,
        wrong_answers: wrong,
        skipped_answers: skipped,
        score: Math.round(percentage * 100) / 100,
      });
      window.dispatchEvent(new Event("usageUpdate"));
    } catch (err) {
      console.warn("Could not save quiz performance:", err);
    }

    setTimeout(() => {
      navigate('/quiz-result', { state: { results: resultsData } });
    }, 400);
  };

  const getOptionClass = (index) => {
    if (selectedOption === index) return "option-btn selected";
    return "option-btn";
  };

  // Count metrics for 40% panel
  const attemptedCount = userAnswers.filter(ans => ans !== null && ans !== -1).length;
  const skippedCount = userAnswers.filter(ans => ans === -1).length;
  const remainingCount = userAnswers.filter(ans => ans === null).length;

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-content-split" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="loading-spinner">Loading quiz questions...</div>
        </div>
      </div>
    );
  }

  if (quizData.length === 0) {
    return (
      <div className="quiz-page">
        <div className="quiz-content-split" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="error-container">
            <h2>No questions available</h2>
            <p>Please generate a quiz first.</p>
            <button className="btn-next" onClick={() => navigate("/quiz")}>Go to Quiz Setup</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* Side Hint Modal */}
      <div className={`hint-overlay ${showPanel ? 'active' : ''}`} onClick={togglePanel}></div>
      <aside className={`hint-sidebar ${showPanel ? 'active' : ''}`}>
        <div className="hint-box">
          <div className="hint-header">
            <h3><Lightbulb size={20} color="#8b5cf6" /> Hint</h3>
            <button className="close-hint" onClick={togglePanel}>✕</button>
          </div>
          <div className="hint-content">
            <div className="hint-section">
              <h4>HINT FOR QUESTION {currentQuestion + 1}</h4>
              <p>{quizData[currentQuestion]?.hint || "No hint available for this question."}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main 60% Left / 40% Right Split Container */}
      <div className="quiz-split-container">
        
        {/* 60% LEFT COLUMN: QUESTION & OPTIONS */}
        <section className="quiz-left-column">
          {/* Header Bar */}
          <div className="quiz-card-header">
            <div className="question-counter">
              <span className="label">Question</span>
              <span className="number">{currentQuestion + 1}</span>
              <span className="total">/{totalQuestions}</span>
            </div>
            <button className="hint-btn" onClick={togglePanel}>
              <Lightbulb size={16} /> Hint
            </button>
          </div>

          {/* Question Text Box */}
          <div className={`question-box ${isAnimating ? 'slide-out' : 'slide-in'}`}>
            <div className="question-badge">QUESTION {currentQuestion + 1}</div>
            <h2 className="question-text">{quizData[currentQuestion]?.question}</h2>
          </div>

          {/* Options Grid */}
          <div className={`options-grid ${isAnimating ? 'fade-out' : 'fade-in'}`}>
            {quizData[currentQuestion]?.options.map((option, index) => (
              <button
                key={index}
                className={getOptionClass(index)}
                onClick={() => handleOptionClick(index)}
                disabled={isSubmitting}
              >
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>

          {/* Action Navigation Bar */}
          <div className="quiz-action-bar">
            <button
              className={`btn-previous ${currentQuestion === 0 || isSubmitting ? 'disabled' : ''}`}
              onClick={handlePrevious}
              disabled={currentQuestion === 0 || isSubmitting}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="quiz-action-right">
              {currentQuestion < totalQuestions - 1 && (
                <button 
                  className="btn-skip" 
                  onClick={handleSkip} 
                  disabled={isSubmitting}
                >
                  Skip Question
                </button>
              )}

              {currentQuestion === totalQuestions - 1 ? (
                <button
                  className={`btn-submit ${isSubmitting ? 'submitting' : ''}`}
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="submit-loading-wrapper">
                      <span className="submit-spinner" /> Submitting...
                    </span>
                  ) : (
                    <>Submit Quiz <Send size={16} /></>
                  )}
                </button>
              ) : (
                <button
                  className="btn-next"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next Question <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 40% RIGHT COLUMN: QUESTION MATRIX & STATUS */}
        <section className="quiz-right-column">
          <div className="palette-card">
            <div className="palette-header">
              <h3>Question Navigator</h3>
              <p>Select any question number to navigate</p>
            </div>

            {/* Summary Counters */}
            <div className="palette-summary">
              <div className="summary-pill attempted">
                <CheckCircle2 size={16} />
                <span>Attempted: <strong>{attemptedCount}</strong></span>
              </div>
              <div className="summary-pill skipped">
                <XCircle size={16} />
                <span>Skipped: <strong>{skippedCount}</strong></span>
              </div>
              <div className="summary-pill remaining">
                <HelpCircle size={16} />
                <span>Remaining: <strong>{remainingCount}</strong></span>
              </div>
            </div>

            {/* Question Matrix Grid */}
            <div className="question-matrix">
              {quizData.map((q, idx) => {
                const ans = userAnswers[idx];
                const isCurrent = currentQuestion === idx;
                const isAttempted = ans !== null && ans !== -1;
                const isSkipped = ans === -1;

                let statusClass = "unattempted";
                if (isAttempted) statusClass = "attempted";
                else if (isSkipped) statusClass = "skipped";

                if (isCurrent) statusClass += " current";

                return (
                  <button
                    key={idx}
                    className={`matrix-item ${statusClass}`}
                    onClick={() => jumpToQuestion(idx)}
                    disabled={isSubmitting}
                    title={`Question ${idx + 1}: ${isAttempted ? 'Attempted' : isSkipped ? 'Skipped' : 'Not Attempted'}`}
                  >
                    <span className="matrix-num">{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit Quiz Direct Button */}
            <div className="palette-footer">
              <button
                className="btn-palette-submit"
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Finish & Submit Quiz"}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default QuizPage;