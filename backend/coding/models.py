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
        ("success", "Success"),
        ("failed", "Failed"),
    )


    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )


    question = models.ForeignKey(
        CodingQuestion,
        on_delete=models.CASCADE
    )


    language = models.CharField(
        max_length=50
    )


    code = models.TextField()


    input_data = models.TextField(
        blank=True
    )


    output = models.TextField(
        blank=True
    )


    error = models.TextField(
        blank=True
    )


    status = models.CharField(
        max_length=20,
        choices=STATUS,
        default="failed"
    )


    score = models.IntegerField(
        default=0
    )


    submitted_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):

        return f"{self.user.username} - {self.question.title}"