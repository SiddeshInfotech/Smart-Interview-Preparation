from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):

    list_display = (
        "feedback_id",
        "name",
        "email",
        "overall_experience",
        "mock_interview",
        "suggestions",
        "comments",
        "recommend",
        "recommendation_reason",
        "submitted_at",
    )

    search_fields = (
        "name",
        "email",
        "suggestions",
    )

    list_filter = (
        "overall_experience",
        "recommend",
        "submitted_at",
    )

    ordering = ("-submitted_at",)