from django.contrib import admin
from .models import InterviewSchedule

@admin.register(InterviewSchedule)
class InterviewScheduleAdmin(admin.ModelAdmin):
    list_display = (
        'schedule_id',
        'candidate',
        'interviewer',
        'scheduled_date',
        'scheduled_time',
        'duration_minutes',
        'status',
        'room_name',
        'created_at',
    )
    list_filter = ('status', 'scheduled_date')
    search_fields = (
        'candidate__user__email',
        'candidate__user__full_name',
        'interviewer__user__email',
        'interviewer__user__full_name',
    )
    readonly_fields = ('created_at', 'updated_at')
    fields = (
        'candidate',
        'interviewer',
        'scheduled_date',
        'scheduled_time',
        'duration_minutes',
        'status',
        'meeting_link',
        'room_name',
        'created_at',
        'updated_at',
    )
    raw_id_fields = ('candidate', 'interviewer')  # helps with performance if many users


from .models import InterviewFeedbackReview

@admin.register(InterviewFeedbackReview)
class InterviewFeedbackReviewAdmin(admin.ModelAdmin):
    list_display = (
        'review_id',
        'candidate',
        'interviewer',
        'overall_rating',
        'recommendation',
        'submitted_at',
    )
    list_filter = ('recommendation', 'submitted_at')
    search_fields = (
        'candidate__user__full_name',
        'candidate__user__email',
        'interviewer__user__full_name',
        'interviewer__user__email',
    )
    readonly_fields = ('submitted_at',)