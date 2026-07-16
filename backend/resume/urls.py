from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload_resume),
    path("view/", views.view_resume),
    path("analyze/", views.analyze_resume),
    path("score/", views.resume_score),
    path("suggestions/", views.resume_suggestions),
    path("add-to-profile/", views.add_to_profile),
]