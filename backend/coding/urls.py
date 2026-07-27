from django.urls import path

from . import views


urlpatterns = [

    path(
        "questions/",
        views.get_questions
    ),


    path(
        "run/",
        views.run_code
    ),


    path(
        "submit/",
        views.submit_code
    ),


    path(
        "result/",
        views.get_coding_result
    ),

    path(
        "performance/",
        views.get_coding_performance
    ),


    path(
        "generate/",
        views.generate_coding_question
    ),

]