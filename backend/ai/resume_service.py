"""Gemini integration for structured resume analysis."""

import json
import re

from .gemini_service import generate_content
from .prompts import resume_analysis_prompt


def analyze_resume(resume_text):
    """Analyze resume text and return the normalized JSON object from Gemini."""
    raw_result = generate_content(resume_analysis_prompt(resume_text))

    if not isinstance(raw_result, str):
        raise ValueError("Gemini returned an invalid resume-analysis response.")

    cleaned_result = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_result.strip(), flags=re.IGNORECASE)
    result = json.loads(cleaned_result)

    if not isinstance(result, dict):
        raise ValueError("Gemini returned a resume analysis in an invalid format.")

    return result
