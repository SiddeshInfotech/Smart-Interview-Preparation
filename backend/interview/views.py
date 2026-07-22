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
        from rest_framework.exceptions import ValidationError as DRFValidationError

        # Ensure caller is a candidate
        if not hasattr(self.request.user, 'candidate_profile'):
            raise DRFValidationError({"detail": "Only candidates can send interview requests."})

        room_name = f"room-{uuid.uuid4().hex[:8]}"
        candidate_profile = self.request.user.candidate_profile

        try:
            schedule = serializer.save(
                candidate=candidate_profile,
                room_name=room_name,
                status='Pending'
            )
        except Exception as db_err:
            # Surface the DB-level error so we can diagnose it
            raise DRFValidationError({"detail": f"Could not save schedule: {str(db_err)}"})

        # Notify the interviewer
        try:
            from notifications.utils import create_notification
            create_notification(
                user=schedule.interviewer.user,
                notification_type="interview",
                title="New Interview Request",
                message=f"Candidate {self.request.user.full_name} has requested an interview on {schedule.scheduled_date} at {schedule.scheduled_time}. Schedule ID: {schedule.schedule_id}"
            )
        except Exception as e:
            print("Failed to send notification:", e)


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

    # Validate timing constraints for room sessions
    try:
        schedule = InterviewSchedule.objects.filter(room_name=room_name).first()
        if schedule:
            # Ensure status is Scheduled
            if schedule.status != 'Scheduled':
                return Response({'error': f'Interview status is {schedule.status} (must be Scheduled to join).'}, status=400)

            # Check if user is candidate or interviewer for this schedule
            if request.user.role == 'candidate':
                if schedule.candidate.user != request.user:
                    return Response({'error': 'You are not authorized for this interview.'}, status=403)
            elif request.user.role == 'interviewer':
                if schedule.interviewer.user != request.user:
                    return Response({'error': 'You are not authorized for this interview.'}, status=403)

            # Check scheduled date and time
            from django.utils import timezone
            from datetime import combine, timedelta
            
            scheduled_start = timezone.make_aware(combine(schedule.scheduled_date, schedule.scheduled_time))
            now = timezone.now()
            
            start_window = scheduled_start - timedelta(minutes=15)
            end_window = scheduled_start + timedelta(minutes=schedule.duration_minutes + 15)
            
            if not (start_window <= now <= end_window):
                return Response({
                    'error': f'Access restricted. You can only join this room on {schedule.scheduled_date} between {start_window.strftime("%H:%M")} and {end_window.strftime("%H:%M")}.'
                }, status=400)
    except Exception as ex:
        logger.error(f"Error checking schedule join window: {str(ex)}")

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_interview(request, pk):
    try:
        schedule = InterviewSchedule.objects.get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    if schedule.interviewer.user != request.user:
        return Response({'error': 'You are not the interviewer for this session.'}, status=403)

    schedule.status = 'Scheduled'
    schedule.save()

    try:
        from notifications.utils import create_notification
        create_notification(
            user=schedule.candidate.user,
            notification_type="interview",
            title="Interview Request Accepted",
            message=f"Interviewer {request.user.full_name} has accepted your interview request on {schedule.scheduled_date} at {schedule.scheduled_time}."
        )
    except Exception as e:
        print("Failed to notify candidate:", e)

    return Response({'message': 'Interview request accepted and scheduled.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_interview(request, pk):
    try:
        schedule = InterviewSchedule.objects.get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    if schedule.interviewer.user != request.user:
        return Response({'error': 'You are not the interviewer for this session.'}, status=403)

    schedule.status = 'Cancelled'
    schedule.save()

    try:
        from notifications.utils import create_notification
        create_notification(
            user=schedule.candidate.user,
            notification_type="interview",
            title="Interview Request Declined",
            message=f"Interviewer {request.user.full_name} has declined your interview request on {schedule.scheduled_date} at {schedule.scheduled_time}."
        )
    except Exception as e:
        print("Failed to notify candidate:", e)

    return Response({'message': 'Interview request declined.'})