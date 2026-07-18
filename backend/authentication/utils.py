import random
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_otp():
    """
    Generate a random 6-digit OTP.
    """
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp, purpose):
    """
    Send OTP to the user's email via Gmail SMTP.
    """

    subject = f"{purpose} OTP"
    message = f"""
Hello,


Your OTP for {purpose} is:

{otp}

This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.

Regards,
Smart Interview Preparation Portal
"""

    try:
        logger.info(f"Attempting to send OTP to {email} via {settings.EMAIL_HOST}")
        logger.info(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        
        from_email = settings.DEFAULT_FROM_EMAIL
        send_mail(
            subject,
            message,
            from_email,
            [email],
            fail_silently=False,
        )
        logger.info(f"OTP successfully sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {type(e).__name__}: {str(e)}")
        raise
