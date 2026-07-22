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

    def get_serializer(self, *args, **kwargs):
        if self.action == 'create' and isinstance(kwargs.get('data'), list):
            kwargs['many'] = True
        return super().get_serializer(*args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(interviewer=self.request.user.interviewer_profile)


class AvailableSlotsListView(generics.ListAPIView):
    """Available slots for a specific interviewer."""
    serializer_class = InterviewerAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        interviewer_id = self.kwargs["interviewer_id"]
        return InterviewerAvailability.objects.filter(
            interviewer_id=interviewer_id,
            status="available",
            start_time__gt=timezone.now(),
        ).order_by("start_time")


class AvailableSlotsAllView(generics.ListAPIView):
    """Available slots from ALL interviewers, optionally filtered by date."""
    serializer_class = InterviewerAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = InterviewerAvailability.objects.filter(
            status='available',
            start_time__gt=timezone.now()
        ).order_by('start_time')

        date_param = self.request.query_params.get('date')
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                qs = qs.filter(start_time__date=target_date)
            except ValueError:
                pass
        return qs