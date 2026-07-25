from django.urls import path
from . import views

urlpatterns = [
    path("execute/", views.execute_code_view, name="compiler-execute"),
    path("history/", views.execution_history_view, name="compiler-history"),
    path("runtimes/", views.runtimes_view, name="compiler-runtimes"),
]
