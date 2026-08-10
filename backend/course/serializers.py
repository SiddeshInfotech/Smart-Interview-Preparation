from rest_framework import serializers
from .models import (
    Domain,
    Course,
    CourseModule,
    CourseTopic,
    CourseProgress,
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


class CourseTopicSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = CourseTopic
        fields = [
            "topic_id",
            "module",
            "title",
            "description",
            "sequence",
            "pdf_file",
            "pdf_title",
            "pdf_url",
            "file_size",
            "is_active",
            "is_completed",
            "created_at",
            "updated_at",
        ]

    def get_pdf_url(self, obj):
        if obj.pdf_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None

    def get_is_completed(self, obj):
        completed_ids = self.context.get("completed_topic_ids")
        if completed_ids is not None:
            return obj.topic_id in completed_ids

        request = self.context.get("request")
        domain_id = self.context.get("domain_id")
        if request and request.user.is_authenticated:
            try:
                candidate = request.user.candidate_profile
                dom_id = domain_id or (candidate.active_domain_id if candidate.active_domain else None)
                if dom_id:
                    prog = CourseProgress.objects.filter(
                        candidate=candidate, domain_id=dom_id, course=obj.module.course
                    ).first()
                    if prog and isinstance(prog.completed_topic_ids, list):
                        return obj.topic_id in prog.completed_topic_ids
            except Exception:
                pass
        return False


class CourseModuleSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()

    class Meta:
        model = CourseModule
        fields = [
            "module_id",
            "course",
            "title",
            "description",
            "sequence",
            "is_active",
            "topics",
            "created_at",
            "updated_at",
        ]

    def get_topics(self, obj):
        active_topics = obj.topics.filter(is_active=True).order_by("sequence", "topic_id")
        return CourseTopicSerializer(active_topics, many=True, context=self.context).data


class CourseSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    modules = serializers.SerializerMethodField()
    total_modules = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()

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
            "progress_percentage",
            "created_at",
            "updated_at",
        ]

    def get_modules(self, obj):
        active_modules = obj.modules.filter(is_active=True).order_by("sequence", "module_id")
        return CourseModuleSerializer(active_modules, many=True, context=self.context).data

    def get_total_modules(self, obj):
        return obj.modules.filter(is_active=True).count()

    def get_total_topics(self, obj):
        return CourseTopic.objects.filter(module__course=obj, module__is_active=True, is_active=True).count()

    def get_progress_percentage(self, obj):
        progress_map = self.context.get("progress_map")
        if progress_map and obj.course_id in progress_map:
            return float(progress_map[obj.course_id])

        request = self.context.get("request")
        domain_id = self.context.get("domain_id") or obj.domain_id
        if request and request.user.is_authenticated:
            try:
                candidate = request.user.candidate_profile
                prog = CourseProgress.objects.filter(
                    candidate=candidate, domain_id=domain_id, course=obj
                ).first()
                if prog:
                    return float(prog.progress_percentage)
            except Exception:
                pass
        return 0.0


class CourseProgressSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = CourseProgress
        fields = [
            "progress_id",
            "candidate",
            "domain",
            "domain_name",
            "course",
            "course_title",
            "progress_percentage",
            "completed_topic_ids",
            "completed",
            "completed_at",
            "started_at",
            "last_accessed_at",
        ]
        read_only_fields = ["progress_id", "candidate", "started_at", "last_accessed_at"]


class ActiveDomainUpdateSerializer(serializers.Serializer):
    domain_id = serializers.IntegerField(required=True)
