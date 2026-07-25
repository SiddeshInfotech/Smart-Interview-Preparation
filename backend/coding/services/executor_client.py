import requests
from compiler.services import piston_service

EXECUTOR_URL = "http://127.0.0.1:8001/execute"


def execute_code(language, code, user_input=""):
    """
    Executes code using Piston API service (with fallback to legacy FastAPI executor).
    Returns normalized dictionary contract expected by coding app views.
    """
    # 1. Primary: Use Piston API execution service
    result = piston_service.execute(language=language, code=code, stdin=user_input)

    # If Piston executed (either success, compile_error, runtime_error, or timeout)
    if result.get("status") in ["success", "compile_error", "runtime_error", "timeout"]:
        return result

    # 2. Fallback: Legacy FastAPI executor if Piston API is unreachable
    try:
        response = requests.post(
            EXECUTOR_URL,
            json={
                "language": language,
                "code": code,
                "input": user_input
            },
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException:
        # Return the Piston result if fallback also fails
        return result