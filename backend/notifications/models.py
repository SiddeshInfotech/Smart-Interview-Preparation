from django.db import models
from django.conf import settings


class Notification(models.Model):

    NOTIFICATION_TYPES = (
        ("system", "System"),
        ("resume", "Resume"),
        ("interview", "Interview"),
        ("assessment", "Assessment"),
        ("feedback", "Feedback"),
    )

    user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="notifications"
)

    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default="system"
    )

    title = models.CharField(max_length=200)

    message = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return self.title