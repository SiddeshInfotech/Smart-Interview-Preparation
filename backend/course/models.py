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

    pdf_file = models.FileField(
        upload_to="course_materials/%Y/%m/",
        validators=[validate_pdf_file],
        blank=True,
        null=True,
    )
    pdf_title = models.CharField(max_length=200, blank=True, null=True)
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    extracted_text = models.TextField(blank=True, null=True, help_text="Cached text extracted from PDF")
    text_extracted_at = models.DateTimeField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Module"
        ordering = ["sequence", "module_id"]

    def __str__(self):
        return f"{self.course.title} - {self.title}"

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_instance = CourseModule.objects.get(pk=self.pk)
                if old_instance.pdf_file != self.pdf_file:
                    self.extracted_text = None
                    self.text_extracted_at = None
            except Exception:
                pass
        if self.pdf_file and not self.file_size:
            try:
                self.file_size = self.pdf_file.size
            except Exception:
                pass
        if self.pdf_file and not self.pdf_title:
            self.pdf_title = f"{self.title} Notes"
        super().save(*args, **kwargs)


class CourseMaterial(models.Model):
    material_id = models.AutoField(primary_key=True)
    module = models.ForeignKey(
        CourseModule, on_delete=models.CASCADE, related_name="materials"
    )
    title = models.CharField(max_length=200)
    pdf_file = models.FileField(
        upload_to="course_materials/%Y/%m/",
        validators=[validate_pdf_file],
    )
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    extracted_text = models.TextField(blank=True, null=True, help_text="Cached text extracted from PDF")
    text_extracted_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Course_Material"
        ordering = ["material_id"]

    def __str__(self):
        return f"{self.module.title} - {self.title}"

    def save(self, *args, **kwargs):
        if self.pk:
            try:
                old_instance = CourseMaterial.objects.get(pk=self.pk)
                if old_instance.pdf_file != self.pdf_file:
                    self.extracted_text = None
                    self.text_extracted_at = None
            except Exception:
                pass
        if self.pdf_file and not self.file_size:
            try:
                self.file_size = self.pdf_file.size
            except Exception:
                pass
        super().save(*args, **kwargs)

