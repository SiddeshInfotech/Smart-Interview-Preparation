from django.urls import path
from .views import InterviewScheduleCreateView, get_livekit_token

urlpatterns = [
    path('schedule/', InterviewScheduleCreateView.as_view(), name='schedule-interview'),
    path('livekit-token/', get_livekit_token, name='livekit-token'),
]