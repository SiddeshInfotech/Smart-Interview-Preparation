import random
from django.core.mail import send_mail
from django.conf import settings

def generate_otp():
    """
    Generate a random 6-digit OTP.
    """
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp, purpose):
    """
    Send OTP to the user's email.
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

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )
