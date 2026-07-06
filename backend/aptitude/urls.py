from django.urls import path
from . import views

urlpatterns = [
    path("questions/", views.questions),
    path("submit/", views.submit),
    path("result/", views.result),
]