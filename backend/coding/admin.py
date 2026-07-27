from django.contrib import admin
from .models import CodingQuestion, CodeSubmission


@admin.register(CodingQuestion)
class CodingQuestionAdmin(admin.ModelAdmin):
    list_display = ("title", "language", "difficulty", "created_at")
    list_filter = ("language", "difficulty")
    search_fields = ("title", "description")


@admin.register(CodeSubmission)
class CodeSubmissionAdmin(admin.ModelAdmin):
    list_display = ("get_username", "get_title", "language", "status", "score", "submitted_at")
    list_filter = ("status", "language", "submitted_at")
    search_fields = ("user__username", "question_title", "code", "output")
    readonly_fields = ("submitted_at",)

    def get_username(self, obj):
        return obj.user.username if obj.user else "Anonymous"
    get_username.short_description = "User"

    def get_title(self, obj):
        return obj.question.title if obj.question else (obj.question_title or "Coding Assessment")
    get_title.short_description = "Question Title"