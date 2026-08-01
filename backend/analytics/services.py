import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TTL = 60  # 60 seconds


def get_dashboard_statistics(user):
    """
    Analytics service helper for overall candidate dashboard analytics metrics.
    """
    if not user or not user.is_authenticated:
        return {}

    cache_key = f"analytics_dashboard_stats_{user.id}"
    cached_stats = cache.get(cache_key)
    if cached_stats:
        return cached_stats

    # Placeholder for custom analytics extensions
    stats = {
        "user_id": user.id,
        "is_active": user.is_active,
    }
    cache.set(cache_key, stats, timeout=CACHE_TTL)
    return stats
