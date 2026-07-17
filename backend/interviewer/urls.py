from django.urls import path
from .views import InterviewerProfileRetrieveUpdateAPIView

urlpatterns = [
    path('profile/', InterviewerProfileRetrieveUpdateAPIView.as_view(), name='interviewer-profile'),
]