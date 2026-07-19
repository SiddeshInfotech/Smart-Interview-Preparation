# interview/models.py
from django.db import models
from candidate.models import Candidate_Profile
from interviewer.models import Interviewer_Profile

class InterviewSchedule(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('In Progress', 'In Progress'),
    ]

    schedule_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(
        Candidate_Profile,
        models.DO_NOTHING,
        db_column='candidate_id'
    )
    interviewer = models.ForeignKey(
        Interviewer_Profile,
        models.DO_NOTHING,
        db_column='interviewer_id'
    )
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField()
    status = models.CharField(
        max_length=20,          # enough for 'In Progress' (11 characters)
        choices=STATUS_CHOICES,
        default='Scheduled'
    )
    meeting_link = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  
    room_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False          # keep this, because the table already exists
        db_table = 'Interview_Schedule'

    def __str__(self):
        return f"{self.candidate.user.full_name} with {self.interviewer.user.full_name} on {self.scheduled_date}"