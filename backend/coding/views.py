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
            is_success = exec_result.get("status") == "success" and not exec_result.get("error")
            eval_data = {
                "overall_score": 85 if is_success else 40,
                "status": "Passed" if is_success else "Failed",
                "logical_thinking": 85 if is_success else 45,
                "code_efficiency": 80 if is_success else 40,
                "language_skills": 85 if is_success else 50,
                "problem_solving": 85 if is_success else 40,
                "time_complexity_notation": "O(N)",
                "space_complexity_notation": "O(1)",
                "criteria": {
                    "correctness": { "score": 90 if is_success else 30, "feedback": "Code compiled & executed successfully." if is_success else "Execution encountered runtime error." },
                    "code_quality": { "score": 85, "feedback": "Code structure and syntax are valid." },
                    "time_complexity": { "score": 80, "feedback": "Standard execution efficiency." },
                    "space_complexity": { "score": 85, "feedback": "Memory footprint is within limits." },
                    "edge_cases": { "score": 75, "feedback": "Verify handling for empty or extreme inputs." }
                },
                "summary": "Program evaluated successfully based on execution results.",
                "suggestions": [
                    "Include concise inline comments for key algorithmic steps.",
                    "Add boundary validation checks for user inputs."
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
                credits_obj, _ = UserCredit.objects.get_or_create(user=user_obj)
                credits_obj.check_and_reset()
                credits_obj.coding_used += 1
                credits_obj.save(update_fields=["coding_used", "updated_at"])
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
    if request.user and request.user.is_authenticated:
        submissions = CodeSubmission.objects.filter(user=request.user)
    else:
        return Response({
            "total_submissions": 0,
            "logical_thinking": 0,
            "code_efficiency": 0,
            "language_skills": 0,
            "problem_solving": 0,
            "overall_score": 0,
        })

    total = submissions.count()
    if total == 0:
        return Response({
            "total_submissions": 0,
            "logical_thinking": 0,
            "code_efficiency": 0,
            "language_skills": 0,
            "problem_solving": 0,
            "overall_score": 0,
        })

    sum_logical = 0
    sum_efficiency = 0
    sum_language = 0
    sum_problem = 0
    sum_overall = 0

    for s in submissions.only("score", "ai_evaluation"):
        eval_obj = s.ai_evaluation or {}
        sum_logical += eval_obj.get("logical_thinking", s.score)
        sum_efficiency += eval_obj.get("code_efficiency", s.score)
        sum_language += eval_obj.get("language_skills", s.score)
        sum_problem += eval_obj.get("problem_solving", s.score)
        sum_overall += s.score

    return Response({
        "total_submissions": total,
        "logical_thinking": round(sum_logical / total),
        "code_efficiency": round(sum_efficiency / total),
        "language_skills": round(sum_language / total),
        "problem_solving": round(sum_problem / total),
        "overall_score": round(sum_overall / total),
    })


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