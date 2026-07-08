from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_notifications),
    path("<int:id>/", views.delete_notification),
] 