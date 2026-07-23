from rest_framework import serializers

# ── Models from their own apps ───────────────────────────────
from authentication.models import User, OtpVerification
from candidate.models import Candidate_Profile
from interviewer.models import Interviewer_Profile
from interview.models import InterviewSchedule
from resume.models import Resume, ResumeAnalysis
from notifications.models import Notification

# ── Models housed in admin_panel (managed=False wrappers) ────
from admin_panel.models import (
    InterviewSession,
    InterviewFeedback,
    QuestionBank,
    SessionQuestions,
    CodingSubmissions,
    PerformanceAnalytics,
)


# ── User ─────────────────────────────────────────────────────
class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_id', 'full_name', 'email', 'phone_number',
            'role', 'is_active', 'is_email_verified',
            'is_staff', 'is_superuser', 'created_at', 'updated_at',
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
        }


# ── Candidate Profile ────────────────────────────────────────
class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate_Profile
        fields = '__all__'


# ── Interviewer Profile ──────────────────────────────────────
class InterviewerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interviewer_Profile
        fields = '__all__'


# ── Question Bank ────────────────────────────────────────────
class QuestionBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionBank
        fields = '__all__'


# ── Interview Schedule ───────────────────────────────────────
class InterviewScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSchedule
        fields = '__all__'


# ── Interview Session ────────────────────────────────────────
class InterviewSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = '__all__'


# ── Interview Feedback ───────────────────────────────────────
class InterviewFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewFeedback
        fields = '__all__'


# ── Performance Analytics ────────────────────────────────────
class PerformanceAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceAnalytics
        fields = '__all__'


# ── Resume ───────────────────────────────────────────────────
class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = '__all__'


# ── Resume Analysis ──────────────────────────────────────────
class ResumeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = '__all__'


# ── Session Questions ────────────────────────────────────────
class SessionQuestionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionQuestions
        fields = '__all__'


# ── Coding Submissions ───────────────────────────────────────
class CodingSubmissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingSubmissions
        fields = '__all__'


# ── Notifications ────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


# ── OTP Verification ─────────────────────────────────────────
class OtpVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpVerification
        fields = '__all__'
