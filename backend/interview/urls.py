from django.urls import path
from .views import create_interview_schedule, get_livekit_token, accept_interview, decline_interview

urlpatterns = [
    path('schedule/', create_interview_schedule, name='schedule-interview'),
    path('livekit-token/', get_livekit_token, name='livekit-token'),
    #path('accept/<int:pk>/', accept_interview, name='accept-interview'),
    #path('decline/<int:pk>/', decline_interview, name='decline-interview'),
]