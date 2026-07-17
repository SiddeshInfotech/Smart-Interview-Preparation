from rest_framework import generics, permissions
from .models import Interviewer_Profile
from .serializers import InterviewerProfileSerializer


class InterviewerProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = InterviewerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Interviewer_Profile.objects.get_or_create(user=self.request.user)
        return profile
