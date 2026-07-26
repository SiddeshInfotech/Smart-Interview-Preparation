import os
import time
import requests
from django.conf import settings

# Default Piston API URL fallback order:
# 1. Django settings.PISTON_API_URL
# 2. Environment variable PISTON_API_URL
# 3. Local Piston server (http://localhost:2000/api/v2)
DEFAULT_PISTON_URL = getattr(
    settings,
    "PISTON_API_URL",
    os.environ.get("PISTON_API_URL", "http://localhost:2000/api/v2")
).rstrip("/")

# Language map: canonical key -> Piston runtime language name and default versions
LANGUAGE_MAP = {
    "python": {"piston_name": "python", "version": "3.12.0", "filename": "main.py"},
    "py": {"piston_name": "python", "version": "3.12.0", "filename": "main.py"},
    "python3": {"piston_name": "python", "version": "3.12.0", "filename": "main.py"},
    "py3": {"piston_name": "python", "version": "3.12.0", "filename": "main.py"},
    "c": {"piston_name": "gcc", "version": "10.2.0", "filename": "main.c"},
    "gcc": {"piston_name": "gcc", "version": "10.2.0", "filename": "main.c"},
    "cpp": {"piston_name": "c++", "version": "10.2.0", "filename": "main.cpp"},
    "c++": {"piston_name": "gcc", "version": "10.2.0", "filename": "main.cpp"},
    "java": {"piston_name": "java", "version": "15.0.2", "filename": "Main.java"},
    "js": {"piston_name": "javascript", "version": "*", "filename": "main.js"},
    "javascript": {"piston_name": "javascript", "version": "*", "filename": "main.js"},
    "node": {"piston_name": "javascript", "version": "*", "filename": "main.js"},
    "go": {"piston_name": "go", "version": "*", "filename": "main.go"},
    "golang": {"piston_name": "go", "version": "*", "filename": "main.go"},
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
        # In‑memory cache for /runtimes endpoint
        self._runtimes_cache = {"data": None, "timestamp": 0}
        self._cache_ttl = getattr(settings, "PISTON_RUNTIMES_CACHE_TTL", 300)

    def _fetch_runtimes(self) -> list:
        """Retrieve runtimes from Piston, using an in‑memory cache.
        Returns a list of runtime dictionaries (or empty list on failure)."""
        now = time.time()
        if self._runtimes_cache["data"] and now - self._runtimes_cache["timestamp"] < self._cache_ttl:
            return self._runtimes_cache["data"]
        try:
            resp = requests.get(f"{self.api_url}/runtimes", timeout=3)
            resp.raise_for_status()
            runtimes = resp.json()
            if isinstance(runtimes, list) and len(runtimes) > 0:
                self._runtimes_cache = {"data": runtimes, "timestamp": now}
                return runtimes
            elif isinstance(runtimes, list):
                return runtimes
        except Exception:
            pass
        return []

    def resolve_version(self, piston_name: str, target_version: str = "*") -> str | None:
        """Return the exact version string for *piston_name* if it exists on the server.
        Matches target_version if specified, or defaults to installed version."""
        pname = (piston_name or "").lower().strip()
        tver = (target_version or "*").strip()
        runtimes = self._fetch_runtimes()
        
        # 1. Look for exact language and exact target version match
        for r in runtimes:
            if not isinstance(r, dict):
                continue
            lang = (r.get("language") or "").lower().strip()
            aliases = [str(a).lower().strip() for a in r.get("aliases", []) if a]
            ver = (r.get("version") or "").strip()

            if (lang == pname or pname in aliases):
                if tver != "*" and ver == tver:
                    return ver

        # 2. Fallback to any installed version for language if target_version is '*' or exact not found
        for r in runtimes:
            if not isinstance(r, dict):
                continue
            lang = (r.get("language") or "").lower().strip()
            aliases = [str(a).lower().strip() for a in r.get("aliases", []) if a]
            if lang == pname or pname in aliases:
                return r.get("version")

        # 3. If offline/uncached, fallback to configured target_version if not wildcard
        return tver if tver != "*" else None

    def get_piston_config(self, language: str) -> dict:
        lang_norm = (language or "python").lower().strip()
        config = LANGUAGE_MAP.get(lang_norm, {
            "piston_name": lang_norm,
            "version": "*",
            "filename": "main.txt",
        }).copy()
        target_version = config.get("version", "*")
        resolved = self.resolve_version(config["piston_name"], target_version)
        config["version"] = resolved or target_version
        return config
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
        # If we could not resolve a version for the requested language, return a clear error.
        if not config.get("version"):
            return {
                "status": "error",
                "output": "",
                "error": f"Requested runtime for {config['piston_name']} not available on Piston server.",
                "stdout": "",
                "stderr": f"Runtime {config['piston_name']} unavailable.",
                "exit_code": -1,
                "execution_time": 0.0,
                "memory_used": None,
                "solution": "Choose a supported language or contact the administrator to add the required runtime.",
            }
        endpoint = f"{self.api_url}/execute"

        payload = {
            "language": config["piston_name"],
            "version": str(config["version"]),
            "files": [
                {
                    "name": config["filename"],
                    "content": code
                }
            ],
            "stdin": stdin or "",
            "compile_timeout": 10000,
            "run_timeout": 3000
        }

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
