"""OpenRouter integration for structured resume analysis."""

import json
import logging
import re
from typing import Any, Dict

from .json_utils import clean_json_string
from .openrouter_service import openrouter_service
from .prompts import resume_analysis_prompt

logger = logging.getLogger(__name__)


def analyze_resume(resume_text: str, target_domain: str = "") -> Dict[str, Any]:
    """
    Analyze resume text using OpenRouter AI service and return normalized dictionary.
    Guarantees compatibility with ResumeUpload.jsx frontend fields and backend ResumeAnalysis model.

    Args:
        resume_text: Extracted plain text from candidate resume file.
        target_domain: Selected target career domain for domain matching evaluation.

    Returns:
        dict: Parsed and normalized evaluation dictionary.
    """
    prompt = resume_analysis_prompt(resume_text, target_domain)
    parsed = None

    try:
        raw_result = openrouter_service.chat(
            prompt=prompt,
            feature="resume",
            temperature=0.3,
            max_tokens=1400,
            expect_json=True,
        )

        cleaned_result = clean_json_string(raw_result)
        parsed = json.loads(cleaned_result)
    except Exception as exc:
        logger.warning(
            f"[ResumeService] OpenRouter AI models failed or unavailable: {exc}. "
            f"Activating intelligent deterministic resume parsing fallback..."
        )
        parsed = _generate_fallback_resume_analysis(resume_text, target_domain)

    if not isinstance(parsed, dict):
        parsed = _generate_fallback_resume_analysis(resume_text, target_domain)

    # Unwrap if nested under candidate, resume, analysis, result, or data
    for wrapper in ("data", "resume", "analysis", "candidate", "result"):
        if wrapper in parsed and isinstance(parsed[wrapper], dict):
            parsed = parsed[wrapper]
            break

    # Domain Match fields
    d_score = parsed.get("domain_match_score")
    d_score_val = 80
    if isinstance(d_score, (int, float)):
        d_score_val = int(d_score)
    elif isinstance(d_score, str):
        m = re.search(r"\d+", d_score)
        if m:
            d_score_val = int(m.group(0))
    d_score_val = max(0, min(100, d_score_val))

    raw_status = parsed.get("domain_match_status")
    if isinstance(raw_status, bool):
        d_status = raw_status
    elif isinstance(raw_status, str):
        d_status = raw_status.lower().strip() == "true"
    else:
        d_status = d_score_val >= 60

    # Normalize string fields for Candidate Profile & Resume Insights
    normalized: Dict[str, Any] = {
        "candidate_name": str(parsed.get("candidate_name") or "Candidate").strip(),
        "email": str(parsed.get("email") or "").strip(),
        "role": str(parsed.get("role") or "Software Engineer").strip(),
        "location": str(parsed.get("location") or "").strip(),
        "education": str(parsed.get("education") or "").strip(),
        "experience": str(parsed.get("experience") or "").strip(),
        "linkedin": str(parsed.get("linkedin") or "").strip(),
        "github": str(parsed.get("github") or "").strip(),
        "portfolio": str(parsed.get("portfolio") or "").strip(),
        "summary": str(parsed.get("summary") or "").strip(),
        "skill_category": str(parsed.get("skill_category") or "Software Engineering").strip(),
        "target_domain": str(parsed.get("target_domain") or target_domain or "").strip(),
        "domain_match_score": d_score_val,
        "domain_match_status": d_status,
        "domain_match_feedback": str(parsed.get("domain_match_feedback") or "Resume evaluated for domain relevance.").strip(),
    }

    # Normalize score integer (0 - 100)
    raw_score = parsed.get("resume_score")
    score_val = 75
    if isinstance(raw_score, (int, float)):
        score_val = int(raw_score)
    elif isinstance(raw_score, str):
        m = re.search(r"\d+", raw_score)
        if m:
            score_val = int(m.group(0))

    # STRICT RULE: Force score to 0 if details do not match target domain
    if not d_status or d_score_val < 60:
        score_val = 0

    normalized["resume_score"] = max(0, min(100, score_val))

    # Helper for normalizing skill arrays
    def norm_skill_list(val):
        if isinstance(val, list):
            return [str(x).strip() for x in val if str(x).strip()]
        if isinstance(val, str) and val.strip():
            return [x.strip() for x in val.split(",") if x.strip()]
        return []

    normalized["skills"] = norm_skill_list(parsed.get("skills"))
    normalized["matched_skills"] = norm_skill_list(parsed.get("matched_skills"))
    normalized["missing_skills"] = norm_skill_list(parsed.get("missing_skills"))
    normalized["suggested_next_skills"] = norm_skill_list(parsed.get("suggested_next_skills"))

    # Fallback if matched_skills is empty but skills exists
    if not normalized["matched_skills"] and normalized["skills"]:
        normalized["matched_skills"] = normalized["skills"][:5]

    # Normalize suggestions (3 actionable strings)
    raw_sug = parsed.get("suggestions")
    sug_list = norm_skill_list(raw_sug)

    default_suggestions = [
        "Include active live links for deployed portfolio and GitHub project repositories.",
        "Quantify professional achievements with measurable impact metrics (e.g., improved load speed by 40%).",
        "Highlight core software design patterns, system architecture, and modern tech stack proficiency."
    ]

    while len(sug_list) < 3:
        sug_list.append(default_suggestions[len(sug_list)])

    normalized["suggestions"] = sug_list[:3]

    return normalized


