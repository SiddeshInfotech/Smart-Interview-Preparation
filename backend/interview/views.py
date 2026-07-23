import os
import logging
import uuid
from datetime import datetime, timedelta          # ✅ correct import

from django.utils import timezone                  # ✅ moved to top
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from livekit import api

from .models import InterviewSchedule
from .serializers import InterviewScheduleSerializer


# ========== SCHEDULING VIEW ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_interview_schedule(request):
    """
    Candidate sends an interview request.
    Bypasses DRF serializer validation to avoid choice/field validation issues.
    Creates the InterviewSchedule row directly via ORM and notifies the interviewer.
    """
    from rest_framework.exceptions import ValidationError as DRFValidationError
    from interviewer.models import Interviewer_Profile

    if not hasattr(request.user, 'candidate_profile'):
        return Response({"detail": "Only candidates can send interview requests."}, status=403)

    interviewer_id = request.data.get('interviewer')
    scheduled_date = request.data.get('scheduled_date')
    scheduled_time = request.data.get('scheduled_time')
    duration_minutes = request.data.get('duration_minutes')

    errors = {}
    if not interviewer_id:
        errors['interviewer'] = 'This field is required.'
    if not scheduled_date:
        errors['scheduled_date'] = 'This field is required.'
    if not scheduled_time:
        errors['scheduled_time'] = 'This field is required.'
    if not duration_minutes:
        errors['duration_minutes'] = 'This field is required.'
    if errors:
        return Response(errors, status=400)

    try:
        interviewer_profile = Interviewer_Profile.objects.get(pk=interviewer_id)
    except Interviewer_Profile.DoesNotExist:
        return Response({"interviewer": f"No interviewer found with id={interviewer_id}."}, status=400)

    candidate_profile = request.user.candidate_profile
    room_name = f"room-{uuid.uuid4().hex[:8]}"

    try:
        schedule = InterviewSchedule.objects.create(
            candidate=candidate_profile,
            interviewer=interviewer_profile,
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            duration_minutes=int(duration_minutes),
            status='Scheduled',
            meeting_link='',
            room_name=room_name,
        )
    except Exception as db_err:
        return Response({"detail": f"Database error: {str(db_err)}"}, status=400)

    try:
        from notifications.utils import create_notification
        create_notification(
            user=schedule.interviewer.user,
            notification_type="interview",
            title="New Interview Request",
            message=(
                f"Candidate {request.user.full_name} has requested an interview "
                f"on {schedule.scheduled_date} at {schedule.scheduled_time}. "
                f"Schedule ID: {schedule.schedule_id}"
            )
        )
    except Exception as e:
        print("Failed to send notification:", e)

    return Response({
        "schedule_id": schedule.schedule_id,
        "room_name": schedule.room_name,
        "status": schedule.status,
        "meeting_link": schedule.meeting_link,
        "scheduled_date": str(schedule.scheduled_date),
        "scheduled_time": str(schedule.scheduled_time),
        "duration_minutes": schedule.duration_minutes,
    }, status=201)


# ========== LIVEKIT TOKEN ENDPOINT ==========
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

    try:
        schedule = InterviewSchedule.objects.filter(room_name=room_name).first()
        if schedule:
            if not schedule.meeting_link:
                return Response({'error': 'The interviewer has not yet accepted this request.'}, status=400)

            if schedule.status == 'Cancelled':
                return Response({'error': 'This interview has been cancelled.'}, status=400)

            if request.user.role == 'candidate':
                if schedule.candidate.user != request.user:
                    return Response({'error': 'You are not authorized for this interview.'}, status=403)
            elif request.user.role == 'interviewer':
                if schedule.interviewer.user != request.user:
                    return Response({'error': 'You are not authorized for this interview.'}, status=403)

            scheduled_start = timezone.make_aware(
                datetime.combine(schedule.scheduled_date, schedule.scheduled_time)   # ✅ use datetime.combine
            )
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


# ========== ACCEPT INTERVIEW ==========
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
    schedule.meeting_link = schedule.room_name
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


# ========== DECLINE INTERVIEW ==========
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


# ========== GET USER'S INTERVIEWS ==========
class UserInterviewListView(generics.ListAPIView):
    serializer_class = InterviewScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs_candidate = InterviewSchedule.objects.none()
        qs_interviewer = InterviewSchedule.objects.none()

        if hasattr(user, 'candidate_profile'):
            qs_candidate = InterviewSchedule.objects.filter(
                candidate=user.candidate_profile
            )
        if hasattr(user, 'interviewer_profile'):
            qs_interviewer = InterviewSchedule.objects.filter(
                interviewer=user.interviewer_profile
            )

        return (qs_candidate | qs_interviewer).distinct().order_by('-scheduled_date')