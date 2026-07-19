from django.contrib import admin

from .models import Submission


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "language", "status", "judge0_status_description", "created_at")
    list_filter = ("language", "status")
    readonly_fields = [f.name for f in Submission._meta.fields]
