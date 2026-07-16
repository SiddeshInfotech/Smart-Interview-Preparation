from rest_framework import serializers
from .models import Resume, ResumeAnalysis


class ResumeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Resume
        fields = "__all__"


class ResumeAnalysisSerializer(serializers.ModelSerializer):

    class Meta:
        model = ResumeAnalysis
        fields = [
            "analysis_id",
            "resume",
            "candidate_name",
            "email",
            "role",
            "education",
            "experience",
            "location",
            "linkedin",
            "github",
            "portfolio",
            "extracted_skills",
            "matched_skills",
            "missing_skills",
            "suggested_next_skills",
            "skill_category",
            "resume_score",
            "summary",
            "suggestion_1",
            "suggestion_2",
            "suggestion_3",
            "analyzed_at"
        ]