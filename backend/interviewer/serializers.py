from rest_framework import serializers
from .models import Interviewer_Profile


class InterviewerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interviewer_Profile
        fields = [
            'interviewer_id', 'profile_picture', 'department', 'designation',
            'expertise_area', 'years_of_experience', 'is_available',
        ]
        read_only_fields = ['interviewer_id']
