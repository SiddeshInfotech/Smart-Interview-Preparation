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
    Computes 7-day performance and Daily Growth or Change (deltas) for Quiz, Coding, and Interview.
    Optimized: Uses 3 bulk database queries and 8-day rolling window for exact day-over-day growth computation.
    """
    if not user or not user.is_authenticated:
        return [
            {
                "day": (timezone.now().date() - timedelta(days=i)).strftime("%a"),
                "date": (timezone.now().date() - timedelta(days=i)).strftime("%b %d"),
                "quiz": 0.0,
                "coding": 0.0,
                "interview": 0.0,
                "quiz_change": 0.0,
                "coding_change": 0.0,
                "interview_change": 0.0,
                "overall_change": 0.0,
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

        # Compute performance scores for 8 days (days 7..0 ago) to enable 7-day Daily Growth/Change deltas
        daily_scores = []
        for i in range(7, -1, -1):
            target_date = today - timedelta(days=i)

            # Cumulative Quiz Avg in memory
            quiz_sub = [q.score for q in quizzes if q.created_at and q.created_at.date() <= target_date]
            quiz_val = round(sum(quiz_sub) / len(quiz_sub), 1) if quiz_sub else 0.0

            # Cumulative Coding Avg in memory
            coding_sub = [c.score for c in coding_submissions if c.submitted_at and c.submitted_at.date() <= target_date]
            coding_val = round(sum(coding_sub) / len(coding_sub), 1) if coding_sub else 0.0

            # Cumulative Interview Rating in memory
            int_sub = [r for r in int_reviews if r.submitted_at and r.submitted_at.date() <= target_date]
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

            quiz_val = min(100.0, max(0.0, quiz_val))
            coding_val = min(100.0, max(0.0, coding_val))
            interview_val = min(100.0, max(0.0, interview_val))

            daily_scores.append({
                "target_date": target_date,
                "quiz": quiz_val,
                "coding": coding_val,
                "interview": interview_val,
            })

        # Build 7-day progress dataset with "Daily Growth or Change" method
        daily_data = []
        for idx in range(1, len(daily_scores)):
            curr = daily_scores[idx]
            prev = daily_scores[idx - 1]

            quiz_change = round(curr["quiz"] - prev["quiz"], 1)
            coding_change = round(curr["coding"] - prev["coding"], 1)
            interview_change = round(curr["interview"] - prev["interview"], 1)

            # Overall composite score & growth change
            active_curr = [v for v in [curr["quiz"], curr["coding"], curr["interview"]] if v > 0]
            curr_overall = round(sum(active_curr) / len(active_curr), 1) if active_curr else 0.0

            active_prev = [v for v in [prev["quiz"], prev["coding"], prev["interview"]] if v > 0]
            prev_overall = round(sum(active_prev) / len(active_prev), 1) if active_prev else 0.0

            overall_change = round(curr_overall - prev_overall, 1)

            daily_data.append({
                "day": curr["target_date"].strftime("%a"),
                "date": curr["target_date"].strftime("%b %d"),
                "quiz": curr["quiz"],
                "coding": curr["coding"],
                "interview": curr["interview"],
                "quiz_change": quiz_change,
                "coding_change": coding_change,
                "interview_change": interview_change,
                "overall_change": overall_change,
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
