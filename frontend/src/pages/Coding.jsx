import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Sparkles, Lightbulb, Code2 } from "lucide-react";
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

  // Active question tab ("problem", "hint", "solution")
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
                <button
                  type="button"
                  className={`q-tab ${activeTab === 'solution' ? 'active' : ''}`}
                  onClick={() => setActiveTab('solution')}
                >
                  <Sparkles size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Solution
                </button>
              </div>
            </div>

            <div className="question-body">
              {activeTab === 'problem' && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#0f172a' }}>
                    {questionData?.title || `${displayLanguage} Coding Task`}
                  </h3>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: '1.6', color: '#334155' }}>
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
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: '1.6', color: '#1e293b' }}>
                    {questionData?.hint || "Think about standard data structures and algorithmic steps to solve this problem effectively."}
                  </p>
                </div>
              )}

              {activeTab === 'solution' && (
                <div className="solution-container">
                  <h4>📝 Reference Solution ({displayLanguage})</h4>
                  <pre className="solution-code">
                    {questionData?.solution || "// Complete solution code or reference explanation will appear here once generated."}
                  </pre>
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
                  className="run-btn"
                  onClick={handleRunClick}
                  disabled={isRunning}
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
          </div>
        </div>

        {/* ===========================
              RESULT PANEL & CONSOLE
        =========================== */}
        {showResult && (
          <div className="result-panel">
            <div className="result-header">
              <h2>📤 Console Output</h2>
              <button
                type="button"
                className="close-result-btn"
                onClick={() => setShowResult(false)}
                title="Close console"
              >
                ✕
              </button>
            </div>

            {/* TERMINAL CONSOLE */}
            <div className="pro-terminal">
              <div className="pro-terminal-header">
                <div className="terminal-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="terminal-title">
                  <span>Console Output</span>
                </div>
                <div className="terminal-status">
                  {isRunning ? (
                    <span className="status-badge running">● Compiling &amp; Executing...</span>
                  ) : error ? (
                    <span className="status-badge failed">✕ Compilation / Runtime Error</span>
                  ) : (
                    <span className="status-badge success">✓ Exit Code 0</span>
                  )}
                </div>
              </div>

              <div className="pro-terminal-body">
                <pre className={`terminal-output-text ${error ? "has-error-text" : ""}`}>
                  {isRunning
                    ? "[Execution Engine] Compiling & running program..."
                    : error
                    ? error
                    : output || "No output produced."}
                </pre>

                {!error && !isRunning && (
                  <div className="inline-idle-row">
                    <span className="inline-idle-label">&gt;_</span>
                    <input
                      type="text"
                      className="inline-idle-input"
                      placeholder="Type input data here and press Enter..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          executeCode(e.target.value);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="inline-idle-btn"
                      onClick={() => executeCode(userInput)}
                      disabled={isRunning}
                    >
                      {isRunning ? "Running..." : "Execute ↵"}
                    </button>
                  </div>
                )}
              </div>

              <div className="pro-terminal-footer idle-footer">
                <span className="idle-footer-note">💡 Smart Execution Engine — Type keyboard input in the &gt;_ prompt field above and press Enter.</span>
              </div>
            </div>

            {error && !isRunning && (
              <div className="result-card error-console-card">
                <div className="error-console-header">
                  <h4>⚠️ Compiler &amp; Runtime Error Output</h4>
                </div>
                <div className="error-console-box">
                  <pre className="error-console-text">{error}</pre>
                </div>
              </div>
            )}

            {solution && !isRunning && (
              <div className="result-card solution-card">
                <h4>💡 Suggested Solution</h4>
                <div className="solution-box">
                  <p>{solution}</p>
                </div>
              </div>
            )}

            {!error && !isRunning && output && (
              <div className="result-card success-card">
                <div className="success-message">
                  ✓ Successfully compiled and executed.
                </div>
              </div>
            )}
          </div>
        )}
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
    </div>
  );
};

export default CodingAssessment;