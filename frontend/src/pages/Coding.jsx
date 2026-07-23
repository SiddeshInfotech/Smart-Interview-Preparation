import React, { useState, useEffect } from "react";
import "../styles/Coding.css";
import Navbar from "../components/Navbar";
import Editor from "@monaco-editor/react";
import api from "../api/axios";

const CodingAssessment = () => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [solution, setSolution] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Program Input State & Modal
  const [userInput, setUserInput] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);

  const question = `Write a program to find the largest number among three given integers.`;

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
        printf("Program Output:\n%s", input_buffer);
    } else {
        printf("No input provided. Type your input in the box below.\n");
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
    setCode(templates[language] || "");
  }, [language]);

  const changeLanguage = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setOutput("");
    setError("");
    setSolution("");
    setShowResult(false);
    setUserInput("");
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
      console.log("Calling Django API via axios with input:", overrideInput);
      const response = await api.post("/coding/run/", {
        language: language,
        code: code,
        input: overrideInput
      });

      const data = response.data;
      console.log("CODE RESPONSE:", data);

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
    <>
      <Navbar />
      <div className="coding-page">
        <div className="workspace">
          {/* ===========================
                MAIN SECTION
          =========================== */}
          <div className="left-panel">
            {/* ===========================
                  QUESTION SECTION
            =========================== */}
            <div className="question-card">
              <div className="question-header">
                <h2>💻 Coding Task</h2>
              </div>
              <div className="question-body">
                <p>{question}</p>
              </div>
            </div>

            {/* ===========================
                  CODE EDITOR SECTION
            =========================== */}
            <div className="editor-card">
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <select
                    value={language}
                    onChange={changeLanguage}
                    className="language-select"
                  >
                    <option value="python">Python 3</option>
                    <option value="c">C (GCC)</option>
                    <option value="cpp">C++ (G++)</option>
                    <option value="java">Java (Temurin 17)</option>
                  </select>
                </div>

                <div className="toolbar-right">
                  <button
                    className="run-btn"
                    onClick={handleRunClick}
                    disabled={isRunning}
                  >
                    {isRunning ? "Running..." : "▶ Run Code"}
                  </button>
                </div>
              </div>

              {/* ===========================
                    MONACO EDITOR
              =========================== */}
              <div className="editor-container">
                <Editor
                  height="450px"
                  language={language}
                  value={code}
                  theme="vs-light"
                  onChange={(value) => setCode(value || "")}
                  loading={<div style={{ padding: "20px", color: "#64748b", fontWeight: "bold" }}>Loading Monaco Code Editor...</div>}
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

              {/* ===========================
                    PROGRAM INPUT FIELD
              =========================== */}
              <div className="input-card">
                <div className="input-card-header">
                  <div className="input-card-title-group">
                    <h4>⌨️ Standard Program Input (stdin)</h4>
                    <p className="input-card-desc">
                      Specify keyboard input values below (e.g., numbers, strings, or multi-line text) to be passed directly to standard input during execution.
                    </p>
                  </div>
                </div>
                
                {/* LABEL & INPUT FIELD ROW */}
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
                  className="close-result-btn"
                  onClick={() => setShowResult(false)}
                  title="Close console"
                >
                  ✕
                </button>
              </div>

              {/* PROFESSIONAL TERMINAL CONSOLE */}
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

                  {/* INLINE TERMINAL PROMPT ROW DIRECTLY IN CONSOLE SCREEN */}
                  {!error && !isRunning && (
                    <div className="inline-idle-row">
                      <span className="inline-idle-label">&gt;_</span>
                      <input
                        type="text"
                        className="inline-idle-input"
                        placeholder="Type input data here (e.g. 10 25 15 or name) and press Enter..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            executeCode(e.target.value);
                          }
                        }}
                      />
                      <button
                        className="inline-idle-btn"
                        onClick={() => executeCode(userInput)}
                        disabled={isRunning}
                      >
                        {isRunning ? "Running..." : "Execute ↵"}
                      </button>
                    </div>
                  )}
                </div>

                {/* FOOTER BAR */}
                <div className="pro-terminal-footer idle-footer">
                  <span className="idle-footer-note">💡 Smart Interview Execution Engine — Type keyboard input in the &gt;_ prompt field above and press Enter.</span>
                </div>
              </div>

              {/* DEDICATED COMPILER / RUNTIME ERROR OUTPUT SECTION */}
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

              {/* SUGGESTED SOLUTION / DIAGNOSTIC FIX */}
              {solution && !isRunning && (
                <div className="result-card solution-card">
                  <h4>💡 Suggested Solution</h4>
                  <div className="solution-box">
                    <p>{solution}</p>
                  </div>
                </div>
              )}

              {/* SUCCESS MESSAGE LOGIC */}
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
      </div>

      {/* ==========================================
            PROGRAM INPUT POPUP MODAL
      ========================================== */}
      {showInputModal && (
        <div className="modal-overlay">
          <div className="input-modal">
            <div className="modal-header">
              <h3>⌨️ Program Keyboard Input Prompt</h3>
              <button
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
                  placeholder="Enter keyboard input data here (e.g., kimaya 18 or 10 25 15)..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowInputModal(false)}
              >
                Cancel
              </button>
              <button
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
    </>
  );
};

export default CodingAssessment;