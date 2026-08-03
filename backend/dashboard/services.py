import logging
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Avg

from quiz.models import QuizPerformance
from coding.models import CodeSubmission
from candidate.models import Candidate_Profile
from interview.models import InterviewFeedbackReview

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # 60 seconds


def get_optimized_daily_progress(user):
    """
    Computes 7-day day-specific performance for Quiz, Coding, and Interview.
    Evaluates candidate's activity strictly on each specific day.
    If candidate did not participate in any activity on a given day, that day's score is 0%.
    """
    if not user or not user.is_authenticated:
        return [
            {
                "day": (timezone.now().date() - timedelta(days=i)).strftime("%a"),
                "date": (timezone.now().date() - timedelta(days=i)).strftime("%b %d"),
                "quiz": 0.0,
                "coding": 0.0,
                "interview": 0.0,
            }
            for i in range(6, -1, -1)
        ]

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"daily_progress_data_{user_pk}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        today = timezone.now().date()
        candidate_profile = Candidate_Profile.objects.filter(user=user).first()

        # 1 Bulk Query for Quizzes
        quizzes = list(
            QuizPerformance.objects.filter(user=user)
            .only("created_at", "score")
            .order_by("created_at")
        )

        # 1 Bulk Query for Code Submissions
        coding_submissions = list(
            CodeSubmission.objects.filter(user=user)
            .only("submitted_at", "score")
            .order_by("submitted_at")
        )

        # 1 Bulk Query for Interview Reviews
        int_reviews = list(
            InterviewFeedbackReview.objects.filter(candidate=candidate_profile)
            .only("submitted_at", "technical_skills", "communication_skills", "problem_solving", "soft_skills", "overall_rating")
            .order_by("submitted_at")
        ) if candidate_profile else []

        daily_data = []
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            day_name = target_date.strftime("%a")

            # 1. Day-specific Quiz Avg (Strictly for activities on target_date)
            quiz_sub = [q.score for q in quizzes if q.created_at and q.created_at.date() == target_date]
            quiz_val = round(sum(quiz_sub) / len(quiz_sub), 1) if quiz_sub else 0.0

            # 2. Day-specific Coding Avg (Strictly for activities on target_date)
            coding_sub = [c.score for c in coding_submissions if c.submitted_at and c.submitted_at.date() == target_date]
            coding_val = round(sum(coding_sub) / len(coding_sub), 1) if coding_sub else 0.0

            # 3. Day-specific Interview Rating (Strictly for activities on target_date)
            int_sub = [r for r in int_reviews if r.submitted_at and r.submitted_at.date() == target_date]
            if int_sub:
                reviews_sum = 0
                for r in int_sub:
                    tech = r.technical_skills or 0
                    comm = r.communication_skills or 0
                    prob = r.problem_solving or 0
                    soft = r.soft_skills or 0
                    overall = r.overall_rating or 0
                    avg_r = (tech + comm + prob + soft) / 4.0 if any([tech, comm, prob, soft]) else overall
                    reviews_sum += avg_r
                avg_int = (reviews_sum / len(int_sub)) / 5.0 * 100
                interview_val = round(avg_int, 1)
            else:
                interview_val = 0.0

            daily_data.append({
                "day": day_name,
                "date": target_date.strftime("%b %d"),
                "quiz": min(100.0, max(0.0, quiz_val)),
                "coding": min(100.0, max(0.0, coding_val)),
                "interview": min(100.0, max(0.0, interview_val)),
            })

        cache.set(cache_key, daily_data, timeout=CACHE_TTL)
        return daily_data
    except Exception as e:
        logger.error(f"Error computing daily progress for user {user_pk}: {e}")
        return []


def get_optimized_ai_intelligence(user):
    """
    Computes AI Profile Intelligence metrics 100% dynamically with caching.
    """
    if not user or not user.is_authenticated:
        return {
            "overall_readiness": 0,
            "completed_modules": "0 / 3",
            "top_skill": "N/A",
            "metrics": {
                "quiz_mastery": 0,
                "coding_ability": 0,
                "interview_skill": 0,
            }
        }

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"ai_intelligence_data_{user_pk}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        candidate_profile = Candidate_Profile.objects.filter(user=user).first()

        quiz_score = round(QuizPerformance.objects.filter(user=user).aggregate(avg=Avg("score"))["avg"] or 0)
        coding_score = round(CodeSubmission.objects.filter(user=user).aggregate(avg=Avg("score"))["avg"] or 0)

        int_reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile) if candidate_profile else None
        if int_reviews and int_reviews.exists():
            aggs = int_reviews.aggregate(
                tech=Avg("technical_skills"),
                comm=Avg("communication_skills"),
                prob=Avg("problem_solving"),
                soft=Avg("soft_skills"),
                overall=Avg("overall_rating"),
            )
            tech = aggs["tech"] or 0
            comm = aggs["comm"] or 0
            prob = aggs["prob"] or 0
            soft = aggs["soft"] or 0
            overall = aggs["overall"] or 0
            summary_avg = (tech + comm + prob + soft) / 4.0 if any([tech, comm, prob, soft]) else overall
            interview_score = round((float(summary_avg) / 5.0) * 100)
        else:
            interview_score = 0

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

        data = {
            "overall_readiness": overall_readiness,
            "completed_modules": completed_modules,
            "top_skill": top_skill,
            "metrics": {
                "quiz_mastery": quiz_score,
                "coding_ability": coding_score,
                "interview_skill": interview_score,
            }
        }

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error computing AI intelligence for user {user_pk}: {e}")
        return {
            "overall_readiness": 0,
            "completed_modules": "0 / 3",
            "top_skill": "N/A",
            "metrics": {
                "quiz_mastery": 0,
                "coding_ability": 0,
                "interview_skill": 0,
            }
        }
