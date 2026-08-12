import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Lightbulb, Code2, Sparkles } from "lucide-react";
import Editor from "@monaco-editor/react";
import api from "../api/axios";
import "../styles/Coding.css";

const mapLanguageKey = (langStr) => {
  if (!langStr) return "python";
  const lower = langStr.toLowerCase().trim();
  if (lower.includes("html") || lower.includes("css") || lower.includes("react") || lower.includes("javascript") || lower.includes("js")) return "javascript";
  if (lower.includes("django") || lower.includes("python") || lower.includes("testing") || lower.includes("pytest")) return "python";
  if (lower.includes("sql")) return "sql";
  if (lower.includes("c++") || lower.includes("cpp")) return "cpp";
  if (lower.includes("c#")) return "csharp";
  if (lower.includes("c") && !lower.includes("css")) return "c";
  if (lower.includes("java") && !lower.includes("script")) return "java";
  if (lower.includes("kotlin")) return "kotlin";
  return "python";
};

const isFrontendTech = (lang) => {
  if (!lang) return false;
  const lower = lang.toLowerCase();
  return lower.includes("html") || lower.includes("css") || lower.includes("react") || lower.includes("javascript") || lower.includes("js");
};

const CodingAssessment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const displayLanguage = location.state?.language || "Python";
  const questionData = location.state?.questionData || null;

  const languageKey = mapLanguageKey(displayLanguage);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [solution, setSolution] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [outputTab, setOutputTab] = useState(isFrontendTech(displayLanguage) ? "preview" : "console");

  // AI Evaluation Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  // Active question tab ("problem", "hint")
  const [activeTab, setActiveTab] = useState("problem");

  // Program Input State & Modal
  const [userInput, setUserInput] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);

  // Dynamic Theme state for Monaco Editor
  const [monacoTheme, setMonacoTheme] = useState(
    document.documentElement.getAttribute("data-theme") === "dark" ||
    document.body.classList.contains("dark-theme")
      ? "vs-dark"
      : "vs-light"
  );

  useEffect(() => {
    const checkTheme = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        document.body.classList.contains("dark-theme");
      setMonacoTheme(isDark ? "vs-dark" : "vs-light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCode("");
  }, [languageKey]);

  const handleQuit = () => {
    if (window.confirm("Are you sure you want to quit the coding assessment? Unsaved progress will be lost.")) {
      navigate("/quiz");
    }
  };

  const handleRunClick = () => {
    if (isFrontendTech(displayLanguage)) {
      setShowResult(true);
      setOutputTab("preview");
      executeCode("");
    } else {
      setShowInputModal(true);
    }
  };

  const handleModalSubmit = () => {
    setShowInputModal(false);
    executeCode(userInput);
  };

  const executeCode = async (overrideInput = userInput) => {
    setShowResult(true);
    setOutput("");
    setError("");
    setSolution("");
    setIsRunning(true);

    try {
      const response = await api.post("/coding/run/", {
        language: languageKey,
        code: code,
        input: overrideInput
      });

      if (response.data.status === "success") {
        setOutput(response.data.output || "Program executed successfully with no output.");
      } else {
        setError(response.data.error || response.data.output || "Execution failed.");
      }
    } catch (err) {
      console.error("Execution error:", err);
      setError(err.response?.data?.error || err.message || "Failed to execute code.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitClick = async () => {
    if (!code || !code.trim()) {
      alert("Please write your program solution in the editor before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/coding/submit/", {
        language: displayLanguage,
        code: code,
        input: userInput,
        question_title: questionData?.title || `${displayLanguage} Coding Task`,
        problem_statement: questionData?.problem_statement || "Write a program to solve the coding challenge requirement."
      });

      if (response.data.success) {
        setEvalResult(response.data.evaluation);
        setShowEvalModal(true);
      } else {
        alert(response.data.error || "Evaluation failed. Please try again.");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission error. Please ensure the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowSolutionClick = () => {
    const confirmView = window.confirm(
      "⚠️ WARNING: Viewing the reference solution will forfeit this coding challenge!\n\nUpon closing the solution popup, your attempt will be recorded as 0% and you will be exited from the editor.\n\nDo you want to reveal the solution?"
    );
    if (confirmView) {
      setShowSolutionModal(true);
    }
  };

  const handleCloseSolutionAndExit = async () => {
    setShowSolutionModal(false);
    try {
      await api.post("/coding/submit/", {
        language: displayLanguage,
        code: code || "# Forfeited Solution View",
        input: userInput,
        question_title: questionData?.title || `${displayLanguage} Coding Task`,
        problem_statement: questionData?.problem_statement || "Write a program to solve the coding challenge requirement.",
        forfeit: true
      });
    } catch (err) {
      console.warn("Forfeit submission failed:", err);
    } finally {
      alert("Challenge forfeited (0% score). Exiting code editor...");
      navigate("/quiz");
    }
  };

  return (
    <div className="coding-page">
      <header className="coding-header">
        <div className="coding-header-left">
          <h2 className="coding-header-title">💻 Smart Coding Assessment</h2>
          <span className="lang-badge">Language: {displayLanguage}</span>
        </div>
        <div className="coding-header-right">
          <button type="button" className="quit-btn" onClick={handleQuit}>
            <LogOut size={16} /> Exit / Quit
          </button>
        </div>
      </header>

      <div className="workspace">
        <div className="left-panel">
          <div className="question-card">
            <div className="question-header">
              <div className="question-tabs">
                <button
                  type="button"
                  className={`q-tab ${activeTab === 'problem' ? 'active' : ''}`}
                  onClick={() => setActiveTab('problem')}
                >
                  <Code2 size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Problem Statement
                </button>
                <button
                  type="button"
                  className={`q-tab ${activeTab === 'hint' ? 'active' : ''}`}
                  onClick={() => setActiveTab('hint')}
                >
                  <Lightbulb size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Hint
                </button>
              </div>
            </div>

            <div className="question-body">
              {activeTab === 'problem' && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                    {questionData?.title || `${displayLanguage} Coding Task`}
                  </h3>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: '1.6' }}>
                    {questionData?.problem_statement || "Write a program to solve the coding challenge requirement."}
                  </p>

                  {!isFrontendTech(displayLanguage) && (questionData?.sample_input || questionData?.sample_output) && (
                    <div className="sample-box">
                      {questionData?.sample_input && (
                        <div className="sample-section">
                          <strong>Sample Input:</strong>
                          <pre>{questionData.sample_input}</pre>
                        </div>
                      )}
                      {questionData?.sample_output && (
                        <div className="sample-section">
                          <strong>Sample Output:</strong>
                          <pre>{questionData.sample_output}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'hint' && (
                <div className="hint-container">
                  <h4>💡 Hint &amp; Approach</h4>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: '1.6' }}>
                    {questionData?.hint || "Think about standard data structures and algorithmic steps to solve this problem effectively."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="editor-card">
            <div className="editor-toolbar">
              <div className="toolbar-left">
                <span className="lang-badge">Code Editor ({displayLanguage})</span>
              </div>

              <div className="toolbar-right">
                <button
                  type="button"
                  className="show-solution-btn"
                  onClick={handleShowSolutionClick}
                  disabled={isRunning || isSubmitting}
                  title="View solution (forfeits challenge with 0% score)"
                >
                  💡 Show Solution
                </button>
                <button
                  type="button"
                  className="submit-code-btn"
                  onClick={handleSubmitClick}
                  disabled={isRunning || isSubmitting}
                >
                  {isSubmitting ? "Evaluating..." : "⚡ Submit Solution"}
                </button>
                <button
                  type="button"
                  className="run-btn"
                  onClick={handleRunClick}
                  disabled={isRunning || isSubmitting}
                >
                  {isRunning ? "Running..." : "▶ Run Code"}
                </button>
              </div>
            </div>

            <div className="editor-container">
              <Editor
                height="516px"
                language={languageKey}
                value={code}
                theme={monacoTheme}
                onChange={(value) => setCode(value || "")}
                loading={<div style={{ padding: "20px", color: "#64748b", fontWeight: "bold" }}>Loading Code Editor...</div>}
                options={{
                  fontSize: 15,
                  automaticLayout: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  roundedSelection: true,
                  padding: { top: 15 }
                }}
              />
            </div>

            {showResult && (
              <div className="result-panel">
                <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="result-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      className="close-result-btn"
                      onClick={() => setShowResult(false)}
                      title="Close output"
                    >
                      ✕
                    </button>
                    <div className="result-title-group">
                      <div className="terminal-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <h2>{isFrontendTech(displayLanguage) && outputTab === 'preview' ? '🌐 Live Web Preview' : 'Execution Output'}</h2>
                    </div>
                  </div>

                  {isFrontendTech(displayLanguage) && (
                    <div className="output-tab-toggle" style={{ display: 'flex', gap: '8px', paddingRight: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setOutputTab('preview')}
                        style={{
                          background: outputTab === 'preview' ? '#4f46e5' : '#334155',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        🌐 Live Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutputTab('console')}
                        style={{
                          background: outputTab === 'console' ? '#4f46e5' : '#334155',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        💻 Console Output
                      </button>
                    </div>
                  )}
                </div>

                {isFrontendTech(displayLanguage) && outputTab === 'preview' ? (
                  <div className="live-preview-container" style={{ background: '#ffffff', height: '240px', width: '100%', overflow: 'hidden', borderTop: '1px solid #334155' }}>
                    <iframe
                      title="Live HTML/CSS Preview"
                      srcDoc={code.includes('<html') || code.includes('<div') || code.includes('<style') ? code : `<!DOCTYPE html><html><head><style>body { font-family: system-ui, -apple-system, sans-serif; padding: 15px; color: #0f172a; background: #ffffff; }</style></head><body>${code}</body></html>`}
                      style={{ width: '100%', height: '100%', border: 'none', background: '#ffffff' }}
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : (
                  <div className="clean-output-body">
                    <pre className={`clean-output-text ${error ? "error-text" : "success-text"}`}>{isRunning ? "Compiling & executing program..." : error ? error : output || "No console output produced."}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInputModal && (
        <div className="modal-overlay">
          <div className="input-modal">
            <div className="modal-header">
              <h3>⌨️ Program Keyboard Input Prompt</h3>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowInputModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-instruction-box">
                <h5>Specify Input Fields Required By Your Program</h5>
                <p>
                  If your program reads input (such as <strong>Name</strong>, <strong>Age</strong>, numbers, or text strings), type your input values below. They will be passed to standard input (stdin) during execution:
                </p>
              </div>

              <div className="modal-input-group">
                <label className="modal-field-label" htmlFor="modal-input-field">
                  Input Data (stdin):
                </label>
                <textarea
                  id="modal-input-field"
                  className="modal-input-box-large"
                  placeholder="Enter keyboard input data here (e.g. 10 25 15)..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setShowInputModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-submit-btn"
                onClick={handleModalSubmit}
                disabled={isRunning}
              >
                {isRunning ? "Running..." : "▶ Run & Execute Program"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI EVALUATION POPUP MODAL */}
      {showEvalModal && evalResult && (
        <div className="eval-modal-overlay">
          <div className="eval-modal">
            <div className="eval-modal-header">
              <div className="eval-modal-title">
                <Sparkles size={22} color="#10b981" />
                <h3>AI Code Evaluation Result</h3>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowEvalModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="eval-modal-body">
              {/* Overall Score & Status Banner */}
              <div className={`eval-score-banner ${evalResult.status === 'Passed' ? 'passed' : 'failed'}`}>
                <div className="score-circle">
                  <h2>{evalResult.overall_score}%</h2>
                  <span>Overall Score</span>
                </div>
                <div className="score-status-info">
                  <span className={`status-pill ${evalResult.status === 'Passed' ? 'pill-passed' : 'pill-failed'}`}>
                    {evalResult.status === 'Passed' ? '✓ Passed' : '✕ Needs Improvement'}
                  </span>
                  <p className="eval-summary-text">{evalResult.summary || "Evaluation completed."}</p>
                  <div className="complexity-tags">
                    <span className="comp-tag">⏱ Time: {evalResult.time_complexity_notation || "O(N)"}</span>
                    <span className="comp-tag">💾 Space: {evalResult.space_complexity_notation || "O(1)"}</span>
                  </div>
                </div>
              </div>

              {/* Criteria Breakdown */}
              <div className="eval-criteria-section">
                <h4>📊 Criteria Assessment</h4>
                {evalResult.criteria && Object.entries(evalResult.criteria).map(([key, item]) => (
                  <div className="criteria-row" key={key}>
                    <div className="criteria-label-row">
                      <span className="criteria-name">{key.replace("_", " ").toUpperCase()}</span>
                      <strong className="criteria-score">{item.score}%</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div className="criteria-bar-fill" style={{ width: `${item.score}%` }}></div>
                    </div>
                    {item.feedback && <p className="criteria-feedback">{item.feedback}</p>}
                  </div>
                ))}
              </div>

              {/* AI Suggestions */}
              {evalResult.suggestions && evalResult.suggestions.length > 0 && (
                <div className="eval-suggestions-section">
                  <h4>💡 Key Recommendations</h4>
                  <ul>
                    {evalResult.suggestions.map((sug, idx) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="eval-modal-footer">
              <button
                type="button"
                className="eval-close-btn"
                onClick={() => setShowEvalModal(false)}
              >
                Close Evaluation Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFERENCE SOLUTION POPUP MODAL (FORFEIT CHALLENGE 0% SCORE) */}
      {showSolutionModal && (
        <div className="eval-modal-overlay">
          <div className="eval-modal solution-modal">
            <div className="eval-modal-header" style={{ borderBottomColor: "#f43f5e" }}>
              <div className="eval-modal-title">
                <Lightbulb size={22} color="#f59e0b" />
                <h3>Reference Solution</h3>
              </div>
              <span className="forfeit-badge" style={{ background: "#ffe4e6", color: "#e11d48", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                ⚠️ Forfeit: 0% Score
              </span>
            </div>

            <div className="eval-modal-body">
              <div className="solution-forfeit-banner" style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                <strong style={{ color: "#be123c", display: "block", marginBottom: "4px" }}>⚠️ Challenge Forfeited!</strong>
                <p style={{ color: "#9f1239", fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
                  Viewing the solution forfeits this attempt. Once you close this modal, your score for this challenge will be recorded as <strong style={{ color: "#be123c"}}>0%</strong> and you will be exited from the code editor.
                </p>
              </div>

              <div className="solution-box" style={{ background: "#0f172a", borderRadius: "10px", padding: "16px", border: "1px solid #334155" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.5px" }}>
                  Reference Solution Code ({displayLanguage}):
                </div>
                <pre style={{ margin: 0, color: "#f8fafc", fontFamily: "Consolas, Monaco, monospace", fontSize: "14px", whiteSpace: "pre-wrap", overflowX: "auto" }}>
                  {questionData?.solution || "No explicit reference solution provided for this question."}
                </pre>
              </div>
            </div>

            <div className="eval-modal-footer">
              <button
                type="button"
                className="close-solution-btn"
                onClick={handleCloseSolutionAndExit}
                style={{ background: "#e11d48", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer", width: "100%" }}
              >
                Close &amp; Exit Code Editor (0% Score)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingAssessment;