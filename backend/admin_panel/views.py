"""
admin_panel/views.py — Custom Admin Panel API Views

Provides full CRUD operations for all 11 real Django models registered in the system.
All endpoints require superuser or staff permissions.
Includes cascading deletion of dependent records across all models.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

# ── Real Models ──────────────────────────────────────────────
from authentication.models import User, OtpVerification
from candidate.models import Candidate_Profile
from interviewer.models import Interviewer_Profile, InterviewerAvailability
from interview.models import InterviewSchedule, InterviewFeedbackReview
from feedback.models import Feedback
from common.models import Skill
from resume.models import Resume, ResumeAnalysis
from notifications.models import Notification
from coding.models import CodingQuestion, CodeSubmission

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
    InterviewFeedbackReviewAdminSerializer,
    CodingQuestionAdminSerializer,
    CodeSubmissionAdminSerializer,
)



class IsAdminOrSuperUser(BasePermission):
    """
    Custom permission to allow access only to authenticated users
    who have is_staff=True or is_superuser=True.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, "is_staff", False) or getattr(request.user, "is_superuser", False))
        )


def success(data, status_code=200):
    return Response({"success": True, "data": data}, status=status_code)


def error(message, status_code=400):
    return Response({"success": False, "message": message}, status=status_code)


# ─────────────────────────────────────────────────────────────
# Auth — Admin Login
# ─────────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return error("Email and password are required.", 400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return error("Invalid email or password.", 401)

    if not user.check_password(password):
        return error("Invalid email or password.", 401)

    if not user.is_active:
        return error("User account is inactive.", 403)

    if not (user.is_staff or user.is_superuser):
        return error("Access denied. Superuser or staff privileges required.", 403)

    refresh = RefreshToken.for_user(user)
    refresh["user_id"] = user.user_id
    refresh["email"] = user.email
    access_token = str(refresh.access_token)

    return success({
        "access_token": access_token,
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
@permission_classes([IsAdminOrSuperUser])
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
            "total_coding_submissions": CodeSubmission.objects.count(),
            "total_coding_questions": CodingQuestion.objects.count(),
        }
        return success(data)
    except Exception as exc:
        return error(str(exc), 500)


# ─────────────────────────────────────────────────────────────
# Cascading Delete Helpers
# ─────────────────────────────────────────────────────────────
def cascade_delete_candidate(cand):
    # 1. Delete associated interview schedules
    InterviewSchedule.objects.filter(candidate=cand).delete()

    # 2. Delete associated resumes and resume analyses
    resumes = Resume.objects.filter(candidate_id=cand.candidate_id)
    ResumeAnalysis.objects.filter(resume__in=resumes).delete()
    resumes.delete()

    # 3. Delete candidate profile
    cand.delete()


def cascade_delete_interviewer(inter):
    # 1. Delete associated availabilities
    InterviewerAvailability.objects.filter(interviewer=inter).delete()

    # 2. Delete associated interview schedules
    InterviewSchedule.objects.filter(interviewer=inter).delete()

    # 3. Delete interviewer profile
    inter.delete()


def cascade_delete_user(user):
    # 1. Candidate profile & dependents
    try:
        cand = Candidate_Profile.objects.get(user=user)
        cascade_delete_candidate(cand)
    except Candidate_Profile.DoesNotExist:
        pass

    # 2. Interviewer profile & dependents
    try:
        inter = Interviewer_Profile.objects.get(user=user)
        cascade_delete_interviewer(inter)
    except Interviewer_Profile.DoesNotExist:
        pass

    # 3. Notifications & OTPs
    Notification.objects.filter(user=user).delete()
    OtpVerification.objects.filter(user=user).delete()

    # 4. User record
    user.delete()


def cascade_delete_resume(resume):
    # Delete resume analysis dependent on this resume
    ResumeAnalysis.objects.filter(resume=resume).delete()
    resume.delete()


# ─────────────────────────────────────────────────────────────
# Generic CRUD Helper Functions
# ─────────────────────────────────────────────────────────────
def list_create(request, model, serializer_class, pk_field="pk"):
    if request.method == "GET":
        try:
            try:
                qs = model.objects.all().order_by(f"-{pk_field}")
            except Exception:
                qs = model.objects.all()
            ser = serializer_class(qs, many=True)
            return success(ser.data)
        except Exception as exc:
            return error(str(exc), 500)

    try:
        ser = serializer_class(data=request.data)
        if ser.is_valid():
            ser.save()
            return success(ser.data, 201)
        return Response({"success": False, "errors": ser.errors}, status=400)
    except Exception as exc:
        return error(str(exc), 400)


def retrieve_update_delete(request, model, serializer_class, pk):
    try:
        obj = model.objects.get(pk=pk)
    except model.DoesNotExist:
        return error("Record not found.", 404)

    if request.method == "GET":
        try:
            return success(serializer_class(obj).data)
        except Exception as exc:
            return error(str(exc), 500)

    if request.method in ("PUT", "PATCH"):
        partial = request.method == "PATCH"
        try:
            ser = serializer_class(obj, data=request.data, partial=partial)
            if ser.is_valid():
                ser.save()
                return success(ser.data)
            return Response({"success": False, "errors": ser.errors}, status=400)
        except Exception as exc:
            return error(str(exc), 400)

    # DELETE — with cascading deletion for dependent records
    try:
        if isinstance(obj, User):
            cascade_delete_user(obj)
        elif isinstance(obj, Candidate_Profile):
            cascade_delete_candidate(obj)
        elif isinstance(obj, Interviewer_Profile):
            cascade_delete_interviewer(obj)
        elif isinstance(obj, Resume):
            cascade_delete_resume(obj)
        else:
            obj.delete()
        return success({"detail": "Deleted successfully."})
    except Exception as exc:
        return error(str(exc), 400)


# ─────────────────────────────────────────────────────────────
# 1. Users
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def users_list(request):
    return list_create(request, User, UsersSerializer, "user_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def user_detail(request, pk):
    return retrieve_update_delete(request, User, UsersSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 2. Candidate Profiles
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def candidates_list(request):
    return list_create(request, Candidate_Profile, CandidateProfileSerializer, "candidate_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def candidate_detail(request, pk):
    return retrieve_update_delete(request, Candidate_Profile, CandidateProfileSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 3. Interviewer Profiles
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def interviewers_list(request):
    return list_create(request, Interviewer_Profile, InterviewerProfileSerializer, "interviewer_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def interviewer_detail(request, pk):
    return retrieve_update_delete(request, Interviewer_Profile, InterviewerProfileSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 4. Interviewer Availability
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def availabilities_list(request):
    return list_create(request, InterviewerAvailability, InterviewerAvailabilitySerializer, "availability_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def availability_detail(request, pk):
    return retrieve_update_delete(request, InterviewerAvailability, InterviewerAvailabilitySerializer, pk)


# ─────────────────────────────────────────────────────────────
# 5. Interview Schedules
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def interviews_list(request):
    return list_create(request, InterviewSchedule, InterviewScheduleSerializer, "schedule_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def interview_detail(request, pk):
    return retrieve_update_delete(request, InterviewSchedule, InterviewScheduleSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 6. Feedbacks
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def feedback_list(request):
    return list_create(request, Feedback, FeedbackSerializer, "feedback_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def feedback_detail(request, pk):
    return retrieve_update_delete(request, Feedback, FeedbackSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 7. Skills
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def skills_list(request):
    return list_create(request, Skill, SkillSerializer, "id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def skill_detail(request, pk):
    return retrieve_update_delete(request, Skill, SkillSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 8. Resumes
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def resumes_list(request):
    return list_create(request, Resume, ResumeSerializer, "resume_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def resume_detail(request, pk):
    return retrieve_update_delete(request, Resume, ResumeSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 9. Resume Analysis
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def resume_analysis_list(request):
    return list_create(request, ResumeAnalysis, ResumeAnalysisSerializer, "analysis_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def resume_analysis_detail(request, pk):
    return retrieve_update_delete(request, ResumeAnalysis, ResumeAnalysisSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 10. Notifications
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def notifications_list(request):
    return list_create(request, Notification, NotificationSerializer, "notification_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def notification_detail(request, pk):
    return retrieve_update_delete(request, Notification, NotificationSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 11. OTP Verification
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def otps_list(request):
    return list_create(request, OtpVerification, OtpVerificationSerializer, "otp_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def otp_detail(request, pk):
    return retrieve_update_delete(request, OtpVerification, OtpVerificationSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 12. Interview Feedback Reviews
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def interview_feedback_reviews_list(request):
    return list_create(request, InterviewFeedbackReview, InterviewFeedbackReviewAdminSerializer, "review_id")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def interview_feedback_review_detail(request, pk):
    return retrieve_update_delete(request, InterviewFeedbackReview, InterviewFeedbackReviewAdminSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 13. Coding Submissions
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def coding_submissions_list(request):
    return list_create(request, CodeSubmission, CodeSubmissionAdminSerializer, "-submitted_at")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def coding_submission_detail(request, pk):
    return retrieve_update_delete(request, CodeSubmission, CodeSubmissionAdminSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 14. Coding Questions
# ─────────────────────────────────────────────────────────────
@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def coding_questions_list(request):
    return list_create(request, CodingQuestion, CodingQuestionAdminSerializer, "-created_at")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def coding_question_detail(request, pk):
    return retrieve_update_delete(request, CodingQuestion, CodingQuestionAdminSerializer, pk)


# ─────────────────────────────────────────────────────────────
# 15. Quiz Performances
# ─────────────────────────────────────────────────────────────
from quiz.models import QuizPerformance
from .serializers import QuizPerformanceAdminSerializer

@api_view(["GET", "POST"])
@permission_classes([IsAdminOrSuperUser])
def quiz_performances_list(request):
    return list_create(request, QuizPerformance, QuizPerformanceAdminSerializer, "-created_at")


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([IsAdminOrSuperUser])
def quiz_performance_detail(request, pk):
    return retrieve_update_delete(request, QuizPerformance, QuizPerformanceAdminSerializer, pk)