import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Lightbulb, Code2, Sparkles } from "lucide-react";
import Editor from "@monaco-editor/react";
import api from "../api/axios";
import "../styles/Coding.css";

const mapLanguageKey = (langStr) => {
  if (!langStr) return "python";
  const lower = langStr.toLowerCase().trim();
  if (lower === "c") return "c";
  if (lower === "c++" || lower === "cpp") return "cpp";
  if (lower === "java") return "java";
  return "python";
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

  // AI Evaluation Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);

  // Active question tab ("problem", "hint")
  const [activeTab, setActiveTab] = useState("problem");

  // Program Input State & Modal
  const [userInput, setUserInput] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);

  const templates = {
    python: `# Python 3
import sys

def main():
    try:
        user_input = sys.stdin.read().strip()
        if user_input:
            print(f"Program Output:\\n{user_input}")
        else:
            print("No input provided. Type your input in the box below.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()`,

    c: `#include <stdio.h>

int main() {
    char input_buffer[1024];
    if (fgets(input_buffer, sizeof(input_buffer), stdin) != NULL) {
        printf("Program Output:\\n%s", input_buffer);
    } else {
        printf("No input provided. Type your input in the box below.\\n");
    }
    return 0;
}`,

    cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string input_text;
    if (getline(cin, input_text)) {
        cout << "Program Output:" << endl << input_text << endl;
    } else {
        cout << "No input provided. Type your input in the box below." << endl;
    }
    return 0;
}`,

    java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String input_text = sc.nextLine();
            System.out.println("Program Output:");
            System.out.println(input_text);
        } else {
            System.out.println("No input provided. Type your input in the box below.");
        }
    }
}`
  };

  useEffect(() => {
    setCode(templates[languageKey] || templates.python);
  }, [languageKey]);

  const handleQuit = () => {
    if (window.confirm("Are you sure you want to quit the coding assessment? Unsaved progress will be lost.")) {
      navigate("/quiz");
    }
  };

  const handleRunClick = () => {
    setShowInputModal(true);
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

      const data = response.data;

      if (data.status === "success") {
        const inputDisplay = overrideInput.trim() ? `>>> ${overrideInput}\n` : "";
        setOutput(inputDisplay + (data.output || "Program executed successfully with no output."));
        setError("");
        setSolution("");
      } else {
        setOutput("");
        setError(data.error || data.output || "Execution Error");
        setSolution(data.solution || "");
      }
    } catch (err) {
      console.error("Execution Request Failed:", err);
      setOutput("");
      const errMsg = err.response?.data?.error || err.message || "Unable to connect to execution server.";
      setError(errMsg);
      setSolution("Ensure the Django backend (port 8000) and Code Executor service (port 8001) are running.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitClick = async () => {
    if (!code.trim()) {
      alert("Please write your program code before submitting.");
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

      if (response.data?.success) {
        setEvalResult(response.data.evaluation);
        setShowEvalModal(true);
      } else {
        alert(response.data?.error || "Submission evaluation failed.");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission error. Please ensure the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="coding-page">
      {/* ==========================================
            TOP HEADER BAR (NO NAVBAR)
      ========================================== */}
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
        {/* ===========================
              MAIN SECTION
        =========================== */}
        <div className="left-panel">
          {/* ===========================
                QUESTION & TAB SECTION
          =========================== */}
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

                  {(questionData?.sample_input || questionData?.sample_output) && (
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

          {/* ===========================
                CODE EDITOR SECTION
          =========================== */}
          <div className="editor-card">
            <div className="editor-toolbar">
              <div className="toolbar-left">
                <span className="lang-badge">Code Editor ({displayLanguage})</span>
              </div>

              <div className="toolbar-right">
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

            {/* MONACO EDITOR */}
            <div className="editor-container">
              <Editor
                height="450px"
                language={languageKey}
                value={code}
                theme="vs-light"
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

            {/* PROGRAM INPUT FIELD */}
            <div className="input-card">
              <div className="input-card-header">
                <div className="input-card-title-group">
                  <h4>⌨️ Standard Program Input (stdin)</h4>
                  <p className="input-card-desc">
                    Specify keyboard input values below (e.g., numbers, strings, or multi-line text) to be passed directly to standard input during execution.
                  </p>
                </div>
              </div>
              
              <div className="input-field-row">
                <label htmlFor="program-input" className="input-field-label">
                  Input Data:
                </label>
                <textarea
                  id="program-input"
                  className="input-box-large"
                  placeholder="Enter keyboard input data here (e.g. 10 25 15 or name)..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* ===========================
                  RESULT PANEL & CONSOLE
            =========================== */}
            {showResult && (
              <div className="result-panel">
                <div className="result-header">
                  <div className="result-header-left">
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
                      <h2>Execution Output</h2>
                    </div>
                  </div>
                </div>

                <div className="clean-output-body">
                  <pre className={`clean-output-text ${error ? "error-text" : "success-text"}`}>{isRunning ? "Compiling & executing program..." : error ? error : output || "No output produced."}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PROGRAM INPUT POPUP MODAL */}
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
    </div>
  );
};

export default CodingAssessment;