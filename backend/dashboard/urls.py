from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_dashboard),
    path("daily-progress/", views.get_daily_progress),
    path("ai-intelligence/", views.get_ai_intelligence),
]