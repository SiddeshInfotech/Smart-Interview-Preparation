from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import InterviewSchedule
from .utils import send_interview_assignment_email

@receiver(post_save, sender=InterviewSchedule)
def notify_interviewer_on_creation(sender, instance, created, **kwargs):
    if created:
        send_interview_assignment_email(instance)