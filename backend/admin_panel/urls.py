from django.urls import path
from . import views

urlpatterns = [
    path("get-users/", views.get_users),
    path("update-users/<int:id>/", views.update_user),
    path("add-questions/", views.add_question),
    path("delete-questions/<int:id>/", views.delete_question),
    path("get-analytics/", views.get_analytics),
    path("get-interviews/", views.get_interviews),
    path("delete-interviews/<int:id>/", views.delete_interview),
]