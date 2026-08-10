from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DomainViewSet,
    TechnologyViewSet,
    CourseViewSet,
    CourseModuleViewSet,
    CourseTopicViewSet,
    CourseMaterialViewSet,
    ActiveDomainView,
    CourseProgressViewSet,
)

router = DefaultRouter()
router.register(r"domains", DomainViewSet, basename="domain")
router.register(r"technologies", TechnologyViewSet, basename="technology")
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"modules", CourseModuleViewSet, basename="module")
router.register(r"topics", CourseTopicViewSet, basename="topic")
router.register(r"materials", CourseMaterialViewSet, basename="material")
router.register(r"course-progress", CourseProgressViewSet, basename="course-progress")

urlpatterns = [
    path("profile/active-domain/", ActiveDomainView.as_view(), name="profile-active-domain"),
    path("candidate/active-domain/", ActiveDomainView.as_view(), name="candidate-active-domain"),
    path("", include(router.urls)),
]
