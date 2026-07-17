from django.urls import path
from .views import ProfileRetrieveUpdateAPIView, CandidateSearchListView

urlpatterns = [
    path('profile/', ProfileRetrieveUpdateAPIView.as_view(), name='candidate-profile'),
    path('search/', CandidateSearchListView.as_view(), name='candidate-search'),
]