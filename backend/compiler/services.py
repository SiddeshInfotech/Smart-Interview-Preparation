import os
import time
import requests
from django.conf import settings

# Default Piston API URL fallback order:
# 1. Environment variable PISTON_API_URL
# 2. Public Piston instance (or local container)
DEFAULT_PISTON_URL = getattr(
    settings,
    "PISTON_API_URL",
    os.environ.get("PISTON_API_URL", "https://emkc.org/api/v2/piston")
).rstrip("/")

# Language map: canonical key -> Piston runtime language name
LANGUAGE_MAP = {
    "python": {"piston_name": "python", "version": "*", "filename": "main.py"},
    "py": {"piston_name": "python", "version": "*", "filename": "main.py"},
    "c": {"piston_name": "c", "version": "*", "filename": "main.c"},
    "cpp": {"piston_name": "c++", "version": "*", "filename": "main.cpp"},
    "c++": {"piston_name": "c++", "version": "*", "filename": "main.cpp"},
    "java": {"piston_name": "java", "version": "*", "filename": "Main.java"},
    "js": {"piston_name": "javascript", "version": "*", "filename": "main.js"},
    "javascript": {"piston_name": "javascript", "version": "*", "filename": "main.js"},
    "node": {"piston_name": "javascript", "version": "*", "filename": "main.js"},
    "go": {"piston_name": "go", "version": "*", "filename": "main.go"},
}


def generate_solution_hint(language: str, error_text: str) -> str:
    """
    Generates actionable beginner-friendly debugging recommendations
    based on standard compilation/runtime error messages.
    """
    if not error_text:
        return "Review your program logic and check if your output matches requirements."

    err_lower = error_text.lower()
    hints = []

    lang_key = language.lower()

    if "python" in lang_key:
        if "syntaxerror" in err_lower:
            hints.append("Check missing closing parentheses ')', brackets ']', or colons ':' at block ends.")
        if "indentationerror" in err_lower:
            hints.append("Ensure consistent 4-space indentation. Do not mix tabs and spaces.")
        if "nameerror" in err_lower:
            hints.append("Verify variable spelling and ensure functions/variables are defined before invocation.")
        if "typeerror" in err_lower:
            hints.append("Verify argument data types. Convert string inputs using int() or float().")
        if "eoferror" in err_lower:
            hints.append("EOFError: Program expected input from sys.stdin. Provide test input in the Input box.")
        if "indexerror" in err_lower:
            hints.append("IndexError: Accessing array/list index beyond bounds. Verify list length using len().")

    elif "c" in lang_key or "cpp" in lang_key:
        if "expected ';'" in err_lower:
            hints.append("Add missing semicolon ';' at the end of the statement.")
        if "undefined reference to `main'" in err_lower:
            hints.append("Ensure standard main function exists: int main() { return 0; }.")
        if "was not declared in this scope" in err_lower:
            hints.append("Include necessary headers (e.g., #include <stdio.h>, #include <iostream>).")
        if "segmentation fault" in err_lower:
            hints.append("Segmentation Fault: Invalid memory access or out-of-bounds pointer/array dereference.")

    elif "java" in lang_key:
        if "should be declared in a file named" in err_lower or "class main" in err_lower:
            hints.append("Ensure your public class is named Main: 'public class Main { public static void main(String[] args) {...} }'")
        if "cannot find symbol" in err_lower:
            hints.append("Cannot find symbol: Verify class, variable name spelling, or missing imports.")
        if "nosuchelementexception" in err_lower:
            hints.append("NoSuchElementException: Scanner tried to read input when stdin was empty. Provide test input.")
        if "nullpointerexception" in err_lower:
            hints.append("NullPointerException: Object variable is null. Instantiate objects before invoking methods.")

    if not hints:
        hints.append("Check the line number referenced in the error message and trace variable states.")

    return " ".join(hints)


class AbstractExecutionProvider:
    """Abstract Base Class for Code Execution Engines (Open/Closed Principle)"""
    def execute(self, language: str, code: str, stdin: str = "") -> dict:
        raise NotImplementedError("Subclasses must implement execute method.")


