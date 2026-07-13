from django.urls import path
from . import views

urlpatterns = [
    path("upload/", views.upload_resume, name="upload_resume"),
    path("view/", views.view_resume, name="view_resume"),
    path("analyze/", views.analyze_resume, name="analyze_resume"),
    path("score/", views.resume_score, name="resume_score"),
    path("suggestions/", views.resume_suggestions, name="resume_suggestions"),
]