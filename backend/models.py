# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class CandidateProfile(models.Model):
    candidate_id = models.AutoField(primary_key=True)
    user = models.OneToOneField('Users', models.DO_NOTHING)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    education = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    linkedin_url = models.CharField(max_length=255, blank=True, null=True)
    github_url = models.CharField(max_length=255, blank=True, null=True)
    portfolio_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Candidate_Profile'


class CodingSubmissions(models.Model):
    submission_id = models.AutoField(primary_key=True)
    session_question = models.ForeignKey('SessionQuestions', models.DO_NOTHING)
    candidate = models.ForeignKey(CandidateProfile, models.DO_NOTHING)
    language = models.CharField(max_length=50)
    source_code = models.TextField()
    status = models.CharField(max_length=9)
    execution_output = models.TextField(blank=True, null=True)
    runtime_ms = models.IntegerField(blank=True, null=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    submitted_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Coding_Submissions'


class InterviewFeedback(models.Model):
    feedback_id = models.AutoField(primary_key=True)
    session = models.OneToOneField('InterviewSession', models.DO_NOTHING)
    interviewer = models.ForeignKey('InterviewerProfile', models.DO_NOTHING)
    overall_rating = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    strengths = models.TextField(blank=True, null=True)
    weaknesses = models.TextField(blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    recommendation = models.CharField(max_length=14, blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Interview_Feedback'


class InterviewSchedule(models.Model):
    schedule_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(CandidateProfile, models.DO_NOTHING)
    interviewer = models.ForeignKey('InterviewerProfile', models.DO_NOTHING)
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField()
    status = models.CharField(max_length=11)
    meeting_link = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Interview_Schedule'


class InterviewSession(models.Model):
    session_id = models.AutoField(primary_key=True)
    schedule = models.OneToOneField(InterviewSchedule, models.DO_NOTHING)
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=11)
    recording_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Interview_Session'


class InterviewerProfile(models.Model):
    interviewer_id = models.AutoField(primary_key=True)
    user = models.OneToOneField('Users', models.DO_NOTHING)
    department = models.CharField(max_length=150, blank=True, null=True)
    designation = models.CharField(max_length=150, blank=True, null=True)
    expertise_area = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    is_available = models.IntegerField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Interviewer_Profile'


class Notifications(models.Model):
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING)
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=19)
    is_read = models.IntegerField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Notifications'


class OtpVerification(models.Model):
    otp_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.DO_NOTHING)
    otp_code = models.CharField(max_length=10)
    purpose = models.CharField(max_length=18)
    is_verified = models.IntegerField()
    attempts = models.IntegerField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'OTP_Verification'


class PerformanceAnalytics(models.Model):
    analytics_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(CandidateProfile, models.DO_NOTHING)
    session = models.OneToOneField(InterviewSession, models.DO_NOTHING)
    technical_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    communication_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    problem_solving_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    percentile_rank = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    generated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Performance_Analytics'


class QuestionBank(models.Model):
    question_id = models.AutoField(primary_key=True)
    question_text = models.TextField()
    category = models.CharField(max_length=100, blank=True, null=True)
    question_type = models.CharField(max_length=10)
    difficulty = models.CharField(max_length=6)
    correct_answer = models.TextField(blank=True, null=True)
    max_score = models.IntegerField()
    created_by = models.ForeignKey('Users', models.DO_NOTHING, db_column='created_by', blank=True, null=True)
    is_active = models.IntegerField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Question_Bank'


class Resume(models.Model):
    resume_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(CandidateProfile, models.DO_NOTHING)
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size_kb = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=10)
    uploaded_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Resume'


class ResumeAnalysis(models.Model):
    analysis_id = models.AutoField(primary_key=True)
    resume = models.OneToOneField(Resume, models.DO_NOTHING)
    ats_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    extracted_skills = models.TextField(blank=True, null=True)
    strengths = models.TextField(blank=True, null=True)
    weaknesses = models.TextField(blank=True, null=True)
    suggestions = models.TextField(blank=True, null=True)
    analyzed_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Resume_Analysis'


class SessionQuestions(models.Model):
    session_question_id = models.AutoField(primary_key=True)
    session = models.ForeignKey(InterviewSession, models.DO_NOTHING)
    question = models.ForeignKey(QuestionBank, models.DO_NOTHING)
    sequence_number = models.IntegerField()
    time_allotted_seconds = models.IntegerField(blank=True, null=True)
    candidate_answer = models.TextField(blank=True, null=True)
    score_awarded = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Session_Questions'
        unique_together = (('session', 'sequence_number'), ('session', 'question'),)


class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=150)
    email = models.CharField(unique=True, max_length=150)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=11)
    is_active = models.IntegerField()
    is_email_verified = models.IntegerField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'Users'
