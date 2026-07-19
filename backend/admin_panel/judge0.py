"""
Thin client around the Judge0 CE API (https://judge0.com).

Keeps all Judge0-specific concerns (language IDs, request/response shape,
polling) out of the views so the rest of the app only deals with our own
Submission model.
"""
import time

import requests
from django.conf import settings

# Judge0 CE language IDs for the languages this app exposes.
# Full list: https://ce.judge0.com/#statuses-and-languages-language-get
LANGUAGE_ID_MAP = {
    "python": 71,      # Python 3.8.1
    "javascript": 63,  # JavaScript (Node.js 12.14.0)
    "java": 62,        # Java (OpenJDK 13.0.1)
    "cpp": 54,         # C++ (GCC 9.2.0)
    "c": 50,           # C (GCC 9.2.0)
}

# Judge0 status IDs: 1=In Queue, 2=Processing, 3=Accepted, >3 means some
# kind of error, timeout, or non-zero exit.
TERMINAL_STATUS_IDS = set(range(3, 15))


class Judge0Error(Exception):
    """Raised when Judge0 can't be reached or returns something unusable."""


def _headers():
    return {
        "content-type": "application/json",
        "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
        "X-RapidAPI-Host": settings.JUDGE0_API_HOST,
    }


def submit_code(language: str, source_code: str, stdin: str = "", timeout: int = 15) -> dict:
    """
    Submit code to Judge0 and wait (via polling) for a terminal result.

    Returns a dict with keys: status_id, status_description, stdout, stderr,
    compile_output, time, memory, token.
    """
    if language not in LANGUAGE_ID_MAP:
        raise Judge0Error(f"Unsupported language: {language}")

    if not settings.JUDGE0_API_KEY:
        raise Judge0Error(
            "JUDGE0_API_KEY is not configured. Set it in backend/.env "
            "(see .env.example)."
        )

    payload = {
        "language_id": LANGUAGE_ID_MAP[language],
        "source_code": source_code,
        "stdin": stdin,
    }

    create_url = f"{settings.JUDGE0_API_URL}/submissions"
    try:
        resp = requests.post(
            create_url,
            params={"base64_encoded": "false", "wait": "false"},
            json=payload,
            headers=_headers(),
            timeout=10,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise Judge0Error(f"Failed to create submission: {exc}") from exc

    token = resp.json().get("token")
    if not token:
        raise Judge0Error("Judge0 did not return a submission token.")

    result_url = f"{settings.JUDGE0_API_URL}/submissions/{token}"
    deadline = time.time() + timeout

    while time.time() < deadline:
        try:
            poll = requests.get(
                result_url,
                params={"base64_encoded": "false"},
                headers=_headers(),
                timeout=10,
            )
            poll.raise_for_status()
        except requests.RequestException as exc:
            raise Judge0Error(f"Failed to poll submission result: {exc}") from exc

        data = poll.json()
        status_id = data.get("status", {}).get("id")

        if status_id in TERMINAL_STATUS_IDS:
            return {
                "token": token,
                "status_id": status_id,
                "status_description": data.get("status", {}).get("description", ""),
                "stdout": data.get("stdout") or "",
                "stderr": data.get("stderr") or "",
                "compile_output": data.get("compile_output") or "",
                "time": data.get("time"),
                "memory": data.get("memory"),
            }

        time.sleep(0.7)

    raise Judge0Error("Timed out waiting for Judge0 to finish executing the code.")
