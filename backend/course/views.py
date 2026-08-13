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


from rest_framework_simplejwt.authentication import JWTAuthentication

class OptionalJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None

class OptionalJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if getattr(view, "action", None) in ["generate_quiz", "toggle_complete", "mark_complete"]:
            return True
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

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="toggle-complete",
    )
    def toggle_complete(self, request, pk=None):
        module = self.get_object()
        candidate, _ = Candidate_Profile.objects.get_or_create(user=request.user)

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

    @action(
        detail=True,
        methods=["post"],
        authentication_classes=[OptionalJWTAuthentication],
        permission_classes=[permissions.AllowAny],
        url_path="mark-complete",
    )
    def mark_complete(self, request, pk=None):
        module = self.get_object()
        if request.user and request.user.is_authenticated:
            candidate, _ = Candidate_Profile.objects.get_or_create(user=request.user)

            course = module.course
            domain = course.domain

            progress, _ = CourseProgress.objects.get_or_create(
                candidate=candidate,
                domain=domain,
                course=course,
                defaults={"progress_percentage": 0.0, "completed_module_ids": []},
            )

            completed_ids = list(progress.completed_module_ids or [])
            if module.module_id not in completed_ids:
                completed_ids.append(module.module_id)
                progress.completed_module_ids = completed_ids
                progress.save()

            updated_prog = recalculate_course_progress(candidate, domain, course)

            return Response({
                "module_id": module.module_id,
                "module_completed": True,
                "domain_id": domain.domain_id,
                "course_id": course.course_id,
                "course_progress": float(updated_prog.progress_percentage),
                "course_completed": updated_prog.completed,
            })
        return Response({
            "module_id": module.module_id,
            "module_completed": True,
        })

    @action(
        detail=True,
        methods=["post"],
        authentication_classes=[OptionalJWTAuthentication],
        permission_classes=[permissions.AllowAny],
        url_path="generate-quiz",
    )
    def generate_quiz(self, request, pk=None):
        module = self.get_object()
        course = module.course

        from .pdf_extractor import get_module_all_pdf_materials, build_chapter_material_context
        materials = get_module_all_pdf_materials(module)

        logger.info(f"[QUIZ] Course: {course.title}")
        logger.info(f"[QUIZ] Chapter: {module.title}")
        logger.info(f"[QUIZ] Materials found: {len(materials)}")

        if not materials:
            logger.warning(f"[QUIZ] Chapter '{module.title}' has no active PDF learning material.")
            return Response(
                {"error": "This chapter does not have any learning material available for quiz generation."},
                status=400
            )

        for mat in materials:
            logger.info(f"[QUIZ] Processing: {mat['filename']} | Extracted characters: {len(mat['text'])}")

        pdf_context_str, total_chars = build_chapter_material_context(course.title, module.title, materials)
        logger.info("[QUIZ] Sending chapter material to AI")

        from ai.quiz_service import generate_chapter_quiz_questions

        try:
            questions = generate_chapter_quiz_questions(
                course_name=course.title,
                chapter_name=module.title,
                pdf_content=pdf_context_str,
                count=10,
                difficulty="Medium",
                materials_list=materials,
            )

            if not questions or len(questions) == 0:
                logger.error("[QUIZ] AI returned zero valid questions from chapter material.")
                return Response(
                    {"error": "Unable to generate the quiz from the available course material."},
                    status=500
                )

            # Persist ChapterQuiz & ChapterQuestion records to DB
            from quiz.models import ChapterQuiz, ChapterQuestion
            candidate_profile = getattr(request.user, "candidate_profile", None) if (request.user and request.user.is_authenticated) else None

            quiz_obj = ChapterQuiz.objects.create(
                course=course,
                module=module,
                candidate=candidate_profile,
                title=f"{module.title} Quiz",
                difficulty="Medium",
            )

            for q in questions:
                src_mat_obj = None
                src_name = q.get("source_material") or (materials[0]["filename"] if materials else "Chapter PDF")

                if materials:
                    for m in materials:
                        if m.get("material_id") and (m["filename"] == src_name or m["title"] == src_name):
                            try:
                                src_mat_obj = CourseMaterial.objects.get(pk=m["material_id"])
                                break
                            except Exception:
                                pass

                ChapterQuestion.objects.create(
                    quiz=quiz_obj,
                    question_text=q["text"],
                    option_a=q["options"][0],
                    option_b=q["options"][1],
                    option_c=q["options"][2],
                    option_d=q["options"][3],
                    correct_answer=q.get("correct_answer") or q["options"][q.get("correct", 0)],
                    explanation=q.get("explanation", ""),
                    source_material=src_mat_obj,
                    source_material_name=src_name,
                    source_topic=q.get("source_topic", f"{module.title} Concepts"),
                )

            logger.info("[QUIZ] Quiz saved successfully")

            return Response({
                "quiz_id": quiz_obj.quiz_id,
                "questions": questions,
                "module_id": module.module_id,
                "module_title": module.title,
                "course_id": course.course_id,
                "course_title": course.title,
            }, status=200)

        except Exception as e:
            logger.error(f"[QUIZ] Chapter quiz generation error for module {module.module_id}: {e}", exc_info=True)
            return Response(
                {"error": "Unable to generate the quiz from the available course material."},
                status=500
            )




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
