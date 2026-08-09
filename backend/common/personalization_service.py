"""
Personalization Engine Service.
Aggregates candidate context (career domain, profile, optional resume analysis, course progress, and quiz/coding performance history)
and calculates automatic internal difficulty level.
"""

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Standard career domains supported by the platform
CAREER_DOMAINS = [
    "Web Development",
    "Mobile Development",
    "Data Science / Analytics",
    "Cybersecurity",
    "Game Development",
    "Software Testing / QA",
    "UI/UX / HCI",
]


def get_candidate_personalization_context(user) -> Dict[str, Any]:
    """
    Retrieve aggregated candidate personalization context across profile, resume,
    quiz performance, and coding performance.
    """
    context = {
        "domain": "Web Development",
        "experience_years": 0.0,
        "education": "",
        "profile_skills": [],
        "resume_available": False,
        "resume_skills": [],
        "resume_role": "",
        "resume_summary": "",
        "quiz_avg_score": 0.0,
        "quiz_total_count": 0,
        "coding_avg_score": 0.0,
        "coding_total_count": 0,
        "calculated_difficulty": "Medium",
    }

    if not user or not user.is_authenticated:
        return context

    # 1. Candidate Profile Data
    try:
        from candidate.models import Candidate_Profile
        profile = Candidate_Profile.objects.filter(user=user).first()
        if profile:
            if profile.target_domain and profile.target_domain.strip():
                context["domain"] = profile.target_domain.strip()

            context["experience_years"] = float(profile.experience_years or 0.0)
            context["education"] = profile.education or ""

            if profile.skills:
                skills_list = [s.strip() for s in profile.skills.split(",") if s.strip()]
                context["profile_skills"] = skills_list
    except Exception as e:
        logger.warning(f"Error fetching candidate profile context: {e}")

    # 2. Resume Data (Optional)
    try:
        from candidate.models import Candidate_Profile
        from resume.models import Resume
        profile = Candidate_Profile.objects.filter(user=user).first()
        candidate_id = profile.candidate_id if profile else None

        if candidate_id:
            latest_resume = Resume.objects.filter(candidate_id=candidate_id, status="analyzed").order_by("-uploaded_at").first()
            if latest_resume and hasattr(latest_resume, "resumeanalysis"):
                analysis = latest_resume.resumeanalysis
                context["resume_available"] = True
                context["resume_role"] = analysis.role or ""
                context["resume_summary"] = analysis.summary or ""

                if analysis.extracted_skills:
                    res_skills = [s.strip() for s in analysis.extracted_skills.split(",") if s.strip()]
                    context["resume_skills"] = res_skills
    except Exception as e:
        logger.warning(f"Error fetching resume context: {e}")

    # 3. Quiz Performance Summary
    try:
        from quiz.models import QuizPerformance
        quizzes = QuizPerformance.objects.filter(user=user)
        total_quizzes = quizzes.count()
        if total_quizzes > 0:
            avg_quiz = sum(q.score for q in quizzes) / total_quizzes
            context["quiz_avg_score"] = round(avg_quiz, 1)
            context["quiz_total_count"] = total_quizzes
    except Exception as e:
        logger.warning(f"Error fetching quiz performance: {e}")

    # 4. Coding Performance Summary
    try:
        from coding.models import CodeSubmission
        submissions = CodeSubmission.objects.filter(user=user)
        total_coding = submissions.count()
        if total_coding > 0:
            avg_coding = sum(s.score for s in submissions) / total_coding
            context["coding_avg_score"] = round(avg_coding, 1)
            context["coding_total_count"] = total_coding
    except Exception as e:
        logger.warning(f"Error fetching coding performance: {e}")

    # 5. Automatic Internal Difficulty Determination
    context["calculated_difficulty"] = calculate_internal_difficulty(context)

    return context


def calculate_internal_difficulty(context: Dict[str, Any]) -> str:
    """
    Automatically calculate internal difficulty level (Easy, Medium, Hard)
    based on experience years and previous quiz/coding performance.
    """
    exp = context.get("experience_years", 0.0)
    quiz_score = context.get("quiz_avg_score", 0.0)
    coding_score = context.get("coding_avg_score", 0.0)
    quiz_count = context.get("quiz_total_count", 0)
    coding_count = context.get("coding_total_count", 0)

    perf_scores = []
    if quiz_count > 0:
        perf_scores.append(quiz_score)
    if coding_count > 0:
        perf_scores.append(coding_score)

    avg_perf = sum(perf_scores) / len(perf_scores) if perf_scores else None

    if avg_perf is not None:
        if avg_perf >= 78.0 and exp >= 2.0:
            return "Hard"
        elif avg_perf < 50.0 or (exp < 1.0 and avg_perf < 60.0):
            return "Easy"
        else:
            return "Medium"
    else:
        if exp >= 3.0:
            return "Hard"
        elif exp < 1.0:
            return "Easy"
        else:
            return "Medium"
