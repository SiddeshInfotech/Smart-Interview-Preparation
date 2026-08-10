from django.db import models
from authentication.models import User

class Candidate_Profile(models.Model):
    candidate_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column="user_id")
    profile_picture = models.ImageField(
        upload_to="profile_pics/", default="profile_pics/default.jpg", blank=True
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=150, blank=True, null=True)
    education = models.CharField(max_length=255, blank=True, null=True)
    experience_years = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    skills = models.TextField(blank=True, null=True)
    target_domain = models.CharField(max_length=150, blank=True, null=True)
    active_domain = models.ForeignKey(
        "course.Domain",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="candidates",
    )
    linkedin_url = models.URLField(max_length=255, blank=True, null=True)
    github_url = models.URLField(max_length=255, blank=True, null=True)
    portfolio_url = models.URLField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Candidate_Profile"

    def __str__(self):
        return f"{self.user.email}'s Candidate Profile"
