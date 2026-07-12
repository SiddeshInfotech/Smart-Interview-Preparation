# candidate/urls.py
from django.urls import path
from .views import SkillSearchAPIView

urlpatterns = [
    path('skills/', SkillSearchAPIView.as_view(), name='skill-search')
]