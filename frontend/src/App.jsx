import { useState } from "react";
import Editor from "@monaco-editor/react";

function App() {

  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");

  const [code, setCode] = useState(
`print("Hello Smart Interview Portal")`
  );

  const templates = {

    python:
`print("Hello Python")`,

    c:
`#include <stdio.h>

int main() {
    printf("Hello C");
    return 0;
}`,

    cpp:
`#include <iostream>
using namespace std;

int main() {
    cout << "Hello C++";
    return 0;
}`,

    java:
`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Java");
    }
}`

  };


  const changeLanguage = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(templates[lang]);
    setOutput("");
  };


  const runCode = async () => {

    try {

      const res = await fetch("http://127.0.0.1:8000/api/run/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          language,
          input: ""
        })
      });

      const data = await res.json();
      setOutput(data.output || "No Output");

    } catch {
      setOutput("❌ Backend not running");
    }

  };


  return (
    <div className="app">


      {/* NAVBAR */}
      <header className="navbar">

        <div className="brand">
          <div className="logo">SIP</div>

          <div>
            <h1>Smart Interview Portal</h1>
            <p>Coding Assessment Platform</p>
          </div>
        </div>


        <div className="actions">

          {/* ✅ JS removed */}
          <select value={language} onChange={changeLanguage}>
            <option value="python">Python</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <button onClick={runCode}>
            ▶ Run Code
          </button>

        </div>

      </header>



      {/* WORKSPACE */}
      <div className="workspace">


        <div className="editor-card">

          <div className="title-bar">
            💻 Code Editor
            <span>● Ready</span>
          </div>

          <Editor
            height="100%"
            theme="vs-light"
            language={language}
            value={code}
            onChange={(v) => setCode(v || "")}
          />

        </div>



        <div className="output-card">

          <div className="title-bar">
            📤 Output
          </div>

          <div className="console">
            <pre>
{output || "Run your code to see output..."}
            </pre>
          </div>

        </div>


      </div>



<style>{`

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Segoe UI;
  background:#f1f5f9;
}

.app{
  height:100vh;
}

/* NAVBAR */
.navbar{
  height:75px;
  background:white;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:0 30px;
  border-bottom:1px solid #dbeafe;
  box-shadow:0 4px 10px rgba(0,0,0,0.05);
}

.brand{
  display:flex;
  align-items:center;
  gap:12px;
}

.logo{
  height:45px;
  width:45px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#2563eb;
  color:white;
  font-weight:bold;
  border-radius:10px;
}

.brand h1{
  margin:0;
  font-size:20px;
  color:#1e3a8a;
}

.brand p{
  margin:0;
  font-size:12px;
  color:#64748b;
}

.actions{
  display:flex;
  align-items:center;
}

select{
  height:40px;
  padding:0 15px;
  border-radius:8px;
  border:1px solid #cbd5e1;
}

button{
  height:40px;
  margin-left:10px;
  padding:0 20px;
  border:none;
  border-radius:8px;
  background:#2563eb;
  color:white;
  font-weight:600;
  cursor:pointer;
}

button:hover{
  background:#1d4ed8;
}

/* WORKSPACE */
.workspace{
  height:calc(100vh - 75px);
  display:flex;
  gap:20px;
  padding:20px;
}

.editor-card,
.output-card{
  background:white;
  border-radius:15px;
  border:1px solid #e2e8f0;
  box-shadow:0 8px 20px rgba(0,0,0,0.06);
  overflow:hidden;
}

.editor-card{
  width:70%;
}

.output-card{
  width:30%;
}

.title-bar{
  height:50px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:0 15px;
  font-weight:600;
  color:#2563eb;
  border-bottom:1px solid #e2e8f0;
}

.title-bar span{
  font-size:12px;
  color:#16a34a;
}

.console{
  padding:15px;
  height:calc(100% - 50px);
}

pre{
  margin:0;
  height:100%;
  padding:15px;
  background:#0f172a;
  color:#38bdf8;
  border-radius:10px;
  overflow:auto;
}

`}</style>


    </div>
  );
}

export default App;