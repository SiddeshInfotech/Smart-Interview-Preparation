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
    start_date = today - timedelta(days=6)

    quiz_qs = QuizPerformance.objects.filter(user=user) if user else QuizPerformance.objects.none()
    coding_qs = CodeSubmission.objects.filter(user=user) if user else CodeSubmission.objects.none()
    int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else InterviewFeedbackReview.objects.none()

    overall_quiz = round(quiz_qs.aggregate(avg=Avg("score"))["avg"] or 0, 1) if user else 0
    overall_coding = round(coding_qs.aggregate(avg=Avg("score"))["avg"] or 0, 1) if user else 0

    def calc_review_summary_pct(reviews_qs):
        aggs = reviews_qs.aggregate(
            tech=Avg("technical_skills"),
            comm=Avg("communication_skills"),
            prob=Avg("problem_solving"),
            soft=Avg("soft_skills"),
            code=Avg("code_quality"),
            overall=Avg("overall_rating"),
        )
        tech = aggs["tech"] or 0
        comm = aggs["comm"] or 0
        prob = aggs["prob"] or 0
        soft = aggs["soft"] or 0
        code = aggs["code"] or 0
        overall = aggs["overall"] or 0
        if not any([tech, comm, prob, soft, code, overall]):
            return 0.0
        summary_avg = (tech + comm + prob + soft + code) / 5.0 if any([tech, comm, prob, soft, code]) else overall
        return round((float(summary_avg) / 5.0) * 100, 1)

    overall_interview = calc_review_summary_pct(int_reviews) if candidate_profile else 0.0

    daily_data = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_name = target_date.strftime("%a")

        # 1. Cumulative Quiz Average up to target_date
        quiz_sub = quiz_qs.filter(created_at__date__lte=target_date) if user else QuizPerformance.objects.none()
        if quiz_sub.exists():
            quiz_val = round(quiz_sub.aggregate(avg=Avg("score"))["avg"] or 0, 1)
        else:
            quiz_val = 0.0

        # 2. Cumulative Coding Average up to target_date
        coding_sub = coding_qs.filter(submitted_at__date__lte=target_date) if user else CodeSubmission.objects.none()
        if coding_sub.exists():
            coding_val = round(coding_sub.aggregate(avg=Avg("score"))["avg"] or 0, 1)
        else:
            coding_val = 0.0

        # 3. Cumulative Interview Rating up to target_date
        int_sub = int_reviews.filter(submitted_at__date__lte=target_date) if candidate_profile else InterviewFeedbackReview.objects.none()
        if int_sub.exists():
            interview_val = calc_review_summary_pct(int_sub)
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
    - Interview Skill (from completed interview feedback summary avg of all stats)
    - Overall Readiness (computed dynamic average)
    - Completed Modules & Strongest Skill Area
    """
    user = request.user if request.user and request.user.is_authenticated else None
    candidate_profile = Candidate_Profile.objects.filter(user=user).first() if user else None

    # 1. Quiz Score (0-100)
    quiz_qs = QuizPerformance.objects.filter(user=user) if user else QuizPerformance.objects.none()
    quiz_score = round(quiz_qs.aggregate(avg=Avg("score"))["avg"] or 0) if user else 0

    # 2. Coding Score (0-100)
    coding_qs = CodeSubmission.objects.filter(user=user) if user else CodeSubmission.objects.none()
    coding_score = round(coding_qs.aggregate(avg=Avg("score"))["avg"] or 0) if user else 0

    # 3. Interview Score (0-100)
    int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else None
    if int_reviews and int_reviews.exists():
        aggs = int_reviews.aggregate(
            tech=Avg("technical_skills"),
            comm=Avg("communication_skills"),
            prob=Avg("problem_solving"),
            soft=Avg("soft_skills"),
            code=Avg("code_quality"),
            overall=Avg("overall_rating"),
        )
        tech = aggs["tech"] or 0
        comm = aggs["comm"] or 0
        prob = aggs["prob"] or 0
        soft = aggs["soft"] or 0
        code = aggs["code"] or 0
        overall = aggs["overall"] or 0
        summary_avg = (tech + comm + prob + soft + code) / 5.0 if any([tech, comm, prob, soft, code]) else overall
        interview_score = round((float(summary_avg) / 5.0) * 100)
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