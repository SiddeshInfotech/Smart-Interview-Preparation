import requests


EXECUTOR_URL = "http://127.0.0.1:8001/execute"


def execute_code(language, code, user_input=""):

    try:

        response = requests.post(

            EXECUTOR_URL,

            json={

                "language": language,

                "code": code,

                "input": user_input

            },

            timeout=120

        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "output": "",
            "error": f"Failed to reach Code Executor service: {str(e)}",
            "solution": "Ensure the FastAPI Code Executor service is running on http://127.0.0.1:8001."
        }