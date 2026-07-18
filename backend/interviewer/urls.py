from django.urls import path
from .views import InterviewerProfileRetrieveUpdateAPIView, InterviewerSearchListView

urlpatterns = [
    path('profile/', InterviewerProfileRetrieveUpdateAPIView.as_view(), name='interviewer-profile'),
    path('search/', InterviewerSearchListView.as_view(), name='interviewer-search'),
]
