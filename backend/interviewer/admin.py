# interviewer/admin.py
from django.contrib import admin
from .models import Interviewer_Profile, InterviewerAvailability


@admin.register(Interviewer_Profile)
class InterviewerProfileAdmin(admin.ModelAdmin):
    list_display = (
        'interviewer_id',
        'user',
        'department',
        'designation',
        'years_of_experience',
        'is_available',
        'created_at',
    )
    search_fields = (
        'user__email',
        'user__full_name',
        'department',
        'designation',
        'expertise_area',
    )
    list_filter = ('is_available', 'department', 'designation')
    readonly_fields = ('interviewer_id', 'created_at', 'updated_at')
    raw_id_fields = ('user',)
    fieldsets = (
        (None, {
            'fields': ('user', 'profile_picture', 'department', 'designation', 'expertise_area')
        }),
        ('Experience & Availability', {
            'fields': ('years_of_experience', 'is_available')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InterviewerAvailability)
class InterviewerAvailabilityAdmin(admin.ModelAdmin):
    list_display = (
        'availability_id',
        'interviewer',
        'start_time',
        'end_time',
        'status',
        'created_at',
    )
    search_fields = (
        'interviewer__user__email',
        'interviewer__user__full_name',
    )
    list_filter = ('status', 'start_time', 'end_time')
    readonly_fields = ('availability_id', 'created_at', 'updated_at')
    raw_id_fields = ('interviewer',)
    fieldsets = (
        (None, {
            'fields': ('interviewer', 'start_time', 'end_time', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )