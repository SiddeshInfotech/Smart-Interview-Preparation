from django.urls import path
from .views import run_code, test_api

urlpatterns = [
    path('run/', run_code),
    
]