"""
admin_panel/views.py — Custom Admin Panel API Views

Provides full CRUD operations for all 11 real Django models registered in the system.
All endpoints require superuser or staff permissions (IsAdminUser).
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

# ── Real Models ──────────────────────────────────────────────
from authentication.models import User, OtpVerification
from candidate.models import Candidate_Profile
from interviewer.models import Interviewer_Profile, InterviewerAvailability
from interview.models import InterviewSchedule
from feedback.models import Feedback
from common.models import Skill
from resume.models import Resume, ResumeAnalysis
from notifications.models import Notification

# ── Serializers ───────────────────────────────────────────────
from admin_panel.serializers import (
    UsersSerializer,
    CandidateProfileSerializer,
    InterviewerProfileSerializer,
    InterviewerAvailabilitySerializer,
    InterviewScheduleSerializer,
    FeedbackSerializer,
    SkillSerializer,
    ResumeSerializer,
    ResumeAnalysisSerializer,
    NotificationSerializer,
    OtpVerificationSerializer,
)


def success(data, status_code=200):
    return Response({"success": True, "data": data}, status=status_code)


def error(message, status_code=400):
    return Response({"success": False, "message": message}, status=status_code)


# ─────────────────────────────────────────────────────────────
# Auth — Admin Login
# ─────────────────────────────────────────────────────────────
@api_view(["POST"])
def admin_login(request):
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return error("Email and password are required.", 400)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return error("Invalid credentials.", 401)

    if not (user.is_staff or user.is_superuser):
        return error("Access denied. Superuser/staff privileges required.", 403)

    refresh = RefreshToken.for_user(user)
    return success({
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "admin": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "email": user.email,
            "is_superuser": user.is_superuser,
            "is_staff": user.is_staff,
        },
    })


# ─────────────────────────────────────────────────────────────
# Dashboard Stats
# ─────────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    try:
        data = {
            "total_users": User.objects.count(),
            "total_candidates": Candidate_Profile.objects.count(),
            "total_interviewers": Interviewer_Profile.objects.count(),
            "total_availabilities": InterviewerAvailability.objects.count(),
            "total_interviews": InterviewSchedule.objects.count(),
            "total_feedbacks": Feedback.objects.count(),
            "total_skills": Skill.objects.count(),
            "total_resumes": Resume.objects.count(),
            "total_resume_analyses": ResumeAnalysis.objects.count(),
            "total_notifications": Notification.objects.count(),
            "total_otps": OtpVerification.objects.count(),
        }
        return success(data)
    except Exception as exc:
        return error(str(exc), 500)


# ─────────────────────────────────────────────────────────────
# Generic CRUD Helper Functions
# ─────────────────────────────────────────────────────────────
def list_create(request, model, serializer_class, pk_field="pk"):
    if request.method == "GET":
        qs = model.objects.all().order_by(f"-{pk_field}")
        ser = serializer_class(qs, many=True)
        return success(ser.data)

    ser = serializer_class(data=request.data)
    if ser.is_valid():
        ser.save()
        return success(ser.data, 201)
    return Response({"success": False, "errors": ser.errors}, status=400)


def retrieve_update_delete(request, model, serializer_class, pk):
    try:
        obj = model.objects.get(pk=pk)
    except model.DoesNotExist:
        return error("Record not found.", 404)

    if request.method == "GET":
        return success(serializer_class(obj).data)

    if request.method in ("PUT", "PATCH"):
        partial = request.method == "PATCH"
        ser = serializer_class(obj, data=request.data, partial=partial)
        if ser.is_valid():
            ser.save()
            return success(ser.data)
        return Response({"success": False, "errors": ser.errors}, status=400)

    obj.delete()
    return success({"detail": "Deleted successfully."})


# ─────────────────────────────────────────────────────────────
# 1. Users
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def users_list(request):
    return list_create(request, User, UsersSerializer, "user_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def user_detail(request, pk):
    return retrieve_update_delete(request, User, UsersSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 2. Candidate Profiles
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def candidates_list(request):
    return list_create(request, Candidate_Profile, CandidateProfileSerializer, "candidate_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def candidate_detail(request, pk):
    return retrieve_update_delete(request, Candidate_Profile, CandidateProfileSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 3. Interviewer Profiles
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def interviewers_list(request):
    return list_create(request, Interviewer_Profile, InterviewerProfileSerializer, "interviewer_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def interviewer_detail(request, pk):
    return retrieve_update_delete(request, Interviewer_Profile, InterviewerProfileSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 4. Interviewer Availability
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def availabilities_list(request):
    return list_create(request, InterviewerAvailability, InterviewerAvailabilitySerializer, "availability_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def availability_detail(request, pk):
    return retrieve_update_delete(request, InterviewerAvailability, InterviewerAvailabilitySerializer, pk)


# ─────────────────────────────────────────────────────────────
# 5. Interview Schedules
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def interviews_list(request):
    return list_create(request, InterviewSchedule, InterviewScheduleSerializer, "schedule_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def interview_detail(request, pk):
    return retrieve_update_delete(request, InterviewSchedule, InterviewScheduleSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 6. Feedbacks
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def feedback_list(request):
    return list_create(request, Feedback, FeedbackSerializer, "feedback_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def feedback_detail(request, pk):
    return retrieve_update_delete(request, Feedback, FeedbackSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 7. Skills
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def skills_list(request):
    return list_create(request, Skill, SkillSerializer, "id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def skill_detail(request, pk):
    return retrieve_update_delete(request, Skill, SkillSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 8. Resumes
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def resumes_list(request):
    return list_create(request, Resume, ResumeSerializer, "resume_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def resume_detail(request, pk):
    return retrieve_update_delete(request, Resume, ResumeSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 9. Resume Analysis
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def resume_analysis_list(request):
    return list_create(request, ResumeAnalysis, ResumeAnalysisSerializer, "analysis_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def resume_analysis_detail(request, pk):
    return retrieve_update_delete(request, ResumeAnalysis, ResumeAnalysisSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 10. Notifications
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def notifications_list(request):
    return list_create(request, Notification, NotificationSerializer, "notification_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def notification_detail(request, pk):
    return retrieve_update_delete(request, Notification, NotificationSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 11. OTP Verification
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def otps_list(request):
    return list_create(request, OtpVerification, OtpVerificationSerializer, "otp_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def otp_detail(request, pk):
    return retrieve_update_delete(request, OtpVerification, OtpVerificationSerializer, pk)