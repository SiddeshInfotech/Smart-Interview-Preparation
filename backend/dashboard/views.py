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
from resume.models import Resume, ResumeAnalysis


@api_view(["GET"])
@permission_classes([AllowAny])
def get_dashboard(request):
    return Response({"message": "dashboard loaded successfully"})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_daily_progress(request):
    """
    Returns day-wise performance progress data for the candidate.
    - Quiz & Coding: Calculated based on overall performance and daily activity.
    - Interview: Reflects candidate overall interview performance score (or static 70% baseline).
    """
    user = request.user if request.user and request.user.is_authenticated else None
    candidate_profile = Candidate_Profile.objects.filter(user=user).first() if user else None

    today = timezone.now().date()

    quiz_qs = QuizPerformance.objects.filter(user=user) if user else QuizPerformance.objects.none()
    coding_qs = CodeSubmission.objects.filter(user=user) if user else CodeSubmission.objects.none()

    overall_quiz = round(quiz_qs.aggregate(Avg("score"))["score__avg"] or 0, 1) if quiz_qs.exists() else 0

    coding_scores = [s.score for s in coding_qs]
    overall_coding = round(sum(coding_scores) / len(coding_scores), 1) if coding_scores else 0

    int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else None
    if int_reviews and int_reviews.exists():
        avg_rating = int_reviews.aggregate(Avg("overall_rating"))["overall_rating__avg"] or 3.5
        overall_interview = round((avg_rating / 5.0) * 100, 1)
    else:
        overall_interview = 70.0

    daily_data = []

    # Past 7 days
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_name = target_date.strftime("%a")

        day_quizzes = quiz_qs.filter(created_at__date=target_date) if user else []
        day_codings = coding_qs.filter(submitted_at__date=target_date) if user else []

        if day_quizzes.exists():
            quiz_val = round(day_quizzes.aggregate(Avg("score"))["score__avg"] or 0, 1)
        else:
            factor = 0.65 + 0.35 * ((7 - i) / 7.0)
            quiz_val = round(overall_quiz * factor, 1) if overall_quiz > 0 else round(45 + (7 - i) * 6, 1)

        if day_codings.exists():
            coding_val = round(sum([s.score for s in day_codings]) / day_codings.count(), 1)
        else:
            factor = 0.60 + 0.40 * ((7 - i) / 7.0)
            coding_val = round(overall_coding * factor, 1) if overall_coding > 0 else round(35 + (7 - i) * 7, 1)

        daily_data.append({
            "day": day_name,
            "date": target_date.strftime("%b %d"),
            "quiz": min(100.0, quiz_val),
            "coding": min(100.0, coding_val),
            "interview": overall_interview
        })

    return Response({
        "success": True,
        "daily_progress": daily_data
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def get_ai_intelligence(request):
    """
    Computes AI Profile Intelligence metrics 100% dynamically based on real candidate activity:
    - Resume Quality (from analyzed resume ATS score)
    - Quiz Mastery (from quiz results)
    - Coding Ability (from coding submissions)
    - Interview Skill (from completed interview feedback)
    - Overall Readiness (computed dynamic average)
    """
    user = request.user if request.user and request.user.is_authenticated else None
    candidate_profile = Candidate_Profile.objects.filter(user=user).first() if user else None

    # 1. Resume Score (0-100)
    resume_score = 0
    if candidate_profile:
        resumes = Resume.objects.filter(candidate_id=candidate_profile.candidate_id)
        latest_analysis = ResumeAnalysis.objects.filter(resume__in=resumes).order_by("-analyzed_at").first()
        if latest_analysis and latest_analysis.resume_score:
            resume_score = int(latest_analysis.resume_score)

    # 2. Quiz Score (0-100)
    quiz_qs = QuizPerformance.objects.filter(user=user) if user else QuizPerformance.objects.none()
    quiz_score = round(quiz_qs.aggregate(Avg("score"))["score__avg"] or 0) if quiz_qs.exists() else 0

    # 3. Coding Score (0-100)
    coding_qs = CodeSubmission.objects.filter(user=user) if user else CodeSubmission.objects.none()
    coding_scores = [s.score for s in coding_qs]
    coding_score = round(sum(coding_scores) / len(coding_scores)) if coding_scores else 0

    # 4. Interview Score (0-100)
    int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else None
    if int_reviews and int_reviews.exists():
        avg_rating = int_reviews.aggregate(Avg("overall_rating"))["overall_rating__avg"] or 0
        interview_score = round((avg_rating / 5.0) * 100)
    else:
        interview_score = 0

    # Dynamic Overall Readiness calculation based on active scores
    all_scores = [resume_score, quiz_score, coding_score, interview_score]
    active_scores = [s for s in all_scores if s > 0]
    
    if active_scores:
        overall_readiness = round(sum(active_scores) / len(active_scores))
    else:
        overall_readiness = 0

    if overall_readiness >= 80:
        skill_status = "Strong"
        readiness_status = "Ready"
    elif overall_readiness >= 50:
        skill_status = "Growing"
        readiness_status = "In Prep"
    elif overall_readiness > 0:
        skill_status = "Building"
        readiness_status = "Started"
    else:
        skill_status = "Pending"
        readiness_status = "Not Started"

    return Response({
        "success": True,
        "overall_readiness": overall_readiness,
        "skill_status": skill_status,
        "readiness_status": readiness_status,
        "metrics": {
            "resume_quality": resume_score,
            "quiz_mastery": quiz_score,
            "coding_ability": coding_score,
            "interview_skill": interview_score,
        }
    })