import React, { useState } from "react";
import "../styles/QuizPage.css";

const QuizPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [quizData] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correct: 0,
      hint: "",
      explanation: ""
    },
    {
      question: "",
      options: ["", "", "", ""],
      correct: 1,
      hint: "",
      explanation: ""
    },
    {
      question: "",
      options: ["", "", "", ""],
      correct: 2,
      hint: "",
      explanation: ""
    },
    {
      question: "",
      options: ["", "", "", ""],
      correct: 3,
      hint: "",
      explanation: ""
    },
    {
      question: "",
      options: ["", "", "", ""],
      correct: 0,
      hint: "",
      explanation: ""
    }
  ]);

  const totalQuestions = quizData.length;

  const handleOptionClick = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1 && (selectedOption !== null || isAnswered)) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowHint(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowHint(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedOption(null);
      setIsAnswered(true);
      setShowHint(false);
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
      setIsAnimating(false);
    }, 300);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const getOptionClass = (index) => {
    if (selectedOption === null) return "option-btn";
    if (index === quizData[currentQuestion].correct) return "option-btn correct";
    if (index === selectedOption && index !== quizData[currentQuestion].correct) return "option-btn wrong";
    return "option-btn disabled";
  };

  return (
    <div className="quiz-page">
      {/* Hint Sidebar */}
      <div className={`hint-overlay ${showHint ? 'active' : ''}`} onClick={toggleHint}></div>
      <aside className={`hint-sidebar ${showHint ? 'active' : ''}`}>
        <div className="hint-box">
          <div className="hint-header">
            <h3>💡 Hint & Explanation</h3>
            <button className="close-hint" onClick={toggleHint}>✕</button>
          </div>
          <div className="hint-content">
            <div className="hint-section">
              <h4>HINT</h4>
              <p>{quizData[currentQuestion].hint || "No hint available"}</p>
            </div>
            <div className="explanation-section">
              <h4>EXPLANATION</h4>
              <p>{quizData[currentQuestion].explanation || "No explanation available"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Quiz Content */}
      <main className="quiz-content">
        {/* Top Bar */}
        <div className="quiz-top-bar">
          <div className="question-counter">
            <span className="label">Question</span>
            <span className="number">{currentQuestion + 1}</span>
            <span className="total">/{totalQuestions}</span>
          </div>
          <button className="hint-btn" onClick={toggleHint}>
            💡 Hint & Explanation
          </button>
        </div>

        {/* Question Box */}
        <div className={`question-box ${isAnimating ? 'slide-out' : 'slide-in'}`}>
          <div className="question-badge">QUESTION {currentQuestion + 1}</div>
          <p className="question-text">{quizData[currentQuestion].question || "Question text here"}</p>
        </div>

        {/* Options */}
        <div className={`options-grid ${isAnimating ? 'fade-out' : 'fade-in'}`}>
          {quizData[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={getOptionClass(index)}
              onClick={() => handleOptionClick(index)}
              disabled={isAnswered}
            >
              <span className="option-label">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option || `Option ${String.fromCharCode(65 + index)}`}</span>
              {selectedOption !== null && index === quizData[currentQuestion].correct && (
                <span className="option-icon">✓</span>
              )}
              {selectedOption === index && index !== quizData[currentQuestion].correct && (
                <span className="option-icon">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Buttons */}
        <div className="quiz-bottom-bar">
          <button 
            className={`btn-previous ${currentQuestion === 0 ? 'disabled' : ''}`} 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            ◀ Previous
          </button>
          <button className="btn-skip" onClick={handleSkip}>
            Skip ▶
          </button>
          <button 
            className={`btn-next ${(selectedOption === null && !isAnswered) || currentQuestion === totalQuestions - 1 ? 'disabled' : ''}`} 
            onClick={handleNext}
            disabled={(selectedOption === null && !isAnswered) || currentQuestion === totalQuestions - 1}
          >
            Next ▶
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;