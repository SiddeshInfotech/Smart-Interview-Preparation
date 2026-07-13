from django.db import models


class Resume(models.Model):

    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("processing", "Processing"),
        ("analyzed", "Analyzed"),
        ("failed", "Failed"),
    ]

    resume_id = models.AutoField(primary_key=True)
    candidate_id = models.IntegerField()
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size_kb = models.IntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="uploaded",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Resume"

    def __str__(self):
        return self.file_name


class ResumeAnalysis(models.Model):

    analysis_id = models.AutoField(primary_key=True)

    resume = models.OneToOneField(
        Resume,
        on_delete=models.CASCADE,
        db_column="resume_id",
    )

    extracted_skills = models.TextField(
        blank=True,
        null=True
    )

    resume_score = models.IntegerField(
        blank=True,
        null=True
    )

    summary = models.TextField(
        blank=True,
        null=True
    )

    suggestions = models.TextField(
        blank=True,
        null=True
    )

    analyzed_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        db_table = "Resume_Analysis"

    def __str__(self):
        return f"Analysis {self.analysis_id}"