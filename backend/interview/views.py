import os
import logging
import uuid
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from livekit import api

from .models import InterviewSchedule
from .serializers import InterviewScheduleSerializer

# ---------- LOGGING ----------
logger = logging.getLogger(__name__)

# ---------- CREDENTIALS (stripped) ----------
LIVEKIT_API_KEY = os.environ.get('LIVEKIT_API_KEY', '').strip()
LIVEKIT_API_SECRET = os.environ.get('LIVEKIT_API_SECRET', '').strip()

if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
    logger.warning("LiveKit API credentials are not set in environment.")


# ========== SCHEDULING VIEW (INTERVIEWER ONLY) ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_interview_schedule(request):
    """
    Interviewer creates an interview slot.
    Accessible ONLY to users with role 'interviewer' or having an interviewer_profile.
    Requires domain selection, date, time, and duration.
    Creates an Open slot (candidate=None, status='Open').
    """
    from interviewer.models import Interviewer_Profile
    from course.models import Domain

    user_role = getattr(request.user, 'role', '')
    is_interviewer = user_role == 'interviewer' or hasattr(request.user, 'interviewer_profile')

    if not is_interviewer:
        return Response({"detail": "Interview scheduling is only accessible to users with the interviewer role."}, status=403)

    interviewer_profile = getattr(request.user, 'interviewer_profile', None)
    if not interviewer_profile:
        interviewer_profile, _ = Interviewer_Profile.objects.get_or_create(user=request.user)

    scheduled_date = request.data.get('scheduled_date')
    scheduled_time = request.data.get('scheduled_time')
    duration_minutes = request.data.get('duration_minutes', 60)
    domain_id_raw = request.data.get('domain') or request.data.get('domain_id')

    errors = {}
    if not scheduled_date:
        errors['scheduled_date'] = 'Scheduled date is required.'
    if not scheduled_time:
        errors['scheduled_time'] = 'Scheduled time is required.'
    if not domain_id_raw:
        errors['domain'] = 'Domain selection is required.'

    if errors:
        return Response(errors, status=400)

    domain_obj = None
    if isinstance(domain_id_raw, int) or (isinstance(domain_id_raw, str) and domain_id_raw.isdigit()):
        domain_obj = Domain.objects.filter(pk=int(domain_id_raw)).first()
    if not domain_obj and isinstance(domain_id_raw, str):
        domain_obj = Domain.objects.filter(name__iexact=domain_id_raw.strip()).first()

    if not domain_obj:
        return Response({"domain": f"Selected domain '{domain_id_raw}' not found."}, status=400)

    room_name = f"room-{uuid.uuid4().hex[:8]}"

    try:
        schedule = InterviewSchedule.objects.create(
            candidate=None,
            interviewer=interviewer_profile,
            domain=domain_obj,
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            duration_minutes=int(duration_minutes),
            status='Open',
            meeting_link='',
            room_name=room_name,
        )
    except Exception as db_err:
        return Response({"detail": f"Database error: {str(db_err)}"}, status=400)

    serializer = InterviewScheduleSerializer(schedule)
    return Response(serializer.data, status=201)


# ========== GET UNSCHEDULED INTERVIEWS (CANDIDATE VIEW) ==========
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unscheduled_interviews(request):
    """
    Returns list of open/unscheduled interview slots created by interviewers.
    Filters by domain matching candidate's active/target domain if available.
    """
    from candidate.models import Candidate_Profile
    from course.models import Domain

    qs = InterviewSchedule.objects.filter(status='Open', candidate__isnull=True).select_related(
        'interviewer__user', 'domain'
    ).order_by('scheduled_date', 'scheduled_time')

    cand_domain_id = None
    cand_domain_name = None

    if hasattr(request.user, 'candidate_profile'):
        candidate = request.user.candidate_profile
        if candidate.active_domain:
            cand_domain_id = candidate.active_domain.domain_id
            cand_domain_name = candidate.active_domain.name
        elif candidate.target_domain:
            d_obj = Domain.objects.filter(name__iexact=candidate.target_domain.strip()).first()
            if d_obj:
                cand_domain_id = d_obj.domain_id
                cand_domain_name = d_obj.name

    serialized = InterviewScheduleSerializer(qs, many=True).data

    return Response({
        "candidate_domain_id": cand_domain_id,
        "candidate_domain_name": cand_domain_name,
        "results": serialized
    })


