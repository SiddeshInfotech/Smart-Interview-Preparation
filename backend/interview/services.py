import logging
from django.core.cache import cache
from django.db.models import Avg
from candidate.models import Candidate_Profile
from .models import InterviewFeedbackReview, InterviewSchedule

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # 60 seconds


def get_interview_performance_summary(user):
    """
    Service layer function to compute interview performance ratings for a candidate.
    Uses ORM aggregation and caching to optimize response times.
    """
    default_res = {
        "total_interviews": 0,
        "technical_skills": 0,
        "communication_skills": 0,
        "problem_solving": 0,
        "soft_skills": 0,
        "code_quality": 0,
        "overall_performance": 0,
    }

    if not user or not user.is_authenticated:
        return default_res

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"interview_performance_summary_{user_pk}"
    cached_summary = cache.get(cache_key)
    if cached_summary:
        return cached_summary

    try:
        candidate_profile = Candidate_Profile.objects.filter(user=user).first()
        if not candidate_profile:
            return default_res

        completed_schedules_count = InterviewSchedule.objects.filter(
            candidate=candidate_profile, status="Completed"
        ).count()

        reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile)
        total_reviews_count = reviews.count()
        total_interviews = max(completed_schedules_count, total_reviews_count)

        if total_reviews_count == 0:
            res = default_res.copy()
            res["total_interviews"] = total_interviews
            return res

        aggs = reviews.aggregate(
            tech=Avg("technical_skills"),
            comm=Avg("communication_skills"),
            prob=Avg("problem_solving"),
            soft=Avg("soft_skills"),
            code=Avg("code_quality"),
            overall=Avg("overall_rating"),
        )

        tech_avg = aggs["tech"] or 0
        comm_avg = aggs["comm"] or 0
        prob_avg = aggs["prob"] or 0
        soft_avg = aggs["soft"] or 0
        code_avg = aggs["code"] or 0
        overall_avg = aggs["overall"] or 0

        summary_avg = (
            (tech_avg + comm_avg + prob_avg + soft_avg + code_avg) / 5.0
            if any([tech_avg, comm_avg, prob_avg, soft_avg, code_avg])
            else overall_avg
        )

        data = {
            "total_interviews": total_interviews,
            "technical_skills": round((tech_avg / 5.0) * 100),
            "communication_skills": round((comm_avg / 5.0) * 100),
            "problem_solving": round((prob_avg / 5.0) * 100),
            "soft_skills": round((soft_avg / 5.0) * 100),
            "code_quality": round((code_avg / 5.0) * 100),
            "overall_performance": round((summary_avg / 5.0) * 100),
        }

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error fetching interview performance for user {user_pk}: {e}")
        return default_res


def invalidate_interview_cache(user_id):
    """Invalidates interview performance cache for user."""
    cache.delete(f"interview_performance_summary_{user_id}")
