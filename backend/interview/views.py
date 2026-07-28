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
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_livekit_token(request):
    room_name = request.data.get('room_name')
    identity = request.data.get('identity')
    display_name = request.data.get('name')
    role = request.data.get('role', 'participant')

    # ✅ Convert identity to string (LiveKit requires string)
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

    # ✅ Debug: log credentials and identity
    logger.info(f"LIVEKIT_API_KEY: {LIVEKIT_API_KEY[:5]}... (length {len(LIVEKIT_API_KEY)})")
    logger.info(f"Identity: {identity}, Room: {room_name}, Role: {role}")

    # Validate timing constraints and authorization for room sessions
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

            dt_naive = datetime.combine(schedule.scheduled_date, schedule.scheduled_time)
            scheduled_start = timezone.make_aware(dt_naive) if timezone.is_naive(dt_naive) else dt_naive
            now = timezone.now()

            # Auto cancel if 15 mins past start time and status is Scheduled
            if now > (scheduled_start + timedelta(minutes=15)) and schedule.status == 'Scheduled':
                schedule.status = 'Cancelled'
                schedule.save(update_fields=['status', 'updated_at'])
                return Response({'error': 'This interview has been cancelled because neither party joined within 15 minutes of the scheduled time.'}, status=400)

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
            .with_identity(identity)          # ✅ now a string
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

        # ✅ Log the generated token (first 100 chars)
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
            'candidate__user', 'interviewer__user'
        ).get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    if schedule.interviewer.user != request.user:
        return Response({'error': 'You are not the interviewer for this session.'}, status=403)

    schedule.status = 'Scheduled'
    schedule.meeting_link = schedule.room_name
    schedule.save(update_fields=['status', 'meeting_link', 'updated_at'])

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
        schedule = InterviewSchedule.objects.select_related(
            'candidate__user', 'interviewer__user'
        ).get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({'error': 'Interview schedule not found.'}, status=404)

    if schedule.interviewer.user != request.user:
        return Response({'error': 'You are not the interviewer for this session.'}, status=403)

    schedule.status = 'Cancelled'
    schedule.save(update_fields=['status', 'updated_at'])

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

        # Check for 15-minute auto-cancellation for 'Scheduled' status
        now = timezone.now()
        for sched in all_qs.filter(status='Scheduled'):
            try:
                dt_naive = datetime.combine(sched.scheduled_date, sched.scheduled_time)
                scheduled_start = timezone.make_aware(dt_naive) if timezone.is_naive(dt_naive) else dt_naive
                if now > (scheduled_start + timedelta(minutes=15)):
                    sched.status = 'Cancelled'
                    sched.save(update_fields=['status', 'updated_at'])
            except Exception as e:
                logger.error(f"Error auto-cancelling schedule {sched.schedule_id}: {e}")

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
    user = request.user if request.user and request.user.is_authenticated else None
    
    if not user:
        return Response({
            "total_interviews": 0,
            "technical_skills": 0,
            "communication_skills": 0,
            "problem_solving": 0,
            "soft_skills": 0,
            "overall_performance": 0,
        })

    from candidate.models import Candidate_Profile
    candidate_profile = Candidate_Profile.objects.filter(user=user).first()
    if not candidate_profile:
        return Response({
            "total_interviews": 0,
            "technical_skills": 0,
            "communication_skills": 0,
            "problem_solving": 0,
            "soft_skills": 0,
            "overall_performance": 0,
        })

    from .models import InterviewFeedbackReview, InterviewSchedule
    reviews = InterviewFeedbackReview.objects.filter(candidate=candidate_profile)
    schedules = InterviewSchedule.objects.filter(candidate=candidate_profile)

    completed_schedules_count = schedules.filter(status='Completed').count()
    total_reviews_count = reviews.count()
    total_interviews = max(completed_schedules_count, total_reviews_count)

    if not reviews.exists():
        return Response({
            "total_interviews": total_interviews,
            "technical_skills": 0,
            "communication_skills": 0,
            "problem_solving": 0,
            "soft_skills": 0,
            "overall_performance": 0,
        })

    tech_avg = reviews.aggregate(Avg('technical_skills'))['technical_skills__avg'] or 0
    comm_avg = reviews.aggregate(Avg('communication_skills'))['communication_skills__avg'] or 0
    prob_avg = reviews.aggregate(Avg('problem_solving'))['problem_solving__avg'] or 0
    soft_avg = reviews.aggregate(Avg('soft_skills'))['soft_skills__avg'] or 0
    code_avg = reviews.aggregate(Avg('code_quality'))['code_quality__avg'] or 0
    overall_avg = reviews.aggregate(Avg('overall_rating'))['overall_rating__avg'] or 0

    # Summary average of all rating stats (out of 5)
    summary_avg = (tech_avg + comm_avg + prob_avg + soft_avg + code_avg) / 5.0 if any([tech_avg, comm_avg, prob_avg, soft_avg, code_avg]) else overall_avg

    return Response({
        "total_interviews": total_interviews,
        "technical_skills": round((tech_avg / 5.0) * 100),
        "communication_skills": round((comm_avg / 5.0) * 100),
        "problem_solving": round((prob_avg / 5.0) * 100),
        "soft_skills": round((soft_avg / 5.0) * 100),
        "code_quality": round((code_avg / 5.0) * 100),
        "overall_performance": round((summary_avg / 5.0) * 100),
    })