# ========== APPLY FOR UNSCHEDULED INTERVIEW (CANDIDATE) ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_interview(request, pk):
    """
    Candidate submits a proposal to apply for an unscheduled interview slot.
    Updates slot status to 'Requested' and notifies the interviewer.
    """
    from candidate.models import Candidate_Profile

    if not hasattr(request.user, 'candidate_profile'):
        return Response({"detail": "Only candidates can apply for interview slots."}, status=403)

    try:
        schedule = InterviewSchedule.objects.select_related(
            'interviewer__user', 'domain'
        ).get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({"error": "Interview schedule slot not found."}, status=404)

    if schedule.status != 'Open' or schedule.candidate is not None:
        return Response({"error": "This interview slot is no longer available."}, status=400)

    candidate_profile = request.user.candidate_profile
    schedule.candidate = candidate_profile
    schedule.status = 'Requested'
    schedule.save(update_fields=['candidate', 'status', 'updated_at'])

    try:
        from notifications.utils import create_notification
        domain_name = schedule.domain.name if schedule.domain else "General"
        create_notification(
            user=schedule.interviewer.user,
            notification_type="interview",
            title="New Interview Request",
            message=(
                f"Candidate {request.user.full_name} has requested an interview proposal for {domain_name} "
                f"on {schedule.scheduled_date} at {schedule.scheduled_time}. "
                f"Schedule ID: {schedule.schedule_id}"
            )
        )
    except Exception as e:
        logger.error(f"Failed to send proposal notification to interviewer: {e}")

    serializer = InterviewScheduleSerializer(schedule)
    return Response({
        "message": "Interview proposal submitted successfully. Waiting for interviewer approval.",
        "schedule": serializer.data
    }, status=200)


