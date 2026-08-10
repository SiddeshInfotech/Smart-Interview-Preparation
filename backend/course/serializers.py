from rest_framework import serializers
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
        return obj.domain_courses.filter(course__is_active=True).count()


class TechnologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Technology
        fields = [
            "technology_id",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]


class CourseMaterialSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CourseMaterial
        fields = [
            "material_id",
            "topic",
            "title",
            "description",
            "file",
            "file_url",
            "material_type",
            "external_url",
            "file_size",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return obj.external_url or None


class CourseTopicSerializer(serializers.ModelSerializer):
    materials = CourseMaterialSerializer(many=True, read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = CourseTopic
        fields = [
            "topic_id",
            "module",
            "title",
            "description",
            "sequence",
            "is_active",
            "materials",
            "is_completed",
            "created_at",
            "updated_at",
        ]

    def get_is_completed(self, obj):
        request = self.context.get("request")
        domain_id = self.context.get("domain_id")
        if request and request.user.is_authenticated:
            try:
                candidate = request.user.candidate_profile
                active_dom_id = domain_id or (candidate.active_domain_id if candidate.active_domain else None)
                if active_dom_id:
                    return CandidateTopicProgress.objects.filter(
                        candidate=candidate,
                        domain_id=active_dom_id,
                        topic=obj,
                        completed=True,
                    ).exists()
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
    technology = TechnologySerializer(read_only=True)
    technology_id = serializers.PrimaryKeyRelatedField(
        queryset=Technology.objects.all(),
        source="technology",
        write_only=True,
        required=False,
        allow_null=True,
    )
    modules = serializers.SerializerMethodField()
    total_modules = serializers.SerializerMethodField()
    total_topics = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "course_id",
            "title",
            "description",
            "technology",
            "technology_id",
            "is_active",
            "modules",
            "total_modules",
            "total_topics",
            "progress",
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

    def get_progress(self, obj):
        request = self.context.get("request")
        domain_id = self.context.get("domain_id")
        if request and request.user.is_authenticated:
            try:
                candidate = request.user.candidate_profile
                dom_id = domain_id or (candidate.active_domain_id if candidate.active_domain else None)
                if dom_id:
                    prog = CourseProgress.objects.filter(
                        candidate=candidate, domain_id=dom_id, course=obj
                    ).first()
                    if prog:
                        return float(prog.progress_percentage)
            except Exception:
                pass
        return 0.0


class DomainCourseSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = DomainCourse
        fields = [
            "id",
            "domain",
            "domain_name",
            "course",
            "sequence",
            "is_required",
            "progress_percentage",
            "created_at",
        ]

    def get_progress_percentage(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            try:
                candidate = request.user.candidate_profile
                prog = CourseProgress.objects.filter(
                    candidate=candidate, domain=obj.domain, course=obj.course
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
            "started_at",
            "last_accessed_at",
            "completed",
            "completed_at",
        ]
        read_only_fields = ["progress_id", "candidate", "started_at", "last_accessed_at"]


class ActiveDomainUpdateSerializer(serializers.Serializer):
    domain_id = serializers.IntegerField(required=True)
