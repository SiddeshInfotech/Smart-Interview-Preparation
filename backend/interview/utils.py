from django.core.mail import send_mail
from django.conf import settings

def send_interview_assignment_email(interview_schedule):
    """Send an email notification to the interviewer about a new assignment."""
    try:
        interviewer_user = interview_schedule.interviewer.user
        candidate_user = interview_schedule.candidate.user
        subject = f"New Interview Assignment: {candidate_user.full_name}"
        message = f"""
Dear {interviewer_user.full_name},

You have been assigned a new interview:

Candidate: {candidate_user.full_name}
Date: {interview_schedule.scheduled_date}
Time: {interview_schedule.scheduled_time}
Duration: {interview_schedule.duration_minutes} minutes

Please log in to the platform for more details.

Best regards,
Your Team
"""
        send_mail(
            subject,
            message.strip(),
            settings.DEFAULT_FROM_EMAIL,
            [interviewer_user.email],
            fail_silently=False,
        )
    except AttributeError as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send interview email: {e}")