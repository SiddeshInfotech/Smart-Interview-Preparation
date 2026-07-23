from django.urls import path
from . import views

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────
    path("login/",                          views.admin_login,              name="admin_login"),
    path("stats/",                          views.admin_stats,              name="admin_stats"),

    # ── Users ────────────────────────────────────────────────
    path("users/",                          views.users_list,               name="admin_users_list"),
    path("users/<int:pk>/",                 views.user_detail,              name="admin_user_detail"),

    # ── Candidate Profiles ───────────────────────────────────
    path("candidate-profiles/",             views.candidates_list,          name="admin_candidates_list"),
    path("candidate-profiles/<int:pk>/",    views.candidate_detail,         name="admin_candidate_detail"),

    # ── Interviewer Profiles ─────────────────────────────────
    path("interviewer-profiles/",           views.interviewers_list,        name="admin_interviewers_list"),
    path("interviewer-profiles/<int:pk>/",  views.interviewer_detail,       name="admin_interviewer_detail"),

    # ── Question Bank ────────────────────────────────────────
    path("questions/",                      views.questions_list,           name="admin_questions_list"),
    path("questions/<int:pk>/",             views.question_detail,          name="admin_question_detail"),

    # ── Interview Schedules ──────────────────────────────────
    path("interviews/",                     views.interviews_list,          name="admin_interviews_list"),
    path("interviews/<int:pk>/",            views.interview_detail,         name="admin_interview_detail"),

    # ── Interview Sessions ───────────────────────────────────
    path("sessions/",                       views.sessions_list,            name="admin_sessions_list"),
    path("sessions/<int:pk>/",              views.session_detail,           name="admin_session_detail"),

    # ── Interview Feedback ───────────────────────────────────
    path("feedback/",                       views.feedback_list,            name="admin_feedback_list"),
    path("feedback/<int:pk>/",              views.feedback_detail,          name="admin_feedback_detail"),

    # ── Performance Analytics ────────────────────────────────
    path("analytics/",                      views.analytics_list,           name="admin_analytics_list"),
    path("analytics/<int:pk>/",             views.analytics_detail,         name="admin_analytics_detail"),

    # ── Resumes ──────────────────────────────────────────────
    path("resumes/",                        views.resumes_list,             name="admin_resumes_list"),
    path("resumes/<int:pk>/",               views.resume_detail,            name="admin_resume_detail"),

    # ── Resume Analysis ──────────────────────────────────────
    path("resume-analysis/",                views.resume_analysis_list,     name="admin_resume_analysis_list"),
    path("resume-analysis/<int:pk>/",       views.resume_analysis_detail,   name="admin_resume_analysis_detail"),

    # ── Session Questions ────────────────────────────────────
    path("session-questions/",              views.session_questions_list,   name="admin_session_questions_list"),
    path("session-questions/<int:pk>/",     views.session_question_detail,  name="admin_session_question_detail"),

    # ── Coding Submissions ───────────────────────────────────
    path("submissions/",                    views.submissions_list,         name="admin_submissions_list"),
    path("submissions/<int:pk>/",           views.submission_detail,        name="admin_submission_detail"),

    # ── Notifications ────────────────────────────────────────
    path("notifications/",                  views.notifications_list,       name="admin_notifications_list"),
    path("notifications/<int:pk>/",         views.notification_detail,      name="admin_notification_detail"),

    # ── OTP Verification ─────────────────────────────────────
    path("otps/",                           views.otps_list,                name="admin_otps_list"),
    path("otps/<int:pk>/",                  views.otp_detail,               name="admin_otp_detail"),
]