import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ai.prompts import quiz_generation_prompt
from ai.gemini_service import generate_content   # corrected import
from .models import QuizPerformance
from django.db.models import Avg, Max, Min

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

    quizzes = QuizPerformance.objects.filter(user=request.user)

    if not quizzes.exists():
        return Response({
            "total_quizzes": 0,
            "minimum_score": 0,
            "maximum_score": 0,
            "average_score": 0,
            "overall_score": 0
        })

    data = {
        "total_quizzes": quizzes.count(),
        "minimum_score": quizzes.aggregate(Min("score"))["score__min"] or 0,
        "maximum_score": quizzes.aggregate(Max("score"))["score__max"] or 0,
        "average_score": round(quizzes.aggregate(Avg("score"))["score__avg"] or 0, 2),
        "overall_score": round(quizzes.aggregate(Avg("score"))["score__avg"] or 0, 2),
    }

    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_quiz_result(request):

    try:
        data = request.data

        result = QuizPerformance.objects.create(
            user=request.user,
            total_questions=data.get("total_questions"),
            correct_answers=data.get("correct_answers"),
            wrong_answers=data.get("wrong_answers"),
            skipped_answers=data.get("skipped_answers"),
            score=data.get("score")
        )

        return Response({
            "message": "Quiz result saved successfully",
            "result_id": result.id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)