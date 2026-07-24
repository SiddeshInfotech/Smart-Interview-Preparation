from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response


from .models import (
    CodingQuestion,
    CodeSubmission
)


from .serializers import (
    CodingQuestionSerializer
)


from .services.executor_client import execute_code



@api_view(["GET"])
@permission_classes([AllowAny])
def get_questions(request):
    questions = CodingQuestion.objects.all()
    serializer = CodingQuestionSerializer(
        questions,
        many=True
    )
    return Response({
        "success": True,
        "questions": serializer.data
    })



@api_view(["POST"])
@permission_classes([AllowAny])
def run_code(request):

    language = request.data.get("language")

    code = request.data.get("code")

    user_input = request.data.get(
        "input",
        ""
      
    )
    print("USER INPUT =", repr(user_input))
    if not code:
        return Response({
            "status": "error",
            "output": "",
            "error": "No code provided for execution.",
            "solution": "Please write or paste your program code in the editor before running."
        })


    result = execute_code(

        language,

        code,

        user_input

    )


    return Response(result)



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_code(request):

    question_id = request.data.get(
        "question_id"
    )

    language = request.data.get(
        "language"
    )

    code = request.data.get(
        "code"
    )

    user_input = request.data.get(
        "input",
        ""
    )


    result = execute_code(

        language,

        code,

        user_input

    )


    submission = CodeSubmission.objects.create(

        user=request.user,

        question_id=question_id,

        language=language,

        code=code,

        input_data=user_input,

        output=result.get(
            "output",
            ""
        ),

        error=result.get(
            "error",
            ""
        ),

        status=result.get(
            "status",
            "failed"
        ),

        score=100 if result.get(
            "status"
        ) == "success" else 0

    )


    return Response({

        "success":True,

        "submission_id":submission.id,

        "result":result

    })



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_coding_result(request):

    submissions = CodeSubmission.objects.filter(
        user=request.user
    )


    data=[]


    for item in submissions:

        data.append({

            "question":item.question.title,

            "language":item.language,

            "status":item.status,

            "score":item.score

        })


    return Response({

        "success":True,

        "results":data

    })


import json
import re
from ai.gemini_service import generate_content
from ai.prompts import coding_challenge_prompt

@api_view(["POST"])
@permission_classes([AllowAny])
def generate_coding_question(request):
    language = request.data.get("language", "Python")
    difficulty = request.data.get("difficulty", "Medium")
    custom_instruction = request.data.get("custom_instruction", "")

    prompt = coding_challenge_prompt(language, difficulty, custom_instruction)

    try:
        raw_response = generate_content(prompt)
        cleaned = re.sub(r"^```(json)?|```$", "", raw_response.strip(), flags=re.MULTILINE).strip()
        data = json.loads(cleaned)
        return Response({
            "success": True,
            "data": data
        })
    except Exception as e:
        print("Error generating coding question via Gemini:", e)
        return Response({
            "success": True,
            "data": {
                "title": f"{difficulty} {language} Problem",
                "problem_statement": f"Write a program in {language} to read integers from standard input and output their sum.",
                "sample_input": "10 20",
                "sample_output": "30",
                "hint": f"Use standard keyboard input reading in {language} and calculate the sum.",
                "solution": f"// Solution in {language}\n// Read input and print sum."
            }
        })