from rest_framework import serializers
from .models import Candidate_Profile

class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate_Profile
        fields = [
            'candidate_id', 'profile_picture', 'date_of_birth', 'gender',
            'location', 'education', 'experience_years', 'skills',
            'linkedin_url', 'github_url', 'portfolio_url'
        ]
        read_only_fields = ['candidate_id']