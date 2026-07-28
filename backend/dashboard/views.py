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

    # Bulk fetch daily averages for the past 7 days in single database queries
    quiz_daily_map = {}
    if user:
        for row in quiz_qs.filter(created_at__date__gte=start_date).values("created_at__date").annotate(avg_score=Avg("score")):
            quiz_daily_map[row["created_at__date"]] = round(row["avg_score"] or 0, 1)

    coding_daily_map = {}
    if user:
        for row in coding_qs.filter(submitted_at__date__gte=start_date).values("submitted_at__date").annotate(avg_score=Avg("score")):
            coding_daily_map[row["submitted_at__date"]] = round(row["avg_score"] or 0, 1)

    # Pre-fetch interview reviews for the past 7 days
    reviews_by_date = {}
    if candidate_profile:
        for r in int_reviews.filter(submitted_at__date__gte=start_date):
            d = r.submitted_at.date()
            if d not in reviews_by_date:
                reviews_by_date[d] = []
            reviews_by_date[d].append(r)

    daily_data = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_name = target_date.strftime("%a")

        if target_date in quiz_daily_map:
            quiz_val = quiz_daily_map[target_date]
        else:
            factor = 0.65 + 0.35 * ((7 - i) / 7.0)
            quiz_val = round(overall_quiz * factor, 1) if overall_quiz > 0 else 0.0

        if target_date in coding_daily_map:
            coding_val = coding_daily_map[target_date]
        else:
            factor = 0.60 + 0.40 * ((7 - i) / 7.0)
            coding_val = round(overall_coding * factor, 1) if overall_coding > 0 else 0.0

        if target_date in reviews_by_date:
            day_revs = reviews_by_date[target_date]
            tech = sum(r.technical_skills for r in day_revs) / len(day_revs)
            comm = sum(r.communication_skills for r in day_revs) / len(day_revs)
            prob = sum(r.problem_solving for r in day_revs) / len(day_revs)
            soft = sum(r.soft_skills for r in day_revs) / len(day_revs)
            code = sum(r.code_quality for r in day_revs) / len(day_revs)
            overall_r = sum(float(r.overall_rating) for r in day_revs) / len(day_revs)
            summary_avg = (tech + comm + prob + soft + code) / 5.0 if any([tech, comm, prob, soft, code]) else overall_r
            interview_val = round((summary_avg / 5.0) * 100, 1)
        elif candidate_profile and int_reviews.filter(submitted_at__date__lte=target_date).exists():
            interview_val = overall_interview
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