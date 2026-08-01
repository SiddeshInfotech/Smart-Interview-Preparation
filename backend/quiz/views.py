import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ai.quiz_service import generate_quiz_questions

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_quiz(request):
    # ── Free-tier daily limit via UserCredit database model ──────────────────
    if request.user and request.user.is_authenticated and not request.user.has_premium:
        from authentication.models import UserCredit
        credits_obj, _ = UserCredit.objects.get_or_create(user=request.user)
        credits_obj.check_and_reset()

        if credits_obj.quiz_used >= credits_obj.quiz_limit:
            return Response(
                {
                    "error": "Daily quiz limit reached.",
                    "detail": f"Free users can take up to {credits_obj.quiz_limit} quiz sessions per day. Upgrade to Premium for unlimited access.",
                    "limit_reached": True,
                },
                status=429,
            )
    # ──────────────────────────────────────────────────────────────────────

    data = request.data
    topics = data.get('topics', [])
    difficulty = data.get('difficulty', 'Medium')
    mode = data.get('mode', 'MCQ')
    question_count = data.get('question_count', 10)
    custom_instruction = data.get('custom_instruction', '')

    if not topics:
        return Response({"error": "At least one topic is required."}, status=400)

    try:
        questions = generate_quiz_questions(
            topics=topics,
            difficulty=difficulty,
            count=question_count,
            mode=mode,
            custom_instruction=custom_instruction,
        )

        for q in questions:
            if not isinstance(q, dict) or not all(k in q for k in ('text', 'options', 'correct', 'explanation')):
                return Response(
                    {"error": "Generated questions are missing required fields."},
                    status=500
                )

        return Response({"questions": questions}, status=200)

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[QuizView] AI generation failed: {e}", exc_info=True)
        return Response({"error": f"AI generation failed: {str(e)}"}, status=500)


# =====================================
# QUIZ PERFORMANCE FOR DASHBOARD
# =====================================

from .services import get_quiz_performance_summary, invalidate_quiz_cache


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_performance(request):
    data = get_quiz_performance_summary(request.user)
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

        invalidate_quiz_cache(request.user.id)

        try:
            from authentication.models import UserCredit
            from authentication.services import invalidate_usage_cache
            credits_obj, _ = UserCredit.objects.get_or_create(user=request.user)
            credits_obj.check_and_reset()
            credits_obj.quiz_used += 1
            credits_obj.save(update_fields=["quiz_used", "updated_at"])
            invalidate_usage_cache(request.user.id)
        except Exception:
            pass

        return Response({
            "message": "Quiz result saved successfully",
            "result_id": result.id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)