"""
admin_panel/views.py — Custom Admin Panel API Views

All views require is_staff or is_superuser.
Each model gets a list/create view and a detail/update/delete view.
"""

import json
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# ── Models from their own apps ───────────────────────────────
from authentication.models import User, OtpVerification
from candidate.models import Candidate_Profile
from interviewer.models import Interviewer_Profile
from interview.models import InterviewSchedule
from resume.models import Resume, ResumeAnalysis
from notifications.models import Notification

# ── Models from admin_panel (managed=False wrappers) ─────────
from admin_panel.models import (
    InterviewSession,
    InterviewFeedback,
    QuestionBank,
    SessionQuestions,
    CodingSubmissions,
    PerformanceAnalytics,
)

# ── Serializers ───────────────────────────────────────────────
from admin_panel.serializers import (
    UsersSerializer,
    CandidateProfileSerializer,
    InterviewerProfileSerializer,
    QuestionBankSerializer,
    InterviewScheduleSerializer,
    InterviewSessionSerializer,
    InterviewFeedbackSerializer,
    PerformanceAnalyticsSerializer,
    ResumeSerializer,
    ResumeAnalysisSerializer,
    SessionQuestionsSerializer,
    CodingSubmissionsSerializer,
    NotificationSerializer,
    OtpVerificationSerializer,
)


# ─────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────
def success(data, status_code=200):
    return Response({"success": True, "data": data}, status=status_code)


def error(message, status_code=400):
    return Response({"success": False, "message": message}, status=status_code)


# ─────────────────────────────────────────────────────────────
# Auth — Admin Login
# ─────────────────────────────────────────────────────────────
@api_view(["POST"])
def admin_login(request):
    email    = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return error("Email and password are required.", 400)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return error("Invalid credentials.", 401)

    if not (user.is_staff or user.is_superuser):
        return error("You do not have admin access.", 403)

    refresh = RefreshToken.for_user(user)
    return success({
        "access_token":  str(refresh.access_token),
        "refresh_token": str(refresh),
        "admin": {
            "user_id":      user.user_id,
            "full_name":    user.full_name,
            "email":        user.email,
            "is_superuser": user.is_superuser,
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
            "total_users":         User.objects.count(),
            "total_candidates":    Candidate_Profile.objects.count(),
            "total_interviewers":  Interviewer_Profile.objects.count(),
            "total_questions":     QuestionBank.objects.count(),
            "total_interviews":    InterviewSchedule.objects.count(),
            "total_sessions":      InterviewSession.objects.count(),
            "total_resumes":       Resume.objects.count(),
            "total_notifications": Notification.objects.count(),
            "total_submissions":   CodingSubmissions.objects.count(),
        }
        return success(data)
    except Exception as exc:
        return error(str(exc), 500)


# ─────────────────────────────────────────────────────────────
# Generic CRUD factory helpers
# ─────────────────────────────────────────────────────────────
def list_create(request, model, serializer_class, pk_field=None):
    if request.method == "GET":
        qs   = model.objects.all().order_by(f"-{pk_field}" if pk_field else "pk")
        ser  = serializer_class(qs, many=True)
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
        return error("Not found.", 404)

    if request.method == "GET":
        return success(serializer_class(obj).data)

    if request.method in ("PUT", "PATCH"):
        partial = request.method == "PATCH"
        ser = serializer_class(obj, data=request.data, partial=partial)
        if ser.is_valid():
            ser.save()
            return success(ser.data)
        return Response({"success": False, "errors": ser.errors}, status=400)

    # DELETE
    obj.delete()
    return success({"detail": "Deleted."})


# ─────────────────────────────────────────────────────────────
# Users
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
# Candidate Profiles
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
# Interviewer Profiles
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
# Question Bank
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def questions_list(request):
    return list_create(request, QuestionBank, QuestionBankSerializer, "question_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def question_detail(request, pk):
    return retrieve_update_delete(request, QuestionBank, QuestionBankSerializer, pk)


# ─────────────────────────────────────────────────────────────
# Interview Schedules
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
# Interview Sessions
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def sessions_list(request):
    return list_create(request, InterviewSession, InterviewSessionSerializer, "session_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def session_detail(request, pk):
    return retrieve_update_delete(request, InterviewSession, InterviewSessionSerializer, pk)


# ─────────────────────────────────────────────────────────────
# Interview Feedback
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def feedback_list(request):
    return list_create(request, InterviewFeedback, InterviewFeedbackSerializer, "feedback_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def feedback_detail(request, pk):
    return retrieve_update_delete(request, InterviewFeedback, InterviewFeedbackSerializer, pk)


# ─────────────────────────────────────────────────────────────
# Performance Analytics
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def analytics_list(request):
    return list_create(request, PerformanceAnalytics, PerformanceAnalyticsSerializer, "analytics_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def analytics_detail(request, pk):
    return retrieve_update_delete(request, PerformanceAnalytics, PerformanceAnalyticsSerializer, pk)


# ─────────────────────────────────────────────────────────────
# Resumes
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
# Resume Analysis
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
# Session Questions
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def session_questions_list(request):
    return list_create(request, SessionQuestions, SessionQuestionsSerializer, "session_question_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def session_question_detail(request, pk):
    return retrieve_update_delete(request, SessionQuestions, SessionQuestionsSerializer, pk)


# ─────────────────────────────────────────────────────────────
# Coding Submissions
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def submissions_list(request):
    return list_create(request, CodingSubmissions, CodingSubmissionsSerializer, "submission_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def submission_detail(request, pk):
    return retrieve_update_delete(request, CodingSubmissions, CodingSubmissionsSerializer, pk)


# ─────────────────────────────────────────────────────────────
# Notifications
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
# OTP Verification
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def otps_list(request):
    return list_create(request, OtpVerification, OtpVerificationSerializer, "otp_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def otp_detail(request, pk):
    return retrieve_update_delete(request, OtpVerification, OtpVerificationSerializer, pk)