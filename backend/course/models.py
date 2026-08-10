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


class Technology(models.Model):
    technology_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Technology"
        verbose_name_plural = "Technologies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Course(models.Model):
    course_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    technology = models.ForeignKey(
        Technology,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course"
        ordering = ["title"]

    def __str__(self):
        return self.title


class DomainCourse(models.Model):
    domain = models.ForeignKey(
        Domain, on_delete=models.CASCADE, related_name="domain_courses"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="course_domains"
    )
    sequence = models.PositiveIntegerField(default=1)
    is_required = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Domain_Course"
        unique_together = ("domain", "course")
        ordering = ["sequence", "id"]

    def __str__(self):
        return f"{self.domain.name} -> {self.course.title}"


class CourseModule(models.Model):
    module_id = models.AutoField(primary_key=True)
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="modules"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    sequence = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Module"
        ordering = ["sequence", "module_id"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class CourseTopic(models.Model):
    topic_id = models.AutoField(primary_key=True)
    module = models.ForeignKey(
        CourseModule, on_delete=models.CASCADE, related_name="topics"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    sequence = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Topic"
        ordering = ["sequence", "topic_id"]

    def __str__(self):
        return f"{self.module.title} - {self.title}"


class CourseMaterial(models.Model):
    MATERIAL_TYPES = [
        ("PDF", "PDF"),
        ("VIDEO", "Video"),
        ("EXTERNAL_LINK", "External Link"),
    ]

    material_id = models.AutoField(primary_key=True)
    topic = models.ForeignKey(
        CourseTopic, on_delete=models.CASCADE, related_name="materials"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(
        upload_to="course_materials/%Y/%m/",
        validators=[validate_pdf_file],
        blank=True,
        null=True,
    )
    material_type = models.CharField(
        max_length=20, choices=MATERIAL_TYPES, default="PDF"
    )
    external_url = models.URLField(max_length=500, blank=True, null=True)
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Material"
        ordering = ["material_id"]

    def __str__(self):
        return f"{self.topic.title} - {self.title}"

    def save(self, *args, **kwargs):
        if self.file and not self.file_size:
            try:
                self.file_size = self.file.size
            except Exception:
                pass
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
    started_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(auto_now=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "Course_Progress"
        unique_together = ("candidate", "domain", "course")
        ordering = ["-last_accessed_at"]

    def __str__(self):
        return f"{self.candidate.user.email} | {self.domain.name} | {self.course.title} | {self.progress_percentage}%"


class CandidateTopicProgress(models.Model):
    candidate = models.ForeignKey(
        "candidate.Candidate_Profile",
        on_delete=models.CASCADE,
        related_name="topic_progresses",
    )
    domain = models.ForeignKey(
        Domain, on_delete=models.CASCADE, related_name="topic_progresses"
    )
    topic = models.ForeignKey(
        CourseTopic, on_delete=models.CASCADE, related_name="candidate_progresses"
    )
    completed = models.BooleanField(default=True)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Candidate_Topic_Progress"
        unique_together = ("candidate", "domain", "topic")

    def __str__(self):
        return f"{self.candidate.user.email} | {self.topic.title} | Completed: {self.completed}"
