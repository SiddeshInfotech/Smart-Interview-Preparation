import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ai.prompts import quiz_generation_prompt
from ai.gemini_service import generate_content   # corrected import

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    data = request.data
    topics = data.get('topics', [])
    difficulty = data.get('difficulty', 'Medium')
    mode = data.get('mode', 'MCQ')
    question_count = data.get('question_count', 10)
    custom_instruction = data.get('custom_instruction', '')

    if not topics:
        return Response({"error": "At least one topic is required."}, status=400)

    prompt = quiz_generation_prompt(
        topics=topics,
        difficulty=difficulty,
        count=question_count,
        mode=mode,
        custom_instruction=custom_instruction,
    )

    try:
        raw_text = generate_content(prompt)

        if raw_text.startswith('```json'):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith('```'):
            raw_text = raw_text[3:-3]

        questions = json.loads(raw_text)

        for q in questions:
            if not all(k in q for k in ('text', 'options', 'correct', 'explanation')):
                return Response(
                    {"error": "Generated questions are missing required fields."},
                    status=500
                )

        return Response({"questions": questions}, status=200)

    except Exception as e:
        return Response({"error": f"AI generation failed: {str(e)}"}, status=500)

        # =====================================
# QUIZ PERFORMANCE FOR DASHBOARD
# =====================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_performance(request):



    data = {

        "total_quizzes": 28,

        "minimum_score": 48,

        "maximum_score": 97,

        "average_score": 91,

        "overall_score": 91

    }


    return Response(data)