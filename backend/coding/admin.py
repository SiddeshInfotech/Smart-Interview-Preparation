from django.contrib import admin
from .models import CodingQuestion, CodeSubmission


@admin.register(CodingQuestion)
class CodingQuestionAdmin(admin.ModelAdmin):
    list_display = ("title", "language", "difficulty", "created_at")
    list_filter = ("language", "difficulty")
    search_fields = ("title", "problem_statement")


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = ("get_user_label", "get_title", "language", "status", "score", "submitted_at")
    list_filter = ("status", "language", "submitted_at")
    search_fields = ("user__email", "user__full_name", "question_title", "code", "output")
    readonly_fields = ("submitted_at",)

    def get_user_label(self, obj):
        if not obj.user:
            return "Anonymous"
        return getattr(obj.user, "full_name", None) or getattr(obj.user, "email", "User")
    get_user_label.short_description = "Candidate / User"

    def get_title(self, obj):
        try:
            if obj.question:
                return obj.question.title
        except Exception:
            pass
        return obj.question_title or "Coding Assessment"
    get_title.short_description = "Question Title"