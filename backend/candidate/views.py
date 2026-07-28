from rest_framework import generics, permissions, serializers as drf_serializers
from django.db.models import Q
from .models import Candidate_Profile
from .serializers import CandidateProfileSerializer


class CandidateSearchSerializer(drf_serializers.ModelSerializer):
    """Lightweight serializer for candidate search suggestions."""
    full_name = drf_serializers.CharField(source="user.full_name", read_only=True)
    email = drf_serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Candidate_Profile
        fields = ["candidate_id", "full_name", "email", "education", "skills", "profile_picture"]
        read_only_fields = fields


class CandidateSearchListView(generics.ListAPIView):
    """Return candidate profiles matching an optional `?search=` query param."""
    serializer_class = CandidateSearchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Candidate_Profile.objects.select_related("user").all()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search) | Q(user__email__icontains=search)
            )
        return qs[:20]  # cap results


class ProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        try:
            return Candidate_Profile.objects.select_related("user").get(user=self.request.user)
        except Candidate_Profile.DoesNotExist:
            profile = Candidate_Profile.objects.create(user=self.request.user)
            return Candidate_Profile.objects.select_related("user").get(pk=profile.pk)