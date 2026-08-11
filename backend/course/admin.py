from django.contrib import admin
from .models import (
    Domain,
    Course,
    CourseModule,
    CourseProgress,
)


class CourseModuleInline(admin.StackedInline):
    model = CourseModule
    extra = 1


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ["domain_id", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["course_id", "title", "domain", "technology", "sequence", "is_required", "is_active"]
    list_filter = ["domain", "is_required", "is_active"]
    search_fields = ["title", "description", "technology", "domain__name"]
    inlines = [CourseModuleInline]


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ["module_id", "title", "course", "sequence", "pdf_file", "file_size", "is_active"]
    list_filter = ["course__domain", "course", "is_active"]
    search_fields = ["title", "description", "course__title"]


@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = [
        "progress_id",
        "candidate",
        "domain",
        "course",
        "progress_percentage",
        "completed",
        "last_accessed_at",
    ]
    list_filter = ["domain", "completed"]
    search_fields = ["candidate__user__email", "course__title", "domain__name"]

