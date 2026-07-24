import requests
import os

# The FastAPI Code Executor microservice URL
EXECUTOR_URL = os.environ.get("EXECUTOR_URL", "http://127.0.0.1:8001/execute")

# Per-request HTTP timeout:
#  - connect: 10 s (fail fast if service is not up)
#  - read:    120 s (Allow enough time for compilation, execution, and Docker response)
HTTP_TIMEOUT = (10, 120)


def execute_code(language: str, code: str, user_input: str = "") -> dict:
    """
    Forward a code-execution request to the FastAPI Code Executor service.
    Returns a dict with keys: status, output, error, solution.
    """
    payload = {
        "language": language,
        "code":     code,
        "input":    user_input or "",
    }

    try:
        response = requests.post(
            EXECUTOR_URL,
            json=payload,
            timeout=HTTP_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.ConnectionError:
        return {
            "status":   "error",
            "output":   "",
            "error":    (
                "❌ Code Executor service is not running.\n\n"
                "The execution engine (FastAPI on port 8001) is offline.\n"
                "Please start it with:\n\n"
                "  cd backend/code_executor\n"
                "  pip install -r requirements.txt\n"
                "  uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
            ),
            "solution": (
                "Open a NEW terminal and run the command above. "
                "Keep that terminal running while you use the coding feature."
            ),
        }

    except requests.exceptions.ReadTimeout:
        return {
            "status":   "error",
            "output":   "",
            "error":    (
                "⏱ Request timed out.\n\n"
                "The execution service took too long to respond."
            ),
            "solution": (
                "Check for infinite loops in your program or ensure Docker Desktop is responsive."
            ),
        }

    except requests.exceptions.HTTPError as e:
        return {
            "status":   "error",
            "output":   "",
            "error":    f"Code Executor returned an error: {e.response.status_code} {e.response.text}",
            "solution": "Restart the Code Executor service.",
        }

    except Exception as e:
        return {
            "status":   "error",
            "output":   "",
            "error":    f"Unexpected error contacting Code Executor: {str(e)}",
            "solution": "Ensure the Code Executor service is running on port 8001.",
        }