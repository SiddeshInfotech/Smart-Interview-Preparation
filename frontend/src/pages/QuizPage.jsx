import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/QuizPage.css";

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Explanation animation state
  const [explanationLines, setExplanationLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const explanationShownRef = useRef(false);

  // Load questions
  useEffect(() => {
    const questions = location.state?.questions;
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const formatted = questions.map((q, idx) => ({
        id: idx + 1,
        question: q.text || q.question,
        options: q.options || [],
        correct: q.correct || 0,
        hint: q.hint || "Think about the core concepts",
        explanation: q.explanation || "No explanation provided."
      }));
      setQuizData(formatted);
      setUserAnswers(new Array(formatted.length).fill(null));
      setLoading(false);
    } else {
      navigate("/quiz", { 
        state: { error: "No quiz questions found. Please generate a quiz first." }
      });
    }
  }, [location, navigate]);

  // Reset on question change
  useEffect(() => {
    setExplanationLines([]);
    setCurrentLineIndex(0);
    setIsTyping(false);
    setShowPanel(false);
    explanationShownRef.current = false;
  }, [currentQuestion]);

  const totalQuestions = quizData.length;

  const handleOptionClick = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = index;
    setUserAnswers(newAnswers);

    const isCorrect = index === quizData[currentQuestion]?.correct;

    if (!isCorrect) {
      const explanation = quizData[currentQuestion]?.explanation || "No explanation available.";
      const lines = explanation.split(/(?<=[.!?])\s*/).filter(line => line.trim().length > 0);
      setExplanationLines(lines);
      setCurrentLineIndex(0);
      setIsTyping(true);
      setShowPanel(true);
      explanationShownRef.current = false;
    } else {
      explanationShownRef.current = true;
    }
  };

  // Animate lines one by one
  useEffect(() => {
    if (!isTyping || explanationLines.length === 0) return;
    if (currentLineIndex < explanationLines.length - 1) {
      const timeout = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, 400);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      explanationShownRef.current = true;
    }
  }, [currentLineIndex, isTyping, explanationLines.length]);

  const togglePanel = () => {
    const willOpen = !showPanel;
    if (willOpen && isAnswered) {
      if (!explanationShownRef.current && selectedOption !== null && selectedOption !== quizData[currentQuestion]?.correct) {
        const explanation = quizData[currentQuestion]?.explanation || "No explanation available.";
        const lines = explanation.split(/(?<=[.!?])\s*/).filter(line => line.trim().length > 0);
        setExplanationLines(lines);
        setCurrentLineIndex(0);
        setIsTyping(true);
      } else {
        const fullExplanation = quizData[currentQuestion]?.explanation || "No explanation available.";
        const lines = fullExplanation.split(/(?<=[.!?])\s*/).filter(line => line.trim().length > 0);
        setExplanationLines(lines);
        setCurrentLineIndex(lines.length - 1);
        setIsTyping(false);
      }
    }
    setShowPanel(willOpen);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1 && userAnswers[currentQuestion] !== null) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        // Reset state for new question
        const nextAns = userAnswers[currentQuestion + 1];
        if (nextAns !== null && nextAns !== -1) {
          setSelectedOption(nextAns);
          setIsAnswered(true);
        } else {
          setSelectedOption(null);
          setIsAnswered(false);
        }
        setShowPanel(false);
        setExplanationLines([]);
        setCurrentLineIndex(0);
        setIsTyping(false);
        explanationShownRef.current = false;
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        const prevAns = userAnswers[currentQuestion - 1];
        if (prevAns !== null && prevAns !== -1) {
          setSelectedOption(prevAns);
          setIsAnswered(true);
        } else {
          setSelectedOption(null);
          setIsAnswered(false);
        }
        setShowPanel(false);
        setExplanationLines([]);
        setCurrentLineIndex(0);
        setIsTyping(false);
        explanationShownRef.current = false;
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    const newAnswers = [...userAnswers];
    if (newAnswers[currentQuestion] === null) {
      newAnswers[currentQuestion] = -1;
      setUserAnswers(newAnswers);
    }
    // Do NOT set isAnswered or selectedOption – stay unanswered
    if (currentQuestion < totalQuestions - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        // Reset state for new question
        const nextAns = userAnswers[currentQuestion + 1];
        if (nextAns !== null && nextAns !== -1) {
          setSelectedOption(nextAns);
          setIsAnswered(true);
        } else {
          setSelectedOption(null);
          setIsAnswered(false);
        }
        setShowPanel(false);
        setExplanationLines([]);
        setCurrentLineIndex(0);
        setIsTyping(false);
        explanationShownRef.current = false;
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSubmitQuiz = () => {
    if (totalQuestions === 0) return;
    let correct = 0, wrong = 0, skipped = 0;
    quizData.forEach((q, idx) => {
      const ans = userAnswers[idx];
      if (ans === null || ans === -1) skipped++;
      else if (ans === q.correct) correct++;
      else wrong++;
    });
    const percentage = (correct / totalQuestions) * 100;
    const passed = percentage >= 40;
    const resultsData = { 
      correct, 
      wrong, 
      skipped, 
      score: correct, 
      percentage, 
      passed, 
      total: totalQuestions,
      questions: quizData,
      answers: userAnswers
    };
    navigate('/quiz-result', { state: { results: resultsData } });
  };

  const getOptionClass = (index) => {
    if (selectedOption === null) return "option-btn";
    if (index === quizData[currentQuestion]?.correct) return "option-btn correct";
    if (index === selectedOption && index !== quizData[currentQuestion]?.correct) return "option-btn wrong";
    return "option-btn disabled";
  };

  const getButtonText = () => isAnswered ? "💡 Explanation" : "💡 Hint";

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-content" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="loading-spinner">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (quizData.length === 0) {
    return (
      <div className="quiz-page">
        <div className="quiz-content" style={{ justifyContent: "center", alignItems: "center" }}>
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
      {/* Side Panel */}
      <div className={`hint-overlay ${showPanel ? 'active' : ''}`} onClick={togglePanel}></div>
      <aside className={`hint-sidebar ${showPanel ? 'active' : ''}`}>
        <div className="hint-box">
          <div className="hint-header">
            <h3>{isAnswered ? "💡 Explanation" : "💡 Hint"}</h3>
            <button className="close-hint" onClick={togglePanel}>✕</button>
          </div>
          <div className="hint-content">
            {!isAnswered && (
              <div className="hint-section">
                <h4>HINT</h4>
                <p>{quizData[currentQuestion]?.hint || "No hint available"}</p>
              </div>
            )}
            {isAnswered && (
              <div className="explanation-section">
                <h4>EXPLANATION</h4>
                <div className="explanation-text">
                  {explanationLines.length === 0 ? (
                    <p>No explanation available.</p>
                  ) : (
                    explanationLines.map((line, idx) => (
                      <p
                        key={idx}
                        className={`explanation-line ${idx <= currentLineIndex ? 'visible' : ''}`}
                        style={{ animationDelay: `${idx * 0.15}s` }}
                      >
                        {line}
                      </p>
                    ))
                  )}
                  {isTyping && <span className="cursor-blink">▌</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="quiz-content">
        <div className="quiz-top-bar">
          <div className="question-counter">
            <span className="label">Question</span>
            <span className="number">{currentQuestion + 1}</span>
            <span className="total">/{totalQuestions}</span>
          </div>
          <button className={`hint-btn ${isAnswered ? 'explanation-mode' : ''}`} onClick={togglePanel}>
            {getButtonText()}
          </button>
        </div>

        <div className={`question-box ${isAnimating ? 'slide-out' : 'slide-in'}`}>
          <div className="question-badge">QUESTION {currentQuestion + 1}</div>
          <p className="question-text">{quizData[currentQuestion]?.question}</p>
        </div>

        <div className={`options-grid ${isAnimating ? 'fade-out' : 'fade-in'}`}>
          {quizData[currentQuestion]?.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleOptionClick(index)}
              disabled={isAnswered}
            >
              <span className="option-label">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
            </button>
          ))}
        </div>

        <div className="quiz-bottom-bar">
          <button
            className={`btn-previous ${currentQuestion === 0 ? 'disabled' : ''}`}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ◀ Previous
          </button>

          {currentQuestion === totalQuestions - 1 ? (
            <button className="btn-submit" onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          ) : (
            <>
              <button className="btn-skip" onClick={handleSkip}>
                Skip ▶
              </button>
              <button
                className={`btn-next ${userAnswers[currentQuestion] === null || currentQuestion === totalQuestions - 1 ? 'disabled' : ''}`}
                onClick={handleNext}
                disabled={userAnswers[currentQuestion] === null || currentQuestion === totalQuestions - 1}
              >
                Next ▶
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizPage;