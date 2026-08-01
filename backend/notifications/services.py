import logging
from django.core.cache import cache
from .models import Notification
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)

CACHE_TTL = 30  # 30 seconds for notifications


def get_recent_notifications(user, limit=10):
    """
    Service layer function to fetch recent notifications for a user.
    Loads only necessary fields up to `limit`.
    """
    if not user or not user.is_authenticated:
        return []

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"recent_notifications_{user_pk}_{limit}"
    cached_notifications = cache.get(cache_key)
    if cached_notifications is not None:
        return cached_notifications

    try:
        notifications = Notification.objects.filter(
            user=user
        ).only(
            "notification_id", "notification_type", "title", "message", "is_read", "created_at"
        ).order_by("-created_at")[:limit]

        serialized = NotificationSerializer(notifications, many=True).data
        cache.set(cache_key, serialized, timeout=CACHE_TTL)
        return serialized
    except Exception as e:
        logger.error(f"Error fetching notifications for user {user_pk}: {e}")
        return []


def get_unread_notifications_count(user):
    """
    Service layer function to fetch unread notification count.
    """
    if not user or not user.is_authenticated:
        return 0

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"unread_notifications_count_{user_pk}"
    cached_count = cache.get(cache_key)
    if cached_count is not None:
        return cached_count

    try:
        count = Notification.objects.filter(user=user, is_read=False).count()
        cache.set(cache_key, count, timeout=CACHE_TTL)
        return count
    except Exception as e:
        logger.error(f"Error fetching unread notification count for user {user_pk}: {e}")
        return 0


def invalidate_notification_cache(user_id):
    """Invalidates notification cache for user."""
    cache.delete(f"recent_notifications_{user_id}_10")
    cache.delete(f"recent_notifications_{user_id}_50")
    cache.delete(f"unread_notifications_count_{user_id}")
