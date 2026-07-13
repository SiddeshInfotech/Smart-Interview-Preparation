from rest_framework import generics, permissions
from .models import Candidate_Profile
from .serializers import CandidateProfileSerializer

class ProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Candidate_Profile.objects.get_or_create(user=self.request.user)
        return profile