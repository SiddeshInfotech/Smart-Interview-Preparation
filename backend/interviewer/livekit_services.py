from livekit import api
from django.conf import settings


def generate_access_token(room_name: str, user_id: int, user_name: str, role: str):
    """
    Generate a LiveKit access token.

    Args:
        room_name: LiveKit room name
        user_id: User's unique ID
        user_name: Full name
        role: candidate / interviewer

    Returns:
        JWT access token
    """

    token = (
        api.AccessToken(
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
        )
        .with_identity(str(user_id))
        .with_name(user_name)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
    )

    token.metadata = role
    return token.to_jwt()
