from django.db import models
from django.conf import settings


class ExecutionHistory(models.Model):
    STATUS_CHOICES = [
        ("success", "Success"),
        ("compile_error", "Compilation Error"),
        ("runtime_error", "Runtime Error"),
        ("timeout", "Time Limit Exceeded"),
        ("error", "Error"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="execution_histories"
    )
    language = models.CharField(max_length=50)
    source_code = models.TextField()
    stdin = models.TextField(blank=True, default="")
    stdout = models.TextField(blank=True, default="")
    stderr = models.TextField(blank=True, default="")
    execution_status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="success"
    )
    execution_time = models.FloatField(
        default=0.0,
        help_text="Execution time in seconds"
    )
    memory_used = models.IntegerField(
        null=True,
        blank=True,
        help_text="Memory used in KB"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Execution Histories"

    def __str__(self):
        user_str = self.user.email if self.user else "Anonymous"
        return f"[{self.language}] {user_str} - {self.execution_status} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
