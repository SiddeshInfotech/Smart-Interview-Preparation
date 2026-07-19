from django.urls import path

from .views import LanguageListView, RunCodeView, SubmissionHistoryView

urlpatterns = [
    path("run/", RunCodeView.as_view(), name="compiler-run"),
    path("languages/", LanguageListView.as_view(), name="compiler-languages"),
    path("history/", SubmissionHistoryView.as_view(), name="compiler-history"),
]