# ========== LIVEKIT TOKEN ENDPOINT ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_livekit_token(request):
    room_name = request.data.get('room_name')
    identity = request.data.get('identity')
    display_name = request.data.get('name')
    role = request.data.get('role', 'participant')

    if identity is not None:
        identity = str(identity)

    if not identity:
        identity = request.data.get('participant_name')
        if identity is not None:
            identity = str(identity)
    if not display_name:
        display_name = identity or 'Participant'

    if not room_name or not identity:
        return Response(
            {'error': 'room_name and identity are required.'},
            status=400
        )

    logger.info(f"LIVEKIT_API_KEY: {LIVEKIT_API_KEY[:5]}... (length {len(LIVEKIT_API_KEY)})")
    logger.info(f"Identity: {identity}, Room: {room_name}, Role: {role}")

    try:
        schedule = InterviewSchedule.objects.filter(room_name=room_name).first()
        if schedule:
            if not schedule.meeting_link:
                return Response({'error': 'The interviewer has not yet accepted this request.'}, status=400)

            if schedule.status in ['Cancelled', 'Completed']:
                return Response({'error': f'This interview has been {schedule.status.lower()} and cannot be joined.'}, status=400)

            if request.user.role == 'candidate':
                if schedule.candidate and schedule.candidate.user != request.user:
                    return Response({'error': 'You are not authorized for this interview.'}, status=403)
            elif request.user.role == 'interviewer':
                if schedule.interviewer.user != request.user:
                    return Response({'error': 'You are not authorized for this interview.'}, status=403)

            dt_naive = datetime.combine(schedule.scheduled_date, schedule.scheduled_time)
            scheduled_start = timezone.make_aware(dt_naive) if timezone.is_naive(dt_naive) else dt_naive
            now = timezone.now()

            if now.date() > schedule.scheduled_date:
                schedule.status = 'Cancelled'
                schedule.save(update_fields=['status', 'updated_at'])
                return Response({'error': 'This interview has been cancelled because the scheduled date has passed.'}, status=400)

            if now > (scheduled_start + timedelta(minutes=15)) and schedule.status == 'Scheduled':
                schedule.status = 'Cancelled'
                schedule.save(update_fields=['status', 'updated_at'])
                return Response({'error': 'This interview has been cancelled because 15 minutes have passed after the scheduled timing.'}, status=400)

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
        jwt_token = token.to_jwt()

        logger.info(f"Generated token: {jwt_token[:100]}...")

        return Response({'token': jwt_token})

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
        schedule = InterviewSchedule.objects.select_related(
            'candidate__user', 'interviewer__user', 'domain'
        ).get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    if schedule.interviewer.user != request.user:
        return Response({'error': 'You are not the interviewer for this session.'}, status=403)

    if not schedule.candidate:
        return Response({'error': 'No candidate has requested this interview slot.'}, status=400)

    schedule.status = 'Scheduled'
    schedule.meeting_link = schedule.room_name
    schedule.save(update_fields=['status', 'meeting_link', 'updated_at'])

    try:
        from notifications.utils import create_notification
        domain_name = schedule.domain.name if schedule.domain else "General"
        create_notification(
            user=schedule.candidate.user,
            notification_type="interview",
            title="Interview Request Accepted",
            message=f"Interviewer {request.user.full_name} has accepted your interview proposal for {domain_name} on {schedule.scheduled_date} at {schedule.scheduled_time}."
        )
    except Exception as e:
        logger.error(f"Failed to notify candidate of acceptance: {e}")

    return Response({'message': 'Interview proposal accepted and scheduled.', 'schedule_id': schedule.schedule_id, 'status': 'Scheduled'})


# ========== DECLINE INTERVIEW ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_interview(request, pk):
    try:
        schedule = InterviewSchedule.objects.select_related(
            'candidate__user', 'interviewer__user', 'domain'
        ).get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    if schedule.interviewer.user != request.user:
        return Response({'error': 'You are not the interviewer for this session.'}, status=403)

    cand_user = schedule.candidate.user if (schedule.candidate and hasattr(schedule.candidate, 'user')) else None

    schedule.candidate = None
    schedule.status = 'Open'
    schedule.save(update_fields=['candidate', 'status', 'updated_at'])

    if cand_user:
        try:
            from notifications.utils import create_notification
            domain_name = schedule.domain.name if schedule.domain else "General"
            create_notification(
                user=cand_user,
                notification_type="interview",
                title="Interview Request Declined",
                message=f"Interviewer {request.user.full_name} has declined your interview proposal for {domain_name} on {schedule.scheduled_date} at {schedule.scheduled_time}."
            )
        except Exception as e:
            logger.error(f"Failed to notify candidate of declination: {e}")

    return Response({'message': 'Interview proposal declined and slot re-opened.', 'schedule_id': schedule.schedule_id, 'status': 'Open'})


