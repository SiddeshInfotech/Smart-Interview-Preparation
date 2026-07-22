from rest_framework import serializers
from .models import InterviewSchedule


class InterviewScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSchedule
        fields = [
            'schedule_id',
            'candidate',
            'interviewer',
            'scheduled_date',
            'scheduled_time',
            'duration_minutes',
            'status',
            'meeting_link',
            'room_name',
            'created_at',
            'updated_at',
        ]
        # These fields are set by the server; clients must NOT send them
        read_only_fields = [
            'schedule_id',
            'candidate',
            'status',
            'room_name',
            'meeting_link',
            'created_at',
            'updated_at',
        ]