"""OpenRouter integration for adaptive quiz generation."""

import json
from typing import List, Dict, Any
from .openrouter_service import openrouter_service
from .prompts import quiz_generation_prompt


def generate_quiz_questions(
    topics: List[str],
    difficulty: str = "Medium",
    count: int = 10,
    mode: str = "MCQ",
    custom_instruction: str = ""
) -> List[Dict[str, Any]]:
    """
    Generate quiz questions using OpenRouter AI service.

    Args:
        topics: List of topic strings.
        difficulty: 'Easy', 'Medium', 'Hard'.
        count: Number of questions to generate.
        mode: 'MCQ', 'Coding Challenge', 'Mock Interview'.
        custom_instruction: Additional user prompt instructions.

    Returns:
        List[Dict[str, Any]]: List of question objects with text, options, correct index, hint, and explanation.
    """
    prompt = quiz_generation_prompt(
        topics=topics,
        difficulty=difficulty,
        count=count,
        mode=mode,
        custom_instruction=custom_instruction
    )

    raw_text = openrouter_service.chat(
        prompt=prompt,
        feature="quiz",
        temperature=0.7,
        max_tokens=3000,
        expect_json=True
    )

    cleaned_text = openrouter_service.clean_json_string(raw_text)

    try:
        questions = json.loads(cleaned_text)
    except Exception as exc:
        raise ValueError(f"Failed to parse OpenRouter quiz response as JSON: {exc}")

    if not isinstance(questions, list):
        raise ValueError("OpenRouter returned quiz questions in an invalid non-list format.")

    return questions
