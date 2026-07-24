from django.contrib import admin
from .models import QuizPerformance


@admin.register(QuizPerformance)
class QuizPerformanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'total_questions', 'correct_answers', 'wrong_answers', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'user__full_name')

