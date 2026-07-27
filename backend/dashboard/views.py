from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg

from quiz.models import QuizPerformance
from coding.models import CodeSubmission
from candidate.models import Candidate_Profile
from interview.models import InterviewFeedbackReview


@api_view(["GET"])
@permission_classes([AllowAny])
def get_dashboard(request):
    return Response({"message": "dashboard loaded successfully"})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_daily_progress(request):
    """
    Returns dynamic day-wise performance progress data for the candidate across:
    - Quiz & Coding: Calculated based on overall performance and daily activity.
    - Interview: Calculated dynamically per-day based on completed feedback assessments. Returns 0% if unattempted.
    """
    user = request.user if request.user and request.user.is_authenticated else None
    candidate_profile = Candidate_Profile.objects.filter(user=user).first() if user else None

    today = timezone.now().date()

    quiz_qs = QuizPerformance.objects.filter(user=user) if user else QuizPerformance.objects.none()
    coding_qs = CodeSubmission.objects.filter(user=user) if user else CodeSubmission.objects.none()
    int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else InterviewFeedbackReview.objects.none()

    overall_quiz = round(quiz_qs.aggregate(Avg("score"))["score__avg"] or 0, 1) if quiz_qs.exists() else 0

    coding_scores = [s.score for s in coding_qs]
    overall_coding = round(sum(coding_scores) / len(coding_scores), 1) if coding_scores else 0

    if int_reviews.exists():
        avg_rating = int_reviews.aggregate(Avg("overall_rating"))["overall_rating__avg"] or 0.0
        overall_interview = round((avg_rating / 5.0) * 100, 1)
    else:
        overall_interview = 0.0

    daily_data = []

    # Past 7 days
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_name = target_date.strftime("%a")

        day_quizzes = quiz_qs.filter(created_at__date=target_date) if user else QuizPerformance.objects.none()
        day_codings = coding_qs.filter(submitted_at__date=target_date) if user else CodeSubmission.objects.none()
        day_interviews = int_reviews.filter(submitted_at__date=target_date) if candidate_profile else InterviewFeedbackReview.objects.none()

        if day_quizzes.exists():
            quiz_val = round(day_quizzes.aggregate(Avg("score"))["score__avg"] or 0, 1)
        else:
            factor = 0.65 + 0.35 * ((7 - i) / 7.0)
            quiz_val = round(overall_quiz * factor, 1) if overall_quiz > 0 else 0.0

        if day_codings.exists():
            coding_val = round(sum([s.score for s in day_codings]) / day_codings.count(), 1)
        else:
            factor = 0.60 + 0.40 * ((7 - i) / 7.0)
            coding_val = round(overall_coding * factor, 1) if overall_coding > 0 else 0.0

        # Dynamic day-wise Interview Performance evaluation
        if day_interviews.exists():
            day_rating = day_interviews.aggregate(Avg("overall_rating"))["overall_rating__avg"] or 0.0
            interview_val = round((day_rating / 5.0) * 100, 1)
        else:
            historical_reviews = int_reviews.filter(submitted_at__date__lte=target_date) if candidate_profile else InterviewFeedbackReview.objects.none()
            if historical_reviews.exists():
                hist_rating = historical_reviews.aggregate(Avg("overall_rating"))["overall_rating__avg"] or 0.0
                interview_val = round((hist_rating / 5.0) * 100, 1)
            else:
                interview_val = 0.0

        daily_data.append({
            "day": day_name,
            "date": target_date.strftime("%b %d"),
            "quiz": min(100.0, max(0.0, quiz_val)),
            "coding": min(100.0, max(0.0, coding_val)),
            "interview": min(100.0, max(0.0, interview_val))
        })

    return Response({
        "success": True,
        "daily_progress": daily_data
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def get_ai_intelligence(request):
    """
    Computes AI Profile Intelligence metrics 100% dynamically based on candidate tasks:
    - Quiz Mastery (from quiz results)
    - Coding Ability (from coding submissions)
    - Interview Skill (from completed interview feedback)
    - Overall Readiness (computed dynamic average)
    - Completed Modules & Strongest Skill Area
    """
    user = request.user if request.user and request.user.is_authenticated else None
    candidate_profile = Candidate_Profile.objects.filter(user=user).first() if user else None

    # 1. Quiz Score (0-100)
    quiz_qs = QuizPerformance.objects.filter(user=user) if user else QuizPerformance.objects.none()
    quiz_score = round(quiz_qs.aggregate(Avg("score"))["score__avg"] or 0) if quiz_qs.exists() else 0

    # 2. Coding Score (0-100)
    coding_qs = CodeSubmission.objects.filter(user=user) if user else CodeSubmission.objects.none()
    coding_scores = [s.score for s in coding_qs]
    coding_score = round(sum(coding_scores) / len(coding_scores)) if coding_scores else 0

    # 3. Interview Score (0-100)
    int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else None
    if int_reviews and int_reviews.exists():
        avg_rating = int_reviews.aggregate(Avg("overall_rating"))["overall_rating__avg"] or 0
        interview_score = round((avg_rating / 5.0) * 100)
    else:
        interview_score = 0

    # Dynamic Overall Readiness & Module Analytics
    tasks = [
        {"name": "Quiz", "score": quiz_score},
        {"name": "Coding", "score": coding_score},
        {"name": "Interview", "score": interview_score},
    ]
    active_tasks = [t for t in tasks if t["score"] > 0]

    if active_tasks:
        overall_readiness = round(sum(t["score"] for t in active_tasks) / len(active_tasks))
        active_tasks.sort(key=lambda x: x["score"], reverse=True)
        top_skill = active_tasks[0]["name"]
    else:
        overall_readiness = 0
        top_skill = "N/A"

    completed_modules = f"{len(active_tasks)} / 3"

    return Response({
        "success": True,
        "overall_readiness": overall_readiness,
        "completed_modules": completed_modules,
        "top_skill": top_skill,
        "metrics": {
            "quiz_mastery": quiz_score,
            "coding_ability": coding_score,
            "interview_skill": interview_score,
        }
    })