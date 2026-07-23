"""
admin_panel/models.py

These are read-only, unmanaged model wrappers (managed=False) for the
database tables that do NOT have a corresponding Django app model yet.
They are placed here so Django can register them under the 'admin_panel'
app_label, which IS in INSTALLED_APPS.

Models already defined in their own apps are NOT duplicated here:
  - User / OtpVerification  -> authentication
  - Candidate_Profile       -> candidate
  - Interviewer_Profile     -> interviewer
  - InterviewSchedule       -> interview
  - Resume / ResumeAnalysis -> resume
  - Notification            -> notifications
"""

from django.db import models


class InterviewSession(models.Model):
    session_id    = models.AutoField(primary_key=True)
    schedule_id   = models.IntegerField()
    start_time    = models.DateTimeField(blank=True, null=True)
    end_time      = models.DateTimeField(blank=True, null=True)
    status        = models.CharField(max_length=20)
    recording_url = models.CharField(max_length=500, blank=True, null=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'Interview_Session'

    def __str__(self):
        return f"Session {self.session_id}"


class InterviewFeedback(models.Model):
    feedback_id    = models.AutoField(primary_key=True)
    session_id     = models.IntegerField()
    interviewer_id = models.IntegerField()
    overall_rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    strengths      = models.TextField(blank=True, null=True)
    weaknesses     = models.TextField(blank=True, null=True)
    comments       = models.TextField(blank=True, null=True)
    recommendation = models.CharField(max_length=14, blank=True, null=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'Interview_Feedback'

    def __str__(self):
        return f"Feedback {self.feedback_id}"


class QuestionBank(models.Model):
    question_id   = models.AutoField(primary_key=True)
    question_text = models.TextField()
    category      = models.CharField(max_length=100, blank=True, null=True)
    question_type = models.CharField(max_length=20)
    difficulty    = models.CharField(max_length=10)
    correct_answer= models.TextField(blank=True, null=True)
    max_score     = models.IntegerField(default=10)
    created_by_id = models.IntegerField(blank=True, null=True, db_column='created_by')
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'Question_Bank'

    def __str__(self):
        return self.question_text[:60]


class SessionQuestions(models.Model):
    session_question_id   = models.AutoField(primary_key=True)
    session_id            = models.IntegerField()
    question_id           = models.IntegerField()
    sequence_number       = models.IntegerField()
    time_allotted_seconds = models.IntegerField(blank=True, null=True)
    candidate_answer      = models.TextField(blank=True, null=True)
    score_awarded         = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    class Meta:
        managed  = False
        db_table = 'Session_Questions'

    def __str__(self):
        return f"SQ {self.session_question_id}"


class CodingSubmissions(models.Model):
    submission_id        = models.AutoField(primary_key=True)
    session_question_id  = models.IntegerField(db_column='session_question_id')
    candidate_id         = models.IntegerField(db_column='candidate_id')
    language             = models.CharField(max_length=50)
    source_code          = models.TextField()
    status               = models.CharField(max_length=20)
    execution_output     = models.TextField(blank=True, null=True)
    runtime_ms           = models.IntegerField(blank=True, null=True)
    score                = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    submitted_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'Coding_Submissions'

    def __str__(self):
        return f"Submission {self.submission_id}"


class PerformanceAnalytics(models.Model):
    analytics_id           = models.AutoField(primary_key=True)
    candidate_id           = models.IntegerField(db_column='candidate_id')
    session_id             = models.IntegerField(db_column='session_id')
    technical_score        = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    communication_score    = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    problem_solving_score  = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    overall_score          = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    percentile_rank        = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    generated_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed  = False
        db_table = 'Performance_Analytics'

    def __str__(self):
        return f"Analytics {self.analytics_id}"
