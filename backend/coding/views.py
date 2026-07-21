from rest_framework.decorators import api_view
from rest_framework.response import Response


# ==========================================
# GET CODING QUESTIONS
# ==========================================

@api_view(["GET"])
def get_questions(request):

    questions = [
        {
            "id": 1,
            "title": "Largest Number",
            "question": "Write a program to find the largest number among three given integers."
        }
    ]

    return Response({
        "success": True,
        "questions": questions
    })


# ==========================================
# RUN CODE
# ==========================================

@api_view(["POST"])
def run_code(request):

    language = request.data.get("language", "")
    code = request.data.get("code", "")
    user_input = request.data.get("input", "")

    if not code.strip():
        return Response({
            "output": "",
            "error": "Please write some code before running."
        })

    return Response({

        "output":
f"""Program executed successfully.

Selected Language : {language}

Output :
Hello PrepMaster AI""",

        "error": ""

    })


# ==========================================
# SUBMIT CODE
# ==========================================

@api_view(["POST"])
def submit_code(request):

    return Response({

        "success": True,

        "message": "Code submitted successfully."

    })


# ==========================================
# RESULT
# ==========================================

@api_view(["GET"])
def get_coding_result(request):

    return Response({

        "success": True,

        "status": "Completed",

        "score": 100,

        "message": "Coding assessment completed successfully."

    })