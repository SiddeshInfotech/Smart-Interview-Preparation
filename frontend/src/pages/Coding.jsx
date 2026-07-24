import React, { useState, useEffect, useRef } from "react";
import "../styles/Coding.css";
import Navbar from "../components/Navbar";
import Editor from "@monaco-editor/react";
import api from "../api/axios";

// ─── Default starter templates ────────────────────────────────────────────────
const TEMPLATES = {
  python: `# Python 3 — Write your solution below
a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
c = int(input("Enter third number: "))

largest = max(a, b, c)
print(f"The largest number is: {largest}")
`,
  c: `#include <stdio.h>

int main() {
    int a, b, c;
    printf("Enter three numbers: ");
    scanf("%d %d %d", &a, &b, &c);
    int largest = (a > b) ? ((a > c) ? a : c) : ((b > c) ? b : c);
    printf("The largest number is: %d\\n", largest);
    return 0;
}`,
  cpp: `#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int a, b, c;
    cout << "Enter three numbers: ";
    cin >> a >> b >> c;
    cout << "The largest number is: " << max({a, b, c}) << endl;
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter three numbers: ");
        int a = sc.nextInt(), b = sc.nextInt(), c = sc.nextInt();
        int largest = Math.max(a, Math.max(b, c));
        System.out.println("The largest number is: " + largest);
    }
}`
};

// ─── Detect if code reads from stdin ──────────────────────────────────────────
const requiresInput = (codeStr, lang) => {
  if (!codeStr) return false;
  const c = codeStr.toLowerCase();
  if (lang === "python") return c.includes("input(") || c.includes("sys.stdin");
  if (lang === "java")   return c.includes("scanner") || c.includes("system.in") || c.includes("bufferedreader");
  if (lang === "c")      return c.includes("scanf") || c.includes("fgets") || c.includes("getchar") || c.includes("gets(");
  if (lang === "cpp")    return c.includes("cin") || c.includes("getline");
  return false;
};

