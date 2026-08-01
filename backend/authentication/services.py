import logging
from django.core.cache import cache
from .models import UserCredit

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # 60 seconds


def get_user_usage_summary(user):
    """
    Service layer function to retrieve AI usage summary and limits for a user.
    Uses get_or_create, .only() field optimization, and caching to optimize performance.
    """
    if not user or not user.is_authenticated:
        return {}

    role = getattr(user, "role", "")
    if role == "interviewer":
        return {}

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"user_usage_summary_{user_pk}"
    cached_summary = cache.get(cache_key)
    if cached_summary:
        return cached_summary

    try:
        credits_obj = (
            UserCredit.objects.filter(user=user)
            .only(
                "credit_id",
                "quiz_used",
                "quiz_limit",
                "quiz_last_reset",
                "coding_used",
                "coding_limit",
                "coding_last_reset",
                "resume_used",
                "resume_limit",
                "resume_last_reset",
                "user_id",
            )
            .first()
        )
        if not credits_obj:
            credits_obj, _ = UserCredit.objects.get_or_create(user=user)

        credits_obj.check_and_reset()

        data = {
            "has_premium": getattr(user, "has_premium", False),
            "quiz": {
                "used": credits_obj.quiz_used,
                "limit": credits_obj.quiz_limit,
                "remaining": max(0, credits_obj.quiz_limit - credits_obj.quiz_used),
                "window": "daily",
            },
            "coding": {
                "used": credits_obj.coding_used,
                "limit": credits_obj.coding_limit,
                "remaining": max(0, credits_obj.coding_limit - credits_obj.coding_used),
                "window": "daily",
            },
            "resume": {
                "used": credits_obj.resume_used,
                "limit": credits_obj.resume_limit,
                "remaining": max(0, credits_obj.resume_limit - credits_obj.resume_used),
                "window": "monthly",
            },
        }

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error fetching usage summary for user {user_pk}: {e}")
        return {
            "has_premium": getattr(user, "has_premium", False),
            "quiz": {"used": 0, "limit": 20, "remaining": 20, "window": "daily"},
            "coding": {"used": 0, "limit": 20, "remaining": 20, "window": "daily"},
            "resume": {"used": 0, "limit": 5, "remaining": 5, "window": "monthly"},
        }


def invalidate_usage_cache(user_id):
    """Invalidates usage cache for user."""
    cache.delete(f"user_usage_summary_{user_id}")


def get_auth_profile_data(user):
    """
    Service layer function to retrieve basic user profile data with caching.
    """
    if not user or not user.is_authenticated:
        return {}

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"auth_user_profile_{user_pk}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    from .serializers import ProfileSerializer
    serializer = ProfileSerializer(user)
    data = serializer.data

    cache.set(cache_key, data, timeout=300)
    return data


def invalidate_auth_profile_cache(user_id):
    """Invalidates basic auth profile cache for user."""
    cache.delete(f"auth_user_profile_{user_id}")

