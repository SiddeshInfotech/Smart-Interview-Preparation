import logging
from django.core.cache import cache
from .models import Interviewer_Profile

logger = logging.getLogger(__name__)

CACHE_TTL = 300  # 300 seconds (5 minutes)


def get_interviewer_profile_data(user):
    """
    Service layer function to retrieve interviewer profile data for a user with caching.
    """
    if not user or not user.is_authenticated:
        return {}

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"interviewer_profile_data_{user_pk}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        profile = Interviewer_Profile.objects.select_related("user").filter(user=user).only(
            "interviewer_id",
            "profile_picture",
            "department",
            "designation",
            "company",
            "expertise_area",
            "years_of_experience",
            "linkedin_url",
            "github_url",
            "website_url",
            "is_available",
            "user__user_id",
            "user__email",
            "user__full_name",
            "user__role",
        ).first()

        if not profile:
            profile_obj = Interviewer_Profile.objects.create(user=user)
            profile = Interviewer_Profile.objects.select_related("user").get(pk=profile_obj.pk)

        from .serializers import InterviewerProfileSerializer
        serializer = InterviewerProfileSerializer(profile)
        data = serializer.data

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error fetching interviewer profile for user {user_pk}: {e}")
        return {
            "full_name": getattr(user, "full_name", "") or user.email.split("@")[0],
            "email": user.email,
            "role": getattr(user, "role", "interviewer"),
        }


def invalidate_interviewer_profile_cache(user_id):
    """Invalidates cache when interviewer profile is updated."""
    cache.delete(f"interviewer_profile_data_{user_id}")