// ─── Extract input prompts WITH TYPE from user code ──────────────────────────
// Returns array of { prompt: string, type: 'STRING'|'INTEGER'|'DECIMAL'|'CHAR'|'VALUE' }
const extractPrompts = (codeStr, lang) => {
  if (!codeStr) return [];
  const found = [];

  if (lang === "python") {
    // int(input("...")) → INTEGER, float(input("...")) → DECIMAL, input("...") → STRING
    const re = /(int|float)?\s*\(?\s*input\s*\(\s*["'`]([^"'`]*)["'`]\s*\)\s*\)?/g;
    let m;
    while ((m = re.exec(codeStr)) !== null) {
      const wrapper = (m[1] || "").toLowerCase();
      const prompt = m[2].trim() || "(value required)";
      const type = wrapper === "int" ? "INTEGER" : wrapper === "float" ? "DECIMAL" : "STRING";
      found.push({ prompt, type });
    }
    // plain input() with no prompt
    const plainRe = /(?<!\w)input\s*\(\s*\)/g;
    let pm;
    while ((pm = plainRe.exec(codeStr)) !== null) {
      // Check if wrapped: look backwards for int( or float(
      const before = codeStr.substring(Math.max(0, pm.index - 10), pm.index).trim();
      let type = "STRING";
      if (before.endsWith("int(") || before.endsWith("int (")) type = "INTEGER";
      if (before.endsWith("float(") || before.endsWith("float (")) type = "DECIMAL";
      found.push({ prompt: "(value required)", type });
    }
  }

  if (lang === "c") {
    // Match printf("prompt") followed by scanf("format", ...)
    // Strategy: find all scanf calls and pair with preceding printf
    const lines = codeStr.split(/\n/);
    let lastPrintfPrompt = "";
    for (const line of lines) {
      const pf = line.match(/printf\s*\(\s*["']([^"']+)["']/);
      if (pf) {
        lastPrintfPrompt = pf[1].replace(/\\n/g, "").replace(/%[\d]*[dsilufce]/g, "").trim();
      }
      const sf = line.match(/scanf\s*\(\s*["']([^"']+)["']/);
      if (sf) {
        const fmt = sf[1];
        // Extract each format specifier
        const specs = fmt.match(/%[\d]*[dsilufce]/g) || ["%s"];
        for (const spec of specs) {
          let type = "VALUE";
          if (/d|i|l/.test(spec)) type = "INTEGER";
          else if (/f|e/.test(spec)) type = "DECIMAL";
          else if (/s/.test(spec)) type = "STRING";
          else if (/c/.test(spec)) type = "CHAR";
          found.push({ prompt: lastPrintfPrompt || "(value required)", type });
          lastPrintfPrompt = ""; // consume prompt
        }
      }
    }
  }

  if (lang === "cpp") {
    // Detect variable type declarations before cin
    const lines = codeStr.split(/\n/);
    const varTypes = {}; // varName → type
    for (const line of lines) {
      // int a, b, c;  or  string name;
      const decl = line.match(/^\s*(int|float|double|char|string|long)\s+(.+);/);
      if (decl) {
        const dtype = decl[1];
        const vars = decl[2].split(",").map(v => v.trim().replace(/[&*]/g, ""));
        for (const v of vars) {
          if (v && /^[a-zA-Z_]\w*$/.test(v)) {
            if (dtype === "int" || dtype === "long") varTypes[v] = "INTEGER";
            else if (dtype === "float" || dtype === "double") varTypes[v] = "DECIMAL";
            else if (dtype === "char") varTypes[v] = "CHAR";
            else if (dtype === "string") varTypes[v] = "STRING";
          }
        }
      }
    }
    // cout << "prompt" before cin
    let lastPrompt = "";
    for (const line of lines) {
      const cout = line.match(/cout\s*<<\s*["']([^"']+)["']/);
      if (cout) {
        lastPrompt = cout[1].replace(/\\n/g, "").trim();
      }
      const cinMatch = line.match(/cin\s*>>\s*(\w+)/);
      if (cinMatch) {
        const vname = cinMatch[1];
        const type = varTypes[vname] || "VALUE";
        found.push({ prompt: lastPrompt || "(value required)", type });
        lastPrompt = "";
        // Check for chained cin >> a >> b >> c
        const chain = line.match(/cin\s*>>(\s*>>\s*\w+)*/g);
        if (chain) {
          const allVars = line.match(/>>\s*(\w+)/g) || [];
          // Skip first (already added)
          for (let i = 1; i < allVars.length; i++) {
            const v = allVars[i].replace(/>>/g, "").trim();
            found.push({ prompt: "(value required)", type: varTypes[v] || "VALUE" });
          }
        }
      }
    }
  }

  if (lang === "java") {
    // Match Scanner method calls paired with preceding print
    const lines = codeStr.split(/\n/);
    let lastPrompt = "";
    for (const line of lines) {
      const pr = line.match(/System\.out\.print(?:ln)?\s*\(\s*["']([^"']+)["']/);
      if (pr) {
        lastPrompt = pr[1].trim();
      }
      const sc = line.match(/\.(nextInt|nextLong|nextFloat|nextDouble|next|nextLine)\s*\(/);
      if (sc) {
        const method = sc[1];
        let type = "VALUE";
        if (method === "nextInt" || method === "nextLong") type = "INTEGER";
        else if (method === "nextFloat" || method === "nextDouble") type = "DECIMAL";
        else if (method === "next" || method === "nextLine") type = "STRING";
        found.push({ prompt: lastPrompt || "(value required)", type });
        lastPrompt = "";
      }
    }
  }

  return found.slice(0, 10);
};

// ─── Validate user input against detected types ──────────────────────────────
const validateInput = (inputStr, prompts) => {
  if (!prompts.length || !inputStr.trim()) return [];
  const lines = inputStr.split(/\n/).map(l => l.trim());
  const warnings = [];

  prompts.forEach((p, i) => {
    const val = lines[i];
    if (val === undefined || val === "") {
      warnings.push({ idx: i, msg: `Input #${i + 1} is missing — expected ${p.type.toLowerCase()}.` });
      return;
    }
    if (p.type === "INTEGER" && !/^-?\d+$/.test(val)) {
      warnings.push({ idx: i, msg: `Input #${i + 1} ("${val}") — expected INTEGER (e.g. 42, -7).` });
    }
    if (p.type === "DECIMAL" && !/^-?\d+(\.\d+)?$/.test(val)) {
      warnings.push({ idx: i, msg: `Input #${i + 1} ("${val}") — expected DECIMAL (e.g. 3.14).` });
    }
    if (p.type === "CHAR" && val.length !== 1) {
      warnings.push({ idx: i, msg: `Input #${i + 1} ("${val}") — expected single CHAR (e.g. A).` });
    }
  });

  if (lines.filter(l => l).length < prompts.length) {
    warnings.push({ idx: -1, msg: `Program expects ${prompts.length} input(s) but only ${lines.filter(l => l).length} provided.` });
  }

  return warnings;
};


// ──────────────────────────────────────────────────────────────────────────────
const CodingAssessment = () => {
  const [language, setLanguage]             = useState("python");
  const [code, setCode]                     = useState(TEMPLATES.python);
  const [userInput, setUserInput]           = useState("");
  const [showInputModal, setShowInputModal] = useState(false);
  const [showResult, setShowResult]         = useState(false);

  const [isRunning, setIsRunning]     = useState(false);
  const [output, setOutput]           = useState(null);  // null = never run
  const [execError, setExecError]     = useState("");
  const [solution, setSolution]       = useState("");
  const [exitSuccess, setExitSuccess] = useState(false);
  const [submittedInput, setSubmittedInput] = useState(""); // echoed in terminal
  const [inputWarnings, setInputWarnings] = useState([]);   // validation warnings

  const outputRef = useRef(null);

  // Auto-scroll terminal to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, execError, isRunning]);

  const changeLanguage = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(TEMPLATES[lang] || "");
    setShowResult(false);
    setOutput(null);
    setExecError("");
    setSolution("");
    setExitSuccess(false);
    setUserInput("");
    setSubmittedInput("");
  };

  // ── Run button ─────────────────────────────────────────────────────────────
  const handleRunClick = () => {
    if (requiresInput(code, language)) {
      // Code needs stdin — show popup first
      setShowInputModal(true);
    } else {
      // No input needed — run immediately
      setShowResult(true);
      runCode("");
    }
  };

  const handleModalSubmit = () => {
    setShowInputModal(false);
    setShowResult(true);
    setSubmittedInput(userInput); // save so we can echo it in terminal
    runCode(userInput);
  };

  const runCode = async (stdinInput) => {
    setIsRunning(true);
    setOutput(null);
    setExecError("");
    setSolution("");
    setExitSuccess(false);

    try {
      const response = await api.post("/coding/run/", {
        language,
        code,
        input: stdinInput || ""
      });

      const data = response.data;

      if (data.status === "success") {
        const rawOutput = (data.output || "").trimEnd();
        setOutput(rawOutput || "(Program produced no output)");
        setExecError("");
        setSolution("");
        setExitSuccess(true);
      } else {
        setOutput(null);
        setExecError(data.error || data.output || "Execution failed.");
        setSolution(data.solution || "");
        setExitSuccess(false);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Unable to reach execution server.";
      setOutput(null);
      setExecError(msg);
      setSolution(
        err.response?.data?.solution ||
        "Open a new terminal and run: cd backend/code_executor && uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
      );
      setExitSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  // Terminal status badge
  const terminalStatus = () => {
    if (isRunning)   return <span className="status-badge running">● Compiling &amp; Executing…</span>;
    if (execError)   return <span className="status-badge failed">✕ Runtime / Compile Error</span>;
    if (exitSuccess) return <span className="status-badge success">✓ Exit Code 0</span>;
    return <span className="status-badge idle">◌ Ready</span>;
  };

  // What to render inside the terminal body
  const renderTerminalContent = () => {
    if (isRunning) {
      return (
        <pre className="terminal-output-text compiling-text">
          {"[Execution Engine] Compiling & running your program\u2026\n\nPlease wait\u2026"}
        </pre>
      );
    }

    // Styled stdin echo block — shown above output, like a real terminal
    const stdinBlock = submittedInput ? (
      <div className="stdin-echo-block">
        <div className="stdin-echo-header">
          <span className="stdin-echo-icon">⌨</span>
          <span className="stdin-echo-label">stdin (your input)</span>
        </div>
        <pre className="stdin-echo-values">{submittedInput.trimEnd()}</pre>
      </div>
    ) : null;

    if (output !== null) {
      return (
        <>
          {stdinBlock}
          {stdinBlock && <div className="terminal-divider" />}
          <pre className="terminal-output-text success-text">{output}</pre>
        </>
      );
    }
    if (execError) {
      return (
        <>
          {stdinBlock}
          {stdinBlock && <div className="terminal-divider" />}
          <pre className="terminal-output-text error-text">{execError}</pre>
        </>
      );
    }
    return (
      <pre className="terminal-output-text placeholder-text">
        {"// Waiting for execution\u2026"}
      </pre>
    );
  };

  return (
    <>
      <Navbar />
      <div className="coding-page">
        <div className="workspace">

          {/* ═══════════════════════════════
               LEFT PANEL — Question + Editor
          ═══════════════════════════════ */}
          <div className="left-panel">

            {/* Question Card */}
            <div className="question-card">
              <div className="question-header">
                <h2>💻 Coding Task</h2>
              </div>
              <div className="question-body">
                <p>Write a program to find the largest number among three given integers.</p>
              </div>
            </div>

            {/* Editor Card */}
            <div className="editor-card">
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <select value={language} onChange={changeLanguage} className="language-select">
                    <option value="python">Python 3</option>
                    <option value="c">C (GCC)</option>
                    <option value="cpp">C++ (G++)</option>
                    <option value="java">Java (Temurin 17)</option>
                  </select>
                </div>
                <div className="toolbar-right">
                  <button className="run-btn" onClick={handleRunClick} disabled={isRunning}>
                    {isRunning ? "⏳ Running…" : "▶ Run Code"}
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="editor-container">
                <Editor
                  height="450px"
                  language={language}
                  value={code}
                  theme="vs-dark"
                  onChange={(val) => setCode(val || "")}
                  loading={<div style={{ padding: "20px", color: "#64748b", fontWeight: "bold" }}>Loading Monaco Editor…</div>}
                  options={{
                    fontSize: 14,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    roundedSelection: true,
                    padding: { top: 16 }
                  }}
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════
               FLOATING CONSOLE OUTPUT PANEL
               Only shown after Run is clicked
          ═══════════════════════════════ */}
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

              {/* Terminal Window */}
              <div className="pro-terminal">
                <div className="pro-terminal-header">
                  <div className="terminal-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="terminal-title">Console Output</div>
                  <div className="terminal-status">{terminalStatus()}</div>
                </div>

                {/* Terminal Body — always renders output */}
                <div className="pro-terminal-body" ref={outputRef}>
                  {renderTerminalContent()}
                </div>

                {/* Footer */}
                <div className="pro-terminal-footer">
                  <span className="idle-footer-note">
                    💡 Smart Interview Execution Engine
                    {requiresInput(code, language)
                      ? " — Input popup will appear when you click ▶ Run."
                      : " — No input required, runs automatically."}
                  </span>
                </div>
              </div>

              {/* Solution hint */}
              {solution && !isRunning && (
                <div className="result-card solution-card">
                  <h4>💡 Suggested Fix</h4>
                  <div className="solution-box">
                    <p>{solution}</p>
                  </div>
                </div>
              )}

              {/* Success banner */}
              {exitSuccess && !isRunning && (
                <div className="result-card success-card">
                  <div className="success-message">
                    ✓ Program compiled and executed successfully.
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════
           INPUT POPUP MODAL
           Shown only when requiresInput() is true
      ═══════════════════════════════ */}
      {showInputModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowInputModal(false); }}
        >
          <div className="input-modal">
            <div className="modal-header">
              <h3>⌨️ Program Input Required</h3>
              <button className="close-modal-btn" onClick={() => setShowInputModal(false)}>✕</button>
            </div>

            <div className="modal-body">

              {/* Detected prompts guide with type badges */}
              {(() => {
                const prompts = extractPrompts(code, language);
                return prompts.length > 0 ? (
                  <div className="modal-prompts-guide">
                    <div className="modal-prompts-header">
                      <span className="prompts-icon">📌</span>
                      <span className="prompts-title">Your program expects {prompts.length} input{prompts.length > 1 ? 's' : ''}:</span>
                    </div>
                    <ol className="prompts-list">
                      {prompts.map((p, i) => (
                        <li key={i} className="prompts-list-item">
                          <span className="prompt-num">#{i + 1}</span>
                          <span className="prompt-text">{p.prompt}</span>
                          <span className={`type-badge type-${p.type.toLowerCase()}`}>{p.type}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="modal-instruction-box">
                    <h5>📋 Provide Standard Input (stdin)</h5>
                    <p>
                      Your program reads input. Enter each value on a <strong>separate line</strong>
                      in the order your program expects them.
                    </p>
                  </div>
                );
              })()}

              <div className="modal-input-group">
                <label className="modal-field-label" htmlFor="modal-stdin-field">
                  ✏️ Type your input values (one per line):
                </label>
                <textarea
                  id="modal-stdin-field"
                  className="modal-input-box-large"
                  placeholder={(() => {
                    const prompts = extractPrompts(code, language);
                    if (prompts.length > 0) {
                      return prompts.map((p, i) => {
                        if (p.type === 'INTEGER') return 'e.g. 42';
                        if (p.type === 'DECIMAL') return 'e.g. 3.14';
                        if (p.type === 'CHAR') return 'e.g. A';
                        return 'e.g. John';
                      }).join('\n');
                    }
                    return '10\n25\n15';
                  })()}
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    // Live validate on each keystroke
                    const prompts = extractPrompts(code, language);
                    setInputWarnings(validateInput(e.target.value, prompts));
                  }}
                  rows={5}
                  autoFocus
                  spellCheck={false}
                />
              </div>

              {/* Validation warnings */}
              {inputWarnings.length > 0 && (
                <div className="input-warnings-box">
                  <div className="input-warnings-header">
                    <span>⚠️</span>
                    <span className="input-warnings-title">Input type mismatch detected:</span>
                  </div>
                  <ul className="input-warnings-list">
                    {inputWarnings.map((w, i) => (
                      <li key={i} className="input-warning-item">{w.msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => { setShowInputModal(false); setInputWarnings([]); }}>
                Cancel
              </button>
              <button
                className="modal-submit-btn"
                onClick={() => {
                  const prompts = extractPrompts(code, language);
                  const warns = validateInput(userInput, prompts);
                  setInputWarnings(warns);
                  // Allow run with warnings, block only if empty
                  handleModalSubmit();
                  setInputWarnings([]);
                }}
                disabled={isRunning}
              >
                {isRunning ? "Running…" : inputWarnings.length > 0 ? "⚠️ Run Anyway" : "▶ Run with this Input"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodingAssessment;