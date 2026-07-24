import docker
import tempfile
import os
import threading

from app.schemas.execute_schema import (
    CodeExecutionRequest,
    CodeExecutionResponse,
)

# ─── Limits ───────────────────────────────────────────────────────────────────
TIMEOUT_SECONDS   = 10          # wall-clock timeout per run
MEM_LIMIT         = "256m"
CPU_NANO          = 1_000_000_000   # 1 CPU core

# ─── Docker images ────────────────────────────────────────────────────────────
IMAGES = {
    "python": "python:3.13-slim",
    "c":      "gcc:latest",
    "cpp":    "gcc:latest",
    "java":   "eclipse-temurin:17-alpine",
}

# ─── Compile + run shell commands inside Docker ───────────────────────────────
# All commands redirect stdin from /code/input.txt
# Compile errors go to /code/compile_err.txt; run errors go to stderr
COMMANDS = {
    "python": (
        "python /code/main.py < /code/input.txt"
    ),
    "c": (
        "gcc /code/main.c -o /code/main -lm 2>/code/compile_err.txt"
        " && /code/main < /code/input.txt"
        " || { echo '__COMPILE_FAILED__'; cat /code/compile_err.txt; exit 1; }"
    ),
    "cpp": (
        "g++ /code/main.cpp -o /code/main -lm 2>/code/compile_err.txt"
        " && /code/main < /code/input.txt"
        " || { echo '__COMPILE_FAILED__'; cat /code/compile_err.txt; exit 1; }"
    ),
    "java": (
        "javac /code/Main.java 2>/code/compile_err.txt"
        " && java -cp /code Main < /code/input.txt"
        " || { echo '__COMPILE_FAILED__'; cat /code/compile_err.txt; exit 1; }"
    ),
}

# ─── Source file names ────────────────────────────────────────────────────────
FILENAMES = {
    "python": "main.py",
    "c":      "main.c",
    "cpp":    "main.cpp",
    "java":   "Main.java",
}

# ─── Python stdin-safe wrapper (prepended to user code) ──────────────────────
PYTHON_WRAPPER = """\
import builtins as _b, sys as _sys

_orig_input = _b.input
_eof_count  = [0]

def _safe_input(prompt=""):
    if prompt:
        _sys.stdout.write(str(prompt))
        _sys.stdout.flush()
    try:
        line = _sys.stdin.readline()
        if line == "":           # EOF
            _eof_count[0] += 1
            if _eof_count[0] > 3:
                _sys.exit(0)
            return ""
        return line.rstrip("\\n").rstrip("\\r")
    except EOFError:
        return ""

_b.input = _safe_input
del _safe_input, _orig_input, _eof_count

"""


def get_docker_client():
    try:
        return docker.from_env()
    except Exception:
        return None


def _normalize_input(raw: str) -> str:
    """
    Normalize line endings to \\n and ensure file ends with a newline.
    Handles Windows (\\r\\n) and old Mac (\\r) line endings.
    Appends 50 empty lines so programs waiting for more input don't hang.
    """
    normalized = raw.replace("\r\n", "\n").replace("\r", "\n")
    if normalized and not normalized.endswith("\n"):
        normalized += "\n"
    # Pad so sequential input() / scanf calls never hit EOF prematurely
    normalized += "\n" * 50
    return normalized


def _decode(raw) -> str:
    """Safely decode bytes to str."""
    if isinstance(raw, bytes):
        return raw.decode("utf-8", errors="replace")
    return raw or ""


def generate_solution_hint(language: str, error_text: str) -> str:
    if not error_text:
        return ""

    err = error_text.lower()
    hints = []

    if language == "python":
        if "syntaxerror" in err:
            hints.append("Check for missing colons ':', closing parentheses ')', or mismatched quotes.")
        if "indentationerror" in err:
            hints.append("Use 4 spaces per level. Never mix tabs and spaces.")
        if "nameerror" in err:
            hints.append("Variable or function used before definition — check spelling and scope.")
        if "typeerror" in err:
            hints.append("Wrap input() with int() or float() before arithmetic operations.")
        if "zerodivisionerror" in err:
            hints.append("Division by zero — add a check before dividing.")
        if "indexerror" in err:
            hints.append("Index out of range — check list size with len() before accessing.")
        if "eoferror" in err:
            hints.append("Program expected more input than was provided. Add all required values in the Input box.")

    elif language in ("c", "cpp"):
        if "expected ';'" in err:
            hints.append("Missing semicolon ';' at the end of a statement.")
        if "undefined reference" in err:
            hints.append("Linker error — ensure all functions are defined or headers are included.")
        if "was not declared" in err:
            hints.append("Variable/function not declared — check includes and variable declarations.")
        if "expected '}'" in err:
            hints.append("Missing closing brace '}' — check all blocks are properly closed.")
        if "no such file or directory" in err:
            hints.append("Check the #include filename spelling.")
        if "segmentation fault" in err:
            hints.append("Segfault — likely a null pointer or out-of-bounds array access.")

    elif language == "java":
        if "nosuchelementexception" in err:
            hints.append("Scanner ran out of input — provide all required values in the Input box.")
        if "should be declared in a file named" in err:
            hints.append("Java public class must be named 'Main'. Use: public class Main { ... }")
        if "cannot find symbol" in err:
            hints.append("Check spelling of variable/method names and required imports.")
        if "reached end of file" in err:
            hints.append("Missing closing '}' — check all class and method blocks are closed.")
        if "nullpointerexception" in err:
            hints.append("NullPointerException — initialize objects before calling methods on them.")
        if "arrayindexoutofboundsexception" in err:
            hints.append("Array index out of bounds — check loop bounds and array size.")

    if not hints:
        hints.append("Review the error line numbers above to locate the issue.")

    return " ".join(hints)


def execute_code(request: CodeExecutionRequest) -> CodeExecutionResponse:
    client = get_docker_client()
    if not client:
        return CodeExecutionResponse(
            status="error",
            output="",
            error="Docker Desktop is not running or not accessible.",
            solution="Start Docker Desktop and try again.",
        )

    language = request.language.lower().strip()

    if language not in IMAGES:
        return CodeExecutionResponse(
            status="error",
            output="",
            error=f"Unsupported language: '{language}'.",
            solution="Supported languages: python, c, cpp, java.",
        )

    image    = IMAGES[language]
    filename = FILENAMES[language]
    command  = COMMANDS[language]

    container = None

    try:
        with tempfile.TemporaryDirectory() as temp_dir:

            # ── Write source file ────────────────────────────────────────────
            code_path = os.path.join(temp_dir, filename)

            if language == "python":
                source = PYTHON_WRAPPER + request.code
            else:
                source = request.code

            with open(code_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(source)

            # ── Write input file ─────────────────────────────────────────────
            input_path = os.path.join(temp_dir, "input.txt")
            with open(input_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(_normalize_input(request.input or ""))

            # ── Run container (detached so we can enforce timeout) ───────────
            container = client.containers.run(
                image=image,
                command=["sh", "-c", command],
                volumes={temp_dir: {"bind": "/code", "mode": "rw"}},
                working_dir="/code",
                stdout=True,
                stderr=True,
                remove=False,      # we remove manually after reading logs
                network_disabled=True,
                mem_limit=MEM_LIMIT,
                nano_cpus=CPU_NANO,
                detach=True,       # detach=True so we can apply timeout
            )

            # ── Wait with timeout ────────────────────────────────────────────
            result = {"status_code": None, "timed_out": False}

            def _wait():
                r = container.wait()
                result["status_code"] = r.get("StatusCode", -1)

            t = threading.Thread(target=_wait, daemon=True)
            t.start()
            t.join(timeout=TIMEOUT_SECONDS)

            if t.is_alive():
                # TLE — kill container
                try:
                    container.kill()
                except Exception:
                    pass
                result["timed_out"] = True

            # ── Read logs ────────────────────────────────────────────────────
            try:
                stdout_raw = container.logs(stdout=True, stderr=False)
                stderr_raw = container.logs(stdout=False, stderr=True)
            except Exception:
                stdout_raw = b""
                stderr_raw = b""

            stdout_str = _decode(stdout_raw).rstrip()
            stderr_str = _decode(stderr_raw).rstrip()

            # ── Cleanup container ────────────────────────────────────────────
            try:
                container.remove(force=True)
            except Exception:
                pass
            container = None

            # ── TLE response ─────────────────────────────────────────────────
            if result["timed_out"]:
                return CodeExecutionResponse(
                    status="error",
                    output=stdout_str,   # partial output if any
                    error="⏱ Time Limit Exceeded (10 s)\n\nYour program ran longer than the allowed time limit.\nCheck for infinite loops or invalid input format causing loops.",
                    solution="Ensure input values match what your program expects. If scanf/cin receives invalid input types, it can cause infinite loops.",
                )

            # ── OOM / memory limit ───────────────────────────────────────────
            if result["status_code"] == 137:
                return CodeExecutionResponse(
                    status="error",
                    output=stdout_str,
                    error="💾 Memory Limit Exceeded (256 MB)\n\nYour program consumed more memory than the allowed limit.",
                    solution="Avoid creating very large lists, arrays, or recursive stacks. Release resources when no longer needed.",
                )

            # ── Compile error detection ──────────────────────────────────────
            if "__COMPILE_FAILED__" in stdout_str:
                compile_err = stdout_str.replace("__COMPILE_FAILED__", "").strip()
                if stderr_str:
                    compile_err = (compile_err + "\n" + stderr_str).strip()
                return CodeExecutionResponse(
                    status="error",
                    output="",
                    error="🔴 Compilation Error:\n\n" + compile_err,
                    solution=generate_solution_hint(language, compile_err),
                )

            # ── Runtime error (exit code != 0, but compiled OK) ──────────────
            if result["status_code"] not in (0, None):
                runtime_err = stderr_str or stdout_str or f"Process exited with code {result['status_code']}"
                return CodeExecutionResponse(
                    status="error",
                    output=stdout_str if stdout_str and stdout_str != runtime_err else "",
                    error="🟠 Runtime Error:\n\n" + runtime_err,
                    solution=generate_solution_hint(language, runtime_err),
                )

            # ── Success ──────────────────────────────────────────────────────
            final_output = stdout_str

            return CodeExecutionResponse(
                status="success",
                output=final_output,
                error="",
                solution="",
            )

    except docker.errors.ImageNotFound as e:
        return CodeExecutionResponse(
            status="error",
            output="",
            error=f"Docker image not found: {str(e)}\n\nThe required image needs to be pulled first.",
            solution=f"Run: docker pull {image}",
        )

    except docker.errors.APIError as e:
        err = str(e)
        return CodeExecutionResponse(
            status="error",
            output="",
            error=f"Docker API error: {err}",
            solution=generate_solution_hint(language, err),
        )

    except Exception as e:
        err = str(e)
        return CodeExecutionResponse(
            status="error",
            output="",
            error=f"Execution engine error: {err}",
            solution=generate_solution_hint(language, err),
        )

    finally:
        if container is not None:
            try:
                container.remove(force=True)
            except Exception:
                pass