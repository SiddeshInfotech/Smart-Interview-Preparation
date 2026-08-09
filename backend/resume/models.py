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
    is_active = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Resume"

    def __str__(self):
        return self.file_name



class ResumeAnalysis(models.Model):

    analysis_id = models.AutoField(primary_key=True)

    resume = models.OneToOneField(
        "Resume",
        on_delete=models.CASCADE,
        db_column="resume_id"
    )

    summary = models.TextField(blank=True, null=True)
    resume_score = models.IntegerField(blank=True, null=True)

    # Candidate Information (Display only)
    candidate_name = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    education = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)

    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    portfolio = models.URLField(blank=True, null=True)

    role = models.CharField(max_length=150, blank=True, null=True)
    experience = models.TextField(blank=True, null=True)

    # Target Domain & Domain Matching Evaluation
    target_domain = models.CharField(max_length=150, blank=True, null=True)
    domain_match_score = models.IntegerField(default=0, blank=True, null=True)
    domain_match_status = models.BooleanField(default=False)
    domain_match_feedback = models.TextField(blank=True, null=True)

    # Skills
    extracted_skills = models.TextField(blank=True, null=True)
    matched_skills = models.TextField(blank=True, null=True)
    missing_skills = models.TextField(blank=True, null=True)

    suggested_next_skills = models.TextField(blank=True, null=True)
    skill_category = models.TextField(blank=True, null=True)

    # Suggestions (3)
    suggestion_1 = models.TextField(blank=True, null=True)
    suggestion_2 = models.TextField(blank=True, null=True)
    suggestion_3 = models.TextField(blank=True, null=True)

    analyzed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Resume_Analysis"