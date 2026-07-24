from rest_framework import serializers
from .models import InterviewSchedule

class InterviewScheduleSerializer(serializers.ModelSerializer):
    # Add names and usernames from the related User models
    interviewer_name = serializers.CharField(
        source='interviewer.user.full_name',
        read_only=True
    )
    interviewer_username = serializers.CharField(
        source='interviewer.user.username',
        read_only=True
    )
    candidate_name = serializers.CharField(
        source='candidate.user.full_name',
        read_only=True
    )
    candidate_username = serializers.CharField(
        source='candidate.user.username',
        read_only=True
    )

    class Meta:
        model = InterviewSchedule
        fields = [
            'schedule_id',
            'candidate',
            'candidate_name',
            'candidate_username',
            'interviewer',
            'interviewer_name',
            'interviewer_username',
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
            'candidate',
            'candidate_name',
            'interviewer',
            'interviewer_name',
            'status',
            'room_name',
            'meeting_link',
            'created_at',
            'updated_at',
        ]


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
            'code_quality',
            'overall_rating',
            'strengths',
            'weaknesses',
            'comments',
            'recommendation',
            'submitted_at',
        ]
        read_only_fields = ['review_id', 'submitted_at']