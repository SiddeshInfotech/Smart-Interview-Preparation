"""OpenRouter integration for structured resume analysis."""

import json
from .openrouter_service import openrouter_service
from .prompts import resume_analysis_prompt


def analyze_resume(resume_text: str) -> dict:
    """
    Analyze resume text using OpenRouter AI service and return normalized dictionary.

    Args:
        resume_text: Extracted plain text from candidate resume file.

    Returns:
        dict: Parsed JSON evaluation containing skills, experience, score, and recommendations.
    """
    prompt = resume_analysis_prompt(resume_text)
    raw_result = openrouter_service.chat(
        prompt=prompt,
        feature="resume",
        temperature=0.3,
        max_tokens=2500,
        expect_json=True,
    )

    cleaned_result = openrouter_service.clean_json_string(raw_result)

    try:
        result = json.loads(cleaned_result)
    except Exception as exc:
        raise ValueError(f"Failed to parse OpenRouter resume analysis output as JSON: {exc}")

    if not isinstance(result, dict):
        raise ValueError("OpenRouter returned a resume analysis in an invalid dictionary format.")

    return result
