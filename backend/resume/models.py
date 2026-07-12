from django.db import models

class ResumeAnalysis(models.Model):
    analysis_id = models.AutoField(primary_key=True)

    resume = models.OneToOneField(
        Resume,
        on_delete=models.CASCADE,
        db_column="resume_id"
    )

    extracted_skills = models.TextField(blank=True, null=True)
    resume_score = models.IntegerField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    suggestions = models.TextField(blank=True, null=True)

    analyzed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Resume_Analysis"

    def __str__(self):
        return f"Analysis {self.analysis_id}"
