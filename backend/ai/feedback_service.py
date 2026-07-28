"""OpenRouter integration for AI interview feedback and competency evaluation."""

import json
from typing import Dict, Any
from .openrouter_service import openrouter_service


def generate_interview_feedback(
    interview_type: str,
    candidate_name: str,
    responses_summary: str,
    target_role: str = "Software Engineer"
) -> Dict[str, Any]:
    """
    Generate multidimensional interview feedback and ratings using OpenRouter AI.
    """
    prompt = f"""
    Role: Senior Technical Lead & Hiring Manager.

    Task:
    Evaluate candidate interview performance for the target role: {target_role}.

    Interview Type: {interview_type}
    Candidate Name: {candidate_name}

    Candidate Performance Summary:
    {responses_summary}

    Output Format (JSON Object ONLY):
    {{
      "overall_score": 85,
      "technical_competency": 88,
      "communication_skills": 82,
      "problem_solving": 86,
      "summary": "Clear and detailed assessment summary of candidate performance.",
      "strengths": ["Key strength 1", "Key strength 2"],
      "areas_for_improvement": ["Improvement area 1", "Improvement area 2"]
    }}
    """

    raw_text = openrouter_service.chat(
        prompt=prompt,
        feature="feedback",
        temperature=0.5,
        max_tokens=2500,
        expect_json=True
    )

    cleaned_text = openrouter_service.clean_json_string(raw_text)
    return json.loads(cleaned_text)
