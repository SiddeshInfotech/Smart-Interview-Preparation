from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", views.register, name="register"),
    path("send-registration-otp/", views.send_registration_otp, name="send_registration_otp"),
    path("verify-registration-otp/", views.verify_registration_otp, name="verify_registration_otp"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("forgot-password/", views.forgot_password, name="forgot-password"),
    path("verify-otp/", views.verify_otp, name="verify_otp"),
    path("reset-password/", views.reset_password, name="reset-password"),
    path("profile/", views.get_profile, name="get-profile"),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

"""
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
"""
