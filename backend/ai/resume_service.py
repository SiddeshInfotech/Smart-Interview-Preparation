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

    cleaned_result = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_result.strip(), flags=re.IGNORECASE).strip()

    # Extract JSON object using regex if extraneous text or markdown remains
    if not (cleaned_result.startswith("{") and cleaned_result.endswith("}")):
        match = re.search(r"\{.*\}", cleaned_result, flags=re.DOTALL)
        if match:
            cleaned_result = match.group(0)

    try:
        result = json.loads(cleaned_result)
    except Exception as exc:
        raise ValueError(f"Failed to parse Gemini resume response as JSON: {exc}")

    if not isinstance(result, dict):
        raise ValueError("Gemini returned a resume analysis in an invalid format.")

    return result