# ========== CANCEL INTERVIEW SESSION ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_interview_session(request):
    schedule_id = request.data.get('schedule_id')
    room_name = request.data.get('room_name')
    reason = request.data.get('reason', 'cancelled')

    schedule = None
    if schedule_id:
        schedule = InterviewSchedule.objects.filter(schedule_id=schedule_id).first()
    elif room_name:
        schedule = InterviewSchedule.objects.filter(room_name=room_name).first()

    if not schedule:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    schedule.status = 'Cancelled'
    schedule.save(update_fields=['status', 'updated_at'])

    reason_messages = {
        'kicked': 'Candidate was kicked from the interview room by the interviewer.',
        'tab_switch_limit': 'Interview was terminated due to candidate exceeding tab switch limit.',
        'technical_issue': 'Interview was terminated due to face missing or technical issues.',
        'timeout': 'Interview was cancelled due to no-show after 15 minutes.'
    }
    msg_detail = reason_messages.get(reason, f"Reason: {reason}")

    try:
        from notifications.utils import create_notification
        create_notification(
            user=schedule.candidate.user,
            notification_type="interview",
            title="Interview Cancelled",
            message=f"Your interview scheduled for {schedule.scheduled_date} at {schedule.scheduled_time} was cancelled. {msg_detail}"
        )
        create_notification(
            user=schedule.interviewer.user,
            notification_type="interview",
            title="Interview Cancelled",
            message=f"Interview with {schedule.candidate.user.full_name} scheduled for {schedule.scheduled_date} was cancelled. {msg_detail}"
        )
    except Exception as e:
        logger.error(f"Failed to send cancellation notification: {e}")

    return Response({
        'message': 'Interview session cancelled successfully.',
        'status': schedule.status,
        'schedule_id': schedule.schedule_id,
        'reason': reason
    })


# ========== GET USER'S INTERVIEWS ==========
class UserInterviewListView(generics.ListAPIView):
    serializer_class = InterviewScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs_candidate = InterviewSchedule.objects.none()
        qs_interviewer = InterviewSchedule.objects.none()

        if hasattr(user, 'candidate_profile'):
            qs_candidate = InterviewSchedule.objects.select_related(
                'candidate__user', 'interviewer__user'
            ).filter(
                candidate=user.candidate_profile
            )
        if hasattr(user, 'interviewer_profile'):
            qs_interviewer = InterviewSchedule.objects.select_related(
                'candidate__user', 'interviewer__user'
            ).filter(
                interviewer=user.interviewer_profile
            )

        all_qs = (qs_candidate | qs_interviewer).select_related(
            'candidate__user', 'interviewer__user'
        ).distinct()

        # Check for date passing, 15-minute auto-cancellation for 'Scheduled' status & 15-min unaccepted expiration for 'Requested' status
        now = timezone.now()
        today = now.date()
        for sched in all_qs.filter(status__in=['Scheduled', 'Requested']):
            try:
                # If current date > scheduled date, auto-cancel irrespective of current time
                if today > sched.scheduled_date:
                    sched.status = 'Cancelled'
                    sched.save(update_fields=['status', 'updated_at'])
                    continue

                dt_naive = datetime.combine(sched.scheduled_date, sched.scheduled_time)
                scheduled_start = timezone.make_aware(dt_naive) if timezone.is_naive(dt_naive) else dt_naive

                if sched.status == 'Requested':
                    # If 15 minutes before scheduled start time has passed and interviewer hasn't accepted:
                    if now >= (scheduled_start - timedelta(minutes=15)):
                        cand_user = sched.candidate.user if (sched.candidate and hasattr(sched.candidate, 'user')) else None
                        sched.candidate = None
                        sched.status = 'Open'
                        sched.save(update_fields=['candidate', 'status', 'updated_at'])
                        if cand_user:
                            try:
                                from notifications.utils import create_notification
                                create_notification(
                                    user=cand_user,
                                    notification_type="interview",
                                    title="Interview Request Declined",
                                    message="The Interview request is declined."
                                )
                            except Exception as notif_err:
                                logger.error(f"Error sending request decline notification: {notif_err}")

                elif sched.status == 'Scheduled':
                    scheduled_end = scheduled_start + timedelta(minutes=sched.duration_minutes)
                    # If current time is past scheduled end time:
                    if now >= scheduled_end:
                        sched.status = 'Completed'
                        sched.save(update_fields=['status', 'updated_at'])
                    # If 15 minutes have passed after scheduled start time without joining:
                    elif now > (scheduled_start + timedelta(minutes=15)):
                        sched.status = 'Cancelled'
                        sched.save(update_fields=['status', 'updated_at'])
            except Exception as e:
                logger.error(f"Error auto-checking schedule {sched.schedule_id}: {e}")

        return all_qs.order_by('-scheduled_date')


