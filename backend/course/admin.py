from django.contrib import admin
from .models import (
    Domain,
    Technology,
    Course,
    DomainCourse,
    CourseModule,
    CourseTopic,
    CourseMaterial,
    CourseProgress,
    CandidateTopicProgress,
)


class DomainCourseInline(admin.TabularInline):
    model = DomainCourse
    extra = 1
    autocomplete_fields = ["course"]


class CourseModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 1


class CourseTopicInline(admin.TabularInline):
    model = CourseTopic
    extra = 1


class CourseMaterialInline(admin.StackedInline):
    model = CourseMaterial
    extra = 1


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ["domain_id", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    inlines = [DomainCourseInline]


@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = ["technology_id", "name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["course_id", "title", "technology", "is_active", "created_at"]
    list_filter = ["is_active", "technology"]
    search_fields = ["title", "description"]
    inlines = [CourseModuleInline]


@admin.register(DomainCourse)
class DomainCourseAdmin(admin.ModelAdmin):
    list_display = ["id", "domain", "course", "sequence", "is_required", "created_at"]
    list_filter = ["domain", "is_required"]
    search_fields = ["domain__name", "course__title"]


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ["module_id", "title", "course", "sequence", "is_active"]
    list_filter = ["course", "is_active"]
    search_fields = ["title", "description", "course__title"]
    inlines = [CourseTopicInline]


@admin.register(CourseTopic)
class CourseTopicAdmin(admin.ModelAdmin):
    list_display = ["topic_id", "title", "module", "sequence", "is_active"]
    list_filter = ["module__course", "is_active"]
    search_fields = ["title", "description", "module__title"]
    inlines = [CourseMaterialInline]


@admin.register(CourseMaterial)
class CourseMaterialAdmin(admin.ModelAdmin):
    list_display = [
        "material_id",
        "title",
        "topic",
        "material_type",
        "file",
        "file_size",
        "is_active",
    ]
    list_filter = ["material_type", "is_active"]
    search_fields = ["title", "description", "topic__title"]


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


@admin.register(CandidateTopicProgress)
class CandidateTopicProgressAdmin(admin.ModelAdmin):
    list_display = ["candidate", "domain", "topic", "completed", "completed_at"]
    list_filter = ["domain", "completed"]
    search_fields = ["candidate__user__email", "topic__title", "domain__name"]
