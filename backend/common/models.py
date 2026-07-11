from django.db import models


class Skill(models.Model):
    CATEGORY_CHOICES = [
        ("Programming", "Programming"),
        ("Frontend", "Frontend"),
        ("Backend", "Backend"),
        ("Database", "Database"),
        ("DevOps", "DevOps"),
        ("Cloud", "Cloud"),
        ("AI/ML", "AI/ML"),
        ("Testing", "Testing"),
        ("Game Development", "Game Development"),
        ("Other", "Other"),
    ]

    skill_name = models.CharField(max_length=100, unique=True)

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default="Other"
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["skill_name"]
        verbose_name = "Skill"
        verbose_name_plural = "Skills"

    def __str__(self):
        return self.skill_name