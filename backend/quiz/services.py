import logging
from django.core.cache import cache
from django.db.models import Avg, Max, Min, Count
from .models import QuizPerformance

from candidate.models import Candidate_Profile

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # 60 seconds


def get_quiz_performance_summary(user):
    """
    Service layer function to retrieve quiz performance metrics for a user,
    scoped strictly to the candidate's active domain.
    """
    if not user or not user.is_authenticated:
        return {
            "total_quizzes": 0,
            "minimum_score": 0,
            "maximum_score": 0,
            "average_score": 0,
            "overall_score": 0,
        }

    candidate = Candidate_Profile.objects.filter(user=user).first()
    active_domain = candidate.active_domain if candidate else None
    active_domain_id = active_domain.domain_id if active_domain else None

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"quiz_performance_summary_{user_pk}_{active_domain_id}"
    cached_summary = cache.get(cache_key)
    if cached_summary:
        return cached_summary

    try:
        queryset = QuizPerformance.objects.filter(user=user)
        if active_domain:
            queryset = queryset.filter(domain=active_domain)

        aggs = queryset.aggregate(
            total_quizzes=Count("id"),
            minimum_score=Min("score"),
            maximum_score=Max("score"),
            average_score=Avg("score"),
        )

        total = aggs["total_quizzes"] or 0
        if total == 0:
            data = {
                "total_quizzes": 0,
                "minimum_score": 0,
                "maximum_score": 0,
                "average_score": 0,
                "overall_score": 0,
            }
        else:
            avg_score = round(aggs["average_score"] or 0, 2)
            data = {
                "total_quizzes": total,
                "minimum_score": aggs["minimum_score"] or 0,
                "maximum_score": aggs["maximum_score"] or 0,
                "average_score": avg_score,
                "overall_score": avg_score,
            }

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error fetching quiz performance for user {user_pk}: {e}")
        return {
            "total_quizzes": 0,
            "minimum_score": 0,
            "maximum_score": 0,
            "average_score": 0,
            "overall_score": 0,
        }


def invalidate_quiz_cache(user_id):
    """Invalidates quiz performance cache and dashboard caches for user."""
    cache.delete(f"quiz_performance_summary_{user_id}")
    cache.delete(f"daily_progress_data_{user_id}")
    cache.delete(f"ai_intelligence_data_{user_id}")

