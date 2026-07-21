import React, { useState } from "react";
import "../styles/Coding.css";
import Navbar from "../components/Navbar";
import Editor from "@monaco-editor/react";


const CodingAssessment = () => {


  const [language, setLanguage] = useState("python");


  const [code, setCode] = useState(
`print("Hello PrepMaster AI")`
  );


  const [output, setOutput] = useState("");

  const [error, setError] = useState("");

  const [showResult, setShowResult] = useState(false);




  const question =

`Write a program to find the largest number among three given integers.`

  const templates = {


    python:

`print("Hello Python")`,



    c:

`#include <stdio.h>

int main()
{
    printf("Hello C");
    return 0;
}`,



    cpp:

`#include <iostream>

using namespace std;

int main()
{
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

    setError("");

    setShowResult(false);


  };





  const runCode = async () => {


    setShowResult(true);


    setOutput("");

    setError("");



    try {


      const response = await fetch(

        "http://127.0.0.1:8000/api/coding/run/",

        {


          method:"POST",


          headers:{

            "Content-Type":"application/json"

          },


          body:JSON.stringify({

            language,

            code,

            input:""

          })


        }

      );



      const data = await response.json();



      console.log(
        "CODE RESPONSE",
        data
      );



      setOutput(

        data.output ||

        "No output received"

      );



      setError(

        data.error ||

        ""

      );


    }


    catch(err){


      setError(

        "Unable to connect to execution server."

      );


    }


  };



  return (

    <>
          {/* ===========================
            NAVBAR
      =========================== */}

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


                <h2>

                  💻 Coding Question

                </h2>


              </div>





              <div className="question-body">


                <p>

                  {question}

                </p>


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



                    <option value="python">

                      Python

                    </option>



                    <option value="c">

                      C

                    </option>



                    <option value="cpp">

                      C++

                    </option>



                    <option value="java">

                      Java

                    </option>



                  </select>



                </div>







                <div className="toolbar-right">



                  <button


                    className="run-btn"


                    onClick={runCode}


                  >

                    ▶ Run Code


                  </button>



                </div>






              </div>








              {/* ===========================
                    MONACO EDITOR
              =========================== */}



              <div className="editor-container">



                <Editor



                  height="560px"



                  language={language}



                  value={code}



                  theme="vs-light"





                  onChange={(value)=>

                    setCode(value || "")
                  }
                  options={{
                    fontSize:15,
                    automaticLayout:true,

                    minimap:{

                      enabled:false
                    },
                    scrollBeyondLastLine:false,

                    wordWrap:"on",
                    roundedSelection:true,
                    padding:{
                      top:15
                    }

                  }}

                />
              </div>
            </div>
          </div>
          {

            showResult && (


              <div className="result-panel">
                <div className="result-header">
                  <h2>
                    📤 Program Result
                  </h2>
                </div>
                <div className="result-card">
                  <div className="terminal-box">
                    <div className="terminal-header">
                      <h5>
                        Console Output
                      </h5>
                    </div>
                    <pre>
{output || "Run your code to see output"}
                    </pre>
                  </div>
                </div>
                {/* ===========================
                      ERROR SECTION
                =========================== */}

                <div className="result-card">
                  <h4>
                    Errors
                  </h4>
                  <div

                    className={`error-box ${
                      
                      error ? "has-error" : ""

                    }`}

                  >
                    {

                      error ?

                      <pre>

                        {error}

                      </pre>

                      :

                      <div className="success-message">


                        ✓ No Errors


                      </div>
                    }

                  </div>
                </div>
              </div>
            )

          }
                  </div>
      </div>
    </>
  );
};

export default CodingAssessment;