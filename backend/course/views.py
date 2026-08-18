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
)
from .serializers import (
    DomainSerializer,
    CourseSerializer,
    CourseModuleSerializer,
    ActiveDomainUpdateSerializer,
)
from .services import switch_active_domain

logger = logging.getLogger(__name__)


from rest_framework_simplejwt.authentication import JWTAuthentication

class OptionalJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or getattr(request.user, "role", "") == "admin")


class CourseBootstrapView(APIView):
    """
    High-Performance Orchestrator Endpoint:
    Returns Active Domain, Available Domains, Courses, and Modules
    in a single optimized response payload with pre-fetching.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        t0 = time.perf_counter()
        queries_before = len(connection.queries)

        candidate, _ = Candidate_Profile.objects.select_related("active_domain").get_or_create(user=request.user)
        domains = Domain.objects.filter(is_active=True).order_by("name")

        if candidate.target_domain:
            from .services import resolve_domain_by_name
            domain_obj = resolve_domain_by_name(candidate.target_domain)
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

            courses_data = CourseSerializer(
                domain_courses,
                many=True,
                context={
                    "request": request,
                    "domain_id": active_domain.domain_id,
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

    @action(detail=True, methods=["get"], authentication_classes=[OptionalJWTAuthentication], permission_classes=[permissions.AllowAny])
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

    @action(detail=True, methods=["get"], authentication_classes=[OptionalJWTAuthentication], permission_classes=[permissions.AllowAny])
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


class ActiveDomainView(APIView):
    authentication_classes = [OptionalJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        candidate = None
        active_domain = None
        if request.user and request.user.is_authenticated:
            candidate, _ = Candidate_Profile.objects.select_related("active_domain").get_or_create(user=request.user)
            active_domain = candidate.active_domain

        domains = Domain.objects.filter(is_active=True).order_by("name")
        domain_serializer = DomainSerializer(domains, many=True, context={"request": request})

        if not active_domain and domains.exists():
            first_domain = domains.first()
            if candidate:
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
