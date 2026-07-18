from django.db.models import Q
from rest_framework import generics, permissions, serializers as drf_serializers
from .models import Interviewer_Profile
from .serializers import InterviewerProfileSerializer


class InterviewerSearchSerializer(drf_serializers.ModelSerializer):
    full_name = drf_serializers.CharField(source="user.full_name", read_only=True)
    email = drf_serializers.EmailField(source="user.email", read_only=True)
    profile_picture = drf_serializers.SerializerMethodField()

    class Meta:
        model = Interviewer_Profile
        fields = [
            "interviewer_id",
            "full_name",
            "email",
            "profile_picture",
            "department",
            "designation",
            "expertise_area",
            "years_of_experience",
            "is_available",
        ]
        read_only_fields = fields

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None

        request = self.context.get("request")
        picture_url = obj.profile_picture.url
        if request is not None:
            return request.build_absolute_uri(picture_url)
        return picture_url


class InterviewerSearchListView(generics.ListAPIView):
    serializer_class = InterviewerSearchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Interviewer_Profile.objects.select_related("user")
            .filter(is_available=True)
            .order_by("user__full_name")
        )
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__full_name__icontains=search)
                | Q(user__email__icontains=search)
                | Q(department__icontains=search)
                | Q(designation__icontains=search)
                | Q(expertise_area__icontains=search)
            )
        return qs[:20]


class InterviewerProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = InterviewerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = Interviewer_Profile.objects.get_or_create(user=self.request.user)
        return profile
