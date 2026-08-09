from rest_framework import serializers
from .models import Candidate_Profile

class CandidateProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Candidate_Profile
        fields = [
            'candidate_id', 'profile_picture', 'date_of_birth', 'gender',
            'location', 'education', 'experience_years', 'skills', 'target_domain',
            'linkedin_url', 'github_url', 'portfolio_url',
            'full_name', 'email'
        ]
        read_only_fields = ['candidate_id']