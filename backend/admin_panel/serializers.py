from rest_framework import serializers
from models import (
    CandidateProfile,
    CodingSubmissions,
    InterviewFeedback,
    InterviewSchedule,
    InterviewSession,
    InterviewerProfile,
    Notifications,
    OtpVerification,
    PerformanceAnalytics,
    QuestionBank,
    Resume,
    ResumeAnalysis,
    SessionQuestions,
    Users,
)


class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = '__all__'


class CandidateProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CandidateProfile
        fields = '__all__'

    def get_user_name(self, obj):
        try:
            return obj.user.full_name
        except Exception:
            return None


class InterviewerProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InterviewerProfile
        fields = '__all__'

    def get_user_name(self, obj):
        try:
            return obj.user.full_name
        except Exception:
            return None


class QuestionBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionBank
        fields = '__all__'


class InterviewScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSchedule
        fields = '__all__'


class InterviewSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = '__all__'


class InterviewFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewFeedback
        fields = '__all__'


class PerformanceAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceAnalytics
        fields = '__all__'


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = '__all__'


class ResumeAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeAnalysis
        fields = '__all__'


class SessionQuestionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionQuestions
        fields = '__all__'


class CodingSubmissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingSubmissions
        fields = '__all__'


class NotificationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notifications
        fields = '__all__'


class OtpVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtpVerification
        fields = '__all__'
