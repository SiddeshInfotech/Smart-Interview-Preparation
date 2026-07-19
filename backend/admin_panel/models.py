from django.db import models


class Submission(models.Model):
    """A single 'run this code' request and the result Judge0 returned."""

    LANGUAGE_CHOICES = [
        ("python", "Python 3"),
        ("javascript", "JavaScript (Node.js)"),
        ("java", "Java"),
        ("cpp", "C++"),
        ("c", "C"),
    ]

    STATUS_CHOICES = [
        ("queued", "Queued"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("error", "Error"),
    ]

    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES)
    source_code = models.TextField()
    stdin = models.TextField(blank=True, default="")

    stdout = models.TextField(blank=True, default="")
    stderr = models.TextField(blank=True, default="")
    compile_output = models.TextField(blank=True, default="")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="queued")
    judge0_status_description = models.CharField(max_length=100, blank=True, default="")
    judge0_token = models.CharField(max_length=64, blank=True, default="")

    execution_time = models.CharField(max_length=20, blank=True, default="")  # seconds, as returned
    memory_used = models.IntegerField(null=True, blank=True)  # KB

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Submission #{self.pk} ({self.language}, {self.status})"
