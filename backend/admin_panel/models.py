"""
admin_panel/models.py

The custom admin panel directly references the real models defined in the respective
Django application modules:
  - User, OtpVerification  -> authentication.models
  - Candidate_Profile       -> candidate.models
  - Interviewer_Profile, InterviewerAvailability -> interviewer.models
  - InterviewSchedule       -> interview.models
  - Feedback                -> feedback.models
  - Skill                   -> common.models
  - Resume, ResumeAnalysis  -> resume.models
  - Notification            -> notifications.models
"""
from django.db import models

# All models are imported directly from their respective application modules.
