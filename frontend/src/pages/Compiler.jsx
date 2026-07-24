import { useEffect, useState } from "react";

import { fetchLanguages, runCode } from "../api.js";
import CodeEditor from "../components/CodeEditor.jsx";
import LanguageSelector from "../components/LanguageSelector.jsx";
import Output from "../components/Output.jsx";
import "../styles/compiler.css";

const DEFAULT_SNIPPETS = {
  python: 'print("Hello, world!")',
  javascript: 'console.log("Hello, world!");',
  java:
    "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello, world!\");\n  }\n}",
  cpp:
    '#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}',
  c:
    '#include <stdio.h>\n\nint main() {\n  printf("Hello, world!\\n");\n  return 0;\n}',
};

const FALLBACK_LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "Javascript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "Cpp" },
  { value: "c", label: "C" },
];

export default function Compiler() {
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(DEFAULT_SNIPPETS.python);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLanguages()
      .then((data) => {
        if (Array.isArray(data) && data.length) setLanguages(data);
      })
      .catch(() => {
        // Backend not reachable yet — keep the fallback list so the UI still works.
      });
  }, []);

  function handleLanguageChange(next) {
    setLanguage(next);
    // Only swap in the sample snippet if the editor still holds a previous sample,
    // so we don't clobber code the person has actually written.
    const isUntouched = Object.values(DEFAULT_SNIPPETS).includes(code);
    if (isUntouched) setCode(DEFAULT_SNIPPETS[next] ?? "");
  }

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await runCode({ language, sourceCode: code, stdin });
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Something went wrong talking to the compiler service."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="compiler">
      <div className="compiler__toolbar">
        <LanguageSelector languages={languages} value={language} onChange={handleLanguageChange} />
        <button className="compiler__run-btn" onClick={handleRun} disabled={loading}>
          {loading ? "Running…" : "Run ▶"}
        </button>
      </div>

      <div className="compiler__panels">
        <section className="compiler__panel">
          <div className="compiler__panel-title">Source code</div>
          <CodeEditor value={code} onChange={setCode} />
        </section>

        <section className="compiler__side">
          <div className="compiler__panel compiler__panel--stdin">
            <div className="compiler__panel-title">stdin (optional)</div>
            <textarea
              className="compiler__stdin"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Input passed to your program…"
            />
          </div>

          <div className="compiler__panel compiler__panel--output">
            <div className="compiler__panel-title">Output</div>
            <Output result={result} loading={loading} error={error} />
          </div>
        </section>
      </div>
    </main>
  );
}
