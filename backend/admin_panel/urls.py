from django.urls import path
from . import views

urlpatterns = [
    # ── Auth & Dashboard ──────────────────────────────────────
    path("login/",                      views.admin_login,          name="admin_login"),
    path("stats/",                      views.admin_stats,          name="admin_stats"),

    # ── 1. Users ──────────────────────────────────────────────
    path("users/",                      views.users_list,           name="admin_users_list"),
    path("users/<int:pk>/",             views.user_detail,          name="admin_user_detail"),

    # ── 2. Candidate Profiles ─────────────────────────────────
    path("candidate-profiles/",         views.candidates_list,      name="admin_candidates_list"),
    path("candidate-profiles/<int:pk>/",views.candidate_detail,     name="admin_candidate_detail"),

    # ── 3. Interviewer Profiles ───────────────────────────────
    path("interviewer-profiles/",       views.interviewers_list,    name="admin_interviewers_list"),
    path("interviewer-profiles/<int:pk>/", views.interviewer_detail, name="admin_interviewer_detail"),

    # ── 4. Interviewer Availability ───────────────────────────
    path("availabilities/",             views.availabilities_list,  name="admin_availabilities_list"),
    path("availabilities/<int:pk>/",    views.availability_detail,  name="admin_availability_detail"),

    # ── 5. Interview Schedules ────────────────────────────────
    path("interviews/",                 views.interviews_list,      name="admin_interviews_list"),
    path("interviews/<int:pk>/",        views.interview_detail,     name="admin_interview_detail"),

    # ── 6. Feedback ───────────────────────────────────────────
    path("feedback/",                   views.feedback_list,        name="admin_feedback_list"),
    path("feedback/<int:pk>/",          views.feedback_detail,      name="admin_feedback_detail"),

    # ── 7. Skills ─────────────────────────────────────────────
    path("skills/",                     views.skills_list,          name="admin_skills_list"),
    path("skills/<int:pk>/",            views.skill_detail,         name="admin_skill_detail"),

    # ── 8. Resumes ────────────────────────────────────────────
    path("resumes/",                    views.resumes_list,         name="admin_resumes_list"),
    path("resumes/<int:pk>/",           views.resume_detail,        name="admin_resume_detail"),

    # ── 9. Resume Analysis ────────────────────────────────────
    path("resume-analysis/",            views.resume_analysis_list, name="admin_resume_analysis_list"),
    path("resume-analysis/<int:pk>/",   views.resume_analysis_detail, name="admin_resume_analysis_detail"),

    # ── 10. Notifications ─────────────────────────────────────
    path("notifications/",              views.notifications_list,   name="admin_notifications_list"),
    path("notifications/<int:pk>/",     views.notification_detail,  name="admin_notification_detail"),

    # ── 11. OTP Verification ──────────────────────────────────
    path("otps/",                       views.otps_list,            name="admin_otps_list"),
    path("otps/<int:pk>/",              views.otp_detail,           name="admin_otp_detail"),

    # ── 12. Interview Feedback Reviews ────────────────────────
    path("interview-feedback-reviews/",         views.interview_feedback_reviews_list,   name="admin_interview_feedback_reviews_list"),
    path("interview-feedback-reviews/<int:pk>/",views.interview_feedback_review_detail, name="admin_interview_feedback_review_detail"),

    # ── 13. Coding Submissions ─────────────────────────────────
    path("coding-submissions/",                 views.coding_submissions_list,   name="admin_coding_submissions_list"),
    path("coding-submissions/<int:pk>/",        views.coding_submission_detail,  name="admin_coding_submission_detail"),

    # ── 14. Coding Questions ───────────────────────────────────
    path("coding-questions/",                   views.coding_questions_list,     name="admin_coding_questions_list"),
    path("coding-questions/<int:pk>/",          views.coding_question_detail,    name="admin_coding_question_detail"),

    # ── 15. Quiz Performances ─────────────────────────────────
    path("quiz-performances/",                  views.quiz_performances_list,    name="admin_quiz_performances_list"),
    path("quiz-performances/<int:pk>/",         views.quiz_performance_detail,   name="admin_quiz_performance_detail"),
]