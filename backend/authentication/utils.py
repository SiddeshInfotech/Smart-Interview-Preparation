import random
import logging
import threading
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def generate_otp():
    """
    Generate a random 6-digit OTP.
    """
    return str(random.randint(100000, 999999))

def _send_email_thread(subject, message, from_email, recipient_list):
    try:
        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )
        logger.info(f"OTP successfully sent to {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send OTP email to {recipient_list}: {type(e).__name__}: {str(e)}")

def send_otp_email(email, otp, purpose):
    """
    Send OTP to the user's email via SMTP/SendGrid in a background thread.
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
    from_email = settings.DEFAULT_FROM_EMAIL
    logger.info(f"Dispatching OTP email to {email} in background thread...")
    thread = threading.Thread(
        target=_send_email_thread,
        args=(subject, message, from_email, [email]),
        daemon=True
    )
    thread.start()