# ========== END INTERVIEW SESSION (INTERVIEWER) ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_interview_session(request):
    schedule_id = request.data.get('schedule_id')
    room_name = request.data.get('room_name')

    schedule = None
    if schedule_id:
        schedule = InterviewSchedule.objects.filter(schedule_id=schedule_id).first()
    elif room_name:
        schedule = InterviewSchedule.objects.filter(room_name=room_name).first()

    if not schedule:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    is_interviewer = hasattr(request.user, 'interviewer_profile') and schedule.interviewer == request.user.interviewer_profile

    if is_interviewer:
        schedule.status = 'Completed'
        schedule.save(update_fields=['status', 'updated_at'])
        return Response({
            'message': 'Session ended by interviewer. Interview marked as completed.',
            'status': schedule.status,
            'interviewer_ended': True,
            'schedule_id': schedule.schedule_id,
        })
    else:
        return Response({
            'message': 'Session ended by candidate.',
            'status': schedule.status,
            'interviewer_ended': schedule.status in ['In Review', 'Completed'],
            'schedule_id': schedule.schedule_id,
        })


# ========== SUBMIT INTERVIEW FEEDBACK REVIEW ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_interview_feedback(request):
    from .models import InterviewFeedbackReview
    from .serializers import InterviewFeedbackReviewSerializer

    schedule_id = request.data.get('schedule_id')
    schedule = InterviewSchedule.objects.filter(schedule_id=schedule_id).first() if schedule_id else None

    candidate_id = request.data.get('candidate')
    if not candidate_id and schedule:
        candidate_id = schedule.candidate.pk

    interviewer_id = request.data.get('interviewer')
    if not interviewer_id and hasattr(request.user, 'interviewer_profile'):
        interviewer_id = request.user.interviewer_profile.pk

    if not candidate_id or not interviewer_id:
        return Response({'error': 'Candidate and interviewer profiles are required.'}, status=400)

    data = request.data.copy()
    data['candidate'] = candidate_id
    data['interviewer'] = interviewer_id
    if schedule:
        data['schedule'] = schedule.schedule_id

    serializer = InterviewFeedbackReviewSerializer(data=data)
    if serializer.is_valid():
        feedback_review = serializer.save()

        if schedule:
            schedule.status = 'Completed'
            schedule.save()

        try:
            from notifications.utils import create_notification
            create_notification(
                user=feedback_review.candidate.user,
                notification_type="interview",
                title="Interview Assessment Feedback Available",
                message=f"Interviewer {request.user.full_name} has completed your interview assessment feedback. Click to view results."
            )
        except Exception as e:
            logger.error(f"Failed to notify candidate of feedback: {e}")

        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


# ========== GET INTERVIEW FEEDBACK REVIEW ==========
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interview_feedback(request, schedule_id):
    from .models import InterviewFeedbackReview
    from .serializers import InterviewFeedbackReviewSerializer

    schedule = InterviewSchedule.objects.filter(schedule_id=schedule_id).first()
    if not schedule:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    feedback = InterviewFeedbackReview.objects.filter(schedule=schedule).order_by('-submitted_at').first()
    if not feedback:
        feedback = InterviewFeedbackReview.objects.filter(
            candidate=schedule.candidate,
            interviewer=schedule.interviewer
        ).order_by('-submitted_at').first()

    has_feedback = feedback is not None
    feedback_data = InterviewFeedbackReviewSerializer(feedback).data if feedback else None

    return Response({
        'schedule_id': schedule.schedule_id,
        'status': schedule.status,
        'has_feedback': has_feedback,
        'feedback': feedback_data
    })


# =====================================
# INTERVIEW PERFORMANCE FOR DASHBOARD
# =====================================
from django.db.models import Avg
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def interview_performance(request):
    from .services import get_interview_performance_summary
    data = get_interview_performance_summary(request.user)
    return Response(data)