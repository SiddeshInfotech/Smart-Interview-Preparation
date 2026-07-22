from django.db import models
from django.core.exceptions import ValidationError
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


class InterviewerAvailability(models.Model):
    DAY_CHOICES = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )
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
    day_of_week = models.SmallIntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'Interviewer_Availability'
        indexes = [
            models.Index(fields=['interviewer', 'day_of_week', 'start_time']),
        ]

    def clean(self):
        super().clean()
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                raise ValidationError("End time must be after start time.")

            if hasattr(self, 'interviewer') and self.interviewer:
                overlapping = InterviewerAvailability.objects.filter(
                    interviewer=self.interviewer,
                    day_of_week=self.day_of_week,
                    start_time__lt=self.end_time,
                    end_time__gt=self.start_time
                )
                if self.pk:
                    overlapping = overlapping.exclude(pk=self.pk)
                if overlapping.exists():
                    raise ValidationError("This slot overlaps with an existing slot on the same day.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.interviewer.user.email} – {self.get_day_of_week_display()} {self.start_time}–{self.end_time}"