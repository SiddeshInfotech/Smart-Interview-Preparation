from rest_framework import serializers

# ── Import real models from their Django apps ────────────────
from authentication.models import User, OtpVerification
from candidate.models import Candidate_Profile
from interviewer.models import Interviewer_Profile, InterviewerAvailability
from interview.models import InterviewSchedule
from feedback.models import Feedback
from common.models import Skill
from resume.models import Resume, ResumeAnalysis
from notifications.models import Notification


# ── Auth User ────────────────────────────────────────────────
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

    def create(self, validated_data):
        password = self.initial_data.get('password')
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = self.initial_data.get('password')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ── OTP Verification ─────────────────────────────────────────
class OtpVerificationSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OtpVerification
        fields = '__all__'

    def get_user_email(self, obj):
        try:
            return obj.user.email
        except Exception:
            return None


# ── Candidate Profile ────────────────────────────────────────
class CandidateProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Candidate_Profile
        fields = '__all__'

    def get_user_email(self, obj):
        try:
            return obj.user.email
        except Exception:
            return None

    def get_user_name(self, obj):
        try:
            return obj.user.full_name
        except Exception:
            return None


# ── Interviewer Profile ──────────────────────────────────────
class InterviewerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Interviewer_Profile
        fields = '__all__'

    def get_user_email(self, obj):
        try:
            return obj.user.email
        except Exception:
            return None

    def get_user_name(self, obj):
        try:
            return obj.user.full_name
        except Exception:
            return None


# ── Interviewer Availability ─────────────────────────────────
class InterviewerAvailabilitySerializer(serializers.ModelSerializer):
    interviewer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InterviewerAvailability
        fields = '__all__'

    def get_interviewer_name(self, obj):
        try:
            return obj.interviewer.user.full_name
        except Exception:
            return None


# ── Interview Schedule ───────────────────────────────────────
class InterviewScheduleSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField(read_only=True)
    interviewer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InterviewSchedule
        fields = '__all__'

    def get_candidate_name(self, obj):
        try:
            return obj.candidate.user.full_name
        except Exception:
            return None

    def get_interviewer_name(self, obj):
        try:
            return obj.interviewer.user.full_name
        except Exception:
            return None


# ── Feedback ─────────────────────────────────────────────────
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'


# ── Skill ────────────────────────────────────────────────────
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
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


# ── Notification ─────────────────────────────────────────────
class NotificationSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'

    def get_user_email(self, obj):
        try:
            return obj.user.email
        except Exception:
            return None


# ── Interview Feedback Review ────────────────────────────────
from interview.models import InterviewFeedbackReview

class InterviewFeedbackReviewAdminSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField(read_only=True)
    interviewer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InterviewFeedbackReview
        fields = '__all__'

    def get_candidate_name(self, obj):
        try:
            return obj.candidate.user.full_name
        except Exception:
            return None

    def get_interviewer_name(self, obj):
        try:
            return obj.interviewer.user.full_name
        except Exception:
            return None


# ── Coding Models ───────────────────────────────────────────
from coding.models import CodingQuestion, CodeSubmission

class CodingQuestionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingQuestion
        fields = '__all__'


class CodeSubmissionAdminSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField(read_only=True)
    candidate_email = serializers.SerializerMethodField(read_only=True)
    question_title_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CodeSubmission
        fields = '__all__'

    def get_candidate_name(self, obj):
        if obj.user:
            return getattr(obj.user, 'full_name', obj.user.email)
        return "Anonymous Candidate"

    def get_candidate_email(self, obj):
        if obj.user:
            return obj.user.email
        return "N/A"

    def get_question_title_display(self, obj):
        try:
            if obj.question:
                return obj.question.title
        except Exception:
            pass
        return obj.question_title or "Coding Assessment"