class PistonExecutionService(AbstractExecutionProvider):
    """Piston API Execution Service Provider"""

    def __init__(self, api_url: str = None):
        self.api_url = (api_url or DEFAULT_PISTON_URL).rstrip("/")

    def get_piston_config(self, language: str) -> dict:
        lang_norm = (language or "python").lower().strip()
        return LANGUAGE_MAP.get(lang_norm, {
            "piston_name": lang_norm,
            "version": "*",
            "filename": "main.txt"
        })

    def execute(self, language: str, code: str, stdin: str = "") -> dict:
        start_time = time.time()

        if not code or not code.strip():
            return {
                "status": "error",
                "output": "",
                "error": "No code provided for execution.",
                "stdout": "",
                "stderr": "No source code received.",
                "exit_code": 1,
                "execution_time": 0.0,
                "memory_used": 0,
                "solution": "Write or paste code into the editor before executing."
            }

        config = self.get_piston_config(language)
        endpoint = f"{self.api_url}/execute"

        payload = {
            "language": config["piston_name"],
            "files": [
                {
                    "name": config["filename"],
                    "content": code
                }
            ],
            "stdin": stdin or "",
            "compile_timeout": 10000,
            "run_timeout": 5000
        }

        if config.get("version") and config["version"] != "*":
            payload["version"] = config["version"]

        try:
            response = requests.post(endpoint, json=payload, timeout=15)
            elapsed_sec = round(time.time() - start_time, 3)

            if response.status_code != 200:
                err_msg = f"Piston API returned HTTP {response.status_code}: {response.text}"
                return {
                    "status": "error",
                    "output": "",
                    "error": err_msg,
                    "stdout": "",
                    "stderr": err_msg,
                    "exit_code": response.status_code,
                    "execution_time": elapsed_sec,
                    "memory_used": None,
                    "solution": "Check Piston API host connectivity or try another language."
                }

            data = response.json()

            # Handle Piston Response Structure
            compile_stage = data.get("compile", {})
            run_stage = data.get("run", {})

            compile_stderr = compile_stage.get("stderr", "") if compile_stage else ""
            run_stdout = run_stage.get("stdout", "") if run_stage else ""
            run_stderr = run_stage.get("stderr", "") if run_stage else ""
            run_output = run_stage.get("output", "") if run_stage else ""
            exit_code = run_stage.get("code", 0) if run_stage else (compile_stage.get("code", 1) if compile_stage else 0)

            # Determine Execution Status
            if compile_stderr or (compile_stage and compile_stage.get("code", 0) != 0):
                status = "compile_error"
                combined_err = compile_stderr or "Compilation failed."
                return {
                    "status": status,
                    "output": "",
                    "error": combined_err,
                    "stdout": "",
                    "stderr": combined_err,
                    "exit_code": exit_code,
                    "execution_time": elapsed_sec,
                    "memory_used": None,
                    "solution": generate_solution_hint(language, combined_err)
                }

            elif run_stage and run_stage.get("signal") == "SIGKILL":
                status = "timeout"
                err = "Time Limit Exceeded (Execution timed out)."
                return {
                    "status": status,
                    "output": run_output,
                    "error": err,
                    "stdout": run_stdout,
                    "stderr": err,
                    "exit_code": 137,
                    "execution_time": elapsed_sec,
                    "memory_used": None,
                    "solution": "Optimize your algorithms and ensure infinite loops do not occur."
                }

            elif exit_code != 0 or run_stderr:
                status = "runtime_error"
                combined_err = run_stderr or f"Program exited with code {exit_code}"
                return {
                    "status": status,
                    "output": run_output,
                    "error": combined_err,
                    "stdout": run_stdout,
                    "stderr": run_stderr,
                    "exit_code": exit_code,
                    "execution_time": elapsed_sec,
                    "memory_used": None,
                    "solution": generate_solution_hint(language, combined_err)
                }

            else:
                status = "success"
                return {
                    "status": status,
                    "output": run_stdout or run_output,
                    "error": "",
                    "stdout": run_stdout or run_output,
                    "stderr": "",
                    "exit_code": 0,
                    "execution_time": elapsed_sec,
                    "memory_used": None,
                    "solution": "Program executed successfully with clean output."
                }

        except requests.exceptions.Timeout:
            return {
                "status": "timeout",
                "output": "",
                "error": "Request timed out while connecting to Piston API execution service.",
                "stdout": "",
                "stderr": "API Connection Timeout",
                "exit_code": -1,
                "execution_time": 15.0,
                "memory_used": None,
                "solution": "Verify network connection to Piston API server."
            }

        except requests.exceptions.RequestException as e:
            return {
                "status": "error",
                "output": "",
                "error": f"Failed to connect to Piston execution engine: {str(e)}",
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1,
                "execution_time": round(time.time() - start_time, 3),
                "memory_used": None,
                "solution": "Ensure Piston API host or container service is accessible."
            }


# Singleton service instance
piston_service = PistonExecutionService()
