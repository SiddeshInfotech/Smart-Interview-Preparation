from rest_framework import serializers
from .models import InterviewSchedule

class InterviewScheduleSerializer(serializers.ModelSerializer):
    interviewer_name = serializers.SerializerMethodField()
    interviewer_username = serializers.SerializerMethodField()
    interviewer_designation = serializers.SerializerMethodField()
    interviewer_email = serializers.SerializerMethodField()
    interviewer_profile_picture = serializers.SerializerMethodField()
    candidate_name = serializers.SerializerMethodField()
    candidate_username = serializers.SerializerMethodField()
    candidate_email = serializers.SerializerMethodField()
    domain_id = serializers.ReadOnlyField(source='domain.domain_id', default=None)
    domain_name = serializers.ReadOnlyField(source='domain.name', default=None)

    class Meta:
        model = InterviewSchedule
        fields = [
            'schedule_id',
            'candidate',
            'candidate_name',
            'candidate_username',
            'candidate_email',
            'interviewer',
            'interviewer_name',
            'interviewer_username',
            'interviewer_designation',
            'interviewer_email',
            'interviewer_profile_picture',
            'domain',
            'domain_id',
            'domain_name',
            'scheduled_date',
            'scheduled_time',
            'duration_minutes',
            'status',
            'meeting_link',
            'room_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'schedule_id',
            'candidate_name',
            'candidate_username',
            'interviewer_name',
            'status',
            'room_name',
            'meeting_link',
            'created_at',
            'updated_at',
        ]

    def get_interviewer_name(self, obj):
        if obj.interviewer and hasattr(obj.interviewer, 'user'):
            return obj.interviewer.user.full_name or obj.interviewer.user.email
        return "Interviewer"

    def get_interviewer_username(self, obj):
        if obj.interviewer and hasattr(obj.interviewer, 'user'):
            return obj.interviewer.user.email
        return "interviewer"

    def get_interviewer_designation(self, obj):
        if obj.interviewer:
            return obj.interviewer.designation or ""
        return ""

    def get_interviewer_email(self, obj):
        if obj.interviewer and hasattr(obj.interviewer, 'user'):
            return obj.interviewer.user.email
        return ""

    def get_interviewer_profile_picture(self, obj):
        if obj.interviewer and obj.interviewer.profile_picture:
            try:
                return obj.interviewer.profile_picture.url
            except Exception:
                return str(obj.interviewer.profile_picture)
        return None

    def get_candidate_name(self, obj):
        if obj.candidate and hasattr(obj.candidate, 'user'):
            return obj.candidate.user.full_name or obj.candidate.user.email
        return None

    def get_candidate_username(self, obj):
        if obj.candidate and hasattr(obj.candidate, 'user'):
            return obj.candidate.user.email
        return None

    def get_candidate_email(self, obj):
        if obj.candidate and hasattr(obj.candidate, 'user'):
            return obj.candidate.user.email
        return None


from .models import InterviewFeedbackReview

class InterviewFeedbackReviewSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(
        source='candidate.user.full_name',
        read_only=True
    )
    interviewer_name = serializers.CharField(
        source='interviewer.user.full_name',
        read_only=True
    )

    class Meta:
        model = InterviewFeedbackReview
        fields = [
            'review_id',
            'candidate',
            'candidate_name',
            'interviewer',
            'interviewer_name',
            'schedule',
            'technical_skills',
            'communication_skills',
            'problem_solving',
            'soft_skills',
            'overall_rating',
            'strengths',
            'weaknesses',
            'comments',
            'recommendation',
            'submitted_at',
        ]
        read_only_fields = ['review_id', 'submitted_at']