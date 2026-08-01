import logging
from django.core.cache import cache
from ..models import CodeSubmission

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # 60 seconds


def get_coding_performance_summary(user):
    """
    Service layer function to calculate coding performance for a user.
    Uses `.only()` and single-pass iteration with caching.
    """
    if not user or not user.is_authenticated:
        return {
            "total_submissions": 0,
            "logical_thinking": 0,
            "code_efficiency": 0,
            "language_skills": 0,
            "problem_solving": 0,
            "overall_score": 0,
        }

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"coding_performance_summary_{user_pk}"
    cached_summary = cache.get(cache_key)
    if cached_summary:
        return cached_summary

    try:
        submissions = CodeSubmission.objects.filter(user=user).only("score", "ai_evaluation")
        total = submissions.count()

        if total == 0:
            data = {
                "total_submissions": 0,
                "logical_thinking": 0,
                "code_efficiency": 0,
                "language_skills": 0,
                "problem_solving": 0,
                "overall_score": 0,
            }
        else:
            sum_logical = 0
            sum_efficiency = 0
            sum_language = 0
            sum_problem = 0
            sum_overall = 0

            for s in submissions:
                eval_obj = s.ai_evaluation or {}
                sum_logical += eval_obj.get("logical_thinking", s.score)
                sum_efficiency += eval_obj.get("code_efficiency", s.score)
                sum_language += eval_obj.get("language_skills", s.score)
                sum_problem += eval_obj.get("problem_solving", s.score)
                sum_overall += s.score

            data = {
                "total_submissions": total,
                "logical_thinking": round(sum_logical / total),
                "code_efficiency": round(sum_efficiency / total),
                "language_skills": round(sum_language / total),
                "problem_solving": round(sum_problem / total),
                "overall_score": round(sum_overall / total),
            }

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error fetching coding performance for user {user_pk}: {e}")
        return {
            "total_submissions": 0,
            "logical_thinking": 0,
            "code_efficiency": 0,
            "language_skills": 0,
            "problem_solving": 0,
            "overall_score": 0,
        }


def invalidate_coding_cache(user_id):
    """Invalidates coding performance cache for user."""
    cache.delete(f"coding_performance_summary_{user_id}")
