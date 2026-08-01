from django.contrib import admin
from .models import ExecutionHistory


@admin.register(ExecutionHistory)
class ExecutionHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "language", "execution_status", "execution_time", "created_at")
    list_filter = ("language", "execution_status")
    search_fields = ("user__email", "language", "source_code")
    readonly_fields = ("created_at",)
