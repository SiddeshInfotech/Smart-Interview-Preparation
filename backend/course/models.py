from django.db import models
from .validators import validate_pdf_file


class Domain(models.Model):
    domain_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Domain"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    domain = models.ForeignKey(
        Domain, on_delete=models.CASCADE, related_name="courses"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    technology = models.CharField(
        max_length=100, blank=True, null=True, help_text="e.g. Python, C#, React, Linux"
    )
    sequence = models.PositiveIntegerField(default=1)
    is_required = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course"
        ordering = ["sequence", "course_id"]

    def __str__(self):
        return f"{self.domain.name} - {self.title}"


class CourseModule(models.Model):
    module_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="modules"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    sequence = models.PositiveIntegerField(default=1)

    # PDF material attached directly to Module
    pdf_file = models.FileField(
        upload_to="course_materials/%Y/%m/",
        validators=[validate_pdf_file],
        blank=True,
        null=True,
    )
    pdf_title = models.CharField(max_length=200, blank=True, null=True)
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Module"
        ordering = ["sequence", "module_id"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def save(self, *args, **kwargs):
        if self.pdf_file and not self.file_size:
            try:
                self.file_size = self.pdf_file.size
            except Exception:
                pass
        if self.pdf_file and not self.pdf_title:
            self.pdf_title = f"{self.title} Notes"
        super().save(*args, **kwargs)


class CourseProgress(models.Model):
    progress_id = models.AutoField(primary_key=True)
    candidate = models.ForeignKey(
        "candidate.Candidate_Profile",
        on_delete=models.CASCADE,
        related_name="course_progresses",
    )
    domain = models.ForeignKey(
        Domain, on_delete=models.CASCADE, related_name="course_progresses"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="course_progresses"
    )
    progress_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.0
    )
    completed_module_ids = models.JSONField(
        default=list, blank=True, help_text="List of completed module IDs for this course"
    )
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Progress"
        unique_together = ("candidate", "domain", "course")
        ordering = ["-last_accessed_at"]

    def __str__(self):
        return f"{self.candidate.user.email} | {self.domain.name} | {self.course.title} | {self.progress_percentage}%"

