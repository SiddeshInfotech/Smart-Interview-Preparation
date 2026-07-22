from django.urls import path
from .views import generate_quiz, quiz_performance

urlpatterns = [
    path('generate/', generate_quiz, name='generate_quiz'),
    path( "performance/", quiz_performance, name="quiz_performance"),
]