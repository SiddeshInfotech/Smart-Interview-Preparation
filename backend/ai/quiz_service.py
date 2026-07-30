"""OpenRouter integration for adaptive quiz generation."""

import json
import logging
from typing import List, Dict, Any

from .openrouter_service import openrouter_service
from .prompts import quiz_generation_prompt

logger = logging.getLogger(__name__)


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
        difficulty: Easy, Medium, Hard.
        count: Number of questions.
        mode: MCQ / Coding Challenge / Mock Interview.
        custom_instruction: Additional prompt.

    Returns:
        List of quiz question dictionaries.
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
        temperature=0.3,
        max_tokens=1200,
        expect_json=True
    )

    logger.info("=" * 80)
    logger.info("RAW OPENROUTER RESPONSE:")
    logger.info(raw_text)
    logger.info("=" * 80)

    cleaned_text = openrouter_service.clean_json_string(raw_text)

    logger.info("CLEANED RESPONSE:")
    logger.info(cleaned_text)

    try:
        parsed = json.loads(cleaned_text)
    except Exception as exc:
        logger.exception("Failed to parse OpenRouter JSON.")
        raise ValueError(
            f"Failed to parse OpenRouter quiz response as JSON: {exc}\n\n"
            f"Raw Response:\n{raw_text}"
        )

    # -------------------------------
    # Accept multiple response formats
    # -------------------------------

    questions = None

    # Format 1:
    # [
    #   {...},
    #   {...}
    # ]
    if isinstance(parsed, list):
        questions = parsed

    # Format 2:
    # {
    #   "questions":[...]
    # }
    elif isinstance(parsed, dict):

        for key in (
            "questions",
            "quiz",
            "items",
            "data",
            "results",
        ):
            value = parsed.get(key)

            if isinstance(value, list):
                questions = value
                break

    if questions is None:
        logger.error(
            "Unexpected OpenRouter response format.\nParsed object:\n%s",
            json.dumps(parsed, indent=2)
        )

        raise ValueError(
            "OpenRouter returned quiz questions in an unsupported JSON format."
        )

    # -------------------------------
    # Validate every question
    # -------------------------------

    validated_questions = []

    for index, question in enumerate(questions, start=1):

        if not isinstance(question, dict):
            logger.warning(
                f"Skipping question #{index}: Expected object but got {type(question).__name__}"
            )
            continue

        validated_questions.append({
            "question": question.get("question", ""),
            "options": question.get("options", []),
            "correct_answer": question.get(
                "correct_answer",
                question.get("correctIndex", 0)
            ),
            "hint": question.get("hint", ""),
            "explanation": question.get("explanation", "")
        })

    if not validated_questions:
        raise ValueError(
            "OpenRouter did not return any valid quiz questions."
        )

    logger.info(
        "Successfully parsed %d quiz questions.",
        len(validated_questions)
    )

    return validated_questions