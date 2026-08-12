from rest_framework import generics, permissions, serializers as drf_serializers
from django.db.models import Q
from .models import Candidate_Profile
from .serializers import CandidateProfileSerializer
from .services import get_candidate_profile_data, invalidate_candidate_profile_cache


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

    def perform_update(self, serializer):
        profile = serializer.save()
        if profile.target_domain:
            target = profile.target_domain.strip()
            try:
                from course.models import Domain
                domain_obj = Domain.objects.filter(name__iexact=target, is_active=True).first()
                if not domain_obj and target.split():
                    first_word = target.split()[0]
                    domain_obj = Domain.objects.filter(name__icontains=first_word, is_active=True).first()
                if domain_obj and profile.active_domain != domain_obj:
                    profile.active_domain = domain_obj
                    profile.save(update_fields=["active_domain"])
            except Exception as e:
                print("Error syncing active_domain in candidate profile update:", e)

        invalidate_candidate_profile_cache(self.request.user.id)
        try:
            from authentication.services import invalidate_auth_profile_cache
            invalidate_auth_profile_cache(self.request.user.id)
        except Exception:
            pass