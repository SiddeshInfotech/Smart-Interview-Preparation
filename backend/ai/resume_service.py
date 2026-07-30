"""OpenRouter integration for structured resume analysis."""

import json
import logging
import re
from typing import Any, Dict

from .json_utils import clean_json_string
from .openrouter_service import openrouter_service
from .prompts import resume_analysis_prompt

logger = logging.getLogger(__name__)


def analyze_resume(resume_text: str) -> Dict[str, Any]:
    """
    Analyze resume text using OpenRouter AI service and return normalized dictionary.
    Guarantees compatibility with ResumeUpload.jsx frontend fields and backend ResumeAnalysis model.

    Args:
        resume_text: Extracted plain text from candidate resume file.

    Returns:
        dict: Parsed and normalized evaluation dictionary.
    """
    prompt = resume_analysis_prompt(resume_text)
    raw_result = openrouter_service.chat(
        prompt=prompt,
        feature="resume",
        temperature=0.3,
        max_tokens=2500,
        expect_json=True,
    )

    cleaned_result = clean_json_string(raw_result)

    try:
        parsed = json.loads(cleaned_result)
    except Exception as exc:
        logger.error(f"[ResumeService] JSON parse error: {exc}. Raw length: {len(raw_result)}")
        raise ValueError(f"Failed to parse OpenRouter resume analysis output as JSON: {exc}")

    if not isinstance(parsed, dict):
        raise ValueError("OpenRouter returned a resume analysis in an invalid dictionary format.")

    # Unwrap if nested under candidate, resume, analysis, result, or data
    for wrapper in ("data", "resume", "analysis", "candidate", "result"):
        if wrapper in parsed and isinstance(parsed[wrapper], dict):
            parsed = parsed[wrapper]
            break

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
