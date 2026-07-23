from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

# Import shared models from root models.py
from models import (
    CandidateProfile,
    CodingSubmissions,
    InterviewFeedback,
    InterviewSchedule,
    InterviewSession,
    InterviewerProfile,
    Notifications,
    OtpVerification,
    PerformanceAnalytics,
    QuestionBank,
    Resume,
    ResumeAnalysis,
    SessionQuestions,
    Users,
)
from authentication.models import User

from .serializers import (
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
    NotificationsSerializer,
    OtpVerificationSerializer,
)


# ─────────────────────────────────────────────────────────────
# Admin Login  (AllowAny — no token needed yet)
# ─────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    """Authenticate a staff/superuser and return JWT tokens."""
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()

    if not email or not password:
        return Response(
            {"message": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response(
            {"message": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not (user.is_staff or user.is_superuser):
        return Response(
            {"message": "Access denied. Admin privileges required."},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "message": "Admin login successful.",
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "admin": {
                "user_id": user.user_id,
                "full_name": user.full_name,
                "email": user.email,
                "is_superuser": user.is_superuser,
            },
        },
        status=status.HTTP_200_OK,
    )


# ─────────────────────────────────────────────────────────────
# Dashboard Stats
# ─────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Return high-level counts for the admin dashboard."""
    stats = {
        "total_users": Users.objects.count(),
        "total_candidates": CandidateProfile.objects.count(),
        "total_interviewers": InterviewerProfile.objects.count(),
        "total_questions": QuestionBank.objects.count(),
        "total_interviews": InterviewSchedule.objects.count(),
        "total_sessions": InterviewSession.objects.count(),
        "total_resumes": Resume.objects.count(),
        "total_notifications": Notifications.objects.count(),
        "total_submissions": CodingSubmissions.objects.count(),
    }
    return Response({"data": stats}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# Users
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def users_list(request):
    if request.method == "GET":
        users = Users.objects.all().order_by("-created_at")
        serializer = UsersSerializer(users, many=True)
        return Response({"data": serializer.data})

    # POST – create user via the authentication.User model so password is hashed
    data = request.data
    if User.objects.filter(email=data.get("email", "")).exists():
        return Response({"message": "Email already exists."}, status=400)

    user = User(
        full_name=data.get("full_name", ""),
        email=data.get("email", ""),
        role=data.get("role", "candidate"),
        phone_number=data.get("phone_number") or None,
        is_active=bool(data.get("is_active", True)),
        is_email_verified=bool(data.get("is_email_verified", False)),
    )
    user.set_password(data.get("password", "changeme123"))
    user.save()

    return Response({"message": "User created.", "user_id": user.user_id}, status=201)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def user_detail(request, pk):
    try:
        user_obj = Users.objects.get(pk=pk)
    except Users.DoesNotExist:
        return Response({"message": "User not found."}, status=404)

    if request.method == "GET":
        return Response({"data": UsersSerializer(user_obj).data})

    if request.method == "PUT":
        serializer = UsersSerializer(user_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # If password provided, hash it via auth model
            new_password = request.data.get("password")
            if new_password:
                try:
                    auth_user = User.objects.get(pk=pk)
                    auth_user.set_password(new_password)
                    auth_user.save(update_fields=["password"])
                except User.DoesNotExist:
                    pass
            return Response({"message": "User updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        try:
            auth_user = User.objects.get(pk=pk)
            auth_user.delete()
        except User.DoesNotExist:
            user_obj.delete()
        return Response({"message": "User deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Candidate Profiles
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def candidates_list(request):
    if request.method == "GET":
        qs = CandidateProfile.objects.all().order_by("-created_at")
        serializer = CandidateProfileSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = CandidateProfileSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Candidate profile created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def candidate_detail(request, pk):
    try:
        obj = CandidateProfile.objects.get(pk=pk)
    except CandidateProfile.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": CandidateProfileSerializer(obj).data})

    if request.method == "PUT":
        serializer = CandidateProfileSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Interviewer Profiles
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def interviewers_list(request):
    if request.method == "GET":
        qs = InterviewerProfile.objects.all().order_by("-created_at")
        serializer = InterviewerProfileSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = InterviewerProfileSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Interviewer profile created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def interviewer_detail(request, pk):
    try:
        obj = InterviewerProfile.objects.get(pk=pk)
    except InterviewerProfile.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": InterviewerProfileSerializer(obj).data})

    if request.method == "PUT":
        serializer = InterviewerProfileSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Question Bank
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def questions_list(request):
    if request.method == "GET":
        qs = QuestionBank.objects.all().order_by("-created_at")
        serializer = QuestionBankSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = QuestionBankSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Question created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def question_detail(request, pk):
    try:
        obj = QuestionBank.objects.get(pk=pk)
    except QuestionBank.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": QuestionBankSerializer(obj).data})

    if request.method == "PUT":
        serializer = QuestionBankSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Interview Schedules
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def interviews_list(request):
    if request.method == "GET":
        qs = InterviewSchedule.objects.all().order_by("-created_at")
        serializer = InterviewScheduleSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = InterviewScheduleSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Interview schedule created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def interview_detail(request, pk):
    try:
        obj = InterviewSchedule.objects.get(pk=pk)
    except InterviewSchedule.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": InterviewScheduleSerializer(obj).data})

    if request.method == "PUT":
        serializer = InterviewScheduleSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Interview Sessions
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def sessions_list(request):
    if request.method == "GET":
        qs = InterviewSession.objects.all().order_by("-created_at")
        serializer = InterviewSessionSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = InterviewSessionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Session created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def session_detail(request, pk):
    try:
        obj = InterviewSession.objects.get(pk=pk)
    except InterviewSession.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": InterviewSessionSerializer(obj).data})

    if request.method == "PUT":
        serializer = InterviewSessionSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Interview Feedback
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def feedback_list(request):
    if request.method == "GET":
        qs = InterviewFeedback.objects.all().order_by("-created_at")
        serializer = InterviewFeedbackSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = InterviewFeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Feedback created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def feedback_detail(request, pk):
    try:
        obj = InterviewFeedback.objects.get(pk=pk)
    except InterviewFeedback.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": InterviewFeedbackSerializer(obj).data})

    if request.method == "PUT":
        serializer = InterviewFeedbackSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Performance Analytics
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def analytics_list(request):
    if request.method == "GET":
        qs = PerformanceAnalytics.objects.all().order_by("-generated_at")
        serializer = PerformanceAnalyticsSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = PerformanceAnalyticsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Analytics entry created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def analytics_detail(request, pk):
    try:
        obj = PerformanceAnalytics.objects.get(pk=pk)
    except PerformanceAnalytics.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": PerformanceAnalyticsSerializer(obj).data})

    if request.method == "PUT":
        serializer = PerformanceAnalyticsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Resumes
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def resumes_list(request):
    if request.method == "GET":
        qs = Resume.objects.all().order_by("-uploaded_at")
        serializer = ResumeSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = ResumeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Resume created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def resume_detail(request, pk):
    try:
        obj = Resume.objects.get(pk=pk)
    except Resume.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": ResumeSerializer(obj).data})

    if request.method == "PUT":
        serializer = ResumeSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Resume Analysis
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def resume_analysis_list(request):
    if request.method == "GET":
        qs = ResumeAnalysis.objects.all().order_by("-analyzed_at")
        serializer = ResumeAnalysisSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = ResumeAnalysisSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Resume analysis created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def resume_analysis_detail(request, pk):
    try:
        obj = ResumeAnalysis.objects.get(pk=pk)
    except ResumeAnalysis.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": ResumeAnalysisSerializer(obj).data})

    if request.method == "PUT":
        serializer = ResumeAnalysisSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Session Questions
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def session_questions_list(request):
    if request.method == "GET":
        qs = SessionQuestions.objects.all()
        serializer = SessionQuestionsSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = SessionQuestionsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Session question created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def session_question_detail(request, pk):
    try:
        obj = SessionQuestions.objects.get(pk=pk)
    except SessionQuestions.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": SessionQuestionsSerializer(obj).data})

    if request.method == "PUT":
        serializer = SessionQuestionsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Coding Submissions
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def submissions_list(request):
    if request.method == "GET":
        qs = CodingSubmissions.objects.all().order_by("-submitted_at")
        serializer = CodingSubmissionsSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = CodingSubmissionsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Submission created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def submission_detail(request, pk):
    try:
        obj = CodingSubmissions.objects.get(pk=pk)
    except CodingSubmissions.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": CodingSubmissionsSerializer(obj).data})

    if request.method == "PUT":
        serializer = CodingSubmissionsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def notifications_list(request):
    if request.method == "GET":
        qs = Notifications.objects.all().order_by("-created_at")
        serializer = NotificationsSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = NotificationsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Notification created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def notification_detail(request, pk):
    try:
        obj = Notifications.objects.get(pk=pk)
    except Notifications.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": NotificationsSerializer(obj).data})

    if request.method == "PUT":
        serializer = NotificationsSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)


# ─────────────────────────────────────────────────────────────
# OTP Verification
# ─────────────────────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def otps_list(request):
    if request.method == "GET":
        qs = OtpVerification.objects.all().order_by("-created_at")
        serializer = OtpVerificationSerializer(qs, many=True)
        return Response({"data": serializer.data})

    serializer = OtpVerificationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "OTP record created.", "data": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAdminUser])
def otp_detail(request, pk):
    try:
        obj = OtpVerification.objects.get(pk=pk)
    except OtpVerification.DoesNotExist:
        return Response({"message": "Not found."}, status=404)

    if request.method == "GET":
        return Response({"data": OtpVerificationSerializer(obj).data})

    if request.method == "PUT":
        serializer = OtpVerificationSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Updated.", "data": serializer.data})
        return Response(serializer.errors, status=400)

    obj.delete()
    return Response({"message": "Deleted."}, status=204)