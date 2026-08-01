from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_dashboard),
    path("bootstrap/", views.get_dashboard_bootstrap, name="dashboard_bootstrap"),
    path("daily-progress/", views.get_daily_progress),
    path("ai-intelligence/", views.get_ai_intelligence),
]