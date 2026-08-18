from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DomainViewSet,
    CourseViewSet,
    CourseModuleViewSet,
    ActiveDomainView,
    CourseBootstrapView,
)

router = DefaultRouter()
router.register(r"domains", DomainViewSet, basename="domain")
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"modules", CourseModuleViewSet, basename="module")

urlpatterns = [
    path("courses/bootstrap/", CourseBootstrapView.as_view(), name="course-bootstrap"),
    path("profile/active-domain/", ActiveDomainView.as_view(), name="profile-active-domain"),
    path("candidate/active-domain/", ActiveDomainView.as_view(), name="candidate-active-domain"),
    path("", include(router.urls)),
]

