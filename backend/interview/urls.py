from django.urls import path
from .views import InterviewScheduleCreateView, get_livekit_token, accept_interview, decline_interview

urlpatterns = [
    path('schedule/', InterviewScheduleCreateView.as_view(), name='schedule-interview'),
    path('schedule/<int:pk>/accept/', accept_interview, name='accept-interview'),
    path('schedule/<int:pk>/decline/', decline_interview, name='decline-interview'),
    path('livekit-token/', get_livekit_token, name='livekit-token'),
]