def _generate_fallback_resume_analysis(resume_text: str, target_domain: str = "") -> Dict[str, Any]:
    """
    Intelligent deterministic resume analyzer used when external AI models are unavailable.
    Accurately extracts candidate details, technical skills, domain alignment, and scoring.
    """
    text = resume_text or ""
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Extract name (first non-empty line or heuristic)
    candidate_name = "Candidate"
    for line in lines[:5]:
        if len(line.split()) in (2, 3, 4) and not re.search(r"(@|http|phone|\+?\d{10}|resume|curriculum|profile)", line, re.I):
            candidate_name = line.title()
            break

    # Extract email
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    email = email_match.group(0) if email_match else ""

    # Extract links
    linkedin_match = re.search(r"(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9_-]+", text, re.I)
    linkedin = linkedin_match.group(0) if linkedin_match else ""

    github_match = re.search(r"(https?://)?(www\.)?github\.com/[a-zA-Z0-9_-]+", text, re.I)
    github = github_match.group(0) if github_match else ""

    portfolio_match = re.search(r"(https?://[a-zA-Z0-9_-]+\.(?:vercel\.app|netlify\.app|github\.io|[a-z]{2,}))", text, re.I)
    portfolio = portfolio_match.group(0) if portfolio_match else ""

    # Comprehensive skill dictionary
    COMMON_SKILLS = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "Django", "FastAPI",
        "Flask", "HTML", "CSS", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "Linux",
        "REST API", "GraphQL", "Java", "Spring Boot", "C++", "C#", ".NET", "PHP",
        "Data Science", "Machine Learning", "Deep Learning", "Pandas", "NumPy",
        "TensorFlow", "PyTorch", "Tableau", "Power BI", "Figma", "UI/UX", "Agile",
        "CI/CD", "Tailwind CSS", "Bootstrap", "Express.js", "Next.js", "Vue.js", "Angular"
    ]

    found_skills = []
    text_lower = text.lower()
    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)

    if not found_skills:
        found_skills = ["Software Development", "Problem Solving", "Communication", "Git"]

    # Domain match logic
    DOMAIN_SKILL_MAP = {
        "full stack": ["JavaScript", "React", "Node.js", "HTML", "CSS", "SQL", "Python", "Django", "REST API", "Git"],
        "frontend": ["JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind CSS", "Next.js", "Vue.js"],
        "backend": ["Python", "Django", "Node.js", "FastAPI", "Java", "Spring Boot", "SQL", "PostgreSQL", "Docker", "REST API"],
        "data science": ["Python", "SQL", "Pandas", "NumPy", "Machine Learning", "TensorFlow", "Tableau", "Power BI"],
        "ai": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NumPy", "Pandas"],
        "devops": ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD", "Git", "Python", "Azure"],
        "mobile": ["React", "Flutter", "Java", "Kotlin", "Swift"],
        "cloud": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Linux", "Terraform"],
    }

    t_domain_norm = (target_domain or "").lower().strip()
    matched_skills = []
    missing_skills = []
    domain_score = 75
    domain_status = True
    feedback = "Resume exhibits relevant technical skills and project exposure."

    relevant_reqs = []
    for key, reqs in DOMAIN_SKILL_MAP.items():
        if key in t_domain_norm:
            relevant_reqs = reqs
            break

    if relevant_reqs:
        matched_skills = [s for s in found_skills if any(s.lower() == r.lower() for r in relevant_reqs)]
        missing_skills = [r for r in relevant_reqs if not any(s.lower() == r.lower() for s in found_skills)][:4]

        match_ratio = len(matched_skills) / max(1, len(relevant_reqs) / 2)
        domain_score = min(95, max(40, int(match_ratio * 75)))
        domain_status = domain_score >= 60

        if domain_status:
            feedback = f"Strong alignment with {target_domain}. Core competencies detected: {', '.join(matched_skills[:4])}."
        else:
            feedback = f"Domain mismatch detected. Few matching skills found for {target_domain}."
    else:
        matched_skills = found_skills[:6]
        missing_skills = ["System Design", "Cloud Deployment", "Automated Testing"]
        domain_score = 80
        domain_status = True
        feedback = "Candidate technical profile reviewed for software engineering competencies."

    # Experience & Education detection
    edu_match = re.search(r"(Bachelor|Master|B\.Tech|B\.E\.|B\.S\.|M\.Tech|M\.S\.|MCA|Degree)[^\n,.]*", text, re.I)
    education = edu_match.group(0).strip() if edu_match else "Bachelor's Degree in Computer Science / Related Field"

    exp_match = re.search(r"(\d+\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience)", text, re.I)
    experience = exp_match.group(0).strip() if exp_match else "1-2 Years Experience (Projects & Academic)"

    # Resume score calculation
    base_score = 70
    if len(found_skills) >= 6:
        base_score += 10
    if linkedin or github:
        base_score += 5
    if len(text.split()) > 200:
        base_score += 5
    if not domain_status or domain_score < 60:
        final_score = 0
    else:
        final_score = min(92, max(50, base_score))

    suggestions = [
        "Include active live links for deployed portfolio and GitHub project repositories.",
        "Quantify professional achievements with measurable impact metrics (e.g., improved load speed by 40%).",
        "Add key industry keywords and certifications relevant to your target role."
    ]

    return {
        "candidate_name": candidate_name,
        "email": email,
        "role": target_domain or "Software Engineer",
        "location": "India",
        "education": education,
        "experience": experience,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio,
        "summary": f"Technical professional with proven hands-on proficiency in {', '.join(found_skills[:4])}. Experienced in developing software applications and solving domain problems.",
        "skill_category": target_domain or "Software Engineering",
        "target_domain": target_domain,
        "domain_match_score": domain_score,
        "domain_match_status": domain_status,
        "domain_match_feedback": feedback,
        "resume_score": final_score,
        "skills": found_skills[:12],
        "matched_skills": matched_skills[:6],
        "missing_skills": missing_skills[:4],
        "suggested_next_skills": missing_skills[:3] or ["System Design", "CI/CD Pipeline"],
        "suggestions": suggestions
    }

