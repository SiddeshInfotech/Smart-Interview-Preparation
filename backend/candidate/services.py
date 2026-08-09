import logging
from django.core.cache import cache
from .models import Candidate_Profile

logger = logging.getLogger(__name__)

CACHE_TTL = 300  # 300 seconds (5 minutes)


def get_candidate_profile_data(user):
    """
    Service layer function to retrieve candidate profile data for a user.
    Uses select_related and caching to optimize performance.
    """
    if not user or not user.is_authenticated:
        return {}

    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    cache_key = f"candidate_profile_data_{user_pk}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        profile = Candidate_Profile.objects.select_related("user").filter(user=user).only(
            "candidate_id",
            "profile_picture",
            "date_of_birth",
            "gender",
            "location",
            "education",
            "experience_years",
            "skills",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "user__user_id",
            "user__email",
            "user__full_name",
            "user__role",
        ).first()

        if not profile:
            profile_obj = Candidate_Profile.objects.create(user=user)
            profile = Candidate_Profile.objects.select_related("user").get(pk=profile_obj.pk)

        data = {
            "candidate_id": profile.candidate_id,
            "full_name": profile.user.full_name or profile.user.email.split("@")[0],
            "email": profile.user.email,
            "role": profile.user.role,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            "location": profile.location,
            "education": profile.education,
            "experience_years": float(profile.experience_years or 0.0),
            "skills": profile.skills,
            "linkedin_url": profile.linkedin_url,
            "github_url": profile.github_url,
            "portfolio_url": profile.portfolio_url,
        }

        cache.set(cache_key, data, timeout=CACHE_TTL)
        return data
    except Exception as e:
        logger.error(f"Error fetching candidate profile for user {user_pk}: {e}")
        return {
            "full_name": getattr(user, "full_name", "") or user.email.split("@")[0],
            "email": user.email,
            "role": getattr(user, "role", "candidate"),
        }


def invalidate_candidate_profile_cache(user_id):
    """Invalidates cache when profile is updated."""
    cache.delete(f"candidate_profile_data_{user_id}")
