from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch

from candidate.models import Candidate_Profile
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
from .serializers import (
    DomainSerializer,
    TechnologySerializer,
    CourseSerializer,
    DomainCourseSerializer,
    CourseModuleSerializer,
    CourseTopicSerializer,
    CourseMaterialSerializer,
    CourseProgressSerializer,
    ActiveDomainUpdateSerializer,
)
from .services import recalculate_course_progress, switch_active_domain


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or getattr(request.user, "role", "") == "admin")


class DomainViewSet(viewsets.ModelViewSet):
    queryset = Domain.objects.filter(is_active=True)
    serializer_class = DomainSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if self.request.user and (self.request.user.is_staff or getattr(self.request.user, "role", "") == "admin"):
            return Domain.objects.all()
        return Domain.objects.filter(is_active=True)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def courses(self, request, pk=None):
        domain = self.get_object()
        domain_courses = DomainCourse.objects.filter(
            domain=domain, course__is_active=True
        ).select_related("course", "course__technology").order_by("sequence", "id")

        serializer = DomainCourseSerializer(
            domain_courses, many=True, context={"request": request}
        )
        return Response(serializer.data)


class TechnologyViewSet(viewsets.ModelViewSet):
    queryset = Technology.objects.filter(is_active=True)
    serializer_class = TechnologySerializer
    permission_classes = [IsAdminOrReadOnly]


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.filter(is_active=True)
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if self.request.user and (self.request.user.is_staff or getattr(self.request.user, "role", "") == "admin"):
            return Course.objects.all()
        return Course.objects.filter(is_active=True)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def modules(self, request, pk=None):
        course = self.get_object()
        active_modules = CourseModule.objects.filter(
            course=course, is_active=True
        ).order_by("sequence", "module_id")

        domain_id = request.query_params.get("domain_id")
        serializer = CourseModuleSerializer(
            active_modules,
            many=True,
            context={"request": request, "domain_id": domain_id},
        )
        return Response(serializer.data)


class CourseModuleViewSet(viewsets.ModelViewSet):
    queryset = CourseModule.objects.filter(is_active=True)
    serializer_class = CourseModuleSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def topics(self, request, pk=None):
        module = self.get_object()
        active_topics = CourseTopic.objects.filter(
            module=module, is_active=True
        ).order_by("sequence", "topic_id")

        domain_id = request.query_params.get("domain_id")
        serializer = CourseTopicSerializer(
            active_topics,
            many=True,
            context={"request": request, "domain_id": domain_id},
        )
        return Response(serializer.data)


class CourseTopicViewSet(viewsets.ModelViewSet):
    queryset = CourseTopic.objects.filter(is_active=True)
    serializer_class = CourseTopicSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def materials(self, request, pk=None):
        topic = self.get_object()
        materials = CourseMaterial.objects.filter(topic=topic, is_active=True).order_by("material_id")
        serializer = CourseMaterialSerializer(materials, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated], url_path="toggle-complete")
    def toggle_complete(self, request, pk=None):
        topic = self.get_object()
        candidate = get_object_or_404(Candidate_Profile, user=request.user)

        domain_id = request.data.get("domain_id") or request.query_params.get("domain_id")
        if domain_id:
            domain = get_object_or_404(Domain, pk=domain_id, is_active=True)
        elif candidate.active_domain:
            domain = candidate.active_domain
        else:
            return Response(
                {"error": "No domain specified and candidate has no active domain set."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        topic_prog, created = CandidateTopicProgress.objects.get_or_create(
            candidate=candidate,
            domain=domain,
            topic=topic,
            defaults={"completed": True},
        )

        if not created:
            topic_prog.completed = not topic_prog.completed
            topic_prog.save()

        # Recalculate overall course progress
        course = topic.module.course
        course_prog = recalculate_course_progress(candidate, domain, course)

        return Response({
            "topic_id": topic.topic_id,
            "topic_completed": topic_prog.completed,
            "domain_id": domain.domain_id,
            "course_id": course.course_id,
            "course_progress": float(course_prog.progress_percentage),
            "course_completed": course_prog.completed,
        })


class CourseMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourseMaterial.objects.filter(is_active=True)
    serializer_class = CourseMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]


class ActiveDomainView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate, _ = Candidate_Profile.objects.get_or_create(user=request.user)
        active_domain = candidate.active_domain

        domains = Domain.objects.filter(is_active=True)
        domain_serializer = DomainSerializer(domains, many=True, context={"request": request})

        if not active_domain:
            # If no active domain set, default to first domain if exists
            first_domain = domains.first()
            if first_domain:
                switch_active_domain(candidate, first_domain)
                active_domain = first_domain

        active_domain_data = None
        courses_data = []

        if active_domain:
            active_domain_data = DomainSerializer(active_domain, context={"request": request}).data
            domain_courses = DomainCourse.objects.filter(
                domain=active_domain, course__is_active=True
            ).select_related("course", "course__technology").order_by("sequence", "id")

            courses_data = DomainCourseSerializer(
                domain_courses, many=True, context={"request": request}
            ).data

        return Response({
            "active_domain": active_domain_data,
            "available_domains": domain_serializer.data,
            "courses": courses_data,
        })

    def put(self, request):
        return self._handle_switch(request)

    def patch(self, request):
        return self._handle_switch(request)

    def _handle_switch(self, request):
        serializer = ActiveDomainUpdateSerializer(data=request.data)
        serializer.is_validate_obj = serializer.is_valid()
        if not serializer.is_validate_obj:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        domain_id = serializer.validated_data["domain_id"]
        target_domain = get_object_or_404(Domain, pk=domain_id, is_active=True)
        candidate, _ = Candidate_Profile.objects.get_or_create(user=request.user)

        domain_courses = switch_active_domain(candidate, target_domain)

        active_domain_data = DomainSerializer(target_domain, context={"request": request}).data
        courses_data = DomainCourseSerializer(
            domain_courses, many=True, context={"request": request}
        ).data

        return Response({
            "message": f"Active domain updated to {target_domain.name}",
            "active_domain": active_domain_data,
            "courses": courses_data,
        })


class CourseProgressViewSet(viewsets.ModelViewSet):
    serializer_class = CourseProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            candidate = self.request.user.candidate_profile
            return CourseProgress.objects.filter(candidate=candidate)
        except Exception:
            return CourseProgress.objects.none()

    def perform_create(self, serializer):
        candidate, _ = Candidate_Profile.objects.get_or_create(user=self.request.user)
        serializer.save(candidate=candidate)
