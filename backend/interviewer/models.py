from django.db import models
from authentication.models import User

class Interviewer_Profile(models.Model):
    interviewer_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column="user_id")
    profile_picture = models.ImageField(
        upload_to="interviewer_pics/", default="interviewer_pics/default.jpg", blank=True
    )
    department = models.CharField(max_length=150, blank=True, null=True)
    designation = models.CharField(max_length=150, blank=True, null=True)
    expertise_area = models.TextField(blank=True, null=True)
    years_of_experience = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Interviewer_Profile"

    def __str__(self):
        return f"{self.user.email}'s Interviewer Profile"


# ---------- NEW: Availability slots ----------
class InterviewerAvailability(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('unavailable', 'Unavailable'),
    )
    availability_id = models.AutoField(primary_key=True)
    interviewer = models.ForeignKey(
        Interviewer_Profile,
        on_delete=models.CASCADE,
        related_name='slots'
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Interviewer_Availability'
        indexes = [
            models.Index(fields=['interviewer', 'start_time']),
        ]

    def __str__(self):
        return f"{self.interviewer.user.email}: {self.start_time} – {self.end_time}"