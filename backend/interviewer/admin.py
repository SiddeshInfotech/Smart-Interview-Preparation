from django.contrib import admin
from .models import Interviewer_Profile

@admin.register(Interviewer_Profile)
class InterviewerProfileAdmin(admin.ModelAdmin):
    list_display = ['interviewer_id', 'user', 'department', 'designation', 'is_available', 'created_at']
    search_fields = ['user__email', 'department', 'designation']
    list_filter = ['is_available', 'department']
    raw_id_fields = ['user']   # for better performance with large user tables