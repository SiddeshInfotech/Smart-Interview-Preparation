from django.urls import path
from .views import generate_quiz, quiz_performance, save_quiz_result

urlpatterns = [
    path('generate/', generate_quiz, name='generate_quiz'),
    path('performance/', quiz_performance, name='quiz_performance'),
    path('save-result/', save_quiz_result, name='save_quiz_result'),
]