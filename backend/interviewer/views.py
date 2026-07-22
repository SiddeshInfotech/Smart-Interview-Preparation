from django.db.models import Q
from rest_framework import generics, permissions, viewsets
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime

from .models import Interviewer_Profile, InterviewerAvailability
from .serializers import (
    InterviewerProfileSerializer,
    InterviewerSearchSerializer,
    InterviewerAvailabilitySerializer,
)


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
        profile, created = Interviewer_Profile.objects.get_or_create(
            user=self.request.user
        )
        return profile


class InterviewerAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = InterviewerAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        interviewer_profile = self.request.user.interviewer_profile
        return InterviewerAvailability.objects.filter(interviewer=interviewer_profile)

    def perform_create(self, serializer):
        serializer.save(interviewer=self.request.user.interviewer_profile)


class AvailableSlotsListView(generics.ListAPIView):
    """Available slots for a specific interviewer on a given date."""
    serializer_class = InterviewerAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        interviewer_id = self.kwargs["interviewer_id"]
        date_param = self.request.query_params.get('date')
        if not date_param:
            return InterviewerAvailability.objects.none()

        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            day_of_week = target_date.weekday()  # Monday=0, Sunday=6
        except ValueError:
            return InterviewerAvailability.objects.none()

        return InterviewerAvailability.objects.filter(
            interviewer_id=interviewer_id,
            day_of_week=day_of_week,
            status="available"
        ).order_by("start_time")


class AvailableSlotsAllView(generics.ListAPIView):
    """Available slots from ALL interviewers on a given date."""
    serializer_class = InterviewerAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        date_param = self.request.query_params.get('date')
        if not date_param:
            return InterviewerAvailability.objects.none()

        try:
            target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            day_of_week = target_date.weekday()
        except ValueError:
            return InterviewerAvailability.objects.none()

        return InterviewerAvailability.objects.filter(
            status='available',
            day_of_week=day_of_week
        ).order_by('start_time')


class InterviewerProfileDetailView(generics.RetrieveAPIView):
    """Retrieve an interviewer's profile by interviewer_id."""
    queryset = Interviewer_Profile.objects.all()
    serializer_class = InterviewerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'interviewer_id'