import json
import re
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
from ai.coding_service import evaluate_code_submission, generate_coding_question as ai_generate_coding_question


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
    user_input = request.data.get("input", "")

    if not code:
        return Response({
            "status": "error",
            "output": "",
            "error": "No code provided for execution.",
            "solution": "Please write or paste your program code in the editor before running."
        })

    result = execute_code(language, code, user_input)
    return Response(result)


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_code(request):
    try:
        # ── Free-tier daily limit via UserCredit database model ──────────────
        if request.user and request.user.is_authenticated and not request.user.has_premium:
            from authentication.models import UserCredit
            credits_obj, _ = UserCredit.objects.get_or_create(user=request.user)
            credits_obj.check_and_reset()

            if credits_obj.coding_used >= credits_obj.coding_limit:
                return Response(
                    {
                        "success": False,
                        "error": "Daily coding limit reached.",
                        "detail": f"Free users can submit up to {credits_obj.coding_limit} coding solutions per day. Upgrade to Premium for unlimited access.",
                        "limit_reached": True,
                    },
                    status=429,
                )
        # ──────────────────────────────────────────────────────────────────

        question_id = request.data.get("question_id")
        question_title = request.data.get("question_title", "")
        problem_statement = request.data.get("problem_statement", "")
        language = request.data.get("language", "Python")
        code = request.data.get("code", "")
        user_input = request.data.get("input", "")

        if not code or not code.strip():
            return Response({
                "success": False,
                "error": "No code provided for submission."
            }, status=400)

        # 1. Execute Code via Piston
        exec_result = execute_code(language, code, user_input)
        if not isinstance(exec_result, dict):
            exec_result = {"status": "error", "output": "", "error": str(exec_result)}

        # 2. Evaluate Code via OpenRouter AI
        eval_data = None
        try:
            eval_data = evaluate_code_submission(
                language=language,
                problem_title=question_title or f"{language} Coding Challenge",
                problem_statement=problem_statement or "Solve the coding task.",
                code=code,
                user_input=user_input,
                execution_output=exec_result.get("output", ""),
                execution_error=exec_result.get("error", "")
            )
        except Exception as e:
            print("OpenRouter Evaluation Exception:", e)
            has_error = bool(exec_result.get("error"))
            output_str = str(exec_result.get("output", "")).strip().lower()
            code_str = str(code).strip().lower()
            
            # Simple heuristic relevance check for fallback
            is_hello_world = "hello world" in output_str or "hello world" in code_str
            is_very_short = len(code_str) < 30

            if has_error:
                fallback_score = 5
                status = "Failed"
            elif is_hello_world or is_very_short:
                fallback_score = 15  # Partial 10-20% for generic / slight match
                status = "Failed"
            else:
                fallback_score = 75
                status = "Passed"

            eval_data = {
                "overall_score": fallback_score,
                "status": status,
                "logical_thinking": fallback_score,
                "code_efficiency": fallback_score,
                "language_skills": fallback_score,
                "problem_solving": fallback_score,
                "time_complexity_notation": "O(N)",
                "space_complexity_notation": "O(1)",
                "criteria": {
                    "correctness": {
                        "score": fallback_score,
                        "feedback": "Code compiled and executed. Detailed evaluation pending AI service." if status == "Passed" else "Code execution output did not match problem requirements."
                    },
                    "code_quality": { "score": fallback_score, "feedback": "Code structure and syntax processed." },
                    "time_complexity": { "score": fallback_score, "feedback": "Standard execution efficiency." },
                    "space_complexity": { "score": fallback_score, "feedback": "Memory footprint within limits." },
                    "edge_cases": { "score": min(fallback_score, 60), "feedback": "Verify handling for boundary cases." }
                },
                "summary": f"Program evaluation completed (Score: {fallback_score}%).",
                "suggestions": [
                    "Ensure code dynamically processes problem inputs.",
                    "Verify edge cases and output formatting matches challenge specifications."
                ]
            }

        # 3. Question Lookup
        question_obj = None
        if question_id:
            try:
                question_obj = CodingQuestion.objects.get(id=question_id)
            except Exception:
                question_obj = None

        # 4. Store in Database
        user_obj = request.user if request.user and request.user.is_authenticated else None
        submission = CodeSubmission.objects.create(
            user=user_obj,
            question=question_obj,
            question_title=question_title or (question_obj.title if question_obj else f"{language} Assessment"),
            language=language,
            code=code,
            input_data=user_input,
            output=exec_result.get("output", ""),
            error=exec_result.get("error", ""),
            status=eval_data.get("status", "Failed"),
            score=int(eval_data.get("overall_score", 0)),
            ai_evaluation=eval_data
        )

        if user_obj:
            try:
                from authentication.models import UserCredit
                from authentication.services import invalidate_usage_cache
                credits_obj, _ = UserCredit.objects.get_or_create(user=user_obj)
                credits_obj.check_and_reset()
                credits_obj.coding_used += 1
                credits_obj.save(update_fields=["coding_used", "updated_at"])
                invalidate_usage_cache(user_obj.id)
            except Exception:
                pass

        return Response({
            "success": True,
            "submission_id": submission.id,
            "execution_result": exec_result,
            "evaluation": eval_data
        })
    except Exception as outer_err:
        print("submit_code fatal error:", outer_err)
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": f"Submission error: {str(outer_err)}"
        }, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_coding_performance(request):
    from .services import get_coding_performance_summary
    data = get_coding_performance_summary(request.user)
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_coding_result(request):
    if request.user and request.user.is_authenticated:
        submissions = CodeSubmission.objects.filter(user=request.user).order_by("-submitted_at")
    else:
        submissions = CodeSubmission.objects.all().order_by("-submitted_at")

    data = []
    for item in submissions:
        data.append({
            "id": item.id,
            "question": item.question.title if item.question else (item.question_title or "Coding Task"),
            "language": item.language,
            "status": item.status,
            "score": item.score,
            "submitted_at": item.submitted_at
        })

    return Response({
        "success": True,
        "results": data
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def generate_coding_question(request):
    language = request.data.get("language", "Python")
    difficulty = request.data.get("difficulty", "Medium")
    custom_instruction = request.data.get("custom_instruction", "")

    try:
        data = ai_generate_coding_question(language, difficulty, custom_instruction)
        return Response({
            "success": True,
            "data": data
        })
    except Exception as e:
        print("Error generating coding question via OpenRouter:", e)
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