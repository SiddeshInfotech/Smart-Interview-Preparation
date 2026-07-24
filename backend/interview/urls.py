from django.urls import path
from .views import (
    create_interview_schedule,
    get_livekit_token,
    accept_interview,
    decline_interview,
    UserInterviewListView,
    end_interview_session,
    submit_interview_feedback,
    get_interview_feedback,
)

urlpatterns = [
    path('schedule/', create_interview_schedule, name='schedule-interview'),
    path('livekit-token/', get_livekit_token, name='livekit-token'),
    path('accept/<int:pk>/', accept_interview, name='accept-interview'),
    path('decline/<int:pk>/', decline_interview, name='decline-interview'),
    path('my-interviews/', UserInterviewListView.as_view(), name='my-interviews'),
    path('end-session/', end_interview_session, name='end-interview-session'),
    path('submit-feedback/', submit_interview_feedback, name='submit-interview-feedback'),
    path('feedback/<int:schedule_id>/', get_interview_feedback, name='get-interview-feedback'),
]