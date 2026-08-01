from django.db import models
from django.conf import settings


class CodingQuestion(models.Model):
    DIFFICULTY = (
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY,
        default="easy"
    )
    language = models.CharField(
        max_length=50,
        default="python"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title


class CodeSubmission(models.Model):
    STATUS = (
        ("Passed", "Passed"),
        ("Failed", "Failed"),
        ("success", "Success"),
        ("failed", "Failed"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    question = models.ForeignKey(
        CodingQuestion,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    question_title = models.CharField(
        max_length=200,
        default="",
        blank=True
    )

    language = models.CharField(
        max_length=50
    )

    code = models.TextField()
    input_data = models.TextField(blank=True)
    output = models.TextField(blank=True)
    error = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="failed"
    )

    score = models.IntegerField(default=0)
    ai_evaluation = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["user", "-submitted_at"]),
            models.Index(fields=["user", "score"]),
        ]

    def __str__(self):
        user_label = getattr(self.user, 'full_name', None) or getattr(self.user, 'email', 'Anonymous') if self.user else "Anonymous"
        try:
            title_label = self.question.title if self.question else (self.question_title or "Coding Assessment")
        except Exception:
            title_label = self.question_title or "Coding Assessment"
        return f"{user_label} - {title_label} ({self.status} {self.score}%)"