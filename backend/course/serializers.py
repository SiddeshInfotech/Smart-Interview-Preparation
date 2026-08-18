from rest_framework import serializers
from .models import (
    Domain,
    Course,
    CourseModule,
)


class DomainSerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()

    class Meta:
        model = Domain
        fields = [
            "domain_id",
            "name",
            "description",
            "is_active",
            "course_count",
            "created_at",
            "updated_at",
        ]

    def get_course_count(self, obj):
        return obj.courses.filter(is_active=True).count()


class CourseModuleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="module_id", read_only=True)
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = CourseModule
        fields = [
            "module_id",
            "id",
            "course",
            "title",
            "description",
            "sequence",
            "pdf_file",
            "pdf_title",
            "pdf_url",
            "file_size",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_pdf_url(self, obj):
        if obj.pdf_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            url = obj.pdf_file.url
            if not url.startswith("http"):
                from django.conf import settings
                backend_domain = getattr(settings, "BACKEND_DOMAIN", "http://localhost:8000")
                return f"{backend_domain.rstrip('/')}{url}"
            return url
        return None


class CourseSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    modules = serializers.SerializerMethodField()
    total_modules = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "course_id",
            "domain",
            "domain_name",
            "title",
            "description",
            "technology",
            "sequence",
            "is_required",
            "is_active",
            "modules",
            "total_modules",
            "total_topics",
            "created_at",
            "updated_at",
        ]

    def get_modules(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "modules" in obj._prefetched_objects_cache:
            active_modules = [m for m in obj.modules.all() if m.is_active]
            active_modules.sort(key=lambda m: (m.sequence, m.module_id))
        else:
            active_modules = obj.modules.filter(is_active=True).order_by("sequence", "module_id")

        return CourseModuleSerializer(active_modules, many=True, context=self.context).data

    def get_total_modules(self, obj):
        if hasattr(obj, "_prefetched_objects_cache") and "modules" in obj._prefetched_objects_cache:
            return len([m for m in obj.modules.all() if m.is_active])
        return obj.modules.filter(is_active=True).count()

    def get_total_topics(self, obj):
        return self.get_total_modules(obj)


class ActiveDomainUpdateSerializer(serializers.Serializer):
    domain_id = serializers.IntegerField(required=True)

