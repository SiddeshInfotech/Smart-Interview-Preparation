from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InterviewerProfileRetrieveUpdateAPIView,
    InterviewerSearchListView,
    InterviewerAvailabilityViewSet,
    AvailableSlotsListView,
    AvailableSlotsAllView,
)

router = DefaultRouter()
router.register(r'availability', InterviewerAvailabilityViewSet, basename='availability')

urlpatterns = [
    path('profile/', InterviewerProfileRetrieveUpdateAPIView.as_view(), name='interviewer-profile'),
    path('search/', InterviewerSearchListView.as_view(), name='interviewer-search'),
    path('availability/<int:interviewer_id>/available/', AvailableSlotsListView.as_view(), name='available-slots'),
    path('available-slots/', AvailableSlotsAllView.as_view(), name='available-slots-all'),
    path('', include(router.urls)),
]