from django.contrib import admin
from .models import Resume, ResumeAnalysis


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("resume_id", "candidate_id", "file_name", "status", "is_active", "uploaded_at")
    list_filter = ("status", "is_active", "uploaded_at")
    search_fields = ("file_name", "candidate_id")


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        "analysis_id",
        "resume",
        "candidate_name",
        "email",
        "target_domain",
        "domain_match_score",
        "domain_match_status",
        "resume_score",
        "analyzed_at",
    )
    search_fields = ("candidate_name", "email", "extracted_skills", "target_domain", "domain_match_feedback")
    list_filter = ("domain_match_status", "analyzed_at")
