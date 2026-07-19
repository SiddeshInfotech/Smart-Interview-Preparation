import os
import logging
import uuid
from datetime import timedelta

from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from livekit import api

from .models import InterviewSchedule
from .serializers import InterviewScheduleSerializer   # ✅ import from serializers.py

# ---------- Scheduling View ----------
class InterviewScheduleCreateView(generics.CreateAPIView):
    serializer_class = InterviewScheduleSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        room_name = f"room-{uuid.uuid4().hex[:8]}"
        candidate_profile = self.request.user.candidate_profile
        serializer.save(
            candidate=candidate_profile,
            room_name=room_name,
            status='Scheduled'
        )


# ---------- LiveKit Token Endpoint ----------
logger = logging.getLogger(__name__)
LIVEKIT_API_KEY = os.environ.get('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.environ.get('LIVEKIT_API_SECRET')

if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
    logger.warning("LiveKit API credentials are not set in environment.")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_livekit_token(request):
    room_name = request.data.get('room_name')
    identity = request.data.get('identity')
    display_name = request.data.get('name')
    role = request.data.get('role', 'participant')

    if not identity:
        identity = request.data.get('participant_name')
    if not display_name:
        display_name = identity or 'Participant'

    if not room_name or not identity:
        return Response(
            {'error': 'room_name and identity are required.'},
            status=400
        )

    if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
        logger.error("LiveKit credentials missing.")
        return Response(
            {'error': 'LiveKit server configuration is incomplete.'},
            status=500
        )

    try:
        token = (
            api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(identity)
            .with_name(display_name)
            .with_metadata(f'{{"role":"{role}"}}')
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
            .with_ttl(timedelta(hours=2))
        )
        return Response({'token': token.to_jwt()})

    except Exception as e:
        logger.exception("LiveKit token generation failed.")
        return Response(
            {'error': f'Token generation failed: {str(e)}'},
            status=500
        )