from django.contrib import admin
from .models import Resume, ResumeAnalysis


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("resume_id", "candidate_id", "file_name", "status", "uploaded_at")
    list_filter = ("status", "uploaded_at")
    search_fields = ("file_name", "candidate_id")


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ("analysis_id", "resume", "candidate_name", "email", "resume_score", "analyzed_at")
    search_fields = ("candidate_name", "email", "extracted_skills")
    list_filter = ("analyzed_at",)
