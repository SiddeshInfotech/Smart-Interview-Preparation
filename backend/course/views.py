import time
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import connection, models

from candidate.models import Candidate_Profile
from .models import (
    Domain,
    Course,
    CourseModule,
    CourseProgress,
)
from .serializers import (
    DomainSerializer,
    CourseSerializer,
    CourseModuleSerializer,
    CourseProgressSerializer,
    ActiveDomainUpdateSerializer,
)
from .services import recalculate_course_progress, switch_active_domain

logger = logging.getLogger(__name__)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or getattr(request.user, "role", "") == "admin")


class CourseBootstrapView(APIView):
    """
    High-Performance Orchestrator Endpoint:
    Returns Active Domain, Available Domains, Courses, Modules, and Progress
    in a single optimized response payload with pre-fetching.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        t0 = time.perf_counter()
        queries_before = len(connection.queries)

        candidate, _ = Candidate_Profile.objects.select_related("active_domain").get_or_create(user=request.user)
        domains = Domain.objects.filter(is_active=True).order_by("name")

        if candidate.target_domain:
            target = candidate.target_domain.strip()
            domain_obj = Domain.objects.filter(name__iexact=target, is_active=True).first()
            if not domain_obj and target.split():
                first_word = target.split()[0]
                domain_obj = Domain.objects.filter(name__icontains=first_word, is_active=True).first()
            if domain_obj and candidate.active_domain != domain_obj:
                switch_active_domain(candidate, domain_obj)
                candidate.active_domain = domain_obj

        active_domain = candidate.active_domain
        if not active_domain and domains.exists():
            first_domain = domains.first()
            switch_active_domain(candidate, first_domain)
            active_domain = first_domain

        domains_serialized = DomainSerializer(domains, many=True, context={"request": request}).data

        active_domain_data = None
        courses_data = []

        if active_domain:
            active_domain_data = DomainSerializer(active_domain, context={"request": request}).data

            # Pre-fetch courses and modules in 1 query
            domain_courses = Course.objects.filter(
                domain=active_domain, is_active=True
            ).prefetch_related("modules").order_by("sequence", "course_id")

            # Pre-fetch candidate progress records for active domain
            progress_qs = CourseProgress.objects.filter(
                candidate=candidate, domain=active_domain
            )
            progress_map = {p.course_id: p.progress_percentage for p in progress_qs}
            completed_modules_map = {p.course_id: set(p.completed_module_ids or []) for p in progress_qs}

            courses_data = CourseSerializer(
                domain_courses,
                many=True,
                context={
                    "request": request,
                    "domain_id": active_domain.domain_id,
                    "progress_map": progress_map,
                    "completed_modules_map": completed_modules_map,
                },
            ).data

        t_total = (time.perf_counter() - t0) * 1000
        queries_executed = len(connection.queries) - queries_before
        logger.info(f"Course Bootstrap executed in {t_total:.2f}ms with {queries_executed} DB queries")

        return Response({
            "active_domain": active_domain_data,
            "available_domains": domains_serialized,
            "courses": courses_data,
            "performance": {
                "response_time_ms": round(t_total, 2),
                "queries_executed": queries_executed,
            },
        })


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
        courses = Course.objects.filter(domain=domain, is_active=True).order_by("sequence", "course_id")
        serializer = CourseSerializer(courses, many=True, context={"request": request, "domain_id": domain.domain_id})
        return Response(serializer.data)


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
        active_modules = CourseModule.objects.filter(course=course, is_active=True).order_by("sequence", "module_id")
        serializer = CourseModuleSerializer(
            active_modules, many=True, context={"request": request, "domain_id": course.domain_id}
        )
        return Response(serializer.data)


class CourseModuleViewSet(viewsets.ModelViewSet):
    queryset = CourseModule.objects.filter(is_active=True)
    serializer_class = CourseModuleSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="toggle-complete",
    )
    def toggle_complete(self, request, pk=None):
        module = self.get_object()
        candidate = get_object_or_404(Candidate_Profile, user=request.user)

        course = module.course
        domain = course.domain

        progress, _ = CourseProgress.objects.get_or_create(
            candidate=candidate,
            domain=domain,
            course=course,
            defaults={"progress_percentage": 0.0, "completed_module_ids": []},
        )

        completed_ids = list(progress.completed_module_ids or [])
        if module.module_id in completed_ids:
            completed_ids.remove(module.module_id)
            is_completed = False
        else:
            completed_ids.append(module.module_id)
            is_completed = True

        progress.completed_module_ids = completed_ids
        progress.save()

        updated_prog = recalculate_course_progress(candidate, domain, course)

        return Response({
            "module_id": module.module_id,
            "module_completed": is_completed,
            "domain_id": domain.domain_id,
            "course_id": course.course_id,
            "course_progress": float(updated_prog.progress_percentage),
            "course_completed": updated_prog.completed,
        })



class ActiveDomainView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        candidate, _ = Candidate_Profile.objects.select_related("active_domain").get_or_create(user=request.user)
        active_domain = candidate.active_domain

        domains = Domain.objects.filter(is_active=True).order_by("name")
        domain_serializer = DomainSerializer(domains, many=True, context={"request": request})

        if not active_domain and domains.exists():
            first_domain = domains.first()
            switch_active_domain(candidate, first_domain)
            active_domain = first_domain

        active_domain_data = None
        courses_data = []

        if active_domain:
            active_domain_data = DomainSerializer(active_domain, context={"request": request}).data
            domain_courses = Course.objects.filter(
                domain=active_domain, is_active=True
            ).order_by("sequence", "course_id")

            courses_data = CourseSerializer(
                domain_courses, many=True, context={"request": request, "domain_id": active_domain.domain_id}
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
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        domain_id = serializer.validated_data["domain_id"]
        target_domain = get_object_or_404(Domain, pk=domain_id, is_active=True)
        candidate, _ = Candidate_Profile.objects.get_or_create(user=request.user)

        domain_courses = switch_active_domain(candidate, target_domain)

        active_domain_data = DomainSerializer(target_domain, context={"request": request}).data
        courses_data = CourseSerializer(
            domain_courses, many=True, context={"request": request, "domain_id": target_domain.domain_id}
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
