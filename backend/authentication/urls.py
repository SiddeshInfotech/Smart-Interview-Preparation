from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login),
    path("logout/", views.logout),
    path("forgot-password/", views.forgot_password),
    path("reset-password/", views.reset_password),
    path("profile/", views.profile),
]
